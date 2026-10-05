/**
 * Test Suite: Validación Integral de Texto Plano y Mitigación CSV Formula Injection
 * Ejecución: npx tsx src/tests/textoPlano.test.ts
 */

import assert from 'assert';
import { validateOnlyPlainText, sanitizeToPlainText, validateAndClean } from '../utils/security';
import { escapeCell, formatCsvContent, downloadCsv } from '../utils/exportCsv';

console.log('====================================================');
console.log('🛡️ PRUEBAS DE SEGURIDAD: TEXTO PLANO Y ANTI-INYECCIÓN CSV');
console.log('====================================================');

// 1. Entradas hostiles deben ser rechazadas por validateOnlyPlainText
{
  const hostilePayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '" onfocus=alert(1) x="',
    "' onmouseover='alert(1)",
    '<a href="x" onmouseover="alert(1)">x</a>',
    '<iframe src=//evil',
    '<svg/onload=alert(1)>',
    "{{constructor.constructor('alert(1)')()}}",
    '${7*7}',
    '=HYPERLINK("http://malicioso.com", "clic")',
    "+cmd|' /C calc'!A0",
    'DROP TABLE services;',
    "SELECT * FROM users WHERE '1'='1'"
  ];

  for (const payload of hostilePayloads) {
    const val = validateOnlyPlainText(payload, 'Campo Hostil');
    assert.strictEqual(
      val.isValid,
      false,
      `Debe rechazar la entrada hostil: "${payload}"`
    );

    const cleaned = sanitizeToPlainText(payload);
    assert.ok(
      !cleaned.includes('<script>') &&
      !cleaned.includes('onerror=') &&
      !cleaned.includes('javascript:') &&
      !cleaned.includes('onfocus=') &&
      !cleaned.includes('onclick='),
      `Sanitización debe dejar inocuo: "${payload}" -> "${cleaned}"`
    );

    const combined = validateAndClean(payload, 'Campo Hostil');
    assert.strictEqual(
      combined.ok,
      false,
      `validateAndClean debe fallar para: "${payload}"`
    );
  }
  console.log('1. [Entradas Hostiles] XSS, SQLi, Event Handlers y Fórmulas');
  console.log('   ✅ Todas rechazadas y neutralizadas.');
}

// 2. Entradas legítimas deben pasar sin falsos positivos
{
  const legitimateInputs = [
    'Petición = especial',
    'Razón = cambio de horario',
    'Pago online = 50000',
    'ondas = 3',
    'Ana <3 Pedro',
    'precio > 50 y < 100',
    'Si x<5 y y>2 entonces ok',
    'Color rojo -- sin brillo',
    'Ana María Gómez',
    'Uñas acrílicas con diseño francés',
    'Teléfono: 3101234567',
    'Servicio de manicura rusa con kapping + esmaltado'
  ];

  for (const input of legitimateInputs) {
    const val = validateOnlyPlainText(input, 'Texto Legítimo');
    assert.strictEqual(
      val.isValid,
      true,
      `Entrada legítima debe ser válida: "${input}", motivo: ${val.reason}`
    );

    const combined = validateAndClean(input, 'Texto Legítimo');
    assert.strictEqual(
      combined.ok,
      true,
      `validateAndClean debe ser ok para: "${input}"`
    );
    assert.strictEqual(
      combined.value,
      input.trim(),
      `Valor saneado no debe distorsionar el texto original`
    );
  }
  console.log('2. [Entradas Legítimas] "Petición = ...", "Razón = ...", "--", etc.');
  console.log('   ✅ Sin falsos positivos, aceptadas limpiamente.');
}

// 3. Mitigación de Inyección de Fórmulas en CSV
{
  // Celdas que inician con =, @, +, -, tab, \r como string deben anteponer '
  assert.strictEqual(escapeCell('=1+1'), `"'=1+1"`);
  assert.strictEqual(escapeCell('@SUM(A1)'), `"'@SUM(A1)"`);
  assert.strictEqual(escapeCell('-2'), `"'-2"`);
  assert.strictEqual(escapeCell('+cmd'), `"'+cmd"`);
  assert.strictEqual(escapeCell('\tsecret'), `"'\tsecret"`);
  assert.strictEqual(escapeCell('\rreturn'), `"'\rreturn"`);

  // Texto normal no lleva comilla simple antepuesta
  assert.strictEqual(escapeCell('Ana'), `"Ana"`);
  assert.strictEqual(escapeCell('Carolina Gómez'), `"Carolina Gómez"`);

  // Números (type number) deben permanecer intactos y sin comilla simple
  assert.strictEqual(escapeCell(-2), `"-2"`);
  assert.strictEqual(escapeCell(42), `"42"`);
  assert.strictEqual(escapeCell(95000), `"95000"`);
  assert.strictEqual(escapeCell(0), `"0"`);

  // Valores null / undefined
  assert.strictEqual(escapeCell(null), `""`);
  assert.strictEqual(escapeCell(undefined), `""`);

  // Test de matriz completa formateada con downloadCsv / formatCsvContent
  const testMatrix = [
    ['Nombre', 'Fórmula', 'Comando', 'Número', 'Saldo Negativo'],
    ['Ana', '=1+1', '@SUM(A1)', 42, -2],
    ['Pedro', '-2', '+cmd|calc', 100, '-500']
  ];

  const csv = formatCsvContent(testMatrix);
  assert.ok(csv.includes(`"Ana";"'=1+1";"'@SUM(A1)";"42";"-2"`), 'Fila 1 escapada correctamente');
  assert.ok(csv.includes(`"Pedro";"'-2";"'+cmd|calc";"100";"'-500"`), 'Fila 2 escapada correctamente');

  console.log('3. [CSV Formula Injection] Mitigación para Excel / Calc');
  console.log('   ✅ Caracteres de fórmula prefijados con comilla simple.');
  console.log('   ✅ Tipos numéricos protegidos e intactos.');
}

console.log('====================================================');
console.log('✨ TODAS LAS PRUEBAS DE TEXTO PLANO Y CSV PASARON EXITOSAMENTE.');
console.log('====================================================');
