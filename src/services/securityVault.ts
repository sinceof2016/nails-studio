/**
 * Security Vault Service
 * Autenticación oficial del personal mediante Firebase Auth y perfiles en Firestore users/{uid}.
 * No contiene contraseñas, hashes ni alias en código.
 */

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { SystemUser } from '../types';

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

    // 2. Consulta estricta de rol y permisos en Firestore: users/{uid}
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      const user: SystemUser = {
        id: firebaseUser.uid,
        nombre: data.nombre || data.name || firebaseUser.displayName || 'Personal de Salón',
        email: firebaseUser.email || email,
        rol: data.rol || data.role || 'Caja',
        sucursalAsignada: data.sucursalAsignada || data.branchId || 'santuario-patio-bonito',
        avatar: data.avatar || firebaseUser.photoURL || undefined,
        creadoEn: data.creadoEn || data.createdAt || new Date().toISOString(),
        puedeVerApi: Boolean(data.puedeVerApi || data.rol === 'SuperAdmin'),
        puedeVerUsuarios: Boolean(data.puedeVerUsuarios || data.rol === 'SuperAdmin')
      };
      return { success: true, user };
    }

    // Cerrado por defecto: Si no existe perfil en users/{uid}, cerrar sesión y denegar acceso
    await signOut(auth);
    return {
      success: false,
      error: 'Tu cuenta no tiene permisos asignados. Contacta al SuperAdmin para registrar tu perfil de staff.'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '';
    if (errorMsg.includes('auth/invalid-credential') || errorMsg.includes('auth/user-not-found') || errorMsg.includes('auth/wrong-password')) {
      return {
        success: false,
        error: 'Credenciales inválidas. Verifica tu correo y contraseña.'
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
