import React, { useState, Suspense, lazy, useRef } from "react";
import { POPI, POPIInput, POPIDocument, POPIClassification, POPIVersion, Participant, PassoAPasso } from "../types";
import { 
  ArrowLeft, Sparkles, FileText, FileCode, GitBranch, ShieldCheck, 
  Download, Edit2, Play, ThumbsUp, RefreshCw, Check, AlertTriangle, HelpCircle, 
  ArrowRightLeft, Lock, Save
} from "lucide-react";
import type { QaPopiResponse } from "../services/popiApi";
import PageLoading from "./PageLoading";
import ExportOptionsPanel from "./ExportOptionsPanel";
import MarkdownDocument from "./MarkdownDocument";
import SearchableSelect from "./SearchableSelect";
import { exportPopiDocument, type ExportFormat } from "../utils/exportPopi";
import {
  IMPROVEMENT_CATEGORIES,
  IMPROVEMENT_CATEGORY_HINTS,
  MAX_IMPROVEMENT_CATEGORIES,
} from "../data";

const MermaidRenderer = lazy(() => import("./MermaidRenderer"));

interface PopiWorkspaceProps {
  popi: POPI;
  inputs: POPIInput;
  document: POPIDocument | null;
  classification: POPIClassification | null;
  versions: POPIVersion[];
  isAdmin: boolean;
  onBack: () => void;
  onUpdateStatus: (id: string, status: POPI["status"]) => void;
  onGeneratePOPI: (id: string) => Promise<void>;
  onRunQA: (id: string) => Promise<QaPopiResponse | undefined>;
  onRestoreVersion: (id: string, versionId: string) => void;
  onSaveManualEdit: (
    id: string,
    popMarkdown: string,
    reportMarkdown: string,
    flowchartMermaid?: string,
    flowchartTobeFlow?: string,
    flowchartTobeSystem?: string
  ) => void;
  onSuggestClassification: (id: string) => Promise<void>;
  onSaveClassification: (id: string, category: string, improvements: string[]) => void;
}

export default function PopiWorkspace({
  popi,
  inputs,
  document,
  classification,
  versions,
  isAdmin,
  onBack,
  onUpdateStatus,
  onGeneratePOPI,
  onRunQA,
  onRestoreVersion,
  onSaveManualEdit,
  onSuggestClassification,
  onSaveClassification,
}: PopiWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<
    "input" | "class" | "pop" | "report" | "flowchart" | "versions" | "qa"
  >("input");

  // State for direct Markdown editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedPop, setEditedPop] = useState(document?.pop_markdown || "");
  const [editedReport, setEditedReport] = useState(document?.intelligent_report_markdown || "");
  const [isEditingFlowchart, setIsEditingFlowchart] = useState(false);
  const [editedFlowchart, setEditedFlowchart] = useState(document?.flowchart_mermaid || "");
  const [editedFlowchartTobeFlow, setEditedFlowchartTobeFlow] = useState(
    document?.flowchart_tobe_flow_mermaid || ""
  );
  const [editedFlowchartTobeSystem, setEditedFlowchartTobeSystem] = useState(
    document?.flowchart_tobe_system_mermaid || ""
  );

  // QA Report results
  const [qaResult, setQaResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // States for IA generation and classification matching
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);

  // Custom classification curation
  const [curatedCategory, setCuratedCategory] = useState(popi.routine_category || "");
  const [curatedImprovements, setCuratedImprovements] = useState<string[]>(popi.improvement_categories || []);

  // Version comparison screen
  const [compareVersionId, setCompareVersionId] = useState<string>("");
  const [compareResult, setCompareResult] = useState<any>(null);

  // Export panel
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("md");
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (document) {
      setEditedPop(document.pop_markdown);
      setEditedReport(document.intelligent_report_markdown);
      setEditedFlowchart(document.flowchart_mermaid);
      setEditedFlowchartTobeFlow(document.flowchart_tobe_flow_mermaid || "");
      setEditedFlowchartTobeSystem(document.flowchart_tobe_system_mermaid || "");
    }
    setCuratedCategory(popi.routine_category || "");
    setCuratedImprovements(
      (popi.improvement_categories || []).slice(0, MAX_IMPROVEMENT_CATEGORIES)
    );
  }, [document, popi]);

  const handleManualSave = () => {
    onSaveManualEdit(
      popi.id,
      editedPop,
      editedReport,
      editedFlowchart,
      editedFlowchartTobeFlow,
      editedFlowchartTobeSystem
    );
    setIsEditing(false);
    alert("Alterações salvas como nova versão manual com sucesso!");
  };

  const handleFlowchartSave = () => {
    onSaveManualEdit(
      popi.id,
      editedPop,
      editedReport,
      editedFlowchart,
      editedFlowchartTobeFlow,
      editedFlowchartTobeSystem
    );
    setIsEditingFlowchart(false);
    alert("Alterações nos fluxogramas salvas com sucesso!");
  };

  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  const triggerGenerationFlow = () => {
    if (document?.last_manual_edit_at) {
      setShowOverwriteConfirm(true);
    } else {
      executeGeneration();
    }
  };

  const executeGeneration = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePOPI(popi.id);
      setActiveTab("pop");
    } catch {
      alert("Não foi possível gerar o POPI. Tente preencher mais campos do questionário.");
    } finally {
      setIsGenerating(false);
    }
  };

  const executeClassification = async () => {
    setIsClassifying(true);
    try {
      await onSuggestClassification(popi.id);
    } catch {
      alert("Falha ao sugerir termos.");
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSaveCuration = () => {
    const trimmed = curatedImprovements.slice(0, MAX_IMPROVEMENT_CATEGORIES);
    onSaveClassification(popi.id, curatedCategory, trimmed);
    if (trimmed.length !== curatedImprovements.length) {
      setCuratedImprovements(trimmed);
    }
    alert("Classificação salva com sucesso!");
  };

  const toggleImprovementCategory = (opt: string) => {
    const isSelected = curatedImprovements.includes(opt);
    if (isSelected) {
      setCuratedImprovements(curatedImprovements.filter((val) => val !== opt));
      return;
    }
    if (curatedImprovements.length >= MAX_IMPROVEMENT_CATEGORIES) {
      return;
    }
    setCuratedImprovements([...curatedImprovements, opt]);
  };

  const executeQAAuditing = async () => {
    setIsAuditing(true);
    try {
      const res = await onRunQA(popi.id);
      setQaResult(res);
      setActiveTab("qa");
    } catch {
      alert("Erro ao executar auditoria.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExport = async () => {
    if (!document || isExporting) return;
    setIsExporting(true);
    try {
      await exportPopiDocument(
        popi,
        {
          ...document,
          // Usa os fluxogramas atuais da aba (mesmo se ainda não tiverem sido salvos)
          flowchart_mermaid: editedFlowchart || document.flowchart_mermaid,
          flowchart_tobe_flow_mermaid:
            editedFlowchartTobeFlow || document.flowchart_tobe_flow_mermaid,
          flowchart_tobe_system_mermaid:
            editedFlowchartTobeSystem || document.flowchart_tobe_system_mermaid,
        },
        exportFormat
      );
      setShowExportPanel(false);
    } catch (err) {
      console.error(err);
      alert("Não foi possível concluir a exportação. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCompare = (vId: string) => {
    setCompareVersionId(vId);
    if (!vId) {
      setCompareResult(null);
      return;
    }
    const ver = versions.find((v) => v.id === vId);
    if (ver) {
      setCompareResult({
        version_number: ver.version_number,
        inputs: ver.snapshot.input,
        doc: ver.snapshot.document,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {popi.report_number}
              </span>
              <span className="text-xs text-slate-400 font-bold uppercase">Versão #{versions.length}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-800 mt-1">{popi.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {popi.secretaria_name} / {popi.department} / {popi.division}
            </p>
          </div>
        </div>

        {/* Global actions bar */}
        <div className="flex flex-wrap items-center gap-2">
          {popi.status === "rascunho" && (
            <button
              onClick={triggerGenerationFlow}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold text-xs text-white h-9 px-4 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "Gerando POPI..." : "Gerar POPI com I.A."}
            </button>
          )}

          {document && (
            <>
              <button
                onClick={executeQAAuditing}
                disabled={isAuditing}
                className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600 h-9 px-3 rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {isAuditing ? "Revisando..." : "Auditar com I.A. (QA)"}
              </button>

              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowExportPanel((open) => !open)}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 h-9 px-3 rounded-lg text-xs font-semibold transition"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <ExportOptionsPanel
                  open={showExportPanel}
                  selectedFormat={exportFormat}
                  onSelectFormat={setExportFormat}
                  onExport={handleExport}
                  onClose={() => !isExporting && setShowExportPanel(false)}
                  containerRef={exportMenuRef}
                  exporting={isExporting}
                />
              </div>
            </>
          )}

          {/* Workflow Status Controls */}
          {popi.status === "em_revisao" && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg py-1.5 px-3">
                <Check className="w-3.5 h-3.5" /> Em Revisão
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(popi.id, "aprovado")}
                  className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg transition"
                >
                  Aprovar
                </button>
              )}
            </div>
          )}

          {popi.status !== "aprovado" &&
            popi.status !== "arquivado" &&
            popi.status !== "em_revisao" && (
            <div className="flex items-center gap-1 border border-slate-200 p-0.5 rounded-lg bg-slate-50">
              <button
                type="button"
                onClick={() => onUpdateStatus(popi.id, "em_revisao")}
                title="Enviar para revisão"
                className="text-[11px] font-bold text-purple-700 bg-white border border-purple-200 hover:bg-purple-50 px-2.5 py-1.5 rounded transition"
              >
                Revisão
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(popi.id, "aprovado")}
                  className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded transition"
                >
                  Aprovar
                </button>
              )}
            </div>
          )}

          {popi.status === "aprovado" && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg py-1.5 px-3">
                <Check className="w-4 h-4" /> POPI Aprovado
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(popi.id, "em_revisao")}
                  title="Reabrir POPI para nova revisão"
                  className="text-[11px] font-bold text-purple-700 bg-white border border-purple-200 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg transition"
                >
                  Voltar para revisão
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto border-b border-slate-200 pb-px gap-1">
        {[
          { id: "input", label: "Mapeamento (16p)" },
          { id: "class", label: "Classificação" },
          { id: "pop", label: "Procedimento (POP)", condition: !!document },
          { id: "report", label: "Diagnóstico", condition: !!document },
          { id: "flowchart", label: "Fluxograma", condition: !!document },
          { id: "versions", label: "Histórico (" + versions.length + ")" },
          { id: "qa", label: "Auditoria QA", condition: !!qaResult },
        ]
          .filter((tab) => tab.condition !== false)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-10 px-4 text-xs font-bold transition whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* WORKSPACE AREA */}
      {document && popi.status === "rascunho" && (
        <div className="bg-amber-50 border border-amber-200/50 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-700 mt-0.5 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-900">Mapeamento de dados modificado</h4>
              <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                As 16 perguntas foram editadas após a última geração por IA. O POP, o Relatório TO-BE e o Fluxograma podem estar desatualizados em relação aos novos dados preenchidos.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={triggerGenerationFlow}
              disabled={isGenerating}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGenerating ? "Regerando..." : "Regerar agora com IA"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
          {activeTab === "input" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b pb-2">Roteiro Coletor Completo</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q1. Identificação Interna</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.routine_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{popi.secretaria_name} / {popi.department} / {popi.division}</p>
                </div>

                <div className="bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q2. Cargo do Responsável</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.role_or_position}</p>
                </div>

                <div className="md:col-span-2 bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q4. Objetivo da Rotina</span>
                  <p className="text-slate-700 mt-1 font-medium">{inputs.routine_goal}</p>
                </div>

                <div className="bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q5. Destino de Atendimento</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.routine_type}</p>
                  {inputs.routine_type_detail && <p className="text-xs text-slate-500 mt-1">Detalhes: {inputs.routine_type_detail}</p>}
                </div>

                <div className="bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q6. Gatilho de Início</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.start_trigger}</p>
                </div>

                <div className="bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q7. Frequência de Execução</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.frequency}</p>
                  {inputs.frequency_detail && <p className="text-xs text-slate-500 mt-1">Detalhes: {inputs.frequency_detail}</p>}
                </div>

                <div className="bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q9. Lei ou Norma Orientadora</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.norma_orientadora || "Nenhuma norma relatada"}</p>
                </div>

                <div className="md:col-span-2 bg-slate-50/75 rounded-xl p-4.5 space-y-3">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q8. Participantes</span>
                  {inputs.participants_free ? (
                    <p className="text-slate-700 font-medium whitespace-pre-line">{inputs.participants_free}</p>
                  ) : inputs.participants.length > 0 ? (
                    <div className="border border-slate-100 rounded-lg overflow-hidden bg-white">
                      <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead className="bg-slate-50 text-left">
                          <tr>
                            <th className="py-2 px-3 font-bold text-slate-600">Setor/Função</th>
                            <th className="py-2 px-3 font-bold text-slate-600">O que faz</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inputs.participants.map((p, i) => (
                            <tr key={i}>
                              <td className="py-1.5 px-3 font-semibold text-slate-800">{p.setor_ou_funcao}</td>
                              <td className="py-1.5 px-3 text-slate-500">{p.responsabilidade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs">Não preenchido</p>
                  )}
                </div>

                <div className="md:col-span-2 bg-slate-50/75 rounded-xl p-4.5 space-y-3">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q10. Passo a Passo do Mapeamento</span>
                  {inputs.passo_a_passo_free ? (
                    <p className="text-slate-700 font-medium whitespace-pre-line">{inputs.passo_a_passo_free}</p>
                  ) : inputs.passo_a_passo.length > 0 ? (
                    <div className="border border-slate-100 rounded-lg overflow-hidden bg-white">
                      <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="py-2.5 px-3 font-bold text-slate-600 w-10">No</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600">Atividade</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600">Responsável</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600">Sistema/Ferramenta</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600">Saída Esperada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inputs.passo_a_passo.map((step, i) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-mono font-bold text-slate-500">{step.numero}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{step.atividade}</td>
                              <td className="py-2 px-3 text-slate-600 font-medium">{step.responsavel}</td>
                              <td className="py-2 px-3 text-slate-500">{step.sistema_ou_documento}</td>
                              <td className="py-2 px-3 text-emerald-700 font-medium">{step.resultado_da_etapa}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs">Não preenchido</p>
                  )}
                </div>

                <div className="bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q11. Sistemas e Planilhas</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.sistemas_documentos_utilizados}</p>
                </div>

                <div className="bg-slate-50/75 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q12. Informações Mapeadoras</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.informacoes_indispensaveis}</p>
                </div>

                <div className="bg-slate-50/75 rounded-xl p-4.5 col-span-1 md:col-span-2">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q13. Duração Média da Execução</span>
                  <p className="font-bold text-slate-800 mt-1">{inputs.tempo_medio}</p>
                </div>

                <div className="md:col-span-2 bg-red-50/40 border border-red-100/50 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-red-600">Q14. Gargalos Sistêmicos e Atrasos</span>
                  <p className="text-slate-800 font-semibold mt-1">{inputs.gargalos_dificuldades}</p>
                </div>

                <div className="md:col-span-2 bg-indigo-50/30 border border-indigo-100/30 rounded-xl p-4.5">
                  <span className="text-[10px] uppercase font-extrabold text-indigo-700">Q15. Oportunidades de Automação e Redução</span>
                  <p className="text-slate-800 font-semibold mt-1">{inputs.melhorias_automacoes_sugeridas}</p>
                </div>

                <div className="md:col-span-2 bg-slate-50/75 rounded-xl p-4.5 space-y-3">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Q16. Indicadores e Metas Atuais</span>
                  {inputs.metas_indicadores_free ? (
                    <p className="text-slate-700 font-medium whitespace-pre-line">{inputs.metas_indicadores_free}</p>
                  ) : inputs.metas_indicadores.length > 0 ? (
                    <div className="border border-slate-100 rounded-lg overflow-hidden bg-white">
                      <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead className="bg-slate-50 text-left">
                          <tr>
                            <th className="py-2 px-3 font-bold text-slate-600">Indicador</th>
                            <th className="py-2 px-3 font-bold text-slate-600">Meta</th>
                            <th className="py-2 px-3 font-bold text-slate-600">Formulação</th>
                            <th className="py-2 px-3 font-bold text-slate-600">Periodicidade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inputs.metas_indicadores.map((ind, i) => (
                            <tr key={i}>
                              <td className="py-1.5 px-3 font-semibold text-slate-800">{ind.indicador}</td>
                              <td className="py-1.5 px-3 text-red-700 font-bold">{ind.meta}</td>
                              <td className="py-1.5 px-3 text-slate-500">{ind.forma_de_medicao}</td>
                              <td className="py-1.5 px-3 text-slate-600">{ind.periodicidade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs">Não há indicadores formais mapeados</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "class" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Classificação da rotina</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Defina o tipo da rotina (AS-IS) e as oportunidades de melhoria (TO-BE).
                  </p>
                </div>
                <button
                  onClick={executeClassification}
                  disabled={isClassifying}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 disabled:opacity-50 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isClassifying ? "Sugerindo..." : "Sugerir com I.A."}
                </button>
              </div>

              {/* Suggestions diagnostic */}
              {classification && (
                <div className="bg-indigo-50/40 border border-indigo-100/50 p-4.5 rounded-xl text-xs space-y-2">
                  <p className="font-bold text-indigo-950 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-indigo-700" /> Sugestão da I.A. (revise antes de salvar):
                  </p>
                  <div className="text-slate-700 space-y-1">
                    <p><strong>Nível de confiança:</strong> {classification.confidence_level.toUpperCase()}</p>
                    <p><strong>Justificativa:</strong> {classification.routine_category_justification}</p>
                  </div>
                </div>
              )}

              {/* Selection inputs */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Tipo da rotina
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Como esta rotina se enquadra na organização municipal hoje.
                  </p>
                  <SearchableSelect
                    value={curatedCategory}
                    onChange={setCuratedCategory}
                    topOptions={[{ value: "", label: "Selecione..." }]}
                    options={[
                      "Atendimento ao cidadão",
                      "Rotina interna administrativa",
                      "Processo de gestão",
                      "Processo de fiscalização",
                      "Processo financeiro/orçamentário",
                      "Processo de saúde",
                      "Processo operacional",
                      "Processo tecnológico/sistemas",
                      "Outro"
                    ].map((opt) => ({ value: opt, label: opt }))}
                    searchPlaceholder="Pesquisar tipo..."
                    triggerClassName="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Tipos de melhoria identificados
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                      {curatedImprovements.length} de {MAX_IMPROVEMENT_CATEGORIES}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Selecione até {MAX_IMPROVEMENT_CATEGORIES} tipos que melhor descrevem as oportunidades de evolução desta rotina. A I.A. pode sugerir automaticamente — você valida ou ajusta antes de salvar.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {IMPROVEMENT_CATEGORIES.map((opt) => {
                      const isSelected = curatedImprovements.includes(opt);
                      const atLimit =
                        !isSelected &&
                        curatedImprovements.length >= MAX_IMPROVEMENT_CATEGORIES;
                      const hint = IMPROVEMENT_CATEGORY_HINTS[opt];
                      return (
                        <label
                          key={opt}
                          title={hint}
                          className={`flex flex-col gap-0.5 border rounded-lg p-2.5 transition ${
                            isSelected
                              ? "bg-blue-50 border-blue-200 text-blue-800 cursor-pointer"
                              : atLimit
                                ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50 cursor-pointer"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={atLimit}
                              onChange={() => toggleImprovementCategory(opt)}
                              className="sr-only"
                            />
                            <span className="text-xs font-semibold">{opt}</span>
                          </span>
                          {hint && (
                            <span className="text-[10px] font-normal text-slate-500 leading-snug pl-0">
                              {hint}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={handleSaveCuration}
                    className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition"
                  >
                    <Save className="w-4 h-4" />
                    Salvar classificação
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pop" && document && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-base font-bold text-slate-800">POP — Procedimento Operacional Padrão AS-IS</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 border border-slate-200 rounded-lg"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? "Visualizar" : "Editar Manualmente"}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    rows={16}
                    value={editedPop}
                    onChange={(e) => setEditedPop(e.target.value)}
                    className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl border focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-slate-500 font-semibold hover:bg-slate-50 py-2 px-4 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleManualSave}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm"
                    >
                      Salvar Versão Manual
                    </button>
                  </div>
                </div>
              ) : (
                <MarkdownDocument content={editedPop} />
              )}
            </div>
          )}

          {activeTab === "report" && document && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-base font-bold text-slate-800">Relatório TO-BE & Diagnóstico de Gargalos</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 border border-slate-200 rounded-lg"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? "Visualizar" : "Editar Manualmente"}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    rows={16}
                    value={editedReport}
                    onChange={(e) => setEditedReport(e.target.value)}
                    className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl border focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-slate-500 font-semibold hover:bg-slate-50 py-2 px-4 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleManualSave}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Salvar Versão Manual
                    </button>
                  </div>
                </div>
              ) : (
                <MarkdownDocument content={editedReport} />
              )}
            </div>
          )}

          {activeTab === "flowchart" && document && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Fluxogramas do Processo</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    1 — Fluxograma AS-IS · 2 — Fluxograma TO-BE (Alterações de Fluxo de Rotina) · 3 — Fluxograma TO-BE (Alterações Sistêmicas)
                  </p>
                </div>
                
                <button
                  onClick={() => setIsEditingFlowchart(!isEditingFlowchart)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 border border-slate-200 rounded-lg transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditingFlowchart ? "Visualizar Gráficos" : "Editar Código Mermaid"}
                </button>
              </div>

              {isEditingFlowchart ? (
                <div className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200/50 p-3 rounded-lg text-xs text-amber-800 leading-relaxed font-semibold">
                    Dica: O código abaixo utiliza a sintaxe Mermaid. Certifique-se de que os nós de fluxo e as setas (ex: A -- Sim --&gt; B) estejam logicamente encadeados e fechados corretamente para compilação. Deixe em branco os fluxogramas TO-BE que não se aplicam.
                  </div>

                  {[
                    {
                      title: "1 — Fluxograma AS-IS",
                      value: editedFlowchart,
                      onChange: setEditedFlowchart,
                    },
                    {
                      title: "2 — Fluxograma TO-BE (Alterações de Fluxo de Rotina)",
                      value: editedFlowchartTobeFlow,
                      onChange: setEditedFlowchartTobeFlow,
                    },
                    {
                      title: "3 — Fluxograma TO-BE (Alterações Sistêmicas)",
                      value: editedFlowchartTobeSystem,
                      onChange: setEditedFlowchartTobeSystem,
                    },
                  ].map(({ title, value, onChange }) => (
                    <div key={title} className="space-y-2">
                      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase font-mono">{title}</span>
                      <textarea
                        rows={10}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl border focus:outline-none"
                        placeholder="Escreva seu código Mermaid aqui (ou deixe em branco se não se aplica)..."
                      />
                    </div>
                  ))}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditedFlowchart(document.flowchart_mermaid);
                        setEditedFlowchartTobeFlow(document.flowchart_tobe_flow_mermaid || "");
                        setEditedFlowchartTobeSystem(document.flowchart_tobe_system_mermaid || "");
                        setIsEditingFlowchart(false);
                      }}
                      className="text-xs text-slate-500 font-semibold hover:bg-slate-50 py-2 px-4 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleFlowchartSave}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm"
                    >
                      Salvar Códigos e Compilar
                    </button>
                  </div>
                </div>
              ) : (
                  <div className="space-y-8">
                  {/* 1 — AS-IS */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono">1 — Fluxograma AS-IS</span>
                      <p className="text-[11px] text-slate-500">Como o processo funciona hoje.</p>
                    </div>
                    <Suspense fallback={<PageLoading label="Carregando fluxograma..." />}>
                      <MermaidRenderer chartCode={editedFlowchart} />
                    </Suspense>
                  </div>

                  {/* 2 — TO-BE fluxo de rotina */}
                  <div className="space-y-2 border-t pt-5">
                    <div>
                      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono">2 — Fluxograma TO-BE (Alterações de Fluxo de Rotina)</span>
                      <p className="text-[11px] text-slate-500">Novo fluxo proposto com melhorias de organização do trabalho, sem depender de novos sistemas.</p>
                    </div>
                    {editedFlowchartTobeFlow.trim() ? (
                      <Suspense fallback={<PageLoading label="Carregando fluxograma..." />}>
                        <MermaidRenderer chartCode={editedFlowchartTobeFlow} />
                      </Suspense>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 border border-slate-100 rounded-lg p-4">
                        Nenhuma alteração de fluxo de rotina sugerida. Gere o POPI com I.A. ou adicione manualmente em "Editar Código Mermaid".
                      </p>
                    )}
                  </div>

                  {/* 3 — TO-BE sistêmico */}
                  <div className="space-y-2 border-t pt-5">
                    <div>
                      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono">3 — Fluxograma TO-BE (Alterações Sistêmicas)</span>
                      <p className="text-[11px] text-slate-500">Novo fluxo proposto considerando automações, integrações entre sistemas e tecnologia.</p>
                    </div>
                    {editedFlowchartTobeSystem.trim() ? (
                      <Suspense fallback={<PageLoading label="Carregando fluxograma..." />}>
                        <MermaidRenderer chartCode={editedFlowchartTobeSystem} />
                      </Suspense>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 border border-slate-100 rounded-lg p-4">
                        Nenhuma alteração sistêmica sugerida. Gere o POPI com I.A. ou adicione manualmente em "Editar Código Mermaid".
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-5">
                    <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-600" />
                      Linha de Etapas por Sequência (AS-IS Mapeamento Técnico)
                    </h3>
                    
                    {inputs.passo_a_passo && inputs.passo_a_passo.length > 0 ? (
                      <div className="relative border-l border-slate-200 pl-6 ml-4 space-y-6">
                        {inputs.passo_a_passo.map((step, idx) => (
                          <div key={idx} className="relative animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <span className="absolute -left-[31px] top-px bg-blue-600 outline outline-4 outline-white text-white text-[10px] w-5 h-5 font-bold rounded-full flex items-center justify-center">
                              {step.numero}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{step.atividade}</h4>
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">Responsável: {step.responsavel || "Cargo indefinido"}</p>
                              {step.sistema_ou_documento && (
                                <span className="inline-block text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/50 rounded-md py-0.5 px-2 mt-1 font-mono">
                                  {step.sistema_ou_documento}
                                </span>
                              )}
                              <p className="text-xs text-emerald-800 bg-emerald-50/50 inline-block px-2 py-0.5 rounded border border-emerald-100/50 mt-1.5 font-medium">
                                <strong>Entregável:</strong> {step.resultado_da_etapa}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhum passo a passo detalhado para listar.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "versions" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-base font-bold text-slate-800">Versões Registradas</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Comparar com:</span>
                  <SearchableSelect
                    value={compareVersionId}
                    onChange={handleCompare}
                    topOptions={[{ value: "", label: "Selecione..." }]}
                    options={versions.map((v) => ({
                      value: v.id,
                      label: `Versão #${v.version_number} (${v.change_type.toUpperCase()})`,
                    }))}
                    sort={false}
                    searchPlaceholder="Pesquisar versão..."
                    className="w-56"
                    triggerClassName="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs h-8 px-2"
                  />
                </div>
              </div>

              {compareResult ? (
                <div className="bg-amber-50/30 border border-amber-200/50 rounded-xl p-5 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-amber-950">Comparando com Versão #{compareResult.version_number}</h3>
                    <button
                      onClick={() => onRestoreVersion(popi.id, compareVersionId)}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg"
                    >
                      Restaurar esta versão
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-slate-950 text-slate-100 p-4 rounded-lg overflow-y-auto max-h-[300px]">
                      <p className="border-b border-slate-800 pb-2 mb-2 font-bold font-sans text-slate-400">Versão Anterior Snapshot POP:</p>
                      <pre className="whitespace-pre-wrap">{compareResult.doc?.pop_markdown || "Vazio"}</pre>
                    </div>

                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-y-auto max-h-[300px]">
                      <p className="border-b border-slate-800 pb-2 mb-2 font-bold font-sans text-slate-400">Versão Atual POP:</p>
                      <pre className="whitespace-pre-wrap">{document?.pop_markdown || "Vazio"}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((ver, idx) => (
                    <div key={ver.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border rounded-xl hover:bg-slate-100/50 transition gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">Versão #{ver.version_number}</span>
                          <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            {ver.change_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{ver.note}</p>
                        <p className="text-[10px] text-slate-400">Data rec: {new Date(ver.created_at).toLocaleString("pt-BR")}</p>
                      </div>

                      <button
                        onClick={() => onRestoreVersion(popi.id, ver.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold border border-blue-200/50 py-1.5 px-3 rounded-lg"
                      >
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "qa" && qaResult && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b pb-3">
                <div className="bg-red-50 p-2 rounded-lg text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Auditoria Adversarial Municipal</h2>
                  <p className="text-xs text-slate-500">Mapeador analítico correndo testes estritos contra riscos normativos.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Classificação do Relatório</span>
                  <p className="text-lg font-black text-rose-700 mt-1">{qaResult.classificacao}</p>
                </div>

                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Justificativa da Banca</span>
                  <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">{qaResult.justificativa}</p>
                </div>
              </div>

              {/* Table of errors */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Erros Identificados pela Banca</h3>
                {qaResult.erros_encontrados?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum erro material encontrado. Documento no padrão formal perfeito.</p>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider w-24">Tipo</th>
                          <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider">Trecho Impactado</th>
                          <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider">Problema</th>
                          <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider">Ajuste Recomendado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {qaResult.erros_encontrados.map((err: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <span className="bg-rose-50 border border-rose-100 text-rose-700 font-bold uppercase rounded p-1 text-[9px]">
                                {err.tipo}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{err.trecho}</td>
                            <td className="py-3 px-4 text-slate-600">{err.problema}</td>
                            <td className="py-3 px-4 text-emerald-800 font-medium">{err.correcao}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Risks section */}
              {qaResult.riscos_identificados?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase">Fatores de Riscos Normativos</h3>
                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4.5 text-xs text-rose-950 space-y-2">
                    {qaResult.riscos_identificados.map((risk: string, i: number) => (
                      <p key={i} className="flex gap-2 items-start font-medium">
                        <span className="text-rose-500">•</span> {risk}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Dynamic Overwrite Manual Edits warning modal */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="overwrite-warning-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="bg-amber-100 p-2 rounded-xl">
                <AlertTriangle className="w-5 h-5 col-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Sobrescrever Edições Manuais?</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Você realizou edições manuais neste documento anteriormente. Gerar o POPI novamente por Inteligência Artificial irá substituir todo o conteúdo atual pelo novo rascunho mapeado, o que **apagará as suas alterações manuais** no POP, Relatório TO-BE ou Fluxograma.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowOverwriteConfirm(false)}
                className="text-xs text-slate-600 font-bold hover:bg-slate-100 py-2.5 px-4 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowOverwriteConfirm(false);
                  executeGeneration();
                }}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sim, Gerar e Sobrescrever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
