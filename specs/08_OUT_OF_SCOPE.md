# 08 — Out of Scope

## 1. Objetivo

Este arquivo registra o que **não deve ser implementado** no escopo inicial do sistema POPI.

A IA ou o desenvolvedor não devem adicionar funcionalidades fora deste escopo sem atualizar a spec e registrar decisão em `09_DECISIONS.md`.

## 2. Fora de escopo inicial

### 2.1. Integração com Google Forms

O sistema não deve se conectar ao Google Forms.

O Forms foi usado apenas como referência para o roteiro de perguntas.

### 2.2. Integração com Google Sheets

O sistema não deve depender de planilhas do Google Sheets para receber dados.

### 2.3. Integração automática com sistemas municipais

Não implementar integração automática com:

- SAMS;
- ESAMS;
- CROSS;
- Agenda Saúde;
- SIPEX;
- sistemas de protocolo;
- sistemas administrativos internos;
- bases de indicadores oficiais.

### 2.4. Execução automática de melhorias

O sistema pode recomendar automações e melhorias, mas não deve executar automaticamente mudanças em sistemas externos.

### 2.5. Aprovação jurídica automática

O sistema não substitui análise jurídica, normativa ou de controle interno.

### 2.6. Publicação automática

O sistema não deve publicar documentos automaticamente em portal, intranet ou sistema oficial sem revisão humana.

### 2.7. Assinatura digital

Assinatura digital ou fluxo formal de assinatura não faz parte do escopo inicial.

### 2.8. Processo administrativo formal

O POPI não deve, no escopo inicial, abrir processo administrativo automaticamente.

### 2.9. Chatbot público

Não faz parte do escopo inicial criar chatbot para cidadão consultar POPIs.

### 2.10. Controle completo de permissões avançadas

Permissões básicas são necessárias, mas um sistema complexo de perfis, alçadas e auditoria jurídica avançada fica fora do escopo inicial.

## 3. O que a IA não deve fazer

- Inventar informações ausentes.
- Criar normas que não foram informadas.
- Criar sistemas não mencionados.
- Criar responsáveis nominais.
- Transformar hipótese em fato.
- Sobrescrever edição manual sem confirmação.
- Alterar número do relatório sem permissão explícita.
- Bloquear edição apenas porque o POPI foi gerado.

## 4. Funcionalidades futuras possíveis

Estas funcionalidades podem ser consideradas depois, mas exigem nova spec:

- importação de dados antigos de Forms;
- integração com Drive;
- integração com Google Docs;
- assinatura digital;
- workflow formal de aprovação;
- dashboards de indicadores;
- conexão com bases reais para medir metas;
- integração com sistemas administrativos;
- agentes de automação para executar melhorias;
- biblioteca pública de POPIs aprovados;
- comparação entre rotinas semelhantes;
- análise transversal por secretaria.
