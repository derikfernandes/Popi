import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with database ID correctly mapped from the config (CRITICAL line)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Authentication Provider Setup
export const googleProvider = new GoogleAuthProvider();

// Google Sign In Helper
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro no Login com Google:", error);
    throw error;
  }
}

// Sign Out Helper
export async function logoutUser() {
  await signOut(auth);
}

// Email & Password Sign Up Helper
export async function signUpWithEmail(email: string, pass: string, name: string) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(credential.user, { displayName: name });
    return credential.user;
  } catch (error) {
    console.error("Erro ao registrar email/senha:", error);
    throw error;
  }
}

// Email & Password Sign In Helper
export async function signInWithEmail(email: string, pass: string) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    return credential.user;
  } catch (error) {
    console.error("Erro no Login com email/senha:", error);
    throw error;
  }
}
