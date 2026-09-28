import { Appointment, Specialist } from '../types';
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
  isBooked: boolean; // Is this slot booked for the selected specialist?
  bookedByClient?: string;
  availableSpecialistIds: string[]; // Other specialists free at this exact hour
  status: 'available' | 'booked' | 'passed';
}

// Fixed 1-hour interval slots for Aura Nails & Spa
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

export function datesMatch(aptDate: string, selectedDateLabel: string): boolean {
  if (!aptDate || !selectedDateLabel) return false;
  const cleanApt = normalizeDateString(aptDate);
  const cleanSel = normalizeDateString(selectedDateLabel);

  // Exact or contains match
  if (cleanApt === cleanSel) return true;
  if (cleanApt.includes('hoy') && cleanSel.includes('hoy')) return true;
  if (cleanApt.includes('mañana') && cleanSel.includes('mañana')) return true;

  // Extract day number (e.g. "28")
  const numApt = cleanApt.match(/\d+/)?.[0];
  const numSel = cleanSel.match(/\d+/)?.[0];
  if (numApt && numSel && numApt === numSel) return true;

  return false;
}

// Calculate availability for every slot for a given specialist and date
export function computeSlotAvailability(
  selectedDateOption: CalendarDayOption,
  specialistId: string, // specialist id or 'any'
  appointments: Appointment[],
  now: Date = new Date()
): SlotAvailability[] {
  const isToday = selectedDateOption.isToday;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

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
        datesMatch(a.date, selectedDateOption.full)
    );

    // Booked specialists at this hour
    const bookedSpecialistIds = matchingApts.map((a) => a.specialistId);

    // Available specialists at this hour (among those not booked and not passed)
    const availableSpecialistIds = SPECIALISTS
      .filter((s) => !bookedSpecialistIds.includes(s.id))
      .map((s) => s.id);

    let isBooked = false;
    let bookedByClient: string | undefined;

    if (specialistId === 'any') {
      // If 'any' specialist is chosen, it is booked only if ALL specialists are booked
      isBooked = availableSpecialistIds.length === 0;
    } else {
      // Booked if the chosen specialist has an active appointment at this slot
      const chosenBooking = matchingApts.find((a) => a.specialistId === specialistId);
      if (chosenBooking) {
        isBooked = true;
        bookedByClient = chosenBooking.clientName;
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
  appointments: Appointment[],
  now: Date = new Date()
): number {
  const slots = computeSlotAvailability(dayOption, specialistId, appointments, now);
  return slots.filter((s) => s.status === 'available').length;
}
