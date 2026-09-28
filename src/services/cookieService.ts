/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CookiePreferences, CookieInfo } from '../types';

export const COOKIE_CONSENT_KEY = 'aura_cookie_consent';
export const CURRENT_COOKIE_POLICY_VERSION = '2026.1';

/**
 * Technical registry of all cookies and storage elements used in La Pelu SPA
 */
export const COOKIE_CATALOG: CookieInfo[] = [
  // 1. Necesarias
  {
    name: 'aura_cookie_consent',
    category: 'necessary',
    purpose: 'Almacena tus preferencias de consentimiento de cookies y políticas de privacidad para no volver a preguntar en cada visita.',
    provider: 'La Pelu SPA (Propia)',
    duration: '12 meses',
    type: 'HTTP Cookie'
  },
  {
    name: 'aura_session_token',
    category: 'necessary',
    purpose: 'Identificador seguro de sesión para autenticación de administradores, especialistas y confirmación de citas.',
    provider: 'La Pelu SPA (Propia)',
    duration: 'Sesión',
    type: 'HTTP Cookie'
  },
  {
    name: 'aura_csrf_protect',
    category: 'necessary',
    purpose: 'Protección contra ataques de falsificación de peticiones en sitios cruzados (Cross-Site Request Forgery) en reservas y pagos.',
    provider: 'La Pelu SPA (Seguridad)',
    duration: 'Sesión',
    type: 'HTTP Cookie'
  },
  {
    name: 'aura_current_user',
    category: 'necessary',
    purpose: 'Mantiene el perfil y rol de usuario activo autenticado en el panel de control y caja.',
    provider: 'La Pelu SPA (Local)',
    duration: 'Persistente (30 días)',
    type: 'LocalStorage'
  },
  
  // 2. Preferencias
  {
    name: 'aura_branch_pref',
    category: 'preferences',
    purpose: 'Recuerda tu sucursal favorita seleccionada (Chicó, Usaquén o Chapinero) para agilizar tus futuras reservas.',
    provider: 'La Pelu SPA (Propia)',
    duration: '6 meses',
    type: 'HTTP Cookie'
  },
  {
    name: 'aura_currency_display',
    category: 'preferences',
    purpose: 'Guarda la moneda de cotización predeterminada (Pesos Colombianos - COP) y formato de separador de miles.',
    provider: 'La Pelu SPA (Propia)',
    duration: '6 meses',
    type: 'HTTP Cookie'
  },
  {
    name: 'aura_theme_mode',
    category: 'preferences',
    purpose: 'Preserva la preferencia de modo visual, animaciones y contraste del santuario digital.',
    provider: 'La Pelu SPA (Propia)',
    duration: '12 meses',
    type: 'HTTP Cookie'
  },
  {
    name: 'aura_ultramsg_pref',
    category: 'preferences',
    purpose: 'Guarda las preferencias de disparos automáticos de WhatsApp e UltraMsg Gateway.',
    provider: 'La Pelu SPA (Propia)',
    duration: '3 meses',
    type: 'LocalStorage'
  },

  // 3. Analíticas y Rendimiento
  {
    name: 'aura_analytics_uid',
    category: 'analytics',
    purpose: 'Identificador anónimo y cifrado para medir tiempos de carga de imágenes, servicios más consultados y errores de navegación.',
    provider: 'La Pelu SPA (Análisis Interno)',
    duration: '3 meses',
    type: 'HTTP Cookie'
  },
  {
    name: 'aura_perf_metrics',
    category: 'analytics',
    purpose: 'Registra métricas Core Web Vitals (LCP, FID, CLS) para optimizar la velocidad en dispositivos móviles.',
    provider: 'La Pelu SPA (Diagnóstico)',
    duration: '30 días',
    type: 'LocalStorage'
  },

  // 4. Marketing y Comunicación
  {
    name: 'aura_promo_seen',
    category: 'marketing',
    purpose: 'Controla la frecuencia de visualización del bono 15% OFF para no interrumpir tu experiencia de navegación.',
    provider: 'La Pelu SPA (Promociones)',
    duration: '7 días',
    type: 'HTTP Cookie'
  },
  {
    name: 'aura_wa_channel_ref',
    category: 'marketing',
    purpose: 'Registra el origen de consulta de WhatsApp Business para ofrecerte asesoría directa sobre diseños de uñas.',
    provider: 'La Pelu SPA / WhatsApp',
    duration: '30 días',
    type: 'LocalStorage'
  }
];

/**
 * Standard utility to read a browser cookie by name
 */
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

/**
 * Standard utility to write a browser cookie with strict security flags
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 365,
  sameSite: 'Lax' | 'Strict' | 'None' = 'Lax'
): void {
  if (typeof document === 'undefined') return;

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';

  const encodedValue = encodeURIComponent(value);
  document.cookie = `${name}=${encodedValue}; ${expires}; path=/; SameSite=${sameSite}${secureFlag}`;
}

/**
 * Deletes a cookie by setting its expiration to the past
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secureFlag}`;
}

/**
 * Retrieves all browser cookies as key-value pairs
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const cookies: Record<string, string> = {};
  const cookieString = document.cookie;
  if (!cookieString) return cookies;

  cookieString.split(';').forEach((item) => {
    const [key, ...valueParts] = item.trim().split('=');
    if (key) {
      try {
        cookies[key] = decodeURIComponent(valueParts.join('='));
      } catch {
        cookies[key] = valueParts.join('=');
      }
    }
  });
  return cookies;
}

/**
 * Check if the user has already answered the consent banner
 */
export function hasConsentAnswered(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Retrieves current cookie preferences
 */
export function getCookieConsent(): CookiePreferences | null {
  // Check cookie first
  const cookieVal = getCookie(COOKIE_CONSENT_KEY);
  if (cookieVal) {
    try {
      return JSON.parse(cookieVal) as CookiePreferences;
    } catch {
      // fallback to localStorage
    }
  }

  // Fallback to localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (stored) {
        return JSON.parse(stored) as CookiePreferences;
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

/**
 * Apply changes based on accepted categories (set or clear corresponding cookies)
 */
function applyCategoryEffects(prefs: CookiePreferences) {
  // Preferences cookies
  if (prefs.preferences) {
    setCookie('aura_branch_pref', 'chico', 180);
    setCookie('aura_currency_display', 'COP', 180);
    setCookie('aura_theme_mode', 'spa_luxe', 365);
  } else {
    deleteCookie('aura_branch_pref');
    deleteCookie('aura_currency_display');
    deleteCookie('aura_theme_mode');
    try {
      localStorage.removeItem('aura_calendar_pref');
    } catch {}
  }

  // Analytics cookies
  if (prefs.analytics) {
    const existingUid = getCookie('aura_analytics_uid') || `anon_${Math.random().toString(36).substring(2, 10)}`;
    setCookie('aura_analytics_uid', existingUid, 90);
  } else {
    deleteCookie('aura_analytics_uid');
    try {
      localStorage.removeItem('aura_perf_metrics');
    } catch {}
  }

  // Marketing cookies
  if (prefs.marketing) {
    setCookie('aura_promo_seen', 'true', 7);
  } else {
    deleteCookie('aura_promo_seen');
    try {
      localStorage.removeItem('aura_wa_channel_ref');
    } catch {}
  }
}

/**
 * Save user cookie preferences
 */
export function saveCookieConsent(
  prefs: {
    accepted?: boolean;
    necessary?: boolean;
    preferences?: boolean;
    analytics?: boolean;
    marketing?: boolean;
  }
): CookiePreferences {
  const fullPrefs: CookiePreferences = {
    accepted: prefs.accepted ?? true,
    necessary: true, // Always true
    preferences: Boolean(prefs.preferences),
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
    timestamp: new Date().toISOString(),
    version: CURRENT_COOKIE_POLICY_VERSION
  };

  const serialized = JSON.stringify(fullPrefs);
  setCookie(COOKIE_CONSENT_KEY, serialized, 365);

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, serialized);
  } catch {}

  applyCategoryEffects(fullPrefs);
  return fullPrefs;
}

/**
 * Accept all cookies (1 click)
 */
export function acceptAllCookies(): CookiePreferences {
  return saveCookieConsent({
    accepted: true,
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true
  });
}

/**
 * Reject non-essential cookies (only keep necessary)
 */
export function rejectNonEssentialCookies(): CookiePreferences {
  return saveCookieConsent({
    accepted: true,
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false
  });
}

/**
 * Revoke and reset all cookies and consent
 */
export function revokeConsent(): void {
  deleteCookie(COOKIE_CONSENT_KEY);
  deleteCookie('aura_branch_pref');
  deleteCookie('aura_currency_display');
  deleteCookie('aura_theme_mode');
  deleteCookie('aura_analytics_uid');
  deleteCookie('aura_promo_seen');

  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem('aura_calendar_pref');
    localStorage.removeItem('aura_perf_metrics');
    localStorage.removeItem('aura_wa_channel_ref');
  } catch {}
}
