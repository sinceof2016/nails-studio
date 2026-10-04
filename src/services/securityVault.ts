/**
 * Security Vault Service
 * Autenticación oficial del personal mediante Firebase Auth y perfiles en Firestore users/{uid}.
 * No contiene contraseñas, hashes ni alias en código.
 */

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { SystemUser } from '../types';
import { ADMIN_USER } from '../data/catalogo';

const OWNER_EMAILS = [
  'orjueladavid32@gmail.com',
  ADMIN_USER.email.toLowerCase()
];

/**
 * Resuelve o inicializa el perfil de staff en Firestore / memoria
 */
async function resolveStaffProfile(firebaseUser: FirebaseUser, fallbackEmail: string): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
  const userEmail = (firebaseUser.email || fallbackEmail).trim().toLowerCase();
  const isOwnerAdmin = OWNER_EMAILS.includes(userEmail);

  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      const user: SystemUser = {
        id: firebaseUser.uid,
        nombre: data.nombre || data.name || firebaseUser.displayName || (isOwnerAdmin ? 'Super Administrador' : 'Personal de Salón'),
        email: userEmail,
        rol: (isOwnerAdmin && !data.rol) ? 'SuperAdmin' : (data.rol || data.role || 'Caja'),
        sucursalAsignada: data.sucursalAsignada || data.branchId || 'santuario-patio-bonito',
        avatar: data.avatar || firebaseUser.photoURL || undefined,
        creadoEn: data.creadoEn || data.createdAt || new Date().toISOString(),
        puedeVerApi: Boolean(data.puedeVerApi || data.rol === 'SuperAdmin' || isOwnerAdmin),
        puedeVerUsuarios: Boolean(data.puedeVerUsuarios || data.rol === 'SuperAdmin' || isOwnerAdmin)
      };
      return { success: true, user };
    }

    // Si es el propietario/admin principal pero no tiene documento aún en Firestore, auto-aprovisionar perfil SuperAdmin
    if (isOwnerAdmin) {
      const initialAdmin: SystemUser = {
        id: firebaseUser.uid,
        nombre: firebaseUser.displayName || 'Super Administrador',
        email: userEmail,
        rol: 'SuperAdmin',
        sucursalAsignada: 'santuario-patio-bonito',
        avatar: firebaseUser.photoURL || ADMIN_USER.avatar || undefined,
        creadoEn: new Date().toISOString(),
        puedeVerApi: true,
        puedeVerUsuarios: true
      };

      try {
        await setDoc(userDocRef, initialAdmin);
      } catch (err) {
        console.warn('Perfil SuperAdmin activo en memoria local:', err);
      }

      return { success: true, user: initialAdmin };
    }

    // Si no es admin y no tiene perfil registrado en Firestore
    await signOut(auth);
    return {
      success: false,
      error: 'Tu cuenta de correo no tiene un rol de personal registrado. Solicita al SuperAdmin que cree tu perfil en el panel.'
    };
  } catch (err) {
    // Si falla la consulta por permisos pero es el propietario reconocido
    if (isOwnerAdmin) {
      const fallbackAdmin: SystemUser = {
        id: firebaseUser.uid,
        nombre: firebaseUser.displayName || 'Super Administrador',
        email: userEmail,
        rol: 'SuperAdmin',
        sucursalAsignada: 'santuario-patio-bonito',
        avatar: firebaseUser.photoURL || ADMIN_USER.avatar || undefined,
        creadoEn: new Date().toISOString(),
        puedeVerApi: true,
        puedeVerUsuarios: true
      };
      return { success: true, user: fallbackAdmin };
    }
    return {
      success: false,
      error: 'Error al verificar permisos en la base de datos de usuarios.'
    };
  }
}

/**
 * Autentica mediante Google Sign-In emergente
 */
export async function authenticateWithGoogle(): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;

    if (!firebaseUser) {
      return { success: false, error: 'No se pudo obtener la información de Google.' };
    }

    return await resolveStaffProfile(firebaseUser, firebaseUser.email || '');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '';
    if (errorMsg.includes('auth/popup-closed-by-user') || errorMsg.includes('auth/cancelled-popup-request')) {
      return { success: false, error: 'Inicio de sesión cancelado por el usuario.' };
    }
    if (errorMsg.includes('auth/popup-blocked')) {
      return { success: false, error: 'La ventana emergente de Google fue bloqueada. Permite las ventanas emergentes en tu navegador.' };
    }
    if (errorMsg.includes('auth/unauthorized-domain')) {
      return { success: false, error: 'Este dominio no está autorizado en Firebase Console > Authentication > Settings > Authorized domains.' };
    }
    return {
      success: false,
      error: errorMsg || 'Error al conectar con el servicio de autenticación de Google.'
    };
  }
}

/**
 * Autentica un usuario del personal mediante Firebase Auth y obtiene su perfil desde users/{uid}
 */
export async function authenticateWithVault(
  identifier: string,
  plainPassword: string
): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
  try {
    const email = identifier.trim().toLowerCase();
    if (!email || !plainPassword) {
      return { success: false, error: 'Correo electrónico y contraseña requeridos.' };
    }

    // 1. Autenticación con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, plainPassword);
    const firebaseUser = userCredential.user;

    if (!firebaseUser) {
      return { success: false, error: 'Credenciales inválidas.' };
    }

    return await resolveStaffProfile(firebaseUser, email);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '';
    if (
      errorMsg.includes('auth/invalid-credential') ||
      errorMsg.includes('auth/user-not-found') ||
      errorMsg.includes('auth/wrong-password') ||
      errorMsg.includes('auth/invalid-login-credentials')
    ) {
      return {
        success: false,
        error: 'Credenciales inválidas. Si tu cuenta usa Google, ingresa con el botón "Continuar con Google".'
      };
    }
    if (errorMsg.includes('auth/operation-not-allowed')) {
      return {
        success: false,
        error: 'El método de contraseña no está activo en Firebase. Por favor usa el botón "Continuar con Google".'
      };
    }
    if (errorMsg.includes('auth/invalid-email')) {
      return {
        success: false,
        error: 'El formato del correo electrónico es inválido.'
      };
    }
    if (errorMsg.includes('auth/too-many-requests')) {
      return {
        success: false,
        error: 'Demasiados intentos fallidos. Por favor espera unos minutos antes de intentar de nuevo.'
      };
    }
    return {
      success: false,
      error: 'Error al verificar credenciales con el servidor de autenticación. Te sugerimos ingresar con Google.'
    };
  }
}

export async function logoutVault(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Error cerrando sesión en Firebase Auth:', e);
  }
}

