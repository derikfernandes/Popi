import React from "react";
import { RefreshCw, LogOut } from "lucide-react";
import LoginPage from "../LoginPage";
import PendingAccess from "../PendingAccess";
import { logoutUser } from "../../firebase";
import { usePopiData } from "../../contexts/PopiDataContext";

/** Porta de autenticação: loading, login, pendente ou erro de perfil. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    authLoading,
    currentUser,
    userProfile,
    syncingCloud,
    profileError,
  } = usePopiData();

  if (authLoading || (currentUser && !userProfile && syncingCloud)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600 font-sans">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-bold uppercase tracking-wider">
          {authLoading ? "Carregando autenticação..." : "Carregando perfil..."}
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (userProfile && !userProfile.active) {
    return <PendingAccess profile={userProfile} />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-600 font-sans px-6">
        {profileError ? (
          <div className="max-w-lg w-full bg-white border border-red-100 rounded-2xl p-6 shadow-sm text-center space-y-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Não foi possível liberar o acesso
            </h2>
            <p className="text-sm text-red-700 leading-relaxed">{profileError}</p>
            <p className="text-xs text-slate-500">
              Conta:{" "}
              <span className="font-medium text-slate-700">{currentUser.email}</span>
            </p>
            <button
              onClick={logoutUser}
              className="mt-2 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair e tentar de novo
            </button>
          </div>
        ) : (
          <>
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Carregando perfil...
            </span>
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
