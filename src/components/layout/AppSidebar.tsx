import React, { memo } from "react";
import {
  Building2,
  ListTodo,
  Plus,
  Terminal,
  Users,
  Shield,
} from "lucide-react";
import { NavLink } from "../../router";
import { ROUTES } from "../../constants/routes";
import {
  canManageSecretarias,
  canManageUsers,
  canManagePrompts,
} from "../../permissions";
import { usePopiData } from "../../contexts/PopiDataContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
    isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
  }`;

function AppSidebar() {
  const { userProfile, formSecretarias } = usePopiData();

  if (!userProfile) return null;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-5 hidden md:flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Mapeamento Corporativo
          </span>

          <NavLink to={ROUTES.mapeamento} className={navClass}>
            <ListTodo className="w-4 h-4" />
            POPIs Mapeados
          </NavLink>

          {(canManageSecretarias(userProfile) ||
            canManageUsers(userProfile) ||
            canManagePrompts(userProfile)) && (
            <>
              <span className="block pt-4 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Administração
              </span>

              <NavLink to={ROUTES.admin} className={navClass} end={false}>
                <Shield className="w-4 h-4" />
                Painel Admin
              </NavLink>

              {canManageSecretarias(userProfile) && (
                <NavLink to={ROUTES.adminSecretarias} className={navClass}>
                  <Building2 className="w-4 h-4" />
                  Secretarias Prefeitura
                </NavLink>
              )}

              {canManageUsers(userProfile) && (
                <NavLink to={ROUTES.adminUsuarios} className={navClass}>
                  <Users className="w-4 h-4" />
                  Usuários e Acessos
                </NavLink>
              )}

              {canManagePrompts(userProfile) && (
                <NavLink
                  to={ROUTES.adminPrompts}
                  className={navClass}
                  id="btn-nav-prompts"
                >
                  <Terminal className="w-4 h-4" />
                  Instruções de IA
                </NavLink>
              )}
            </>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-100">
          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Ações Rápidas
          </span>
          <NavLink
            to={ROUTES.mapeamentoNovo}
            className={() =>
              `w-full flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition ${
                formSecretarias.length === 0
                  ? "pointer-events-none bg-slate-300"
                  : ""
              }`
            }
            title={
              formSecretarias.length === 0
                ? "Nenhuma secretaria atribuída ao seu usuário"
                : undefined
            }
            aria-disabled={formSecretarias.length === 0}
          >
            <Plus className="w-4 h-4" /> Novo Mapeamento
          </NavLink>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
        Plataforma POPI v1.2
      </div>
    </aside>
  );
}

export default memo(AppSidebar);
