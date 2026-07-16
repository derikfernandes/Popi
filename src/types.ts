export interface Secretaria {
  id: string;
  name: string;
  official_name: string;
  acronym: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  setor_ou_funcao: string;
  responsabilidade: string;
}

export interface PassoAPasso {
  numero: number;
  atividade: string;
  responsavel: string;
  sistema_ou_documento: string;
  resultado_da_etapa: string;
}

export interface MetaIndicador {
  indicador: string;
  meta: string;
  forma_de_medicao: string;
  fonte_dados: string;
  periodicidade: string;
}

export interface POPIInput {
  role_or_position: string;
  routine_name: string;
  routine_goal: string;
  routine_type: 'Atende diretamente o cidadão' | 'Rotina interna' | 'Outro';
  routine_type_detail: string;
  start_trigger: string;
  frequency: string;
  frequency_detail: string;
  participants: Participant[];
  participants_free: string;
  norma_orientadora: string;
  passo_a_passo: PassoAPasso[];
  passo_a_passo_free: string;
  sistemas_documentos_utilizados: string;
  informacoes_indispensaveis: string;
  tempo_medio: string;
  gargalos_dificuldades: string;
  melhorias_automacoes_sugeridas: string;
  metas_indicadores: MetaIndicador[];
  metas_indicadores_free: string;
  additional_notes: string | null;
}

export interface POPIDocument {
  pop_markdown: string;
  intelligent_report_markdown: string;
  /** Fluxograma AS-IS (processo atual). */
  flowchart_mermaid: string;
  /** Fluxograma TO-BE — alterações de fluxo de rotina. Vazio se não sugerido. */
  flowchart_tobe_flow_mermaid?: string;
  /** Fluxograma TO-BE — alterações sistêmicas. Vazio se não sugerido. */
  flowchart_tobe_system_mermaid?: string;
  final_markdown: string;
  last_generated_at: string | null;
  last_manual_edit_at: string | null;
}

export interface POPIClassification {
  id: string;
  popi_id: string;
  routine_category: string;
  routine_category_justification: string;
  improvement_categories: {
    category: string;
    justification: string;
  }[];
  confidence_level: 'baixo' | 'médio' | 'alto';
  classification_gaps: string[];
  created_at: string;
  updated_at: string;
}

export interface POPI {
  id: string;
  report_number: string;
  sequential_number: number;
  year: number;
  secretaria_id: string;
  secretaria_name: string;
  title: string;
  department: string;
  division: string;
  status: 'rascunho' | 'gerado' | 'em_edicao' | 'em_revisao' | 'aprovado' | 'arquivado';
  routine_category: string;
  improvement_categories: string[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  archived_at: string | null;
}

export interface POPIVersion {
  id: string;
  popi_id: string;
  version_number: number;
  changed_by: string;
  change_type: 'manual' | 'ai' | 'restore';
  status_at_change: string;
  changed_fields: string[];
  snapshot: {
    popi: POPI;
    input: POPIInput;
    document: POPIDocument;
    classification: POPIClassification | null;
  };
  note: string;
  created_at: string;
}

export interface Counter {
  id: string; // `${secretaria_id}_${year}`
  secretaria_id: string;
  year: number;
  last_number: number;
  updated_at: string;
}

export type UserRole = 'admin' | 'usuario';

/** Perfil de acesso persistido em `users/{uid}` (não é o User do Firebase Auth). */
export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  role: UserRole;
  /** Secretarias cujo usuário pode ver/editar POPIs. Vazio = nenhuma (até o admin atribuir). */
  secretaria_ids: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}
