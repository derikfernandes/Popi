import React, { useEffect, useState } from "react";
import { useNavigate } from "../router";
import { ROUTES } from "../constants/routes";
import { usePopiData } from "../contexts/PopiDataContext";
import MetricsCards from "../components/layout/MetricsCards";
import PopiList from "../components/PopiList";
import ImportPopModal from "../components/ImportPopModal";
import type { ImportPopResponse } from "../services/popiApi";
import {
  normalizeImportedInputs,
  saveImportReviewInfo,
} from "../utils/importPop";

export default function MapeamentoPage() {
  const navigate = useNavigate();
  const [showImport, setShowImport] = useState(false);
  const {
    userProfile,
    isAdmin,
    visiblePopis,
    formSecretarias,
    customPrompts,
    handleDeletePopi,
    handleSavePOPIForm,
    ensurePromptsLoaded,
  } = usePopiData();

  useEffect(() => {
    void ensurePromptsLoaded();
  }, [ensurePromptsLoaded]);

  if (!userProfile) return null;

  const handleImported = async (
    result: ImportPopResponse,
    secretariaId: string,
    filename: string
  ) => {
    const importedInputs = normalizeImportedInputs(result.inputs);
    const fallbackTitle = filename.replace(/\.(pdf|docx)$/i, "");
    const id = await handleSavePOPIForm(
      importedInputs,
      {
        title:
          result.meta.title ||
          importedInputs.routine_name ||
          `Importado: ${fallbackTitle}`,
        secretariaId,
        department: result.meta.department || "",
        division: result.meta.division || "",
      },
      null
    );

    saveImportReviewInfo(id, {
      filename,
      confidence: result.confidence,
      summary: result.summary,
      gaps: result.gaps,
    });
    setShowImport(false);
    navigate(ROUTES.mapeamentoEditar(id));
  };

  return (
    <>
      <MetricsCards />
      <div className="max-w-7xl mx-auto">
        {!isAdmin && userProfile.secretaria_ids.length === 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Seu usuário está ativo, mas ainda não tem secretaria atribuída. Peça a
            um administrador para liberar o acesso.
          </div>
        )}
        <PopiList
          popis={visiblePopis}
          onSelectPopi={(id) => navigate(ROUTES.mapeamentoPopi(id))}
          onNewPopi={() => navigate(ROUTES.mapeamentoNovo)}
          onImportPopi={() => setShowImport(true)}
          onDeletePopi={async (id) => {
            await handleDeletePopi(id);
          }}
        />
      </div>
      {showImport && (
        <ImportPopModal
          secretarias={formSecretarias}
          customPrompt={customPrompts["import-pop"]}
          onClose={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}
    </>
  );
}
