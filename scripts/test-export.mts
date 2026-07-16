/**
 * Teste de integridade dos exports (DOCX/PDF/MD).
 * Roda com: node --experimental-strip-types scripts/test-export.mts
 * ou via Cursor node + tsx se disponível.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", ".tmp-export-test");

const popi = {
  id: "test",
  report_number: "POPI-SEI-2026-001",
  sequential_number: 1,
  year: 2026,
  secretaria_id: "s1",
  secretaria_name: "Secretaria de Administração",
  title: "Rotina de Cadastro de Usuários",
  department: "TI",
  division: "Sistemas",
  status: "gerado",
  routine_category: "Administrativo",
  improvement_categories: [],
  created_by: "t",
  updated_by: "t",
  created_at: "",
  updated_at: "",
  approved_at: null,
  archived_at: null,
};

const document = {
  pop_markdown: `# PARTE 1 — POP\n\n## Objetivo\n\nGarantir o cadastro correto.\n\n- Verificar documentos\n- Validar dados\n`,
  intelligent_report_markdown: `# PARTE 2 — Relatório\n\nGargalos identificados na rotina.`,
  flowchart_mermaid: "flowchart TD\n  A-->B",
  flowchart_tobe_flow_mermaid: "flowchart TD\n  A-->C",
  flowchart_tobe_system_mermaid: "flowchart TD\n  A-->D",
  final_markdown: `# POPI Teste\n\n## Objetivo\n\nTexto com acentuação: ação, procedimento, órgão.\n\n- Item um\n- Item dois\n\n\`\`\`\ncódigo exemplo\n\`\`\`\n`,
  last_generated_at: null,
  last_manual_edit_at: null,
};

async function main() {
  // Import dinâmico do módulo TS compilado via path relativo (Vite/TS)
  // Carrega a lógica reimplementando via import do fonte com strip-types se possível.
  const modPath = join(__dirname, "..", "src", "utils", "exportPopi.ts");
  if (!existsSync(modPath)) {
    throw new Error("exportPopi.ts não encontrado");
  }

  // Usa avaliação mínima: importa após transformar com node --import tsx se houver,
  // senão duplica asserts com leitura do arquivo gerado por funções exportadas.
  let buildDocxBlob;
  let buildPrintHtml;
  let getExportMarkdown;

  try {
    const imported = await import(pathToFileURL(modPath).href);
    ({
      __test__: { buildDocxBlob, buildPrintHtml },
      getExportMarkdown,
    } = {
      __test__: imported.__test__,
      getExportMarkdown: imported.getExportMarkdown,
    });
  } catch (err) {
    console.error("Falha ao importar exportPopi.ts:", err);
    console.error(
      "Tente: \"C:\\Program Files\\cursor\\resources\\app\\resources\\helpers\\node.exe\" --experimental-strip-types scripts/test-export.mts"
    );
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const markdown = getExportMarkdown(popi, document);
  const mdPath = join(outDir, "teste.md");
  writeFileSync(mdPath, markdown, "utf8");

  const docxBlob = buildDocxBlob(popi, markdown);
  const docxBuf = Buffer.from(await docxBlob.arrayBuffer());
  const docxPath = join(outDir, "teste.docx");
  writeFileSync(docxPath, docxBuf);

  const printHtml = buildPrintHtml(popi, markdown, [
    { title: "Fluxograma AS-IS", svg: "<svg><text>as-is</text></svg>" },
    {
      title: "Fluxograma TO-BE (Alterações Sistêmicas)",
      svg: "<svg><text>to-be</text></svg>",
    },
  ]);
  const htmlPath = join(outDir, "teste-pdf.html");
  writeFileSync(htmlPath, printHtml, "utf8");

  // Asserções
  const isZip = docxBuf[0] === 0x50 && docxBuf[1] === 0x4b; // PK
  const htmlOk =
    printHtml.includes("<html") &&
    printHtml.includes("Fluxograma AS-IS") &&
    printHtml.includes("Alterações Sistêmicas");
  const mdOk =
    markdown.includes("POPI-SEI-2026-001") &&
    markdown.includes("Fluxograma AS-IS") &&
    markdown.includes("Fluxograma TO-BE (Alterações de Fluxo de Rotina)") &&
    markdown.includes("Fluxograma TO-BE (Alterações Sistêmicas)");

  // DOCX deve conter document.xml no ZIP (busca string)
  const docxAsString = docxBuf.toString("binary");
  const hasDocumentXml = docxAsString.includes("word/document.xml");
  const hasContentTypes = docxAsString.includes("[Content_Types].xml");

  console.log("--- Resultado do teste de exportação ---");
  console.log(`MD  : ${mdPath} (${Buffer.byteLength(markdown, "utf8")} bytes) ok=${mdOk}`);
  console.log(
    `DOCX: ${docxPath} (${docxBuf.length} bytes) zip=${isZip} parts=${hasDocumentXml && hasContentTypes}`
  );
  console.log(`HTML p/ PDF: ${htmlPath} ok=${htmlOk}`);

  // Verifica que NÃO é HTML disfarçado
  const looksLikeHtml =
    docxBuf.subarray(0, 15).toString("utf8").includes("<!DOCTYPE") ||
    docxBuf.subarray(0, 15).toString("utf8").includes("<html");
  console.log(`DOCX não é HTML: ${!looksLikeHtml}`);

  const passed = isZip && htmlOk && mdOk && hasDocumentXml && hasContentTypes && !looksLikeHtml;
  if (!passed) {
    console.error("FALHOU");
    process.exit(1);
  }
  console.log("PASSOU — arquivos gerados em .tmp-export-test/");
}

main();
