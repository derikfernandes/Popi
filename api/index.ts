import express from "express";
import { Type } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));

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

// Limite alinhado à Vercel (~4,5 MB no body HTTP). Em base64 o arquivo
// cresce ~33%, então o tamanho bruto seguro fica em ~3 MB.
const IMPORT_FILE_MAX_BYTES = 3 * 1024 * 1024;
const IMPORT_FILE_MAX_LABEL = "3 MB";
const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function decodeImportFile(fileBase64: unknown): Buffer {
  if (typeof fileBase64 !== "string" || !fileBase64.trim()) {
    throw new Error("O conteúdo do arquivo é obrigatório.");
  }

  const cleanBase64 = fileBase64
    .replace(/^data:[^;]+;base64,/i, "")
    .replace(/\s/g, "");

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
    throw new Error("O arquivo enviado não está em base64 válido.");
  }

  const buffer = Buffer.from(cleanBase64, "base64");
  if (!buffer.length) {
    throw new Error("O arquivo enviado está vazio.");
  }
  if (buffer.length > IMPORT_FILE_MAX_BYTES) {
    throw new Error(`O arquivo excede o limite de ${IMPORT_FILE_MAX_LABEL}.`);
  }
  return buffer;
}

function buildImportPrompt(filename: string): string {
  return `Você é um especialista em gestão pública e mapeamento de processos.
Analise o POP existente anexado e extraia informações para preencher o questionário de mapeamento POPI.

Arquivo: ${filename}

Regras obrigatórias:
1. Use somente informações encontradas no documento. Não invente dados.
2. Quando uma informação não existir, retorne string vazia ou lista vazia e registre uma lacuna em "gaps".
3. "routine_type" deve ser exatamente uma destas opções: "Atende diretamente o cidadão", "Rotina interna" ou "Outro".
4. Para frequência, preserve uma descrição objetiva encontrada no documento; se não houver, use string vazia.
5. Estruture participantes, passo a passo e metas/indicadores nos arrays correspondentes.
6. Não trate uma recomendação futura como etapa atual do processo.
7. Em "meta", extraia título, departamento e divisão quando existirem.
8. Crie uma lacuna para cada assunto relevante do questionário que não tenha sido localizado.
9. Para participantes, passo a passo e metas/indicadores, registre uma única lacuna no campo principal; não duplique a lacuna no respectivo campo de texto livre.
10. Em "gaps.field", use somente o nome direto do campo, sem prefixos como "inputs." ou "meta.".
11. O nível de confiança deve ser "baixo", "médio" ou "alto".
12. Retorne somente o JSON solicitado pelo schema.`;
}

const importPopResponseSchema = {
  type: Type.OBJECT,
  properties: {
    meta: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        department: { type: Type.STRING },
        division: { type: Type.STRING },
      },
      required: ["title", "department", "division"],
    },
    inputs: {
      type: Type.OBJECT,
      properties: {
        role_or_position: { type: Type.STRING },
        routine_name: { type: Type.STRING },
        routine_goal: { type: Type.STRING },
        routine_type: { type: Type.STRING },
        routine_type_detail: { type: Type.STRING },
        start_trigger: { type: Type.STRING },
        frequency: { type: Type.STRING },
        frequency_detail: { type: Type.STRING },
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
        participants_free: { type: Type.STRING },
        norma_orientadora: { type: Type.STRING },
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
            required: [
              "numero",
              "atividade",
              "responsavel",
              "sistema_ou_documento",
              "resultado_da_etapa",
            ],
          },
        },
        passo_a_passo_free: { type: Type.STRING },
        sistemas_documentos_utilizados: { type: Type.STRING },
        informacoes_indispensaveis: { type: Type.STRING },
        tempo_medio: { type: Type.STRING },
        gargalos_dificuldades: { type: Type.STRING },
        melhorias_automacoes_sugeridas: { type: Type.STRING },
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
            required: [
              "indicador",
              "meta",
              "forma_de_medicao",
              "fonte_dados",
              "periodicidade",
            ],
          },
        },
        metas_indicadores_free: { type: Type.STRING },
      },
      required: [
        "role_or_position",
        "routine_name",
        "routine_goal",
        "routine_type",
        "routine_type_detail",
        "start_trigger",
        "frequency",
        "frequency_detail",
        "participants",
        "participants_free",
        "norma_orientadora",
        "passo_a_passo",
        "passo_a_passo_free",
        "sistemas_documentos_utilizados",
        "informacoes_indispensaveis",
        "tempo_medio",
        "gargalos_dificuldades",
        "melhorias_automacoes_sugeridas",
        "metas_indicadores",
        "metas_indicadores_free",
      ],
    },
    gaps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING },
          label: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ["field", "label", "reason"],
      },
    },
    confidence: { type: Type.STRING },
    summary: { type: Type.STRING },
  },
  required: ["meta", "inputs", "gaps", "confidence", "summary"],
};

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

// Helper function to call Vertex AI generateContent with retry for transient errors
async function generateContentWithFallback(
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3
): Promise<any> {
  if (
    !process.env.GOOGLE_OAUTH_CLIENT_ID ||
    !process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
    !process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  ) {
    throw new Error(
      "Credenciais do Vertex AI OAuth não estão configuradas (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN)."
    );
  }

  const vertexModels = getVertexModelsToTry();
  console.log(`Calling Vertex AI with model: ${vertexModels.join(", ")}...`);
  let lastVertexError: any = null;

  for (const currentModel of vertexModels) {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Calling Vertex AI using model: '${currentModel}' (attempt ${attempt}/${maxRetries})...`);
        return await callVertexAI(currentModel, params);
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

  throw lastVertexError || new Error("Erro desconhecido ao chamar a API do Vertex AI");
}


// ----------------- API ROUTES -----------------

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Importa um POP existente e devolve somente os dados do questionário + lacunas.
app.post("/api/import-pop", async (req, res) => {
  try {
    const { fileBase64, mimeType, filename, customPrompt } = req.body ?? {};
    if (mimeType !== PDF_MIME && mimeType !== DOCX_MIME) {
      return res.status(400).json({
        error: "Formato não permitido. Envie um arquivo PDF ou Word (.docx).",
      });
    }

    const safeFilename =
      typeof filename === "string" && filename.trim()
        ? filename.trim().slice(0, 180)
        : "documento-importado";
    const fileBuffer = decodeImportFile(fileBase64);

    if (mimeType === PDF_MIME && !fileBuffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      return res.status(400).json({ error: "O arquivo enviado não é um PDF válido." });
    }
    if (
      mimeType === DOCX_MIME &&
      !(fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b)
    ) {
      return res.status(400).json({ error: "O arquivo enviado não é um DOCX válido." });
    }

    const activePrompt =
      typeof customPrompt === "string" && customPrompt.trim()
        ? renderPrompt(customPrompt, { filename: safeFilename })
        : buildImportPrompt(safeFilename);

    let contents: any;
    if (mimeType === PDF_MIME) {
      contents = [
        {
          role: "user",
          parts: [
            { text: activePrompt },
            {
              inlineData: {
                mimeType: PDF_MIME,
                data: fileBuffer.toString("base64"),
              },
            },
          ],
        },
      ];
    } else {
      const extracted = await mammoth.extractRawText({ buffer: fileBuffer });
      const documentText = extracted.value.trim();
      if (!documentText) {
        return res.status(422).json({
          error:
            "Não foi possível encontrar texto no arquivo Word. Verifique se o documento não contém apenas imagens.",
        });
      }
      contents = [
        {
          role: "user",
          parts: [
            { text: activePrompt },
            {
              text: `CONTEÚDO EXTRAÍDO DO DOCUMENTO WORD:\n\n${documentText}`,
            },
          ],
        },
      ];
    }

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: importPopResponseSchema,
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Erro em /api/import-pop:", error);
    const message = error?.message || "Erro ao importar POP com IA";
    if (message.includes(IMPORT_FILE_MAX_LABEL)) {
      return res.status(413).json({ error: message });
    }
    res.status(500).json({ error: message });
  }
});

// 1. Suggest Categories (using Type.OBJECT response schema)
app.post("/api/suggest-categories", async (req, res) => {
  try {
    const { inputs, customPrompt } = req.body;
    if (!inputs) {
      return res.status(400).json({ error: "Dados de entrada (inputs) são obrigatórios" });
    }

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
5. Gere um fluxograma AS-IS em Mermaid de forma obrigatória usando flowchart TD (seção 7 da PARTE 1).
6. Gere DOIS fluxogramas TO-BE em Mermaid usando flowchart TD, em seções separadas da PARTE 2:
   a) FLUXOGRAMA TO-BE (ALTERAÇÕES DE FLUXO DE ROTINA): novo fluxo com melhorias de organização do trabalho, etapas, responsabilidades e sequência — sem depender de novos sistemas.
   b) FLUXOGRAMA TO-BE (ALTERAÇÕES SISTÊMICAS): novo fluxo considerando automações, integrações entre sistemas, robôs ou tecnologia.
   Se não houver informação suficiente para algum dos dois, escreva "Sem alterações sugeridas para este cenário." na seção correspondente e NÃO inclua o bloco mermaid dessa seção.
7. Em nós Mermaid, se o texto contiver parênteses, vírgulas, dois-pontos ou aspas, SEMPRE use aspas duplas no rótulo. Exemplo correto: A["Vaga também no SIRESP (CROSS)"]. Exemplo incorreto: A[Vaga também no SIRESP (CROSS)].
8. Respeite perfeitamente a estrutura obrigatória definida abaixo.

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

## 9 — Fluxograma TO-BE (Alterações de Fluxo de Rotina)
[Breve explicação das mudanças de fluxo de trabalho, sem depender de novos sistemas]
\`\`\`mermaid
flowchart TD
    [FLUXOGRAMA TO-BE DE FLUXO DE ROTINA]
\`\`\`

## 10 — Fluxograma TO-BE (Alterações Sistêmicas)
[Breve explicação das mudanças com automações, integrações e tecnologia]
\`\`\`mermaid
flowchart TD
    [FLUXOGRAMA TO-BE SISTÊMICO]
\`\`\`

## 11 — Anexos
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

// 5. QA process adversarial review
app.post("/api/qa-popi", async (req, res) => {
  try {
    const { inputs, documentMarkdown, customPrompt } = req.body;
    if (!documentMarkdown) {
      return res.status(400).json({ error: "Documento Markdown é obrigatório" });
    }

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

export default app;
