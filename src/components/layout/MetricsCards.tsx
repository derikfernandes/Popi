import React, { memo } from "react";
import { FileText, CheckCircle, FileEdit, Settings } from "lucide-react";
import { usePopiData } from "../../contexts/PopiDataContext";

function MetricsCards() {
  const { metrics } = usePopiData();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Total POPIs</p>
          <p className="text-xl font-black text-slate-800">{metrics.total}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
        <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Aprovados</p>
          <p className="text-xl font-black text-slate-800">{metrics.approved}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
        <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600">
          <FileEdit className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Em Revisão</p>
          <p className="text-xl font-black text-slate-800">{metrics.inReview}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
        <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Rascunhos</p>
          <p className="text-xl font-black text-slate-800">{metrics.rascunho}</p>
        </div>
      </div>
    </div>
  );
}

export default memo(MetricsCards);
