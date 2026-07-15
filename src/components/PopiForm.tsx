import React, { useState } from "react";
import { Secretaria, POPIInput, Participant, PassoAPasso, MetaIndicador, POPI } from "../types";
import { 
  Save, Sparkles, Plus, Trash2, ArrowLeft, ArrowRight, Library, Info, HelpCircle, 
  HelpCircle as QuestionIcon, HelpCircle as HintIcon, CheckCircle2 
} from "lucide-react";

interface PopiFormProps {
  initialInputs: POPIInput | null;
  secretarias: Secretaria[];
  onSave: (inputs: POPIInput, meta: { title: string; secretariaId: string; department: string; division: string }) => void;
  onCancel: () => void;
  popiId?: string;
  activePopi?: POPI | null;
  customNormalizePrompt?: string;
}

export default function PopiForm({ initialInputs, secretarias, onSave, onCancel, popiId, activePopi, customNormalizePrompt }: PopiFormProps) {
  // Navigation blocks
  const [currentBlock, setCurrentBlock] = useState(1);

  // Normalization loading
  const [isNormalizing, setIsNormalizing] = useState(false);

  // Metadata
  const [secretariaId, setSecretariaId] = useState(activePopi?.secretaria_id || secretarias[0]?.id || "");
  const [department, setDepartment] = useState(activePopi?.department || "");
  const [division, setDivision] = useState(activePopi?.division || "");
  const [title, setTitle] = useState(activePopi?.title || "");

  // Input states (16 Questions)
  const [roleOrPosition, setRoleOrPosition] = useState(initialInputs?.role_or_position || "");
  const [goal, setGoal] = useState(initialInputs?.routine_goal || "");
  const [routineType, setRoutineType] = useState(initialInputs?.routine_type || "Rotina interna");
  const [routineTypeDetail, setRoutineTypeDetail] = useState(initialInputs?.routine_type_detail || "");
  const [startTrigger, setStartTrigger] = useState(initialInputs?.start_trigger || "");
  const [frequency, setFrequency] = useState(initialInputs?.frequency || "Diariamente");
  const [frequencyDetail, setFrequencyDetail] = useState(initialInputs?.frequency_detail || "");

  // Q8: Participants
  const [participants, setParticipants] = useState<Participant[]>(initialInputs?.participants || []);
  const [participantsFree, setParticipantsFree] = useState(initialInputs?.participants_free || "");

  // Q9: Laws/Norms
  const [normaOrientadora, setNormaOrientadora] = useState(initialInputs?.norma_orientadora || "");

  // Q10: Step by Step
  const [passoAPasso, setPassoAPasso] = useState<PassoAPasso[]>(initialInputs?.passo_a_passo || []);
  const [passoAPassoFree, setPassoAPassoFree] = useState(initialInputs?.passo_a_passo_free || "");

  // Q11, Q12, Q13
  const [sistemasDocumentos, setSistemasDocumentos] = useState(initialInputs?.sistemas_documentos_utilizados || "");
  const [informacoesIndispensaveis, setInformacoesIndispensaveis] = useState(initialInputs?.informacoes_indispensaveis || "");
  const [tempoMedio, setTempoMedio] = useState(initialInputs?.tempo_medio || "15 a 30 minutos");

  // Q14, Q15, Q16
  const [gargalos, setGargalos] = useState(initialInputs?.gargalos_dificuldades || "");
  const [melhorias, setMelhorias] = useState(initialInputs?.melhorias_automacoes_sugeridas || "");
  const [metasIndicadores, setMetasIndicadores] = useState<MetaIndicador[]>(initialInputs?.metas_indicadores || []);
  const [metasIndicadoresFree, setMetasIndicadoresFree] = useState(initialInputs?.metas_indicadores_free || "");

  // Populate metadata from mock if editing edit
  React.useEffect(() => {
    if (initialInputs) {
      setRoleOrPosition(initialInputs.role_or_position);
      setTitle(initialInputs.routine_name);
      setGoal(initialInputs.routine_goal);
      setRoutineType(initialInputs.routine_type);
      setRoutineTypeDetail(initialInputs.routine_type_detail);
      setStartTrigger(initialInputs.start_trigger);
      setFrequency(initialInputs.frequency);
      setFrequencyDetail(initialInputs.frequency_detail);
      setParticipants(initialInputs.participants);
      setParticipantsFree(initialInputs.participants_free);
      setNormaOrientadora(initialInputs.norma_orientadora);
      setPassoAPasso(initialInputs.passo_a_passo);
      setPassoAPassoFree(initialInputs.passo_a_passo_free);
      setSistemasDocumentos(initialInputs.sistemas_documentos_utilizados);
      setInformacoesIndispensaveis(initialInputs.informacoes_indispensaveis);
      setTempoMedio(initialInputs.tempo_medio);
      setGargalos(initialInputs.gargalos_dificuldades);
      setMelhorias(initialInputs.melhorias_automacoes_sugeridas);
      setMetasIndicadores(initialInputs.metas_indicadores);
      setMetasIndicadoresFree(initialInputs.metas_indicadores_free);
    }
    if (activePopi) {
      setSecretariaId(activePopi.secretaria_id);
      setDepartment(activePopi.department);
      setDivision(activePopi.division);
      setTitle(activePopi.title);
    }
  }, [initialInputs, activePopi]);

  // AI Normalizer - Uses the backend api to turn free text into beautifully structured arrays!
  const handleAINormalize = async () => {
    if (!participantsFree && !passoAPassoFree && !metasIndicadoresFree) {
      alert("Escreva alguma descrição textual nos campos de participantes (Q8), passo a passo (Q10) ou metas (Q16) antes de otimizar com IA.");
      return;
    }

    setIsNormalizing(true);
    try {
      const resp = await fetch("/api/normalize-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: {
            participants_free: participantsFree,
            passo_a_passo_free: passoAPassoFree,
            metas_indicadores_free: metasIndicadoresFree,
          },
          customPrompt: customNormalizePrompt,
        }),
      });

      if (!resp.ok) throw new Error("Erro na solicitação com a IA");
      const normalized = await resp.json();

      if (normalized.participants?.length > 0) {
        setParticipants(normalized.participants);
        setParticipantsFree("");
      }
      if (normalized.passo_a_passo?.length > 0) {
        setPassoAPasso(normalized.passo_a_passo);
        setPassoAPassoFree("");
      }
      if (normalized.metas_indicadores?.length > 0) {
        setMetasIndicadores(normalized.metas_indicadores);
        setMetasIndicadoresFree("");
      }
    } catch (err: any) {
      alert("Não foi possível processar a otimização automática: " + err.message);
    } finally {
      setIsNormalizing(false);
    }
  };

  // Helper functions to manage dynamic tables
  const addParticipantRow = () => {
    setParticipants([...participants, { setor_ou_funcao: "", responsabilidade: "" }]);
  };

  const removeParticipantRow = (idx: number) => {
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  const updateParticipant = (idx: number, field: keyof Participant, val: string) => {
    const updated = [...participants];
    updated[idx][field] = val;
    setParticipants(updated);
  };

  const addStepRow = () => {
    setPassoAPasso([
      ...passoAPasso,
      {
        numero: passoAPasso.length + 1,
        atividade: "",
        responsavel: "",
        sistema_ou_documento: "",
        resultado_da_etapa: "",
      },
    ]);
  };

  const removeStepRow = (idx: number) => {
    const filtered = passoAPasso.filter((_, i) => i !== idx);
    const updated = filtered.map((step, i) => ({ ...step, numero: i + 1 }));
    setPassoAPasso(updated);
  };

  const updateStep = (idx: number, field: keyof PassoAPasso, val: any) => {
    const updated = [...passoAPasso];
    updated[idx] = { ...updated[idx], [field]: val };
    setPassoAPasso(updated);
  };

  const addIndicatorRow = () => {
    setMetasIndicadores([
      ...metasIndicadores,
      { indicador: "", meta: "", forma_de_medicao: "", fonte_dados: "", periodicidade: "" },
    ]);
  };

  const removeIndicatorRow = (idx: number) => {
    setMetasIndicadores(metasIndicadores.filter((_, i) => i !== idx));
  };

  const updateIndicator = (idx: number, field: keyof MetaIndicador, val: string) => {
    const updated = [...metasIndicadores];
    updated[idx][field] = val;
    setMetasIndicadores(updated);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("O nome da rotina (Título) é essencial para identificação.");
      return;
    }

    const payload: POPIInput = {
      role_or_position: roleOrPosition,
      routine_name: title,
      routine_goal: goal,
      routine_type: routineType as any,
      routine_type_detail: routineTypeDetail,
      start_trigger: startTrigger,
      frequency,
      frequency_detail: frequencyDetail,
      participants,
      participants_free: participantsFree,
      norma_orientadora: normaOrientadora,
      passo_a_passo: passoAPasso,
      passo_a_passo_free: passoAPassoFree,
      sistemas_documentos_utilizados: sistemasDocumentos,
      informacoes_indispensaveis: informacoesIndispensaveis,
      tempo_medio: tempoMedio,
      gargalos_dificuldades: gargalos,
      melhorias_automacoes_sugeridas: melhorias,
      metas_indicadores: metasIndicadores,
      metas_indicadores_free: metasIndicadoresFree,
      additional_notes: null,
    };

    onSave(payload, {
      title,
      secretariaId,
      department,
      division,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-5xl mx-auto">
      {/* Form Title & Stepper */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {popiId ? "Editar Mapeamento da Rotina" : "Mapeamento Coletor de Rotina"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Forneça detalhes estruturados do processo de forma amigável.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAINormalize}
            disabled={isNormalizing}
            className="self-start md:self-auto inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isNormalizing ? "Otimizando..." : "Otimizar tabelas com I.A."}
          </button>
        </div>

        {/* Wizard indicators */}
        <div className="grid grid-cols-5 gap-2 mt-6">
          {[1, 2, 3, 4, 5].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentBlock(idx)}
              className={`h-2 rounded-full text-left transition ${
                currentBlock === idx
                  ? "bg-blue-600"
                  : currentBlock > idx
                  ? "bg-slate-400"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-2">
          <span>Identificação</span>
          <span>Natureza</span>
          <span>Participantes</span>
          <span>Procedimento</span>
          <span>Melhorias</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        {/* BLOCK 1: Identificação */}
        {currentBlock === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Bloco 1 — Identificação do Relatório</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  1. Secretaria Executante <span className="text-red-500">*</span>
                </label>
                <select
                  value={secretariaId}
                  onChange={(e) => setSecretariaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  {secretarias.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.official_name} ({sec.acronym})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Departamento / Setor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Urbam / UTC"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Divisão Organizacional</label>
                <input
                  type="text"
                  placeholder="Ex: Central de Agendamentos"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  2. Cargo ou Função do Entrevistador / Informante <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Assessor de Diretoria"
                  value={roleOrPosition}
                  onChange={(e) => setRoleOrPosition(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Nunca cite nomes de pessoas físicas.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  3. Nome da Rotina de Trabalho / Atividade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Central de Agendamento da Saúde"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  4. Qual o Objetivo dessa rotina? <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Explique resumidamente por que essa atividade existe e qual problema ela resolve."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 2: Natureza */}
        {currentBlock === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Bloco 2 — Natureza e gatilho da atividade</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  5. Esta rotina atende diretamente o cidadão ou é uma rotina interna da gestão municipal? <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {[
                    "Atende diretamente o cidadão",
                    "Rotina interna",
                    "Outro",
                  ].map((opt) => (
                    <label
                      key={opt}
                      className={`inline-flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition ${
                        routineType === opt
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-slate-50 border-slate-200 hover:bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="routineType"
                        value={opt}
                        checked={routineType === opt}
                        onChange={() => setRoutineType(opt as any)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                {routineType === "Outro" && (
                  <input
                    type="text"
                    placeholder="Especifique outros tipos..."
                    value={routineTypeDetail}
                    onChange={(e) => setRoutineTypeDetail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm mt-3 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  6. O que faz essa rotina começar? (Gatilho) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Protocolo do cidadão, solicitação de chefias, vencimento de prazo..."
                  value={startTrigger}
                  onChange={(e) => setStartTrigger(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  7. Essa atividade acontece com que frequência? <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {[
                    "Diariamente",
                    "Semanalmente",
                    "Quinzenalmente",
                    "Mensalmente",
                    "Sob demanda",
                    "Outro",
                  ].map((opt) => (
                    <label
                      key={opt}
                      className={`inline-flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition ${
                        frequency === opt
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-slate-50 border-slate-200 hover:bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="frequency"
                        value={opt}
                        checked={frequency === opt}
                        onChange={() => setFrequency(opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                {frequency === "Outro" && (
                  <input
                    type="text"
                    placeholder="Especifique a frequência..."
                    value={frequencyDetail}
                    onChange={(e) => setFrequencyDetail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm mt-3 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 3: Participantes */}
        {currentBlock === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Bloco 3 — Intervenientes e Normas Regulatórias</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    8. Quem participa da rotina? (Setores/Cargos) <span className="text-red-500">*</span>
                  </label>
                </div>

                {/* Table or text alternative */}
                <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-2">Roteiro livre por texto:</p>
                      <textarea
                        rows={4}
                        placeholder="Ex: Assistente Administrativo tria as listas do SAMS e o Pregoeiro Líder assina os lotes."
                        value={participantsFree}
                        onChange={(e) => setParticipantsFree(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-slate-500 font-medium font-bold">Estruturado em Tabela:</p>
                        <button
                          type="button"
                          onClick={addParticipantRow}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Setor
                        </button>
                      </div>

                      {participants.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                          Nenhum participante estruturado. Preencha em texto ou adicione linhas.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {participants.map((part, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
                              <input
                                type="text"
                                placeholder="Setor ou Função"
                                value={part.setor_ou_funcao}
                                onChange={(e) => updateParticipant(idx, "setor_ou_funcao", e.target.value)}
                                className="w-1/3 bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="O que faz na rotina"
                                value={part.responsabilidade}
                                onChange={(e) => updateParticipant(idx, "responsabilidade", e.target.value)}
                                className="w-2/3 bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => removeParticipantRow(idx)}
                                className="text-red-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  9. Existe alguma lei, decreto ou norma reguladora nacional/local?
                </label>
                <textarea
                  placeholder="Ex: Lei 14.133/2021, Portaria SMS 245/2016..."
                  value={normaOrientadora}
                  onChange={(e) => setNormaOrientadora(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 4: Execução */}
        {currentBlock === 4 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Bloco 4 — Passo a Passo e Meios Técnicos</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    10. Descreva o passo a passo ordenado da rotina <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-2">Descreva a sequência em forma livre:</p>
                      <textarea
                        rows={4}
                        placeholder="Ex: Etapa 1: Exportamos o relatório. Etapa 2: Validamos cada dotação orçamentária. Se estiver OK, publicamos no portal, caso contrário devolvemos."
                        value={passoAPassoFree}
                        onChange={(e) => setPassoAPassoFree(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-slate-500 font-medium font-bold">Visualização Estruturada em Etapas:</p>
                        <button
                          type="button"
                          onClick={addStepRow}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-xs"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Etapa
                        </button>
                      </div>

                      {passoAPasso.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                          Nenhuma etapa estruturada ainda. Digite seu texto livre acima e clique no botão superior "Otimizar tabelas com I.A." para gerar as etapas perfeitamente automáticas!
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {passoAPasso.map((step, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-2 bg-white p-3 rounded-lg border border-slate-100 shadow-xs relative">
                              <span className="absolute top-1 left-2 text-[10px] bg-slate-100 px-1.5 rounded font-bold text-slate-500">
                                #{step.numero}
                              </span>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full pt-2">
                                <input
                                  type="text"
                                  placeholder="Nome da Atividade"
                                  value={step.atividade}
                                  onChange={(e) => updateStep(idx, "atividade", e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Responsável (Cargo)"
                                  value={step.responsavel}
                                  onChange={(e) => updateStep(idx, "responsavel", e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Sistema ou Documento"
                                  value={step.sistema_ou_documento}
                                  onChange={(e) => updateStep(idx, "sistema_ou_documento", e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Resultado Esperado"
                                  value={step.resultado_da_etapa}
                                  onChange={(e) => updateStep(idx, "resultado_da_etapa", e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeStepRow(idx)}
                                className="self-end md:self-center text-red-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    11. Quais sistemas, planilhas ou documentos são utilizados? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SEI, 1Doc, Excel, CROSS..."
                    value={sistemasDocumentos}
                    onChange={(e) => setSistemasDocumentos(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    12. Quais informações ou documentos são indispensáveis para iniciar a rotina? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CPF, nº do processo, termo assinado..."
                    value={informacoesIndispensaveis}
                    onChange={(e) => setInformacoesIndispensaveis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  13. Quanto tempo, em média, leva para executar essa rotina? <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {[
                    "Menos de 15 minutos",
                    "15 a 30 minutos",
                    "30 minutos a 1 hora",
                    "1 a 2 horas",
                    "Mais de 2 horas",
                  ].map((opt) => (
                    <label
                      key={opt}
                      className={`inline-flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition ${
                        tempoMedio === opt
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-slate-50 border-slate-200 hover:bg-white text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tempoMedio"
                        value={opt}
                        checked={tempoMedio === opt}
                        onChange={() => setTempoMedio(opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 5: Inteligência */}
        {currentBlock === 5 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Bloco 5 — Desafios, Ideias e Monitoramento</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  14. Onde acontecem os maiores atrasos ou dificuldades? <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Relate os gargalos materiais enfrentados, desvios sistêmicos e redundâncias."
                  value={gargalos}
                  onChange={(e) => setGargalos(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  15. O que poderia ser automatizado, simplificado ou melhorado? <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Informe soluções prováveis, uso potencial de IA ou integração inteligente."
                  value={melhorias}
                  onChange={(e) => setMelhorias(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  16. Essa rotina tem metas declaradas ou indicadores de acompanhamento? <span className="text-red-500">*</span>
                </label>

                <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 p-4 mt-1">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-2">Descreva suas métricas em forma livre:</p>
                      <textarea
                        rows={3}
                        placeholder="Ex: Aproveitamento de vagas: mínimo 95%, avaliado de forma semanal no SGA."
                        value={metasIndicadoresFree}
                        onChange={(e) => setMetasIndicadoresFree(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-slate-500 font-medium font-bold">Métricas em Tabela Estruturada:</p>
                        <button
                          type="button"
                          onClick={addIndicatorRow}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-xs"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Métrica
                        </button>
                      </div>

                      {metasIndicadores.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                          Nenhuma cota registrada. Use o robô de otimização de Ia acima para criar.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {metasIndicadores.map((ind, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
                              <input
                                type="text"
                                placeholder="Indicador"
                                value={ind.indicador}
                                onChange={(e) => updateIndicator(idx, "indicador", e.target.value)}
                                className="w-1/4 bg-slate-50 border border-slate-200 rounded py-1 px-1.5 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Meta"
                                value={ind.meta}
                                onChange={(e) => updateIndicator(idx, "meta", e.target.value)}
                                className="w-1/4 bg-slate-50 border border-slate-200 rounded py-1 px-1.5 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Medição"
                                value={ind.forma_de_medicao}
                                onChange={(e) => updateIndicator(idx, "forma_de_medicao", e.target.value)}
                                className="w-1/4 bg-slate-50 border border-slate-200 rounded py-1 px-1.5 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Freq."
                                value={ind.periodicidade}
                                onChange={(e) => updateIndicator(idx, "periodicidade", e.target.value)}
                                className="w-1/4 bg-slate-50 border border-slate-200 rounded py-1 px-1.5 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => removeIndicatorRow(idx)}
                                className="text-red-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flow Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-700 text-sm font-semibold hover:bg-slate-50 h-10 px-4 rounded-xl transition"
          >
            Voltar
          </button>

          <div className="flex items-center gap-3">
            {currentBlock > 1 && (
              <button
                type="button"
                onClick={() => setCurrentBlock(currentBlock - 1)}
                className="inline-flex items-center gap-1 border border-slate-200 hover:bg-slate-50 text-slate-700 h-10 px-3 rounded-xl text-sm font-bold transition"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            )}

            {currentBlock < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentBlock(currentBlock + 1)}
                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 h-10 px-4 rounded-xl text-sm font-bold transition"
              >
                Próximo <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-xl text-sm transition shadow-md shadow-blue-200"
              >
                <Save className="w-4 h-4" />
                Salvar Rascunho
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
