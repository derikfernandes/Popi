import React from "react";
import { CloudOff } from "lucide-react";
import { usePopiData } from "../../contexts/PopiDataContext";

export default function CloudErrorBanner() {
  const { cloudError, setCloudError } = usePopiData();

  if (!cloudError) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-start justify-between gap-4 shrink-0">
      <div className="flex items-start gap-2 text-amber-800 text-xs font-medium">
        <CloudOff className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{cloudError}</span>
      </div>
      <button
        onClick={() => setCloudError(null)}
        className="text-amber-700 hover:text-amber-900 text-xs font-bold shrink-0"
      >
        Dispensar
      </button>
    </div>
  );
}
