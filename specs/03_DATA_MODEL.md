# 03 — Data Model

## 1. Visão geral

Este documento define uma estrutura inicial de dados para o sistema POPI. A implementação pode ser feita em banco relacional, Firestore, Supabase, PostgreSQL ou outro banco definido futuramente.

A especificação abaixo é independente de tecnologia.

## 2. Tabelas ou coleções principais

```text
users
secretarias
popis
popi_inputs
popi_documents
popi_classifications
popi_versions
counters
```

## 3. users

```json
{
  "id": "user_uuid",
  "name": "Dérik Fernandes",
  "email": "usuario@dominio.gov.br",
  "role": "admin",
  "secretaria_id": "secretaria_uuid",
  "active": true,
  "created_at": "2026-06-07T00:00:00Z",
  "updated_at": "2026-06-07T00:00:00Z"
}
```

## 4. secretarias

```json
{
  "id": "secretaria_uuid",
  "name": "Saúde",
  "official_name": "Secretaria de Saúde",
  "acronym": "SS",
  "active": true,
  "created_at": "2026-06-07T00:00:00Z",
  "updated_at": "2026-06-07T00:00:00Z"
}
```

## 5. popis

```json
{
  "id": "popi_uuid",
  "report_number": "Secretaria Saúde - Nº 001 - 2026",
  "sequential_number": 1,
  "year": 2026,
  "secretaria_id": "secretaria_uuid",
  "title": "Central de Agendamentos",
  "department": "Urbam / UTC",
  "division": "Central de Agendamentos da Saúde",
  "status": "rascunho",
  "routine_category": "Atendimento ao cidadão",
  "improvement_categories": [
    "Integração entre sistemas",
    "Redução de retrabalho",
    "Uso potencial de IA"
  ],
  "created_by": "user_uuid",
  "updated_by": "user_uuid",
  "created_at": "2026-06-07T00:00:00Z",
  "updated_at": "2026-06-07T00:00:00Z",
  "approved_at": null,
  "archived_at": null
}
```

## 6. popi_inputs

```json
{
  "id": "input_uuid",
  "popi_id": "popi_uuid",
  "role_or_position": "Assessora de Diretoria - Gerente/Gestão",
  "routine_name": "Central de Agendamentos",
  "routine_goal": "Agendar vagas liberadas pela Secretaria de Saúde.",
  "routine_type": "Atende diretamente o cidadão",
  "start_trigger": "Solicitação da chefia e sistema",
  "frequency": "Diariamente",
  "participants": "Backoffice, monitoria e equipe de agendamento.",
  "legal_basis": "Não informado",
  "step_by_step": "Texto do passo a passo informado pelo usuário.",
  "systems_documents": "SAMS, ESAMS, CROSS, Agenda Saúde, planilhas.",
  "required_information": "CRA do paciente e nome completo.",
  "average_time": "15 a 30 minutos",
  "bottlenecks": "Exportação de listas, controles paralelos e subida de listas no sistema.",
  "improvement_ideas": "Integração por APIs, atualização do E-SAMS e automações.",
  "indicators": "Ocupação mínima de 95% das vagas, entre outros.",
  "additional_notes": null,
  "created_at": "2026-06-07T00:00:00Z",
  "updated_at": "2026-06-07T00:00:00Z"
}
```

## 7. popi_documents

```json
{
  "id": "document_uuid",
  "popi_id": "popi_uuid",
  "pop_markdown": "# Procedimento Operativo Padrão...",
  "intelligent_report_markdown": "# Relatório Inteligente da Rotina...",
  "flowchart_mermaid": "flowchart TD\nA[Início] --> B[Etapa 1]",
  "final_markdown": "# POPI — Procedimento Operativo Padrão Inteligente...",
  "last_generated_at": "2026-06-07T00:00:00Z",
  "last_manual_edit_at": null,
  "created_at": "2026-06-07T00:00:00Z",
  "updated_at": "2026-06-07T00:00:00Z"
}
```

## 8. popi_classifications

```json
{
  "id": "classification_uuid",
  "popi_id": "popi_uuid",
  "routine_category": "Atendimento ao cidadão",
  "routine_category_justification": "A rotina envolve contato direto com o cidadão para oferta de vagas.",
  "improvement_categories": [
    {
      "category": "Integração entre sistemas",
      "justification": "Há uso de múltiplos sistemas e necessidade de integração por APIs."
    }
  ],
  "confidence_level": "alto",
  "classification_gaps": [],
  "created_at": "2026-06-07T00:00:00Z",
  "updated_at": "2026-06-07T00:00:00Z"
}
```

## 9. popi_versions

```json
{
  "id": "version_uuid",
  "popi_id": "popi_uuid",
  "version_number": 1,
  "changed_by": "user_uuid",
  "change_type": "manual",
  "status_at_change": "em_edicao",
  "changed_fields": ["pop_markdown", "routine_category"],
  "previous_snapshot": {},
  "new_snapshot": {},
  "note": "Usuário ajustou recomendações finais.",
  "created_at": "2026-06-07T00:00:00Z"
}
```

## 10. counters

```json
{
  "id": "secretaria_uuid_2026",
  "secretaria_id": "secretaria_uuid",
  "year": 2026,
  "last_number": 4,
  "updated_at": "2026-06-07T00:00:00Z"
}
```

## 11. Regra de geração do número

Pseudocódigo:

```javascript
function gerarNumeroRelatorio(secretariaNome, secretariaId, ano) {
  const counter = buscarCounter(secretariaId, ano);
  const proximoNumero = counter.last_number + 1;
  const numeroFormatado = String(proximoNumero).padStart(3, "0");
  atualizarCounter(secretariaId, ano, proximoNumero);
  return `Secretaria ${secretariaNome} - Nº ${numeroFormatado} - ${ano}`;
}
```

## 12. Regras de versionamento

Toda alteração relevante deve gerar nova versão quando afetar:

- dados de entrada;
- categoria;
- número do relatório;
- POP;
- fluxograma;
- relatório inteligente;
- status;
- aprovação;
- arquivamento.

## 13. Regras de edição

1. O usuário pode editar a qualquer momento.
2. O sistema não pode sobrescrever edição manual sem confirmação.
3. Alterações nos dados de entrada após geração devem acionar opção de regeração parcial ou total.
4. Alteração de número deve ser restrita a usuário autorizado.
