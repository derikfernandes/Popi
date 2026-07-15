# TASKS — POPI Generator

## Fase 0 — Fundação metodológica

- [x] Criar README inicial.
- [x] Criar specs principais.
- [x] Registrar decisões arquiteturais iniciais.
- [x] Definir Action Routing Map.
- [x] Criar prompts operacionais.
- [x] Criar Skills iniciais.

## Fase 1 — Estrutura do produto

- [x] Definir stack técnica.
- [x] Criar projeto base.
- [x] Configurar ambiente de desenvolvimento.
- [x] Configurar autenticação básica.
- [x] Criar layout inicial.
- [x] Criar navegação principal.

## Fase 2 — Cadastro de POPI

- [x] Criar tela de listagem de POPIs.
- [x] Criar tela Novo POPI.
- [x] Criar cadastro de secretaria.
- [x] Implementar geração de número por secretaria e ano.
- [x] Criar status inicial `rascunho`.
- [x] Criar versão inicial ao criar POPI.

Critérios de conclusão:

- Usuário cria POPI.
- POPI recebe número único.
- POPI aparece na listagem.

## Fase 3 — Roteiro interno

- [x] Criar formulário interno com blocos de perguntas.
- [x] Permitir salvar rascunho incompleto.
- [x] Permitir editar dados a qualquer momento.
- [x] Registrar versão quando dados relevantes forem alterados.
- [x] Marcar necessidade de regeração quando dados forem alterados após geração.

Critérios de conclusão:

- Usuário preenche roteiro sem depender de Google Forms.
- Usuário salva e edita dados livremente.

## Fase 4 — Classificação

- [x] Criar lista de categorias da rotina.
- [x] Criar lista de categorias de melhoria.
- [x] Implementar classificação manual.
- [x] Implementar sugestão por IA.
- [x] Permitir edição da classificação sugerida.

Critérios de conclusão:

- POPI possui categoria principal e categorias de melhoria.
- Usuário pode alterar a classificação.

## Fase 5 — Geração por IA

- [x] Implementar prompt de geração completa.
- [x] Implementar geração do POP.
- [x] Implementar geração do relatório inteligente.
- [x] Implementar geração do fluxograma Mermaid.
- [x] Implementar geração do documento final Markdown.
- [x] Implementar QA automático.

Critérios de conclusão:

- Sistema gera documento POPI completo.
- Documento pode ser editado depois.
- Conteúdo gerado respeita dados preenchidos.

## Fase 6 — Edição a qualquer momento

- [x] Criar editor para POP.
- [x] Criar editor para relatório inteligente.
- [x] Criar editor para fluxograma.
- [x] Criar editor de categorias e metadados.
- [x] Permitir edição em todos os status.
- [x] Bloquear alteração de número para usuário comum.
- [x] Criar confirmação antes de sobrescrever edição manual com IA.

Critérios de conclusão:

- Usuário consegue editar qualquer parte do POPI a qualquer momento.
- Sistema registra versão a cada alteração relevante.

## Fase 7 — Versionamento

- [x] Criar histórico de versões.
- [x] Permitir visualizar versão anterior.
- [x] Permitir comparar versões.
- [x] Permitir restaurar versão.
- [x] Restaurar versão deve criar nova versão.

Critérios de conclusão:

- Nenhuma alteração relevante se perde.
- Usuário consegue recuperar versões anteriores.

## Fase 8 — Revisão e aprovação

- [x] Criar ação Enviar para revisão.
- [x] Criar ação Aprovar POPI.
- [x] Criar ação Arquivar POPI.
- [x] Permitir edição pós-aprovação com nova versão.

Critérios de conclusão:

- POPI pode passar por ciclo de revisão sem perder editabilidade.

## Fase 9 — Exportação

- [x] Exportar Markdown.
- [x] Exportar PDF (Simulado via print corporativo/HTML).
- [x] Exportar DOCX (Simulado via download limpo).
- [x] Nomear arquivo com número do relatório.

Critérios de conclusão:

- Usuário baixa documento final.

## Fase 10 — QA e melhoria das Skills

- [x] Executar QA adversarial contra specs.
- [x] Atualizar Skills com aprendizados.
- [x] Criar scripts de validação se tarefas se repetirem.
- [x] Revisar critérios de aceite.

## Pendências de decisão

- [x] Definir stack técnica.
- [x] Definir banco de dados.
- [x] Definir provedor de IA.
- [x] Definir formato de autenticação.
- [x] Definir permissões detalhadas por perfil.
- [x] Definir se número é gerado na criação ou apenas na primeira geração do documento.
