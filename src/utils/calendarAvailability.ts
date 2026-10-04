import { Appointment, Specialist, SlotLock } from '../types';
import { SPECIALISTS } from '../data/mockData';

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

// Fixed 1-hour interval slots for Sanctuary SPA
export const HOURLY_TIME_SLOTS: string[] = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM'
];

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

// Check if a specialist works on a given day according to their availableDays configuration
export function isSpecialistWorkingOnDay(
  specialist: Specialist,
  date: Date | string | CalendarDayOption
): boolean {
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
  specialistsList: Specialist[] = SPECIALISTS
): SlotAvailability[] {
  const isToday = selectedDateOption.isToday;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const chosenSpecialist = specialistId !== 'any'
    ? specialistsList.find((s) => s.id === specialistId)
    : null;

  const chosenSpecWorksThisDay = chosenSpecialist
    ? isSpecialistWorkingOnDay(chosenSpecialist, selectedDateOption)
    : true;

  return HOURLY_TIME_SLOTS.map((slot) => {
    const { hour: slotHour, minute: slotMinute } = parseSlotTo24Hour(slot);

    // 1. Has this hour already passed today?
    let isPassed = false;
    if (isToday) {
      if (slotHour < currentHour || (slotHour === currentHour && currentMinute > 10)) {
        isPassed = true;
      }
    }

    // 2. Active appointments for this day & slot
    const matchingApts = appointments.filter(
      (a) =>
        a.status !== 'cancelada' &&
        a.time === slot &&
        datesMatch(a.date, selectedDateOption)
    );

    // 3. Slot locks públicos para este horario y día
    const matchingLocks = slotLocks.filter(
      (l) => l.slot === slot && datesMatch(l.date, selectedDateOption)
    );

    // Booked specialists at this hour from appointments and slot locks
    const bookedFromApts = matchingApts.map((a) => a.specialistId);
    const bookedFromLocks = matchingLocks.map((l) => l.specialistId);
    const bookedSpecialistIds = Array.from(new Set([...bookedFromApts, ...bookedFromLocks]));

    // Available specialists at this hour: MUST WORK on this day AND not be booked/locked
    const availableSpecialistIds = specialistsList
      .filter((s) => isSpecialistWorkingOnDay(s, selectedDateOption) && !bookedSpecialistIds.includes(s.id))
      .map((s) => s.id);

    let isBooked = false;
    let bookedByClient: string | undefined;

    if (specialistId === 'any') {
      // If 'any' specialist is chosen, it is booked only if ALL working specialists are booked
      isBooked = availableSpecialistIds.length === 0;
    } else {
      if (!chosenSpecWorksThisDay) {
        // Specialist does NOT work on this day: 100% booked / no disponible
        isBooked = true;
        bookedByClient = 'No atiende este día';
      } else {
        // Booked if the chosen specialist has an active appointment or a slot lock at this slot
        const chosenBooking = matchingApts.find((a) => a.specialistId === specialistId);
        const isLocked = matchingLocks.some((l) => l.specialistId === specialistId);
        if (chosenBooking || isLocked) {
          isBooked = true;
          bookedByClient = chosenBooking?.clientName;
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
  specialistsList: Specialist[] = SPECIALISTS
): number {
  const slots = computeSlotAvailability(dayOption, specialistId, appointments, slotLocks, now, specialistsList);
  return slots.filter((s) => s.status === 'available').length;
}
