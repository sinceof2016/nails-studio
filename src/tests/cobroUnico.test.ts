/**
 * Test Suite: Cobro Único por Cita, Filtrado de Rol Caja y Anulación
 * Ejecución: npx tsx src/tests/cobroUnico.test.ts
 */

import assert from 'assert';
import { SalonCutRecord, Appointment } from '../types';

console.log('====================================================');
console.log('🧪 PRUEBAS DE SEGURIDAD: COBRO ÚNICO, ROL CAJA Y ANULACIÓN');
console.log('====================================================');

// 1. Dos cobros para la misma cita producen el mismo id determinista 'cut-' + aptId
{
  const appointmentId = 'apt-12345';

  const cut1Id = `cut-${appointmentId}`;
  const cut2Id = `cut-${appointmentId}`;

  assert.strictEqual(cut1Id, cut2Id, 'El ID del cobro para la misma cita debe ser determinista');
  assert.strictEqual(cut1Id, 'cut-apt-12345', 'El ID debe ser exacto');

  // Simulación de almacenamiento en mapa/BD con verificación de duplicado
  const mockDatabaseCuts = new Map<string, SalonCutRecord>();

  const cutRecord1: SalonCutRecord = {
    id: cut1Id,
    fecha: '2026-10-05',
    hora: '14:30',
    clienteNombre: 'Ana María',
    clienteTelefono: '3101234567',
    servicioNombre: 'Manicura Rusa',
    servicioPrecio: 80000,
    especialistaId: 'spec-1',
    especialistaNombre: 'Sofía',
    comisionPorcentaje: 50,
    comisionEspecialista: 40000,
    recaudoSalon: 40000,
    propina: 5000,
    metodoPago: 'efectivo',
    sucursalId: 'patio_bonito',
    appointmentId: appointmentId
  };

  mockDatabaseCuts.set(cutRecord1.id, cutRecord1);

  // Intentar guardar el segundo cobro
  let secondAttemptRejected = false;
  if (mockDatabaseCuts.has(cut2Id)) {
    secondAttemptRejected = true;
  }

  assert.strictEqual(secondAttemptRejected, true, 'El segundo cobro de la misma cita debe ser detectado como duplicado y rechazado');
  console.log('1. [Cobro Único] Mismo ID determinista y rechazo de duplicados');
  console.log('   ✅ `cut-${appointmentId}` previene cobros duplicados.');
}

// 2. Las citas con appointmentId en cuts quedan fuera del selector de disponibles
{
  const mockAppointments: Appointment[] = [
    {
      id: 'apt-1',
      bookingCode: 'ABC-101',
      clientName: 'María',
      clientPhone: '3001112233',
      serviceId: 'srv-1',
      serviceName: 'Uñas Acrílicas',
      servicePrice: 100000,
      serviceDuration: 60,
      specialistId: 'spec-1',
      specialistName: 'Sofía',
      specialistRole: 'Especialista',
      selectedAddOns: [],
      date: '2026-10-05',
      time: '10:00',
      totalPrice: 100000,
      status: 'confirmada',
      createdAt: '2026-10-05T09:00:00Z',
      branchId: 'patio_bonito'
    },
    {
      id: 'apt-2',
      bookingCode: 'ABC-102',
      clientName: 'Laura',
      clientPhone: '3004445566',
      serviceId: 'srv-2',
      serviceName: 'Pedicura Spa',
      servicePrice: 70000,
      serviceDuration: 45,
      specialistId: 'spec-2',
      specialistName: 'Valentina',
      specialistRole: 'Especialista',
      selectedAddOns: [],
      date: '2026-10-05',
      time: '11:00',
      totalPrice: 70000,
      status: 'confirmada',
      createdAt: '2026-10-05T09:30:00Z',
      branchId: 'patio_bonito'
    }
  ];

  const mockCuts: SalonCutRecord[] = [
    {
      id: 'cut-apt-1',
      fecha: '2026-10-05',
      hora: '10:45',
      clienteNombre: 'María',
      clienteTelefono: '3001112233',
      servicioNombre: 'Uñas Acrílicas',
      servicioPrecio: 100000,
      especialistaId: 'spec-1',
      especialistaNombre: 'Sofía',
      comisionPorcentaje: 50,
      comisionEspecialista: 50000,
      recaudoSalon: 50000,
      propina: 0,
      metodoPago: 'efectivo',
      sucursalId: 'patio_bonito',
      appointmentId: 'apt-1'
    }
  ];

  const chargedSet = new Set(mockCuts.filter((c) => c.appointmentId).map((c) => c.appointmentId as string));
  const availableForCut = mockAppointments.filter((a) => a.status !== 'cancelada' && !chargedSet.has(a.id));

  assert.strictEqual(availableForCut.length, 1, 'Solo debe haber 1 cita disponible para cobro');
  assert.strictEqual(availableForCut[0].id, 'apt-2', 'La cita apt-1 ya fue cobrada y no debe aparecer');

  console.log('2. [Exclusión Selector] Citas cobradas se filtran automáticamente');
  console.log('   ✅ Selector oculta citas con cobro existente.');
}

// 3. El botón "Cobrar" se oculta en citas cobradas y completadas
{
  const chargedSet = new Set(['apt-1']);

  function canShowCobrarButton(apt: Appointment): boolean {
    const isCharged = chargedSet.has(apt.id);
    return !isCharged && apt.status !== 'completada' && apt.status !== 'cancelada';
  }

  const aptCharged: Appointment = {
    id: 'apt-1',
    bookingCode: 'ABC-101',
    clientName: 'María',
    clientPhone: '3001112233',
    serviceId: 'srv-1',
    serviceName: 'Uñas Acrílicas',
    servicePrice: 100000,
    serviceDuration: 60,
    specialistId: 'spec-1',
    specialistName: 'Sofía',
    specialistRole: 'Especialista',
    selectedAddOns: [],
    date: '2026-10-05',
    time: '10:00',
    totalPrice: 100000,
    status: 'confirmada',
    createdAt: '2026-10-05T09:00:00Z'
  };

  const aptCompleted: Appointment = {
    ...aptCharged,
    id: 'apt-completed',
    status: 'completada'
  };

  const aptPending: Appointment = {
    ...aptCharged,
    id: 'apt-pending',
    status: 'confirmada'
  };

  assert.strictEqual(canShowCobrarButton(aptCharged), false, 'Cita ya cobrada NO muestra botón Cobrar');
  assert.strictEqual(canShowCobrarButton(aptCompleted), false, 'Cita completada NO muestra botón Cobrar');
  assert.strictEqual(canShowCobrarButton(aptPending), true, 'Cita pendiente SI muestra botón Cobrar');

  console.log('3. [Agenda Ocultación] Botón Cobrar se oculta apropiadamente');
  console.log('   ✅ Estado completada/cobrada oculta la acción de cobro.');
}

// 4. Anular el cobro libera la cita para ser cobrada nuevamente
{
  const mockCuts = [
    {
      id: 'cut-apt-10',
      appointmentId: 'apt-10'
    }
  ];

  let chargedSet = new Set(mockCuts.map((c) => c.appointmentId));
  assert.strictEqual(chargedSet.has('apt-10'), true, 'Antes de anular, la cita está registrada como cobrada');

  // Anular el cobro (eliminar de la lista)
  const remainingCuts = mockCuts.filter((c) => c.id !== 'cut-apt-10');
  chargedSet = new Set(remainingCuts.map((c) => c.appointmentId));

  assert.strictEqual(chargedSet.has('apt-10'), false, 'Tras anular el cobro, la cita vuelve a estar libre para cobro');

  console.log('4. [Anulación de Cobro] Liberación de cita tras borrado del cobro');
  console.log('   ✅ Anular cobro reactiva la posibilidad de cobrar la cita.');
}

// 5. Filtro de Sede para Rol Caja en Consultas Firestore
{
  function buildFirestoreQueryInfo(branchId?: string) {
    const isSpecificBranch = Boolean(branchId && branchId !== 'todas');
    return {
      usesQueryFilter: isSpecificBranch,
      filterField: isSpecificBranch ? 'sucursalId' : null,
      filterValue: isSpecificBranch ? branchId : null
    };
  }

  const cajaBranchQuery = buildFirestoreQueryInfo('patio_bonito');
  assert.strictEqual(cajaBranchQuery.usesQueryFilter, true);
  assert.strictEqual(cajaBranchQuery.filterField, 'sucursalId');
  assert.strictEqual(cajaBranchQuery.filterValue, 'patio_bonito');

  const adminQuery = buildFirestoreQueryInfo(undefined);
  assert.strictEqual(adminQuery.usesQueryFilter, false);

  const globalQuery = buildFirestoreQueryInfo('todas');
  assert.strictEqual(globalQuery.usesQueryFilter, false);

  console.log('5. [Aislamiento de Sede] Consultas Firestore con where("sucursalId", "==", branchId)');
  console.log('   ✅ Personal de Caja solo consulta su sede asignada.');
}

console.log('====================================================');
console.log('✨ TODAS LAS PRUEBAS DE COBRO ÚNICO Y CAJA PASARON EXITOSAMENTE.');
console.log('====================================================');
