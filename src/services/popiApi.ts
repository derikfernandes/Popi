import type { POPI, POPIInput } from "../types";
import { dedupeAsync } from "../utils/cache";

export interface SuggestCategoriesResponse {
  categoria_rotina: string;
  justificativa_categoria_rotina: string;
  categorias_melhoria: Array<{ category: string; justification: string }>;
  nivel_confianca: "baixo" | "médio" | "alto";
  lacunas_para_classificacao: string[];
}

export interface QaPopiResponse {
  classificacao: string;
  justificativa: string;
  erros_encontrados: Array<{
    tipo: string;
    trecho: string;
    problema: string;
    correcao: string;
  }>;
  riscos_identificados: string[];
}

export interface ImportPopGap {
  field: string;
  label: string;
  reason: string;
}

export interface ImportPopResponse {
  meta: {
    title: string;
    department: string;
    division: string;
  };
  inputs: Omit<POPIInput, "additional_notes">;
  gaps: ImportPopGap[];
  confidence: "baixo" | "médio" | "alto";
  summary: string;
}

export class RequestAbortedError extends Error {
  constructor(message = "Requisição cancelada") {
    super(message);
    this.name = "RequestAbortedError";
  }
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const err = (await res.json()) as { error?: string };
    return err.error || fallback;
  } catch {
    return fallback;
  }
}

async function postJson<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (signal?.aborted) {
    throw new RequestAbortedError();
  }

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Erro de servidor"));
  }

  return (await res.json()) as T;
}

export async function importPopDocument(params: {
  fileBase64: string;
  mimeType: string;
  filename: string;
  customPrompt?: string;
  signal?: AbortSignal;
}): Promise<ImportPopResponse> {
  return postJson<ImportPopResponse>(
    "/api/import-pop",
    {
      fileBase64: params.fileBase64,
      mimeType: params.mimeType,
      filename: params.filename,
      customPrompt: params.customPrompt,
    },
    params.signal
  );
}

export async function generatePopiDocument(params: {
  popi: POPI;
  inputs: POPIInput;
  customPrompt?: string;
  signal?: AbortSignal;
}): Promise<{ final_markdown: string }> {
  return postJson("/api/generate-popi", {
    popi: params.popi,
    inputs: params.inputs,
    customPrompt: params.customPrompt,
  }, params.signal);
}

export async function runPopiQa(params: {
  inputs: POPIInput;
  documentMarkdown: string;
  customPrompt?: string;
  signal?: AbortSignal;
}): Promise<QaPopiResponse> {
  try {
    return await postJson<QaPopiResponse>(
      "/api/qa-popi",
      {
        inputs: params.inputs,
        documentMarkdown: params.documentMarkdown,
        customPrompt: params.customPrompt,
      },
      params.signal
    );
  } catch (err) {
    if (err instanceof RequestAbortedError) throw err;
    if (err instanceof Error && err.message === "Erro de servidor") {
      throw new Error("Erro ao chamar auditoria.");
    }
    throw err;
  }
}

export async function suggestPopiCategories(params: {
  inputs: POPIInput;
  customPrompt?: string;
  signal?: AbortSignal;
}): Promise<SuggestCategoriesResponse> {
  try {
    return await postJson<SuggestCategoriesResponse>(
      "/api/suggest-categories",
      {
        inputs: params.inputs,
        customPrompt: params.customPrompt,
      },
      params.signal
    );
  } catch (err) {
    if (err instanceof RequestAbortedError) throw err;
    throw new Error("Erro na solicitação");
  }
}

/** Evita disparar a mesma geração duas vezes em paralelo para o mesmo POPI. */
export function generatePopiDocumentDeduped(params: {
  popi: POPI;
  inputs: POPIInput;
  customPrompt?: string;
  signal?: AbortSignal;
}): Promise<{ final_markdown: string }> {
  return dedupeAsync(`generate-popi:${params.popi.id}`, () =>
    generatePopiDocument(params)
  );
}
