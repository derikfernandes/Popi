# 00 — Project Overview: Sistema POPI

## 1. Nome do projeto

**POPI Generator** — Sistema de criação e gestão de Procedimentos Operativos Padrão Inteligentes.

## 2. Objetivo

Construir um sistema para criação, geração, edição, categorização, numeração, versionamento e exportação de **POPI — Procedimento Operativo Padrão Inteligente**.

O POPI deve reunir duas partes principais:

1. **Procedimento Operativo Padrão — POP**: documento formal da rotina, com objetivo, responsáveis, sistemas, informações necessárias, passo a passo, fluxograma e indicadores.
2. **Relatório Inteligente da Rotina**: diagnóstico técnico com gargalos, riscos, oportunidades de automação, simplificação, indicadores recomendados e priorização de melhorias.

## 3. Contexto

O sistema foi idealizado para apoiar o mapeamento de rotinas de trabalho da Prefeitura de São José dos Campos, transformando respostas estruturadas sobre processos em documentos úteis para padronização, controle interno, melhoria contínua e automação futura.

O Google Forms usado anteriormente serviu apenas como referência para o roteiro de perguntas. O sistema **não terá integração com Google Forms**. Todos os dados deverão ser preenchidos diretamente no sistema.

## 4. Usuários

- Servidor responsável por informar a rotina.
- Equipe da Controladoria.
- Equipe de processos.
- Gestores das secretarias.
- Equipe de automação, dados e transformação digital.
- Revisores autorizados.

## 5. Resultado esperado

Ao final do fluxo, o sistema deve gerar um documento POPI com:

- número do relatório;
- secretaria responsável;
- categoria da rotina;
- categorias de melhoria;
- POP estruturado;
- fluxograma;
- relatório inteligente;
- lacunas de informação;
- perguntas para validação;
- histórico de versões.

## 6. Regra principal

> O POPI é um documento vivo. A IA gera uma versão, mas o usuário pode editar, corrigir, complementar, revisar e regerar partes específicas a qualquer momento.

## 7. Princípios do sistema

- O sistema deve ser simples para o usuário preencher.
- A IA não pode inventar informações.
- Informações ausentes devem ser registradas como lacunas.
- O usuário deve conseguir editar o POPI a qualquer momento.
- Toda edição relevante deve gerar histórico de versão.
- A numeração deve ser automática, única por secretaria e ano.
- A categoria sugerida pela IA deve ser editável.
- O documento final deve ter linguagem institucional, objetiva e compreensível.

## 8. Metodologia adotada

Este projeto usa a metodologia **SSVC — Skill-Spec Vibe Coding**:

```text
Ideia → Spec → Testes → Tarefas → Skill → Implementação → Verificação → Documentação → Melhoria da Skill
```

Regras operacionais:

- Sem spec, não codar.
- Sem critério de aceite, não aceitar.
- Sem Action Routing Map, não decidir fonte de dados.
- Sem QA, não concluir.
