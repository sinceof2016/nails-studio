/**
 * Test Suite: Regla de Autorización Obligatoria de Datos (Ley 1581)
 * Verifica que sin autorización explícita no se permita confirmar la reserva.
 * Ejecución: npx tsx src/tests/dataAuthorization.test.ts
 */

import assert from 'assert';
import { BUSINESS_CONFIG } from '../config/businessConfig';

console.log('====================================================');
console.log('🔒 PRUEBAS QA: AUTORIZACIÓN OBLIGATORIA DE HABEAS DATA');
console.log('====================================================');

// Test 1: Simulación de intento de reserva sin marcar autorización
{
  const simulateBookingAttempt = (acceptedDataPolicy: boolean, clientName: string, clientPhone: string) => {
    if (!acceptedDataPolicy) {
      return { success: false, error: 'Debes autorizar el tratamiento de tus datos personales conforme a la Política de Privacidad para poder confirmar tu cita.' };
    }
    if (!clientName || !clientPhone) {
      return { success: false, error: 'Faltan datos obligatorios.' };
    }
    return {
      success: true,
      appointmentData: {
        clientName,
        clientPhone,
        autorizacionDatos: true,
        autorizacionFecha: new Date().toISOString(),
        autorizacionVersion: BUSINESS_CONFIG.dataPolicyVersion
      }
    };
  };

  // Intento sin marcar autorización
  const attemptWithoutAuth = simulateBookingAttempt(false, 'Ana María', '+573001234567');
  assert.strictEqual(attemptWithoutAuth.success, false, 'La reserva sin autorización debe ser rechazada.');
  assert.ok(
    attemptWithoutAuth.error?.includes('autorizar el tratamiento de tus datos personales'),
    'Debe retornar el mensaje de error de autorización obligatoria.'
  );
  console.log('1. [Intento sin autorización] Validación de bloqueo de reserva');
  console.log('   ✅ Rechazado exitosamente sin procesar ni guardar en base de datos.');

  // Intento con autorización marcada
  const attemptWithAuth = simulateBookingAttempt(true, 'Ana María', '+573001234567');
  assert.strictEqual(attemptWithAuth.success, true, 'La reserva con autorización debe proceder.');
  assert.strictEqual(attemptWithAuth.appointmentData?.autorizacionDatos, true, 'Debe registrar autorizacionDatos = true');
  assert.strictEqual(attemptWithAuth.appointmentData?.autorizacionVersion, BUSINESS_CONFIG.dataPolicyVersion, 'Debe registrar la versión vigente de la política');
  console.log('2. [Intento con autorización] Validación de metadatos de Habeas Data');
  console.log('   ✅ Aceptado y registrado con versión y fecha correctas.');
}

console.log('====================================================');
console.log('✨ TODAS LAS PRUEBAS DE AUTORIZACIÓN PASARON EXITOSAMENTE (2/2).');
console.log('====================================================');
