/**
 * Security & Anti-Abuse Utility
 * Garantiza que toda información suministrada en formularios, notas, comentarios y campos
 * de texto se procese ÚNICAMENTE como texto plano y NUNCA como código ejecutable (Anti-XSS,
 * Anti-HTML Injection, Anti-Scripting, Anti-SQLi, Anti-Command Injection).
 */

// Patrones exhaustivos de código ejecutable, etiquetas HTML, scripts e inyecciones
// NOTA: No usamos el flag 'g' global para evitar el problema de estado mutable de RegExp.lastIndex en .test()
const EXECUTABLE_OR_TAG_PATTERNS = [
  /<\s*\/?\s*[a-zA-Z][^>]*>/i,                        // Cualquier etiqueta HTML/XML (<script>, <img>, <a>, <div>, etc.)
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,              // Bloque script
  /<iframe[\s\S]*?>/i,                                // iframes
  /<embed[\s\S]*?>/i,                                 // embed
  /<object[\s\S]*?>/i,                                // object
  /javascript\s*:/i,                                  // Pseudo-protocolo javascript:
  /vbscript\s*:/i,                                    // Pseudo-protocolo vbscript:
  /data\s*:\s*text\/(html|javascript)/i,              // Data URIs ejecutables
  /on[a-zA-Z]+\s*=/i,                                 // Event handlers inline: onload=, onerror=, onclick=, etc.
  /\b(eval|Function|execScript|setTimeout|setInterval)\s*\(/i, // Ejecutores directos de JavaScript
  /\b(document\.(location|cookie|write|createElement)|window\.(location|open))\b/i, // Manipulación del DOM
  /\b(alert|prompt|confirm)\s*\(/i,                   // Cuadros modales nativos
  /\$\{.*?\}/,                                        // Template string injection ES6
  /\{\{.*?\}\}/,                                      // Mustache / Angular / Handlebars injection
  /<%.*?%>/,                                          // JSP / EJS / ASP tags
  /\b(exec|system|passthru|shell_exec)\s*\(/i,        // Comandos shell de backend
  /(\b(DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+\w+\s+SET)\b)/i, // SQLi keywords
  /--\s*$/m,                                          // SQL comment
  /;\s*DROP\b/i,                                      // SQL drop injection
  /\brm\s+-rf\b/i,                                    // Unix command
  /\b(curl|wget)\s+http/i                             // Remote command fetch
];

/**
 * Valida de forma estricta que una cadena sea ÚNICAMENTE texto plano.
 * Si contiene etiquetas HTML, scripts o código ejecutable, retorna isValid: false con la razón.
 */
export function validateOnlyPlainText(
  text: string,
  fieldName: string = 'campo',
  maxLength: number = 500
): { isValid: boolean; reason?: string } {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }

  const trimmed = text.trim();

  // 1. Longitud máxima para prevenir desbordamientos o payloads extensos
  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      reason: `El contenido de ${fieldName} supera el límite permitido de ${maxLength} caracteres.`
    };
  }

  // 2. Detección estricta de cualquier código ejecutable o etiquetas
  for (const pattern of EXECUTABLE_OR_TAG_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        reason: `El campo "${fieldName}" solo admite texto plano. Por seguridad, no se permite código ejecutable, etiquetas HTML ni scripts.`
      };
    }
  }

  return { isValid: true };
}

/**
 * Alias retrocompatible para validación de texto seguro como texto plano
 */
export function validateSafeText(
  text: string,
  fieldName: string = 'campo'
): { isValid: boolean; reason?: string } {
  return validateOnlyPlainText(text, fieldName, 500);
}

/**
 * Convierte y depura cualquier texto de entrada para garantizar que quede
 * 100% como texto plano seguro sin posibilidad de ser ejecutado.
 */
export function sanitizeToPlainText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // 1. Eliminar cualquier etiqueta HTML o XML completa o fragmentada
  sanitized = sanitized.replace(/<[^>]*>?/gm, '');

  // 2. Eliminar pseudo-protocolos ejecutables
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:\s*text\/(html|javascript)/gi, '');

  // 3. Eliminar controladores de eventos inline (ej: onerror=, onload=, onclick=)
  sanitized = sanitized.replace(/on[a-zA-Z]+\s*=\s*['"]?[^'"]*['"]?/gi, '');

  // 4. Eliminar llamadas a funciones de ejecución de código
  sanitized = sanitized.replace(/\b(eval|exec|Function|alert|confirm|prompt)\s*\([^)]*\)/gi, '');

  // 5. Neutralizar inyecciones de plantillas (${...}, {{...}}, <%...%>)
  sanitized = sanitized.replace(/\$\{([^}]*)\}/g, '$1');
  sanitized = sanitized.replace(/\{\{([^}]*)\}\}/g, '$1');
  sanitized = sanitized.replace(/<%([^%]*)%>/g, '$1');

  // 6. Eliminar corchetes angulares residuales y comillas peligrosas
  sanitized = sanitized.replace(/[<>]/g, '');

  // 7. Normalizar espacios
  return sanitized.trim();
}

/**
 * Alias retrocompatible para sanitización de texto plano
 */
export function sanitizeInput(text: string): string {
  return sanitizeToPlainText(text);
}

/**
 * Escapa entidades HTML para visualización segura sin riesgo de inyección
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validador específico para teléfonos de Colombia
 */
export function validateColombianPhone(phone: string): { isValid: boolean; reason?: string } {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return {
      isValid: false,
      reason: 'El teléfono debe tener al menos 10 dígitos (ej. 300 123 4567).'
    };
  }
  return { isValid: true };
}

/**
 * Rate Limiter con Ventana Deslizante (Sliding Window Rate Limiter)
 * Previene que bots o usuarios realicen spam de peticiones o llamados repetitivos.
 */
interface RateLimitConfig {
  maxRequests: number; // Máximo de peticiones permitidas
  windowMs: number;    // Ventana de tiempo en milisegundos (ej. 60.000 ms = 1 minuto)
}

const ACTION_LIMITS: Record<string, RateLimitConfig> = {
  booking: { maxRequests: 5, windowMs: 60 * 1000 },      // Máx 5 reservas por minuto
  whatsapp: { maxRequests: 4, windowMs: 60 * 1000 },     // Máx 4 mensajes por minuto
  api_test: { maxRequests: 10, windowMs: 60 * 1000 },    // Máx 10 pruebas por minuto
  login_attempt: { maxRequests: 5, windowMs: 60 * 1000 } // Máx 5 intentos de login por minuto
};

// Historial en memoria de timestamps por acción
const rateLimitStore: Record<string, number[]> = {};

export function checkRateLimit(action: keyof typeof ACTION_LIMITS | string): {
  allowed: boolean;
  remainingRequests: number;
  retryAfterSeconds?: number;
} {
  const config = ACTION_LIMITS[action] || { maxRequests: 10, windowMs: 60 * 1000 };
  const now = Date.now();

  if (!rateLimitStore[action]) {
    rateLimitStore[action] = [];
  }

  // Filtrar solo las peticiones dentro de la ventana de tiempo activa
  rateLimitStore[action] = rateLimitStore[action].filter(
    (timestamp) => now - timestamp < config.windowMs
  );

  if (rateLimitStore[action].length >= config.maxRequests) {
    const oldestTimestamp = rateLimitStore[action][0];
    const retryAfterMs = config.windowMs - (now - oldestTimestamp);
    return {
      allowed: false,
      remainingRequests: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
    };
  }

  // Registrar la petición actual
  rateLimitStore[action].push(now);

  return {
    allowed: true,
    remainingRequests: config.maxRequests - rateLimitStore[action].length
  };
}
