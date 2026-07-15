# 06 — Integrations

## 1. Escopo inicial

O sistema POPI **não terá integração com Google Forms**.

O Forms usado na concepção do projeto serviu apenas como referência para o roteiro de perguntas. Todos os dados deverão ser preenchidos diretamente dentro do sistema.

## 2. Integrações previstas no escopo inicial

### 2.1. Serviço de IA

O sistema poderá se integrar a um provedor de LLM para:

- normalizar dados preenchidos;
- sugerir categoria da rotina;
- sugerir categorias de melhoria;
- gerar POP;
- gerar fluxograma Mermaid;
- gerar relatório inteligente;
- revisar qualidade do POPI;
- editar trechos específicos sob comando do usuário.

A integração com IA deve obedecer às regras:

1. Não inventar informações.
2. Registrar lacunas quando faltar dado.
3. Não sobrescrever edição manual sem confirmação.
4. Diferenciar fato informado de inferência técnica.
5. Preservar número, secretaria e ano, salvo permissão específica.

### 2.2. Exportação de documentos

Formatos previstos:

```text
Markdown
PDF
DOCX
```

A exportação deve usar o `final_markdown` ou gerar documento consolidado a partir das partes editáveis.

## 3. Integrações fora de escopo inicial

As seguintes integrações estão fora do escopo inicial:

- Google Forms;
- Google Sheets;
- SAMS;
- ESAMS;
- CROSS;
- Agenda Saúde;
- SIPEX;
- sistemas municipais internos;
- assinatura digital;
- protocolo/processo administrativo;
- envio automático por e-mail;
- publicação automática em portal.

## 4. Integrações futuras possíveis

Podem ser avaliadas futuramente:

- autenticação institucional;
- busca de secretarias em cadastro oficial;
- integração com SEI ou sistema de processos;
- exportação para Google Docs;
- armazenamento em Drive institucional;
- importação de respostas antigas do Forms;
- painéis de indicadores dos POPIs gerados;
- conexão com bases para medir indicadores reais;
- geração de plano de automação a partir dos POPIs.

## 5. Contrato lógico com IA

### Entrada mínima para geração

```json
{
  "report_number": "Secretaria Saúde - Nº 001 - 2026",
  "secretaria": "Saúde",
  "department": "Urbam / UTC",
  "division": "Central de Agendamentos da Saúde",
  "routine_category": "Atendimento ao cidadão",
  "input": {
    "routine_name": "Central de Agendamentos",
    "routine_goal": "...",
    "step_by_step": "...",
    "systems_documents": "...",
    "bottlenecks": "...",
    "improvement_ideas": "...",
    "indicators": "..."
  }
}
```

### Saída esperada

```json
{
  "pop_markdown": "...",
  "flowchart_mermaid": "...",
  "intelligent_report_markdown": "...",
  "quality_warnings": [],
  "information_gaps": []
}
```

## 6. Regras de segurança e privacidade

- Evitar nomes de pessoas físicas nos documentos.
- Preferir cargos, funções e setores.
- Não enviar dados sensíveis desnecessários para IA.
- Registrar no prompt que a IA não deve inventar informações.
- Permitir revisão humana antes de exportação final.

## 7. Dependência crítica

A geração por IA é útil, mas o sistema deve preservar a possibilidade de edição manual completa.

Mesmo que a IA esteja indisponível, o usuário deve conseguir:

- criar POPI;
- preencher dados;
- editar documento;
- categorizar manualmente;
- salvar versões;
- exportar conteúdo existente.
