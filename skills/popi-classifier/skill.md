---
name: popi-classifier
description: Use esta skill para classificar rotinas e categorias de melhoria em POPIs.
triggers:
  - categorizar POPI
  - classificar rotina
  - sugerir categoria
  - classificar melhoria
inputs:
  - specs/01_DOMAIN_MODEL.md
  - prompts/02_categorizar_popi.md
outputs:
  - categoria principal da rotina
  - categorias de melhoria
  - justificativas
  - nível de confiança
runtime_tools: []
---

# Skill — POPI Classifier

## 1. Objetivo

Classificar uma rotina em uma categoria principal e identificar categorias de melhoria.

## 2. Categorias da rotina

```text
Atendimento ao cidadão
Rotina interna administrativa
Processo de gestão
Processo de fiscalização
Processo financeiro/orçamentário
Processo jurídico/normativo
Processo de saúde
Processo educacional
Processo operacional
Processo tecnológico/sistemas
Outro
```

## 3. Categorias de melhoria

```text
Automação simples
Integração entre sistemas
Redução de retrabalho
Melhoria de atendimento ao cidadão
Melhoria de controle interno
Melhoria de indicadores
Padronização de procedimento
Revisão normativa
Uso potencial de IA
Digitalização de processo
```

## 4. Regras

- Escolher apenas uma categoria principal.
- Escolher de uma a cinco categorias de melhoria.
- Justificar cada escolha.
- Não inventar informações.
- Usar `Outro` quando não houver informação suficiente.
- A classificação é sugestiva e deve ser editável pelo usuário.

## 5. Saída esperada

```json
{
  "categoria_rotina": "",
  "justificativa_categoria_rotina": "",
  "categorias_melhoria": [],
  "nivel_confianca": "baixo | médio | alto",
  "lacunas_para_classificacao": []
}
```
