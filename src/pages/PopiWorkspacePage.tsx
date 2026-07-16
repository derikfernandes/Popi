import React, { useEffect } from "react";
import { useNavigate, useParams, Navigate } from "../router";
import { ROUTES } from "../constants/routes";
import { usePopiData } from "../contexts/PopiDataContext";
import { canApprovePopi } from "../permissions";
import PopiWorkspace from "../components/PopiWorkspace";
import PageLoading from "../components/PageLoading";
import type { POPIInput } from "../types";

const EMPTY_INPUT: POPIInput = {
  role_or_position: "",
  routine_name: "",
  routine_goal: "",
  routine_type: "Rotina interna",
  routine_type_detail: "",
  start_trigger: "",
  frequency: "",
  frequency_detail: "",
  participants: [],
  participants_free: "",
  norma_orientadora: "",
  passo_a_passo: [],
  passo_a_passo_free: "",
  sistemas_documentos_utilizados: "",
  informacoes_indispensaveis: "",
  tempo_medio: "",
  gargalos_dificuldades: "",
  melhorias_automacoes_sugeridas: "",
  metas_indicadores: [],
  metas_indicadores_free: "",
  additional_notes: null,
};

export default function PopiWorkspacePage() {
  const navigate = useNavigate();
  const { popiId } = useParams<{ popiId: string }>();
  const {
    userProfile,
    visiblePopis,
    inputs,
    documents,
    classifications,
    versions,
    detailsLoadingId,
    ensurePopiDetails,
    ensurePromptsLoaded,
    handleUpdateStatus,
    handleGeneratePOPIWithIA,
    handleRunQAInspection,
    handleRestoreVersion,
    handleSaveManualEdit,
    handleSuggestClassification,
    handleSaveClassification,
  } = usePopiData();

  useEffect(() => {
    void ensurePromptsLoaded();
  }, [ensurePromptsLoaded]);

  useEffect(() => {
    if (popiId) void ensurePopiDetails(popiId);
  }, [popiId, ensurePopiDetails]);

  if (!popiId) {
    return <Navigate to={ROUTES.mapeamento} replace />;
  }

  const popi = visiblePopis.find((p) => p.id === popiId);
  if (!popi) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          POPI não encontrado ou sem permissão de acesso.{" "}
          <button
            type="button"
            className="underline font-semibold"
            onClick={() => navigate(ROUTES.mapeamento)}
          >
            Voltar à lista
          </button>
        </div>
      </div>
    );
  }

  if (detailsLoadingId === popiId && !inputs[popiId] && !documents[popiId]) {
    return <PageLoading label="Carregando detalhes do POPI..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PopiWorkspace
        popi={popi}
        inputs={inputs[popiId] ?? EMPTY_INPUT}
        document={documents[popiId] || null}
        classification={classifications[popiId] || null}
        versions={versions[popiId] || []}
        isAdmin={canApprovePopi(userProfile)}
        onBack={() => navigate(ROUTES.mapeamento)}
        onUpdateStatus={handleUpdateStatus}
        onGeneratePOPI={handleGeneratePOPIWithIA}
        onRunQA={handleRunQAInspection}
        onRestoreVersion={handleRestoreVersion}
        onSaveManualEdit={handleSaveManualEdit}
        onSuggestClassification={handleSuggestClassification}
        onSaveClassification={handleSaveClassification}
      />
    </div>
  );
}
