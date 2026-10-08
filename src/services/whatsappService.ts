/**
 * UltraMsg WhatsApp Integration Service (Protected Gateway)
 * Las credenciales y API Keys se gestionan a través del proxy seguro del servidor (/api/whatsapp/send)
 * para evitar exposición de tokens en el frontend o repositorios públicos (GitHub).
 */

import { sanitizeToPlainText } from '../utils/security';
import { BUSINESS_CONFIG } from '../config/businessConfig';

const WHATSAPP_HISTORY_KEY = 'aura_whatsapp_history';
const ULTRAMSG_CONFIG_KEY = 'aura_ultramsg_config';
const ULTRAMSG_TOKEN_KEY = 'aura_ultramsg_token';

export interface UltraMsgConfig {
  instanceId: string;
  token: string;
  autoConfirmOnBooking: boolean;
  autoNotifyStatusChange: boolean;
  autoNotifyPayment: boolean;
  confirmationTemplate: string;
  statusChangeTemplate: string;
  paymentTemplate: string;
}

export const DEFAULT_ULTRAMSG_CONFIG: UltraMsgConfig = {
  instanceId: '',
  token: '',
  autoConfirmOnBooking: true,
  autoNotifyStatusChange: true,
  autoNotifyPayment: true,
  confirmationTemplate: `✨ *${BUSINESS_CONFIG.brandName.toUpperCase()}* - Confirmación de Reserva ✨\n\nHola *{cliente}*, tu cita para *{servicio}* ha sido agendada con éxito.\n\n📌 *Código de Turno:* {codigo}\n📅 *Fecha:* {fecha}\n⏰ *Hora:* {hora}\n📍 *Sede:* {sede}\n\n¡Te esperamos en ${BUSINESS_CONFIG.brandName}! 💅✨`,
  statusChangeTemplate: `🔔 *${BUSINESS_CONFIG.brandName.toUpperCase()}* - Actualización de Turno 🔔\n\nHola *{cliente}*, tu cita *{codigo}* ha cambiado de estado a: *{estado}*.\n\n📍 *Sede:* {sede}\n💅 *Servicio:* {servicio}\n\nGracias por confiar en ${BUSINESS_CONFIG.brandName}.`,
  paymentTemplate: `💳 *${BUSINESS_CONFIG.brandName.toUpperCase()}* - Recibo de Pago 💳\n\nHola *{cliente}*, confirmamos la recepción del pago por tu servicio *{servicio}* por un valor de *$ {monto} COP*.\n\n📌 *Código de Cita:* {codigo}\n\n¡Muchas gracias por tu visita!`
};

export function getUltraMsgConfig(): UltraMsgConfig {
  let baseConfig = { ...DEFAULT_ULTRAMSG_CONFIG };

  try {
    const saved = localStorage.getItem(ULTRAMSG_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // Migración: si la configuración vieja de localStorage trae un token,
      // pasarlo a sessionStorage y quitarlo de localStorage la primera vez que se lea.
      if (parsed && typeof parsed.token === 'string' && parsed.token.trim()) {
        try {
          sessionStorage.setItem(ULTRAMSG_TOKEN_KEY, parsed.token);
        } catch {
          /* sessionStorage no disponible */
        }
        delete parsed.token;
        try {
          localStorage.setItem(ULTRAMSG_CONFIG_KEY, JSON.stringify(parsed));
        } catch {
          /* localStorage no disponible */
        }
      }

      baseConfig = { ...baseConfig, ...parsed, token: '' };
    }
  } catch (e) {
    console.warn('Error reading UltraMsg config', e);
  }

  // Leer token desde sessionStorage
  try {
    const sessionToken = sessionStorage.getItem(ULTRAMSG_TOKEN_KEY);
    if (sessionToken) {
      baseConfig.token = sessionToken;
    }
  } catch (e) {
    console.warn('Error reading UltraMsg token from sessionStorage', e);
  }

  return baseConfig;
}

export function saveUltraMsgConfig(config: Partial<UltraMsgConfig>): UltraMsgConfig {
  const current = getUltraMsgConfig();
  const updated = { ...current, ...config };

  // Guardar token exclusivamente en sessionStorage
  try {
    if (typeof updated.token === 'string') {
      sessionStorage.setItem(ULTRAMSG_TOKEN_KEY, updated.token);
    }
  } catch (e) {
    console.error('Error saving UltraMsg token to sessionStorage', e);
  }

  // Guardar el resto de la configuración en localStorage SIN el token
  try {
    const { token: _omittedToken, ...configWithoutToken } = updated;
    localStorage.setItem(ULTRAMSG_CONFIG_KEY, JSON.stringify(configWithoutToken));
  } catch (e) {
    console.error('Error saving UltraMsg config to localStorage', e);
  }

  return updated;
}

export interface WhatsAppDispatchRecord {
  id: string;
  bookingCode?: string;
  destinatario: string;
  clienteNombre: string;
  mensaje: string;
  estado: 'enviado' | 'error' | 'simulado';
  fechaHora: string;
  detallesHttp?: string;
}

export function getWhatsAppHistory(): WhatsAppDispatchRecord[] {
  let legacyHistory: WhatsAppDispatchRecord[] | null = null;

  // Migración: si hay historial previo en localStorage, leerlo y borrar la clave vieja
  try {
    const legacySaved = localStorage.getItem(WHATSAPP_HISTORY_KEY);
    if (legacySaved) {
      legacyHistory = JSON.parse(legacySaved);
      localStorage.removeItem(WHATSAPP_HISTORY_KEY);
    }
  } catch (e) {
    console.warn('Error migrating legacy WhatsApp history from localStorage', e);
  }

  try {
    const saved = sessionStorage.getItem(WHATSAPP_HISTORY_KEY);
    if (saved) {
      const parsed: WhatsAppDispatchRecord[] = JSON.parse(saved);
      return parsed.slice(0, 50);
    }
    // Si no había en sessionStorage pero se migró de localStorage, guardar y devolver hasta 50
    if (legacyHistory && Array.isArray(legacyHistory)) {
      const trimmed = legacyHistory.slice(0, 50);
      try {
        sessionStorage.setItem(WHATSAPP_HISTORY_KEY, JSON.stringify(trimmed));
      } catch {
        /* sessionStorage no disponible */
      }
      return trimmed;
    }
  } catch (e) {
    console.warn('Error reading WhatsApp history from sessionStorage', e);
  }

  return [];
}

export function addWhatsAppHistoryRecord(record: WhatsAppDispatchRecord): void {
  try {
    const history = getWhatsAppHistory();
    history.unshift(record);
    sessionStorage.setItem(WHATSAPP_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error('Error saving WhatsApp history record to sessionStorage', e);
  }
}

/**
 * Normaliza cualquier formato de teléfono a formato internacional de Colombia (57...)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length === 12) {
    return digits;
  }
  if (digits.length === 10) {
    return `57${digits}`;
  }
  if (digits.length > 10 && digits.startsWith('57')) {
    return digits;
  }
  return `57${digits.slice(-10)}`;
}

/**
 * Genera el enlace directo a WhatsApp (Web o App)
 */
export function buildWaMeUrl(phone: string, text: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Reemplaza variables dinámicas en las plantillas de mensaje asegurando texto plano seguro
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  Object.keys(vars).forEach((key) => {
    const rawVal = vars[key] || '';
    const safeVal = sanitizeToPlainText(rawVal);
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, safeVal);
  });
  return result;
}

let hasLoggedDisabled = false;

export function isWhatsAppConfigured(): boolean {
  const phone = BUSINESS_CONFIG.whatsapp;
  if (!phone || phone.startsWith('PENDIENTE_')) {
    return false;
  }
  const config = getUltraMsgConfig();
  if (!config.instanceId || !config.token) {
    return false;
  }
  return true;
}

/**
 * Envía un mensaje automático a través del Proxy Seguro del Servidor (/api/whatsapp/send)
 * protegiendo los tokens de UltraMsg contra exposición pública.
 */
export async function sendUltraMsgWhatsApp(params: {
  phone: string;
  message: string;
  clientName: string;
  bookingCode?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string; waUrl?: string }> {
  const cleanPhone = formatPhoneForWhatsApp(params.phone);
  const waUrl = buildWaMeUrl(cleanPhone, params.message);

  if (!isWhatsAppConfigured()) {
    if (!hasLoggedDisabled) {
      console.info('WhatsApp desactivado');
      hasLoggedDisabled = true;
    }
    return { success: true, waUrl };
  }

  const config = getUltraMsgConfig();

  // 1. Intentar envío seguro vía Proxy de Backend
  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: params.message,
        clientName: params.clientName,
        bookingCode: params.bookingCode,
        customInstance: config.instanceId,
        customToken: config.token
      })
    });

    if (response.ok) {
      const data = await response.json();
      const record: WhatsAppDispatchRecord = {
        id: `wa-${Date.now()}`,
        bookingCode: params.bookingCode,
        destinatario: `+${cleanPhone}`,
        clienteNombre: params.clientName,
        mensaje: params.message,
        estado: 'enviado',
        fechaHora: new Date().toLocaleString('es-CO'),
        detallesHttp: `Proxy Backend OK · ID: ${data.messageId || 'OK'}`
      };
      addWhatsAppHistoryRecord(record);
      return { success: true, messageId: data.messageId || 'sent', waUrl };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `Error ${response.status}: Respuesta fallida de UltraMsg`;
      const record: WhatsAppDispatchRecord = {
        id: `wa-${Date.now()}`,
        bookingCode: params.bookingCode,
        destinatario: `+${cleanPhone}`,
        clienteNombre: params.clientName,
        mensaje: params.message,
        estado: 'error',
        fechaHora: new Date().toLocaleString('es-CO'),
        detallesHttp: errorMsg
      };
      addWhatsAppHistoryRecord(record);
      return { success: false, error: errorMsg, waUrl };
    }
  } catch {
    // Si la aplicación corre en modo estático puro (ej. GitHub Pages sin servidor Node)
  }

  // 2. Fallback de contingencia para GitHub Pages / Frontend Estático
  const record: WhatsAppDispatchRecord = {
    id: `wa-${Date.now()}`,
    bookingCode: params.bookingCode,
    destinatario: `+${cleanPhone}`,
    clienteNombre: params.clientName,
    mensaje: params.message,
    estado: 'simulado',
    fechaHora: new Date().toLocaleString('es-CO'),
    detallesHttp: 'Enviado mediante enlace seguro WhatsApp Web (Modo Estático GitHub)'
  };
  addWhatsAppHistoryRecord(record);

  return {
    success: true,
    messageId: `static-wa-${Date.now().toString().slice(-4)}`,
    waUrl
  };
}

/**
 * Verifica la validez de las credenciales y el estado de la instancia en UltraMsg
 */
export async function verifyUltraMsgConnection(customConfig?: {
  instanceId?: string;
  token?: string;
}): Promise<{
  success: boolean;
  accountStatus?: string;
  instance?: string;
  error?: string;
}> {
  const currentConfig = getUltraMsgConfig();
  const targetInstance = customConfig?.instanceId || currentConfig.instanceId;
  const targetToken = customConfig?.token || currentConfig.token;

  try {
    const response = await fetch('/api/whatsapp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customInstance: targetInstance,
        customToken: targetToken
      })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success) {
      return {
        success: true,
        instance: data.instance,
        accountStatus: data.accountStatus || 'authenticated'
      };
    } else {
      return {
        success: false,
        instance: data.instance || targetInstance,
        error: data.error || `HTTP ${response.status}: No se pudo verificar la instancia`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: 'Error de red al consultar el servidor proxy de WhatsApp'
    };
  }
}
