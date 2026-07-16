import React from "react";
import { Outlet } from "../router";
import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import CloudErrorBanner from "../components/layout/CloudErrorBanner";

/** Layout compartilhado: cabeçalho, menu lateral e área de conteúdo. */
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <AppHeader />
      <CloudErrorBanner />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
