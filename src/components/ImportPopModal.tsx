import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  FileText,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import type { Secretaria } from "../types";
import {
  importPopDocument,
  type ImportPopResponse,
} from "../services/popiApi";
import {
  fileToBase64,
  getImportMimeType,
  IMPORT_POP_MAX_BYTES,
  IMPORT_POP_MAX_LABEL,
} from "../utils/importPop";
import SearchableSelect from "./SearchableSelect";

interface ImportPopModalProps {
  secretarias: Secretaria[];
  customPrompt?: string;
  onClose: () => void;
  onImported: (
    result: ImportPopResponse,
    secretariaId: string,
    filename: string
  ) => Promise<void>;
}

export default function ImportPopModal({
  secretarias,
  customPrompt,
  onClose,
  onImported,
}: ImportPopModalProps) {
  const [secretariaId, setSecretariaId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const selectFile = (selected: File | null) => {
    setError("");
    if (!selected) {
      setFile(null);
      return;
    }
    if (!getImportMimeType(selected)) {
      setFile(null);
      setError("Formato não permitido. Selecione um arquivo PDF ou Word (.docx).");
      return;
    }
    if (selected.size > IMPORT_POP_MAX_BYTES) {
      setFile(null);
      setError(`O arquivo excede o limite de ${IMPORT_POP_MAX_LABEL}.`);
      return;
    }
    setFile(selected);
  };

  const handleImport = async () => {
    if (!secretariaId) {
      setError("Selecione a secretaria responsável pelo POP.");
      return;
    }
    if (!file) {
      setError("Selecione um arquivo PDF ou Word.");
      return;
    }
    const mimeType = getImportMimeType(file);
    if (!mimeType) return;

    setError("");
    setIsProcessing(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const fileBase64 = await fileToBase64(file);
      const result = await importPopDocument({
        fileBase64,
        mimeType,
        filename: file.name,
        customPrompt,
        signal: controller.signal,
      });
      await onImported(result, secretariaId, file.name);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível importar o documento."
        );
      }
    } finally {
      abortRef.current = null;
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-pop-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="import-pop-title" className="text-lg font-bold text-slate-900">
              Importar POP existente
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A IA preencherá um rascunho do questionário e apontará o que não
              foi encontrado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Secretaria responsável
            </label>
            <SearchableSelect
              value={secretariaId}
              onChange={setSecretariaId}
              options={secretarias.map((secretaria) => ({
                value: secretaria.id,
                label: secretaria.name,
              }))}
              placeholder="Selecione a secretaria"
              searchPlaceholder="Pesquisar secretaria..."
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Documento
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                disabled={isProcessing}
                onChange={(event) => selectFile(event.target.files?.[0] || null)}
              />
              {file ? (
                <>
                  <FileText className="mb-2 h-8 w-8 text-blue-600" />
                  <span className="max-w-full truncate text-sm font-semibold text-slate-800">
                    {file.name}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · clique para trocar
                  </span>
                </>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    Selecione um PDF ou Word
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    PDF com texto ou escaneado e Word .docx · até {IMPORT_POP_MAX_LABEL}
                  </span>
                </>
              )}
            </label>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-900">
            O arquivo será usado somente para preencher o rascunho. Ele não será
            armazenado, e nenhum POPI será gerado ou aprovado automaticamente.
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isProcessing || !file || !secretariaId}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isProcessing ? "Lendo e analisando..." : "Importar e criar rascunho"}
          </button>
        </div>
      </div>
    </div>
  );
}
