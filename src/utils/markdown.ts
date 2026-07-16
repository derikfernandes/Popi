/** Parser Markdown leve para UI e exportação (POPI). */

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "bold"; children: InlineNode[] }
  | { type: "italic"; children: InlineNode[] }
  | { type: "code"; text: string };

export type BlockNode =
  | { type: "heading"; level: 1 | 2 | 3 | 4; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "table"; headers: InlineNode[][]; rows: InlineNode[][][] }
  | { type: "code"; language: string; text: string }
  | { type: "hr" }
  | { type: "blockquote"; children: InlineNode[] };

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  // code, **bold**, __bold__, *italic*, _italic_ (sem lookbehind)
  const re =
    /(`+)([^`]*?)\1|\*\*(.+?)\*\*|__(.+?)__|\*([^*]+?)\*|_([^_]+?)_/g;

  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push({ type: "text", text: text.slice(last, match.index) });
    }
    if (match[2] !== undefined) {
      nodes.push({ type: "code", text: match[2] });
    } else if (match[3] !== undefined) {
      nodes.push({ type: "bold", children: [{ type: "text", text: match[3] }] });
    } else if (match[4] !== undefined) {
      nodes.push({ type: "bold", children: [{ type: "text", text: match[4] }] });
    } else if (match[5] !== undefined) {
      nodes.push({ type: "italic", children: [{ type: "text", text: match[5] }] });
    } else if (match[6] !== undefined) {
      nodes.push({ type: "italic", children: [{ type: "text", text: match[6] }] });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push({ type: "text", text: text.slice(last) });
  }
  return nodes.length ? nodes : [{ type: "text", text: "" }];
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|[\s:|-]*\|?\s*$/.test(line) && /---/.test(line);
}

function splitTableRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);
  return row.split("|").map((c) => c.trim());
}

function looksLikeTableRow(line: string): boolean {
  const t = line.trim();
  return t.includes("|") && !t.startsWith("```");
}

/** Converte markdown em blocos estruturados. */
export function parseMarkdown(md: string): BlockNode[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing ```
      // Fluxogramas Mermaid: omitir do documento textual (já tem aba própria)
      if (language.toLowerCase() !== "mermaid") {
        blocks.push({ type: "code", language, text: buf.join("\n") });
      }
      continue;
    }

    // HR
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4,
        children: parseInline(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Table
    if (
      looksLikeTableRow(line) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const headers = splitTableRow(line).map(parseInline);
      i += 2;
      const rows: InlineNode[][][] = [];
      while (i < lines.length && looksLikeTableRow(lines[i]) && !isTableSeparator(lines[i])) {
        rows.push(splitTableRow(lines[i]).map(parseInline));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // 2-column key/value table without separator (common in POPI header)
    if (
      looksLikeTableRow(line) &&
      splitTableRow(line).length === 2 &&
      i + 1 < lines.length &&
      looksLikeTableRow(lines[i + 1]) &&
      !lines[i + 1].trim().startsWith("#")
    ) {
      const headers = splitTableRow(line).map(parseInline);
      // If first row looks like header labels, consume following rows as body
      const firstCells = splitTableRow(line);
      const isHeaderish =
        firstCells.some((c) => /IDENTIFICA|ROTINA|MAPEADA/i.test(c)) ||
        isTableSeparator(lines[i + 1] || "");

      if (isHeaderish && isTableSeparator(lines[i + 1] || "")) {
        // handled above
      } else if (
        firstCells[0].includes("IDENTIFICA") ||
        /^\*\*.+\*\*$/.test(firstCells[0]) ||
        firstCells[0].endsWith(":")
      ) {
        const rows: InlineNode[][][] = [];
        // Treat current and following pipe-rows as key-value rows (no separate header)
        while (i < lines.length && looksLikeTableRow(lines[i]) && !isTableSeparator(lines[i])) {
          const cells = splitTableRow(lines[i]).map(parseInline);
          rows.push(cells);
          i++;
        }
        const kvHeaders: InlineNode[][] = [
          [{ type: "text", text: "Campo" }],
          [{ type: "text", text: "Valor" }],
        ];
        blocks.push({
          type: "table",
          headers: kvHeaders,
          rows,
        });
        continue;
      }
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const text = line.replace(/^\s*>\s?/, "");
      blocks.push({ type: "blockquote", children: parseInline(text) });
      i++;
      continue;
    }

    // List
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: InlineNode[][] = [];
      while (
        i < lines.length &&
        (ordered
          ? /^\s*\d+\.\s+/.test(lines[i])
          : /^\s*[-*]\s+/.test(lines[i]))
      ) {
        const itemText = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "");
        items.push(parseInline(itemText));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // Blank
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph (merge consecutive non-empty plain lines)
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i]) &&
      !(
        looksLikeTableRow(lines[i]) &&
        i + 1 < lines.length &&
        isTableSeparator(lines[i + 1])
      )
    ) {
      // stop if next is a key-value table start
      if (
        looksLikeTableRow(lines[i]) &&
        splitTableRow(lines[i])[0]?.includes("IDENTIFICA")
      ) {
        break;
      }
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: "paragraph",
      children: parseInline(paraLines.join(" ")),
    });
  }

  return blocks;
}

/** Texto plano (sem marcadores) a partir de inlines. */
export function inlineToPlain(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text" || n.type === "code") return n.text;
      return inlineToPlain(n.children);
    })
    .join("");
}

export function blocksToPlain(blocks: BlockNode[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
      case "paragraph":
      case "blockquote":
        parts.push(inlineToPlain(b.children));
        break;
      case "list":
        b.items.forEach((item, idx) => {
          parts.push(
            `${b.ordered ? `${idx + 1}.` : "•"} ${inlineToPlain(item)}`
          );
        });
        break;
      case "table":
        parts.push(b.headers.map(inlineToPlain).join(" | "));
        for (const row of b.rows) {
          parts.push(row.map(inlineToPlain).join(" | "));
        }
        break;
      case "code":
        parts.push(b.text);
        break;
      case "hr":
        parts.push("—");
        break;
    }
  }
  return parts.join("\n");
}
