/**
 * Pruebas de la agenda: horario 10:00 a. m. a 6:00 p. m. (cierre 7:00 p. m.), servicios largos que ocupan
 * varias horas, rotación de domingos, días de descanso y bloqueos de agenda.
 */
import assert from 'node:assert/strict';
import {
  HOURLY_TIME_SLOTS,
  slotsNeeded,
  getCoveredSlots,
  getOccupiedSlots,
  getSundayGroupIndex,
  isSpecialistWorkingOnDay,
  isSpecialistBlockedOnDate,
  computeSlotAvailability,
  countFreeSlots,
  CalendarDayOption
} from '../utils/calendarAvailability';
import { Appointment, Specialist, SlotLock, AgendaBlock } from '../types';

const spec = (id: string, availableDays: string[]): Specialist =>
  ({
    id,
    name: id,
    role: 'Manicurista',
    rating: 5,
    reviewsCount: 0,
    avatar: '',
    bio: '',
    certifications: [],
    availableDays,
    specialties: [],
    commissionRate: 50
  }) as Specialist;

const TODOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
// Como están hoy en Firestore: todas con todos los días, y Diana sin viernes ni sábado.
// Los descansos fijos salen de WEEKLY_REST_DAYS (agendaConfig.ts) y mandan sobre estos días guardados.
const dayana = spec('dayana', TODOS);
const natalia = spec('natalia', TODOS);
const geraldine = spec('geraldine', TODOS);
const diana = spec('diana', ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Domingo']);
const equipo = [dayana, natalia, geraldine, diana];

const dia = (id: string, isToday = false): CalendarDayOption => {
  const [y, m, d] = id.split('-').map(Number);
  return { id, label: id, dayName: id, dateNum: String(d), full: id, dayOfWeek: '', isToday, dateObj: new Date(y, m - 1, d) };
};
const trabajan = (fecha: string, bloqueos: AgendaBlock[] = []) =>
  equipo.filter((s) => isSpecialistWorkingOnDay(s, dia(fecha), bloqueos)).map((s) => s.id).sort();

console.log('1. Horario: 10:00 AM a 06:00 PM (9 horarios), sin 8, 9 ni 7 de la noche');
assert.deepEqual(HOURLY_TIME_SLOTS, ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM']);
console.log('   OK');

console.log('2. Duración de los servicios: cuántas horas ocupan');
assert.equal(slotsNeeded(10), 1);
assert.equal(slotsNeeded(60), 1);
assert.equal(slotsNeeded(61), 2);
assert.equal(slotsNeeded(105), 2);
assert.equal(slotsNeeded(120), 2);
assert.equal(slotsNeeded(121), 2, 'Nunca más de 2 horarios: las reglas y el formulario limitan los servicios a 120 minutos');
assert.equal(slotsNeeded(999), 2);
assert.equal(slotsNeeded(undefined), 1);
assert.deepEqual(getCoveredSlots('03:00 PM', 120), ['03:00 PM', '04:00 PM']);
assert.deepEqual(getCoveredSlots('06:00 PM', 60), ['06:00 PM']);
assert.equal(getCoveredSlots('06:00 PM', 120), null, 'Un servicio de 2 h a las 6 p. m. terminaría a las 8, después del cierre');
assert.equal(getCoveredSlots('05:00 PM', 120) !== null, true, 'A las 5 p. m. un servicio de 2 h termina a las 7: cabe');
assert.deepEqual(getOccupiedSlots('06:00 PM', 120), ['06:00 PM'], 'Una cita ya guardada se recorta en el cierre');
console.log('   OK');

console.log('3. Rotación de domingos (Dayana y Natalia el 11 de octubre; después Diana y Geraldine, y así)');
assert.equal(getSundayGroupIndex('2026-10-11'), 0);
assert.equal(getSundayGroupIndex('2026-10-18'), 1);
assert.equal(getSundayGroupIndex('2026-10-25'), 0);
assert.equal(getSundayGroupIndex('2026-11-01'), 1);
assert.equal(getSundayGroupIndex('2026-10-04'), 1, 'El domingo anterior toca el segundo grupo');
assert.equal(getSundayGroupIndex('2027-01-03'), 0, 'Cruza de año sin romperse (12 semanas después del 11 de octubre)');
assert.equal(getSundayGroupIndex('2027-01-10'), 1, 'Y la semana siguiente toca el otro grupo');
assert.equal(getSundayGroupIndex('2026-10-12'), null, 'Un lunes no es domingo');
assert.deepEqual(trabajan('2026-10-11'), ['dayana', 'natalia']);
assert.deepEqual(trabajan('2026-10-18'), ['diana', 'geraldine']);
assert.deepEqual(trabajan('2026-10-25'), ['dayana', 'natalia']);
assert.deepEqual(trabajan('2026-11-01'), ['diana', 'geraldine']);
console.log('   OK');

console.log('4. Descansos semanales: Dayana y Natalia el miércoles, Geraldine el lunes, Diana sin día fijo (mandan sobre los días guardados en Firestore)');
assert.deepEqual(trabajan('2026-10-14'), ['diana', 'geraldine'], 'Miércoles 14: descansan Dayana y Natalia');
assert.deepEqual(trabajan('2026-10-12'), ['dayana', 'diana', 'natalia'], 'Lunes 12: descansa Geraldine');
assert.deepEqual(trabajan('2026-10-13'), ['dayana', 'diana', 'geraldine', 'natalia'], 'Martes 13: trabajan todas');
assert.deepEqual(trabajan('2026-10-16'), ['dayana', 'diana', 'geraldine', 'natalia'], 'Viernes 16: Diana trabaja aunque en Firestore no tenga viernes');
assert.deepEqual(trabajan('2026-10-17'), ['dayana', 'diana', 'geraldine', 'natalia'], 'Sábado 17: Diana trabaja aunque en Firestore no tenga sábado');
assert.deepEqual(trabajan('2026-10-21'), ['diana', 'geraldine'], 'Miércoles 21: descansan Dayana y Natalia otra semana');
assert.deepEqual(trabajan('2026-10-19'), ['dayana', 'diana', 'natalia'], 'Lunes 19: descansa Geraldine otra semana');
const nueva = spec('nueva-especialista', ['Lunes']);
assert.equal(isSpecialistWorkingOnDay(nueva, dia('2026-10-12')), true, 'Una especialista que no está en la configuración usa sus días de Firestore (lunes sí)');
assert.equal(isSpecialistWorkingOnDay(nueva, dia('2026-10-13')), false, '... y martes no');
console.log('   OK');

console.log('5. Bloqueo de agenda: solo afecta a esa especialista y a ese día');
const bloqueos: AgendaBlock[] = [{ id: '2026-10-13_diana', specialistId: 'diana', date: '2026-10-13' }];
assert.deepEqual(trabajan('2026-10-13', bloqueos), ['dayana', 'geraldine', 'natalia']);
assert.deepEqual(trabajan('2026-10-14', bloqueos), ['diana', 'geraldine'], 'Otro día no se afecta');
assert.equal(isSpecialistBlockedOnDate('diana', '2026-10-13', bloqueos), true);
assert.equal(isSpecialistBlockedOnDate('dayana', '2026-10-13', bloqueos), false);
const bloqueoDomingo: AgendaBlock[] = [{ id: '2026-10-11_dayana', specialistId: 'dayana', date: '2026-10-11' }];
assert.deepEqual(trabajan('2026-10-11', bloqueoDomingo), ['natalia'], 'El bloqueo también vale en domingo');
console.log('   OK');

console.log('6. Disponibilidad de un servicio de 1 hora (martes 13, trabajan todas)');
const martes = dia('2026-10-13');
const antes = new Date(2026, 9, 1, 8, 0);
let slots = computeSlotAvailability(martes, 'dayana', [], [], antes, equipo, 60, []);
assert.equal(slots.length, 9);
assert.equal(slots.every((s) => s.status === 'available'), true);
console.log('   OK');

console.log('7. Servicio de 2 horas: no se ofrece a las 6 p. m. y sí a las 5 p. m.');
slots = computeSlotAvailability(martes, 'dayana', [], [], antes, equipo, 120, []);
assert.equal(slots.find((s) => s.slot === '06:00 PM')?.status, 'booked');
assert.equal(slots.find((s) => s.slot === '05:00 PM')?.status, 'available');
assert.equal(countFreeSlots(martes, 'dayana', [], [], antes, equipo, 120, []), 8);
console.log('   OK');

console.log('8. Una cita de 2 horas ocupa las dos horas (los bloqueos públicos traen una por hora)');
const locks: SlotLock[] = [
  { appointmentId: 'a1', slot: '03:00 PM', date: '2026-10-13', specialistId: 'dayana', createdAt: '' },
  { appointmentId: 'a1', slot: '04:00 PM', date: '2026-10-13', specialistId: 'dayana', createdAt: '' }
];
slots = computeSlotAvailability(martes, 'dayana', [], locks, antes, equipo, 60, []);
assert.equal(slots.find((s) => s.slot === '03:00 PM')?.status, 'booked');
assert.equal(slots.find((s) => s.slot === '04:00 PM')?.status, 'booked');
assert.equal(slots.find((s) => s.slot === '05:00 PM')?.status, 'available');
assert.equal(slots.find((s) => s.slot === '02:00 PM')?.status, 'available');
console.log('   OK');

console.log('9. Un servicio de 2 horas no puede empezar justo antes de una hora ocupada');
slots = computeSlotAvailability(martes, 'dayana', [], locks, antes, equipo, 120, []);
assert.equal(slots.find((s) => s.slot === '02:00 PM')?.status, 'booked', 'Empezar a las 2 pisaría las 3, que está ocupada');
assert.equal(slots.find((s) => s.slot === '01:00 PM')?.status, 'available', 'Empezar a la 1 termina a las 3: cabe');
console.log('   OK');

console.log('10. Staff: una cita legada de 2 horas (sin bloqueos públicos) también ocupa las dos horas');
const cita = {
  id: 'a2', serviceId: 's', serviceName: 'Acrílico', servicePrice: 1, serviceDuration: 120, specialistId: 'diana',
  specialistName: 'Diana', specialistRole: '', date: '2026-10-13', time: '11:00 AM', clientName: 'Ana', clientPhone: '3000000000',
  selectedAddOns: [], totalPrice: 1, status: 'confirmada', bookingCode: 'X', createdAt: ''
} as Appointment;
slots = computeSlotAvailability(martes, 'diana', [cita], [], antes, equipo, 60, []);
assert.equal(slots.find((s) => s.slot === '11:00 AM')?.status, 'booked');
assert.equal(slots.find((s) => s.slot === '11:00 AM')?.bookedByClient, 'Ana');
assert.equal(slots.find((s) => s.slot === '12:00 PM')?.status, 'booked');
assert.equal(slots.find((s) => s.slot === '01:00 PM')?.status, 'available');
const cancelada = { ...cita, status: 'cancelada' } as Appointment;
slots = computeSlotAvailability(martes, 'diana', [cancelada], [], antes, equipo, 60, []);
assert.equal(slots.every((s) => s.status === 'available'), true, 'Una cita cancelada no ocupa');
console.log('   OK');

console.log('11. "Cualquier especialista": solo las que tienen libres todas las horas del servicio');
slots = computeSlotAvailability(martes, 'any', [], locks, antes, equipo, 120, []);
const a3 = slots.find((s) => s.slot === '03:00 PM');
assert.deepEqual([...(a3?.availableSpecialistIds || [])].sort(), ['diana', 'geraldine', 'natalia']);
slots = computeSlotAvailability(martes, 'any', [], locks, antes, equipo, 120, bloqueos);
const b3 = slots.find((s) => s.slot === '03:00 PM');
assert.deepEqual([...(b3?.availableSpecialistIds || [])].sort(), ['geraldine', 'natalia'], 'Diana bloqueada ese día');
console.log('   OK');

console.log('12. Día de descanso o bloqueo: toda la agenda de esa especialista aparece "Reservado"');
const miercoles = dia('2026-10-14');
slots = computeSlotAvailability(miercoles, 'dayana', [], [], antes, equipo, 60, []);
assert.equal(slots.every((s) => s.status === 'booked' && s.bookedByClient === 'Reservado'), true);
slots = computeSlotAvailability(martes, 'diana', [], [], antes, equipo, 60, bloqueos);
assert.equal(slots.every((s) => s.status === 'booked' && s.bookedByClient === 'Reservado'), true);
console.log('   OK');

console.log('13. Domingo 11: Diana no trabaja y Dayana sí; domingo 18 al revés');
const dom11 = dia('2026-10-11');
const dom18 = dia('2026-10-18');
assert.equal(countFreeSlots(dom11, 'diana', [], [], antes, equipo, 60, []), 0);
assert.equal(countFreeSlots(dom11, 'dayana', [], [], antes, equipo, 60, []), 9);
assert.equal(countFreeSlots(dom18, 'dayana', [], [], antes, equipo, 60, []), 0);
assert.equal(countFreeSlots(dom18, 'geraldine', [], [], antes, equipo, 60, []), 9);
console.log('   OK');

console.log('14. Hoy: los horarios que ya pasaron salen como "passed"');
const hoy = dia('2026-10-13', true);
slots = computeSlotAvailability(hoy, 'dayana', [], [], new Date(2026, 9, 13, 13, 30), equipo, 60, []);
assert.equal(slots.find((s) => s.slot === '12:00 PM')?.status, 'passed');
assert.equal(slots.find((s) => s.slot === '01:00 PM')?.status, 'passed');
assert.equal(slots.find((s) => s.slot === '02:00 PM')?.status, 'available');
console.log('   OK');

console.log('PRUEBAS DE AGENDA PASARON (14/14)');
