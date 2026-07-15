# 07 — Acceptance Criteria

## 1. Critérios gerais

O sistema só pode ser considerado aceito quando permitir:

- criar novo POPI;
- preencher roteiro interno;
- gerar número automático;
- categorizar a rotina;
- gerar POP;
- gerar fluxograma;
- gerar relatório inteligente;
- editar a qualquer momento;
- salvar histórico de versões;
- exportar documento final.

## 2. Criação de POPI

- [ ] O usuário consegue criar um novo POPI.
- [ ] O sistema exige a seleção de uma secretaria.
- [ ] O sistema gera número automático no padrão definido.
- [ ] O POPI criado inicia com status `rascunho`.
- [ ] O sistema cria registro inicial no histórico de versões.

## 3. Numeração

- [ ] O número segue o formato: `Secretaria [NOME] - Nº [000] - [ANO]`.
- [ ] A sequência é independente por secretaria.
- [ ] A sequência é independente por ano.
- [ ] O número não se repete para a mesma secretaria e ano.
- [ ] O contador é atualizado de forma segura.
- [ ] Usuário comum não consegue alterar o número.
- [ ] Usuário autorizado consegue corrigir número em caso excepcional, com registro de versão.

## 4. Preenchimento do roteiro

- [ ] O sistema possui formulário interno próprio.
- [ ] O sistema não depende de Google Forms.
- [ ] O usuário consegue salvar rascunho com campos incompletos.
- [ ] O sistema registra lacunas quando houver informações faltantes.
- [ ] O usuário consegue editar dados de entrada a qualquer momento.

## 5. Categorias

- [ ] O sistema sugere uma categoria principal da rotina.
- [ ] O sistema sugere categorias de melhoria.
- [ ] O usuário consegue editar a categoria principal.
- [ ] O usuário consegue editar categorias de melhoria.
- [ ] A classificação possui justificativa quando gerada por IA.

## 6. Geração do POPI

- [ ] O sistema gera Parte 1 — POP.
- [ ] O sistema gera Parte 2 — Relatório Inteligente.
- [ ] O sistema gera fluxograma em Mermaid.
- [ ] O sistema gera documento consolidado em Markdown.
- [ ] O sistema não inventa informações.
- [ ] O sistema registra lacunas de informação.
- [ ] O sistema diferencia fatos informados de inferências técnicas.

## 7. Edição a qualquer momento

- [ ] O usuário consegue editar POPI em status `rascunho`.
- [ ] O usuário consegue editar POPI em status `gerado`.
- [ ] O usuário consegue editar POPI em status `em_edicao`.
- [ ] O usuário consegue editar POPI em status `em_revisao`.
- [ ] O usuário autorizado consegue editar POPI em status `aprovado`.
- [ ] O usuário autorizado consegue editar POPI em status `arquivado`.
- [ ] O usuário consegue editar dados de entrada depois da geração.
- [ ] O usuário consegue editar manualmente o POP.
- [ ] O usuário consegue editar manualmente o relatório inteligente.
- [ ] O usuário consegue editar manualmente o fluxograma.
- [ ] O usuário consegue editar categorias e recomendações.

## 8. Regeração parcial

Quando dados de origem forem alterados após geração:

- [ ] O sistema avisa que há impacto potencial no documento.
- [ ] O sistema permite apenas salvar a alteração.
- [ ] O sistema permite regerar apenas o POP.
- [ ] O sistema permite regerar apenas o relatório inteligente.
- [ ] O sistema permite regerar apenas o fluxograma.
- [ ] O sistema permite regerar o documento inteiro.
- [ ] O sistema não sobrescreve edição manual sem confirmação.

## 9. Versionamento

- [ ] Toda edição relevante gera nova versão.
- [ ] Cada versão registra usuário, data, tipo de alteração e campos alterados.
- [ ] O usuário consegue visualizar histórico de versões.
- [ ] O usuário consegue restaurar uma versão anterior.
- [ ] Restaurar versão cria nova versão atual.
- [ ] O histórico anterior não é apagado.

## 10. Revisão e aprovação

- [ ] O usuário consegue enviar POPI para revisão.
- [ ] O revisor consegue editar ou comentar.
- [ ] O revisor consegue aprovar.
- [ ] A aprovação gera versão.
- [ ] Edições após aprovação geram nova versão pós-aprovação.

## 11. Exportação

- [ ] O usuário consegue exportar em Markdown.
- [ ] O sistema está preparado para exportar em PDF.
- [ ] O sistema está preparado para exportar em DOCX.
- [ ] O arquivo exportado contém número do relatório.
- [ ] O arquivo exportado contém secretaria, ano e categoria.
- [ ] O arquivo exportado contém POP, fluxograma e relatório inteligente.

## 12. Critérios de qualidade da IA

- [ ] A IA não cita nomes de pessoas físicas quando puder usar cargos ou setores.
- [ ] A IA não cria leis, normas ou sistemas não informados.
- [ ] A IA não transforma sugestão em fato.
- [ ] A IA sinaliza incertezas.
- [ ] A IA mantém linguagem institucional.
- [ ] A IA produz recomendações compatíveis com gestão pública.

## 13. Critério de aceite metodológico SSVC

Antes de implementar uma funcionalidade:

- [ ] Existe spec relacionada.
- [ ] Existe critério de aceite.
- [ ] Existe tarefa em `TASKS.md`.
- [ ] A ação está no `05_ACTION_ROUTING_MAP.md`.
- [ ] Não viola `08_OUT_OF_SCOPE.md`.
- [ ] Decisões relevantes estão registradas em `09_DECISIONS.md`.

Antes de concluir:

- [ ] QA adversarial executado.
- [ ] Documentação atualizada.
- [ ] Aprendizado para Skills avaliado.
