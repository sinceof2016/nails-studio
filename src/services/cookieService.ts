/**
 * Cookie Service & Local Storage Manager
 * Gestión técnica de cookies y almacenamiento conforme a la Política de Tratamiento de Datos.
 */

import { CookiePreferences, CookieInfo } from '../types';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const COOKIE_CONSENT_KEY = 'pelu_cookie_consent';
export const CURRENT_COOKIE_POLICY_VERSION = 'v1.0-2026-BORRADOR';

/**
 * Catálogo técnico real de cookies y elementos de almacenamiento usados en la aplicación.
 * La Pelu SPA NO utiliza cookies de terceros para publicidad, píxeles de rastreo ni venta de datos.
 */
export const COOKIE_CATALOG: CookieInfo[] = [
  // 1. Necesarias / Técnicas
  {
    name: 'pelu_cookie_consent',
    category: 'necessary',
    purpose: 'Almacena tus preferencias de cookies para no volver a solicitarlas en cada navegación.',
    provider: `${BUSINESS_CONFIG.brandName} (Propia)`,
    duration: '12 meses',
    type: 'LocalStorage'
  },
  {
    name: 'pelu_auth_session',
    category: 'necessary',
    purpose: 'Token temporal de sesión y control de inactividad para el acceso administrativo seguro.',
    provider: `${BUSINESS_CONFIG.brandName} (Seguridad)`,
    duration: 'Sesión activa (15 min inactividad)',
    type: 'Session'
  },

  // 2. Preferencias
  {
    name: 'pelu_ultramsg_config',
    category: 'preferences',
    purpose: 'Almacena parámetros de plantillas de WhatsApp transaccional configurados por el personal.',
    provider: `${BUSINESS_CONFIG.brandName} (Local)`,
    duration: '12 meses',
    type: 'LocalStorage'
  },
  {
    name: 'pelu_local_catalog',
    category: 'preferences',
    purpose: 'Caché local de cartas de servicios y manicuristas para agilizar el rendimiento.',
    provider: `${BUSINESS_CONFIG.brandName} (Local)`,
    duration: '30 días',
    type: 'LocalStorage'
  }
];

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookieString = document.cookie;
  const cookies = cookieString.split(';');
  const searchName = `${name.trim()}=`;

  for (let c of cookies) {
    c = c.trim();
    if (c.indexOf(searchName) === 0) {
      try {
        return decodeURIComponent(c.substring(searchName.length));
      } catch {
        return c.substring(searchName.length);
      }
    }
  }
  return null;
}

export function setCookie(
  name: string,
  value: string,
  days: number = 365,
  sameSite: 'Lax' | 'Strict' | 'None' = 'Lax',
  secure: boolean = true
): void {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  const encodedValue = encodeURIComponent(value);
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = secure && isHttps ? '; Secure' : '';

  document.cookie = `${name}=${encodedValue}; ${expires}; path=/; SameSite=${sameSite}${secureFlag}`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isHttps ? '; Secure' : '';
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secureFlag}`;
}

export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const cookies: Record<string, string> = {};
  const cookieString = document.cookie;
  if (!cookieString) return cookies;

  const pairs = cookieString.split(';');
  for (let pair of pairs) {
    const [rawKey, ...rawValParts] = pair.split('=');
    if (rawKey) {
      const key = rawKey.trim();
      const val = rawValParts.join('=');
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

export function getCookieConsent(): CookiePreferences | null {
  const cookieVal = getCookie(COOKIE_CONSENT_KEY);
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal);
      if (typeof parsed.necessary === 'boolean') {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function hasConsentAnswered(): boolean {
  return getCookieConsent() !== null;
}

export function saveCookieConsent(
  customPreferences: Partial<Omit<CookiePreferences, 'accepted' | 'timestamp' | 'version'>>
): CookiePreferences {
  const preferences: CookiePreferences = {
    accepted: true,
    necessary: true,
    preferences: Boolean(customPreferences.preferences),
    analytics: Boolean(customPreferences.analytics),
    marketing: Boolean(customPreferences.marketing),
    timestamp: new Date().toISOString(),
    version: CURRENT_COOKIE_POLICY_VERSION
  };

  const serialized = JSON.stringify(preferences);
  setCookie(COOKIE_CONSENT_KEY, serialized, 365);

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, serialized);
    } catch {
      // ignore
    }
  }

  return preferences;
}

export function acceptAllCookies(): CookiePreferences {
  return saveCookieConsent({
    preferences: true,
    analytics: true,
    marketing: true
  });
}

export function rejectNonEssentialCookies(): CookiePreferences {
  return saveCookieConsent({
    preferences: false,
    analytics: false,
    marketing: false
  });
}

export function revokeConsent(): void {
  deleteCookie(COOKIE_CONSENT_KEY);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
    } catch {
      // ignore
    }
  }
}
