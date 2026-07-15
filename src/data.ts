import { Secretaria, POPI, POPIInput, POPIDocument, POPIVersion } from "./types";

export const DEFAULT_SECRETARIAS: Secretaria[] = [
  {
    id: "sec-governanca",
    name: "Governança",
    official_name: "Secretaria de Governança",
    acronym: "SG",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-gestao",
    name: "Gestão Administrativa e Finanças",
    official_name: "Secretaria de Gestão Administrativa e Finanças",
    acronym: "SGAF",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-habitacao",
    name: "Habitação e Regularização Fundiária",
    official_name: "Secretaria de Habitação e Regularização Fundiária",
    acronym: "SHRF",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-saude",
    name: "Saúde",
    official_name: "Secretaria de Saúde",
    acronym: "SS",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-gabinete",
    name: "Gabinete do Prefeito",
    official_name: "Gabinete do Prefeito",
    acronym: "GP",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-obras",
    name: "Obras",
    official_name: "Secretaria de Obras",
    acronym: "SO",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-urbanismo",
    name: "Urbanismo e Sustentabilidade",
    official_name: "Secretaria de Urbanismo e Sustentabilidade",
    acronym: "SEURB",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-manutencao",
    name: "Manutenção da Cidade",
    official_name: "Secretaria de Manutenção da Cidade",
    acronym: "SMC",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-urbanizadora",
    name: "Urbanizadora Municipal",
    official_name: "Urbanizadora Municipal",
    acronym: "URBAM",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-projetos",
    name: "Projetos Especiais",
    official_name: "Assessoria de Projetos Especiais",
    acronym: "APE",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-esportes",
    name: "Esportes e Qualidade de Vida",
    official_name: "Secretaria de Esportes e Qualidade de vida",
    acronym: "SEQV",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-juridico",
    name: "Assuntos Jurídicos",
    official_name: "Secretaria de Assuntos Jurídicos",
    acronym: "SAJ",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-fundacao-cultural",
    name: "Cassiano Ricardo",
    official_name: "Fundação Cultural Cassiano Ricardo",
    acronym: "FCCR",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-inovacao",
    name: "Inovação e Desenvolvimento Econômico",
    official_name: "Secretaria de Inovação e Desenvolvimento Econômico",
    acronym: "SIDE",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-mobilidade",
    name: "Mobilidade Urbana",
    official_name: "Secretaria de Mobilidade Urbana",
    acronym: "SEMOB",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-fundacao-helio",
    name: "Hélio Augusto de Souza",
    official_name: "Fundação Hélio Augusto de Souza",
    acronym: "FUNDHAS",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-apoio-social",
    name: "Apoio Social ao Cidadão",
    official_name: "Secretaria de Apoio Social ao Cidadão",
    acronym: "SASC",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-controladoria",
    name: "Controladoria",
    official_name: "Controladoria Geral do Município",
    acronym: "CGM",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-educacao",
    name: "Educação e Cidadania",
    official_name: "Secretaria de Educação e Cidadania",
    acronym: "SEC",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
  {
    id: "sec-protecao",
    name: "Proteção ao Cidadão",
    official_name: "Secretaria de Proteção ao Cidadão",
    acronym: "SEPRO",
    active: true,
    created_at: "2026-06-07T00:00:00Z",
    updated_at: "2026-06-07T00:00:00Z",
  },
];

export const ROUTINE_CATEGORIES = [
  "Atendimento ao cidadão",
  "Rotina interna administrativa",
  "Processo de gestão",
  "Processo de fiscalização",
  "Processo financeiro/orçamentário",
  "Processo jurídico/normativo",
  "Processo de saúde",
  "Processo educacional",
  "Processo operacional",
  "Processo tecnológico/sistemas",
  "Outro",
];

export const IMPROVEMENT_CATEGORIES = [
  "Automação simples",
  "Integração entre sistemas",
  "Redução de retrabalho",
  "Melhoria de atendimento ao cidadão",
  "Melhoria de controle interno",
  "Melhoria de indicadores",
  "Padronização de procedimento",
  "Revisão normativa",
  "Uso potencial de IA",
  "Digitalização de processo",
];

// Seed initial POPI list is useful to make the dashboard alive instantly
export const INITIAL_POPIS: POPI[] = [
  {
    id: "popi-1",
    report_number: "Secretaria Saúde - Nº 001 - 2026",
    sequential_number: 1,
    year: 2026,
    secretaria_id: "sec-saude",
    secretaria_name: "Saúde",
    title: "Central de Agendamentos Médicos",
    department: "Urbam / UTC",
    division: "Divisão de Especialidades Clínicas",
    status: "aprovado",
    routine_category: "Atendimento ao cidadão",
    improvement_categories: ["Integração entre sistemas", "Redução de retrabalho", "Uso potencial de IA"],
    created_by: "user-system",
    updated_by: "user-system",
    created_at: "2026-06-01T14:30:00Z",
    updated_at: "2026-06-07T10:00:00Z",
    approved_at: "2026-06-07T10:00:00Z",
    archived_at: null,
  },
  {
    id: "popi-2",
    report_number: "Secretaria Gestão - Nº 001 - 2026",
    sequential_number: 1,
    year: 2026,
    secretaria_id: "sec-gestao",
    secretaria_name: "Gestão",
    title: "Abertura de Processos de Licitação",
    department: "Comissões de Licitatórias",
    division: "Gerência de Suprimentos",
    status: "em_revisao",
    routine_category: "Processo de gestão",
    improvement_categories: ["Padronização de procedimento", "Melhoria de controle interno"],
    created_by: "user-system",
    updated_by: "user-system",
    created_at: "2026-06-05T09:15:00Z",
    updated_at: "2026-06-06T18:40:00Z",
    approved_at: null,
    archived_at: null,
  },
];

export const INITIAL_INPUTS: Record<string, POPIInput> = {
  "popi-1": {
    role_or_position: "Gerente de Atendimento",
    routine_name: "Central de Agendamentos Médicos",
    routine_goal: "Garantir a ocupação inteligente e ágil das vagas de consultas médicas liberadas pela Secretaria.",
    routine_type: "Atende diretamente o cidadão",
    routine_type_detail: "",
    start_trigger: "Sistema CROSS ou encaminhamento clínico do posto municipal.",
    frequency: "Diariamente",
    frequency_detail: "",
    participants: [
      { setor_ou_funcao: "Auxiliar Administrativo", responsabilidade: "Exporta as listas de cotas do CROSS e faz triagem preliminar." },
      { setor_ou_funcao: "Gerente de Atendimento", responsabilidade: "Analisa prioridades de fila de espera e direciona vagas remanescentes." },
    ],
    participants_free: "",
    norma_orientadora: "Portaria de Regulação do SUS Municipal Nº 124/2019 e regulamentos de telessaúde.",
    passo_a_passo: [
      {
        numero: 1,
        atividade: "Exportar listas pendentes",
        responsavel: "Auxiliar Administrativo",
        sistema_ou_documento: "Sistema E-SAMS e Planilhas Excel",
        resultado_da_etapa: "Lista de pacientes prioritários tabulada.",
      },
      {
        numero: 2,
        atividade: "Realizar contato telefônico",
        responsavel: "Equipe de Agendamento",
        sistema_ou_documento: "Ramal telefônico interno",
        resultado_da_etapa: "Confirmação de dados e aceite de data da consulta pelo paciente.",
      },
      {
        numero: 3,
        atividade: "Confirmar agendamento no CROSS",
        responsavel: "Auxiliar Administrativo",
        sistema_ou_documento: "CROSS e SAMS",
        resultado_da_etapa: "Vaga devidamente travada e enviada via SMS.",
      },
    ],
    passo_a_passo_free: "",
    sistemas_documentos_utilizados: "CROSS, SAMS, E-SAMS, Planilhas compartilhadas no Drive.",
    informacoes_indispensaveis: "Número do Cartão Nacional de Saúde (CNS), CPF, telefone atualizado e encaminhamento médico.",
    tempo_medio: "15 a 30 minutos",
    gargalos_dificuldades: "Muitos dados cadastrais de contato estão desatualizados. Ausência de integração em tempo real entre o SIS local e o CROSS estadual exige redigitação de informações.",
    melhorias_automacoes_sugeridas: "Criação de robô de RPA (automação de cliques) para atualizar status no CROSS baseado no SIS local, e envio automático de SMS com link para que o cidadão atualize seu próprio número por meio do aplicativo municipal.",
    metas_indicadores: [
      { indicador: "Aproveitamento de vagas", meta: "Mínimo de 96% das cotas diárias agendas", forma_de_medicao: "Vagas ocupadas / total de vagas fornecidas ao dia", fonte_dados: "Relatórios SGA-CROSS", periodicidade: "Semanal" },
    ],
    metas_indicadores_free: "",
    additional_notes: "",
  },
  "popi-2": {
    role_or_position: "Pregoeiro Assistente",
    routine_name: "Abertura de Processos de Licitação",
    routine_goal: "Instaurar processo licitatório com certidão documental em conformidade com as normas vigentes eletronicamente.",
    routine_type: "Rotina interna",
    routine_type_detail: "",
    start_trigger: "Solicitação com Termo de Referência aprovado pela Chefia de Compras.",
    frequency: "Sob demanda",
    frequency_detail: "",
    participants: [
      { setor_ou_funcao: "Assistente de Compras", responsabilidade: "Reúne os documentos e assina digitalmente o termo inicial." },
      { setor_ou_funcao: "Pregoeiro Líder", responsabilidade: "Emite o edital público de licitação no diário oficial." },
    ],
    participants_free: "",
    norma_orientadora: "Lei 14.133/2021 (Nova Lei de Licitações) e decretos regulamentadores locais.",
    passo_a_passo: [
      { numero: 1, atividade: "Triar o Termo de Referência", responsavel: "Assistente", sistema_ou_documento: "Sistema 1Doc", resultado_da_etapa: "Documentos validados e assinados." },
      { numero: 2, atividade: "Formatar Anexos", responsavel: "Assistente", sistema_ou_documento: "Word / Excel", resultado_da_etapa: "Minuta de edital pronta para revisão jurídica." },
    ],
    passo_a_passo_free: "",
    sistemas_documentos_utilizados: "Portal 1Doc de Processos e editor de texto off-line.",
    informacoes_indispensaveis: "Termo de Referência (TR), Estimativa de Preços e dotação orçamentária prévia.",
    tempo_medio: "Mais de 2 horas",
    gargalos_dificuldades: "Dificuldades na comunicação clara sobre especificações técnicas, causando devoluções excessivas por parte do jurídico para correções.",
    melhorias_automacoes_sugeridas: "Disponibilização de templates inteligentes e checklist integrado e validado eletronicamente no envio, diminuindo erros materiais.",
    metas_indicadores: [],
    metas_indicadores_free: "",
    additional_notes: "",
  },
};

export const INITIAL_DOCUMENTS: Record<string, POPIDocument> = {
  "popi-1": {
    pop_markdown: `# Procedimento Operacional Padrão (POP) — Central de Agendamentos Médicos

## 1 — Objetivo
Padronizar a rotina de recepção, contato técnico e agendamento de consultas médicas especializadas da rede municipal, visando reduzir as taxas de absenteísmo (faltas) e otimizar as cotas do município operadas sob o sistema CROSS estadual.

## 2 — Responsabilidades e Papéis
- **Auxiliar Administrativo**: Triar dados e cadastros residuais do sistema estadual.
- **Equipe de Agendamento (Backoffice)**: Realizar ligações telefônicas ativas de confirmação.
- **Gerente de Atendimento**: Decidir realocações e cotas emergenciais.

## 3 — Atividades Detalhadas
| Nº | Etapa | Responsável | Ferramentas | Saída Técnica |
|---|---|---|---|---|
| 1 | Extração de cotas do CROSS | Auxiliar | CROSS, Excel | Planilha consolidada de agendamento diário |
| 2 | Confirmação proativa por voz | Equipe de Agendamento | Telefone municipal | Termo de ciência verbal do paciente |
| 3 | Confirmação formal e SMS | Auxiliar | SAMS / SMS | Vaga gravada no CROSS e notificação de texto enviada |
`,
    intelligent_report_markdown: `# Relatório Inteligente de Diagnóstico — Central de Agendamentos Médicos

## 1 — Diagnóstico Operacional (AS-IS)
Constatou-se uma grave ineficiência operacional decorrente de duas causas fundamentais: cadastros legados desatualizados e a total redundância de cadastro manual gerada pela falta de integração direta (API) entre o sistema SAMS municipal e o sistema CROSS estadual.

## 2 — Impactos para a Administração e Cidadão
- **Desperdício de Dinheiro Público**: Tempo ocioso de equipe médica por falta de comparecimento de vagas não remanejadas.
- **Aumento de Filas**: Pacientes aguardam tempo excessivo enquanto cotas expiram no sistema.

## 3 — Propostas de Melhoria (TO-BE)
1. **Automação de Confirmação por IA (WhatsApp)**: Configuração de robô conversacional inteligente para disparar confirmações automáticas 48 horas antes da consulta.
2. **Implantação de Robô de Sincronização (RPA)**: Agente de software silencioso integrado via navegador para espelhar as ações humanas de fechamento de ficha.
`,
    flowchart_mermaid: `flowchart TD
    A[Recepção CROSS] --> B[Triagem Incongruências]
    B --> C{Contato com Sucesso?}
    C -- Sim --> D[Gravado no CROSS]
    C -- Não --> E[Fila Alternativa]
    D --> F[Fim]
    E --> F`,
    final_markdown: `# POPI — Procedimento Operativo Padrão Inteligente
| IDENTIFICAÇÃO DA ROTINA MAPEADA |  |
| :---- | :---- |
| **Número do Relatório:** | Secretaria Saúde - Nº 001 - 2026 |
| **Nome da Rotina de Trabalho:** | Central de Agendamentos Médicos |
| **Secretaria / Departamento / Divisão:** | Saúde / Urbam / UTC / Divisão de Especialidades Clínicas |
| **Responsável pela Rotina:** | Gerente de Atendimento |
| **Ano:** | 2026 |
| **Categoria da Rotina:** | Atendimento ao cidadão |

---

# PARTE 1 — PROCEDIMENTO OPERACIONAL PADRÃO AS-IS

## 1 — Objetivo e contexto do processo
Padronizar a rotina de recepção, contato técnico e agendamento de consultas médicas especializadas da rede municipal, visando reduzir as taxas de absenteísmo (faltas) e otimizar as cotas do município operadas sob o sistema CROSS estadual.

## 2 — Responsabilidades e Papéis
- **Auxiliar Administrativo**: Triar dados e cadastros residuais do sistema estadual.
- **Equipe de Agendamento (Backoffice)**: Realizar ligações telefônicas ativas de confirmação.

## 3 — Referências normativas
Portaria de Regulação do SUS Municipal Nº 124/2019 e regulamentos de telessaúde.

## 4 — Termos e definições
- **CROSS**: Central de Regulação de Ofertas de Serviços de Saúde.
- **SAMS**: Sistema de Apoio ao Planejamento e Gestão do SUS.

## 5 — Descrição da rotina de trabalho — passo a passo
**Gatilho Inicial:** Sistema CROSS ou encaminhamento clínico do posto municipal
**Frequência de Execução:** Diariamente
**Tempo Médio de Execução Estimado:** 15 a 30 minutos

**Sequência Lógica do Fluxo:**
1. **Extração de cotas do CROSS**: O Auxiliar Administrativo exporta dados para planilhas organizadas.
2. **Confirmação telefônica**: A Equipe realiza contato ativo com pacientes prioritários na fila de espera.
3. **Confirmação no sistema**: O Auxiliar registra a vaga no CROSS, enviando SMS.

## 6 — Medição e controle
*Aproveitamento de vagas*: Meta mínima de 96% de aproveitamento medida semanalmente via relatórios de ocupação.

## 7 — Fluxograma AS-IS
\`\`\`mermaid
flowchart TD
    A[Recepção CROSS] --> B[Triagem Incongruências]
    B --> C{Contato com Sucesso?}
    C -- Sim --> D[Gravado no CROSS]
    C -- Não --> E[Fila Alternativa]
    D --> F[Fim]
    E --> F
\`\`\`

---

# PARTE 2 — ANÁLISE DE GARGALOS E PROPOSTAS DE MELHORIA TO-BE

## 1 — Contexto operacional
A atividade opera com carga considerável de ligações manuais e sofre com falta de integração de sistemas, levando as vagas de especialistas ao desperdício operacional recorrente.

## 2 — Relatório de gargalos
Cadastros desatualizados e redigitação de fichas administrativas entre SAMS e CROSS.

## 3 — Diretrizes para transformação
Integração via APIs de saúde e bots automáticos para confirmação de agendamentos.

---

# LACUNAS PARA VALIDAÇÃO COM A ÁREA
1. Quais são as principais causas de dados cadastrais desatualizados na ponta (Posto UBS)?
2. Há flexibilidade na portaria para aprovar soluções de chatbots conversacionais?
`,
    last_generated_at: "2026-06-07T10:00:00Z",
    last_manual_edit_at: null,
  },
  "popi-2": {
    pop_markdown: `# Procedimento Operacional Padrão (POP) — Abertura de Licitações

## 1 — Objetivo
Garantir celeridade e conformidade regulamentar na instauração e validação de editais públicos licitatórios da prefeitura municipal.
`,
    intelligent_report_markdown: `# Relatório Inteligente — Abertura de Licitações

## 1 — Gargalos
Excesso de refação decorrente de erros materiais cometidos por proponentes internos na confecção do Termo de Referência.
`,
    flowchart_mermaid: `flowchart TD
    A[TR Recebido] --> B[Checklist de Validade]
    B --> C{Conforme?}
    C -- Sim --> D[Enviar Diário]
    C -- Não --> E[Devolver Área]
    D --> F[Fim]
    E --> F`,
    final_markdown: `# POPI — Processo Licitatório
| IDENTIFICAÇÃO DA ROTINA MAPEADA |  |
| :---- | :---- |
| **Número do Relatório:** | Secretaria Gestão - Nº 001 - 2026 |
| **Nome da Rotina de Trabalho:** | Abertura de Processos de Licitação |
| **Secretaria / Departamento / Divisão:** | Gestão / Comissões de Licitatórias / Gerência de Suprimentos |
| **Responsável pela Rotina:** | Pregoeiro Assistente |
| **Ano:** | 2026 |
| **Categoria da Rotina:** | Processo de gestão |

---

# PARTE 1 — PROCEDIMENTO OPERACIONAL PADRÃO AS-IS
Mapeamento inicial de rotinas licitatórias sob a Lei 14.133/2021.
`,
    last_generated_at: "2026-06-06T18:40:00Z",
    last_manual_edit_at: null,
  },
};
