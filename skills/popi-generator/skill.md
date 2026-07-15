---
name: popi-generator
description: Use esta skill para gerar POPI — Procedimento Operativo Padrão Inteligente — a partir dos dados preenchidos no sistema.
triggers:
  - gerar POPI
  - gerar POP
  - gerar relatório inteligente
  - criar procedimento inteligente
  - transformar rotina em POPI
inputs:
  - specs/00_PROJECT_OVERVIEW.md
  - specs/01_DOMAIN_MODEL.md
  - specs/02_USER_FLOWS.md
  - specs/05_ACTION_ROUTING_MAP.md
  - prompts/03_gerar_popi_completo.md
outputs:
  - POP em Markdown
  - fluxograma Mermaid
  - relatório inteligente em Markdown
  - documento POPI consolidado
runtime_tools: []
---

# Skill — POPI Generator

## 1. Objetivo

Gerar um **POPI — Procedimento Operativo Padrão Inteligente** a partir dos dados preenchidos pelo usuário no sistema.

O POPI deve conter:

1. Parte 1 — Procedimento Operativo Padrão.
2. Parte 2 — Relatório Inteligente da Rotina.
3. Fluxograma em Mermaid.
4. Categorias da rotina e de melhoria.
5. Lacunas de informação.
6. Recomendações.

## 2. Regras obrigatórias

- Não usar Google Forms como fonte de dados.
- Usar apenas dados preenchidos no sistema.
- Não inventar informações.
- Registrar lacunas quando faltar dado.
- Não citar nomes de pessoas físicas quando puder usar cargos, funções ou setores.
- Preservar número do relatório.
- Preservar secretaria e ano.
- Gerar conteúdo em Markdown.
- Gerar fluxograma em Mermaid.
- Diferenciar fato informado de inferência técnica.

## 3. Procedimento

1. Ler dados do POPI.
2. Confirmar número, secretaria, ano e categoria.
3. Normalizar dados quando necessário.
4. Gerar POP com estrutura formal.
5. Gerar fluxograma fiel ao passo a passo.
6. Gerar relatório inteligente.
7. Registrar lacunas.
8. Preparar conteúdo editável.
9. Encaminhar para QA adversarial.

## 4. Estrutura de saída

```text
POPI
├── Cabeçalho
├── Parte 1 — POP
├── Fluxograma
├── Parte 2 — Relatório Inteligente
└── Lacunas e perguntas para validação
```

## 5. Checklist

Antes de concluir:

- [ ] O número do relatório aparece corretamente.
- [ ] O POP usa apenas dados informados.
- [ ] O relatório não inventa fatos.
- [ ] O fluxograma tem início e fim.
- [ ] Há lacunas registradas.
- [ ] O conteúdo está em Markdown.
- [ ] O documento pode ser editado pelo usuário.

## 6. Aprendizado contínuo

Ao final de cada uso, avaliar:

- O prompt foi suficiente?
- Faltou algum campo no roteiro?
- O fluxograma ficou consistente?
- Houve recomendação genérica demais?
- Alguma regra deve virar checklist ou script?
