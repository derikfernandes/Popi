import React, { useState } from "react";
import { Secretaria } from "../types";
import { PlusCircle, Building2, Trash2 } from "lucide-react";

interface SecretariaAdminProps {
  secretarias: Secretaria[];
  onAddSecretaria: (sec: Omit<Secretaria, "id" | "created_at" | "updated_at">) => void;
}

export default function SecretariaAdmin({ secretarias, onAddSecretaria }: SecretariaAdminProps) {
  const [name, setName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !officialName.trim() || !acronym.trim()) {
      setError("Todos os campos de identificação são obrigatórios.");
      return;
    }

    if (secretarias.some((s) => s.acronym.toUpperCase() === acronym.toUpperCase())) {
      setError("Já existe uma secretaria com esta sigla.");
      return;
    }

    onAddSecretaria({
      name: name.trim(),
      official_name: officialName.trim(),
      acronym: acronym.toUpperCase().trim(),
      active: true,
    });

    setName("");
    setOfficialName("");
    setAcronym("");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Secretarias Cadastradas</h2>
          <p className="text-sm text-slate-500">Gerencie as secretarias executoras para geração da numeração sequencial automática dos POPIs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-1 bg-slate-50 rounded-xl p-5 border border-slate-100">
          <h3 className="font-medium text-slate-800 mb-4 text-sm">Nova Secretaria</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome Curto</label>
              <input
                type="text"
                placeholder="Ex: Saúde"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nome Oficial Completo</label>
              <input
                type="text"
                placeholder="Ex: Secretaria Municipal de Saúde"
                value={officialName}
                onChange={(e) => setOfficialName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 font-mono">Sigla</label>
              <input
                type="text"
                placeholder="Ex: SS"
                maxLength={5}
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Sigla</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Nome Oficial</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {secretarias.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-sm font-mono font-semibold text-blue-600">{sec.acronym}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">{sec.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 truncate max-w-[200px]">{sec.official_name}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
