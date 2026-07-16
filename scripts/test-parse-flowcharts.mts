/**
 * Valida a extração dos 3 fluxogramas (AS-IS, TO-BE fluxo, TO-BE sistêmico)
 * do markdown gerado pela IA.
 */
import { parseGeneratedPopiMarkdown } from "../src/utils/popiDocument.ts";

let failed = 0;
function assert(name: string, cond: boolean) {
  console.log(`${cond ? "OK" : "FAIL"} — ${name}`);
  if (!cond) failed++;
}

const full = `# POPI

# PARTE 1 — PROCEDIMENTO OPERACIONAL PADRÃO AS-IS

## 7 — Fluxograma AS-IS
Explicação.
\`\`\`mermaid
flowchart TD
    A[Início] --> B[Etapa AS-IS]
\`\`\`

# PARTE 2 — ANÁLISE DE GARGALOS E PROPOSTAS DE MELHORIA TO-BE

## 9 — Fluxograma TO-BE (Alterações de Fluxo de Rotina)
Explicação.
\`\`\`mermaid
flowchart TD
    A[Início] --> C[Etapa TO-BE fluxo]
\`\`\`

## 10 — Fluxograma TO-BE (Alterações Sistêmicas)
Explicação.
\`\`\`mermaid
flowchart TD
    A[Início] --> D[Etapa TO-BE sistêmica]
\`\`\`

# LACUNAS PARA VALIDAÇÃO COM A ÁREA
`;

const parsed = parseGeneratedPopiMarkdown(full);
assert("AS-IS extraído", parsed.mermaidCode.includes("Etapa AS-IS"));
assert("TO-BE fluxo extraído", parsed.mermaidTobeFlow.includes("Etapa TO-BE fluxo"));
assert(
  "TO-BE sistêmico extraído",
  parsed.mermaidTobeSystem.includes("Etapa TO-BE sistêmica")
);

// Caso com apenas AS-IS
const onlyAsIs = `# POPI

# PARTE 1

## 7 — Fluxograma AS-IS
\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`

# PARTE 2

## 9 — Fluxograma TO-BE (Alterações de Fluxo de Rotina)
Sem alterações sugeridas para este cenário.

## 10 — Fluxograma TO-BE (Alterações Sistêmicas)
Sem alterações sugeridas para este cenário.
`;
const parsed2 = parseGeneratedPopiMarkdown(onlyAsIs);
assert("só AS-IS: AS-IS presente", parsed2.mermaidCode.includes("A --> B"));
assert("só AS-IS: TO-BE fluxo vazio", parsed2.mermaidTobeFlow === "");
assert("só AS-IS: TO-BE sistêmico vazio", parsed2.mermaidTobeSystem === "");

// Caso legado: dois blocos sem títulos identificáveis (fallback por ordem)
const legacy = `# Doc

\`\`\`mermaid
flowchart TD
    X --> Y
\`\`\`

Texto.

\`\`\`mermaid
flowchart TD
    Y --> Z
\`\`\`
`;
const parsed3 = parseGeneratedPopiMarkdown(legacy);
assert("legado: 1º bloco vira AS-IS", parsed3.mermaidCode.includes("X --> Y"));
assert(
  "legado: 2º bloco vira TO-BE fluxo",
  parsed3.mermaidTobeFlow.includes("Y --> Z")
);

if (failed) {
  console.error(`FALHOU: ${failed}`);
  process.exit(1);
}
console.log("PASSOU — parse dos 3 fluxogramas");
