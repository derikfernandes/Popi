import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  Secretaria,
  POPI,
  POPIInput,
  POPIDocument,
  POPIClassification,
  POPIVersion,
  UserProfile,
} from "../types";
import {
  DEFAULT_SECRETARIAS,
  INITIAL_POPIS,
  INITIAL_INPUTS,
  INITIAL_DOCUMENTS,
} from "../data";
import { auth } from "../firebase";
import {
  saveSecretariaToFirestore,
  loadSecretariasFromFirestore,
  savePOPIToFirestore,
  loadPOPIsFromFirestore,
  deletePOPIFromFirestore,
  purgeOrphanPopiTreesFromFirestore,
  savePOPIInputToFirestore,
  loadPOPIInputFromFirestore,
  savePOPIDocumentToFirestore,
  loadPOPIDocumentFromFirestore,
  savePOPIClassificationToFirestore,
  loadPOPIClassificationFromFirestore,
  savePOPIVersionToFirestore,
  loadPOPIVersionsFromFirestore,
  saveGlobalPromptsToFirestore,
  loadGlobalPromptsFromFirestore,
  loadLegacyUserPromptsFromFirestore,
  buildDefaultPromptsMap,
  syncLocalToFirestore,
  ensureUserProfile,
} from "../firebaseSync";
import { setFirestoreErrorObserver } from "../firebaseErrors";
import {
  isAdminProfile,
  canApprovePopi,
  canAccessSecretaria,
  filterPopisForUser,
} from "../permissions";
import { generateSequentialNumberAndReportNumber } from "../utils/sequentialNumber";
import {
  buildDocumentFromGeneration,
  emptyPopiDocument,
} from "../utils/popiDocument";
import {
  generatePopiDocumentDeduped,
  runPopiQa,
  suggestPopiCategories,
  type QaPopiResponse,
} from "../services/popiApi";
import { cacheGet, cacheSet, cacheInvalidate, dedupeAsync } from "../utils/cache";

const SECRETARIAS_CACHE_KEY = "secretarias";
const PROMPTS_CACHE_KEY = "global-prompts";
const SECRETARIAS_TTL_MS = 5 * 60 * 1000;
const PROMPTS_TTL_MS = 10 * 60 * 1000;
const ORPHAN_PURGE_SESSION_KEY = "popi_orphan_purged";

const EMPTY_POPI_INPUT: POPIInput = {
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

function mergeDefaultPrompts(
  stored: Record<string, string> | null
): Record<string, string> {
  return {
    ...buildDefaultPromptsMap(),
    ...(stored || {}),
  };
}

export interface PopiFormMeta {
  title: string;
  secretariaId: string;
  department: string;
  division: string;
}

interface PopiDataContextValue {
  // Auth
  currentUser: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  syncingCloud: boolean;
  cloudSynced: boolean;
  cloudError: string | null;
  profileError: string | null;
  isAdmin: boolean;
  setCloudError: Dispatch<SetStateAction<string | null>>;

  // Data
  secretarias: Secretaria[];
  popis: POPI[];
  inputs: Record<string, POPIInput>;
  documents: Record<string, POPIDocument>;
  classifications: Record<string, POPIClassification>;
  versions: Record<string, POPIVersion[]>;
  customPrompts: Record<string, string>;
  setCustomPrompts: Dispatch<SetStateAction<Record<string, string>>>;

  // Derived
  visiblePopis: POPI[];
  formSecretarias: Secretaria[];
  metrics: {
    total: number;
    approved: number;
    inReview: number;
    rascunho: number;
  };

  // Handlers
  handleAddSecretaria: (
    newSec: Omit<Secretaria, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  handleUpdateSecretaria: (
    id: string,
    patch: Pick<Secretaria, "name" | "official_name" | "acronym" | "active">
  ) => Promise<void>;
  handleSavePOPIForm: (
    formInputs: POPIInput,
    meta: PopiFormMeta,
    selectedPopiId: string | null
  ) => Promise<string>;
  handleUpdateStatus: (id: string, status: POPI["status"]) => Promise<void>;
  handleGeneratePOPIWithIA: (id: string) => Promise<void>;
  handleRunQAInspection: (id: string) => Promise<QaPopiResponse | undefined>;
  handleSaveManualEdit: (
    id: string,
    popMarkdown: string,
    reportMarkdown: string,
    flowchartMermaid?: string,
    flowchartTobeFlow?: string,
    flowchartTobeSystem?: string
  ) => Promise<void>;
  handleRestoreVersion: (id: string, versionId: string) => Promise<void>;
  handleDeletePopi: (id: string) => Promise<void>;
  handleSuggestClassification: (id: string) => Promise<void>;
  handleSaveClassification: (
    id: string,
    category: string,
    improvements: string[]
  ) => Promise<void>;

  /** Carrega input/documento/classificação/versões só quando a página precisa. */
  ensurePopiDetails: (id: string, options?: { force?: boolean }) => Promise<void>;
  detailsLoadingId: string | null;
  /** Carrega prompts globais sob demanda (form/workspace/admin). */
  ensurePromptsLoaded: () => Promise<void>;
  promptsReady: boolean;
  /** Limpeza de órfãos (admin), no máximo uma vez por sessão. */
  runOrphanPurgeOnce: () => Promise<void>;
}

const PopiDataContext = createContext<PopiDataContextValue | null>(null);

function readLocalJson<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function buildSeedVersions(): Record<string, POPIVersion[]> {
  const seedVersions: Record<string, POPIVersion[]> = {};
  INITIAL_POPIS.forEach((popi) => {
    seedVersions[popi.id] = [
      {
        id: `v-${popi.id}-1`,
        popi_id: popi.id,
        version_number: 1,
        changed_by: "Servidor Municipal",
        change_type: "ai",
        status_at_change: popi.status,
        changed_fields: ["final_markdown"],
        snapshot: {
          popi,
          input: INITIAL_INPUTS[popi.id],
          document: INITIAL_DOCUMENTS[popi.id],
          classification: null,
        },
        note: "Emissão inicial estruturada por Inteligência Artificial.",
        created_at: popi.created_at,
      },
    ];
  });
  return seedVersions;
}

export function PopiDataProvider({ children }: { children: ReactNode }) {
  const [secretarias, setSecretarias] = useState<Secretaria[]>(() => {
    const saved = localStorage.getItem("popi_secretarias");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Secretaria[];
        if (parsed.length >= 15) return parsed;
      } catch {
        // fallback
      }
    }
    return DEFAULT_SECRETARIAS;
  });

  const [popis, setPopis] = useState<POPI[]>(() =>
    readLocalJson("popi_list", INITIAL_POPIS)
  );
  const [inputs, setInputs] = useState<Record<string, POPIInput>>(() =>
    readLocalJson("popi_inputs", INITIAL_INPUTS)
  );
  const [documents, setDocuments] = useState<Record<string, POPIDocument>>(() =>
    readLocalJson("popi_documents", INITIAL_DOCUMENTS)
  );
  const [classifications, setClassifications] = useState<
    Record<string, POPIClassification>
  >(() => readLocalJson("popi_classifications", {}));
  const [versions, setVersions] = useState<Record<string, POPIVersion[]>>(() => {
    const saved = localStorage.getItem("popi_versions");
    if (saved) {
      try {
        return JSON.parse(saved) as Record<string, POPIVersion[]>;
      } catch {
        // fallback
      }
    }
    return buildSeedVersions();
  });

  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(
    () => {
      const saved = localStorage.getItem("popi_custom_prompts");
      if (saved) {
        try {
          return JSON.parse(saved) as Record<string, string>;
        } catch {
          // fallback
        }
      }
      return buildDefaultPromptsMap();
    }
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [promptsReady, setPromptsReady] = useState(false);
  const loadedDetailsRef = useRef(new Set<string>());
  const promptsLoadStartedRef = useRef(false);

  const isAdmin = isAdminProfile(userProfile);

  useEffect(() => {
    setFirestoreErrorObserver((_info, friendlyMessage) => {
      setCloudError(friendlyMessage);
    });
    return () => setFirestoreErrorObserver(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setSyncingCloud(true);
        setCloudError(null);
        setProfileError(null);
        loadedDetailsRef.current.clear();
        promptsLoadStartedRef.current = false;
        setPromptsReady(false);

        try {
          const profile = await ensureUserProfile(user);
          if (cancelled) return;
          setUserProfile(profile);

          if (!profile.active) {
            setCloudSynced(false);
            return;
          }

          if (profile.role !== "admin") {
            setPopis([]);
          }

          // Secretarias: cache em memória (mudam pouco)
          const cachedSecs = cacheGet<Secretaria[]>(SECRETARIAS_CACHE_KEY);
          if (cachedSecs && cachedSecs.length > 0) {
            setSecretarias(cachedSecs);
          }

          const cloudSecs = await dedupeAsync("load-secretarias", () =>
            loadSecretariasFromFirestore()
          );
          if (cancelled) return;
          if (cloudSecs && cloudSecs.length > 0) {
            setSecretarias(cloudSecs);
            cacheSet(SECRETARIAS_CACHE_KEY, cloudSecs, SECRETARIAS_TTL_MS);
          } else if (profile.role === "admin" && !cachedSecs) {
            for (const sec of secretarias) {
              await saveSecretariaToFirestore(sec);
            }
            cacheSet(SECRETARIAS_CACHE_KEY, secretarias, SECRETARIAS_TTL_MS);
          }

          // Lista de POPIs (metadados) — detalhes sob demanda em ensurePopiDetails
          const popiScope =
            profile.role === "admin" ? ("all" as const) : profile.secretaria_ids;
          const cloudPopis = await dedupeAsync(
            `load-popis:${profile.uid}:${profile.role}`,
            () => loadPOPIsFromFirestore(popiScope)
          );
          if (cancelled) return;

          if (cloudPopis && cloudPopis.length > 0) {
            setPopis(cloudPopis);
          } else if (profile.role === "admin") {
            await syncLocalToFirestore(
              secretarias,
              popis,
              inputs,
              documents,
              classifications,
              versions,
              user.uid
            );
          } else {
            setPopis([]);
          }

          // Prompts: mantém localStorage/defaults; nuvem sob demanda
          setPromptsReady(false);

          setCloudSynced(true);
        } catch (err) {
          if (cancelled) return;
          console.error("Erro ao sincronizar Firestore ao autenticar:", err);
          const msg =
            err instanceof Error
              ? err.message
              : "Falha ao carregar perfil de acesso no Firestore.";
          setProfileError(
            msg.includes("permission") || msg.includes("Permission")
              ? "Sem permissão para criar/ler seu perfil. Publique as Firestore rules atualizadas (firebase deploy --only firestore:rules) ou verifique se settings/bootstrap.initialized_by é o seu UID."
              : msg
          );
        } finally {
          if (!cancelled) setSyncingCloud(false);
        }
      } else {
        setUserProfile(null);
        setProfileError(null);
        setCloudSynced(false);
        loadedDetailsRef.current.clear();
        setPromptsReady(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !isAdminProfile(userProfile)) return;
    localStorage.setItem("popi_custom_prompts", JSON.stringify(customPrompts));
    saveGlobalPromptsToFirestore(customPrompts, currentUser.uid).catch((err) =>
      console.error(err)
    );
  }, [customPrompts, currentUser, userProfile]);

  useEffect(() => {
    localStorage.setItem("popi_secretarias", JSON.stringify(secretarias));
  }, [secretarias]);

  useEffect(() => {
    localStorage.setItem("popi_list", JSON.stringify(popis));
  }, [popis]);

  useEffect(() => {
    localStorage.setItem("popi_inputs", JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem("popi_documents", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem("popi_classifications", JSON.stringify(classifications));
  }, [classifications]);

  useEffect(() => {
    localStorage.setItem("popi_versions", JSON.stringify(versions));
  }, [versions]);

  const handleAddSecretaria = useCallback(
    async (newSec: Omit<Secretaria, "id" | "created_at" | "updated_at">) => {
      const sec: Secretaria = {
        ...newSec,
        id: `sec-${newSec.acronym.toLowerCase()}-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSecretarias((prev) => [...prev, sec]);
      cacheInvalidate(SECRETARIAS_CACHE_KEY);
      if (currentUser) {
        await saveSecretariaToFirestore(sec);
      }
    },
    [currentUser]
  );

  const handleUpdateSecretaria = useCallback(
    async (
      id: string,
      patch: Pick<Secretaria, "name" | "official_name" | "acronym" | "active">
    ) => {
      const existing = secretarias.find((s) => s.id === id);
      if (!existing) return;

      const updated: Secretaria = {
        ...existing,
        ...patch,
        updated_at: new Date().toISOString(),
      };

      setSecretarias((prev) => prev.map((s) => (s.id === id ? updated : s)));
      cacheInvalidate(SECRETARIAS_CACHE_KEY);

      if (existing.name !== patch.name) {
        const touched = popis
          .filter((p) => p.secretaria_id === id)
          .map((p) => ({
            ...p,
            secretaria_name: patch.name,
            updated_at: new Date().toISOString(),
          }));

        if (touched.length > 0) {
          const byId = new Map(touched.map((p) => [p.id, p]));
          setPopis((prev) => prev.map((p) => byId.get(p.id) || p));
          if (currentUser) {
            for (const p of touched) {
              await savePOPIToFirestore(p);
            }
          }
        }
      }

      if (currentUser) {
        await saveSecretariaToFirestore(updated);
      }
    },
    [secretarias, popis, currentUser]
  );

  const handleSavePOPIForm = useCallback(
    async (
      formInputs: POPIInput,
      meta: PopiFormMeta,
      selectedPopiId: string | null
    ): Promise<string> => {
      if (!canAccessSecretaria(userProfile, meta.secretariaId)) {
        setCloudError("Você não tem acesso a esta secretaria.");
        throw new Error("Sem acesso à secretaria");
      }

      const currentYear = new Date().getFullYear();
      const isNew = !selectedPopiId;
      const targetId = selectedPopiId || `popi-gen-${Date.now()}`;
      const matchedSec = secretarias.find((s) => s.id === meta.secretariaId);
      const secName = matchedSec ? matchedSec.name : "Geral";

      let reportNumber = "";
      let seqNo = 1;

      if (isNew) {
        const calc = generateSequentialNumberAndReportNumber(
          secretarias,
          popis,
          meta.secretariaId,
          currentYear
        );
        reportNumber = calc.reportNo;
        seqNo = calc.seq;
      } else {
        const existing = popis.find((p) => p.id === targetId);
        reportNumber = existing?.report_number || "";
        seqNo = existing?.sequential_number || 1;
      }

      const popiObj: POPI = {
        id: targetId,
        report_number: reportNumber,
        sequential_number: seqNo,
        year: currentYear,
        secretaria_id: meta.secretariaId,
        secretaria_name: secName,
        title: meta.title,
        department: meta.department,
        division: meta.division,
        status: "rascunho",
        routine_category: "",
        improvement_categories: [],
        created_by: currentUser ? currentUser.uid : "user-current",
        updated_by: currentUser ? currentUser.uid : "user-current",
        created_at: isNew
          ? new Date().toISOString()
          : popis.find((p) => p.id === targetId)?.created_at ||
            new Date().toISOString(),
        updated_at: new Date().toISOString(),
        approved_at: null,
        archived_at: null,
      };

      setInputs((prev) => ({ ...prev, [targetId]: formInputs }));
      setPopis((prev) =>
        isNew ? [...prev, popiObj] : prev.map((p) => (p.id === targetId ? popiObj : p))
      );

      const newVersion: POPIVersion = {
        id: `ver-${targetId}-${Date.now()}`,
        popi_id: targetId,
        version_number: (versions[targetId]?.length || 0) + 1,
        changed_by: currentUser
          ? currentUser.displayName || "Servidor Municipal"
          : "Servidor Municipal",
        change_type: "manual",
        status_at_change: "rascunho",
        changed_fields: ["inputs"],
        snapshot: {
          popi: popiObj,
          input: formInputs,
          document: documents[targetId] ?? emptyPopiDocument(),
          classification: classifications[targetId] || null,
        },
        note: isNew
          ? "Criação do rascunho de mapeamento."
          : "Alteração manual dos dados das 16 perguntas.",
        created_at: new Date().toISOString(),
      };

      setVersions((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), newVersion],
      }));

      if (currentUser) {
        await savePOPIToFirestore(popiObj);
        await savePOPIInputToFirestore(targetId, formInputs);
        await savePOPIVersionToFirestore(targetId, newVersion);
      }

      loadedDetailsRef.current.add(targetId);
      return targetId;
    },
    [
      userProfile,
      secretarias,
      popis,
      versions,
      documents,
      classifications,
      currentUser,
    ]
  );

  const handleUpdateStatus = useCallback(
    async (id: string, status: POPI["status"]) => {
      if (status === "aprovado" && !canApprovePopi(userProfile)) {
        setCloudError("Somente administradores podem aprovar POPIs.");
        return;
      }

      let targetPopiObj: POPI | null = null;
      const matchedPopi = popis.find((p) => p.id === id);

      setPopis((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            targetPopiObj = {
              ...p,
              status,
              approved_at:
                status === "aprovado"
                  ? new Date().toISOString()
                  : status === "em_revisao"
                    ? null
                    : p.approved_at,
              updated_at: new Date().toISOString(),
            };
            return targetPopiObj;
          }
          return p;
        })
      );

      if (matchedPopi && targetPopiObj) {
        const newVer: POPIVersion = {
          id: `ver-${id}-status-${Date.now()}`,
          popi_id: id,
          version_number: (versions[id]?.length || 0) + 1,
          changed_by: isAdmin
            ? currentUser?.displayName || "Gestor de Processos"
            : currentUser?.displayName || "Servidor Municipal",
          change_type: "manual",
          status_at_change: status,
          changed_fields: ["status"],
          snapshot: {
            popi: targetPopiObj,
            input: inputs[id] ?? EMPTY_POPI_INPUT,
            // Sem documento gerado ainda, Firestore rejeita `undefined` — usar vazio.
            document: documents[id] ?? emptyPopiDocument(),
            classification: classifications[id] || null,
          },
          note: `Documentação alterada para status de ${status.toUpperCase()}.`,
          created_at: new Date().toISOString(),
        };
        setVersions((prev) => ({
          ...prev,
          [id]: [...(prev[id] || []), newVer],
        }));

        if (currentUser) {
          await savePOPIToFirestore(targetPopiObj);
          await savePOPIVersionToFirestore(id, newVer);
        }
      }
    },
    [
      userProfile,
      popis,
      versions,
      isAdmin,
      currentUser,
      inputs,
      documents,
      classifications,
    ]
  );

  const handleGeneratePOPIWithIA = useCallback(
    async (id: string) => {
      const popiObj = popis.find((p) => p.id === id);
      const popiInput = inputs[id];
      if (!popiObj || !popiInput) return;

      const data = await generatePopiDocumentDeduped({
        popi: popiObj,
        inputs: popiInput,
        customPrompt: customPrompts["generate-popi"],
      });

      const docObj: POPIDocument = buildDocumentFromGeneration(data.final_markdown);
      setDocuments((prev) => ({ ...prev, [id]: docObj }));

      const updatedPopi = {
        ...popiObj,
        status: "gerado" as const,
        updated_at: new Date().toISOString(),
      };
      setPopis((prev) => prev.map((p) => (p.id === id ? updatedPopi : p)));

      const newVersion: POPIVersion = {
        id: `ver-${id}-gen-${Date.now()}`,
        popi_id: id,
        version_number: (versions[id]?.length || 0) + 1,
        changed_by: "Serviço IA",
        change_type: "ai",
        status_at_change: "gerado",
        changed_fields: ["document"],
        snapshot: {
          popi: updatedPopi,
          input: popiInput,
          document: docObj,
          classification: classifications[id] || null,
        },
        note: "Geração e indexação completa conduzida pelo robô de IA.",
        created_at: new Date().toISOString(),
      };

      setVersions((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), newVersion],
      }));

      if (currentUser) {
        await savePOPIToFirestore(updatedPopi);
        await savePOPIDocumentToFirestore(id, docObj);
        await savePOPIVersionToFirestore(id, newVersion);
      }
    },
    [popis, inputs, customPrompts, versions, classifications, currentUser]
  );

  const handleRunQAInspection = useCallback(
    async (id: string): Promise<QaPopiResponse | undefined> => {
      const documentObj = documents[id];
      const inputObj = inputs[id];
      if (!documentObj) return undefined;

      return runPopiQa({
        inputs: inputObj,
        documentMarkdown: documentObj.final_markdown,
        customPrompt: customPrompts["qa-popi"],
      });
    },
    [documents, inputs, customPrompts]
  );

  const handleSaveManualEdit = useCallback(
    async (
      id: string,
      popMarkdown: string,
      reportMarkdown: string,
      flowchartMermaid?: string,
      flowchartTobeFlow?: string,
      flowchartTobeSystem?: string
    ) => {
      const existingDoc = documents[id];
      const updatedDoc: POPIDocument = {
        ...existingDoc,
        pop_markdown: popMarkdown,
        intelligent_report_markdown: reportMarkdown,
        flowchart_mermaid:
          flowchartMermaid !== undefined
            ? flowchartMermaid
            : existingDoc?.flowchart_mermaid || "",
        flowchart_tobe_flow_mermaid:
          flowchartTobeFlow !== undefined
            ? flowchartTobeFlow
            : existingDoc?.flowchart_tobe_flow_mermaid || "",
        flowchart_tobe_system_mermaid:
          flowchartTobeSystem !== undefined
            ? flowchartTobeSystem
            : existingDoc?.flowchart_tobe_system_mermaid || "",
        final_markdown: `${popMarkdown}\n\n---\n\n${reportMarkdown}`,
        last_manual_edit_at: new Date().toISOString(),
      };

      setDocuments((prev) => ({ ...prev, [id]: updatedDoc }));

      const matchedPopi = popis.find((p) => p.id === id);
      if (matchedPopi) {
        const snapPopi = {
          ...matchedPopi,
          status: "em_edicao" as const,
          updated_at: new Date().toISOString(),
        };
        setPopis((prev) => prev.map((p) => (p.id === id ? snapPopi : p)));

        const newVer: POPIVersion = {
          id: `ver-${id}-manual-${Date.now()}`,
          popi_id: id,
          version_number: (versions[id]?.length || 0) + 1,
          changed_by: "Servidor Municipal",
          change_type: "manual",
          status_at_change: "em_edicao",
          changed_fields: ["document"],
          snapshot: {
            popi: snapPopi,
            input: inputs[id] ?? EMPTY_POPI_INPUT,
            document: updatedDoc,
            classification: classifications[id] || null,
          },
          note: "Edição manual de trechos no editor técnico corporativo.",
          created_at: new Date().toISOString(),
        };

        setVersions((prev) => ({
          ...prev,
          [id]: [...(prev[id] || []), newVer],
        }));

        if (currentUser) {
          await savePOPIToFirestore(snapPopi);
          await savePOPIDocumentToFirestore(id, updatedDoc);
          await savePOPIVersionToFirestore(id, newVer);
        }
      }
    },
    [documents, popis, versions, inputs, classifications, currentUser]
  );

  const handleRestoreVersion = useCallback(
    async (id: string, versionId: string) => {
      const matchedVersions = versions[id] || [];
      const targetVer = matchedVersions.find((v) => v.id === versionId);
      if (!targetVer) return;

      const snap = targetVer.snapshot;

      setPopis((prev) => prev.map((p) => (p.id === id ? snap.popi : p)));
      setInputs((prev) => ({ ...prev, [id]: snap.input }));
      setDocuments((prev) => ({ ...prev, [id]: snap.document }));
      if (snap.classification) {
        setClassifications((prev) => ({ ...prev, [id]: snap.classification! }));
      }

      const newVer: POPIVersion = {
        id: `ver-${id}-restore-${Date.now()}`,
        popi_id: id,
        version_number: matchedVersions.length + 1,
        changed_by: "Sistema de Restauração",
        change_type: "restore",
        status_at_change: snap.popi.status,
        changed_fields: ["all"],
        snapshot: snap,
        note: `Versão restaurada com sucesso de volta para o Snapshot da Versão #${targetVer.version_number}.`,
        created_at: new Date().toISOString(),
      };

      setVersions((prev) => ({
        ...prev,
        [id]: [...matchedVersions, newVer],
      }));

      if (currentUser) {
        await savePOPIToFirestore(snap.popi);
        await savePOPIInputToFirestore(id, snap.input);
        await savePOPIDocumentToFirestore(id, snap.document);
        if (snap.classification) {
          await savePOPIClassificationToFirestore(id, snap.classification);
        }
        await savePOPIVersionToFirestore(id, newVer);
      }

      alert(
        `Snapshot da Versão #${targetVer.version_number} restaurado na área corporativa de trabalho.`
      );
    },
    [versions, currentUser]
  );

  const handleDeletePopi = useCallback(
    async (id: string) => {
      const matched = popis.find((p) => p.id === id);
      if (!matched) return;

      setPopis((prev) => prev.filter((p) => p.id !== id));
      setInputs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDocuments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setClassifications((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setVersions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      loadedDetailsRef.current.delete(id);

      if (currentUser) {
        await deletePOPIFromFirestore(id);
      }
    },
    [popis, currentUser]
  );

  const handleSuggestClassification = useCallback(
    async (id: string) => {
      const matchedInputs = inputs[id];
      if (!matchedInputs) return;

      const data = await suggestPopiCategories({
        inputs: matchedInputs,
        customPrompt: customPrompts["suggest-categories"],
      });

      const classObj: POPIClassification = {
        id: `class-${id}-${Date.now()}`,
        popi_id: id,
        routine_category: data.categoria_rotina,
        routine_category_justification: data.justificativa_categoria_rotina,
        improvement_categories: data.categorias_melhoria,
        confidence_level: data.nivel_confianca,
        classification_gaps: data.lacunas_para_classificacao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setClassifications((prev) => ({ ...prev, [id]: classObj }));

      const matchedPopi = popis.find((p) => p.id === id);
      if (matchedPopi) {
        const updatedPopi: POPI = {
          ...matchedPopi,
          routine_category: data.categoria_rotina,
          improvement_categories: data.categorias_melhoria.map((m) => m.category),
          updated_at: new Date().toISOString(),
        };
        setPopis((prev) => prev.map((p) => (p.id === id ? updatedPopi : p)));

        if (currentUser) {
          await savePOPIToFirestore(updatedPopi);
          await savePOPIClassificationToFirestore(id, classObj);
        }
      }
    },
    [inputs, customPrompts, popis, currentUser]
  );

  const handleSaveClassification = useCallback(
    async (id: string, category: string, improvements: string[]) => {
      const matchedPopi = popis.find((p) => p.id === id);
      if (matchedPopi) {
        const updatedPopi: POPI = {
          ...matchedPopi,
          routine_category: category,
          improvement_categories: improvements,
          updated_at: new Date().toISOString(),
        };
        setPopis((prev) => prev.map((p) => (p.id === id ? updatedPopi : p)));

        if (currentUser) {
          await savePOPIToFirestore(updatedPopi);
        }
      }
    },
    [popis, currentUser]
  );

  const ensurePopiDetails = useCallback(
    async (id: string, options?: { force?: boolean }) => {
      if (!id) return;
      if (!options?.force && loadedDetailsRef.current.has(id)) return;

      await dedupeAsync(`popi-details:${id}`, async () => {
        setDetailsLoadingId(id);
        try {
          const [inp, docData, cls, vList] = await Promise.all([
            loadPOPIInputFromFirestore(id),
            loadPOPIDocumentFromFirestore(id),
            loadPOPIClassificationFromFirestore(id),
            loadPOPIVersionsFromFirestore(id),
          ]);

          if (inp) {
            setInputs((prev) => ({ ...prev, [id]: inp }));
          }
          if (docData) {
            setDocuments((prev) => ({ ...prev, [id]: docData }));
          }
          if (cls) {
            setClassifications((prev) => ({ ...prev, [id]: cls }));
          }
          if (vList && vList.length > 0) {
            setVersions((prev) => ({ ...prev, [id]: vList }));
          }

          loadedDetailsRef.current.add(id);
        } finally {
          setDetailsLoadingId((current) => (current === id ? null : current));
        }
      });
    },
    []
  );

  const ensurePromptsLoaded = useCallback(async () => {
    if (promptsReady || promptsLoadStartedRef.current) return;
    promptsLoadStartedRef.current = true;

    const cached = cacheGet<Record<string, string>>(PROMPTS_CACHE_KEY);
    if (cached) {
      const merged = mergeDefaultPrompts(cached);
      setCustomPrompts(merged);
      cacheSet(PROMPTS_CACHE_KEY, merged, PROMPTS_TTL_MS);
      setPromptsReady(true);
      return;
    }

    await dedupeAsync("load-global-prompts", async () => {
      try {
        const cloudPrompts = await loadGlobalPromptsFromFirestore();
        if (cloudPrompts) {
          const merged = mergeDefaultPrompts(cloudPrompts);
          setCustomPrompts(merged);
          cacheSet(PROMPTS_CACHE_KEY, merged, PROMPTS_TTL_MS);
          if (
            userProfile?.role === "admin" &&
            currentUser &&
            Object.keys(merged).length !== Object.keys(cloudPrompts).length
          ) {
            await saveGlobalPromptsToFirestore(merged, currentUser.uid);
          }
        } else if (userProfile?.role === "admin" && currentUser) {
          const legacyPrompts = await loadLegacyUserPromptsFromFirestore(
            currentUser.uid
          );
          const toSeed = mergeDefaultPrompts(legacyPrompts);
          setCustomPrompts(toSeed);
          await saveGlobalPromptsToFirestore(toSeed, currentUser.uid);
          cacheSet(PROMPTS_CACHE_KEY, toSeed, PROMPTS_TTL_MS);
        } else {
          const defaults = buildDefaultPromptsMap();
          setCustomPrompts(defaults);
          cacheSet(PROMPTS_CACHE_KEY, defaults, PROMPTS_TTL_MS);
        }
      } finally {
        setPromptsReady(true);
      }
    });
  }, [promptsReady, userProfile, currentUser]);

  const runOrphanPurgeOnce = useCallback(async () => {
    if (!isAdminProfile(userProfile)) return;
    if (sessionStorage.getItem(ORPHAN_PURGE_SESSION_KEY) === "1") return;

    await dedupeAsync("purge-orphan-popis", async () => {
      await purgeOrphanPopiTreesFromFirestore();
      sessionStorage.setItem(ORPHAN_PURGE_SESSION_KEY, "1");
    });
  }, [userProfile]);

  const visiblePopis = useMemo(
    () => filterPopisForUser(popis, userProfile),
    [popis, userProfile]
  );

  const formSecretarias = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === "admin") {
      return secretarias.filter((s) => s.active !== false);
    }
    return secretarias.filter((s) => userProfile.secretaria_ids.includes(s.id));
  }, [secretarias, userProfile]);

  const metrics = useMemo(
    () => ({
      total: visiblePopis.length,
      approved: visiblePopis.filter((p) => p.status === "aprovado").length,
      inReview: visiblePopis.filter((p) => p.status === "em_revisao").length,
      rascunho: visiblePopis.filter((p) => p.status === "rascunho").length,
    }),
    [visiblePopis]
  );

  const updateCustomPrompts = useCallback(
    (action: SetStateAction<Record<string, string>>) => {
      setCustomPrompts((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        cacheSet(PROMPTS_CACHE_KEY, next, PROMPTS_TTL_MS);
        return next;
      });
    },
    []
  );

  const value = useMemo<PopiDataContextValue>(
    () => ({
      currentUser,
      userProfile,
      authLoading,
      syncingCloud,
      cloudSynced,
      cloudError,
      profileError,
      isAdmin,
      setCloudError,
      secretarias,
      popis,
      inputs,
      documents,
      classifications,
      versions,
      customPrompts,
      setCustomPrompts: updateCustomPrompts,
      visiblePopis,
      formSecretarias,
      metrics,
      handleAddSecretaria,
      handleUpdateSecretaria,
      handleSavePOPIForm,
      handleUpdateStatus,
      handleGeneratePOPIWithIA,
      handleRunQAInspection,
      handleSaveManualEdit,
      handleRestoreVersion,
      handleDeletePopi,
      handleSuggestClassification,
      handleSaveClassification,
      ensurePopiDetails,
      detailsLoadingId,
      ensurePromptsLoaded,
      promptsReady,
      runOrphanPurgeOnce,
    }),
    [
      currentUser,
      userProfile,
      authLoading,
      syncingCloud,
      cloudSynced,
      cloudError,
      profileError,
      isAdmin,
      secretarias,
      popis,
      inputs,
      documents,
      classifications,
      versions,
      customPrompts,
      updateCustomPrompts,
      visiblePopis,
      formSecretarias,
      metrics,
      handleAddSecretaria,
      handleUpdateSecretaria,
      handleSavePOPIForm,
      handleUpdateStatus,
      handleGeneratePOPIWithIA,
      handleRunQAInspection,
      handleSaveManualEdit,
      handleRestoreVersion,
      handleDeletePopi,
      handleSuggestClassification,
      handleSaveClassification,
      ensurePopiDetails,
      detailsLoadingId,
      ensurePromptsLoaded,
      promptsReady,
      runOrphanPurgeOnce,
    ]
  );

  return (
    <PopiDataContext.Provider value={value}>{children}</PopiDataContext.Provider>
  );
}

export function usePopiData(): PopiDataContextValue {
  const ctx = useContext(PopiDataContext);
  if (!ctx) {
    throw new Error("usePopiData deve ser usado dentro de <PopiDataProvider>.");
  }
  return ctx;
}
