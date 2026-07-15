# 05 — Action Routing Map

## 1. Objetivo

Este arquivo define onde cada ação do sistema deve ler ou gravar dados.

Regra da metodologia SSVC:

> O agente nunca deve adivinhar onde consultar ou gravar dados. Antes de qualquer ação com dados, consultar o Action Routing Map.

## 2. Mapa de ações

| Ação | Origem | Modo de acesso | Destino | Entrada | Saída | Regra de erro |
|---|---|---|---|---|---|---|
| Criar POPI | UI | API/backend | popis, counters, popi_versions | secretaria, título, departamento, divisão | POPI criado com número | Se contador falhar, não criar POPI sem número. |
| Gerar número | Backend | Função transacional | counters | secretaria_id, ano | número sequencial | Deve ser atômico para evitar duplicidade. |
| Salvar roteiro interno | UI | API/backend | popi_inputs, popi_versions | dados do formulário interno | dados salvos | Se POPI não existir, retornar POPI_NOT_FOUND. |
| Classificar rotina | Backend/IA | LLM + persistência | popi_classifications | popi_inputs | categorias sugeridas | Se IA falhar, permitir classificação manual. |
| Editar classificação | UI | API/backend | popis, popi_classifications, popi_versions | categoria e melhorias | classificação atualizada | Validar categorias permitidas. |
| Gerar POP | Backend/IA | LLM + persistência | popi_documents, popi_versions | popi_inputs | pop_markdown | Não sobrescrever edição manual sem confirmação. |
| Gerar fluxograma | Backend/IA | LLM + persistência | popi_documents, popi_versions | step_by_step | flowchart_mermaid | Validar sintaxe Mermaid quando possível. |
| Gerar relatório inteligente | Backend/IA | LLM + persistência | popi_documents, popi_versions | popi_inputs + POP | intelligent_report_markdown | Não inventar informações; registrar lacunas. |
| Gerar documento completo | Backend/IA | LLM + persistência | popi_documents, popi_versions | POP + relatório + fluxograma | final_markdown | Se uma parte falhar, não marcar como completo. |
| Editar documento | UI | API/backend | popi_documents, popi_versions | markdown editado | documento atualizado | Criar nova versão manual. |
| Alterar status | UI | API/backend | popis, popi_versions | novo status | status atualizado | Validar permissão. |
| Listar versões | UI | API/backend | popi_versions | popi_id | lista de versões | Se não houver versões, retornar lista vazia. |
| Restaurar versão | UI | API/backend | popi_documents, popi_inputs, popis, popi_versions | version_id | versão restaurada | Restaurar cria nova versão; não apagar histórico. |
| Exportar documento | UI | API/backend | popi_documents | formato | arquivo exportado | Se formato não suportado, retornar erro. |

## 3. Regras por ação

### Criar POPI

Deve:

1. validar secretaria;
2. identificar ano atual;
3. gerar número sequencial por secretaria e ano;
4. criar registro em `popis`;
5. criar primeira versão em `popi_versions`.

Não deve:

- criar POPI sem número;
- reutilizar número já existente;
- depender de Google Forms.

### Salvar roteiro interno

Deve permitir salvar rascunhos incompletos.

Se o documento já tiver conteúdo gerado por IA, a alteração dos dados de entrada deve marcar uma pendência de sincronização ou sugerir regeração parcial.

### Gerar conteúdo por IA

A geração por IA deve ler:

- `popis`;
- `popi_inputs`;
- `popi_classifications`, se houver.

E gravar:

- `popi_documents`;
- `popi_versions`.

Não deve sobrescrever edições manuais sem confirmação do usuário.

### Editar a qualquer momento

A edição pode ocorrer em qualquer status:

```text
rascunho
gerado
em_edicao
em_revisao
aprovado
arquivado
```

Para `aprovado` e `arquivado`, pode haver exigência de permissão.

Toda edição relevante deve gerar versão.

### Regeração parcial

Quando dados de origem forem alterados após geração, o usuário deve escolher:

```text
apenas salvar
regerar POP
regerar relatório inteligente
regerar fluxograma
regerar documento inteiro
```

## 4. Fontes proibidas no escopo inicial

O sistema não deve usar como fonte de dados no escopo inicial:

- Google Forms;
- Google Sheets;
- sistemas municipais externos;
- planilhas externas não importadas pelo usuário;
- integrações automáticas não especificadas.

## 5. Regras de auditoria

Criar versão quando houver:

- criação do POPI;
- alteração do roteiro interno;
- geração por IA;
- edição manual do documento;
- alteração de categorias;
- alteração de status;
- aprovação;
- restauração de versão;
- alteração excepcional de número.
