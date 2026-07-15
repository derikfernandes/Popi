import React from "react";
import { Clock, LogOut, Landmark } from "lucide-react";
import { UserProfile } from "../types";
import { logoutUser } from "../firebase";

interface PendingAccessProps {
  profile: UserProfile;
}

export default function PendingAccess({ profile }: PendingAccessProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase">POPI Generator</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
              Prefeitura de São José dos Campos
            </p>
          </div>
        </div>
        <button
          onClick={logoutUser}
          className="bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Aguardando liberação</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Sua conta foi registrada, mas ainda precisa ser ativada por um administrador,
            com a secretaria e o perfil de acesso corretos.
          </p>
          <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 text-left text-sm space-y-1">
            <p className="text-slate-800 font-medium">{profile.display_name}</p>
            <p className="text-slate-500 text-xs">{profile.email}</p>
          </div>
          <p className="text-xs text-slate-400 mt-6">
            Após a liberação, saia e entre novamente — ou recarregue a página.
          </p>
        </div>
      </main>
    </div>
  );
}
