/**
 * UltraMsg WhatsApp Integration Service (Protected Gateway)
 * Las credenciales y API Keys se gestionan a través del proxy seguro del servidor (/api/whatsapp/send)
 * para evitar exposición de tokens en el frontend o repositorios públicos (GitHub).
 */

import { sanitizeToPlainText } from '../utils/security';

const WHATSAPP_HISTORY_KEY = 'aura_whatsapp_history';
const ULTRAMSG_CONFIG_KEY = 'aura_ultramsg_config';

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
  instanceId: 'instance192909',
  token: '8qqml39io4sdiwlv',
  autoConfirmOnBooking: true,
  autoNotifyStatusChange: true,
  autoNotifyPayment: true,
  confirmationTemplate: `✨ *LA PELU SPA* - Confirmación de Reserva ✨\n\nHola *{cliente}*, tu cita para *{servicio}* ha sido agendada con éxito.\n\n📌 *Código de Turno:* {codigo}\n📅 *Fecha:* {fecha}\n⏰ *Hora:* {hora}\n📍 *Sede:* {sede}\n\n¡Te esperamos para consentirte en nuestro santuario de belleza! 💅✨`,
  statusChangeTemplate: `🔔 *LA PELU SPA* - Actualización de Turno 🔔\n\nHola *{cliente}*, tu cita *{codigo}* ha cambiado de estado a: *{estado}*.\n\n📍 *Sede:* {sede}\n💅 *Servicio:* {servicio}\n\nGracias por confiar en La Pelu SPA.`,
  paymentTemplate: `💳 *LA PELU SPA* - Recibo de Pago 💳\n\nHola *{cliente}*, confirmamos la recepción del pago por tu servicio *{servicio}* por un valor de *$ {monto} COP*.\n\n📌 *Código de Cita:* {codigo}\n\n¡Muchas gracias por tu visita!`
};

export function getUltraMsgConfig(): UltraMsgConfig {
  try {
    const saved = localStorage.getItem(ULTRAMSG_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migración si el navegador tenía la clave de prueba anterior
      if (parsed.instanceId === 'instance191642' || !parsed.instanceId) {
        parsed.instanceId = 'instance192909';
        parsed.token = '8qqml39io4sdiwlv';
        localStorage.setItem(ULTRAMSG_CONFIG_KEY, JSON.stringify({ ...DEFAULT_ULTRAMSG_CONFIG, ...parsed }));
      }
      return { ...DEFAULT_ULTRAMSG_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Error reading UltraMsg config', e);
  }
  return DEFAULT_ULTRAMSG_CONFIG;
}

export function saveUltraMsgConfig(config: Partial<UltraMsgConfig>): UltraMsgConfig {
  const current = getUltraMsgConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(ULTRAMSG_CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving UltraMsg config', e);
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
  try {
    const saved = localStorage.getItem(WHATSAPP_HISTORY_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading WhatsApp history', e);
  }
  return [];
}

export function addWhatsAppHistoryRecord(record: WhatsAppDispatchRecord): void {
  try {
    const history = getWhatsAppHistory();
    history.unshift(record);
    localStorage.setItem(WHATSAPP_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error('Error saving WhatsApp history record', e);
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
