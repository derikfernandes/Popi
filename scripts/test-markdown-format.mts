import {
  parseMarkdown,
  parseInline,
  inlineToPlain,
} from "../src/utils/markdown.ts";
import { __test__ } from "../src/utils/exportPopi.ts";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", ".tmp-export-test");
mkdirSync(outDir, { recursive: true });

const sample = `# Procedimento Operacional Padrão

## 1 — Objetivo
Texto com **negrito** e *itálico*.

## 2 — Papéis
- **Auxiliar**: faz triagem
- Equipe de Agendamento

| Nº | Etapa | Responsável |
|---|---|---|
| 1 | Extração | Auxiliar |
| 2 | Confirmação | Equipe |

---

1. **Primeiro**: passo A
2. Segundo passo
`;

let failed = 0;
function assert(name: string, cond: boolean, detail?: string) {
  console.log(`${cond ? "OK" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
  if (!cond) failed++;
}

const inlines = parseInline("Olá **mundo** e *teste* com \`code\`");
assert("inline tem bold", inlines.some((n) => n.type === "bold"));
assert("inline tem italic", inlines.some((n) => n.type === "italic"));
assert("inline tem code", inlines.some((n) => n.type === "code"));
assert(
  "plain sem asteriscos",
  !inlineToPlain(inlines).includes("**") && !inlineToPlain(inlines).includes("*")
);

const blocks = parseMarkdown(sample);
assert(
  "tem heading",
  blocks.some((b) => b.type === "heading" && b.level === 1)
);
assert("tem lista", blocks.some((b) => b.type === "list" && !b.ordered));
assert("tem tabela", blocks.some((b) => b.type === "table"));
assert("tem lista ordenada", blocks.some((b) => b.type === "list" && b.ordered));
assert("tem hr", blocks.some((b) => b.type === "hr"));

const table = blocks.find((b) => b.type === "table");
if (table && table.type === "table") {
  assert("tabela 3 colunas", table.headers.length === 3);
  assert("tabela 2 linhas", table.rows.length === 2);
}

const popi = {
  id: "t",
  report_number: "POPI-TEST-001",
  sequential_number: 1,
  year: 2026,
  secretaria_id: "s",
  secretaria_name: "Secretaria de Saúde",
  title: "Central de Agendamentos",
  department: "D",
  division: "V",
  status: "gerado" as const,
  routine_category: "Atendimento",
  improvement_categories: [],
  created_by: "t",
  updated_by: "t",
  created_at: "",
  updated_at: "",
  approved_at: null,
  archived_at: null,
};

const docx = __test__.buildDocxBlob(popi, sample, []);
const docxBuf = Buffer.from(await docx.arrayBuffer());
writeFileSync(join(outDir, "formatado.docx"), docxBuf);
assert("docx é ZIP", docxBuf[0] === 0x50 && docxBuf[1] === 0x4b);
assert(
  "docx contém negrito OOXML",
  docxBuf.toString("binary").includes("<w:b/>")
);
assert(
  "docx contém tabela",
  docxBuf.toString("binary").includes("<w:tbl>")
);

const html = __test__.buildPrintHtml(popi, sample, null);
writeFileSync(join(outDir, "formatado.html"), html, "utf8");
assert("html tem strong", html.includes("<strong>"));
assert("html tem table", html.includes("<table>"));
assert("html sem ** literal no body principal", !html.includes("**negrito**"));

if (failed) {
  console.error(`FALHOU: ${failed}`);
  process.exit(1);
}
console.log("PASSOU — formatação markdown/export");
