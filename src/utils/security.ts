/**
 * Security & Anti-Abuse Utility
 * Proporciona validación estricta contra inyecciones de código (XSS, SQLi, Command Injection)
 * y un Rate Limiter con ventana deslizante para prevenir ataques de denegación de servicio o bots.
 */

// Patrones sospechosos de inyección maliciosa (HTML/XSS, SQL, Command Injection, scripts)
const MALICIOUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /<img[\s\S]*?onerror[\s\S]*?>/gi,
  /\b(exec|eval|system|passthru|shell_exec)\s*\(/gi,
  /(\b(DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+\w+\s+SET)\b)/gi,
  /--\s*$/gm,
  /;\s*DROP\b/gi,
  /\brm\s+-rf\b/gi,
  /\b(curl|wget)\s+http/gi,
  /\$\{.*?\}/g // Template injection syntax
];

/**
 * Valida si un texto contiene comandos o código malicioso.
 * Retorna { isValid: true } si es seguro, o { isValid: false, reason: string } si detecta amenaza.
 */
export function validateSafeText(
  text: string,
  fieldName: string = 'campo'
): { isValid: boolean; reason?: string } {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }

  const trimmed = text.trim();

  // 1. Longitud máxima para prevenir desbordamientos o payloads extensos
  if (trimmed.length > 500) {
    return {
      isValid: false,
      reason: `El contenido de ${fieldName} supera el límite permitido de 500 caracteres.`
    };
  }

  // 2. Comprobación contra patrones maliciosos conocidos
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        reason: `El ${fieldName} contiene caracteres o secuencias no permitidas (código o comando sospechoso detectado).`
      };
    }
  }

  return { isValid: true };
}

/**
 * Sanitiza texto removiendo caracteres de control y escapando símbolos HTML básicos
 */
export function sanitizeInput(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '') // Elimina corchetes angulares
    .replace(/["']/g, '') // Elimina comillas para prevenir roturas de atributos
    .trim();
}

/**
 * Validador específico para teléfonos de Colombia
 */
export function validateColombianPhone(phone: string): { isValid: boolean; reason?: string } {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return {
      isValid: false,
      reason: 'El teléfono debe tener al menos 10 dígitos (ej. 312 849 2011).'
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
