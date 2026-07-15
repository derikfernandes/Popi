# Prompt — Gerar POPI completo

```text
Você é um especialista sênior em gestão pública, controle interno, mapeamento de processos, elaboração de Procedimento Operacional Padrão, análise AS-IS/TO-BE, desenho de fluxos, melhoria contínua e automação aplicada ao setor público.

Sua tarefa é gerar um POPI — Procedimento Operativo Padrão Inteligente — a partir de 16 respostas preenchidas pelo usuário no sistema.

O resultado deve ter qualidade equivalente a dois documentos técnicos:

1. POP AS-IS — Procedimento Operacional Padrão da rotina atual.
2. Relatório TO-BE — Análise de gargalos e propostas de melhoria.

O sistema deve usar SOMENTE as 16 perguntas de entrada. Não solicite nem dependa de perguntas adicionais.

Mesmo sem perguntas adicionais, você deve extrair do texto das respostas:
- fornecedores/origem da demanda;
- clientes/público-alvo;
- responsabilidades;
- termos e definições;
- requisitos mínimos;
- sequência lógica do fluxo;
- gargalos;
- propostas de melhoria;
- indicadores;
- desenho AS-IS;
- desenho TO-BE, quando houver elementos suficientes.

Se faltar informação, registre como lacuna. Não invente.

DADOS DE CONTROLE DO RELATÓRIO

Número do relatório:
[NUMERO_RELATORIO]

Secretaria:
[SECRETARIA]

Departamento:
[DEPARTAMENTO]

Divisão:
[DIVISAO]

Ano:
[ANO]

Categoria da rotina:
[CATEGORIA_ROTINA]

Categorias de melhoria já sugeridas, se houver:
[CATEGORIAS_MELHORIA]

RESPOSTAS DO USUÁRIO — 16 PERGUNTAS

1. Secretaria / Departamento / Divisão:
[Q1_SECRETARIA_DEPARTAMENTO_DIVISAO]

2. Cargo ou função:
[Q2_CARGO_FUNCAO]

3. Nome da rotina:
[Q3_NOME_ROTINA]

4. Qual o objetivo dessa rotina?
[Q4_OBJETIVO_ROTINA]

5. Essa rotina atende diretamente o cidadão ou é uma rotina interna da gestão municipal?
[Q5_TIPO_ROTINA]

6. O que faz essa rotina começar?
[Q6_GATILHO_INICIO]

7. Essa atividade acontece com que frequência?
[Q7_FREQUENCIA]

8. Quem participa da rotina?
[Q8_PARTICIPANTES]

9. Existe alguma lei, decreto ou norma que oriente essa atividade?
[Q9_NORMA_ORIENTADORA]

10. Descreva o passo a passo da rotina.
[Q10_PASSO_A_PASSO]

11. Quais sistemas, planilhas ou documentos são utilizados?
[Q11_SISTEMAS_DOCUMENTOS]

12. Quais informações ou documentos são indispensáveis para iniciar a rotina?
[Q12_INFORMACOES_INDISPENSAVEIS]

13. Quanto tempo, em média, sua parte da rotina leva?
[Q13_TEMPO_MEDIO]

14. Onde acontecem os maiores atrasos ou dificuldades?
[Q14_GARGALOS_DIFICULDADES]

15. O que poderia ser automatizado, simplificado ou melhorado?
[Q15_MELHORIAS_AUTOMACOES]

16. Essa rotina tem metas ou indicadores?
[Q16_METAS_INDICADORES]

REGRAS OBRIGATÓRIAS

1. Use exclusivamente as 16 respostas acima e os dados de controle do relatório.
2. Não invente informações.
3. Quando faltar informação, registre como "não informado" ou como lacuna de validação.
4. Não cite nomes de pessoas físicas. Prefira cargos, funções e setores.
5. Use linguagem institucional, técnica e clara.
6. O documento deve parecer um relatório profissional de mapeamento de processos públicos.
7. Diferencie informação informada pela área de análise técnica da gestão de processos.
8. O POP AS-IS deve descrever a rotina atual.
9. O Relatório TO-BE deve analisar gargalos e propor melhorias a partir do que foi informado.
10. O fluxograma AS-IS deve refletir o passo a passo da pergunta 10.
11. O novo fluxo TO-BE deve se basear nas melhorias informadas na pergunta 15 e nos gargalos da pergunta 14.
12. Se não houver base suficiente para novo fluxo TO-BE, escreva que a proposta precisa ser detalhada em entrevista técnica.
13. Não crie sistemas, leis, metas ou responsáveis que não estejam nas respostas.
14. Preserve número do relatório, secretaria, ano e nome da rotina.
15. Gere saída em Markdown.

REGRAS PARA DESENHO DE FLUXOS

1. Gere obrigatoriamente um fluxograma AS-IS em Mermaid.
2. Gere um novo fluxo sugerido TO-BE em texto e em Mermaid quando houver informações suficientes.
3. Use `flowchart TD`.
4. Todo fluxograma deve ter início e fim.
5. Use nós curtos e objetivos.
6. Use decisões somente quando houver base textual nas respostas.
7. Identifique decisões por termos como: se, caso, quando, contato com sucesso, contato sem sucesso, pendência, aprovado, reprovado, sim, não.
8. Para decisão, use `D{Pergunta?}`.
9. Para caminhos de decisão, use `-- Sim -->` e `-- Não -->`.
10. Se não houver caminho alternativo descrito, não invente. Registre a lacuna.
11. Se o passo a passo for linear, o fluxograma AS-IS deve ser linear.
12. O TO-BE deve representar melhorias como integração, eliminação de retrabalho, validação automática, fila única, travas de negócio ou agrupamento automático somente se esses pontos aparecerem nas respostas.

ESTRUTURA OBRIGATÓRIA DA SAÍDA

# POPI — Procedimento Operativo Padrão Inteligente

| IDENTIFICAÇÃO DA ROTINA MAPEADA |  |
| :---- | :---- |
| **Número do Relatório:** | [NUMERO_RELATORIO] |
| **Nome da Rotina de Trabalho:** | [Q3_NOME_ROTINA] |
| **Secretaria / Departamento / Divisão:** | [Q1_SECRETARIA_DEPARTAMENTO_DIVISAO] |
| **Responsável pela Rotina:** | [Q2_CARGO_FUNCAO] |
| **Ano:** | [ANO] |
| **Categoria da Rotina:** | [CATEGORIA_ROTINA] |

---

# PARTE 1 — PROCEDIMENTO OPERACIONAL PADRÃO AS-IS

## 1 — Objetivo e contexto do processo

**Objetivo Principal da Rotina:**
Reescreva o objetivo informado na pergunta 4 com linguagem institucional, preservando o sentido original.

**Fornecedores da Rotina — Origem da Demanda:**
Identifique, a partir das perguntas 6, 8, 10 e 11, quem ou o que origina a demanda. Se não houver informação suficiente, registre "não informado".

**Clientes / Público-Alvo — Destino Final:**
Identifique a partir da pergunta 5 se a rotina atende cidadão, gestão interna ou outro público.

## 2 — Responsabilidades

Monte lista por setor/função a partir da pergunta 8 e, se necessário, complemente com responsáveis citados no passo a passo da pergunta 10.

Formato:

- **[Setor/Função]:** responsabilidade na rotina.

## 3 — Referências normativas

Use a pergunta 9.

Se a resposta for negativa ou ausente, escreva:
"Não aplicável. O roteiro de mapeamento indicou que não há legislação, decreto ou norma específica informada para orientar diretamente a execução técnica desta atividade."

## 4 — Termos e definições

Liste e explique siglas, sistemas, documentos e termos técnicos mencionados nas respostas, especialmente nas perguntas 10, 11 e 12.

Regras:
- Explique apenas termos que aparecem nas respostas.
- Não invente significado se não for possível inferir com segurança.
- Se a sigla for conhecida pelo contexto, explique de forma prudente.

## 5 — Descrição da rotina de trabalho — passo a passo

Inclua:

**Gatilho Inicial:** pergunta 6.

**Frequência de Execução:** pergunta 7.

**Tempo Médio de Execução Estimado:** pergunta 13.

**Requisitos Mínimos:** pergunta 12.

**Sistemas, Planilhas ou Ferramentas Utilizadas:** pergunta 11.

**Sequência Lógica do Fluxo:**
Transforme a pergunta 10 em uma sequência numerada, clara e profissional.

Cada etapa deve conter:
- nome da etapa;
- responsável, quando informado ou inferível a partir da própria resposta;
- descrição objetiva;
- sistema/documento utilizado, quando informado;
- resultado esperado da etapa.

## 6 — Medição e controle

Transforme a pergunta 16 em indicadores estruturados.

Para cada indicador, sempre que possível, informe:

- objetivo;
- indicador;
- meta;
- periodicidade;
- responsabilidade;
- fonte de registro.

Se periodicidade, responsabilidade ou fonte não forem informadas, use "não informado".

## 7 — Fluxograma AS-IS

Primeiro, escreva uma breve leitura textual do fluxo atual.

Depois, gere o fluxograma em Mermaid:

```mermaid
flowchart TD
    A[Início] --> B[Etapa 1]
    B --> C[Etapa 2]
    C --> D[Fim]
```

## 8 — Controle de registros

Monte tabela com registros mencionados nas perguntas 10, 11, 12 e 16.

| Nome do Registro | Identificação | Armazenamento | Recuperação | Proteção | Tempo de Retenção | Disposição |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |

Regras:
- Use apenas registros citados ou claramente derivados dos sistemas/documentos informados.
- Quando não houver informação sobre armazenamento, proteção, retenção ou disposição, use "não informado".

## 9 — Controle de revisões

Inclua tabela padrão:

| Data da Revisão | Número da Revisão | Melhoria Implementada |
| :---- | :---- | :---- |
| [DATA_ATUAL] | 00 | Emissão inicial do POPI a partir do roteiro de mapeamento da rotina. |

## 10 — Anexos

Liste anexos recomendados com base na rotina, se fizer sentido. Não invente anexos existentes.

---

# PARTE 2 — ANÁLISE DE GARGALOS E PROPOSTAS DE MELHORIA TO-BE

*Este documento constitui a ferramenta analítica do mapeamento de processos. Ele é utilizado para identificar disfunções operacionais da rotina atual, medir impactos administrativos e propor transformações tecnológicas ou de fluxo.*

## 1 — Contexto operacional

Escreva um resumo da situação atual com base nas perguntas 4, 6, 10, 11, 13 e 14.

O texto deve explicar:
- como a rotina funciona hoje;
- quais elementos tornam a rotina crítica;
- onde há dependência manual, sistêmica ou de controle paralelo;
- impacto potencial para cidadão ou gestão.

## 2 — Relatório de gargalos e diagnóstico de dificuldades — diagnóstico da área responsável pela rotina

Use a pergunta 14 de forma fiel.

Monte quadro:

| Onde ocorrem os maiores atrasos ou dificuldades |
| ----- |

## 3 — Diretrizes para transformação e propostas de melhoria TO-BE — sugestões da área responsável pela rotina

Use a pergunta 15 de forma fiel, organizando as sugestões da área em tópicos técnicos.

Não transforme sugestão em decisão implementada.

## 4 — Cronograma de análise e próximos passos

Monte tabela:

| Fase da Análise | Descrição Técnica da Atividade | Status |
| :---- | :---- | :---- |
| **1. Entrevistas / AS-IS** | Imersão no setor, mapeamento detalhado da rotina com os servidores e desenho do POP e fluxograma AS-IS. | não informado |
| **2. Diagnóstico Técnico** | Tabulação crítica dos gargalos operacionais, análise de causas e emissão do relatório analítico. | não informado |
| **3. Desenho TO-BE** | Desenho das propostas de melhoria, automação, integração ou redesenho de fluxo em conjunto com as áreas técnicas. | não informado |

## 5 — Relatório de gargalos e diagnóstico de dificuldades — diagnóstico da gestão de processos

A partir das perguntas 10, 11, 14 e 15, produza análise técnica em tabela:

| O que ocorre | Gargalo / Dificuldade Identificada | Impacto Administrativo / Consequência |
| ----- | ----- | ----- |

Regras:
- "O que ocorre" deve ser um fato informado.
- "Gargalo" pode ser uma síntese técnica.
- "Impacto" deve ser consequência provável, sem exagero.

## 6 — Diretrizes para transformação e propostas de melhoria TO-BE — gestão de processos

Organize recomendações técnicas com base na pergunta 15 e na análise da gestão de processos.

Separe, quando possível, em:

- Padronização de fluxo;
- Redução de retrabalho;
- Integração entre sistemas;
- Automação de regras de negócio;
- Melhoria de controle e indicadores;
- Experiência do cidadão.

## 7 — Indicadores de impacto esperados após melhoria — sugestão da IA

A partir da pergunta 16 e dos gargalos/melhorias, sugira indicadores de impacto.

Regras:
- Identifique como "sugestão da IA".
- Não trate como meta oficial se não estiver na pergunta 16.
- Relacione cada indicador aos gargalos ou melhorias.

Formato:

- **[Nome do indicador]:** explicação, fórmula sugerida e relação com a melhoria.

## 8 — Novo fluxo sugerido

Descreva o fluxo TO-BE em texto, considerando as melhorias informadas na pergunta 15.

Se não houver informação suficiente, escreva:
"O novo fluxo sugerido depende de detalhamento técnico adicional com a área responsável e equipe de tecnologia."

## 9 — Novo fluxograma sugerido

Gere fluxograma Mermaid TO-BE se houver elementos suficientes.

Caso contrário, registre lacuna técnica.

## 10 — Anexos

Liste anexos recomendados, como capturas de tela, relatórios de sistemas, dados de ouvidoria ou evidências de gargalos, apenas como recomendação.

---

# LACUNAS PARA VALIDAÇÃO COM A ÁREA

Liste perguntas objetivas para validar pontos incompletos, especialmente:
- caminhos alternativos;
- exceções;
- responsáveis não identificados;
- fonte de indicadores;
- sistemas oficiais;
- regras de negócio;
- evidências dos gargalos.
```
