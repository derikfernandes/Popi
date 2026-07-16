/**
 * Corrige sintaxe Mermaid gerada por IA que quebra o parser
 * (ex.: parênteses dentro de nós sem aspas).
 *
 * Inválido:  A[Vaga também no SIRESP (CROSS)]
 * Válido:    A["Vaga também no SIRESP (CROSS)"]
 */

const SPECIAL_IN_LABEL = /[()[\]{}<>:;,"'/\\|]/;

function alreadyQuoted(label: string): boolean {
  const t = label.trim();
  return t.length >= 2 && t.startsWith('"') && t.endsWith('"');
}

function needsQuotes(label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed || alreadyQuoted(trimmed)) return false;
  return SPECIAL_IN_LABEL.test(trimmed);
}

function quoteLabel(label: string): string {
  const trimmed = label.trim();
  if (alreadyQuoted(trimmed)) return trimmed;
  const escaped = trimmed.replace(/\\/g, "\\\\").replace(/"/g, "#quot;");
  return `"${escaped}"`;
}

function quoteIfNeeded(label: string): string {
  return needsQuotes(label) ? quoteLabel(label) : label.trim();
}

/**
 * Envolve o texto interno de formas de nó em aspas quando há caracteres
 * que o parser Mermaid interpreta como delimitadores (ex.: parênteses).
 */
export function sanitizeMermaidFlowchart(code: string): string {
  if (!code?.trim()) return code;

  let result = code;

  // Cilindro: A[(texto)]
  result = result.replace(
    /(\b[A-Za-z][\w-]*)\[\(([^\]\n]*?)\)\]/g,
    (_full, id: string, label: string) => `${id}[(${quoteIfNeeded(label)})]`
  );

  // Estádio: A([texto])
  result = result.replace(
    /(\b[A-Za-z][\w-]*)\(\[([^\]\n]*?)\]\)/g,
    (_full, id: string, label: string) => `${id}([${quoteIfNeeded(label)}])`
  );

  // Círculo: A((texto))
  result = result.replace(
    /(\b[A-Za-z][\w-]*)\(\(([^\)\n]*?)\)\)/g,
    (_full, id: string, label: string) => `${id}((${quoteIfNeeded(label)}))`
  );

  // Hexágono: A{{texto}}
  result = result.replace(
    /(\b[A-Za-z][\w-]*)\{\{([^\}\n]*?)\}\}/g,
    (_full, id: string, label: string) => `${id}{{${quoteIfNeeded(label)}}}`
  );

  // Subrotina: A[[texto]]
  result = result.replace(
    /(\b[A-Za-z][\w-]*)\[\[([^\]]*?)\]]/g,
    (_full, id: string, label: string) => `${id}[[${quoteIfNeeded(label)}]]`
  );

  // Diamante: A{texto} (não casar {{ }})
  result = result.replace(
    /(\b[A-Za-z][\w-]*)\{([^{}\n]+)\}/g,
    (full, id: string, label: string) => {
      if (full.includes("{{")) return full;
      return `${id}{${quoteIfNeeded(label)}}`;
    }
  );

  // Retângulo: A[texto] — principal causa do erro (SIRESP (CROSS))
  result = result.replace(
    /(\b[A-Za-z][\w-]*)\[([^\[\]\n]+)\]/g,
    (full, id: string, label: string) => {
      // Já tratado como cilindro A[(...)] 
      if (label.startsWith("(") && label.endsWith(")")) return full;
      // Já tratado como subrotina A[[...]]
      if (label.startsWith("[") && label.endsWith("]")) return full;
      return `${id}[${quoteIfNeeded(label)}]`;
    }
  );

  // Round simples: A(texto) — evitar (( e ([
  result = result.replace(
    /(\b[A-Za-z][\w-]*)\(([^)(\[\n]+)\)/g,
    (_full, id: string, label: string) => `${id}(${quoteIfNeeded(label)})`
  );

  return result;
}

/** Remove fences ```mermaid se presentes e sanitiza. */
export function prepareMermaidCode(raw: string): string {
  let cleaned = raw.trim();

  if (cleaned.startsWith("```mermaid")) {
    cleaned = cleaned.replace(/^```mermaid/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "");
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/```$/, "");
  }

  return sanitizeMermaidFlowchart(cleaned.trim());
}
