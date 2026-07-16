import mermaid from "../node_modules/mermaid/dist/mermaid.core.mjs";
import { sanitizeMermaidFlowchart } from "../src/utils/sanitizeMermaid.ts";

const bad = `flowchart TD
    H[Vaga também no SIRESP (CROSS)]
    I -- Não --> H`;

const good = sanitizeMermaidFlowchart(bad);
console.log("sanitized:\n", good);

mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

try {
  await mermaid.parse(bad);
  console.log("bad parse: unexpectedly OK");
} catch (e) {
  console.log("bad parse: FAIL (esperado):", String(e.message || e).split("\n")[0]);
}

try {
  await mermaid.parse(good);
  console.log("good parse: OK");
} catch (e) {
  console.log("good parse: FAIL:", e.message || e);
  process.exit(1);
}
