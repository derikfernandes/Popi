import React, { useState } from "react";
import { DEFAULT_PROMPTS, AIPromptTemplate } from "../constants/defaultPrompts";
import { Sparkles, HelpCircle, RotateCcw, Save, CheckCircle, Terminal, HelpCircle as PlaceholderIcon, AlertTriangle } from "lucide-react";

interface PromptManagerProps {
  customPrompts: Record<string, string>;
  setCustomPrompts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBack: () => void;
}

export default function PromptManager({ customPrompts, setCustomPrompts, onBack }: PromptManagerProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(DEFAULT_PROMPTS[0].id);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Find current active prompt template info
  const activePromptMeta = DEFAULT_PROMPTS.find(p => p.id === selectedPromptId) || DEFAULT_PROMPTS[0];
  const [localTemplateText, setLocalTemplateText] = useState<string>(() => {
    return customPrompts[activePromptMeta.id] || activePromptMeta.defaultTemplate;
  });

  // Keep local content in sync when changing active prompt tab
  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    const meta = DEFAULT_PROMPTS.find(p => p.id === id) || DEFAULT_PROMPTS[0];
    setLocalTemplateText(customPrompts[id] || meta.defaultTemplate);
    setSuccessMessage(null);
  };

  const handleSave = () => {
    setCustomPrompts(prev => ({
      ...prev,
      [selectedPromptId]: localTemplateText
    }));
    setSuccessMessage("Configurações do prompt salvas com sucesso!");
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleRestoreDefault = () => {
    if (confirm(`Deseja realmente restaurar o prompt "${activePromptMeta.name}" para a versão padrão de fábrica?`)) {
      setLocalTemplateText(activePromptMeta.defaultTemplate);
      setCustomPrompts(prev => ({
        ...prev,
        [selectedPromptId]: activePromptMeta.defaultTemplate
      }));
      setSuccessMessage("Prompt restaurado para o padrão original.");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800" id="prompt-manager-container">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-600" id="terminal-icon" />
            Configurador das Instruções de Inteligência Artificial (Prompts)
          </h1>
          <p className="text-sm text-slate-500">
            Ajuste as diretrizes e regras que os modelos da IA do Gemini utilizam para as diferentes etapas do aplicativo.
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          id="btn-back-dashboard"
        >
          Voltar ao Painel
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Selector */}
        <div className="w-80 border-r border-slate-200 bg-white flex flex-col overflow-y-auto p-4 gap-2">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Selecione o Prompt para Alterar</span>
          {DEFAULT_PROMPTS.map((p) => {
            const isSelected = p.id === selectedPromptId;
            const isModified = customPrompts[p.id] !== p.defaultTemplate;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPrompt(p.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm"
                    : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"
                }`}
                id={`btn-select-prompt-${p.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm leading-relaxed">{p.name}</span>
                  {isModified && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Editado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-normal">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Central Workspace */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            
            {/* Header / Info box */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" id="sparkles-icon" />
                 Módulo: {activePromptMeta.name}
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {activePromptMeta.description}
              </p>
            </div>

            {/* Success notifications */}
            {successMessage && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm" id="success-message">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Variables and Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Placeholders helper */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <PlaceholderIcon className="h-3.5 w-3.5" id="placeholder-icon" />
                  Variáveis Disponíveis
                </h3>
                <p className="text-xs text-slate-500 leading-normal mb-1">
                  Estas variáveis são substituídas dinamicamente pelos dados da rotina antes de enviar ao Gemini. Use a sintaxe de chaves duplas: <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded text-[11px] font-mono font-bold font-semibold">{"{{nome_da_variavel}}"}</code>.
                </p>
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[30rem] pr-1">
                  {activePromptMeta.placeholders.map((pt, index) => (
                    <div key={index} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-mono text-xs font-bold text-indigo-700 block select-all break-all">
                        {"{{" + pt.name + "}}"}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        {pt.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Text Area Code Editor */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-semibold text-slate-700 block">
                    Instrução de Sistema Customizada (Prompt)
                  </label>
                  <button
                    onClick={handleRestoreDefault}
                    className="text-xs text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                    id="btn-restore-default"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restaurar Padrão
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-900">
                  <div className="bg-slate-800 text-[10px] px-4 py-2 border-b border-slate-700 text-slate-400 font-mono flex items-center justify-between">
                    <span>EDITANDO PROMPT - SYSTEM_INSTRUCTION_TEMPLATE</span>
                    <span>TS_FORMAT: PT_BR</span>
                  </div>
                  <textarea
                    value={localTemplateText}
                    onChange={(e) => setLocalTemplateText(e.target.value)}
                    rows={20}
                    className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-5 focus:outline-none focus:ring-0 leading-relaxed resize-y min-h-[35rem]"
                    id="prompt-textarea"
                    placeholder="Cole ou redija o novo prompt inteligente..."
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5 mt-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" id="alert-icon" />
                  <div className="text-xs text-amber-800 leading-normal">
                    <strong className="block font-semibold mb-0.5">Nota de Uso:</strong>
                    Mantenha as diretrizes de formatação (ex: solicitações para gerar Mermaid ou JSON estruturado) inalteradas se você deseja continuar usando as visualizações gráficas de fluxogramas e tabelas.
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={onBack}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                    id="btn-cancel-edit-prompts"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    id="btn-save-prompts"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Prompt Customizado
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
