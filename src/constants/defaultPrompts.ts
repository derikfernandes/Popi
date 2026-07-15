export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  category: "classification" | "generation" | "normalization" | "edition" | "qa";
  placeholders: { name: string; description: string }[];
  defaultTemplate: string;
}

export const DEFAULT_PROMPTS: AIPromptTemplate[] = [
  {
    id: "suggest-categories",
    name: "Sugestão de Categorias e Oportunidades",
    description: "Analisa o questionário inicial respondido pelo servidor municipal e classifica a atividade em uma categoria administrativa principal, identificando também possíveis frentes de melhoria para o serviço.",
    category: "classification",
    placeholders: [
      { name: "inputs", description: "Dados estruturados e respostas livres das 16 perguntas do mapeamento." }
    ],
    defaultTemplate: `Você é um classificador de rotinas administrativas e oportunidades de melhoria em gestão pública.
Com base nos dados preenchidos pelo usuário, classifique a rotina em uma categoria principal e identifique categorias de melhoria.

Dados da rotina:
{{inputs}}

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
6. A categoria sugerida pela IA poderá ser alterada pelo usuário.`
  },
  {
    id: "generate-popi",
    name: "Geração Completa do POPI (POP + Relatório TO-BE)",
    description: "Prompt principal que consolida as 16 perguntas em um Procedimento Operacional Padrão da situação atual (AS-IS) com um fluxograma Mermaid, e desenha o Relatório Geral das melhorias e sugestões estruturadas (TO-BE).",
    category: "generation",
    placeholders: [
      { name: "report_number", description: "ID de registro unificado (ex: POPI-SEC-001/2026)." },
      { name: "routine_name", description: "Nome declarado da rotina administrativa." },
      { name: "secretaria_name", description: "Secretaria responsável municipal." },
      { name: "department", description: "Departamento municipal responsável." },
      { name: "division", description: "Divisão do departamento responsável." },
      { name: "year", description: "Ano de competência de mapeamento." },
      { name: "routine_category", description: "Categoria principal identificada." },
      { name: "improvement_categories", description: "Categorias de melhorias mapeadas." },
      { name: "inputs.secretaria_departamento_divisao", description: "Resposta Q1 (Setor)." },
      { name: "inputs.cargo_funcao", description: "Resposta Q2 (Cargo/Função)." },
      { name: "inputs.routine_goal", description: "Resposta Q4 (Objetivo da rotina)." },
      { name: "inputs.routine_type", description: "Resposta Q5 (Atendimento direto ou interno)." },
      { name: "inputs.routine_type_detail", description: "Resposta Q5 complementar." },
      { name: "inputs.start_trigger", description: "Resposta Q6 (Gatilho inicial)." },
      { name: "inputs.frequency", description: "Resposta Q7 (Frequência da atividade)." },
      { name: "inputs.frequency_detail", description: "Resposta Q7 complementar." },
      { name: "inputs.participants", description: "Resposta Q8 (Participantes estruturados ou texto livre)." },
      { name: "inputs.norma_orientadora", description: "Resposta Q9 (Normas existentes)." },
      { name: "inputs.passo_a_passo", description: "Resposta Q10 (Passo a passo por etapas)." },
      { name: "inputs.sistemas_documentos_utilizados", description: "Resposta Q11 (Sistemas e ferramentas)." },
      { name: "inputs.informacoes_indispensaveis", description: "Resposta Q12 (Insumos iniciais)." },
      { name: "inputs.tempo_medio", description: "Resposta Q13 (Duração estimada)." },
      { name: "inputs.gargalos_dificuldades", description: "Resposta Q14 (Gargalos e travas)." },
      { name: "inputs.melhorias_automacoes_sugeridas", description: "Resposta Q15 (Automação proposta)." },
      { name: "inputs.metas_indicadores", description: "Resposta Q16 (Métricas de impacto)." },
      { name: "current_date", description: "Data de geração no formato pt-BR." }
    ],
    defaultTemplate: `Você é um especialista sênior em gestão pública, controle interno, mapeamento de processos, de Procedimento Operacional Padrão, análise AS-IS/TO-BE, desenho de fluxos, melhoria contínua e automação aplicada ao setor público.

Sua tarefa é gerar um POPI — Procedimento Operativo Padrão Inteligente — a partir de 16 respostas preenchidas pelo usuário no sistema.

O resultado deve ter qualidade equivalente a dois documentos técnicos:
1. POP AS-IS — Procedimento Operacional Padrão da rotina atual.
2. Relatório TO-BE — Análise de gargalos e propostas de melhoria.

O sistema deve usar SOMENTE as 16 perguntas de entrada. Não solicite nem dependa de perguntas adicionais.
Se faltar informação, registre como lacuna. Não invente.

DADOS DE CONTROLE DO RELATÓRIO:
Número do relatório: {{report_number}}
Secretaria: {{secretaria_name}}
Departamento: {{department}}
Divisão: {{division}}
Ano: {{year}}
Categoria da rotina: {{routine_category}}
Categorias de melhoria: {{improvement_categories}}

RESPOSTAS DO USUÁRIO — 16 PERGUNTAS:
1. Secretaria / Departamento / Divisão:
{{inputs.secretaria_departamento_divisao}}

2. Cargo ou função:
{{inputs.cargo_funcao}}

3. Nome da rotina:
{{inputs.routine_name}}

4. Qual o objetivo dessa rotina?
{{inputs.routine_goal}}

5. Essa rotina atende diretamente o cidadão ou é uma rotina interna da gestão municipal?
{{inputs.routine_type}} (Detalhes adicionais: {{inputs.routine_type_detail}})

6. O que faz essa rotina começar?
{{inputs.start_trigger}}

7. Essa atividade acontece com que frequência?
{{inputs.frequency}} (Detalhes adicionais: {{inputs.frequency_detail}})

8. Quem participa da rotina?
{{inputs.participants}}

9. Existe alguma lei, decreto ou norma que oriente essa atividade?
{{inputs.norma_orientadora}}

10. Descreva o passo a passo da rotina.
{{inputs.passo_a_passo}}

11. Quais sistemas, planilhas ou documentos são utilizados?
{{inputs.sistemas_documentos_utilizados}}

12. Quais informações ou documentos são indispensáveis para iniciar a rotina?
{{inputs.informacoes_indispensaveis}}

13. Quanto tempo, em média, sua parte da rotina leva?
{{inputs.tempo_medio}}

14. Onde acontecem os maiores atrasos ou dificuldades?
{{inputs.gargalos_dificuldades}}

15. O que poderia ser automatizado, simplificado ou melhorado?
{{inputs.melhorias_automacoes_sugeridas}}

16. Essa rotina tem metas ou indicadores?
{{inputs.metas_indicadores}}


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
| **Número do Relatório:** | {{report_number}} |
| **Nome da Rotina de Trabalho:** | {{routine_name}} |
| **Secretaria / Departamento / Divisão:** | {{secretaria_name}} / {{department}} / {{division}} |
| **Responsável pela Rotina:** | {{inputs.cargo_funcao}} |
| **Ano:** | {{year}} |
| **Categoria da Rotina:** | {{routine_category}} |

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
**Gatilho Inicial:** {{inputs.start_trigger}}
**Frequência de Execução:** {{inputs.frequency}}
**Tempo Médio de Execução Estimado:** {{inputs.tempo_medio}}
**Requisitos Mínimos:** {{inputs.informacoes_indispensaveis}}
**Sistemas, Planilhas ou Ferramentas Utilizadas:** {{inputs.sistemas_documentos_utilizados}}

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
| {{current_date}} | 00 | Emissão inicial do POPI a partir do roteiro de mapeamento da rotina. |

## 10 — Anexos
[Recomendações técnicas]

---

# PARTE 2 — ANÁLISE DE GARGALOS E PROPOSTAS DE MELHORIA TO-BE

## 1 — Contexto operacional
[Texto explicativo conectando tudo]

## 2 — Relatório de gargalos e diagnóstico de dificuldades — diagnóstico da área responsável pela rotina
| Onde ocorrem os maiores atrasos ou dificuldades |
| ----- |
| {{inputs.gargalos_dificuldades}} |

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
[Lista de perguntas para preencher pontos em aberto]`
  },
  {
    id: "normalize-inputs",
    name: "Normalização Estruturada por IA",
    description: "Interpreta os campos abertos preenchidos manualmente pelo servidor municipal (Q8 Participantes, Q10 Passo a passo, Q16 Metas) e formata esses textos em tabelas e estruturas altamente organizadas de forma JSON uniforme.",
    category: "normalization",
    placeholders: [
      { name: "inputs", description: "Estrutura crua contendo todas as respostas declaradas pelo usuário no formulário de 16 perguntas." }
    ],
    defaultTemplate: `Você é um especialista em mapeamento de processos públicos, desenho de fluxos e criação de POPI.
Sua tarefa é receber as respostas preenchidas pelo usuário no sistema e transformar em um JSON limpo e padronizado contendo participantes, passo a passo e metas estructurados.

Entrada de dados atual (especialmente Q8 Participantes, Q10 Passo a passo, Q16 Metas/Indicadores):
{{inputs}}

Regras de normalização:
1. Não invente informações inexistentes.
2. Converta texto solto de participantes em uma lista de objetos: { "setor_ou_funcao": "", "responsabilidade": "" }.
3. Converta o passo a passo (Q10) em uma lista sequencial indexada por número, com as chaves: { "numero": number, "atividade": "", "responsavel": "", "sistema_ou_documento": "", "resultado_da_etapa": "" }.
4. Converta metas/indicadores (Q16) em uma lista estruturada: { "indicador": "", "meta": "", "forma_de_medicao": "", "fonte_dados": "", "periodicidade": "" }.

Retorne estritamente um JSON no seguinte formato:`
  },
  {
    id: "edit-popi",
    name: "Edição Técnica Inteligente",
    description: "Recebe comandos informais e contextualizados do usuário (ex: 'Adicione a necessidade do sistema SAMS no passo 3') e reescreve o documento Markdown geral e fluxograma sem perder dados de auditoria.",
    category: "edition",
    placeholders: [
      { name: "documentMarkdown", description: "Código Markdown e fluxogramas atuais do documento sob edição." },
      { name: "inputs", description: "Respostas originais do formulário de 16 perguntas para contexto." },
      { name: "requestText", description: "Texto ou comando de direcionamento digitado pelo servidor municipal para aplicar a alteração." }
    ],
    defaultTemplate: `Você é um editor técnico de POPI — Procedimento Operativo Padrão Inteligente.
Sua tarefa é aplicar uma edição solicitada pelo usuário em um POPI existente. Prescrevemos modificações cirúrgicas.

Documento atual:
{{documentMarkdown}}

Dados de origem atuais:
{{inputs}}

Solicitação do usuário:
{{requestText}}

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
}`
  },
  {
    id: "qa-popi",
    name: "Revisão e Auditoria de Qualidade (QA)",
    description: "Revisor adversarial responsável por auditar o rascunho em relação às 16 perguntas respondidas pelo usuário para identificar pontos de incoerência, possíveis invenções de dados fictícios ou vazamento de dados de privacidade civil.",
    category: "qa",
    placeholders: [
      { name: "documentMarkdown", description: "Todo o documento técnico markdown (inclusive o fluxograma Mermaid) compilado sob análise." },
      { name: "inputs", description: "As respostas fornecidas originalmente no formulário para validação direta de conformidade." }
    ],
    defaultTemplate: `Você é um revisor adversarial de qualidade de documentos de gestão pública.
Sua tarefa é revisar o POPI gerado para encontrar erros, invenções, incoerências, omissões de campos ou riscos de exposição de dados.

Dados de entrada:
{{inputs}}

Documento POPI Completo:
{{documentMarkdown}}

Por favor, faça um diagnóstico crítico detalhado e estruture a resposta no seguinte JSON:`
  }
];
