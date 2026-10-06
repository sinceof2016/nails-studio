import { Appointment, Specialist, SlotLock, AgendaBlock } from '../types';
import { SPECIALISTS } from '../data/mockData';
import {
  SLOT_MINUTES,
  MAX_SLOTS_PER_APPOINTMENT,
  SUNDAY_ROTATION,
  WEEKLY_REST_DAYS,
  buildSlotLabels
} from '../config/agendaConfig';

export interface CalendarDayOption {
  id: string; // e.g. "2026-09-28"
  label: string; // e.g. "Hoy", "Mañana", "Mar 30"
  dayName: string; // e.g. "Hoy", "Mañana", "Martes"
  dateNum: string; // e.g. "28"
  full: string; // e.g. "Hoy, 28 Sept"
  dayOfWeek: string; // e.g. "Lun", "Mar"
  isToday: boolean;
  dateObj: Date;
}

export interface SlotAvailability {
  slot: string; // e.g. "11:00 AM"
  hour24: number;
  isPassed: boolean; // Has this hour already passed today?
  isBooked: boolean; // Is this slot booked for the selected specialist or off-day?
  bookedByClient?: string;
  availableSpecialistIds: string[]; // Other specialists free and working at this exact hour
  status: 'available' | 'booked' | 'passed';
}

// Horarios de inicio de cita, de una hora: 10:00 AM ... 06:00 PM (la última cita empieza a las 6 y el local cierra a las 7)
export const HOURLY_TIME_SLOTS: string[] = buildSlotLabels();

/** Cuántos horarios seguidos ocupa un servicio según su duración (mínimo 1). */
export function slotsNeeded(durationMinutes?: number): number {
  const minutes = Number.isFinite(Number(durationMinutes)) && Number(durationMinutes) > 0 ? Number(durationMinutes) : SLOT_MINUTES;
  return Math.min(MAX_SLOTS_PER_APPOINTMENT, Math.max(1, Math.ceil(minutes / SLOT_MINUTES)));
}

/**
 * Horarios que ocupa un servicio que empieza en `startSlot`.
 * Devuelve null si el servicio terminaría después del cierre.
 */
export function getCoveredSlots(startSlot: string, durationMinutes?: number): string[] | null {
  const index = HOURLY_TIME_SLOTS.indexOf(startSlot);
  if (index < 0) return [startSlot];
  const needed = slotsNeeded(durationMinutes);
  if (index + needed > HOURLY_TIME_SLOTS.length) return null;
  return HOURLY_TIME_SLOTS.slice(index, index + needed);
}

/** Igual que getCoveredSlots, pero recorta en el cierre en lugar de devolver null (para citas ya guardadas). */
export function getOccupiedSlots(startSlot: string, durationMinutes?: number): string[] {
  const index = HOURLY_TIME_SLOTS.indexOf(startSlot);
  if (index < 0) return [startSlot];
  return HOURLY_TIME_SLOTS.slice(index, index + slotsNeeded(durationMinutes));
}

const SPANISH_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const normalizeDayName = (str: string): string =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Get the Spanish day name for any date object, string or CalendarDayOption
export function getSpanishDayName(date: Date | string | CalendarDayOption): string {
  let d: Date;
  if (typeof date === 'object' && date !== null && 'dateObj' in date && (date as CalendarDayOption).dateObj instanceof Date) {
    d = (date as CalendarDayOption).dateObj;
  } else if (typeof date === 'string') {
    const parts = date.split('-');
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(date);
    }
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date();
  }
  return SPANISH_DAY_NAMES[d.getDay()] || 'Lunes';
}

// Fecha AAAA-MM-DD de una fecha, de un texto AAAA-MM-DD o de una opción del calendario
function toDateId(date: Date | string | CalendarDayOption): string {
  if (typeof date === 'object' && date !== null && 'id' in date && typeof (date as CalendarDayOption).id === 'string') {
    return (date as CalendarDayOption).id;
  }
  if (typeof date === 'string') return date;
  const d = date instanceof Date ? date : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateIdUtc(dateId: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateId);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Si la fecha es domingo, devuelve qué grupo de especialistas trabaja ese domingo
 * (0 = primer grupo, 1 = segundo, ...). Si no es domingo o la fecha no es válida, devuelve null.
 */
export function getSundayGroupIndex(dateId: string): number | null {
  const utc = parseDateIdUtc(dateId);
  const reference = parseDateIdUtc(SUNDAY_ROTATION.referenceSunday);
  if (utc === null || reference === null) return null;
  if (new Date(utc).getUTCDay() !== 0) return null;
  const groups = SUNDAY_ROTATION.groups.length;
  const weeks = Math.round((utc - reference) / (7 * MS_PER_DAY));
  return ((weeks % groups) + groups) % groups;
}

/** Indica si la agenda de la especialista está bloqueada todo el día en esa fecha. */
export function isSpecialistBlockedOnDate(specialistId: string, dateId: string, blocks: AgendaBlock[] = []): boolean {
  return blocks.some((b) => b.specialistId === specialistId && b.date === dateId);
}

/**
 * Indica si una especialista trabaja ese día:
 * 1. Si su agenda está bloqueada ese día, no trabaja.
 * 2. Los domingos solo trabaja el grupo que toca esa semana (rotación).
 * 3. Si tiene días de descanso fijos en WEEKLY_REST_DAYS (agendaConfig.ts), trabaja todos los demás días.
 * 4. Si no, según los días que tiene configurados en Firestore (availableDays).
 */
export function isSpecialistWorkingOnDay(
  specialist: Specialist,
  date: Date | string | CalendarDayOption,
  blocks: AgendaBlock[] = []
): boolean {
  const dateId = toDateId(date);
  if (isSpecialistBlockedOnDate(specialist.id, dateId, blocks)) return false;

  const sundayGroup = getSundayGroupIndex(dateId);
  if (sundayGroup !== null) {
    return SUNDAY_ROTATION.groups[sundayGroup].includes(specialist.id);
  }

  const fixedRestDays = WEEKLY_REST_DAYS[specialist.id];
  if (fixedRestDays) {
    const currentDay = normalizeDayName(getSpanishDayName(date));
    return !fixedRestDays.some((day) => normalizeDayName(day) === currentDay);
  }

  if (!specialist.availableDays || specialist.availableDays.length === 0) {
    return true; // Default fallback if not configured
  }
  const currentDayName = normalizeDayName(getSpanishDayName(date));
  return specialist.availableDays.some((day) => normalizeDayName(day) === currentDayName);
}

// Helper to convert slot string e.g. "02:00 PM" to 24-hour number (14)
export function parseSlotTo24Hour(slot: string): { hour: number; minute: number } {
  const parts = slot.trim().split(' ');
  if (parts.length < 2) return { hour: 12, minute: 0 };
  const [time, period] = parts;
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (period.toUpperCase() === 'PM' && h < 12) h += 12;
  if (period.toUpperCase() === 'AM' && h === 12) h = 0;
  return { hour: h, minute: m };
}

// Generate the next 7 days starting from today with localized Spanish labels
export function getUpcomingCalendarDays(referenceDate: Date = new Date()): CalendarDayOption[] {
  const days: CalendarDayOption[] = [];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'];
  const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() + i);
    d.setHours(0, 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const id = `${year}-${month}-${day}`;

    const dateNum = String(d.getDate());
    const monthName = monthNames[d.getMonth()];
    const dayOfWeek = dayNamesShort[d.getDay()];

    let label = '';
    let dayName = '';
    let full = '';

    if (i === 0) {
      label = 'Hoy';
      dayName = 'Hoy';
      full = `Hoy, ${dateNum} ${monthName}`;
    } else if (i === 1) {
      label = 'Mañana';
      dayName = 'Mañana';
      full = `Mañana, ${dateNum} ${monthName}`;
    } else {
      label = `${dayOfWeek} ${dateNum}`;
      dayName = dayOfWeek;
      full = `${dayOfWeek}, ${dateNum} ${monthName}`;
    }

    days.push({
      id,
      label,
      dayName,
      dateNum,
      full,
      dayOfWeek,
      isToday: i === 0,
      dateObj: d
    });
  }

  return days;
}

// Normalize dates from appointment records to compare with full labels
export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ').trim();
}

export function datesMatch(aptDate: string, selectedDate: CalendarDayOption | string): boolean {
  if (!aptDate || !selectedDate) return false;

  const targetId = typeof selectedDate === 'string' ? selectedDate : selectedDate.id;
  const targetLabel = typeof selectedDate === 'string' ? selectedDate : selectedDate.full;

  // 1. Comparación directa ISO (AAAA-MM-DD)
  if (aptDate === targetId) return true;

  // 2. Soporte para citas legacy ya guardadas con etiquetas de texto ("Hoy, 28 Sept", etc.)
  const cleanApt = normalizeDateString(aptDate);
  const cleanSel = normalizeDateString(targetLabel);

  if (cleanApt === cleanSel) return true;
  if (cleanApt.includes('hoy') && cleanSel.includes('hoy')) return true;
  if (cleanApt.includes('mañana') && cleanSel.includes('mañana')) return true;

  const numApt = cleanApt.match(/\d+/)?.[0];
  const numSel = cleanSel.match(/\d+/)?.[0];
  if (numApt && numSel && numApt === numSel) return true;

  return false;
}

// Calculate availability for every slot for a given specialist and date
export function computeSlotAvailability(
  selectedDateOption: CalendarDayOption,
  specialistId: string, // specialist id or 'any'
  appointments: Appointment[] = [],
  slotLocks: SlotLock[] = [],
  now: Date = new Date(),
  specialistsList: Specialist[] = SPECIALISTS,
  durationMinutes: number = SLOT_MINUTES,
  blocks: AgendaBlock[] = []
): SlotAvailability[] {
  const isToday = selectedDateOption.isToday;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const needed = slotsNeeded(durationMinutes);

  const chosenSpecialist = specialistId !== 'any'
    ? specialistsList.find((s) => s.id === specialistId)
    : null;

  const chosenSpecWorksThisDay = chosenSpecialist
    ? isSpecialistWorkingOnDay(chosenSpecialist, selectedDateOption, blocks)
    : true;

  // Quién ocupa cada horario del día. Una cita larga ocupa varios horarios seguidos;
  // los bloqueos públicos (slot_locks) ya traen un registro por cada horario ocupado.
  const busy = new Map<string, string>(); // `${especialista}|${horario}` -> nombre de la clienta ('' si se desconoce)
  for (const a of appointments) {
    if (a.status === 'cancelada' || !datesMatch(a.date, selectedDateOption)) continue;
    for (const covered of getOccupiedSlots(a.time, a.serviceDuration)) {
      busy.set(`${a.specialistId}|${covered}`, a.clientName || '');
    }
  }
  for (const l of slotLocks) {
    if (!datesMatch(l.date, selectedDateOption)) continue;
    const key = `${l.specialistId}|${l.slot}`;
    if (!busy.has(key)) busy.set(key, '');
  }

  return HOURLY_TIME_SLOTS.map((slot, slotIndex) => {
    const { hour: slotHour } = parseSlotTo24Hour(slot);

    // 1. Has this hour already passed today?
    let isPassed = false;
    if (isToday) {
      if (slotHour < currentHour || (slotHour === currentHour && currentMinute > 10)) {
        isPassed = true;
      }
    }

    // 2. Horarios que ocuparía el servicio y si cabe antes del cierre
    const fitsBeforeClosing = slotIndex + needed <= HOURLY_TIME_SLOTS.length;
    const coveredSlots = HOURLY_TIME_SLOTS.slice(slotIndex, slotIndex + needed);

    // Especialistas disponibles: trabajan ese día y tienen libres todos los horarios que ocuparía el servicio
    const availableSpecialistIds = fitsBeforeClosing
      ? specialistsList
          .filter(
            (s) =>
              isSpecialistWorkingOnDay(s, selectedDateOption, blocks) &&
              coveredSlots.every((covered) => !busy.has(`${s.id}|${covered}`))
          )
          .map((s) => s.id)
      : [];

    let isBooked = false;
    let bookedByClient: string | undefined;

    if (specialistId === 'any') {
      // Con "cualquier especialista" el horario está ocupado solo si ninguna puede
      isBooked = availableSpecialistIds.length === 0;
    } else if (!chosenSpecWorksThisDay) {
      // La especialista no trabaja ese día (descanso, rotación de domingo o agenda bloqueada)
      isBooked = true;
      bookedByClient = 'Reservado';
    } else if (!fitsBeforeClosing) {
      // El servicio terminaría después del cierre
      isBooked = true;
    } else {
      const conflict = coveredSlots.find((covered) => busy.has(`${specialistId}|${covered}`));
      if (conflict) {
        isBooked = true;
        bookedByClient = busy.get(`${specialistId}|${conflict}`) || undefined;
      }
    }

    let status: SlotAvailability['status'] = 'available';
    if (isPassed) {
      status = 'passed';
    } else if (isBooked) {
      status = 'booked';
    }

    return {
      slot,
      hour24: slotHour,
      isPassed,
      isBooked,
      bookedByClient,
      availableSpecialistIds,
      status
    };
  });
}

// Count free slots for a specialist on a date
export function countFreeSlots(
  dayOption: CalendarDayOption,
  specialistId: string,
  appointments: Appointment[] = [],
  slotLocks: SlotLock[] = [],
  now: Date = new Date(),
  specialistsList: Specialist[] = SPECIALISTS,
  durationMinutes: number = SLOT_MINUTES,
  blocks: AgendaBlock[] = []
): number {
  const slots = computeSlotAvailability(dayOption, specialistId, appointments, slotLocks, now, specialistsList, durationMinutes, blocks);
  return slots.filter((s) => s.status === 'available').length;
}
