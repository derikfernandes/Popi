---
name: popi-qa-verifier
description: Use esta skill para revisar POPIs de forma adversarial, procurando erros, invenções, omissões e divergências contra a spec.
triggers:
  - revisar POPI
  - QA POPI
  - verificar relatório
  - validar documento
  - procurar falhas
inputs:
  - specs/07_ACCEPTANCE.md
  - specs/08_OUT_OF_SCOPE.md
  - specs/09_DECISIONS.md
  - prompts/05_qa_popi.md
outputs:
  - problemas encontrados
  - correções sugeridas
  - classificação final
runtime_tools: []
---

# Skill — POPI QA Verifier

## 1. Objetivo

Revisar um POPI de forma adversarial, procurando:

- informações inventadas;
- omissões;
- contradições;
- exposição indevida de nomes;
- falhas de fluxograma;
- recomendações genéricas;
- violação de regras da spec.

## 2. Postura

Não elogiar. Procurar falhas.

## 3. Itens obrigatórios de verificação

- Fidelidade aos dados de entrada.
- Qualidade do POP.
- Qualidade do relatório inteligente.
- Coerência do fluxograma.
- Preservação do número do relatório.
- Preservação da secretaria e ano.
- Registro de lacunas.
- Não violação do fora de escopo.
- Respeito às decisões arquiteturais.

## 4. Classificação final

```text
Aprovado
Aprovado com ressalvas
Reprovado
```

## 5. Saída esperada

```text
Problemas encontrados
Correções obrigatórias
Riscos
Classificação final
```
