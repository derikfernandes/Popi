import { db } from './firebase';
import { 
  collection, collectionGroup, doc, getDocs, setDoc, deleteDoc, getDoc, writeBatch,
  query, where, updateDoc
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Secretaria, POPI, POPIInput, POPIDocument, POPIClassification, POPIVersion, UserProfile } from './types';
import { handleFirestoreError, OperationType } from './firebaseErrors';
import { DEFAULT_PROMPTS } from './constants/defaultPrompts';

const PROMPT_METADATA_KEYS = new Set(['updated_at', 'updated_by']);

export function buildDefaultPromptsMap(): Record<string, string> {
  const initial: Record<string, string> = {};
  DEFAULT_PROMPTS.forEach((p) => {
    initial[p.id] = p.defaultTemplate;
  });
  return initial;
}

const POPI_SUBCOLLECTIONS = ['inputs', 'documents', 'classifications', 'versions'] as const;

/** Apaga todos os docs de uma subcoleção (Firestore não remove subcoleções ao deletar o pai). */
async function deleteSubcollection(popiId: string, subName: string): Promise<void> {
  const snap = await getDocs(collection(db, 'popis', popiId, subName));
  if (snap.empty) return;

  // Batches max ~500 ops; POPIs costumam ter poucos docs por subcoleção.
  let batch = writeBatch(db);
  let ops = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    ops++;
    if (ops >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
}

// --- SECRETARIAS ---
export async function saveSecretariaToFirestore(sec: Secretaria): Promise<void> {
  const path = `secretarias/${sec.id}`;
  try {
    await setDoc(doc(db, 'secretarias', sec.id), sec);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadSecretariasFromFirestore(): Promise<Secretaria[]> {
  const path = 'secretarias';
  try {
    const querySnapshot = await getDocs(collection(db, 'secretarias'));
    const list: Secretaria[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Secretaria);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// --- POPI MASTER ---
export async function savePOPIToFirestore(popi: POPI): Promise<void> {
  const path = `popis/${popi.id}`;
  try {
    await setDoc(doc(db, 'popis', popi.id), popi);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Admin: lista todos. Usuário: filtra por secretaria_ids (chunks de 10 — limite do `in`).
 */
export async function loadPOPIsFromFirestore(secretariaIds?: string[] | 'all'): Promise<POPI[]> {
  const path = 'popis';
  try {
    if (secretariaIds === 'all' || secretariaIds === undefined) {
      const querySnapshot = await getDocs(collection(db, 'popis'));
      return querySnapshot.docs.map((d) => d.data() as POPI);
    }

    if (secretariaIds.length === 0) return [];

    const list: POPI[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < secretariaIds.length; i += 10) {
      const chunk = secretariaIds.slice(i, i + 10);
      const q = query(collection(db, 'popis'), where('secretaria_id', 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data() as POPI;
        if (!seen.has(data.id)) {
          seen.add(data.id);
          list.push(data);
        }
      });
    }
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function deletePOPIFromFirestore(popiId: string): Promise<void> {
  const path = `popis/${popiId}`;
  try {
    // Remove nested data first — otherwise o console ainda mostra o ID (documento órfão).
    for (const sub of POPI_SUBCOLLECTIONS) {
      await deleteSubcollection(popiId, sub);
    }
    await deleteDoc(doc(db, 'popis', popiId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Remove árvores órfãs: IDs que ainda aparecem no console porque restaram
 * subcoleções após o pai ter sido apagado (comum no delete antigo).
 */
export async function purgeOrphanPopiTreesFromFirestore(): Promise<number> {
  const orphanIds = new Set<string>();

  try {
    for (const sub of POPI_SUBCOLLECTIONS) {
      const snap = await getDocs(collectionGroup(db, sub));
      for (const d of snap.docs) {
        // path: popis/{popiId}/{sub}/{docId}
        const popiRef = d.ref.parent.parent;
        if (!popiRef || popiRef.parent.id !== 'popis') continue;
        orphanIds.add(popiRef.id);
      }
    }

    // Só limpa se o documento mestre realmente não existe.
    let purged = 0;
    for (const popiId of orphanIds) {
      const master = await getDoc(doc(db, 'popis', popiId));
      if (master.exists()) continue;
      for (const sub of POPI_SUBCOLLECTIONS) {
        await deleteSubcollection(popiId, sub);
      }
      purged++;
    }
    if (purged > 0) {
      console.log(`Firestore: removidos ${purged} POPI(s) órfão(s).`);
    }
    return purged;
  } catch (error) {
    // Limpeza é best-effort; não deve acionar o banner vermelho da UI
    console.warn('Firestore orphan purge skipped:', error);
    return 0;
  }
}

// --- POPI INPUTS ---
export async function savePOPIInputToFirestore(popiId: string, input: POPIInput): Promise<void> {
  const path = `popis/${popiId}/inputs/current`;
  try {
    await setDoc(doc(db, 'popis', popiId, 'inputs', 'current'), input);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadPOPIInputFromFirestore(popiId: string): Promise<POPIInput | null> {
  const path = `popis/${popiId}/inputs/current`;
  try {
    const docSnap = await getDoc(doc(db, 'popis', popiId, 'inputs', 'current'));
    return docSnap.exists() ? (docSnap.data() as POPIInput) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// --- POPI DOCUMENTS ---
export async function savePOPIDocumentToFirestore(popiId: string, docData: POPIDocument): Promise<void> {
  const path = `popis/${popiId}/documents/current`;
  try {
    await setDoc(doc(db, 'popis', popiId, 'documents', 'current'), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadPOPIDocumentFromFirestore(popiId: string): Promise<POPIDocument | null> {
  const path = `popis/${popiId}/documents/current`;
  try {
    const docSnap = await getDoc(doc(db, 'popis', popiId, 'documents', 'current'));
    return docSnap.exists() ? (docSnap.data() as POPIDocument) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// --- POPI CLASSIFICATIONS ---
export async function savePOPIClassificationToFirestore(popiId: string, classification: POPIClassification): Promise<void> {
  const path = `popis/${popiId}/classifications/current`;
  try {
    await setDoc(doc(db, 'popis', popiId, 'classifications', 'current'), classification);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadPOPIClassificationFromFirestore(popiId: string): Promise<POPIClassification | null> {
  const path = `popis/${popiId}/classifications/current`;
  try {
    const docSnap = await getDoc(doc(db, 'popis', popiId, 'classifications', 'current'));
    return docSnap.exists() ? (docSnap.data() as POPIClassification) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// --- POPI HISTORICAL VERSIONS ---
export async function savePOPIVersionToFirestore(popiId: string, version: POPIVersion): Promise<void> {
  const path = `popis/${popiId}/versions/${version.id}`;
  try {
    await setDoc(doc(db, 'popis', popiId, 'versions', version.id), version);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadPOPIVersionsFromFirestore(popiId: string): Promise<POPIVersion[]> {
  const path = `popis/${popiId}/versions`;
  try {
    const querySnapshot = await getDocs(collection(db, 'popis', popiId, 'versions'));
    const list: POPIVersion[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as POPIVersion);
    });
    return list.sort((a, b) => a.version_number - b.version_number);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

function sanitizePhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Evita rejeição das rules (limite de tamanho da string)
  return url.length > 4000 ? url.slice(0, 4000) : url;
}

// --- USER PROFILES / ACCESS CONTROL ---
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const now = new Date().toISOString();
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      const nextEmail = user.email || existing.email;
      const nextName = user.displayName || existing.display_name;
      const nextPhoto = sanitizePhotoUrl(user.photoURL ?? existing.photo_url);
      if (
        nextEmail !== existing.email ||
        nextName !== existing.display_name ||
        nextPhoto !== existing.photo_url
      ) {
        try {
          await updateDoc(ref, {
            email: nextEmail,
            display_name: nextName,
            photo_url: nextPhoto,
            updated_at: now,
          });
          return {
            ...existing,
            email: nextEmail,
            display_name: nextName,
            photo_url: nextPhoto,
            updated_at: now,
          };
        } catch {
          // Metadados cosméticos — não bloquear o login
          return existing;
        }
      }
      return existing;
    }

    const bootstrapRef = doc(db, 'settings', 'bootstrap');
    const bootstrapSnap = await getDoc(bootstrapRef);
    const bootstrapData = bootstrapSnap.exists() ? bootstrapSnap.data() : null;
    // Sem bootstrap = primeiro admin; OU bootstrap aponta para este UID (perfil foi apagado)
    const isBootstrapAdmin =
      !bootstrapSnap.exists() || bootstrapData?.initialized_by === user.uid;

    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      display_name: user.displayName || user.email || 'Usuário',
      photo_url: sanitizePhotoUrl(user.photoURL),
      role: isBootstrapAdmin ? 'admin' : 'usuario',
      secretaria_ids: [],
      active: isBootstrapAdmin,
      created_at: now,
      updated_at: now,
    };

    await setDoc(ref, profile);

    if (!bootstrapSnap.exists()) {
      await setDoc(bootstrapRef, {
        initialized_by: user.uid,
        initialized_at: now,
      });
    }

    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function loadAllUserProfiles(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs
      .map((d) => d.data() as UserProfile)
      .sort((a, b) => a.display_name.localeCompare(b.display_name, 'pt-BR'));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function updateUserProfileAccess(
  uid: string,
  patch: Pick<UserProfile, 'role' | 'secretaria_ids' | 'active'>
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      role: patch.role,
      secretaria_ids: patch.secretaria_ids,
      active: patch.active,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// --- GLOBAL PROMPTS (admin define; todos os usuários consomem) ---
export async function saveGlobalPromptsToFirestore(
  prompts: Record<string, string>,
  updatedBy?: string
): Promise<void> {
  const path = 'settings/prompts';
  try {
    await setDoc(doc(db, 'settings', 'prompts'), {
      ...prompts,
      updated_at: new Date().toISOString(),
      ...(updatedBy ? { updated_by: updatedBy } : {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadGlobalPromptsFromFirestore(): Promise<Record<string, string> | null> {
  const path = 'settings/prompts';
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'prompts'));
    if (!docSnap.exists()) return null;

    const prompts: Record<string, string> = {};
    for (const [key, value] of Object.entries(docSnap.data())) {
      if (!PROMPT_METADATA_KEYS.has(key) && typeof value === 'string') {
        prompts[key] = value;
      }
    }
    return Object.keys(prompts).length > 0 ? prompts : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/** Legado: prompts por usuário (migração única para settings/prompts). */
export async function loadLegacyUserPromptsFromFirestore(userId: string): Promise<Record<string, string> | null> {
  const path = `users/${userId}/prompts/current`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId, 'prompts', 'current'));
    return docSnap.exists() ? (docSnap.data() as Record<string, string>) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// --- SEED OR BULK SYNC LOCAL TO FIRESTORE ---
export async function syncLocalToFirestore(
  secretarias: Secretaria[],
  popis: POPI[],
  inputs: Record<string, POPIInput>,
  documents: Record<string, POPIDocument>,
  classifications: Record<string, POPIClassification>,
  versions: Record<string, POPIVersion[]>,
  userId: string
): Promise<void> {
  // We'll write sequentially or in batches to ensure perfect sync
  console.log("Synchronizing localStorage into Firestore database instance...");
  
  for (const sec of secretarias) {
    await saveSecretariaToFirestore(sec);
  }
  for (const popi of popis) {
    // Seed/demo usam "user-system" / "user-current"; a rule exige created_by == auth.uid
    const placeholderOwner =
      !popi.created_by ||
      popi.created_by === "user-current" ||
      popi.created_by === "user-system";
    const updatedPopi = {
      ...popi,
      created_by: placeholderOwner ? userId : popi.created_by,
      updated_by: placeholderOwner || !popi.updated_by ? userId : popi.updated_by,
    };
    await savePOPIToFirestore(updatedPopi);
    
    if (inputs[popi.id]) {
      await savePOPIInputToFirestore(popi.id, inputs[popi.id]);
    }
    if (documents[popi.id]) {
      await savePOPIDocumentToFirestore(popi.id, documents[popi.id]);
    }
    if (classifications[popi.id]) {
      await savePOPIClassificationToFirestore(popi.id, classifications[popi.id]);
    }
    const popiVers = versions[popi.id] || [];
    for (const v of popiVers) {
      await savePOPIVersionToFirestore(popi.id, v);
    }
  }
}
