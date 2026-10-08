/**
 * Utilidades para manejo de fechas en zona horaria de Colombia (America/Bogota)
 * y generación de identificadores y códigos únicos seguros.
 */

import { BUSINESS_CONFIG } from '../config/businessConfig';

const COLOMBIA_TIMEZONE = 'America/Bogota';

/**
 * Devuelve la fecha actual en formato ISO (AAAA-MM-DD) según la hora local de Colombia.
 */
export function getColombiaDateISO(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

/**
 * Devuelve la hora actual en formato de 12 horas (hh:mm AM/PM) según la hora local de Colombia.
 */
export function getColombiaTimeStr(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: COLOMBIA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return formatter.format(date);
}

/**
 * Convierte una fecha ISO (AAAA-MM-DD) a una etiqueta legible en español ("Hoy, 1 Oct", "Jue, 15 Oct").
 * Si la fecha ya viene en formato de texto legacy ("Hoy, 27 Sept"), la devuelve intacta.
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const todayISO = getColombiaDateISO();
    const [y, m, d] = dateStr.split('-').map(Number);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'];
    const monthName = months[m - 1] || '';

    if (dateStr === todayISO) {
      return `Hoy, ${d} ${monthName}`;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = getColombiaDateISO(tomorrow);
    if (dateStr === tomorrowISO) {
      return `Mañana, ${d} ${monthName}`;
    }

    // Nombre del día abreviado
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayName = dayNamesShort[dt.getUTCDay()];

    return `${dayName}, ${d} ${monthName}`;
  }
  return dateStr;
}

/**
 * Genera un identificador único largo y seguro utilizando crypto.randomUUID().
 */
export function generateSecureId(prefix: string): string {
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
  return `${prefix}-${uuid}`;
}

/**
 * Genera un código de reserva legible de mínimo 6 caracteres alfanuméricos únicos (AURA-XXXXXX),
 * garantizando que no colisione con códigos existentes.
 */
export function generateBookingCode(existingCodes: string[] = []): string {
  const existingSet = new Set(existingCodes.map((c) => c.toUpperCase()));
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin caracteres ambiguos (0/O, 1/I)
  
  for (let attempt = 0; attempt < 50; attempt++) {
    let randomPart = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < 6; i++) {
        randomPart += chars[bytes[i] % chars.length];
      }
    } else {
      for (let i = 0; i < 6; i++) {
        randomPart += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    const prefix = BUSINESS_CONFIG.bookingCodePrefix || 'AURA';
    const candidate = `${prefix}-${randomPart}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }
  
  // Fallback si tras 50 intentos colisionara
  const prefix = BUSINESS_CONFIG.bookingCodePrefix || 'AURA';
  return `${prefix}-${Date.now().toString().slice(-6).toUpperCase()}`;
}
