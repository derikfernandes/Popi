import {
  getGapBlock,
  normalizeImportedInputs,
} from "../src/utils/importPop.ts";

let failed = 0;
function assert(name: string, condition: boolean) {
  console.log(`${condition ? "OK" : "FAIL"} — ${name}`);
  if (!condition) failed++;
}

const normalized = normalizeImportedInputs({
  role_or_position: "",
  routine_name: "Atendimento de solicitações",
  routine_goal: "Padronizar o atendimento",
  routine_type: "" as any,
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
});

assert("preserva nome extraído", normalized.routine_name === "Atendimento de solicitações");
assert("tipo desconhecido vira Outro", normalized.routine_type === "Outro");
assert("additional_notes é nulo", normalized.additional_notes === null);
assert("lacuna direta aponta bloco 4", getGapBlock("passo_a_passo") === 4);
assert(
  "lacuna com prefixo da IA aponta bloco 5",
  getGapBlock("inputs.gargalos_dificuldades") === 5
);
assert("metadado aponta bloco 1", getGapBlock("meta.department") === 1);

if (failed) {
  console.error(`FALHOU: ${failed}`);
  process.exit(1);
}
console.log("PASSOU — normalização da importação");
