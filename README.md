# POPI Generator

Sistema para criação, edição, categorização, numeração e geração de **POPI — Procedimento Operativo Padrão Inteligente**.

O POPI é um documento vivo que combina:

1. **Procedimento Operativo Padrão — POP**: descrição formal da rotina, responsáveis, sistemas, documentos, passo a passo, fluxograma, indicadores e pontos de atenção.
2. **Relatório Inteligente da Rotina**: diagnóstico técnico com gargalos, riscos operacionais, oportunidades de automação, simplificação, indicadores recomendados e priorização de melhorias.

Este repositório está organizado com base na metodologia **SSVC — Skill-Spec Vibe Coding**, que combina:

- **Spec-Driven Development**: primeiro a especificação, depois o código.
- **Agent Skills**: competências reutilizáveis para orientar agentes de IA.
- **Vibe Coding controlado**: velocidade de desenvolvimento com limites, critérios de aceite e verificação.

## Regra principal

> O sistema não terá conexão com Google Forms. O roteiro do Forms foi usado apenas como referência. Todos os dados serão preenchidos diretamente no sistema.

## Funcionalidades previstas

- Criar novo POPI.
- Preencher roteiro interno da rotina.
- Categorizar o relatório.
- Gerar número automático por secretaria e ano.
- Gerar POP com fluxograma.
- Gerar relatório inteligente.
- Editar o POPI a qualquer momento.
- Salvar histórico de versões.
- Regerar partes específicas com IA.
- Exportar o documento final.

## Regra de numeração

Formato:

```text
Secretaria [NOME DA SECRETARIA] - Nº [SEQUENCIAL] - [ANO]
```

Exemplos:

```text
Secretaria Saúde - Nº 001 - 2026
Secretaria Saúde - Nº 002 - 2026
Secretaria Governança - Nº 001 - 2026
```

A sequência é independente por secretaria e por ano.

## Estrutura inicial

```text
/specs      Especificações do sistema
/skills     Agent Skills do projeto
/docs       Documentação de apoio
/prompts    Prompts operacionais do POPI
```

## Filosofia do projeto

O POPI não é apenas um documento. Ele é uma peça metodológica para transformar cada rotina mapeada em três coisas ao mesmo tempo:

1. procedimento formal;
2. diagnóstico de eficiência;
3. base para automação futura.
