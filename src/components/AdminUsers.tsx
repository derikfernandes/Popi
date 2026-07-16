import React, { useEffect, useState } from "react";
import { Users, Save, RefreshCw, UserRound } from "lucide-react";
import { Secretaria, UserProfile, UserRole } from "../types";
import { loadAllUserProfiles, updateUserProfileAccess } from "../firebaseSync";
import { roleLabel } from "../permissions";
import SearchableSelect from "./SearchableSelect";

interface AdminUsersProps {
  secretarias: Secretaria[];
  currentUid: string;
}

type Draft = {
  role: UserRole;
  secretaria_ids: string[];
  active: boolean;
};

export default function AdminUsers({ secretarias, currentUid }: AdminUsersProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await loadAllUserProfiles();
      setUsers(list);
      const next: Record<string, Draft> = {};
      list.forEach((u) => {
        next[u.uid] = {
          role: u.role,
          secretaria_ids: [...u.secretaria_ids],
          active: u.active,
        };
      });
      setDrafts(next);
    } catch {
      setError("Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await loadAllUserProfiles();
        if (cancelled) return;
        setUsers(list);
        const next: Record<string, Draft> = {};
        list.forEach((u) => {
          next[u.uid] = {
            role: u.role,
            secretaria_ids: [...u.secretaria_ids],
            active: u.active,
          };
        });
        setDrafts(next);
      } catch {
        if (!cancelled) setError("Não foi possível carregar os usuários.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateDraft = (uid: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [uid]: { ...prev[uid], ...patch },
    }));
  };

  const toggleSecretaria = (uid: string, secretariaId: string) => {
    const current = drafts[uid]?.secretaria_ids || [];
    const next = current.includes(secretariaId)
      ? current.filter((id) => id !== secretariaId)
      : [...current, secretariaId];
    updateDraft(uid, { secretaria_ids: next });
  };

  const isDirty = (u: UserProfile) => {
    const d = drafts[u.uid];
    if (!d) return false;
    const sameSecs =
      d.secretaria_ids.length === u.secretaria_ids.length &&
      d.secretaria_ids.every((id) => u.secretaria_ids.includes(id));
    return d.role !== u.role || d.active !== u.active || !sameSecs;
  };

  const handleSave = async (uid: string) => {
    const d = drafts[uid];
    if (!d) return;

    if (uid === currentUid && (d.role !== "admin" || !d.active)) {
      setError("Você não pode remover seu próprio acesso de administrador.");
      return;
    }

    if (d.role === "usuario" && d.active && d.secretaria_ids.length === 0) {
      setError("Usuário ativo precisa de ao menos uma secretaria.");
      return;
    }

    setSavingUid(uid);
    setError(null);
    setMessage(null);
    try {
      await updateUserProfileAccess(uid, d);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, ...d, updated_at: new Date().toISOString() }
            : u
        )
      );
      setMessage("Alterações salvas.");
    } catch {
      setError("Falha ao salvar. Verifique se você ainda é administrador.");
    } finally {
      setSavingUid(null);
    }
  };

  const pendingCount = users.filter((u) => !u.active).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Usuários e acessos</h2>
            <p className="text-sm text-slate-500">
              Defina quem é administrador, quem é usuário e em quais secretarias pode trabalhar com POPIs.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-blue-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="mb-4 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
          {pendingCount} usuário(s) aguardando ativação.
        </div>
      )}

      {error && (
        <div className="mb-4 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Carregando usuários...
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">Nenhum usuário encontrado.</div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const d = drafts[u.uid];
            if (!d) return null;
            const dirty = isDirty(u);

            return (
              <div
                key={u.uid}
                className={`rounded-xl border p-4 ${
                  !u.active ? "border-amber-200 bg-amber-50/40" : "border-slate-100 bg-white"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                      {u.photo_url ? (
                        <img src={u.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserRound className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {u.display_name}
                        {u.uid === currentUid && (
                          <span className="ml-1.5 text-[10px] uppercase text-blue-600 font-bold">você</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      {!u.active && (
                        <p className="text-[10px] font-bold uppercase text-amber-700 mt-0.5">Pendente</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Papel</label>
                      <SearchableSelect
                        value={d.role}
                        onChange={(val) => updateDraft(u.uid, { role: val as UserRole })}
                        options={[
                          { value: "usuario", label: roleLabel("usuario") },
                          { value: "admin", label: roleLabel("admin") },
                        ]}
                        searchPlaceholder="Pesquisar papel..."
                        triggerClassName="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
                      <label className="flex items-center gap-2 h-[38px] px-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={d.active}
                          onChange={(e) => updateDraft(u.uid, { active: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{d.active ? "Ativo" : "Inativo"}</span>
                      </label>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={!dirty || savingUid === u.uid}
                        onClick={() => handleSave(u.uid)}
                        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium py-2 px-3 rounded-lg transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingUid === u.uid ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </div>
                </div>

                {d.role === "usuario" && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Secretarias com acesso</p>
                    <div className="flex flex-wrap gap-2">
                      {secretarias.map((sec) => {
                        const checked = d.secretaria_ids.includes(sec.id);
                        return (
                          <label
                            key={sec.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                              checked
                                ? "bg-blue-50 border-blue-200 text-blue-800"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => toggleSecretaria(u.uid, sec.id)}
                            />
                            <span className="font-mono font-semibold">{sec.acronym}</span>
                            <span>{sec.name}</span>
                          </label>
                        );
                      })}
                      {secretarias.length === 0 && (
                        <span className="text-xs text-slate-400">Cadastre secretarias antes de atribuir acesso.</span>
                      )}
                    </div>
                  </div>
                )}

                {d.role === "admin" && (
                  <p className="mt-3 text-xs text-slate-500">
                    Administradores têm acesso a todos os POPIs e ao painel de gestão.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
