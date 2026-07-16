import React, { useEffect } from "react";
import { useNavigate } from "../../router";
import { ROUTES } from "../../constants/routes";
import { usePopiData } from "../../contexts/PopiDataContext";
import PromptManager from "../../components/PromptManager";
import PageLoading from "../../components/PageLoading";

export default function PromptsPage() {
  const navigate = useNavigate();
  const {
    customPrompts,
    setCustomPrompts,
    ensurePromptsLoaded,
    promptsReady,
  } = usePopiData();

  useEffect(() => {
    void ensurePromptsLoaded();
  }, [ensurePromptsLoaded]);

  if (!promptsReady) {
    return <PageLoading label="Carregando instruções de IA..." />;
  }

  return (
    <PromptManager
      customPrompts={customPrompts}
      setCustomPrompts={setCustomPrompts}
      onBack={() => navigate(ROUTES.admin)}
    />
  );
}
