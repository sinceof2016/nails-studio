/**
 * Security & Anti-Abuse Utility
 * Garantiza que toda información suministrada en formularios, notas, comentarios y campos
 * de texto se procese ÚNICAMENTE como texto plano y NUNCA como código ejecutable (Anti-XSS,
 * Anti-HTML Injection, Anti-Scripting, Anti-SQLi, Anti-Command Injection).
 */

// Patrones exhaustivos de código ejecutable, etiquetas HTML, scripts e inyecciones
// NOTA: No usamos el flag 'g' global para evitar el problema de estado mutable de RegExp.lastIndex en .test()
const EXECUTABLE_OR_TAG_PATTERNS = [
  /<\s*\/?\s*[a-zA-Z/!?][^>]*>?/i,                    // Cualquier etiqueta HTML/XML (<script>, <img>, <a>, <div>, <iframe..., etc.)
  /<script[\s\S]*?/i,                                 // Bloque script abierto o cerrado
  /<iframe[\s\S]*?/i,                                 // iframes abiertos o cerrados
  /<img[\s\S]*?/i,                                    // img
  /<svg[\s\S]*?/i,                                    // svg
  /<embed[\s\S]*?/i,                                  // embed
  /<object[\s\S]*?/i,                                 // object
  /javascript\s*:/i,                                  // Pseudo-protocolo javascript:
  /vbscript\s*:/i,                                    // Pseudo-protocolo vbscript:
  /data\s*:\s*text\/(html|javascript)/i,              // Data URIs ejecutables
  // Event handlers conocidos precedidos de espacio, comilla o inicio de cadena
  /(?:[\s"'/]|^)on(click|error|load|mouseover|mouseout|mouseenter|mouseleave|focus|blur|change|input|submit|keydown|keyup|keypress|dblclick|select|reset|abort|toggle|animationstart|pointerdown|touchstart)\s*=/i,
  /\b(eval|Function|execScript|setTimeout|setInterval)\s*\(/i, // Ejecutores directos de JavaScript
  /\b(document\.(location|cookie|write|createElement)|window\.(location|open))\b/i, // Manipulación del DOM
  /\b(alert|prompt|confirm)\s*\(/i,                   // Cuadros modales nativos
  /\$\{.*?\}/,                                        // Template string injection ES6
  /\{\{.*?\}\}/,                                      // Mustache / Angular / Handlebars injection
  /<%.*?%>/,                                          // JSP / EJS / ASP tags
  /\b(exec|system|passthru|shell_exec)\s*\(/i,        // Comandos shell de backend
  /(\b(DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+\w+\s+SET|SELECT\s+[\s\S]+?\s+FROM)\b)/i, // SQLi keywords
  /;\s*DROP\b/i,                                      // SQL drop injection
  /;\s*--/,                                           // SQL statement termination with comment
  /\brm\s+-rf\b/i,                                    // Unix command
  /\b(curl|wget)\s+http/i,                            // Remote command fetch
  /^[=+\-@]\s*[a-zA-Z_]+\s*(\(|\|)/i                  // Inyección de fórmulas y comandos ejecutables (=HYPERLINK, +cmd|, @SUM, etc.)
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

  // 1. Eliminar etiquetas HTML o XML (un "<" seguido de letra, "/", "!" o "?")
  sanitized = sanitized.replace(/<[a-zA-Z/!?][^>]*>?/gm, '');

  // 2. Eliminar pseudo-protocolos ejecutables
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:\s*text\/(html|javascript)/gi, '');

  // 3. Eliminar controladores de eventos inline conocidos (ej: onerror=, onload=, onclick=)
  sanitized = sanitized.replace(/on(click|error|load|mouseover|mouseout|mouseenter|mouseleave|focus|blur|change|input|submit|keydown|keyup|keypress|dblclick|select|reset|abort|toggle|animationstart|pointerdown|touchstart)\s*=\s*['"]?[^'"]*['"]?/gi, '');

  // 4. Eliminar llamadas a funciones de ejecución de código
  sanitized = sanitized.replace(/\b(eval|exec|Function|alert|confirm|prompt)\s*\([^)]*\)/gi, '');

  // 5. Neutralizar inyecciones de plantillas (${...}, {{...}}, <%...%>)
  sanitized = sanitized.replace(/\$\{([^}]*)\}/g, '$1');
  sanitized = sanitized.replace(/\{\{([^}]*)\}\}/g, '$1');
  sanitized = sanitized.replace(/<%([^%]*)%>/g, '$1');

  // 6. Neutralizar fórmulas ejecutables que comiencen con =, +, -, @ (ej: =HYPERLINK(...), +cmd|...)
  sanitized = sanitized.replace(/^([=+\-@]\s*[a-zA-Z_]+\s*(\(|\|))/i, "'$1");

  // 7. Normalizar espacios
  return sanitized.trim();
}

/**
 * Función centralizada única de validación y limpieza de campos de texto.
 * Ejecuta validateOnlyPlainText + sanitizeToPlainText en un solo paso y retorna { ok, value, error }.
 */
export function validateAndClean(
  value: string | undefined | null,
  label: string = 'campo',
  maxLength: number = 500
): { ok: boolean; value: string; error?: string } {
  const str = value == null ? '' : String(value);
  const check = validateOnlyPlainText(str, label, maxLength);
  if (!check.isValid) {
    return {
      ok: false,
      value: sanitizeToPlainText(str),
      error: check.reason || `El campo "${label}" no es válido.`
    };
  }
  return {
    ok: true,
    value: sanitizeToPlainText(str)
  };
}

/**
 * Validador de formato de correo electrónico básico (usuario@dominio.extension).
 * Admite marcadores PENDIENTE_ configurados por el negocio.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.startsWith('PENDIENTE_')) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Valida un correo electrónico verificando texto plano y formato sintáctico.
 */
export function validateEmail(
  email: string,
  label: string = 'Correo electrónico',
  maxLength: number = 120
): { isValid: boolean; reason?: string } {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { isValid: false, reason: `El campo "${label}" no puede estar vacío.` };
  }
  const plainCheck = validateOnlyPlainText(email, label, maxLength);
  if (!plainCheck.isValid) {
    return plainCheck;
  }
  if (!isValidEmail(email)) {
    return {
      isValid: false,
      reason: `El formato de "${label}" no es válido (ej. usuario@dominio.com).`
    };
  }
  return { isValid: true };
}

/**
 * Validador para teléfonos o WhatsApp: solo dígitos numéricos permitiendo el prefijo '+' inicial.
 * Admite marcadores PENDIENTE_ configurados por el negocio.
 */
export function isValidPhoneOrWhatsApp(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.startsWith('PENDIENTE_')) return true;
  return /^\+?[0-9]{7,25}$/.test(trimmed);
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
 * Limite solo en el cliente. La proteccion real contra reservas masivas es Firebase App Check (pendiente).
 */
interface RateLimitConfig {
  maxRequests: number; // Máximo de peticiones permitidas
  windowMs: number;    // Ventana de tiempo en milisegundos (ej. 60.000 ms = 1 minuto)
}

const ACTION_LIMITS: Record<string, RateLimitConfig> = {
  booking: { maxRequests: 5, windowMs: 60 * 1000 },      // Máx 5 reservas por minuto
  corte_rapido: { maxRequests: 5, windowMs: 60 * 1000 }, // Máx 5 cortes rápidos por minuto
  whatsapp: { maxRequests: 4, windowMs: 60 * 1000 },     // Máx 4 mensajes por minuto
  api_test: { maxRequests: 10, windowMs: 60 * 1000 },    // Máx 10 pruebas por minuto
  login_attempt: { maxRequests: 5, windowMs: 5 * 60 * 1000 } // Bloqueo de 5 min tras 5 fallos seguidos
};

// Historial en memoria de timestamps por acción (fallback si sessionStorage no está disponible)
const rateLimitStore: Record<string, number[]> = {};

function getStoredTimestamps(action: string): number[] {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(`rate_limit_${action}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is number => typeof item === 'number');
        }
      }
    }
  } catch {}
  return rateLimitStore[action] || [];
}

function saveStoredTimestamps(action: string, timestamps: number[]): void {
  rateLimitStore[action] = timestamps;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`rate_limit_${action}`, JSON.stringify(timestamps));
    }
  } catch {}
}

// =========================================================================
// GESTIÓN DE BLOQUEO DE LOGIN (localStorage - 5 fallos seguidos -> 5 min)
// Solo cuentan los intentos FALLIDOS. Los exitosos resetean el contador.
// =========================================================================

interface LoginLockoutState {
  failedAttempts: number;
  lockoutUntil: number; // Marca de tiempo en ms
}

const LOGIN_LOCKOUT_KEY = 'la_pelu_login_lockout';
const LOGIN_MAX_CONSECUTIVE_FAILURES = 5;
const LOGIN_LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos (300 segundos)

let memoryLoginState: LoginLockoutState = {
  failedAttempts: 0,
  lockoutUntil: 0
};

function getLoginLockoutState(): LoginLockoutState {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOGIN_LOCKOUT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.failedAttempts === 'number' && typeof parsed.lockoutUntil === 'number') {
          return parsed;
        }
      }
    }
  } catch {}
  return memoryLoginState;
}

function saveLoginLockoutState(state: LoginLockoutState): void {
  memoryLoginState = state;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOGIN_LOCKOUT_KEY, JSON.stringify(state));
    }
  } catch {}
}

/**
 * Comprueba si el usuario se encuentra actualmente bloqueado por intentos fallidos de login.
 * NO incrementa el contador de fallos.
 */
export function checkLoginRateLimit(): {
  allowed: boolean;
  remainingRequests: number;
  retryAfterSeconds?: number;
} {
  const state = getLoginLockoutState();
  const now = Date.now();

  // Si está actualmente bajo bloqueo de 5 minutos
  if (state.lockoutUntil > now) {
    const retryAfterMs = state.lockoutUntil - now;
    return {
      allowed: false,
      remainingRequests: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000))
    };
  }

  // Si el bloqueo expiró, restablecer contador de fallos
  if (state.lockoutUntil > 0 && state.lockoutUntil <= now) {
    saveLoginLockoutState({ failedAttempts: 0, lockoutUntil: 0 });
    return {
      allowed: true,
      remainingRequests: LOGIN_MAX_CONSECUTIVE_FAILURES
    };
  }

  return {
    allowed: true,
    remainingRequests: Math.max(0, LOGIN_MAX_CONSECUTIVE_FAILURES - state.failedAttempts)
  };
}

/**
 * Registra un intento de login FALLIDO.
 * Si alcanza 5 fallos consecutivos, activa el bloqueo de 5 minutos.
 */
export function recordLoginFailure(): {
  allowed: boolean;
  remainingRequests: number;
  retryAfterSeconds?: number;
} {
  const state = getLoginLockoutState();
  const now = Date.now();

  if (state.lockoutUntil > now) {
    return {
      allowed: false,
      remainingRequests: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((state.lockoutUntil - now) / 1000))
    };
  }

  const newFailures = state.failedAttempts + 1;
  if (newFailures >= LOGIN_MAX_CONSECUTIVE_FAILURES) {
    const lockoutUntil = now + LOGIN_LOCKOUT_DURATION_MS;
    saveLoginLockoutState({ failedAttempts: newFailures, lockoutUntil });
    return {
      allowed: false,
      remainingRequests: 0,
      retryAfterSeconds: Math.ceil(LOGIN_LOCKOUT_DURATION_MS / 1000) // 300 segundos
    };
  }

  saveLoginLockoutState({ failedAttempts: newFailures, lockoutUntil: 0 });
  return {
    allowed: true,
    remainingRequests: LOGIN_MAX_CONSECUTIVE_FAILURES - newFailures
  };
}

/**
 * Restablece los intentos fallidos de login a 0 tras un acceso exitoso.
 */
export function resetLoginAttempts(): void {
  saveLoginLockoutState({ failedAttempts: 0, lockoutUntil: 0 });
}

export function checkRateLimit(action: keyof typeof ACTION_LIMITS | string): {
  allowed: boolean;
  remainingRequests: number;
  retryAfterSeconds?: number;
} {
  if (action === 'login_attempt') {
    return checkLoginRateLimit();
  }

  const config = ACTION_LIMITS[action] || { maxRequests: 10, windowMs: 60 * 1000 };
  const now = Date.now();

  let timestamps = getStoredTimestamps(action);

  // Filtrar solo las peticiones dentro de la ventana de tiempo activa
  timestamps = timestamps.filter((timestamp) => now - timestamp < config.windowMs);

  if (timestamps.length >= config.maxRequests) {
    const oldestTimestamp = timestamps[0];
    const retryAfterMs = config.windowMs - (now - oldestTimestamp);
    saveStoredTimestamps(action, timestamps);
    return {
      allowed: false,
      remainingRequests: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000))
    };
  }

  // Registrar la petición actual
  timestamps.push(now);
  saveStoredTimestamps(action, timestamps);

  return {
    allowed: true,
    remainingRequests: config.maxRequests - timestamps.length
  };
}

