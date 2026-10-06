/**
 * Configuración de la agenda de La Pelu SPA.
 * Las reglas de Firestore (firestore.rules) repiten estos horarios: si cambian aquí,
 * hay que cambiarlos también allí y volver a probarlas.
 */

/** Hora de la primera cita (10:00 a. m.). */
export const FIRST_SLOT_HOUR = 10;
/** Hora de la última cita (empieza a las 6:00 p. m.). */
export const LAST_SLOT_HOUR = 18;
/** Hora de cierre (7:00 p. m.): ningún servicio puede terminar después. */
export const CLOSING_HOUR = 19;
/** Cada horario dura una hora; un servicio largo ocupa varios horarios seguidos. */
export const SLOT_MINUTES = 60;
/**
 * Un servicio ocupa como máximo 2 horarios seguidos (120 minutos).
 * Las reglas de Firestore y el formulario de servicios también limitan la duración a 120 minutos.
 */
export const MAX_SLOTS_PER_APPOINTMENT = 2;

/**
 * Días de descanso fijos de cada especialista (de lunes a sábado). Mandan sobre los "días disponibles"
 * que cada una tenga guardados en Firestore: una especialista que aparece aquí trabaja todos los días
 * menos los que se listan. Diana no tiene día fijo: su agenda se bloquea cuando hace falta con el botón
 * "Bloquear agenda". Los domingos los define la rotación de abajo.
 * Una especialista que no aparece aquí (por ejemplo una nueva) usa sus días disponibles de Firestore.
 */
export const WEEKLY_REST_DAYS: Record<string, string[]> = {
  dayana: ['Miércoles'],
  natalia: ['Miércoles'],
  geraldine: ['Lunes'],
  diana: []
};

/**
 * Domingos: solo trabajan dos especialistas y se alternan semana a semana.
 * El domingo `referenceSunday` trabaja el primer grupo; el siguiente, el segundo; y así sucesivamente.
 */
export const SUNDAY_ROTATION: { referenceSunday: string; groups: string[][] } = {
  referenceSunday: '2026-10-11',
  groups: [
    ['dayana', 'natalia'],
    ['diana', 'geraldine']
  ]
};

/** Convierte una hora de 24 h (por ejemplo 13) en el formato de la agenda ("01:00 PM"). */
export function formatSlotLabel(hour24: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, '0')}:00 ${period}`;
}

/** Todos los horarios de inicio de cita del día: "10:00 AM" ... "06:00 PM". */
export function buildSlotLabels(): string[] {
  const labels: string[] = [];
  for (let hour = FIRST_SLOT_HOUR; hour <= LAST_SLOT_HOUR; hour++) {
    labels.push(formatSlotLabel(hour));
  }
  return labels;
}
