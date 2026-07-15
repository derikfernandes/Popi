# 02 — User Flows

## 1. Fluxo principal — criar novo POPI

```text
Usuário acessa o sistema
↓
Clica em Novo POPI
↓
Seleciona secretaria, departamento e divisão
↓
Sistema gera número provisório ou definitivo conforme regra de negócio
↓
Usuário preenche roteiro interno da rotina
↓
Usuário salva rascunho
↓
Usuário pode editar a qualquer momento
↓
Usuário solicita geração por IA
↓
Sistema gera POP, fluxograma e relatório inteligente
↓
Usuário revisa e edita livremente
↓
Usuário envia para revisão ou aprova, conforme perfil
↓
Sistema salva versão e permite exportação
```

## 2. Fluxo de preenchimento do roteiro

O usuário deve preencher os blocos:

1. Identificação.
2. Finalidade.
3. Participantes e regras.
4. Execução.
5. Inteligência e melhoria.

O sistema deve permitir salvar mesmo com campos incompletos, marcando o POPI como rascunho.

## 3. Fluxo de geração por IA

```text
Usuário clica em Gerar POPI
↓
Sistema valida campos mínimos
↓
Sistema normaliza os dados preenchidos
↓
Sistema sugere categoria da rotina e categorias de melhoria
↓
Sistema gera Parte 1 — POP
↓
Sistema gera fluxograma Mermaid
↓
Sistema gera Parte 2 — Relatório Inteligente
↓
Sistema executa QA automático
↓
Sistema salva documento gerado como nova versão
```

## 4. Fluxo de edição a qualquer momento

Regra central:

> O usuário poderá editar o POPI a qualquer momento, em qualquer etapa do ciclo de vida do relatório.

```text
Usuário abre POPI existente
↓
Edita dados de entrada, categorias, POP, relatório, fluxograma ou recomendações
↓
Sistema identifica partes alteradas
↓
Sistema salva alteração
↓
Sistema cria nova versão
↓
Sistema indica se alguma parte deve ser regerada
```

## 5. Fluxo quando dados de entrada são alterados após geração

Se o usuário alterar dados de origem depois que o POPI já tiver sido gerado, o sistema deve perguntar:

```text
Você alterou dados de origem deste POPI. Deseja:
1. Apenas salvar a alteração;
2. Regerar o POP;
3. Regerar o relatório inteligente;
4. Regerar o fluxograma;
5. Regerar o documento inteiro;
6. Manter o documento atual e registrar a alteração como nova versão.
```

O sistema não deve sobrescrever edição manual sem confirmação.

## 6. Fluxo de edição direta do documento

```text
Usuário abre editor do POPI
↓
Altera texto do POP, relatório ou fluxograma
↓
Sistema salva alteração como edição manual
↓
Sistema cria nova versão
↓
Sistema não regenera conteúdo automaticamente
```

## 7. Fluxo de categorização

```text
Usuário preenche dados da rotina
↓
Sistema sugere categoria principal
↓
Sistema sugere categorias de melhoria
↓
Usuário aceita ou altera categorias
↓
Sistema salva classificação
```

## 8. Fluxo de numeração

```text
Usuário cria novo POPI
↓
Sistema identifica secretaria e ano
↓
Sistema consulta contador da secretaria no ano
↓
Sistema soma +1
↓
Sistema formata número com três dígitos
↓
Sistema grava número do relatório
```

Formato:

```text
Secretaria [NOME DA SECRETARIA] - Nº [000] - [ANO]
```

## 9. Fluxo de revisão

```text
Usuário envia para revisão
↓
Revisor acessa documento
↓
Revisor pode editar diretamente ou registrar observações
↓
Sistema salva nova versão
↓
Revisor aprova ou devolve para edição
```

Mesmo em revisão, o documento permanece editável por usuários autorizados.

## 10. Fluxo de aprovação

```text
Usuário/revisor aprova POPI
↓
Sistema altera status para aprovado
↓
Sistema salva versão de aprovação
↓
Sistema permite exportação
↓
Edições posteriores criam nova versão pós-aprovação
```

## 11. Fluxo de exportação

```text
Usuário seleciona POPI
↓
Clica em Exportar
↓
Escolhe formato: Markdown, PDF ou DOCX
↓
Sistema gera arquivo com número, secretaria, ano e conteúdo consolidado
```

## 12. Fluxos alternativos e erros

### Dados mínimos ausentes

O sistema deve permitir salvar rascunho, mas pode bloquear a geração por IA caso faltem campos essenciais.

Campos essenciais para geração inicial:

- secretaria;
- nome da rotina;
- objetivo;
- passo a passo;
- sistemas/documentos utilizados ou indicação de inexistência;
- gargalos ou indicação de inexistência.

### Falha na IA

Se a geração por IA falhar:

- manter dados preenchidos;
- mostrar mensagem clara;
- permitir tentar novamente;
- não criar versão incompleta como final.

### Conflito de edição

Se dois usuários editarem ao mesmo tempo:

- preservar ambas as versões quando possível;
- alertar sobre conflito;
- permitir comparação entre versões.
