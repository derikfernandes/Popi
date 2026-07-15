import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize GoogleGenAI client lazily to avoid startup crashes if missing key
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to your secrets/variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Utility to replace placeholders in dynamic prompt templates
function renderPrompt(template: string, values: Record<string, any>): string {
  let result = template;
  for (const [key, val] of Object.entries(values)) {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const placeholder = new RegExp(`\\{\\{${escapedKey}\\}\\}`, "g");
    const replacement = typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);
    result = result.replace(placeholder, replacement);
  }
  return result;
}

// Helper function to obtain a Google OAuth access token using the refresh token for Vertex AI calls
async function getVertexAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Credenciais do Vertex AI OAuth não estão totalmente configuradas (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN).");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Falha ao obter token de acesso do Google OAuth: ${errorText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Helper to determine Vertex AI models to attempt, strictly using Vertex AI model from secrets (process.env.VERTEX_MODEL)
function getVertexModelsToTry(): string[] {
  const envModel = process.env.VERTEX_MODEL?.trim();
  if (!envModel) {
    throw new Error("A variável de ambiente VERTEX_MODEL não está configurada nos segredos do projeto.");
  }
  return [envModel];
}

// Call Vertex AI using REST API
async function callVertexAI(
  model: string,
  params: {
    contents: any;
    config?: any;
  }
): Promise<any> {
  const projectId = (process.env.VERTEX_PROJECT_ID || "crias-mvp").trim();
  const location = (process.env.VERTEX_LOCATION || "us-central1").trim();
  const accessToken = await getVertexAccessToken();

  const payload: any = {
    contents: typeof params.contents === "string" 
      ? [{ role: "user", parts: [{ text: params.contents }] }] 
      : params.contents,
  };

  if (params.config) {
    payload.generationConfig = {};
    if (params.config.responseMimeType) {
      payload.generationConfig.responseMimeType = params.config.responseMimeType;
    }
    if (params.config.responseSchema) {
      payload.generationConfig.responseSchema = params.config.responseSchema;
    }
    if (params.config.temperature !== undefined) {
      payload.generationConfig.temperature = params.config.temperature;
    }
  }

  // Dual API version support: fallback between v1 and v1beta1 endpoints
  const apiVersions = ["v1", "v1beta1"];
  let lastErrorText = "";
  let lastStatus = 200;
  let response: any = null;

  for (const apiVersion of apiVersions) {
    const url = `https://${location}-aiplatform.googleapis.com/${apiVersion}/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
    
    try {
      console.log(`Sending Vertex AI request using version ${apiVersion} for model ${model}...`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        response = res;
        break; // Successfully got response
      } else {
        lastStatus = res.status;
        lastErrorText = await res.text();
        console.warn(`Vertex AI apiVersion ${apiVersion} returned status ${lastStatus}: ${lastErrorText}`);
      }
    } catch (err: any) {
      lastStatus = 500;
      lastErrorText = err?.message || String(err);
      console.error(`Fetch exception for Vertex version ${apiVersion}:`, err);
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Vertex AI REST API error (${lastStatus}): ${lastErrorText || "Internal/Unknown network error"}`);
  }

  const data = await response.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text === undefined) {
    throw new Error("Resposta do Vertex AI não conteve texto válido nos parts.");
  }

  return { text };
}

// Helper function to call generateContent with retry and model fallback specifically for 503/transient errors
async function generateContentWithFallback(
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3
): Promise<any> {
  const isVertexConfigured = !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );

  if (isVertexConfigured) {
    const vertexModels = getVertexModelsToTry();
    console.log(`Vertex AI is configured! Attempting Vertex REST calls with model: ${vertexModels.join(", ")}...`);
    let lastVertexError: any = null;

    for (const currentModel of vertexModels) {
      let delay = 1000;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Calling Vertex AI using model: '${currentModel}' (attempt ${attempt}/${maxRetries})...`);
          const response = await callVertexAI(currentModel, params);
          return response;
        } catch (err: any) {
          lastVertexError = err;
          console.warn(
            `Vertex Exception on model '${currentModel}' (attempt ${attempt}/${maxRetries}):`,
            err?.message || JSON.stringify(err)
          );
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      }
    }
    
    console.warn("All Vertex AI models failed. Falling back to default Google AI SDK...");
  }

  // Fallback to default Google AI SDK with normal API Key
  const modelsToTry = Array.from(new Set([params.model, "gemini-3.1-flash-lite", "gemini-flash-latest"]));
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Calling Gemini API via SDK using model: '${currentModel}' (attempt ${attempt}/${maxRetries})...`);
        const ai = getGenAI();
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(
          `Exception on model '${currentModel}' (attempt ${attempt}/${maxRetries}):`,
          err?.message || JSON.stringify(err)
        );
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
    console.warn(`All ${maxRetries} attempts failed for model '${currentModel}'. Trying fallback model if available...`);
  }
  throw lastError || new Error("Erro desconhecido ao chamar a API do Gemini");
}


// ----------------- API ROUTES -----------------

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Suggest Categories (using Type.OBJECT response schema)
app.post("/api/suggest-categories", async (req, res) => {
  try {
    const { inputs, customPrompt } = req.body;
    if (!inputs) {
      return res.status(400).json({ error: "Dados de entrada (inputs) são obrigatórios" });
    }

    const ai = getGenAI();
    let promptTemplate = "";
    
    if (customPrompt) {
      promptTemplate = renderPrompt(customPrompt, { inputs });
    } else {
      promptTemplate = `Você é um classificador de rotinas administrativas e oportunidades de melhoria em gestão pública.
Com base nos dados preenchidos pelo usuário, classifique a rotina em uma categoria principal e identifique categorias de melhoria.

Dados da rotina:
${JSON.stringify(inputs, null, 2)}

Categorias possíveis da rotina:
- Atendimento ao cidadão
- Rotina interna administrativa
- Processo de gestão
- Processo de fiscalização
- Processo financeiro/orçamentário
- Processo jurídico/normativo
- Processo de saúde
- Processo educacional
- Processo operacional
- Processo tecnológico/sistemas
- Outro

Categorias possíveis de melhoria:
- Automação simples
- Integração entre sistemas
- Redução de retrabalho
- Melhoria de atendimento ao cidadão
- Melhoria de controle interno
- Melhoria de indicadores
- Padronização de procedimento
- Revisão normativa
- Uso potencial de IA
- Digitalização de processo

Regras:
1. Escolha apenas uma categoria principal da rotina.
2. Escolha de uma a cinco categorias de melhoria.
3. Justifique cada escolha em uma frase.
4. Não invente informações.
5. Se não houver dados suficientes, use "Outro" e explique a lacuna.
6. A categoria sugerida pela IA poderá ser alterada pelo usuário.`;
    }

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: promptTemplate,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoria_rotina: {
              type: Type.STRING,
              description: "Categoria principal selecionada.",
            },
            justificativa_categoria_rotina: {
              type: Type.STRING,
              description: "Justificativa curta para a categoria principal.",
            },
            categorias_melhoria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  justification: { type: Type.STRING },
                },
                required: ["category", "justification"],
              },
              description: "Lista de 1 a 5 categorias de melhoria sugeridas.",
            },
            nivel_confianca: {
              type: Type.STRING,
              description: "Nível de confiança: 'baixo', 'médio' ou 'alto'.",
            },
            lacunas_para_classificacao: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Possíveis informações em falta para melhor precisão.",
            },
          },
          required: [
            "categoria_rotina",
            "justificativa_categoria_rotina",
            "categorias_melhoria",
            "nivel_confianca",
            "lacunas_para_classificacao",
          ],
        },
      },
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Erro em /api/suggest-categories:", error);
    res.status(500).json({ error: error.message || "Erro interno na IA" });
  }
});

// 2. Generate Complete POPI
app.post("/api/generate-popi", async (req, res) => {
  try {
    const { popi, inputs, customPrompt } = req.body;
    if (!popi || !inputs) {
      return res.status(400).json({ error: "POPI e inputs são obrigatórios" });
    }

    const ai = getGenAI();
    const prompt = `
Você é um especialista sênior em gestão pública, controle interno, mapeamento de processos, de Procedimento Operacional Padrão, análise AS-IS/TO-BE, desenho de fluxos, melhoria contínua e automação aplicada ao setor público.

Sua tarefa é gerar um POPI — Procedimento Operativo Padrão Inteligente — a partir de 16 respostas preenchidas pelo usuário no sistema.

O resultado deve ter qualidade equivalente a dois documentos técnicos:
1. POP AS-IS — Procedimento Operacional Padrão da rotina atual.
2. Relatório TO-BE — Análise de gargalos e propostas de melhoria.

O sistema deve usar SOMENTE as 16 perguntas de entrada. Não solicite nem dependa de perguntas adicionais.
Se faltar informação, registre como lacuna. Não invente.

DADOS DE CONTROLE DO RELATÓRIO:
Número do relatório: ${popi.report_number}
Secretaria: ${popi.secretaria_name}
Departamento: ${popi.department || "Não informado"}
Divisão: ${popi.division || "Não informado"}
Ano: ${popi.year}
Categoria da rotina: ${popi.routine_category || "Não informado"}
Categorias de melhoria: ${(popi.improvement_categories || []).join(", ")}

RESPOSTAS DO USUÁRIO — 16 PERGUNTAS:
1. Secretaria / Departamento / Divisão:
${inputs.secretaria_departamento_divisao || "Não informado"}

2. Cargo ou função:
${inputs.cargo_funcao || "Não informado"}

3. Nome da rotina:
${inputs.routine_name || "Não informado"}

4. Qual o objetivo dessa rotina?
${inputs.routine_goal || "Não informado"}

5. Essa rotina atende diretamente o cidadão ou é uma rotina interna da gestão municipal?
${inputs.routine_type || "Não informado"} (Detalhes adicionais: ${inputs.routine_type_detail || "Nenhum"})

6. O que faz essa rotina começar?
${inputs.start_trigger || "Não informado"}

7. Essa atividade acontece com que frequência?
${inputs.frequency || "Não informado"} (Detalhes adicionais: ${inputs.frequency_detail || "Nenhum"})

8. Quem participa da rotina?
${inputs.participants_free ? inputs.participants_free : JSON.stringify(inputs.participants || [])}

9. Existe alguma lei, decreto ou norma que oriente essa atividade?
${inputs.norma_orientadora || "Não informado"}

10. Descreva o passo a passo da rotina.
${inputs.passo_a_passo_free ? inputs.passo_a_passo_free : JSON.stringify(inputs.passo_a_passo || [])}

11. Quais sistemas, planilhas ou documentos são utilizados?
${inputs.sistemas_documentos_utilizados || "Não informado"}

12. Quais informações ou documentos são indispensáveis para iniciar a rotina?
${inputs.informacoes_indispensaveis || "Não informado"}

13. Quanto tempo, em média, sua parte da rotina leva?
${inputs.tempo_medio || "Não informado"}

14. Onde acontecem os maiores atrasos ou dificuldades?
${inputs.gargalos_dificuldades || "Não informado"}

15. O que poderia ser automatizado, simplificado ou melhorado?
${inputs.melhorias_automacoes_sugeridas || "Não informado"}

16. Essa rotina tem metas ou indicadores?
${inputs.metas_indicadores_free ? inputs.metas_indicadores_free : JSON.stringify(inputs.metas_indicadores || [])}


REGRAS OBRIGATÓRIAS:
1. Use exclusivamente as 16 respostas acima e os dados de controle do relatório.
2. Não invente informações fictícias. Se algo essencial faltar, registre como "não informado" ou lance como lacuna para posterior entrevista ou validação.
3. Não cite nomes de pessoas físicas ou servidores específicos. Prefira cargos, funções ou secretarias.
4. Escreva com linguagem profissional, objetiva e adequada a governos.
5. Gere um fluxograma AS-IS em Mermaid de forma obrigatória usando flowchart TD.
6. Se houver informações suficientes, gere também um novo fluxograma TO-BE baseado em melhorias em Mermaid usando flowchart TD.
7. Respeite perfeitamente a estrutura obrigatória definida abaixo.

ESTRUTURA OBRIGATÓRIA DA SAÍDA:

# POPI — Procedimento Operativo Padrão Inteligente

| IDENTIFICAÇÃO DA ROTINA MAPEADA |  |
| :---- | :---- |
| **Número do Relatório:** | ${popi.report_number} |
| **Nome da Rotina de Trabalho:** | ${inputs.routine_name || "Não informado"} |
| **Secretaria / Departamento / Divisão:** | ${popi.secretaria_name} / ${popi.department} / ${popi.division} |
| **Responsável pela Rotina:** | ${inputs.cargo_funcao || "Não informado"} |
| **Ano:** | ${popi.year} |
| **Categoria da Rotina:** | ${popi.routine_category || "Não informado"} |

---

# PARTE 1 — PROCEDIMENTO OPERACIONAL PADRÃO AS-IS

## 1 — Objetivo e contexto do processo
[Texto do objetivo institucional]
**Fornecedores da Rotina — Origem da Demanda:** [Análise de quem inicia]
**Clientes / Público-Alvo: — Destino Final:** [Quem se beneficia]

## 2 — Responsabilidades
[Lista de cargos/setores e suas atribuições]

## 3 — Referências normativas
[O que foi informado ou mensagem sobre ausência]

## 4 — Termos e definições
[Definições dos termos técnicos, siglas, etc. encontrados no formulário]

## 5 — Descrição da rotina de trabalho — passo a passo
**Gatilho Inicial:** ${inputs.start_trigger || ""}
**Frequência de Execução:** ${inputs.frequency || ""}
**Tempo Médio de Execução Estimado:** ${inputs.tempo_medio || ""}
**Requisitos Mínimos:** ${inputs.informacoes_indispensaveis || ""}
**Sistemas, Planilhas ou Ferramentas Utilizadas:** ${inputs.sistemas_documentos_utilizados || ""}

**Sequência Lógica do Fluxo:**
[Sequência numerada em etapas profissionais contendo: nº, nome, responsável, sistemas, descrição, resultado esperado]

## 6 — Medição e controle
[Indicadores estruturados]

## 7 — Fluxograma AS-IS
[Breve explicação textual]
\`\`\`mermaid
flowchart TD
    [FLUXOGRAMA EM MERMAID]
\`\`\`

## 8 — Controle de registros
[Tabela com os registros e status técnicos]

## 9 — Controle de revisões
| Data da Revisão | Número da Revisão | Melhoria Implementada |
| :---- | :---- | :---- |
| ${new Date().toLocaleDateString("pt-BR")} | 00 | Emissão inicial do POPI a partir do roteiro de mapeamento da rotina. |

## 10 — Anexos
[Recomendações técnicas]

---

# PARTE 2 — ANÁLISE DE GARGALOS E PROPOSTAS DE MELHORIA TO-BE

## 1 — Contexto operacional
[Texto explicativo conectando tudo]

## 2 — Relatório de gargalos e diagnóstico de dificuldades — diagnóstico da área responsável pela rotina
| Onde ocorrem os maiores atrasos ou dificuldades |
| ----- |
| ${inputs.gargalos_dificuldades} |

## 3 — Diretrizes para transformação e propostas de melhoria TO-BE — sugestões da área responsável pela rotina
[Tópicos baseados na sugestão do usuário]

## 4 — Cronograma de análise e próximos passos
| Fase da Análise | Descrição Técnica da Atividade | Status |
| :---- | :---- | :---- |
| **1. Entrevistas / AS-IS** | Imersão no setor, mapeamento detalhado da rotina com os servidores e desenho do POP e fluxograma AS-IS. | Concluído (Gerado Inicial) |
| **2. Diagnóstico Técnico** | Tabulação crítica dos gargalos operacionais, análise de causas e emissão do relatório analítico. | Concluído (Gerado Inicial) |
| **3. Desenho TO-BE** | Desenho das propostas de melhoria, automação, integração ou redesenho de fluxo em conjunto com as áreas técnicas. | Planejado |

## 5 — Relatório de gargalos e diagnóstico de dificuldades — diagnóstico da gestão de processos
[Tabela comparando fato, gargalo e impacto provável]

## 6 — Diretrizes para transformação e propostas de melhoria TO-BE — gestão de processos
[Lista de recomendações estruturadas técnica de melhoria: automação, integração, retrabalho]

## 7 — Indicadores de impacto esperados após melhoria — sugestão da IA
[Sugestão de métricas e fórmulas]

## 8 — Novo fluxo sugerido
[Visão TO-BE textual]

## 9 — Novo fluxograma sugerido
\`\`\`mermaid
flowchart TD
    [FLUXOGRAMA TO-BE OPCEONAL]
\`\`\`

## 10 — Anexos
[Lista de anexos recomendados adicionais]

---

# LACUNAS PARA VALIDAÇÃO COM A ÁREA
[Lista de perguntas para preencher pontos em aberto]
`;

    let activePrompt = prompt;
    if (customPrompt) {
      const variables: Record<string, any> = {
        report_number: popi.report_number,
        routine_name: inputs.routine_name || "Não informado",
        secretaria_name: popi.secretaria_name,
        department: popi.department || "Não informado",
        division: popi.division || "Não informado",
        year: popi.year,
        routine_category: popi.routine_category || "Não informado",
        improvement_categories: (popi.improvement_categories || []).join(", "),
        "inputs.secretaria_departamento_divisao": inputs.secretaria_departamento_divisao || "Não informado",
        "inputs.cargo_funcao": inputs.cargo_funcao || "Não informado",
        "inputs.routine_goal": inputs.routine_goal || "Não informado",
        "inputs.routine_type": inputs.routine_type || "Não informado",
        "inputs.routine_type_detail": inputs.routine_type_detail || "Nenhum",
        "inputs.start_trigger": inputs.start_trigger || "Não informado",
        "inputs.frequency": inputs.frequency || "Não informado",
        "inputs.frequency_detail": inputs.frequency_detail || "Nenhum",
        "inputs.participants": inputs.participants_free ? inputs.participants_free : JSON.stringify(inputs.participants || []),
        "inputs.norma_orientadora": inputs.norma_orientadora || "Não informado",
        "inputs.passo_a_passo": inputs.passo_a_passo_free ? inputs.passo_a_passo_free : JSON.stringify(inputs.passo_a_passo || []),
        "inputs.sistemas_documentos_utilizados": inputs.sistemas_documentos_utilizados || "Não informado",
        "inputs.informacoes_indispensaveis": inputs.informacoes_indispensaveis || "Não informado",
        "inputs.tempo_medio": inputs.tempo_medio || "Não informado",
        "inputs.gargalos_dificuldades": inputs.gargalos_dificuldades || "Não informado",
        "inputs.melhorias_automacoes_sugeridas": inputs.melhorias_automacoes_sugeridas || "Não informado",
        "inputs.metas_indicadores": inputs.metas_indicadores_free ? inputs.metas_indicadores_free : JSON.stringify(inputs.metas_indicadores || []),
        current_date: new Date().toLocaleDateString("pt-BR")
      };
      activePrompt = renderPrompt(customPrompt, variables);
    }

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: activePrompt,
    });

    const markdownText = response.text || "";
    res.json({ final_markdown: markdownText });
  } catch (error: any) {
    console.error("Erro em /api/generate-popi:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar POPI com IA" });
  }
});

// 3. Normalize inputs (creates structured values based on free text written by users)
app.post("/api/normalize-inputs", async (req, res) => {
  try {
    const { inputs, customPrompt } = req.body;
    if (!inputs) {
      return res.status(400).json({ error: "Inputs são obrigatórios" });
    }

    const ai = getGenAI();
    let activePrompt = "";

    if (customPrompt) {
      activePrompt = renderPrompt(customPrompt, { inputs });
    } else {
      activePrompt = `Você é um especialista em mapeamento de processos públicos, desenho de fluxos e criação de POPI.
Sua tarefa é receber as respostas preenchidas pelo usuário no sistema e transformar em um JSON limpo e padronizado contendo participantes, passo a passo e metas estructurados.

Entrada de dados atual (especialmente Q8 Participantes, Q10 Passo a passo, Q16 Metas/Indicadores):
${JSON.stringify(inputs, null, 2)}

Regras de normalização:
1. Não invente informações inexistentes.
2. Converta texto solto de participantes em uma lista de objetos: { "setor_ou_funcao": "", "responsabilidade": "" }.
3. Converta o passo a passo (Q10) em uma lista sequencial indexada por número, com as chaves: { "numero": number, "atividade": "", "responsavel": "", "sistema_ou_documento": "", "resultado_da_etapa": "" }.
4. Converta metas/indicadores (Q16) em uma lista estruturada: { "indicador": "", "meta": "", "forma_de_medicao": "", "fonte_dados": "", "periodicidade": "" }.

Retorne estritamente um JSON no seguinte formato:`;
    }

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: activePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            participants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  setor_ou_funcao: { type: Type.STRING },
                  responsabilidade: { type: Type.STRING },
                },
                required: ["setor_ou_funcao", "responsabilidade"],
              },
            },
            passo_a_passo: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  numero: { type: Type.INTEGER },
                  atividade: { type: Type.STRING },
                  responsavel: { type: Type.STRING },
                  sistema_ou_documento: { type: Type.STRING },
                  resultado_da_etapa: { type: Type.STRING },
                },
                required: ["numero", "atividade", "responsavel", "sistema_ou_documento", "resultado_da_etapa"],
              },
            },
            metas_indicadores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  indicador: { type: Type.STRING },
                  meta: { type: Type.STRING },
                  forma_de_medicao: { type: Type.STRING },
                  fonte_dados: { type: Type.STRING },
                  periodicidade: { type: Type.STRING },
                },
                required: ["indicador", "meta", "forma_de_medicao", "fonte_dados", "periodicidade"],
              },
            },
          },
          required: ["participants", "passo_a_passo", "metas_indicadores"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Erro em /api/normalize-inputs:", error);
    res.status(500).json({ error: error.message || "Erro na normalização por IA" });
  }
});

// 4. Edit POPI technical editor
app.post("/api/edit-popi", async (req, res) => {
  try {
    const { documentMarkdown, inputs, requestText, customPrompt } = req.body;
    if (!documentMarkdown || !requestText) {
      return res.status(400).json({ error: "Documento e solicitação de edição são obrigatórios" });
    }

    const ai = getGenAI();
    let activePrompt = "";

    if (customPrompt) {
      activePrompt = renderPrompt(customPrompt, {
        documentMarkdown,
        inputs,
        requestText
      });
    } else {
      activePrompt = `Você é um editor técnico de POPI — Procedimento Operativo Padrão Inteligente.
Sua tarefa é aplicar uma edição solicitada pelo usuário em um POPI existente. Prescrevemos modificações cirúrgicas.

Documento atual:
${documentMarkdown}

Dados de origem atuais:
${JSON.stringify(inputs || {}, null, 2)}

Solicitação do usuário:
${requestText}

Regras:
1. Aplique com cuidado a alteração solicitada no documento Markdown. Retorne o documento revisado completo.
2. Não invente novas informações que não foram solicitadas.
3. Não mude o número do relatório ou informações estruturais se não solicitado.

Gere uma resposta em JSON com a estrutura:
{
  "alteracao_realizada": "breve resumo da alteração",
  "partes_impactadas": ["POP", "fluxograma", etc.],
  "regeracao_recomenda": "nenhuma" | "parcial" | "inteiro",
  "documento_revisado": "Seu markdown revisado completo aqui"
}`;
    }

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: activePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alteracao_realizada: { type: Type.STRING },
            partes_impactadas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            regeracao_recomenda: { type: Type.STRING },
            documento_revisado: { type: Type.STRING },
          },
          required: ["alteracao_realizada", "partes_impactadas", "documento_revisado"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Erro em /api/edit-popi:", error);
    res.status(500).json({ error: error.message || "Erro ao editar POPI com IA" });
  }
});

// 5. QA process adversarial review
app.post("/api/qa-popi", async (req, res) => {
  try {
    const { inputs, documentMarkdown, customPrompt } = req.body;
    if (!documentMarkdown) {
      return res.status(400).json({ error: "Documento Markdown é obrigatório" });
    }

    const ai = getGenAI();
    let activePrompt = "";

    if (customPrompt) {
      activePrompt = renderPrompt(customPrompt, {
        inputs,
        documentMarkdown
      });
    } else {
      activePrompt = `Você é um revisor adversarial de qualidade de documentos de gestão pública.
Sua tarefa é revisar o POPI gerado para encontrar erros, invenções, incoerências, omissões de campos ou riscos de exposição de dados.

Dados de entrada:
${JSON.stringify(inputs || {}, null, 2)}

Documento POPI Completo:
${documentMarkdown}

Por favor, faça um diagnóstico crítico detalhado e estruture a resposta no seguinte JSON:`;
    }

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: activePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classificacao: {
              type: Type.STRING,
              description: "Aprovado | Aprovado com ressalvas | Reprovado",
            },
            justificativa: { type: Type.STRING },
            erros_encontrados: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tipo: { type: Type.STRING, description: "Invenção, omissão, formatação, privacidade" },
                  trecho: { type: Type.STRING },
                  problema: { type: Type.STRING },
                  correcao: { type: Type.STRING },
                },
                required: ["tipo", "trecho", "problema", "correcao"],
              },
            },
            riscos_identificados: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["classificacao", "justificativa", "erros_encontrados", "riscos_identificados"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Erro em /api/qa-popi:", error);
    res.status(500).json({ error: error.message || "Erro no QA" });
  }
});


// Serve static frontend files (middleware for dev / static for prod)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, express serves compiled files in dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server fully running on http://localhost:${PORT}`);
  });
}

startServer();
