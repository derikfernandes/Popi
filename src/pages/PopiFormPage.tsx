import React, { useEffect } from "react";
import { useNavigate, useParams } from "../router";
import { ROUTES } from "../constants/routes";
import { usePopiData } from "../contexts/PopiDataContext";
import PopiForm from "../components/PopiForm";
import PageLoading from "../components/PageLoading";
import {
  clearImportReviewInfo,
  readImportReviewInfo,
} from "../utils/importPop";

export default function PopiFormPage() {
  const navigate = useNavigate();
  const { popiId } = useParams<{ popiId?: string }>();
  const {
    inputs,
    formSecretarias,
    visiblePopis,
    detailsLoadingId,
    ensurePopiDetails,
    ensurePromptsLoaded,
    handleSavePOPIForm,
  } = usePopiData();

  const selectedPopiId = popiId ?? null;
  const importReviewInfo = selectedPopiId
    ? readImportReviewInfo(selectedPopiId)
    : null;
  const activePopi = selectedPopiId
    ? visiblePopis.find((p) => p.id === selectedPopiId) ?? null
    : null;

  useEffect(() => {
    void ensurePromptsLoaded();
  }, [ensurePromptsLoaded]);

  useEffect(() => {
    if (selectedPopiId) void ensurePopiDetails(selectedPopiId);
  }, [selectedPopiId, ensurePopiDetails]);

  if (selectedPopiId && !activePopi) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          POPI não encontrado ou sem permissão de acesso.
        </div>
      </div>
    );
  }

  if (
    selectedPopiId &&
    detailsLoadingId === selectedPopiId &&
    !inputs[selectedPopiId]
  ) {
    return <PageLoading label="Carregando formulário..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PopiForm
        initialInputs={selectedPopiId ? inputs[selectedPopiId] : null}
        secretarias={formSecretarias}
        onCancel={() => {
          if (selectedPopiId) {
            navigate(ROUTES.mapeamentoPopi(selectedPopiId));
          } else {
            navigate(ROUTES.mapeamento);
          }
        }}
        onSave={async (formInputs, meta) => {
          const id = await handleSavePOPIForm(formInputs, meta, selectedPopiId);
          clearImportReviewInfo(id);
          navigate(ROUTES.mapeamentoPopi(id));
        }}
        popiId={selectedPopiId || undefined}
        activePopi={activePopi}
        importReviewInfo={importReviewInfo}
      />
    </div>
  );
}
