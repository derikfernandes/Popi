import React from "react";
import { Routes, Route, Navigate } from "./router";
import { PopiDataProvider } from "./contexts/PopiDataContext";
import AuthGate from "./components/auth/AuthGate";
import AdminRoute from "./components/auth/AdminRoute";
import AppLayout from "./layouts/AppLayout";
import PageLoading from "./components/PageLoading";
import { ROUTES } from "./constants/routes";

const MapeamentoPage = React.lazy(() => import("./pages/MapeamentoPage"));
const PopiFormPage = React.lazy(() => import("./pages/PopiFormPage"));
const PopiWorkspacePage = React.lazy(() => import("./pages/PopiWorkspacePage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const SecretariasPage = React.lazy(() => import("./pages/admin/SecretariasPage"));
const UsuariosPage = React.lazy(() => import("./pages/admin/UsuariosPage"));
const PromptsPage = React.lazy(() => import("./pages/admin/PromptsPage"));

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<PageLoading label="Carregando página..." />}>
      {children}
    </React.Suspense>
  );
}

export default function App() {
  return (
    <PopiDataProvider>
      <AuthGate>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path={ROUTES.home}
              element={<Navigate to={ROUTES.mapeamento} replace />}
            />
            <Route
              path={ROUTES.mapeamento}
              element={
                <LazyPage>
                  <MapeamentoPage />
                </LazyPage>
              }
            />
            <Route
              path={ROUTES.mapeamentoNovo}
              element={
                <LazyPage>
                  <PopiFormPage />
                </LazyPage>
              }
            />
            <Route
              path="/mapeamento/:popiId"
              element={
                <LazyPage>
                  <PopiWorkspacePage />
                </LazyPage>
              }
            />
            <Route
              path="/mapeamento/:popiId/editar"
              element={
                <LazyPage>
                  <PopiFormPage />
                </LazyPage>
              }
            />
            <Route
              path={ROUTES.admin}
              element={
                <AdminRoute>
                  <LazyPage>
                    <AdminPage />
                  </LazyPage>
                </AdminRoute>
              }
            />
            <Route
              path={ROUTES.adminSecretarias}
              element={
                <AdminRoute>
                  <LazyPage>
                    <SecretariasPage />
                  </LazyPage>
                </AdminRoute>
              }
            />
            <Route
              path={ROUTES.adminUsuarios}
              element={
                <AdminRoute>
                  <LazyPage>
                    <UsuariosPage />
                  </LazyPage>
                </AdminRoute>
              }
            />
            <Route
              path={ROUTES.adminPrompts}
              element={
                <AdminRoute>
                  <LazyPage>
                    <PromptsPage />
                  </LazyPage>
                </AdminRoute>
              }
            />
            <Route
              path="*"
              element={<Navigate to={ROUTES.mapeamento} replace />}
            />
          </Route>
        </Routes>
      </AuthGate>
    </PopiDataProvider>
  );
}
