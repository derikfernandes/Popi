import type { POPIInput } from "../types";
import type {
  ImportPopGap,
  ImportPopResponse,
} from "../services/popiApi";

// Limite alinhado à Vercel (~4,5 MB no body HTTP). Em base64 o arquivo
// cresce ~33%, então o tamanho bruto seguro fica em ~3 MB.
export const IMPORT_POP_MAX_BYTES = 3 * 1024 * 1024;
export const IMPORT_POP_MAX_LABEL = "3 MB";
export const PDF_MIME = "application/pdf";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface ImportReviewInfo {
  filename: string;
  confidence: ImportPopResponse["confidence"];
  summary: string;
  gaps: ImportPopGap[];
}

const IMPORT_REVIEW_PREFIX = "popi_import_review:";

export function getImportMimeType(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return PDF_MIME;
  if (extension === "docx") return DOCX_MIME;
  return null;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export function normalizeImportedInputs(
  inputs: ImportPopResponse["inputs"]
): POPIInput {
  const routineTypes: POPIInput["routine_type"][] = [
    "Atende diretamente o cidadão",
    "Rotina interna",
    "Outro",
  ];
  const routineType = routineTypes.includes(inputs.routine_type)
    ? inputs.routine_type
    : "Outro";

  return {
    role_or_position: inputs.role_or_position || "",
    routine_name: inputs.routine_name || "",
    routine_goal: inputs.routine_goal || "",
    routine_type: routineType,
    routine_type_detail:
      routineType === "Outro"
        ? inputs.routine_type_detail || inputs.routine_type || ""
        : inputs.routine_type_detail || "",
    start_trigger: inputs.start_trigger || "",
    frequency: inputs.frequency || "",
    frequency_detail: inputs.frequency_detail || "",
    participants: Array.isArray(inputs.participants)
      ? inputs.participants
      : [],
    participants_free: inputs.participants_free || "",
    norma_orientadora: inputs.norma_orientadora || "",
    passo_a_passo: Array.isArray(inputs.passo_a_passo)
      ? inputs.passo_a_passo
      : [],
    passo_a_passo_free: inputs.passo_a_passo_free || "",
    sistemas_documentos_utilizados:
      inputs.sistemas_documentos_utilizados || "",
    informacoes_indispensaveis: inputs.informacoes_indispensaveis || "",
    tempo_medio: inputs.tempo_medio || "",
    gargalos_dificuldades: inputs.gargalos_dificuldades || "",
    melhorias_automacoes_sugeridas:
      inputs.melhorias_automacoes_sugeridas || "",
    metas_indicadores: Array.isArray(inputs.metas_indicadores)
      ? inputs.metas_indicadores
      : [],
    metas_indicadores_free: inputs.metas_indicadores_free || "",
    additional_notes: null,
  };
}

export function saveImportReviewInfo(
  popiId: string,
  info: ImportReviewInfo
): void {
  sessionStorage.setItem(
    `${IMPORT_REVIEW_PREFIX}${popiId}`,
    JSON.stringify(info)
  );
}

export function readImportReviewInfo(
  popiId: string
): ImportReviewInfo | null {
  const raw = sessionStorage.getItem(`${IMPORT_REVIEW_PREFIX}${popiId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImportReviewInfo;
  } catch {
    return null;
  }
}

export function clearImportReviewInfo(popiId: string): void {
  sessionStorage.removeItem(`${IMPORT_REVIEW_PREFIX}${popiId}`);
}

export function getGapBlock(field: string): number {
  const normalizedField = field.replace(/^(inputs|meta)\./, "");
  const blocks: Record<string, number> = {
    department: 1,
    division: 1,
    role_or_position: 1,
    routine_name: 1,
    routine_goal: 1,
    routine_type: 2,
    routine_type_detail: 2,
    start_trigger: 2,
    frequency: 2,
    frequency_detail: 2,
    participants: 3,
    participants_free: 3,
    norma_orientadora: 3,
    passo_a_passo: 4,
    passo_a_passo_free: 4,
    sistemas_documentos_utilizados: 4,
    informacoes_indispensaveis: 4,
    tempo_medio: 4,
    gargalos_dificuldades: 5,
    melhorias_automacoes_sugeridas: 5,
    metas_indicadores: 5,
    metas_indicadores_free: 5,
  };
  return blocks[normalizedField] || 1;
}
