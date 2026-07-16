import React from "react";
import { Navigate } from "../../router";
import { ROUTES } from "../../constants/routes";
import { usePopiData } from "../../contexts/PopiDataContext";
import { isAdminProfile } from "../../permissions";

/** Protege rotas administrativas com o perfil Firebase existente. */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { userProfile } = usePopiData();

  if (!isAdminProfile(userProfile)) {
    return <Navigate to={ROUTES.mapeamento} replace />;
  }

  return <>{children}</>;
}
