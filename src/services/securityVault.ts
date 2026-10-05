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
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { SystemUser } from '../types';

/**
 * Resuelve el perfil de staff en Firestore (colección users/{uid})
 */
async function resolveStaffProfile(firebaseUser: FirebaseUser, fallbackEmail: string): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
  const userEmail = (firebaseUser.email || fallbackEmail).trim().toLowerCase();

  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      const user: SystemUser = {
        id: firebaseUser.uid,
        nombre: data.nombre || data.name || firebaseUser.displayName || 'Personal de Salón',
        email: userEmail,
        rol: data.rol || data.role || 'Caja',
        sucursalAsignada: data.sucursalAsignada || data.branchId || 'santuario-patio-bonito',
        avatar: data.avatar || firebaseUser.photoURL || undefined,
        creadoEn: data.creadoEn || data.createdAt || new Date().toISOString(),
        puedeVerApi: Boolean(data.puedeVerApi || data.rol === 'SuperAdmin'),
        puedeVerUsuarios: Boolean(data.puedeVerUsuarios || data.rol === 'SuperAdmin')
      };
      return { success: true, user };
    }

    // Si no tiene perfil registrado en Firestore users/{uid}
    await signOut(auth);
    return {
      success: false,
      error: 'Tu cuenta de correo no tiene un rol de personal registrado en users/{uid}. Solicita al SuperAdmin que registre tu UID en el panel de usuarios.'
    };
  } catch (err: unknown) {
    await signOut(auth);
    const msg = err instanceof Error ? err.message : '';
    return {
      success: false,
      error: msg || 'Error al verificar permisos en la base de datos de usuarios.'
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
        error: 'Credenciales inválidas. Verifica tu correo y contraseña.'
      };
    }
    if (errorMsg.includes('auth/operation-not-allowed')) {
      return {
        success: false,
        error: 'El método de autenticación por correo y contraseña no está activo en Firebase.'
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
      error: 'Error al verificar credenciales con el servidor de autenticación.'
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

