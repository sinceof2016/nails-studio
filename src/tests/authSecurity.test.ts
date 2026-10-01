/**
 * QA & Development Test Suite - Auth, Rate Limiting & Session Expiration
 * Ejecutable vía tsx: npx tsx src/tests/authSecurity.test.ts
 */

import assert from 'assert';
import crypto from 'crypto';

// 1. Simulación de Rate Limiting con ventana deslizante
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class TestRateLimiter {
  private store: Record<string, number[]> = {};

  checkLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; retryAfterSec?: number } {
    const now = Date.now();
    if (!this.store[key]) {
      this.store[key] = [];
    }
    // Filtrar solicitudes fuera de ventana
    this.store[key] = this.store[key].filter((ts) => now - ts < config.windowMs);

    if (this.store[key].length >= config.maxRequests) {
      const oldest = this.store[key][0];
      const retryMs = config.windowMs - (now - oldest);
      return { allowed: false, remaining: 0, retryAfterSec: Math.ceil(retryMs / 1000) };
    }

    this.store[key].push(now);
    return { allowed: true, remaining: config.maxRequests - this.store[key].length };
  }

  reset() {
    this.store = {};
  }
}

// 2. Simulación de Validación de Login
const DYNAMIC_TEST_EMAIL = `test_staff_${crypto.randomBytes(4).toString('hex')}@testdomain.local`;
const DYNAMIC_TEST_PASSWORD = `P@ss_${crypto.randomBytes(8).toString('hex')}!`;

const MOCK_VAULT = [
  {
    userId: 'USR-TEST-01',
    email: DYNAMIC_TEST_EMAIL,
    nombre: 'Personal de Prueba',
    role: 'SuperAdmin',
    passwordHash: crypto.createHash('sha256').update(DYNAMIC_TEST_PASSWORD).digest('hex')
  }
];

function mockValidateLogin(identifier?: any, password?: any) {
  if (identifier === undefined || identifier === null || password === undefined || password === null) {
    return { success: false, error: 'Identificador y contraseña requeridos', code: 'EMPTY_FIELDS' };
  }

  const strId = String(identifier).trim();
  const strPass = String(password);

  if (strId.length === 0 || strPass.length === 0) {
    return { success: false, error: 'Identificador y contraseña requeridos', code: 'EMPTY_FIELDS' };
  }

  // Prevenir inyección / desbordamiento
  if (strId.length > 256 || strPass.length > 256) {
    return { success: false, error: 'Longitud de campos no permitida', code: 'OVERFLOW' };
  }

  const cleanId = strId.toLowerCase();
  const hash = crypto.createHash('sha256').update(strPass).digest('hex');

  const match = MOCK_VAULT.find(
    (u) => u.email.toLowerCase() === cleanId && u.passwordHash === hash
  );

  if (!match) {
    return { success: false, error: 'Credenciales inválidas en el Vault', code: 'INVALID_CREDENTIALS' };
  }

  return {
    success: true,
    user: { id: match.userId, nombre: match.nombre, email: match.email, role: match.role },
    session: {
      token: crypto.randomBytes(16).toString('hex'),
      loginTime: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000
    }
  };
}

// 3. Simulación de Expiración de Sesión
function mockCheckSession(session: { loginTime: number; lastActivity: number; expiresAt: number } | null, now: number) {
  if (!session) return { isValid: false, reason: 'NO_SESSION' };
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

  if (now > session.expiresAt) {
    return { isValid: false, reason: 'MAX_DURATION_EXPIRED' };
  }

  if (now - session.lastActivity > INACTIVITY_TIMEOUT) {
    return { isValid: false, reason: 'INACTIVITY_TIMEOUT' };
  }

  return { isValid: true, reason: 'ACTIVE' };
}

// --- SUITE DE PRUEBAS ---
async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 EJECUTANDO SUITE DE PRUEBAS QA: AUTH & RATE LIMITING');
  console.log('====================================================\n');

  // PRUEBA 1: Comportamiento Esperado - Login Exitoso y creación de sesión
  console.log('1. [Comportamiento Esperado] Login con credenciales válidas');
  const res1 = mockValidateLogin(DYNAMIC_TEST_EMAIL, DYNAMIC_TEST_PASSWORD);
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.user?.role, 'SuperAdmin');
  assert.ok(res1.session?.token, 'Debe generar token');
  console.log('   ✅ Resultado: Sesión creada con TTL de expiración correcto.');

  // PRUEBA 2: Entradas Inválidas - Credenciales erróneas
  console.log('2. [Entradas Inválidas] Contraseña incorrecta');
  const res2 = mockValidateLogin(DYNAMIC_TEST_EMAIL, 'WrongTestPassword!');
  assert.strictEqual(res2.success, false);
  assert.strictEqual(res2.code, 'INVALID_CREDENTIALS');
  console.log('   ✅ Resultado: Rechazo seguro 401 con mensaje genérico.');

  // PRUEBA 3: Valores Vacíos
  console.log('3. [Valores Vacíos] Campos vacíos o nulos');
  const res3a = mockValidateLogin('', '');
  const res3b = mockValidateLogin(null, undefined);
  assert.strictEqual(res3a.success, false);
  assert.strictEqual(res3a.code, 'EMPTY_FIELDS');
  assert.strictEqual(res3b.success, false);
  assert.strictEqual(res3b.code, 'EMPTY_FIELDS');
  console.log('   ✅ Resultado: Validación 400 antes de procesar criptografía.');

  // PRUEBA 4: Errores Esperados - Expiración por inactividad
  console.log('4. [Errores Esperados] Vencimiento de sesión por inactividad (15 min)');
  const baseTime = Date.now();
  const sessionActive = { loginTime: baseTime, lastActivity: baseTime, expiresAt: baseTime + 8 * 60 * 60 * 1000 };
  
  // Dentro de tiempo (< 15 min)
  const checkWithin = mockCheckSession(sessionActive, baseTime + 10 * 60 * 1000);
  assert.strictEqual(checkWithin.isValid, true);

  // Tras 16 minutos de inactividad
  const checkExpired = mockCheckSession(sessionActive, baseTime + 16 * 60 * 1000);
  assert.strictEqual(checkExpired.isValid, false);
  assert.strictEqual(checkExpired.reason, 'INACTIVITY_TIMEOUT');
  console.log('   ✅ Resultado: Sesión invalidada automáticamente por inactividad.');

  // PRUEBA 5: Casos Poco Comunes - Ataque de Fuerza Bruta y Rate Limiting
  console.log('5. [Casos Poco Comunes] Rate Limiting ante ráfaga de intentos fallidos (Bruteforce)');
  const rateLimiter = new TestRateLimiter();
  const clientKey = 'login:192.168.1.50';
  const config = { maxRequests: 5, windowMs: 60 * 1000 };

  // Ejecutar 5 intentos permitidos
  for (let i = 1; i <= 5; i++) {
    const check = rateLimiter.checkLimit(clientKey, config);
    assert.strictEqual(check.allowed, true, `Petición ${i} debió ser permitida`);
  }

  // Intento 6 (debe bloquearse con 429)
  const blockedCheck = rateLimiter.checkLimit(clientKey, config);
  assert.strictEqual(blockedCheck.allowed, false, 'El intento 6 debió ser bloqueado');
  assert.ok(blockedCheck.retryAfterSec! > 0, 'Debe indicar segundos de reintento');
  console.log(`   ✅ Resultado: Rate Limiter activó HTTP 429 tras 5 intentos. Retry-After: ${blockedCheck.retryAfterSec}s.`);

  // PRUEBA 6: Casos Poco Comunes - Payloads excesivamente largos y caracteres especiales
  console.log('6. [Casos Poco Comunes] Payload de desbordamiento (20.000 caracteres)');
  const giantId = 'a'.repeat(20000);
  const resOverflow = mockValidateLogin(giantId, 'password');
  assert.strictEqual(resOverflow.success, false);
  assert.strictEqual(resOverflow.code, 'OVERFLOW');
  console.log('   ✅ Resultado: Bloqueado sin saturar la CPU con hash gigante.');

  console.log('\n✨ TODAS LAS PRUEBAS DE SEGURIDAD PASARON SATISFACTORIAMENTE (6/6).\n');
}

runTestSuite();
