import { sanitizeMermaidFlowchart, prepareMermaidCode } from "../src/utils/sanitizeMermaid.ts";

const cases: { name: string; input: string; expectIncludes: string; expectExcludes?: string }[] = [
  {
    name: "parênteses em retângulo (bug SIRESP/CROSS)",
    input: `flowchart TD
    H[Vaga também no SIRESP (CROSS)]
    I -- Não --> H`,
    expectIncludes: `H["Vaga também no SIRESP (CROSS)"]`,
    expectExcludes: `H[Vaga também no SIRESP (CROSS)]`,
  },
  {
    name: "já com aspas permanece",
    input: `flowchart TD\n    A["Texto (ok)"] --> B[Fim]`,
    expectIncludes: `A["Texto (ok)"]`,
  },
  {
    name: "label simples sem mudar",
    input: `flowchart TD\n    A[Inicio] --> B[Fim]`,
    expectIncludes: `A[Inicio]`,
  },
  {
    name: "diamante com interrogação/parênteses",
    input: `flowchart TD\n    C{Contato (OK)?}`,
    expectIncludes: `C{"Contato (OK)?"}`,
  },
  {
    name: "fence mermaid",
    input: "```mermaid\nflowchart TD\n    X[Item (A)]\n```",
    expectIncludes: `X["Item (A)"]`,
  },
];

let failed = 0;
for (const c of cases) {
  const out =
    c.name === "fence mermaid"
      ? prepareMermaidCode(c.input)
      : sanitizeMermaidFlowchart(c.input);
  const okIncludes = out.includes(c.expectIncludes);
  const okExcludes = c.expectExcludes ? !out.includes(c.expectExcludes) : true;
  const pass = okIncludes && okExcludes;
  console.log(`${pass ? "OK" : "FAIL"} — ${c.name}`);
  if (!pass) {
    failed++;
    console.log("  out:", JSON.stringify(out));
  }
}

if (failed) {
  console.error(`FALHOU: ${failed} caso(s)`);
  process.exit(1);
}
console.log("PASSOU — sanitizeMermaid");
