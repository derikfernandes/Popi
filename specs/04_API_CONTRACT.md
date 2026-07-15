# 04 — API Contract

## 1. Objetivo

Este documento descreve contratos iniciais de API para o sistema POPI.

A implementação final pode usar REST, server actions, RPC ou outro padrão. Enquanto a decisão técnica não for tomada, estes contratos funcionam como referência funcional.

## 2. Convenções

Base path sugerido:

```text
/api
```

Formato padrão de resposta:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Formato padrão de erro:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem compreensível para o usuário."
  }
}
```

## 3. POPIs

### Criar POPI

```http
POST /api/popis
```

Body:

```json
{
  "secretaria_id": "secretaria_uuid",
  "department": "Urbam / UTC",
  "division": "Central de Agendamentos da Saúde",
  "title": "Central de Agendamentos"
}
```

Resposta:

```json
{
  "success": true,
  "data": {
    "id": "popi_uuid",
    "report_number": "Secretaria Saúde - Nº 001 - 2026",
    "sequential_number": 1,
    "year": 2026,
    "status": "rascunho"
  },
  "error": null
}
```

Regras:

- Deve gerar número automático por secretaria e ano.
- Deve iniciar com status `rascunho`.
- Deve criar registro inicial de versão.

### Listar POPIs

```http
GET /api/popis
```

Query params opcionais:

```text
secretaria_id
status
year
routine_category
search
```

Resposta:

```json
{
  "success": true,
  "data": [
    {
      "id": "popi_uuid",
      "report_number": "Secretaria Saúde - Nº 001 - 2026",
      "title": "Central de Agendamentos",
      "status": "rascunho",
      "routine_category": "Atendimento ao cidadão",
      "updated_at": "2026-06-07T00:00:00Z"
    }
  ],
  "error": null
}
```

### Ler POPI

```http
GET /api/popis/{popi_id}
```

Resposta deve incluir:

- metadados;
- dados de entrada;
- classificações;
- documentos;
- última versão.

### Atualizar metadados do POPI

```http
PATCH /api/popis/{popi_id}
```

Body parcial:

```json
{
  "title": "Novo título",
  "department": "Departamento atualizado",
  "division": "Divisão atualizada",
  "status": "em_revisao",
  "routine_category": "Processo de saúde",
  "improvement_categories": ["Integração entre sistemas"]
}
```

Regras:

- Deve salvar versão quando alterar campos relevantes.
- Alteração de número do relatório deve exigir permissão especial.

## 4. Dados de entrada

### Salvar roteiro interno

```http
PUT /api/popis/{popi_id}/input
```

Body:

```json
{
  "role_or_position": "Assessora de Diretoria - Gerente/Gestão",
  "routine_name": "Central de Agendamentos",
  "routine_goal": "Agendar vagas liberadas pela Secretaria de Saúde.",
  "routine_type": "Atende diretamente o cidadão",
  "start_trigger": "Solicitação da chefia e sistema",
  "frequency": "Diariamente",
  "participants": "Backoffice, monitoria e equipe de agendamento.",
  "legal_basis": "Não informado",
  "step_by_step": "Passo a passo informado.",
  "systems_documents": "SAMS, ESAMS, CROSS, Agenda Saúde, planilhas.",
  "required_information": "CRA do paciente e nome completo.",
  "average_time": "15 a 30 minutos",
  "bottlenecks": "Exportação de listas e controles paralelos.",
  "improvement_ideas": "Integração por APIs.",
  "indicators": "Ocupação mínima de 95% das vagas.",
  "additional_notes": null
}
```

Regras:

- Deve permitir salvar dados incompletos.
- Se documento já tiver sido gerado, deve marcar que existe possível necessidade de regeração.
- Não deve sobrescrever documento gerado sem confirmação.

## 5. Classificação

### Gerar sugestão de classificação

```http
POST /api/popis/{popi_id}/classify
```

Resposta:

```json
{
  "success": true,
  "data": {
    "routine_category": "Atendimento ao cidadão",
    "routine_category_justification": "A rotina envolve contato direto com cidadãos.",
    "improvement_categories": [
      {
        "category": "Integração entre sistemas",
        "justification": "Há múltiplos sistemas sem integração."
      }
    ],
    "confidence_level": "alto",
    "classification_gaps": []
  },
  "error": null
}
```

### Atualizar classificação manualmente

```http
PUT /api/popis/{popi_id}/classification
```

Body:

```json
{
  "routine_category": "Processo de saúde",
  "improvement_categories": [
    "Integração entre sistemas",
    "Redução de retrabalho"
  ]
}
```

## 6. Geração por IA

### Gerar documento completo

```http
POST /api/popis/{popi_id}/generate
```

Body:

```json
{
  "mode": "full"
}
```

Modes possíveis:

```text
full
pop_only
report_only
flowchart_only
classification_only
```

Resposta:

```json
{
  "success": true,
  "data": {
    "pop_markdown": "# Procedimento Operativo Padrão...",
    "intelligent_report_markdown": "# Relatório Inteligente...",
    "flowchart_mermaid": "flowchart TD...",
    "final_markdown": "# POPI..."
  },
  "error": null
}
```

Regras:

- Deve validar campos mínimos antes de gerar.
- Deve registrar geração como nova versão.
- Deve preservar edições manuais, salvo confirmação explícita.

## 7. Edição do documento

### Atualizar partes do documento

```http
PATCH /api/popis/{popi_id}/document
```

Body parcial:

```json
{
  "pop_markdown": "# POP atualizado...",
  "intelligent_report_markdown": "# Relatório atualizado...",
  "flowchart_mermaid": "flowchart TD..."
}
```

Regras:

- Deve salvar edição manual como nova versão.
- Deve permitir edição a qualquer momento.
- Deve identificar partes impactadas quando possível.

## 8. Versões

### Listar versões

```http
GET /api/popis/{popi_id}/versions
```

### Ler versão específica

```http
GET /api/popis/{popi_id}/versions/{version_id}
```

### Restaurar versão

```http
POST /api/popis/{popi_id}/versions/{version_id}/restore
```

Regras:

- Restaurar versão deve criar uma nova versão atual.
- Não deve apagar histórico anterior.

## 9. Exportação

```http
POST /api/popis/{popi_id}/export
```

Body:

```json
{
  "format": "markdown"
}
```

Formatos previstos:

```text
markdown
pdf
docx
```

## 10. Códigos de erro

```text
POPI_NOT_FOUND
SECRETARIA_NOT_FOUND
INVALID_STATUS
MISSING_REQUIRED_FIELDS
AI_GENERATION_FAILED
VERSION_CONFLICT
UNAUTHORIZED_NUMBER_EDIT
EXPORT_FAILED
```
