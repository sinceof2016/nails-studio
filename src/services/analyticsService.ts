/**
 * Google Analytics 4 Service (Conditional & Consent-Bound)
 * Cumplimiento con Ley 1581 de 2012 y directrices de consentimiento previo.
 */

import { getApp, getApps } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';

let analyticsAutorizado = false;
let analyticsInstance: Analytics | null = null;
let isInitialized = false;

/**
 * Inicializa Analytics única y exclusivamente si el usuario ha otorgado consentimiento explícito
 * y no nos encontramos en un entorno bloqueado por restricciones de referer.
 */
export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (!analyticsAutorizado) return null;
  if (isInitialized) return analyticsInstance;

  try {
    // Evitar llamadas a Firebase Installations si estamos en sandbox de AI Studio (403 PERMISSION_DENIED)
    if (window.location.hostname.includes('run.app')) {
      return null;
    }

    if (getApps().length > 0) {
      const app = getApp();
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      const supported = await isSupported();
      if (supported) {
        analyticsInstance = getAnalytics(app);
        isInitialized = true;
      }
    }
  } catch (error) {
    console.warn('Google Analytics no disponible o bloqueado en este entorno:', error);
  }
  return analyticsInstance;
}

/**
 * Activa la analítica tras consentimiento afirmativo del usuario.
 */
export async function enableAnalytics(): Promise<void> {
  analyticsAutorizado = true;
  const analytics = await initAnalytics();
  if (analytics) {
    try {
      const { setAnalyticsCollectionEnabled } = await import('firebase/analytics');
      setAnalyticsCollectionEnabled(analytics, true);
    } catch {
      // Ignorar errores de configuración
    }
  }
}

/**
 * Desactiva la analítica. NO inicializa Analytics si no estaba ya creado.
 */
export async function disableAnalytics(): Promise<void> {
  analyticsAutorizado = false;
  if (analyticsInstance) {
    try {
      const { setAnalyticsCollectionEnabled } = await import('firebase/analytics');
      setAnalyticsCollectionEnabled(analyticsInstance, false);
    } catch {
      // Ignorar
    }
  }
  if (typeof document !== 'undefined') {
    // Eliminar cookies de Google Analytics (_ga*, _gid*, _gat*, etc.)
    const cookies = document.cookie.split(';');
    const hostname = window.location.hostname;
    const domainParts = hostname.split('.');
    const parentDomain = domainParts.length > 1 ? `.${domainParts.slice(-2).join('.')}` : hostname;
    const paths = ['/', '/nails-studio', '/nails-studio/'];

    for (const cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga') || name.startsWith('_gid') || name.startsWith('_gat')) {
        for (const path of paths) {
          document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=${hostname};`;
          document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=.${hostname};`;
          if (parentDomain !== hostname) {
            document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=${parentDomain};`;
          }
        }
      }
    }
  }
}

/**
 * Envía evento de visualización de pantalla/pestaña si hay autorización previa.
 */
export async function trackPageView(pageName: string, path: string): Promise<void> {
  if (!analyticsAutorizado) return;
  const analytics = await initAnalytics();
  if (analytics) {
    try {
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, 'page_view', {
        page_title: pageName,
        page_path: path
      });
    } catch {
      // Ignorar errores por adblockers
    }
  }
}

/**
 * Registra inicio del flujo de reserva (paso de horarios) sin datos personales.
 */
export async function trackBeginBooking(serviceName: string): Promise<void> {
  if (!analyticsAutorizado) return;
  const analytics = await initAnalytics();
  if (analytics) {
    try {
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, 'begin_booking', {
        service_name: serviceName
      });
    } catch {
      // Ignorar
    }
  }
}

/**
 * Registra reserva confirmada en Firestore con evento propio, sin transacciones financieras ficticias
 * ni datos personales (nombre, teléfono, correo u observaciones jamás se envían).
 */
export async function trackBookingConfirmed(serviceId: string, branchName: string): Promise<void> {
  if (!analyticsAutorizado) return;
  const analytics = await initAnalytics();
  if (analytics) {
    try {
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, 'booking_confirmed', {
        service_id: serviceId,
        branch: branchName
      });
    } catch {
      // Ignorar
    }
  }
}
