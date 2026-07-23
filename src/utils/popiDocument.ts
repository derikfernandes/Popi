import type { POPIDocument } from "../types";
import { sanitizeMermaidFlowchart } from "./sanitizeMermaid";

/** Documento vazio seguro para snapshots/Firestore (evita `undefined` no setDoc). */
export function emptyPopiDocument(): POPIDocument {
  return {
    pop_markdown: "",
    intelligent_report_markdown: "",
    flowchart_mermaid: "",
    flowchart_tobe_flow_mermaid: "",
    flowchart_tobe_system_mermaid: "",
    final_markdown: "",
    last_generated_at: null,
    last_manual_edit_at: null,
  };
}

export interface ParsedPopiMarkdown {
  popMarkdown: string;
  reportMarkdown: string;
  /** Fluxograma AS-IS. */
  mermaidCode: string;
  /** Fluxograma TO-BE — alterações de fluxo de rotina. */
  mermaidTobeFlow: string;
  /** Fluxograma TO-BE — alterações sistêmicas. */
  mermaidTobeSystem: string;
}

type FlowchartKind = "asIs" | "tobeFlow" | "tobeSystem";

/**
 * Classifica um bloco mermaid pelo título da seção que o antecede.
 * Fallback: ordem de aparição (1º AS-IS, 2º TO-BE fluxo, 3º TO-BE sistêmico).
 */
function classifyMermaidBlock(
  precedingText: string,
  orderIndex: number
): FlowchartKind {
  const headings = precedingText.match(/^#{1,4}\s+.*$/gm);
  const lastHeading = headings?.length
    ? headings[headings.length - 1].toLowerCase()
    : "";

  if (lastHeading.includes("fluxograma")) {
    if (lastHeading.includes("as-is") || lastHeading.includes("as is")) {
      return "asIs";
    }
    if (
      lastHeading.includes("sist\u00eamic") ||
      lastHeading.includes("sistemic")
    ) {
      return "tobeSystem";
    }
    if (
      lastHeading.includes("fluxo de rotina") ||
      lastHeading.includes("to-be") ||
      lastHeading.includes("to be")
    ) {
      return "tobeFlow";
    }
  }

  return orderIndex === 0 ? "asIs" : orderIndex === 1 ? "tobeFlow" : "tobeSystem";
}

/** Extrai partes do markdown completo gerado pela IA (POP, relatório e os 3 fluxogramas Mermaid). */
export function parseGeneratedPopiMarkdown(rawMarkdown: string): ParsedPopiMarkdown {
  let popMarkdown = "";
  let reportMarkdown = "";

  const popiIndex = rawMarkdown.indexOf("# PARTE 1");
  const reportIndex = rawMarkdown.indexOf("# PARTE 2");
  const gapIndex = rawMarkdown.indexOf("# LACUNAS");

  if (popiIndex !== -1 && reportIndex !== -1) {
    popMarkdown = rawMarkdown.slice(popiIndex, reportIndex).trim();
    reportMarkdown = rawMarkdown
      .slice(reportIndex, gapIndex !== -1 ? gapIndex : rawMarkdown.length)
      .trim();
  } else {
    popMarkdown = rawMarkdown;
    reportMarkdown = "Diagnóstico gerado em harmonia com o documento completo.";
  }

  const flowcharts: Record<FlowchartKind, string> = {
    asIs: "",
    tobeFlow: "",
    tobeSystem: "",
  };

  const mermaidRegex = /```mermaid([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let orderIndex = 0;
  while ((match = mermaidRegex.exec(rawMarkdown)) !== null) {
    const code = match[1]?.trim();
    if (!code) {
      orderIndex++;
      continue;
    }
    const kind = classifyMermaidBlock(
      rawMarkdown.slice(0, match.index),
      orderIndex
    );
    if (!flowcharts[kind]) {
      flowcharts[kind] = sanitizeMermaidFlowchart(code);
    }
    orderIndex++;
  }

  if (!flowcharts.asIs) {
    flowcharts.asIs = `flowchart TD\n    A[Início] --> B[Processamento]\n    B --> C[Fim]`;
  }

  return {
    popMarkdown,
    reportMarkdown,
    mermaidCode: flowcharts.asIs,
    mermaidTobeFlow: flowcharts.tobeFlow,
    mermaidTobeSystem: flowcharts.tobeSystem,
  };
}

export function buildDocumentFromGeneration(
  rawMarkdown: string
): Omit<POPIDocument, "last_manual_edit_at"> & { last_manual_edit_at: null } {
  const {
    popMarkdown,
    reportMarkdown,
    mermaidCode,
    mermaidTobeFlow,
    mermaidTobeSystem,
  } = parseGeneratedPopiMarkdown(rawMarkdown);

  return {
    pop_markdown: popMarkdown,
    intelligent_report_markdown: reportMarkdown,
    flowchart_mermaid: mermaidCode,
    flowchart_tobe_flow_mermaid: mermaidTobeFlow,
    flowchart_tobe_system_mermaid: mermaidTobeSystem,
    final_markdown: rawMarkdown,
    last_generated_at: new Date().toISOString(),
    last_manual_edit_at: null,
  };
}
