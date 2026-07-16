import React from "react";
import { usePopiData } from "../../contexts/PopiDataContext";
import AdminUsers from "../../components/AdminUsers";

export default function UsuariosPage() {
  const { secretarias, currentUser } = usePopiData();

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <AdminUsers secretarias={secretarias} currentUid={currentUser.uid} />
    </div>
  );
}
