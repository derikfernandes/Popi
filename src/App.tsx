import React, { useState, useEffect, useMemo } from "react";
import { Secretaria, POPI, POPIInput, POPIDocument, POPIClassification, POPIVersion, UserProfile } from "./types";
import { 
  DEFAULT_SECRETARIAS, INITIAL_POPIS, INITIAL_INPUTS, INITIAL_DOCUMENTS 
} from "./data";
import SecretariaAdmin from "./components/SecretariaAdmin";
import AdminUsers from "./components/AdminUsers";
import PendingAccess from "./components/PendingAccess";
import PopiList from "./components/PopiList";
import PopiForm from "./components/PopiForm";
import PopiWorkspace from "./components/PopiWorkspace";
import PromptManager from "./components/PromptManager";
import LoginPage from "./components/LoginPage";
import { 
  Building2, Landmark, ListTodo, Plus, FileText, Settings, UserCheck, 
  FileEdit, CheckCircle, Terminal,
  LogOut, Cloud, CloudOff, RefreshCw, Users
} from "lucide-react";
import { auth, logoutUser } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  saveSecretariaToFirestore, loadSecretariasFromFirestore,
  savePOPIToFirestore, loadPOPIsFromFirestore, deletePOPIFromFirestore, purgeOrphanPopiTreesFromFirestore,
  savePOPIInputToFirestore, loadPOPIInputFromFirestore,
  savePOPIDocumentToFirestore, loadPOPIDocumentFromFirestore,
  savePOPIClassificationToFirestore, loadPOPIClassificationFromFirestore,
  savePOPIVersionToFirestore, loadPOPIVersionsFromFirestore,
  saveGlobalPromptsToFirestore, loadGlobalPromptsFromFirestore, loadLegacyUserPromptsFromFirestore,
  buildDefaultPromptsMap,
  syncLocalToFirestore, ensureUserProfile
} from "./firebaseSync";
import { doc, getDocFromServer } from "firebase/firestore";
import { db } from "./firebase";
import { setFirestoreErrorObserver } from "./firebaseErrors";
import {
  isAdminProfile,
  canApprovePopi,
  canManageSecretarias,
  canManageUsers,
  canManagePrompts,
  canAccessSecretaria,
  filterPopisForUser,
  roleLabel,
} from "./permissions";

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<
    "dashboard" | "form" | "workspace" | "secretarias" | "prompts" | "usuarios"
  >("dashboard");

  // Core municipal database states loaded from localStorage
  const [secretarias, setSecretarias] = useState<Secretaria[]>(() => {
    const saved = localStorage.getItem("popi_secretarias");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length >= 15) {
          return parsed;
        }
      } catch (e) {
        // Fallback to default list below
      }
    }
    return DEFAULT_SECRETARIAS;
  });

  const [popis, setPopis] = useState<POPI[]>(() => {
    const saved = localStorage.getItem("popi_list");
    return saved ? JSON.parse(saved) : INITIAL_POPIS;
  });

  const [inputs, setInputs] = useState<Record<string, POPIInput>>(() => {
    const saved = localStorage.getItem("popi_inputs");
    return saved ? JSON.parse(saved) : INITIAL_INPUTS;
  });

  const [documents, setDocuments] = useState<Record<string, POPIDocument>>(() => {
    const saved = localStorage.getItem("popi_documents");
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [classifications, setClassifications] = useState<Record<string, POPIClassification>>(() => {
    const saved = localStorage.getItem("popi_classifications");
    return saved ? JSON.parse(saved) : {};
  });

  const [versions, setVersions] = useState<Record<string, POPIVersion[]>>(() => {
    const saved = localStorage.getItem("popi_versions");
    if (saved) return JSON.parse(saved);
    
    // Seed initial version for the first seed POPI
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
        }
      ];
    });
    return seedVersions;
  });

  // Current Selection
  const [selectedPopiId, setSelectedPopiId] = useState<string | null>(null);

  // Prompts globais definidos pelo admin (todos os usuários consomem)
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("popi_custom_prompts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback abaixo
      }
    }
    return buildDefaultPromptsMap();
  });

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const isAdmin = isAdminProfile(userProfile);

  // Surface Firestore failures to the user without breaking local-first flows.
  useEffect(() => {
    setFirestoreErrorObserver((_info, friendlyMessage) => {
      setCloudError(friendlyMessage);
    });
    return () => setFirestoreErrorObserver(null);
  }, []);

  // Connection validation helper
  useEffect(() => {
    async function verifyConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          console.error("Please check your Firebase configuration or network credentials.");
        }
      }
    }
    verifyConnection();
  }, []);

  // Sync state transitions on Auth Engine
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      if (user) {
        setSyncingCloud(true);
        setCloudError(null);
        setProfileError(null);
        try {
          const profile = await ensureUserProfile(user);
          setUserProfile(profile);

          if (!profile.active) {
            setCloudSynced(false);
            return;
          }

          // Evita flash de POPIs de seed do localStorage antes do filtro por secretaria
          if (profile.role !== "admin") {
            setPopis([]);
          }

          const cloudPrompts = await loadGlobalPromptsFromFirestore();
          if (cloudPrompts) {
            setCustomPrompts(cloudPrompts);
          } else if (profile.role === "admin") {
            const legacyPrompts = await loadLegacyUserPromptsFromFirestore(user.uid);
            const toSeed = legacyPrompts || customPrompts;
            setCustomPrompts(toSeed);
            await saveGlobalPromptsToFirestore(toSeed, user.uid);
          } else {
            setCustomPrompts(buildDefaultPromptsMap());
          }

          const cloudSecs = await loadSecretariasFromFirestore();
          if (cloudSecs && cloudSecs.length > 0) {
            setSecretarias(cloudSecs);
          } else if (profile.role === "admin") {
            for (const sec of secretarias) {
              await saveSecretariaToFirestore(sec);
            }
          }

          const popiScope = profile.role === "admin" ? "all" as const : profile.secretaria_ids;
          const cloudPopis = await loadPOPIsFromFirestore(popiScope);
          if (cloudPopis && cloudPopis.length > 0) {
            setPopis(cloudPopis);
            
            const cloudInputs: Record<string, POPIInput> = {};
            const cloudDocs: Record<string, POPIDocument> = {};
            const cloudClass: Record<string, POPIClassification> = {};
            const cloudVers: Record<string, POPIVersion[]> = {};

            for (const popi of cloudPopis) {
              const inp = await loadPOPIInputFromFirestore(popi.id);
              if (inp) cloudInputs[popi.id] = inp;

              const docData = await loadPOPIDocumentFromFirestore(popi.id);
              if (docData) cloudDocs[popi.id] = docData;

              const cls = await loadPOPIClassificationFromFirestore(popi.id);
              if (cls) cloudClass[popi.id] = cls;

              const vList = await loadPOPIVersionsFromFirestore(popi.id);
              if (vList && vList.length > 0) cloudVers[popi.id] = vList;
            }

            setInputs(cloudInputs);
            setDocuments(cloudDocs);
            setClassifications(cloudClass);
            setVersions(cloudVers);
          } else if (profile.role === "admin") {
            // Seed current local state to cloud first-time (somente admin)
            await syncLocalToFirestore(
              secretarias, popis, inputs, documents, classifications, versions, user.uid
            );
          } else {
            setPopis([]);
          }

          if (profile.role === "admin") {
            await purgeOrphanPopiTreesFromFirestore();
          }

          setCloudSynced(true);
        } catch (err) {
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
          setSyncingCloud(false);
        }
      } else {
        setUserProfile(null);
        setProfileError(null);
        setCloudSynced(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Synchronize localStorage as local fallback mechanism
  // Admin persiste prompts globais; usuários comuns só leem na autenticação
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


  // COUNTER SEQUENTIAL HELPER FUNCTION (Phase 2 constraint)
  const generateNewSequentialNumberAndReportNumber = (secId: string, year: number): { seq: number; reportNo: string } => {
    const matchedSec = secretarias.find((s) => s.id === secId);
    const acronym = matchedSec ? matchedSec.name : "Geral";
    
    // Find highest seq number for this secretariat and year
    const matchedPopis = popis.filter((p) => p.secretaria_id === secId && p.year === year);
    const maxSeq = matchedPopis.reduce((max, curr) => (curr.sequential_number > max ? curr.sequential_number : max), 0);
    const nextSeq = maxSeq + 1;
    
    const formattedNum = String(nextSeq).padStart(3, "0");
    const reportNo = `Secretaria ${acronym} - Nº ${formattedNum} - ${year}`;
    
    return { seq: nextSeq, reportNo };
  };


  // 1. Add Secretariat Handler
  const handleAddSecretaria = async (newSec: Omit<Secretaria, "id" | "created_at" | "updated_at">) => {
    const sec: Secretaria = {
      ...newSec,
      id: `sec-${newSec.acronym.toLowerCase()}-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSecretarias([...secretarias, sec]);
    if (currentUser) {
      await saveSecretariaToFirestore(sec);
    }
  };

  const handleUpdateSecretaria = async (
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

    setSecretarias(secretarias.map((s) => (s.id === id ? updated : s)));

    // Mantém o nome denormalizado nos POPIs alinhado com a secretaria
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
        setPopis(popis.map((p) => byId.get(p.id) || p));
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
  };


  // 2. Save / Modify POPI Input Form
  const handleSavePOPIForm = async (
    formInputs: POPIInput,
    meta: { title: string; secretariaId: string; department: string; division: string }
  ) => {
    if (!canAccessSecretaria(userProfile, meta.secretariaId)) {
      setCloudError("Você não tem acesso a esta secretaria.");
      return;
    }

    const currentYear = new Date().getFullYear();
    const isNew = !selectedPopiId;
    const targetId = selectedPopiId || `popi-gen-${Date.now()}`;
    const matchedSec = secretarias.find((s) => s.id === meta.secretariaId);
    const secName = matchedSec ? matchedSec.name : "Geral";

    let reportNumber = "";
    let seqNo = 1;

    if (isNew) {
      const calc = generateNewSequentialNumberAndReportNumber(meta.secretariaId, currentYear);
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
      status: "rascunho", // Goes back to rascunho if inputs are modified
      routine_category: "",
      improvement_categories: [],
      created_by: currentUser ? currentUser.uid : "user-current",
      updated_by: currentUser ? currentUser.uid : "user-current",
      created_at: isNew ? new Date().toISOString() : (popis.find((p) => p.id === targetId)?.created_at || new Date().toISOString()),
      updated_at: new Date().toISOString(),
      approved_at: null,
      archived_at: null,
    };

    // Update state registers
    setInputs({ ...inputs, [targetId]: formInputs });
    
    const updatedPopis = isNew ? [...popis, popiObj] : popis.map((p) => (p.id === targetId ? popiObj : p));
    setPopis(updatedPopis);

    // Create a historical version
    const newVersion: POPIVersion = {
      id: `ver-${targetId}-${Date.now()}`,
      popi_id: targetId,
      version_number: (versions[targetId]?.length || 0) + 1,
      changed_by: currentUser ? (currentUser.displayName || "Servidor Municipal") : "Servidor Municipal",
      change_type: "manual",
      status_at_change: "rascunho",
      changed_fields: ["inputs"],
      snapshot: {
        popi: popiObj,
        input: formInputs,
        document: documents[targetId] || {
          pop_markdown: "",
          intelligent_report_markdown: "",
          flowchart_mermaid: "",
          final_markdown: "",
          last_generated_at: null,
          last_manual_edit_at: null,
        },
        classification: classifications[targetId] || null,
      },
      note: isNew ? "Criação do rascunho de mapeamento." : "Alteração manual dos dados das 16 perguntas.",
      created_at: new Date().toISOString(),
    };

    setVersions({
      ...versions,
      [targetId]: [...(versions[targetId] || []), newVersion],
    });

    if (currentUser) {
      await savePOPIToFirestore(popiObj);
      await savePOPIInputToFirestore(targetId, formInputs);
      await savePOPIVersionToFirestore(targetId, newVersion);
    }

    setSelectedPopiId(targetId);
    setCurrentView("workspace");
  };


  // 3. Status workflow operations
  const handleUpdateStatus = async (id: string, status: POPI["status"]) => {
    if (status === "aprovado" && !canApprovePopi(userProfile)) {
      setCloudError("Somente administradores podem aprovar POPIs.");
      return;
    }

    let targetPopiObj: POPI | null = null;
    const updatedPopis = popis.map((p) => {
      if (p.id === id) {
        targetPopiObj = {
          ...p,
          status,
          approved_at: status === "aprovado" ? new Date().toISOString() : p.approved_at,
          updated_at: new Date().toISOString()
        };
        return targetPopiObj;
      }
      return p;
    });
    setPopis(updatedPopis);

    // Auto record a version for state transitions
    const matchedPopi = popis.find((p) => p.id === id);
    if (matchedPopi && targetPopiObj) {
      const newVer: POPIVersion = {
        id: `ver-${id}-status-${Date.now()}`,
        popi_id: id,
        version_number: (versions[id]?.length || 0) + 1,
        changed_by: isAdmin
          ? (currentUser?.displayName || "Gestor de Processos")
          : (currentUser?.displayName || "Servidor Municipal"),
        change_type: "manual",
        status_at_change: status,
        changed_fields: ["status"],
        snapshot: {
          popi: targetPopiObj,
          input: inputs[id],
          document: documents[id],
          classification: classifications[id] || null,
        },
        note: `Documentação alterada para status de ${status.toUpperCase()}.`,
        created_at: new Date().toISOString(),
      };
      setVersions({
        ...versions,
        [id]: [...(versions[id] || []), newVer],
      });

      if (currentUser) {
        await savePOPIToFirestore(targetPopiObj);
        await savePOPIVersionToFirestore(id, newVer);
      }
    }
  };


  // 4. Trigger Gemini Complete Generation API
  const handleGeneratePOPIWithIA = async (id: string) => {
    const popiObj = popis.find((p) => p.id === id);
    const popiInput = inputs[id];
    if (!popiObj || !popiInput) return;

    const res = await fetch("/api/generate-popi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        popi: popiObj, 
        inputs: popiInput,
        customPrompt: customPrompts["generate-popi"]
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro de servidor");
    }

    const data = await res.json();
    const rawMarkdown: string = data.final_markdown;

    // Slice up parts for tabs display:
    let popMd = "";
    let reportMd = "";
    let mermaidCode = "";

    const popiIndex = rawMarkdown.indexOf("# PARTE 1");
    const reportIndex = rawMarkdown.indexOf("# PARTE 2");
    const gapIndex = rawMarkdown.indexOf("# LACUNAS");

    if (popiIndex !== -1 && reportIndex !== -1) {
      popMd = rawMarkdown.slice(popiIndex, reportIndex).trim();
      reportMd = rawMarkdown.slice(reportIndex, gapIndex !== -1 ? gapIndex : rawMarkdown.length).trim();
    } else {
      popMd = rawMarkdown;
      reportMd = "Diagnóstico gerado em harmonia com o documento completo.";
    }

    // Attempt to extract Mermaid flowchart with a regex
    const mermaidMatch = rawMarkdown.match(/```mermaid([\s\S]*?)```/);
    if (mermaidMatch && mermaidMatch[1]) {
      mermaidCode = mermaidMatch[1].trim();
    } else {
      // Fallback
      mermaidCode = `flowchart TD\n    A[Início] --> B[Processamento]\n    B --> C[Fim]`;
    }

    const docObj: POPIDocument = {
      pop_markdown: popMd,
      intelligent_report_markdown: reportMd,
      flowchart_mermaid: mermaidCode,
      final_markdown: rawMarkdown,
      last_generated_at: new Date().toISOString(),
      last_manual_edit_at: null,
    };

    setDocuments({ ...documents, [id]: docObj });
    
    // Auto Transition status to "gerado"
    const updatedPopi = { ...popiObj, status: "gerado" as const, updated_at: new Date().toISOString() };
    setPopis(popis.map((p) => (p.id === id ? updatedPopi : p)));

    // Record dynamic version snapshot
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

    setVersions({
      ...versions,
      [id]: [...(versions[id] || []), newVersion],
    });

    if (currentUser) {
      await savePOPIToFirestore(updatedPopi);
      await savePOPIDocumentToFirestore(id, docObj);
      await savePOPIVersionToFirestore(id, newVersion);
    }
  };


  // 5. Trigger Adverse QA inspection
  const handleRunQAInspection = async (id: string): Promise<any> => {
    const documentObj = documents[id];
    const inputObj = inputs[id];
    if (!documentObj) return;

    const res = await fetch("/api/qa-popi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: inputObj,
        documentMarkdown: documentObj.final_markdown,
        customPrompt: customPrompts["qa-popi"],
      }),
    });

    if (!res.ok) throw new Error("Erro ao chamar auditoria.");
    return await res.json();
  };


  // 6. Manual saving from Workspace Markdown Textarea Code Editor
  const handleSaveManualEdit = async (id: string, popMarkdown: string, reportMarkdown: string, flowchartMermaid?: string) => {
    const existingDoc = documents[id];
    const updatedDoc: POPIDocument = {
      ...existingDoc,
      pop_markdown: popMarkdown,
      intelligent_report_markdown: reportMarkdown,
      flowchart_mermaid: flowchartMermaid !== undefined ? flowchartMermaid : (existingDoc?.flowchart_mermaid || ""),
      final_markdown: `${popMarkdown}\n\n---\n\n${reportMarkdown}`,
      last_manual_edit_at: new Date().toISOString(),
    };

    setDocuments({ ...documents, [id]: updatedDoc });

    // Transition status to "em_edicao"
    const matchedPopi = popis.find((p) => p.id === id);
    if (matchedPopi) {
      const snapPopi = { ...matchedPopi, status: "em_edicao" as const, updated_at: new Date().toISOString() };
      setPopis(popis.map((p) => (p.id === id ? snapPopi : p)));

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
          input: inputs[id],
          document: updatedDoc,
          classification: classifications[id] || null,
        },
        note: "Edição manual de trechos no editor técnico corporativo.",
        created_at: new Date().toISOString(),
      };

      setVersions({
        ...versions,
        [id]: [...(versions[id] || []), newVer],
      });

      if (currentUser) {
        await savePOPIToFirestore(snapPopi);
        await savePOPIDocumentToFirestore(id, updatedDoc);
        await savePOPIVersionToFirestore(id, newVer);
      }
    }
  };


  // 7. RESTORE VERSION RESTORE SNAPSHOTS (Super powerful robust architecture requirement!)
  const handleRestoreVersion = async (id: string, versionId: string) => {
    const matchedVersions = versions[id] || [];
    const targetVer = matchedVersions.find((v) => v.id === versionId);
    if (!targetVer) return;

    const snap = targetVer.snapshot;

    // Restore all registers!
    setPopis(popis.map((p) => (p.id === id ? snap.popi : p)));
    setInputs({ ...inputs, [id]: snap.input });
    setDocuments({ ...documents, [id]: snap.document });
    if (snap.classification) {
      setClassifications({ ...classifications, [id]: snap.classification });
    }

    // Append new history log of restore action
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

    setVersions({
      ...versions,
      [id]: [...matchedVersions, newVer],
    });

    if (currentUser) {
      await savePOPIToFirestore(snap.popi);
      await savePOPIInputToFirestore(id, snap.input);
      await savePOPIDocumentToFirestore(id, snap.document);
      if (snap.classification) {
        await savePOPIClassificationToFirestore(id, snap.classification);
      }
      await savePOPIVersionToFirestore(id, newVer);
    }

    alert(`Snapshot da Versão #${targetVer.version_number} restaurado na área corporativa de trabalho.`);
  };


  // 7b. Delete POPI Mapeado and clean related registers
  const handleDeletePopi = async (id: string) => {
    const matched = popis.find((p) => p.id === id);
    if (!matched) return;

    // 1. Remove from popis
    setPopis(popis.filter((p) => p.id !== id));

    // 2. Clean inputs, documents, classifications, and versions registers
    const updatedInputs = { ...inputs };
    delete updatedInputs[id];
    setInputs(updatedInputs);

    const updatedDocs = { ...documents };
    delete updatedDocs[id];
    setDocuments(updatedDocs);

    const updatedClassifications = { ...classifications };
    delete updatedClassifications[id];
    setClassifications(updatedClassifications);

    const updatedVersions = { ...versions };
    delete updatedVersions[id];
    setVersions(updatedVersions);

    if (currentUser) {
      await deletePOPIFromFirestore(id);
    }

    if (selectedPopiId === id) {
      setSelectedPopiId(null);
      setCurrentView("dashboard");
    }
  };


  // 8. Classification API trigger
  const handleSuggestClassification = async (id: string) => {
    const matchedInputs = inputs[id];
    if (!matchedInputs) return;

    const res = await fetch("/api/suggest-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        inputs: matchedInputs,
        customPrompt: customPrompts["suggest-categories"]
      }),
    });

    if (!res.ok) throw new Error("Erro na solicitação");
    const data = await res.json();

    const classObj: POPIClassification = {
      id: `class-${id}-${Date.now()}`,
      popi_id: id,
      routine_category: data.categoria_rotina,
      routine_category_justification: data.justificativa_categoria_rotina,
      improvement_categories: data.categorias_melhoria,
      confidence_level: data.nivel_confianca as any,
      classification_gaps: data.lacunas_para_classificacao,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setClassifications({ ...classifications, [id]: classObj });

    // Cautious auto fill on the POPI list
    const matchedPopi = popis.find((p) => p.id === id);
    if (matchedPopi) {
      const updatedPopi: POPI = {
        ...matchedPopi,
        routine_category: data.categoria_rotina,
        improvement_categories: data.categorias_melhoria.map((m: any) => m.category),
        updated_at: new Date().toISOString()
      };
      setPopis(popis.map((p) => (p.id === id ? updatedPopi : p)));

      if (currentUser) {
        await savePOPIToFirestore(updatedPopi);
        await savePOPIClassificationToFirestore(id, classObj);
      }
    }
  };

  const handleSaveClassification = async (id: string, category: string, improvements: string[]) => {
    const matchedPopi = popis.find((p) => p.id === id);
    if (matchedPopi) {
      const updatedPopi: POPI = {
        ...matchedPopi,
        routine_category: category,
        improvement_categories: improvements,
        updated_at: new Date().toISOString()
      };
      setPopis(
        popis.map((p) =>
          p.id === id ? updatedPopi : p
        )
      );

      if (currentUser) {
        await savePOPIToFirestore(updatedPopi);
      }
    }
  };


  // 9. Run AI Prompt Commander against active Document Markdown
  const handleRunAICommand = async (id: string, commandText: string) => {
    const docObj = documents[id];
    if (!docObj) return;

    const res = await fetch("/api/edit-popi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentMarkdown: docObj.final_markdown,
        inputs: inputs[id],
        requestText: commandText,
        customPrompt: customPrompts["edit-popi"],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro de servidor");
    }

    const data = await res.json();
    const revisedDoc: string = data.documento_revisado;

    // Slice up parts for tabs display:
    let popMd = "";
    let reportMd = "";
    const popiIndex = revisedDoc.indexOf("# PARTE 1");
    const reportIndex = revisedDoc.indexOf("# PARTE 2");
    
    if (popiIndex !== -1 && reportIndex !== -1) {
      popMd = revisedDoc.slice(popiIndex, reportIndex).trim();
      reportMd = revisedDoc.slice(reportIndex).trim();
    } else {
      popMd = revisedDoc;
      reportMd = docObj.intelligent_report_markdown;
    }

    const updatedDoc: POPIDocument = {
      ...docObj,
      pop_markdown: popMd,
      intelligent_report_markdown: reportMd,
      final_markdown: revisedDoc,
      last_generated_at: new Date().toISOString(),
    };

    setDocuments({ ...documents, [id]: updatedDoc });

    // Transition status to "em_edicao"
    const matchedPopi = popis.find((p) => p.id === id);
    if (matchedPopi) {
      const snapPopi = { ...matchedPopi, status: "em_edicao" as const, updated_at: new Date().toISOString() };
      setPopis(popis.map((p) => (p.id === id ? snapPopi : p)));

      const newVer: POPIVersion = {
        id: `ver-${id}-ai-cmd-${Date.now()}`,
        popi_id: id,
        version_number: (versions[id]?.length || 0) + 1,
        changed_by: "Serviço IA",
        change_type: "ai",
        status_at_change: "em_edicao",
        changed_fields: ["document"],
        snapshot: {
          popi: snapPopi,
          input: inputs[id],
          document: updatedDoc,
          classification: classifications[id] || null,
        },
        note: `Edição por IA: "${commandText}"`,
        created_at: new Date().toISOString(),
      };

      setVersions({
        ...versions,
        [id]: [...(versions[id] || []), newVer],
      });

      if (currentUser) {
        await savePOPIToFirestore(snapPopi);
        await savePOPIDocumentToFirestore(id, updatedDoc);
        await savePOPIVersionToFirestore(id, newVer);
      }
    }
  };


  const visiblePopis = useMemo(
    () => filterPopisForUser(popis, userProfile),
    [popis, userProfile]
  );

  const formSecretarias = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === "admin") return secretarias.filter((s) => s.active !== false);
    return secretarias.filter((s) => userProfile.secretaria_ids.includes(s.id));
  }, [secretarias, userProfile]);

  // Metrics panel aggregators
  const totalPopisCount = visiblePopis.length;
  const approvedCount = visiblePopis.filter((p) => p.status === "aprovado").length;
  const inReviewCount = visiblePopis.filter((p) => p.status === "em_revisao").length;
  const rascunhoCount = visiblePopis.filter((p) => p.status === "rascunho").length;

  // Authentication gate: everyone must log in before accessing the app
  if (authLoading || (currentUser && !userProfile && syncingCloud)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600 font-sans">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-bold uppercase tracking-wider">
          {authLoading ? "Carregando autenticação..." : "Carregando perfil..."}
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (userProfile && !userProfile.active) {
    return <PendingAccess profile={userProfile} />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-600 font-sans px-6">
        {profileError ? (
          <>
            <div className="max-w-lg w-full bg-white border border-red-100 rounded-2xl p-6 shadow-sm text-center space-y-3">
              <h2 className="text-lg font-semibold text-slate-800">Não foi possível liberar o acesso</h2>
              <p className="text-sm text-red-700 leading-relaxed">{profileError}</p>
              <p className="text-xs text-slate-500">
                Conta: <span className="font-medium text-slate-700">{currentUser.email}</span>
              </p>
              <button
                onClick={logoutUser}
                className="mt-2 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair e tentar de novo
              </button>
            </div>
          </>
        ) : (
          <>
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-sm font-bold uppercase tracking-wider">Carregando perfil...</span>
          </>
        )}
      </div>
    );
  }

  if (currentView === "prompts" && canManagePrompts(userProfile)) {
    return (
      <PromptManager
        customPrompts={customPrompts}
        setCustomPrompts={setCustomPrompts}
        onBack={() => setCurrentView("dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Professional Municipal Header */}
      <header className="bg-slate-900 text-white h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase">POPI Generator</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
              Prefeitura de São José dos Campos
            </p>
          </div>
        </div>

        {/* User Workspace Profiles & Quick Actions with Google Auth integration */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || "Avatar"} 
                  className="w-5 h-5 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-white max-w-[120px] truncate">{currentUser.displayName || currentUser.email}</span>
                {cloudError ? (
                  <span className="text-[8px] text-amber-400 uppercase font-extrabold flex items-center gap-1">
                    <CloudOff className="w-2.5 h-2.5" /> Salvo localmente (nuvem falhou)
                  </span>
                ) : (
                  <span className="text-[8px] text-emerald-400 uppercase font-extrabold flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5 animate-pulse" /> {syncingCloud ? "Sincronizando..." : "Conectado ao Firebase"}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={logoutUser}
              className="bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1 cursor-pointer font-bold duration-200"
              title="Sair da Sessão"
              id="btn-signout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Perfil:</span>
            <span className="text-white bg-blue-600 px-2 py-0.5 rounded uppercase font-extrabold text-[10px]">
              {roleLabel(userProfile.role)}
            </span>
          </div>
        </div>
      </header>

      {/* Cloud sync warning banner */}
      {cloudError && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-2 text-amber-800 text-xs font-medium">
            <CloudOff className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{cloudError}</span>
          </div>
          <button
            onClick={() => setCloudError(null)}
            className="text-amber-700 hover:text-amber-900 text-xs font-bold shrink-0"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Main Container Layout: Sidebar + Canvas workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar menu navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 p-5 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Mapeamento Corporativo</span>
              
              <button
                onClick={() => {
                  setSelectedPopiId(null);
                  setCurrentView("dashboard");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  currentView === "dashboard"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ListTodo className="w-4 h-4" />
                POPIs Mapeados
              </button>

              {canManageSecretarias(userProfile) && (
                <button
                  onClick={() => {
                    setSelectedPopiId(null);
                    setCurrentView("secretarias");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    currentView === "secretarias"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Secretarias Prefeitura
                </button>
              )}

              {canManageUsers(userProfile) && (
                <button
                  onClick={() => {
                    setSelectedPopiId(null);
                    setCurrentView("usuarios");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    currentView === "usuarios"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Usuários e Acessos
                </button>
              )}

              {canManagePrompts(userProfile) && (
                <button
                  onClick={() => {
                    setSelectedPopiId(null);
                    setCurrentView("prompts");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    currentView === "prompts"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  id="btn-nav-prompts"
                >
                  <Terminal className="w-4 h-4" />
                  Instruções de IA
                </button>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Ações Rápidas</span>
              <button
                onClick={() => {
                  setSelectedPopiId(null);
                  setCurrentView("form");
                }}
                disabled={formSecretarias.length === 0}
                title={formSecretarias.length === 0 ? "Nenhuma secretaria atribuída ao seu usuário" : undefined}
                className="w-full flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Novo Mapeamento
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
            Plataforma POPI v1.2
          </div>
        </aside>

        {/* Main interactive section with custom canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Executive Summary stats cards only shown on dashboard */}
          {currentView === "dashboard" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total POPIs</p>
                  <p className="text-xl font-black text-slate-800">{totalPopisCount}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Aprovados</p>
                  <p className="text-xl font-black text-slate-800">{approvedCount}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Em Revisão</p>
                  <p className="text-xl font-black text-slate-800">{inReviewCount}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Rascunhos</p>
                  <p className="text-xl font-black text-slate-800">{rascunhoCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Core Routes mapping */}
          <div className="max-w-7xl mx-auto">
            {currentView === "dashboard" && (
              <>
                {!isAdmin && userProfile.secretaria_ids.length === 0 && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Seu usuário está ativo, mas ainda não tem secretaria atribuída. Peça a um administrador para liberar o acesso.
                  </div>
                )}
                <PopiList
                  popis={visiblePopis}
                  onSelectPopi={(id) => {
                    setSelectedPopiId(id);
                    setCurrentView("workspace");
                  }}
                  onNewPopi={() => {
                    setSelectedPopiId(null);
                    setCurrentView("form");
                  }}
                  onDeletePopi={handleDeletePopi}
                />
              </>
            )}

            {currentView === "secretarias" && canManageSecretarias(userProfile) && (
              <SecretariaAdmin
                secretarias={secretarias}
                onAddSecretaria={handleAddSecretaria}
                onUpdateSecretaria={handleUpdateSecretaria}
              />
            )}

            {currentView === "usuarios" && canManageUsers(userProfile) && (
              <AdminUsers
                secretarias={secretarias}
                currentUid={currentUser.uid}
              />
            )}

            {currentView === "form" && (
              <PopiForm
                initialInputs={selectedPopiId ? inputs[selectedPopiId] : null}
                secretarias={formSecretarias}
                onCancel={() => {
                  if (selectedPopiId) {
                    setCurrentView("workspace");
                  } else {
                    setCurrentView("dashboard");
                  }
                }}
                onSave={handleSavePOPIForm}
                popiId={selectedPopiId || undefined}
                activePopi={selectedPopiId ? visiblePopis.find((p) => p.id === selectedPopiId) : null}
                customNormalizePrompt={customPrompts["normalize-inputs"]}
              />
            )}

            {currentView === "workspace" && selectedPopiId && visiblePopis.find((p) => p.id === selectedPopiId) && (
              <PopiWorkspace
                popi={visiblePopis.find((p) => p.id === selectedPopiId)!}
                inputs={inputs[selectedPopiId] || {}}
                document={documents[selectedPopiId] || null}
                classification={classifications[selectedPopiId] || null}
                versions={versions[selectedPopiId] || []}
                isAdmin={canApprovePopi(userProfile)}
                onBack={() => {
                  setSelectedPopiId(null);
                  setCurrentView("dashboard");
                }}
                onUpdateStatus={handleUpdateStatus}
                onGeneratePOPI={handleGeneratePOPIWithIA}
                onRunQA={handleRunQAInspection}
                onRestoreVersion={handleRestoreVersion}
                onSaveManualEdit={handleSaveManualEdit}
                onSuggestClassification={handleSuggestClassification}
                onSaveClassification={handleSaveClassification}
                onRunAICommand={handleRunAICommand}
              />
            )}
          </div>
        </main>
      </div>

    </div>
  );
}
