import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

marked.setOptions({
  gfm: true,
  breaks: false,
});

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
  hr: "---",
});

turndown.use(gfm);

/** Converte Markdown (armazenamento) em HTML para o editor TipTap. */
export function markdownToHtml(markdown: string): string {
  const source = (markdown || "").trim();
  if (!source) return "<p></p>";
  const html = marked.parse(source, { async: false }) as string;
  return html || "<p></p>";
}

/** Converte HTML do TipTap de volta para Markdown. */
export function htmlToMarkdown(html: string): string {
  const cleaned = (html || "")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
  if (!cleaned) return "";
  return turndown.turndown(cleaned).trim();
}
