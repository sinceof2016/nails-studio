import { Appointment, Specialist, SlotLock, AgendaBlock } from '../types';
import { SPECIALISTS } from '../data/mockData';
import {
  CLOSING_HOUR,
  MAX_SLOTS_PER_APPOINTMENT,
  SLOT_MINUTES,
  WEEKLY_REST_DAYS,
  SUNDAY_ROTATION,
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

// Fixed 1-hour interval slots: 10:00 AM to 06:00 PM (9 slots)
export const HOURLY_TIME_SLOTS: string[] = buildSlotLabels();

const SPANISH_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const normalizeDayName = (str: string): string =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function extractDateId(date: Date | string | CalendarDayOption): string {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
    return date;
  }
  if (typeof date === 'object' && date !== null) {
    if ('id' in date && typeof (date as CalendarDayOption).id === 'string' && /^\d{4}-\d{2}-\d{2}/.test((date as CalendarDayOption).id)) {
      return (date as CalendarDayOption).id;
    }
    const d = 'dateObj' in date && (date as CalendarDayOption).dateObj instanceof Date
      ? (date as CalendarDayOption).dateObj
      : (date instanceof Date ? date : null);
    if (d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return '';
}

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

// Calculates slots needed for a duration in minutes (max 2 = 120 mins)
export function slotsNeeded(minutes?: number): number {
  if (!minutes || minutes <= 0) return 1;
  return Math.min(MAX_SLOTS_PER_APPOINTMENT, Math.max(1, Math.ceil(minutes / SLOT_MINUTES)));
}

// Returns the consecutive slots covered by a service starting at startSlot, or null if exceeds closing hour
export function getCoveredSlots(startSlot: string, durationMinutes?: number): string[] | null {
  const startIndex = HOURLY_TIME_SLOTS.indexOf(startSlot);
  if (startIndex === -1) return null;
  const needed = slotsNeeded(durationMinutes);
  const { hour: startHour } = parseSlotTo24Hour(startSlot);
  if (startHour + needed > CLOSING_HOUR) {
    return null;
  }
  const slots: string[] = [];
  for (let i = 0; i < needed; i++) {
    const slotIndex = startIndex + i;
    if (slotIndex >= HOURLY_TIME_SLOTS.length) return null;
    slots.push(HOURLY_TIME_SLOTS[slotIndex]);
  }
  return slots;
}

// Returns existing occupied slots clipped at closing time
export function getOccupiedSlots(startSlot: string, durationMinutes?: number): string[] {
  const startIndex = HOURLY_TIME_SLOTS.indexOf(startSlot);
  if (startIndex === -1) return [];
  const needed = slotsNeeded(durationMinutes);
  const slots: string[] = [];
  for (let i = 0; i < needed; i++) {
    const idx = startIndex + i;
    if (idx < HOURLY_TIME_SLOTS.length) {
      slots.push(HOURLY_TIME_SLOTS[idx]);
    }
  }
  return slots;
}

// Sunday rotation: returns group index (0 or 1) for a Sunday, or null if not Sunday
export function getSundayGroupIndex(dateStr: string): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const targetDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (targetDate.getUTCDay() !== 0) return null;
  const [ry, rm, rd] = SUNDAY_ROTATION.referenceSunday.split('-').map(Number);
  const refDate = new Date(Date.UTC(ry, rm - 1, rd, 12, 0, 0));
  const diffDays = Math.round((targetDate.getTime() - refDate.getTime()) / (24 * 60 * 60 * 1000));
  const diffWeeks = Math.round(diffDays / 7);
  const groupCount = SUNDAY_ROTATION.groups.length || 2;
  return ((diffWeeks % groupCount) + groupCount) % groupCount;
}

// Check if specialist is blocked on a date
export function isSpecialistBlockedOnDate(
  specialistId: string,
  dateStr: string,
  blocks: AgendaBlock[] = []
): boolean {
  if (!specialistId || !dateStr || !Array.isArray(blocks)) return false;
  return blocks.some((b) => b.specialistId === specialistId && b.date === dateStr);
}

// Check if a specialist works on a given day according to agendaConfig and blocks
export function isSpecialistWorkingOnDay(
  specialist: Specialist,
  date: Date | string | CalendarDayOption,
  blocks: AgendaBlock[] = []
): boolean {
  const dateId = extractDateId(date);
  if (dateId && isSpecialistBlockedOnDate(specialist.id, dateId, blocks)) {
    return false;
  }
  const dayName = getSpanishDayName(date);
  const normDay = normalizeDayName(dayName);

  // Sunday rotation check
  if (normDay === 'domingo') {
    const sundayGroup = dateId ? getSundayGroupIndex(dateId) : null;
    if (sundayGroup !== null) {
      const workingIds = SUNDAY_ROTATION.groups[sundayGroup] || [];
      if (specialist.id in WEEKLY_REST_DAYS) {
        return workingIds.includes(specialist.id);
      }
    }
  }

  // Fixed rest days from WEEKLY_REST_DAYS (overrides stored Firestore availableDays)
  if (specialist.id in WEEKLY_REST_DAYS) {
    const restDays = WEEKLY_REST_DAYS[specialist.id] || [];
    if (restDays.some((rd) => normalizeDayName(rd) === normDay)) {
      return false;
    }
    return true;
  }

  // Fallback for new specialists not in WEEKLY_REST_DAYS
  if (!specialist.availableDays || specialist.availableDays.length === 0) {
    return true;
  }
  return specialist.availableDays.some((d) => normalizeDayName(d) === normDay);
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

// Helper to check if a specialist is completely free at a single slot
function isSpecialistFreeAtSingleSlot(
  spec: Specialist,
  slot: string,
  selectedDateOption: CalendarDayOption,
  appointments: Appointment[],
  slotLocks: SlotLock[],
  agendaBlocks: AgendaBlock[]
): boolean {
  if (!isSpecialistWorkingOnDay(spec, selectedDateOption, agendaBlocks)) {
    return false;
  }
  const hasApt = appointments.some(
    (a) =>
      a.status !== 'cancelada' &&
      a.specialistId === spec.id &&
      datesMatch(a.date, selectedDateOption) &&
      getOccupiedSlots(a.time, a.serviceDuration || 60).includes(slot)
  );
  if (hasApt) return false;

  const hasLock = slotLocks.some(
    (l) => l.specialistId === spec.id && datesMatch(l.date, selectedDateOption) && l.slot === slot
  );
  if (hasLock) return false;

  return true;
}

// Calculate availability for every slot for a given specialist, duration and date
export function computeSlotAvailability(
  selectedDateOption: CalendarDayOption,
  specialistId: string, // specialist id or 'any'
  appointments: Appointment[] = [],
  slotLocks: SlotLock[] = [],
  now: Date = new Date(),
  specialistsList: Specialist[] = SPECIALISTS,
  serviceDurationMinutes: number = 60,
  agendaBlocks: AgendaBlock[] = []
): SlotAvailability[] {
  const isToday = selectedDateOption.isToday;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const chosenSpecialist = specialistId !== 'any'
    ? specialistsList.find((s) => s.id === specialistId)
    : null;

  const chosenSpecWorksThisDay = chosenSpecialist
    ? isSpecialistWorkingOnDay(chosenSpecialist, selectedDateOption, agendaBlocks)
    : true;

  return HOURLY_TIME_SLOTS.map((slot) => {
    const { hour: slotHour } = parseSlotTo24Hour(slot);

    // 1. Has this hour already passed today?
    let isPassed = false;
    if (isToday) {
      if (slotHour < currentHour || (slotHour === currentHour && currentMinute > 10)) {
        isPassed = true;
      }
    }

    // 2. Consecutive slots needed for this service
    const coveredSlots = getCoveredSlots(slot, serviceDurationMinutes);

    // Specialists available for ALL consecutive slots needed
    const availableSpecialistIds = coveredSlots !== null
      ? specialistsList
          .filter((s) =>
            coveredSlots.every((st) =>
              isSpecialistFreeAtSingleSlot(s, st, selectedDateOption, appointments, slotLocks, agendaBlocks)
            )
          )
          .map((s) => s.id)
      : [];

    let isBooked = false;
    let bookedByClient: string | undefined;

    if (specialistId === 'any') {
      isBooked = availableSpecialistIds.length === 0;
    } else {
      if (!chosenSpecWorksThisDay) {
        isBooked = true;
        bookedByClient = 'Reservado';
      } else if (coveredSlots === null) {
        isBooked = true;
      } else {
        const isChosenAvailable = availableSpecialistIds.includes(specialistId);
        if (!isChosenAvailable) {
          isBooked = true;
          // Look for direct appointment occupying this starting slot
          const directApt = appointments.find(
            (a) =>
              a.status !== 'cancelada' &&
              a.specialistId === specialistId &&
              datesMatch(a.date, selectedDateOption) &&
              getOccupiedSlots(a.time, a.serviceDuration || 60).includes(slot)
          );
          if (directApt) {
            bookedByClient = directApt.clientName;
          }
        }
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
  serviceDurationMinutes: number = 60,
  agendaBlocks: AgendaBlock[] = []
): number {
  const slots = computeSlotAvailability(
    dayOption,
    specialistId,
    appointments,
    slotLocks,
    now,
    specialistsList,
    serviceDurationMinutes,
    agendaBlocks
  );
  return slots.filter((s) => s.status === 'available').length;
}
