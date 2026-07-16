import React, { useMemo, useState, memo, useCallback } from "react";
import { POPI } from "../types";
import {
  Search,
  Plus,
  FileText,
  ChevronRight,
  CheckCircle,
  Clock,
  Archive,
  Sparkles,
  AlertCircle,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  Upload,
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";

const PAGE_SIZE = 20;

interface PopiListProps {
  popis: POPI[];
  onSelectPopi: (id: string) => void;
  onNewPopi: () => void;
  onImportPopi: () => void;
  onDeletePopi?: (id: string) => void;
}

function getStatusBadge(status: POPI["status"]) {
  switch (status) {
    case "rascunho":
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/50 px-2.5 py-1 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          Rascunho
        </span>
      );
    case "gerado":
      return (
        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/50 px-2.5 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Gerado por IA
        </span>
      );
    case "em_edicao":
      return (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/50 px-2.5 py-1 rounded-full text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          Em Edição
        </span>
      );
    case "em_revisao":
      return (
        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200/50 px-2.5 py-1 rounded-full text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          Em Revisão
        </span>
      );
    case "aprovado":
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-1 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          Aprovado
        </span>
      );
    case "arquivado":
      return (
        <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-200/50 px-2.5 py-1 rounded-full text-xs font-semibold">
          <Archive className="w-3.5 h-3.5" />
          Arquivado
        </span>
      );
    default:
      return null;
  }
}

const PopiRow = memo(function PopiRow({
  popi,
  onSelectPopi,
  onRequestDelete,
}: {
  popi: POPI;
  onSelectPopi: (id: string) => void;
  onRequestDelete?: (popi: POPI) => void;
}) {
  return (
    <tr
      onClick={() => onSelectPopi(popi.id)}
      className="hover:bg-slate-50/50 cursor-pointer transition"
    >
      <td className="py-4.5 px-6">
        <div className="font-mono text-xs font-bold text-blue-600">
          {popi.report_number}
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          Criado em {new Date(popi.created_at).toLocaleDateString("pt-BR")}
        </div>
      </td>
      <td className="py-4.5 px-6">
        <div className="text-sm font-semibold text-slate-800">
          {popi.secretaria_name}
        </div>
        <div className="text-xs text-slate-500 truncate max-w-[150px]">
          {popi.department || "Geral"}
        </div>
      </td>
      <td className="py-4.5 px-6">
        <div className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition truncate max-w-[220px]">
          {popi.title}
        </div>
        <div className="text-xs text-slate-500 truncate max-w-[200px]">
          {popi.division || "Divisão geral"}
        </div>
      </td>
      <td className="py-4.5 px-6">
        {popi.routine_category ? (
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {popi.routine_category}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Não classificado</span>
        )}
      </td>
      <td className="py-4.5 px-6">{getStatusBadge(popi.status)}</td>
      <td className="py-4.5 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          {onRequestDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(popi);
              }}
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition p-1.5 rounded-lg"
              title="Excluir POPI"
              id={`btn-delete-${popi.id}`}
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          )}
          <button className="text-slate-400 hover:text-blue-600 transition p-1.5 rounded-lg hover:bg-slate-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

function PopiList({
  popis,
  onSelectPopi,
  onNewPopi,
  onImportPopi,
  onDeletePopi,
}: PopiListProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [popiToDelete, setPopiToDelete] = useState<POPI | null>(null);
  const [page, setPage] = useState(1);

  const filteredPopis = useMemo(() => {
    const q = search.toLowerCase();
    return popis.filter((popi) => {
      const matchesSearch =
        popi.title.toLowerCase().includes(q) ||
        popi.report_number.toLowerCase().includes(q) ||
        popi.secretaria_name.toLowerCase().includes(q);
      const matchesStatus =
        filterStatus === "all" ? true : popi.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [popis, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPopis.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPopis.slice(start, start + PAGE_SIZE);
  }, [filteredPopis, currentPage]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleFilter = useCallback((value: string) => {
    setFilterStatus(value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por título, número, secretaria..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <SearchableSelect
            value={filterStatus}
            onChange={handleFilter}
            topOptions={[{ value: "all", label: "Todos Status" }]}
            options={[
              { value: "rascunho", label: "Rascunho" },
              { value: "gerado", label: "Gerado por IA" },
              { value: "em_edicao", label: "Em Edição" },
              { value: "em_revisao", label: "Em Revisão" },
              { value: "aprovado", label: "Aprovado" },
              { value: "arquivado", label: "Arquivado" },
            ]}
            searchPlaceholder="Pesquisar status..."
            className="w-44 shrink-0"
            triggerClassName="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm h-9 px-3 focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            onClick={onImportPopi}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            Importar POP existente
          </button>
          <button
            onClick={onNewPopi}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Novo POPI
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredPopis.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="bg-slate-50 p-4 rounded-full inline-block mb-3 text-slate-400">
              <FileText className="w-10 h-10 mx-auto" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Nenhum POPI encontrado
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {search || filterStatus !== "all"
                ? "Tente mudar os termos de pesquisa ou filtros utilizados."
                : "Crie o primeiro Procedimento Operativo Padrão Inteligente da Prefeitura."}
            </p>
            {!search && filterStatus === "all" && (
              <button
                onClick={onNewPopi}
                className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold py-2 px-4 rounded-lg transition"
              >
                Começar Mapeamento
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/75">
                  <tr>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Número do POPI
                    </th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Secretaria / Setor
                    </th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Título do Processo
                    </th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100/70">
                  {pageItems.map((popi) => (
                    <PopiRow
                      key={popi.id}
                      popi={popi}
                      onSelectPopi={onSelectPopi}
                      onRequestDelete={
                        onDeletePopi ? (p) => setPopiToDelete(p) : undefined
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPopis.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500 font-medium">
                  Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredPopis.length)} de{" "}
                  {filteredPopis.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </button>
                  <span className="text-xs font-bold text-slate-600">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    Próxima
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {popiToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="delete-confirmation-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="bg-rose-100 p-2 rounded-xl">
                <AlertTriangle className="w-5 h-5 col-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Confirmar Exclusão
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Você está prestes a excluir permanentemente o mapeamento de processo:
              <strong className="block text-slate-800 text-sm font-extrabold mt-1">
                {popiToDelete.title} ({popiToDelete.report_number})
              </strong>
              Esta ação irá apagar todas as respostas das 16 perguntas, o documento
              gerado de POP e Relatório TO-BE, bem como o histórico completo de
              versionamento deste registro municipal.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPopiToDelete(null)}
                className="text-xs text-slate-600 font-bold hover:bg-slate-100 py-2.5 px-4 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Cancelar e Voltar
              </button>
              <button
                onClick={() => {
                  if (onDeletePopi) {
                    onDeletePopi(popiToDelete.id);
                  }
                  setPopiToDelete(null);
                }}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Sim, Excluir Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PopiList);
