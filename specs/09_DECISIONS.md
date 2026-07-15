# 09 — Decisions

## DEC-001 — O sistema não terá integração com Google Forms

**Status:** aprovado

**Decisão:** o sistema POPI terá formulário interno próprio. O Google Forms usado na concepção do projeto servirá apenas como referência para as perguntas.

**Justificativa:** o objetivo é criar uma plataforma própria de gestão de POPIs, com edição, versionamento, categorização, numeração e geração por IA.

**Impacto:** todos os dados devem ser preenchidos diretamente no sistema.

---

## DEC-002 — O POPI é documento vivo e editável a qualquer momento

**Status:** aprovado

**Decisão:** o usuário poderá editar o POPI em qualquer etapa do ciclo de vida.

**Justificativa:** o documento deve apoiar trabalho real de revisão, correção e melhoria contínua. A IA gera versões, mas o usuário mantém controle final.

**Impacto:** o sistema deve permitir edição em rascunho, gerado, em edição, em revisão, aprovado e arquivado, respeitando permissões.

---

## DEC-003 — Toda edição relevante deve gerar histórico de versão

**Status:** aprovado

**Decisão:** alterações relevantes devem gerar registro em `popi_versions`.

**Justificativa:** como o documento pode ser editado a qualquer momento, é necessário preservar rastreabilidade.

**Impacto:** edição manual, geração por IA, regeração, alteração de status, alteração de categoria e restauração devem criar versões.

---

## DEC-004 — Numeração por secretaria e ano

**Status:** aprovado

**Decisão:** cada POPI terá número no formato:

```text
Secretaria [NOME DA SECRETARIA] - Nº [SEQUENCIAL] - [ANO]
```

A sequência será independente por secretaria e ano.

**Justificativa:** permite controle institucional e organização dos relatórios por secretaria.

**Impacto:** o sistema precisa manter contador transacional por secretaria e ano.

---

## DEC-005 — A IA não pode sobrescrever edição manual sem confirmação

**Status:** aprovado

**Decisão:** qualquer regeração por IA que possa substituir conteúdo editado manualmente deve exigir confirmação do usuário.

**Justificativa:** o usuário deve manter autoridade sobre o documento.

**Impacto:** o sistema deve detectar edição manual ou, no mínimo, exibir confirmação antes de regerar partes já alteradas.

---

## DEC-006 — Categorias são sugeridas pela IA, mas editáveis pelo usuário

**Status:** aprovado

**Decisão:** o sistema poderá sugerir categoria da rotina e categorias de melhoria, mas o usuário poderá alterar.

**Justificativa:** a IA auxilia na classificação, mas a decisão final é humana.

**Impacto:** a classificação deve ser salva em campo editável.

---

## DEC-007 — Markdown como formato base do documento

**Status:** aprovado

**Decisão:** o conteúdo do POPI será estruturado inicialmente em Markdown.

**Justificativa:** Markdown é simples, versionável, compatível com IA, fácil de exportar e alinhado à preferência de documentação do projeto.

**Impacto:** POP, relatório inteligente e documento final devem ser armazenados em Markdown, com fluxograma em Mermaid.

---

## DEC-008 — Mermaid como formato base para fluxograma

**Status:** aprovado

**Decisão:** o fluxograma será gerado inicialmente em Mermaid.

**Justificativa:** Mermaid é textual, versionável e pode ser renderizado em interfaces modernas.

**Impacto:** o sistema deve armazenar `flowchart_mermaid` e validar sintaxe quando possível.

---

## DEC-009 — SSVC como metodologia do projeto

**Status:** aprovado

**Decisão:** o projeto seguirá a metodologia SSVC — Skill-Spec Vibe Coding.

**Justificativa:** o sistema será desenvolvido com apoio de IA, mas com especificação, critérios de aceite, Action Routing Map, QA e Skills.

**Impacto:** antes de implementar funcionalidades, specs, tarefas e critérios de aceite devem estar atualizados.
