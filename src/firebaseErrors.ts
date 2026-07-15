import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export type FirestoreErrorObserver = (info: FirestoreErrorInfo, friendlyMessage: string) => void;

let errorObserver: FirestoreErrorObserver | null = null;

// Allows the UI layer to be notified about Firestore failures without coupling.
export function setFirestoreErrorObserver(fn: FirestoreErrorObserver | null) {
  errorObserver = fn;
}

function toFriendlyMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('permission') || lower.includes('insufficient')) {
    return 'Permissão negada pelo Firestore. Seus dados foram salvos localmente, mas não na nuvem. É necessário publicar as regras de segurança (firestore.rules) no projeto Firebase para habilitar a sincronização.';
  }
  if (lower.includes('offline') || lower.includes('unavailable') || lower.includes('network')) {
    return 'Sem conexão com o Firestore no momento. Seus dados foram salvos localmente e serão enviados à nuvem quando a conexão voltar.';
  }
  return 'Falha ao sincronizar com a nuvem. Seus dados foram salvos apenas localmente.';
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));

  // Notify the UI instead of throwing, so local-first flows are not interrupted.
  if (errorObserver) {
    errorObserver(errInfo, toFriendlyMessage(rawMessage));
  }
}
