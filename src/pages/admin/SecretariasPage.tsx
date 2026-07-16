import React, { useEffect } from "react";
import { usePopiData } from "../../contexts/PopiDataContext";
import SecretariaAdmin from "../../components/SecretariaAdmin";

export default function SecretariasPage() {
  const {
    secretarias,
    handleAddSecretaria,
    handleUpdateSecretaria,
    runOrphanPurgeOnce,
  } = usePopiData();

  useEffect(() => {
    void runOrphanPurgeOnce();
  }, [runOrphanPurgeOnce]);

  return (
    <div className="max-w-7xl mx-auto">
      <SecretariaAdmin
        secretarias={secretarias}
        onAddSecretaria={handleAddSecretaria}
        onUpdateSecretaria={handleUpdateSecretaria}
      />
    </div>
  );
}
