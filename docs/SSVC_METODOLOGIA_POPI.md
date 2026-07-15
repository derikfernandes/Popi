# Metodologia SSVC aplicada ao POPI Generator

## 1. Visão geral

O projeto POPI Generator usa a metodologia **SSVC — Skill-Spec Vibe Coding**.

A metodologia combina:

1. **Spec-Driven Development**: primeiro a especificação, depois o código.
2. **Agent Skills**: competências reutilizáveis para orientar agentes de IA.
3. **Vibe Coding controlado**: velocidade de desenvolvimento com critérios, limites e verificação.

## 2. Regra principal

```text
Sem spec, não codar.
Sem teste ou critério de aceite, não aceitar.
Sem Action Routing Map, não decidir fonte de dados.
Sem QA, não concluir.
```

## 3. Fluxo obrigatório

```text
1. Entender o pedido
2. Consultar catálogo de Skills
3. Escolher Skill principal e auxiliares
4. Ler specs relevantes
5. Atualizar spec, testes e tarefas, se necessário
6. Implementar a menor fatia possível
7. Verificar contra a spec
8. Documentar
9. Avaliar melhoria da Skill
```

## 4. Skills iniciais do projeto

| Skill | Uso |
|---|---|
| popi-generator | Gerar POPI completo. |
| popi-editor | Editar POPI a qualquer momento. |
| popi-classifier | Categorizar rotina e melhorias. |
| popi-qa-verifier | Revisar POPI de forma adversarial. |

## 5. Artefatos de spec

```text
specs/00_PROJECT_OVERVIEW.md
specs/01_DOMAIN_MODEL.md
specs/02_USER_FLOWS.md
specs/03_DATA_MODEL.md
specs/04_API_CONTRACT.md
specs/05_ACTION_ROUTING_MAP.md
specs/06_INTEGRATIONS.md
specs/07_ACCEPTANCE.md
specs/08_OUT_OF_SCOPE.md
specs/09_DECISIONS.md
specs/TASKS.md
specs/tests.yaml
```

## 6. Como trabalhar neste projeto

Antes de implementar qualquer funcionalidade:

1. Verificar se a funcionalidade está em `TASKS.md`.
2. Verificar se a regra existe nas specs.
3. Verificar fonte de dados no `05_ACTION_ROUTING_MAP.md`.
4. Verificar se não está fora de escopo.
5. Verificar decisões existentes.
6. Escolher a Skill correta.
7. Implementar apenas uma fatia pequena.
8. Rodar QA.

## 7. Regra de aprendizado contínuo

Ao final de cada tarefa:

```text
Esta tarefa gerou aprendizado para melhorar alguma Skill?
```

Se sim, atualizar:

- skill.md;
- checklist;
- prompt;
- tests.yaml;
- TASKS.md;
- docs.

## 8. Aplicação direta no POPI

O POPI é ideal para SSVC porque:

- possui regras claras de negócio;
- depende de documentos bem estruturados;
- exige rastreabilidade;
- precisa de prompts consistentes;
- deve permitir edição humana;
- pode evoluir com Skills reutilizáveis.

## 9. Regra final

> Toda entrega deve melhorar o produto ou melhorar a capacidade futura do agente.
