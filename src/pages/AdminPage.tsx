import React from "react";
import { Building2, Users, Terminal, Shield } from "lucide-react";
import { Link, Navigate } from "../router";
import { ROUTES } from "../constants/routes";
import { usePopiData } from "../contexts/PopiDataContext";
import {
  canManageSecretarias,
  canManageUsers,
  canManagePrompts,
} from "../permissions";

export default function AdminPage() {
  const { userProfile } = usePopiData();

  if (!userProfile) return null;

  const links = [
    canManageSecretarias(userProfile) && {
      to: ROUTES.adminSecretarias,
      title: "Secretarias",
      description: "Cadastro e manutenção das secretarias da prefeitura.",
      icon: Building2,
    },
    canManageUsers(userProfile) && {
      to: ROUTES.adminUsuarios,
      title: "Usuários e Acessos",
      description: "Aprovar usuários e atribuir secretarias.",
      icon: Users,
    },
    canManagePrompts(userProfile) && {
      to: ROUTES.adminPrompts,
      title: "Instruções de IA",
      description: "Prompts globais usados na geração e edição de POPIs.",
      icon: Terminal,
    },
  ].filter(Boolean) as Array<{
    to: string;
    title: string;
    description: string;
    icon: typeof Building2;
  }>;

  if (links.length === 1) {
    return <Navigate to={links[0].to} replace />;
  }

  if (links.length === 0) {
    return <Navigate to={ROUTES.mapeamento} replace />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">Painel Administrativo</h2>
          <p className="text-sm text-slate-500">
            Gerencie secretarias, usuários e instruções de IA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:border-blue-200 hover:bg-blue-50/40 transition text-left"
            >
              <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
