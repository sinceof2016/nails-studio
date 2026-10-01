/**
 * Session Manager & Auto-Expiration Service
 * Maneja el ciclo de vida de la sesión con caducidad por inactividad y TTL absoluto.
 * NOTA DE SEGURIDAD (S12): La sesión en sessionStorage solo gestiona el estado visual de la UI.
 * La autorización y los permisos reales están blindados y aplicados estrictamente por las
 * reglas del servidor y Firestore Rules en cada operación.
 */

import { SystemUser } from '../types';

export interface UserSession {
  user: SystemUser;
  token: string;
  loginTime: number;        // Timestamp de creación
  lastActivity: number;     // Timestamp de última interacción
  expiresAt: number;        // Timestamp máximo de expiración
}

export const SESSION_STORAGE_KEY = 'aura_auth_session';

// Duración máxima de inactividad: 15 minutos (900.000 ms)
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
// Duración máxima de sesión absoluta: 8 horas (28.800.000 ms)
export const MAX_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

/**
 * Genera un token aleatorio simple y seguro para la sesión
 */
function generateSessionToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Guarda una nueva sesión activa con sus marcas de tiempo en sessionStorage
 */
export function createSession(user: SystemUser): UserSession {
  const now = Date.now();
  const session: UserSession = {
    user,
    token: generateSessionToken(),
    loginTime: now,
    lastActivity: now,
    expiresAt: now + MAX_SESSION_DURATION_MS
  };

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    // Depuración de almacenamiento legado en localStorage
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('aura_current_user');
  } catch (e) {
    console.error('Error guardando la sesión en sessionStorage:', e);
  }

  return session;
}

/**
 * Obtiene la sesión activa validando si ha expirado (por inactividad o tiempo absoluto)
 */
export function getActiveSession(): UserSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as UserSession;
    const now = Date.now();

    // 1. Verificar si superó la expiración absoluta
    if (now > session.expiresAt) {
      clearSession();
      return null;
    }

    // 2. Verificar si superó el tiempo máximo de inactividad
    if (now - session.lastActivity > INACTIVITY_TIMEOUT_MS) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Actualiza la marca de última actividad si la sesión aún es válida
 */
export function touchSession(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return false;

    const session = JSON.parse(raw) as UserSession;
    const now = Date.now();

    if (now > session.expiresAt || (now - session.lastActivity > INACTIVITY_TIMEOUT_MS)) {
      clearSession();
      return false;
    }

    session.lastActivity = now;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

/**
 * Limpia la sesión y remueve datos del almacenamiento
 */
export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('aura_current_user');
  } catch (e) {
    console.error('Error al limpiar la sesión:', e);
  }
}

/**
 * Verifica de forma síncrona si hay un usuario activo no vencido
 */
export function getActiveUser(): SystemUser | null {
  const session = getActiveSession();
  return session ? session.user : null;
}
