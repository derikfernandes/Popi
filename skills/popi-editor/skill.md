---
name: popi-editor
description: Use esta skill para editar POPIs existentes a qualquer momento, preservando histórico, número, secretaria e regras de versionamento.
triggers:
  - editar POPI
  - alterar relatório
  - corrigir POP
  - modificar fluxograma
  - editar documento aprovado
inputs:
  - specs/01_DOMAIN_MODEL.md
  - specs/02_USER_FLOWS.md
  - specs/05_ACTION_ROUTING_MAP.md
  - prompts/04_editar_popi.md
outputs:
  - documento revisado
  - partes impactadas
  - recomendação de regeração
  - registro de versão
runtime_tools: []
---

# Skill — POPI Editor

## 1. Objetivo

Aplicar edições em um POPI existente, independentemente do status atual.

Regra central:

> O usuário poderá editar o POPI a qualquer momento.

## 2. Regras obrigatórias

- Aplicar apenas a alteração solicitada.
- Não reescrever o documento inteiro se o usuário pediu alteração pontual.
- Não inventar informações.
- Preservar número do relatório.
- Preservar secretaria e ano.
- Preservar conteúdo não afetado.
- Sinalizar impactos em fluxograma, riscos, indicadores, categorias ou recomendações.
- Gerar registro de versão.
- Não bloquear edição por status.

## 3. Status editáveis

```text
rascunho
gerado
em_edicao
em_revisao
aprovado
arquivado
```

Para `aprovado` e `arquivado`, verificar permissão.

## 4. Procedimento

1. Ler solicitação do usuário.
2. Identificar parte afetada.
3. Aplicar alteração pontual.
4. Verificar impactos indiretos.
5. Recomendar regeração se necessário.
6. Preparar saída revisada.
7. Registrar versão.

## 5. Saída esperada

```text
Alteração realizada
Partes impactadas
Regeração recomendada
Documento revisado
```

## 6. Checklist

- [ ] A edição solicitada foi aplicada.
- [ ] O restante foi preservado.
- [ ] Número não foi alterado indevidamente.
- [ ] Secretaria e ano foram preservados.
- [ ] Impactos foram sinalizados.
- [ ] Nova versão deve ser criada.
