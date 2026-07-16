/**
 * Gera um DOCX com PNG mínimo embutido e valida a estrutura ZIP/OOXML.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { __test__ } from "../src/utils/exportPopi.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", ".tmp-export-test");
mkdirSync(outDir, { recursive: true });

// PNG 1x1 branco válido
const pngB64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5W2XQAAAAASUVORK5CYII=";
const pngBytes = Uint8Array.from(Buffer.from(pngB64, "base64"));

const popi = {
  id: "t",
  report_number: "POPI-IMG-001",
  sequential_number: 1,
  year: 2026,
  secretaria_id: "s",
  secretaria_name: "Secretaria Teste",
  title: "Teste Fluxograma Imagem",
  department: "D",
  division: "V",
  status: "gerado" as const,
  routine_category: "Teste",
  improvement_categories: [],
  created_by: "t",
  updated_by: "t",
  created_at: "",
  updated_at: "",
  approved_at: null,
  archived_at: null,
};

const md = `# Documento\n\nTexto com **negrito**.\n`;
const blob = __test__.buildDocxBlob(popi, md, [
  "POPI-IMG-001_fluxograma_as_is.png",
  "POPI-IMG-001_fluxograma_to_be_sistemico.png",
]);

const buf = Buffer.from(await blob.arrayBuffer());
const outPath = join(outDir, "com-fluxograma.docx");
writeFileSync(outPath, buf);

const asBin = buf.toString("binary");
const checks = [
  ["magic ZIP", buf[0] === 0x50 && buf[1] === 0x4b],
  ["sem media embutida", !asBin.includes("word/media/flowchart.png")],
  ["tem nota fluxogramas", asBin.includes("Fluxogramas do Processo")],
  ["menciona png AS-IS", asBin.includes("_fluxograma_as_is.png")],
  ["menciona png TO-BE", asBin.includes("_fluxograma_to_be_sistemico.png")],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "OK" : "FAIL"} — ${name}`);
  if (!ok) failed++;
}

console.log(`arquivo: ${outPath} (${buf.length} bytes)`);
if (failed) {
  process.exit(1);
}
console.log("PASSOU — DOCX com imagem");
