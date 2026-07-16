import React from "react";
import { RefreshCw } from "lucide-react";

/** Fallback visual para rotas e componentes em lazy loading. */
export default function PageLoading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
      <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
      <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}
