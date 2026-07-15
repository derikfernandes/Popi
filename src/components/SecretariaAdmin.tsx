import React, { useState } from "react";
import { Secretaria } from "../types";
import { PlusCircle, Building2, Pencil, X, Save } from "lucide-react";

interface SecretariaAdminProps {
  secretarias: Secretaria[];
  onAddSecretaria: (sec: Omit<Secretaria, "id" | "created_at" | "updated_at">) => void;
  onUpdateSecretaria: (
    id: string,
    patch: Pick<Secretaria, "name" | "official_name" | "acronym" | "active">
  ) => void | Promise<void>;
}

export default function SecretariaAdmin({
  secretarias,
  onAddSecretaria,
  onUpdateSecretaria,
}: SecretariaAdminProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = editingId !== null;

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setOfficialName("");
    setAcronym("");
    setActive(true);
    setError("");
  };

  const startEdit = (sec: Secretaria) => {
    setEditingId(sec.id);
    setName(sec.name);
    setOfficialName(sec.official_name);
    setAcronym(sec.acronym);
    setActive(sec.active !== false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !officialName.trim() || !acronym.trim()) {
      setError("Todos os campos de identificação são obrigatórios.");
      return;
    }

    const normalizedAcronym = acronym.toUpperCase().trim();
    const acronymTaken = secretarias.some(
      (s) =>
        s.acronym.toUpperCase() === normalizedAcronym &&
        s.id !== editingId
    );
    if (acronymTaken) {
      setError("Já existe uma secretaria com esta sigla.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editingId) {
        await onUpdateSecretaria(editingId, {
          name: name.trim(),
          official_name: officialName.trim(),
          acronym: normalizedAcronym,
          active,
        });
      } else {
        onAddSecretaria({
          name: name.trim(),
          official_name: officialName.trim(),
          acronym: normalizedAcronym,
          active: true,
        });
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Secretarias Cadastradas</h2>
          <p className="text-sm text-slate-500">
            Cadastre e edite as secretarias executoras usadas na numeração sequencial dos POPIs.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-800 text-sm">
            {isEditing ? "Editar Secretaria" : "Nova Secretaria"}
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Nome Curto
              </label>
              <input
                type="text"
                placeholder="Ex: Saúde"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Nome Oficial Completo
              </label>
              <input
                type="text"
                placeholder="Ex: Secretaria Municipal de Saúde"
                value={officialName}
                onChange={(e) => setOfficialName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 font-mono">
                Sigla
              </label>
              <input
                type="text"
                placeholder="Ex: SS"
                maxLength={5}
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-mono focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isEditing && (
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  {active ? "Ativa" : "Inativa"}
                </span>
              </label>
            )}

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Adicionar
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="min-w-full divide-y divide-slate-100 text-left table-fixed">
          <colgroup>
            <col className="w-[90px]" />
            <col className="w-[22%]" />
            <col />
            <col className="w-[100px]" />
            <col className="w-[110px]" />
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Sigla</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Nome</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                Nome Oficial
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {secretarias.map((sec) => {
              const isActive = sec.active !== false;
              const isRowEditing = editingId === sec.id;
              return (
                <tr
                  key={sec.id}
                  className={`hover:bg-slate-50/50 ${
                    isRowEditing ? "bg-blue-50/40" : ""
                  } ${!isActive ? "opacity-70" : ""}`}
                >
                  <td className="py-3 px-4 text-sm font-mono font-semibold text-blue-600 align-top">
                    {sec.acronym}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-800 align-top break-words">
                    {sec.name}
                  </td>
                  <td
                    className="py-3 px-4 text-sm text-slate-500 align-top break-words whitespace-normal"
                    title={sec.official_name}
                  >
                    {sec.official_name}
                  </td>
                  <td className="py-3 px-4 text-sm align-top">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right align-top">
                    <button
                      type="button"
                      onClick={() => startEdit(sec)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                        isRowEditing
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
            {secretarias.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                  Nenhuma secretaria cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
