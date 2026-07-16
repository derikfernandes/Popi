import React, { useEffect, useRef } from "react";
import { ArrowLeft, Check, Download, FileText, FileType, FileCode } from "lucide-react";
import {
  EXPORT_FORMAT_OPTIONS,
  type ExportFormat,
} from "../utils/exportPopi";

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  md: <FileCode className="w-4 h-4 text-emerald-600" />,
  docx: <FileText className="w-4 h-4 text-blue-600" />,
  pdf: <FileType className="w-4 h-4 text-red-500" />,
};

interface ExportOptionsPanelProps {
  open: boolean;
  selectedFormat: ExportFormat;
  onSelectFormat: (format: ExportFormat) => void;
  onExport: () => void | Promise<void>;
  onClose: () => void;
  /** Elemento que contém o botão trigger + o painel (para clique fora). */
  containerRef: React.RefObject<HTMLElement | null>;
  exporting?: boolean;
}

export default function ExportOptionsPanel({
  open,
  selectedFormat,
  onSelectFormat,
  onExport,
  onClose,
  containerRef,
  exporting = false,
}: ExportOptionsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onPointer = (e: MouseEvent) => {
      const root = containerRef.current;
      if (root && !root.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose, containerRef]);

  if (!open) return null;

  const selected = EXPORT_FORMAT_OPTIONS.find((o) => o.id === selectedFormat);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 w-[min(100vw-2rem,320px)] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in"
      role="dialog"
      aria-label="Opções de exportação"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-bold text-slate-900">Exportar</h2>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Formato de arquivo
          </p>
          <ul className="space-y-1.5">
            {EXPORT_FORMAT_OPTIONS.map((option) => {
              const isSelected = option.id === selectedFormat;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => onSelectFormat(option.id)}
                    className={`w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-xl border transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/80 ring-1 ring-blue-500/30"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-100">
                      {FORMAT_ICONS[option.id]}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {option.label}
                        </span>
                        {option.id === "md" && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                            Sugestão
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {option.description}
                      </span>
                    </span>
                    <span
                      className={`mt-1 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
          <p className="text-[11px] text-amber-900/80 leading-relaxed">
            Inclui numeração, secretaria e conteúdo consolidado do POPI.
            {selected?.id === "docx" &&
              " No Word, baixa o .docx e o fluxograma em PNG separado (imagem)."}
            {selected?.id === "pdf" &&
              " No PDF, confirme a impressão e escolha “Salvar como PDF”."}
            {selected?.id === "md" &&
              " No Markdown, o fluxograma vem no bloco Mermaid do arquivo."}
          </p>
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait text-white text-xs font-bold shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          {exporting
            ? "Preparando exportação..."
            : `Exportar ${selected?.extension.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
