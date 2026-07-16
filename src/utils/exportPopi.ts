import type { POPI, POPIDocument } from "../types";
import {
  parseMarkdown,
  inlineToPlain,
  type BlockNode,
  type InlineNode,
} from "./markdown.ts";
import { prepareMermaidCode } from "./sanitizeMermaid.ts";
import {
  renderFlowchartSvg,
  renderFlowchartPng,
  type FlowchartPng,
} from "./exportFlowchart.ts";

export type ExportFormat = "md" | "docx" | "pdf";

export const EXPORT_FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  description: string;
  extension: string;
}[] = [
  {
    id: "md",
    label: "Markdown (.md)",
    description: "Arquivo de texto editável e versionável",
    extension: "md",
  },
  {
    id: "docx",
    label: "Word (.docx)",
    description: "Documento Word + fluxogramas em PNG separados",
    extension: "docx",
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Versão diagramada com texto e fluxogramas",
    extension: "pdf",
  },
];

/** Fluxograma nomeado para exportação (AS-IS e TO-BEs). */
interface ExportFlowchart {
  /** Sufixo usado no nome do arquivo PNG. */
  key: string;
  title: string;
  source: string;
}

function collectFlowcharts(document: POPIDocument): ExportFlowchart[] {
  const list: ExportFlowchart[] = [];
  const asIs = document.flowchart_mermaid?.trim();
  if (asIs) {
    list.push({ key: "as_is", title: "Fluxograma AS-IS", source: asIs });
  }
  const tobeFlow = document.flowchart_tobe_flow_mermaid?.trim();
  if (tobeFlow) {
    list.push({
      key: "to_be_fluxo_de_rotina",
      title: "Fluxograma TO-BE (Alterações de Fluxo de Rotina)",
      source: tobeFlow,
    });
  }
  const tobeSystem = document.flowchart_tobe_system_mermaid?.trim();
  if (tobeSystem) {
    list.push({
      key: "to_be_sistemico",
      title: "Fluxograma TO-BE (Alterações Sistêmicas)",
      source: tobeSystem,
    });
  }
  return list;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtml(text: string): string {
  return escapeXml(text).replace(/'/g, "&#39;");
}

export function getExportMarkdown(popi: POPI, document: POPIDocument): string {
  const header = [
    `# POPI — Procedimento Operativo Padrão Inteligente`,
    ``,
    `| Campo | Valor |`,
    `| --- | --- |`,
    `| **Numeração Oficial** | ${popi.report_number} |`,
    `| **Secretaria** | ${popi.secretaria_name} |`,
    `| **Ano** | ${popi.year} |`,
    `| **Categoria** | ${popi.routine_category || "—"} |`,
    `| **Título** | ${popi.title} |`,
    ``,
    `---`,
    ``,
  ].join("\n");

  let body =
    document.final_markdown ||
    `${document.pop_markdown}\n\n---\n\n${document.intelligent_report_markdown}`;

  const flowcharts = collectFlowcharts(document);
  if (flowcharts.length > 0) {
    // Remove blocos mermaid antigos para não duplicar; usa os da aba Fluxograma
    body = body.replace(/```mermaid[\s\S]*?```/gi, "").trim();
    const sections = flowcharts
      .map((fc) =>
        [
          `## ${fc.title}`,
          ``,
          `\`\`\`mermaid`,
          prepareMermaidCode(fc.source),
          `\`\`\``,
        ].join("\n")
      )
      .join("\n\n");
    body += ["", "---", "", "# Fluxogramas do Processo", "", sections, ""].join(
      "\n"
    );
  }

  return header + body;
}

function fileBaseName(popi: POPI): string {
  return popi.report_number.replace(/\s+/g, "_");
}

function flowchartImageFileName(popi: POPI, key: string): string {
  return `${fileBaseName(popi)}_fluxograma_${key}.png`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Dispara vários downloads sem o navegador bloquear o segundo arquivo. */
function triggerDownloads(
  files: { blob: Blob; filename: string }[]
): void {
  files.forEach(({ blob, filename }, index) => {
    window.setTimeout(() => triggerDownload(blob, filename), index * 450);
  });
}

function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  const u16 = (n: number) => {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, n, true);
    return b;
  };
  const u32 = (n: number) => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, true);
    return b;
  };
  const concat = (parts: Uint8Array[]) => {
    const total = parts.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const p of parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  };

  for (const file of files) {
    const nameBytes = encodeUtf8(file.path);
    const data = file.data;
    const crc = crc32(data);

    const localHeader = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
    ]);

    localParts.push(localHeader, data);

    const centralHeader = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDir = concat(centralParts);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);

  return concat([...localParts, centralDir, end]);
}

/* ——— Inline → DOCX / HTML ——— */

function wt(text: string): string {
  const needsPreserve = /^\s|\s$/.test(text);
  const attr = needsPreserve ? ' xml:space="preserve"' : "";
  return `<w:t${attr}>${escapeXml(text)}</w:t>`;
}

function inlineToDocxRuns(nodes: InlineNode[], bold = false, italic = false): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        if (!node.text) return "";
        const rPr: string[] = [];
        if (bold) rPr.push("<w:b/>");
        if (italic) rPr.push("<w:i/>");
        const pr = rPr.length ? `<w:rPr>${rPr.join("")}</w:rPr>` : "";
        return `<w:r>${pr}${wt(node.text)}</w:r>`;
      }
      if (node.type === "code") {
        return `<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/><w:shd w:val="clear" w:fill="F1F5F9"/></w:rPr>${wt(node.text)}</w:r>`;
      }
      if (node.type === "bold") {
        return inlineToDocxRuns(node.children, true, italic);
      }
      if (node.type === "italic") {
        return inlineToDocxRuns(node.children, bold, true);
      }
      return "";
    })
    .join("");
}

function inlineToHtml(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return escapeHtml(node.text);
      if (node.type === "code")
        return `<code>${escapeHtml(node.text)}</code>`;
      if (node.type === "bold")
        return `<strong>${inlineToHtml(node.children)}</strong>`;
      if (node.type === "italic")
        return `<em>${inlineToHtml(node.children)}</em>`;
      return "";
    })
    .join("");
}

function para(style: string | null, runs: string, extraPr = ""): string {
  const pPr = style || extraPr
    ? `<w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}${extraPr}</w:pPr>`
    : "";
  return `<w:p>${pPr}${runs || "<w:r><w:t></w:t></w:r>"}</w:p>`;
}

function buildDocxTable(headers: InlineNode[][], rows: InlineNode[][][]): string {
  const colCount = Math.max(
    headers.length,
    ...rows.map((r) => r.length),
    1
  );
  const colWidth = Math.floor(9000 / colCount);

  const grid = Array.from({ length: colCount }, () =>
    `<w:gridCol w:w="${colWidth}"/>`
  ).join("");

  const cell = (nodes: InlineNode[] | undefined, isHeader: boolean) => {
    const content = nodes
      ? inlineToDocxRuns(nodes)
      : `<w:r>${wt("")}</w:r>`;
    const shd = isHeader
      ? `<w:tcPr><w:shd w:val="clear" w:fill="E2E8F0"/><w:tcW w:w="${colWidth}" w:type="dxa"/></w:tcPr>`
      : `<w:tcPr><w:tcW w:w="${colWidth}" w:type="dxa"/></w:tcPr>`;
    return `<w:tc>${shd}<w:p>${isHeader ? `<w:pPr><w:rPr><w:b/></w:rPr></w:pPr>` : ""}${content}</w:p></w:tc>`;
  };

  const headerRow = `<w:tr>${headers
    .concat(Array(Math.max(0, colCount - headers.length)).fill(undefined as unknown as InlineNode[]))
    .slice(0, colCount)
    .map((h) => cell(h, true))
    .join("")}</w:tr>`;

  const bodyRows = rows
    .map((row) => {
      const padded = row.concat(
        Array(Math.max(0, colCount - row.length)).fill(
          undefined as unknown as InlineNode[]
        )
      );
      return `<w:tr>${padded
        .slice(0, colCount)
        .map((c) => cell(c, false))
        .join("")}</w:tr>`;
    })
    .join("");

  return `<w:tbl>
    <w:tblPr>
      <w:tblStyle w:val="TableGrid"/>
      <w:tblW w:w="9000" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="4" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="4" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="4" w:color="E2E8F0"/>
        <w:insideV w:val="single" w:sz="4" w:color="E2E8F0"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tblGrid>${grid}</w:tblGrid>
    ${headerRow}
    ${bodyRows}
  </w:tbl>
  <w:p/>`;
}

function blocksToDocxBody(blocks: BlockNode[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const style =
          block.level === 1
            ? "Heading1"
            : block.level === 2
              ? "Heading2"
              : "Heading3";
        parts.push(para(style, inlineToDocxRuns(block.children, true)));
        break;
      }
      case "paragraph":
        parts.push(para(null, inlineToDocxRuns(block.children)));
        break;
      case "list":
        block.items.forEach((item, idx) => {
          const bullet = block.ordered ? `${idx + 1}. ` : "• ";
          parts.push(
            para(
              null,
              `<w:r>${wt(bullet)}</w:r>${inlineToDocxRuns(item)}`,
              `<w:ind w:left="720"/>`
            )
          );
        });
        break;
      case "table":
        parts.push(buildDocxTable(block.headers, block.rows));
        break;
      case "code":
        for (const line of block.text.split("\n")) {
          parts.push(
            para(
              null,
              `<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr>${wt(line)}</w:r>`,
              `<w:shd w:val="clear" w:fill="F1F5F9"/>`
            )
          );
        }
        break;
      case "hr":
        parts.push(
          para(
            null,
            `<w:r>${wt("—")}</w:r>`,
            `<w:pBdr><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/></w:pBdr>`
          )
        );
        break;
      case "blockquote":
        parts.push(
          para(
            null,
            inlineToDocxRuns(block.children, false, true),
            `<w:ind w:left="720"/><w:pBdr><w:left w:val="single" w:sz="12" w:color="93C5FD"/></w:pBdr>`
          )
        );
        break;
    }
  }

  return parts.join("\n");
}

function buildFlowchartDocxNote(imageNames: string[]): string {
  const parts = [
    para(
      "Heading2",
      `<w:r><w:rPr><w:b/></w:rPr>${wt("Fluxogramas do Processo")}</w:r>`
    ),
    para(
      null,
      `<w:r>${wt(
        `Os fluxogramas foram exportados como imagens nos arquivos abaixo, baixados junto com este documento. Insira as imagens no Word em Inserir → Imagens, se desejar incluí-las neste arquivo.`
      )}</w:r>`
    ),
  ];
  for (const name of imageNames) {
    parts.push(
      para(null, `<w:r>${wt(`• ${name}`)}</w:r>`, `<w:ind w:left="720"/>`)
    );
  }
  parts.push(`<w:p/>`);
  return parts.join("\n");
}

function buildDocxXml(
  popi: POPI,
  markdown: string,
  flowchartImageNames: string[]
): string {
  // Texto sem blocos mermaid (fluxogramas vão em PNG separado)
  const textMd = markdown.replace(/```mermaid[\s\S]*?```/gi, "").trim();
  const blocks = parseMarkdown(textMd);
  const cover = [
    para(
      "Title",
      `<w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr>${wt(popi.report_number + " — " + popi.title)}</w:r>`
    ),
    para(
      null,
      `<w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr>${wt(
        `${popi.secretaria_name} · ${popi.year} · ${popi.routine_category || "Sem categoria"}`
      )}</w:r>`
    ),
    para(null, ""),
  ].join("\n");

  const flowNote =
    flowchartImageNames.length > 0
      ? buildFlowchartDocxNote(flowchartImageNames)
      : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${cover}
    ${blocksToDocxBody(blocks)}
    ${flowNote}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildDocxBlob(
  popi: POPI,
  markdown: string,
  flowchartImageNames: string[] = []
): Blob {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F172A"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="280" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="1E293B"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="200" w:after="60"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E40AF"/></w:rPr>
  </w:style>
</w:styles>`;

  const documentXml = buildDocxXml(popi, markdown, flowchartImageNames);
  const zipBytes = createZip([
    { path: "[Content_Types].xml", data: encodeUtf8(contentTypes) },
    { path: "_rels/.rels", data: encodeUtf8(rels) },
    { path: "word/document.xml", data: encodeUtf8(documentXml) },
    { path: "word/_rels/document.xml.rels", data: encodeUtf8(docRels) },
    { path: "word/styles.xml", data: encodeUtf8(styles) },
  ]);

  return new Blob([zipBytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/* ——— HTML diagramado para PDF (impressão) ——— */

function blocksToHtml(blocks: BlockNode[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h${block.level}>${inlineToHtml(block.children)}</h${block.level}>`;
        case "paragraph":
          return `<p>${inlineToHtml(block.children)}</p>`;
        case "list": {
          const tag = block.ordered ? "ol" : "ul";
          const items = block.items
            .map((item) => `<li>${inlineToHtml(item)}</li>`)
            .join("");
          return `<${tag}>${items}</${tag}>`;
        }
        case "table": {
          const thead = `<thead><tr>${block.headers
            .map((c) => `<th>${inlineToHtml(c)}</th>`)
            .join("")}</tr></thead>`;
          const tbody = `<tbody>${block.rows
            .map(
              (row) =>
                `<tr>${row.map((c) => `<td>${inlineToHtml(c)}</td>`).join("")}</tr>`
            )
            .join("")}</tbody>`;
          return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
        }
        case "code":
          return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
        case "hr":
          return `<hr/>`;
        case "blockquote":
          return `<blockquote>${inlineToHtml(block.children)}</blockquote>`;
        default:
          return "";
      }
    })
    .join("\n");
}

function buildPrintHtml(
  popi: POPI,
  markdown: string,
  flowchartSvgs: { title: string; svg: string }[] | null
): string {
  const textMd = markdown.replace(/```mermaid[\s\S]*?```/gi, "").trim();
  const blocks = parseMarkdown(textMd);
  const body = blocksToHtml(blocks);

  const flowSection =
    flowchartSvgs && flowchartSvgs.length > 0
      ? flowchartSvgs
          .map(
            (fc) => `<section class="flowchart">
        <h2>${escapeHtml(fc.title)}</h2>
        <div class="flowchart-frame">${fc.svg}</div>
      </section>`
          )
          .join("\n")
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(popi.report_number)} — ${escapeHtml(popi.title)}</title>
  <style>
    @page { margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.65;
      font-size: 11pt;
      margin: 0;
      padding: 24px 28px 40px;
      max-width: 800px;
      margin-inline: auto;
    }
    .cover {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 28px;
      background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
    }
    .cover .num {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 11pt;
      font-weight: 800;
      color: #1d4ed8;
      letter-spacing: 0.02em;
    }
    .cover h1 {
      font-size: 16pt;
      margin: 8px 0 6px;
      border: none;
      padding: 0;
      color: #0f172a;
    }
    .cover .meta { font-size: 10pt; color: #64748b; }
    h1 {
      font-size: 15pt;
      margin: 1.4em 0 0.5em;
      padding-bottom: 0.35em;
      border-bottom: 2px solid #e2e8f0;
      color: #0f172a;
      page-break-after: avoid;
    }
    h2 {
      font-size: 12.5pt;
      margin: 1.2em 0 0.4em;
      padding-left: 10px;
      border-left: 3px solid #3b82f6;
      color: #1e293b;
      page-break-after: avoid;
    }
    h3, h4 {
      font-size: 11.5pt;
      margin: 1em 0 0.35em;
      color: #1e40af;
      page-break-after: avoid;
    }
    p { margin: 0.45em 0; color: #334155; }
    strong { color: #0f172a; }
    em { color: #64748b; }
    ul, ol { margin: 0.4em 0 0.7em; padding-left: 1.4em; }
    li { margin: 0.25em 0; }
    code {
      font-family: Consolas, monospace;
      font-size: 0.9em;
      background: #f1f5f9;
      padding: 0.05em 0.3em;
      border-radius: 3px;
    }
    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px 14px;
      border-radius: 8px;
      overflow: auto;
      font-size: 9pt;
    }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.4em 0; }
    blockquote {
      margin: 0.7em 0;
      padding: 0.5em 0.9em;
      border-left: 3px solid #93c5fd;
      background: #f8fafc;
      color: #64748b;
    }
    .table-wrap { margin: 0.9em 0 1.1em; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 7px 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }
    tr:nth-child(even) td { background: #fafbfc; }
    .flowchart {
      margin-top: 1.6em;
      page-break-inside: avoid;
    }
    .flowchart-frame {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      background: #fff;
      text-align: center;
      overflow: hidden;
    }
    .flowchart-frame svg {
      max-width: 100%;
      height: auto;
    }
    .print-hint {
      position: fixed; top: 12px; right: 12px;
      background: #1d4ed8; color: #fff;
      font-size: 12px; font-weight: 700;
      padding: 10px 14px; border-radius: 10px;
      box-shadow: 0 4px 14px rgb(29 78 216 / 0.35);
      z-index: 10;
    }
    @media print {
      .print-hint { display: none !important; }
      body { padding: 0; max-width: none; }
      .cover { break-inside: avoid; }
      .flowchart { break-inside: avoid; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <div class="print-hint">Use Ctrl+P → Salvar como PDF</div>
  <header class="cover">
    <div class="num">${escapeHtml(popi.report_number)}</div>
    <h1>${escapeHtml(popi.title)}</h1>
    <div class="meta">${escapeHtml(popi.secretaria_name)} · ${popi.year} · ${escapeHtml(popi.routine_category || "Sem categoria")}</div>
  </header>
  <main>${body}</main>
  ${flowSection}
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 500);
    });
  </script>
</body>
</html>`;
}

function exportMarkdownFile(popi: POPI, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, `${fileBaseName(popi)}.md`);
}

function exportDocx(
  popi: POPI,
  markdown: string,
  flowchartPngs: { key: string; png: FlowchartPng }[]
) {
  const imageNames = flowchartPngs.map((fc) =>
    flowchartImageFileName(popi, fc.key)
  );
  const docxBlob = buildDocxBlob(popi, markdown, imageNames);
  const downloads: { blob: Blob; filename: string }[] = [
    { blob: docxBlob, filename: `${fileBaseName(popi)}.docx` },
  ];

  for (const fc of flowchartPngs) {
    downloads.push({
      blob: new Blob([fc.png.bytes], { type: "image/png" }),
      filename: flowchartImageFileName(popi, fc.key),
    });
  }

  triggerDownloads(downloads);
}

function exportPdf(
  popi: POPI,
  markdown: string,
  flowchartSvgs: { title: string; svg: string }[] | null
) {
  const html = buildPrintHtml(popi, markdown, flowchartSvgs);
  const win = window.open("", "_blank", "noopener,noreferrer,width=920,height=720");
  if (!win) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    triggerDownload(blob, `${fileBaseName(popi)}_para_PDF.html`);
    alert(
      "Permita pop-ups para gerar o PDF, ou abra o HTML baixado e use Ctrl+P → Salvar como PDF."
    );
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export async function exportPopiDocument(
  popi: POPI,
  document: POPIDocument,
  format: ExportFormat
): Promise<void> {
  const markdown = getExportMarkdown(popi, document);
  const flowcharts = collectFlowcharts(document);

  if (format === "md") {
    exportMarkdownFile(popi, markdown);
    return;
  }

  if (format === "docx") {
    const pngs: { key: string; png: FlowchartPng }[] = [];
    let failed = 0;
    for (const fc of flowcharts) {
      const png = await renderFlowchartPng(fc.source);
      if (png) {
        pngs.push({ key: fc.key, png });
      } else {
        failed++;
      }
    }
    if (failed > 0) {
      alert(
        "Um ou mais fluxogramas não puderam ser convertidos em imagem. O documento Word será baixado sem essas imagens. Tente exportar em PDF ou regenere o fluxograma."
      );
    }
    exportDocx(popi, markdown, pngs);
    return;
  }

  // pdf
  const svgs: { title: string; svg: string }[] = [];
  for (const fc of flowcharts) {
    const svg = await renderFlowchartSvg(fc.source);
    if (svg) {
      svgs.push({ title: fc.title, svg });
    }
  }
  exportPdf(popi, markdown, svgs);
}

export const __test__ = {
  buildDocxBlob,
  buildPrintHtml,
  getExportMarkdown,
  inlineToPlain,
  parseMarkdown,
};
