import React, { memo } from "react";
import { Landmark, UserCheck, LogOut, Cloud, CloudOff } from "lucide-react";
import { logoutUser } from "../../firebase";
import { roleLabel } from "../../permissions";
import { usePopiData } from "../../contexts/PopiDataContext";

function AppHeader() {
  const { currentUser, userProfile, cloudError, syncingCloud } = usePopiData();

  if (!currentUser || !userProfile) return null;

  return (
    <header className="bg-slate-900 text-white h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-tight uppercase">POPI Generator</h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
            Prefeitura de São José dos Campos
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-bold">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || "Avatar"}
                className="w-5 h-5 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white">
                {currentUser.displayName
                  ? currentUser.displayName[0].toUpperCase()
                  : "U"}
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className="text-white max-w-[120px] truncate">
                {currentUser.displayName || currentUser.email}
              </span>
              {cloudError ? (
                <span className="text-[8px] text-amber-400 uppercase font-extrabold flex items-center gap-1">
                  <CloudOff className="w-2.5 h-2.5" /> Salvo localmente (nuvem falhou)
                </span>
              ) : (
                <span className="text-[8px] text-emerald-400 uppercase font-extrabold flex items-center gap-1">
                  <Cloud className="w-2.5 h-2.5 animate-pulse" />{" "}
                  {syncingCloud ? "Sincronizando..." : "Conectado ao Firebase"}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={logoutUser}
            className="bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1 cursor-pointer font-bold duration-200"
            title="Sair da Sessão"
            id="btn-signout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Perfil:</span>
          <span className="text-white bg-blue-600 px-2 py-0.5 rounded uppercase font-extrabold text-[10px]">
            {roleLabel(userProfile.role)}
          </span>
        </div>
      </div>
    </header>
  );
}

export default memo(AppHeader);
