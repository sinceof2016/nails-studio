import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const config = firebaseConfig as {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
};

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(config) : getApp();

// Firebase App Check con Fraud Defense / reCAPTCHA Enterprise
// Inicializar después de crear app y ANTES de getFirestore/getAuth
if (isNewApp && typeof window !== 'undefined') {
  try {
    const siteKey = typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim()
      : undefined;

    if (siteKey) {
      // En desarrollo local: self.FIREBASE_APPCHECK_DEBUG_TOKEN = true para depuración
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        if (typeof self !== 'undefined') {
          (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        } else if (typeof window !== 'undefined') {
          (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }
      }
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    } else {
      console.warn('App Check desactivado: falta VITE_RECAPTCHA_SITE_KEY');
    }
  } catch (error) {
    console.warn('Aviso: no se pudo inicializar Firebase App Check:', error);
  }
}

export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Validate initial connection as requested by system guidelines
async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Aviso: el cliente está offline o conectando a Firestore.');
    }
  }
}
testFirebaseConnection();

export default app;
