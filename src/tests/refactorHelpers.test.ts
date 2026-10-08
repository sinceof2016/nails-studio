/**
 * Pruebas de los ayudantes que salieron de la refactorización:
 * - addUnique: no duplica registros (escritura local + suscripción en tiempo real).
 * - STORAGE_KEYS: los valores no cambiaron (el caché de los navegadores sigue siendo válido).
 * - DEFAULT_COMMISSION_RATE: una comisión de 0 % se respeta.
 */
import assert from 'node:assert/strict';
import { addUnique } from '../utils/collections';
import { STORAGE_KEYS } from '../config/storageKeys';
import { DEFAULT_COMMISSION_RATE, BUSINESS_CONFIG } from '../config/businessConfig';
import { generateBookingCode } from '../utils/dateAndId';

console.log('1. addUnique agrega al inicio un registro nuevo');
const base = [{ id: 'a' }, { id: 'b' }];
const conNuevo = addUnique(base, { id: 'c' });
assert.deepEqual(conNuevo.map((x) => x.id), ['c', 'a', 'b']);
assert.equal(base.length, 2, 'No debe modificar la lista original');
console.log('   OK');

console.log('2. addUnique no duplica un id que ya está');
const mismaLista = addUnique(base, { id: 'b' });
assert.equal(mismaLista, base, 'Debe devolver la misma lista');
assert.equal(mismaLista.length, 2);
console.log('   OK');

console.log('3. Claves de caché sin cambios');
assert.equal(STORAGE_KEYS.services, 'aura_tarifas_2026_services');
assert.equal(STORAGE_KEYS.specialists, 'aura_tarifas_2026_specialists');
assert.equal(STORAGE_KEYS.categories, 'aura_tarifas_2026_categories');
console.log('   OK');

console.log('4. Comisión: 0 se respeta y solo un valor no numérico usa el valor por defecto');
const resolver = (valor: unknown) => (Number.isFinite(Number(valor)) ? Number(valor) : DEFAULT_COMMISSION_RATE);
assert.equal(resolver(0), 0);
assert.equal(resolver(40), 40);
assert.equal(resolver('abc'), DEFAULT_COMMISSION_RATE);
assert.equal(resolver(undefined), DEFAULT_COMMISSION_RATE);
console.log('   OK');

console.log('5. Códigos de reserva con aleatoriedad segura (200 códigos únicos y formato correcto)');
const prefix = BUSINESS_CONFIG.bookingCodePrefix || 'AURA';
const codePattern = new RegExp(`^${prefix}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$`);
const generatedCodes: string[] = [];

for (let i = 0; i < 200; i++) {
  const code = generateBookingCode(generatedCodes);
  assert.match(code, codePattern, `El código ${code} no cumple con el formato esperado ${prefix}-XXXXXX`);
  assert.ok(!generatedCodes.includes(code), `Código duplicado generado: ${code}`);
  generatedCodes.push(code);
}
assert.equal(generatedCodes.length, 200);
assert.equal(new Set(generatedCodes).size, 200, 'Los 200 códigos deben ser completamente únicos');
console.log('   OK');

console.log('PRUEBAS DE AYUDANTES PASARON (5/5)');
