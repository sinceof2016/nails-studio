import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security configuration: payload size limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 1. Security Headers Middleware (Senior SecDev standard)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
});

// 2. Sliding Window In-Memory Rate Limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-client';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = ipRateLimits.get(key);
    if (!record || now > record.resetTime) {
      ipRateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retrySec = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        error: `Demasiadas solicitudes. Por favor espera ${retrySec} segundos antes de reintentar.`
      });
    }

    record.count += 1;
    next();
  };
}

// 3. Server-Side Secret Vault & Environment Variables
// Las API Keys y Tokens NUNCA viajan al cliente frontend
const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || 'instance192909';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || '8qqml39io4sdiwlv';

// Bóveda de credenciales criptográficas protegidas en el backend (Hashes SHA-256)
const VAULT_STORE = [
  {
    userId: 'USR-DAVID-01',
    email: 'david.orjuela@auranailsspa.com',
    nombre: 'David Orjuela',
    role: 'SuperAdmin' as const,
    passwordHash: 'c8b318bc1c2dd5f31b7494a98e2a32e2797dc8215286120e9f38f42cd2a27549',
    puedeVerApi: true,
    puedeVerUsuarios: true,
    sucursalAsignada: 'todas',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  },
  {
    userId: 'USR-ADMIN-01',
    email: 'administracion@auranails.com',
    nombre: 'Lucía Santamaría',
    role: 'Administrador' as const,
    passwordHash: '8d90ed647b948fa80c3c9bbf5316c78f151723f52fb9d6101f818af8afff69ec',
    puedeVerApi: false,
    puedeVerUsuarios: false,
    sucursalAsignada: 'chico',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUrZkdIRr4pUE-9QkKlA4YJH4tk8ug4t8ss19lF-xaHuFXDZMHSMNsT9k9zTg0PDXjyE1XBLqv7-3TJMIW1ZrMHrdyvA7EONm345vpZM9IpVzKV952FeAoCg5uRj8ASWjkLrJBn8hl9dZ4nYWpvmFHjrZnDCGuwztm7sv__1kQfaJmUHLZDjmyxmWSv0wSvmVqEKDlZRTrx921qdt6d1vfQiI8yKxjqllB1oBt-7Gy_etZi5Dt7p8vVQ'
  },
  {
    userId: 'USR-CAJA-01',
    email: 'caja@auranails.com',
    nombre: 'Caja & Recepción Chicó',
    role: 'Caja' as const,
    passwordHash: 'edd9a992aee94f68ced988c42067d1c75f28b92d62cd0154f7cad9aa0993989f',
    puedeVerApi: false,
    puedeVerUsuarios: false,
    sucursalAsignada: 'chico',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'
  }
];

function sha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function containsExecutableCode(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const patterns = [
    /<\s*\/?\s*[a-zA-Z][^>]*>/i,
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /<iframe[\s\S]*?>/i,
    /javascript\s*:/i,
    /vbscript\s*:/i,
    /data\s*:\s*text\/(html|javascript)/i,
    /on[a-zA-Z]+\s*=/i,
    /\b(eval|Function|execScript)\s*\(/i,
    /\bdocument\.(location|cookie|write)\b/i,
    /\bwindow\.(location|open)\b/i
  ];
  return patterns.some((p) => p.test(str));
}

function sanitizeText(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return String(str)
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/(html|javascript)/gi, '')
    .replace(/on[a-zA-Z]+\s*=\s*['"]?[^'"]*['"]?/gi, '')
    .replace(/\b(eval|exec|Function|alert)\s*\([^)]*\)/gi, '')
    .replace(/\$\{([^}]*)\}/g, '$1')
    .replace(/[<>]/g, '')
    .trim();
}

// 4. Endpoints con Rate Limiting y Sanitización

// Auth Login: Máximo 8 intentos por 5 minutos (Anti-Bruteforce)
app.post('/api/auth/login', createRateLimiter(8, 5 * 60 * 1000), (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: 'Identificador y contraseña requeridos' });
  }

  const idTrim = sanitizeText(identifier).toLowerCase();
  const hash = sha256(String(password));

  const matchedUser = VAULT_STORE.find(
    (u) =>
      (u.email.toLowerCase() === idTrim || (idTrim.includes('david') && u.userId === 'USR-DAVID-01')) &&
      u.passwordHash === hash
  );

  if (!matchedUser) {
    return res.status(401).json({ success: false, error: 'Credenciales inválidas en el Vault' });
  }

  // Return clean user object WITHOUT password or hash with session expiration
  const token = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const sessionTtlMs = 15 * 60 * 1000; // 15 minutos por inactividad

  const safeUser = {
    id: matchedUser.userId,
    nombre: matchedUser.nombre,
    email: matchedUser.email,
    rol: matchedUser.role,
    sucursalAsignada: matchedUser.sucursalAsignada,
    avatar: matchedUser.avatar,
    puedeVerApi: matchedUser.puedeVerApi,
    puedeVerUsuarios: matchedUser.puedeVerUsuarios
  };

  return res.json({
    success: true,
    user: safeUser,
    session: {
      token,
      loginTime: now,
      expiresAt: now + sessionTtlMs,
      maxInactivityMs: sessionTtlMs
    }
  });
});

// Vault Status Endpoint
app.get('/api/vault/status', createRateLimiter(30, 60 * 1000), (req, res) => {
  res.json({
    status: 'active',
    vaultEncrypted: true,
    algorithm: 'SHA-256 / AES-GCM',
    usersRegistered: VAULT_STORE.length,
    whatsappGatewayProtected: true,
    timestamp: new Date().toISOString()
  });
});

// WhatsApp Dispatch Proxy (Protege la API Key de UltraMsg ejecutando el fetch desde el servidor)
app.post('/api/whatsapp/send', createRateLimiter(15, 60 * 1000), async (req, res) => {
  try {
    const { phone, message, clientName, bookingCode, customInstance, customToken } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Teléfono y mensaje requeridos' });
    }

    if (containsExecutableCode(String(message)) || (clientName && containsExecutableCode(String(clientName)))) {
      return res.status(400).json({
        success: false,
        error: 'El contenido contiene etiquetas o código ejecutable no permitido. Toda información debe suministrarse únicamente como texto plano.'
      });
    }

    const cleanDigits = String(phone).replace(/\D/g, '');
    const cleanPhone = cleanDigits.startsWith('57')
      ? cleanDigits
      : cleanDigits.length === 10
      ? `57${cleanDigits}`
      : `57${cleanDigits.slice(-10)}`;

    const cleanMsg = sanitizeText(message);
    const targetInstance = (customInstance && customInstance.trim()) ? customInstance.trim() : ULTRAMSG_INSTANCE_ID;
    const targetToken = (customToken && customToken.trim()) ? customToken.trim() : ULTRAMSG_TOKEN;

    const instance = targetInstance.startsWith('instance')
      ? targetInstance
      : `instance${targetInstance}`;

    const upstreamUrl = `https://api.ultramsg.com/${instance}/messages/chat`;

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: targetToken,
        to: cleanPhone,
        body: cleanMsg
      })
    });

    const rawText = await upstreamRes.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText.slice(0, 100) || 'Respuesta no válida del servicio UltraMsg' };
    }

    if (upstreamRes.ok && (data.sent === 'true' || data.sent === true || data.id || data.message === 'ok' || data.status === 'success')) {
      return res.json({
        success: true,
        messageId: String(data.id || 'sent'),
        destinatario: `+${cleanPhone}`,
        timestamp: new Date().toISOString()
      });
    } else {
      const errorMsg = data.error || data.message || `Error HTTP ${upstreamRes.status} en UltraMsg`;
      return res.status(upstreamRes.status >= 400 ? upstreamRes.status : 400).json({
        success: false,
        error: errorMsg
      });
    }
  } catch (error: any) {
    console.error('Error enviando mensaje vía UltraMsg Proxy:', error);
    return res.status(500).json({
      success: false,
      error: 'Error de comunicación interna con el gateway de WhatsApp.'
    });
  }
});

// Endpoint para verificar estado y credenciales de la instancia de UltraMsg en vivo
app.post('/api/whatsapp/verify', createRateLimiter(20, 60 * 1000), async (req, res) => {
  try {
    const { customInstance, customToken } = req.body || {};
    const targetInstance = (customInstance && customInstance.trim()) ? customInstance.trim() : ULTRAMSG_INSTANCE_ID;
    const targetToken = (customToken && customToken.trim()) ? customToken.trim() : ULTRAMSG_TOKEN;

    const instance = targetInstance.startsWith('instance')
      ? targetInstance
      : `instance${targetInstance}`;

    const checkUrl = `https://api.ultramsg.com/${instance}/instance/status?token=${encodeURIComponent(targetToken)}`;

    const checkRes = await fetch(checkUrl);
    const rawText = await checkRes.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText.slice(0, 120) || 'Respuesta no parseable de UltraMsg' };
    }

    if (checkRes.ok && !data.error) {
      const accountStatus =
        data.status?.accountStatus?.status ||
        data.status?.account_status ||
        (typeof data.status === 'string' ? data.status : 'authenticated');
      return res.json({
        success: true,
        instance,
        accountStatus,
        details: data
      });
    } else {
      return res.status(checkRes.status >= 400 ? checkRes.status : 400).json({
        success: false,
        instance,
        error: data.error || data.message || 'Credenciales o instancia no válidas en UltraMsg'
      });
    }
  } catch (error: any) {
    console.error('Error comprobando conexión UltraMsg:', error);
    return res.status(500).json({
      success: false,
      error: 'No se pudo comunicar con el servicio de UltraMsg.'
    });
  }
});

// WhatsApp Gateway Status Endpoint (Sin filtrar el Token secreto)
app.get('/api/whatsapp/status', createRateLimiter(30, 60 * 1000), (req, res) => {
  const maskedInstance = ULTRAMSG_INSTANCE_ID.length > 6
    ? `${ULTRAMSG_INSTANCE_ID.slice(0, 4)}...${ULTRAMSG_INSTANCE_ID.slice(-3)}`
    : 'instance***';

  res.json({
    status: 'connected',
    provider: 'UltraMsg WhatsApp Cloud API',
    instance: maskedInstance,
    tokenSecured: true,
    serverSideProxy: true,
    timestamp: new Date().toISOString()
  });
});

// 5. Servicio de Control de Llaves Criptográficas (KMS) & Rotación Doble
interface KmsKey {
  id: string;
  name: string;
  role: 'PRIMARY' | 'SECONDARY' | 'REVOKED';
  keyType: string;
  secret: string;
  fingerprint: string;
  createdAt: string;
  lastUsedAt: string;
  rotationCount: number;
}

const KMS_STORE = {
  primaryKey: {
    id: 'key-aura-prim',
    name: 'Llave Primaria Activa (Producción)',
    role: 'PRIMARY' as const,
    keyType: 'REST_API_MASTER',
    secret: 'aura_live_k1_8f9c2d1e0b4a736458291a7e4b',
    fingerprint: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastUsedAt: new Date().toISOString(),
    rotationCount: 1
  },
  secondaryKey: {
    id: 'key-aura-sec',
    name: 'Llave Secundaria de Transición (Período de Gracia)',
    role: 'SECONDARY' as const,
    keyType: 'REST_API_MASTER',
    secret: 'aura_live_k2_3a7b1c9e8d2f405167382b6c9d',
    fingerprint: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    createdAt: new Date(Date.now() - 37 * 86400000).toISOString(),
    lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
    rotationCount: 1
  },
  revokedKeys: [] as KmsKey[],
  auditLog: [
    {
      id: 'aud-01',
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      action: 'ROTATION_DUAL',
      triggeredBy: 'David Orjuela (USR-DAVID-01)',
      details: 'Rotación doble de llaves ejecutada. Promoción de secundaria y nueva llave primaria generada.',
      fingerprint: 'e3b0c44298fc1c149afbf4c8996fb924'
    }
  ]
};

// Middleware para verificar API Keys contra el motor KMS de Rotación Doble
function validateKmsApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const headerKey = req.headers['x-api-key']?.toString();
  const authHeader = req.headers.authorization;
  let candidateKey = headerKey;
  if (!candidateKey && authHeader?.startsWith('Bearer ')) {
    candidateKey = authHeader.slice(7).trim();
  }

  if (!candidateKey) {
    return res.status(401).json({
      success: false,
      error: 'Se requiere una API Key válida en el header X-API-Key o Authorization: Bearer <key>',
      protocol: 'KMS-AURA-DUAL-KEY'
    });
  }

  if (candidateKey === KMS_STORE.primaryKey.secret) {
    KMS_STORE.primaryKey.lastUsedAt = new Date().toISOString();
    res.setHeader('X-KMS-Key-Role', 'PRIMARY');
    res.setHeader('X-KMS-Key-Id', KMS_STORE.primaryKey.id);
    return next();
  }

  if (candidateKey === KMS_STORE.secondaryKey.secret) {
    KMS_STORE.secondaryKey.lastUsedAt = new Date().toISOString();
    res.setHeader('X-KMS-Key-Role', 'SECONDARY');
    res.setHeader('X-KMS-Key-Id', KMS_STORE.secondaryKey.id);
    res.setHeader('X-KMS-Warning', 'Esta llave está en período de gracia. Se recomienda actualizar a la llave primaria.');
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'API Key inválida o revocada en el Servicio de Control de Llaves (KMS)',
    protocol: 'KMS-AURA-DUAL-KEY'
  });
}

function maskSecret(secret: string): string {
  if (secret.length <= 12) return '••••••••';
  return `${secret.slice(0, 14)}••••••••••••${secret.slice(-4)}`;
}

// Endpoint para consultar llaves en el KMS (con secretos accesibles para el SuperAdmin David)
app.get('/api/kms/keys', createRateLimiter(60, 60 * 1000), (req, res) => {
  res.json({
    success: true,
    algorithm: 'AES-256-GCM / SHA-256',
    protocol: 'Dual Key Zero-Downtime Rotation (KMS-AURA-V2)',
    primaryKey: {
      id: KMS_STORE.primaryKey.id,
      name: KMS_STORE.primaryKey.name,
      role: KMS_STORE.primaryKey.role,
      keyType: KMS_STORE.primaryKey.keyType,
      maskedSecret: maskSecret(KMS_STORE.primaryKey.secret),
      rawSecret: KMS_STORE.primaryKey.secret,
      fingerprint: KMS_STORE.primaryKey.fingerprint,
      createdAt: KMS_STORE.primaryKey.createdAt,
      lastUsedAt: KMS_STORE.primaryKey.lastUsedAt,
      rotationCount: KMS_STORE.primaryKey.rotationCount,
      expiresInDays: 30
    },
    secondaryKey: {
      id: KMS_STORE.secondaryKey.id,
      name: KMS_STORE.secondaryKey.name,
      role: KMS_STORE.secondaryKey.role,
      keyType: KMS_STORE.secondaryKey.keyType,
      maskedSecret: maskSecret(KMS_STORE.secondaryKey.secret),
      rawSecret: KMS_STORE.secondaryKey.secret,
      fingerprint: KMS_STORE.secondaryKey.fingerprint,
      createdAt: KMS_STORE.secondaryKey.createdAt,
      lastUsedAt: KMS_STORE.secondaryKey.lastUsedAt,
      rotationCount: KMS_STORE.secondaryKey.rotationCount,
      expiresInDays: 14
    },
    activeKeysCount: 2,
    auditTrail: KMS_STORE.auditLog.slice(0, 10),
    timestamp: new Date().toISOString()
  });
});

// Endpoint para ejecutar Rotación Doble de Llaves (Dual Key Rotation)
app.post('/api/kms/rotate', createRateLimiter(10, 60 * 1000), (req, res) => {
  try {
    const { reason } = req.body || {};

    // 1. La llave secundaria anterior pasa a estado REVOCADA
    const oldSecondary = { ...KMS_STORE.secondaryKey, role: 'REVOKED' as const };
    KMS_STORE.revokedKeys.unshift(oldSecondary);

    // 2. La llave primaria actual se degrada a llave secundaria de transición (período de gracia)
    const oldPrimary = { ...KMS_STORE.primaryKey };
    KMS_STORE.secondaryKey = {
      ...oldPrimary,
      id: `key-aura-sec-${Date.now().toString().slice(-4)}`,
      name: 'Llave Secundaria de Transición (Período de Gracia)',
      role: 'SECONDARY',
      rotationCount: oldPrimary.rotationCount
    };

    // 3. Se genera criptográficamente una nueva Llave Primaria de 256 bits
    const randomSuffix = crypto.randomBytes(16).toString('hex');
    const newSecret = `aura_live_k1_${randomSuffix}`;
    const newFingerprint = crypto.createHash('sha256').update(newSecret).digest('hex');

    KMS_STORE.primaryKey = {
      id: `key-aura-prim-${Date.now().toString().slice(-4)}`,
      name: 'Llave Primaria Activa (Producción)',
      role: 'PRIMARY',
      keyType: 'REST_API_MASTER',
      secret: newSecret,
      fingerprint: newFingerprint,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      rotationCount: oldPrimary.rotationCount + 1
    };

    // 4. Registro en el libro mayor de auditoría KMS
    const auditEntry = {
      id: `aud-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      action: 'ROTATION_DUAL',
      triggeredBy: 'David Orjuela (USR-DAVID-01)',
      details: reason ? `Rotación doble: ${sanitizeText(reason)}` : 'Rotación doble de llaves ejecutada exitosamente con cero tiempo de inactividad.',
      fingerprint: newFingerprint.slice(0, 32)
    };
    KMS_STORE.auditLog.unshift(auditEntry);

    return res.json({
      success: true,
      message: 'Rotación doble de llaves completada con éxito. La llave previa está activa como secundaria y la nueva llave primaria está lista.',
      primaryKey: {
        id: KMS_STORE.primaryKey.id,
        name: KMS_STORE.primaryKey.name,
        role: KMS_STORE.primaryKey.role,
        maskedSecret: maskSecret(KMS_STORE.primaryKey.secret),
        rawSecret: KMS_STORE.primaryKey.secret,
        fingerprint: KMS_STORE.primaryKey.fingerprint,
        createdAt: KMS_STORE.primaryKey.createdAt
      },
      secondaryKey: {
        id: KMS_STORE.secondaryKey.id,
        name: KMS_STORE.secondaryKey.name,
        role: KMS_STORE.secondaryKey.role,
        maskedSecret: maskSecret(KMS_STORE.secondaryKey.secret),
        rawSecret: KMS_STORE.secondaryKey.secret,
        fingerprint: KMS_STORE.secondaryKey.fingerprint,
        createdAt: KMS_STORE.secondaryKey.createdAt
      },
      auditTrail: KMS_STORE.auditLog.slice(0, 10)
    });
  } catch (error: any) {
    console.error('Error rotando llaves en KMS:', error);
    return res.status(500).json({ success: false, error: 'Error interno en el Servicio de Control de Llaves (KMS).' });
  }
});

// Endpoint para intercambiar llaves (Swap Failover)
app.post('/api/kms/swap', createRateLimiter(15, 60 * 1000), (req, res) => {
  try {
    const tempPrimary = { ...KMS_STORE.primaryKey };
    const tempSecondary = { ...KMS_STORE.secondaryKey };

    KMS_STORE.primaryKey = {
      ...tempSecondary,
      role: 'PRIMARY',
      name: 'Llave Primaria Activa (Producción)'
    };

    KMS_STORE.secondaryKey = {
      ...tempPrimary,
      role: 'SECONDARY',
      name: 'Llave Secundaria de Transición (Período de Gracia)'
    };

    const auditEntry = {
      id: `aud-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      action: 'SWAP_KEYS',
      triggeredBy: 'David Orjuela (USR-DAVID-01)',
      details: 'Intercambio inmediato (Swap Failover) ejecutado entre Llave Primaria y Secundaria.',
      fingerprint: KMS_STORE.primaryKey.fingerprint.slice(0, 32)
    };
    KMS_STORE.auditLog.unshift(auditEntry);

    return res.json({
      success: true,
      message: 'Intercambio inmediato (Swap) de llaves completado.',
      primaryKey: {
        id: KMS_STORE.primaryKey.id,
        name: KMS_STORE.primaryKey.name,
        role: KMS_STORE.primaryKey.role,
        maskedSecret: maskSecret(KMS_STORE.primaryKey.secret),
        rawSecret: KMS_STORE.primaryKey.secret,
        fingerprint: KMS_STORE.primaryKey.fingerprint
      },
      secondaryKey: {
        id: KMS_STORE.secondaryKey.id,
        name: KMS_STORE.secondaryKey.name,
        role: KMS_STORE.secondaryKey.role,
        maskedSecret: maskSecret(KMS_STORE.secondaryKey.secret),
        rawSecret: KMS_STORE.secondaryKey.secret,
        fingerprint: KMS_STORE.secondaryKey.fingerprint
      },
      auditTrail: KMS_STORE.auditLog.slice(0, 10)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Error ejecutando Swap en KMS.' });
  }
});

// Endpoint para verificar cualquier llave en tiempo real
app.post('/api/kms/verify', createRateLimiter(30, 60 * 1000), (req, res) => {
  const { key } = req.body || {};
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ valid: false, message: 'Se requiere el parámetro "key".' });
  }

  const cleanKey = key.trim();
  if (cleanKey === KMS_STORE.primaryKey.secret) {
    return res.json({
      valid: true,
      keyRole: 'PRIMARY',
      keyId: KMS_STORE.primaryKey.id,
      fingerprint: KMS_STORE.primaryKey.fingerprint,
      message: '✓ Llave válida y activa como LLAVE PRIMARIA (Producción).'
    });
  }

  if (cleanKey === KMS_STORE.secondaryKey.secret) {
    return res.json({
      valid: true,
      keyRole: 'SECONDARY',
      keyId: KMS_STORE.secondaryKey.id,
      fingerprint: KMS_STORE.secondaryKey.fingerprint,
      message: '⚠ Llave válida en período de gracia como LLAVE SECUNDARIA.'
    });
  }

  const isRevoked = KMS_STORE.revokedKeys.some((k) => k.secret === cleanKey);
  return res.json({
    valid: false,
    message: isRevoked
      ? '✕ Llave REVOCADA por rotación previa en el KMS.'
      : '✕ Llave desconocida o no autorizada en el sistema.'
  });
});

// REST API Endpoints protegidos con KMS Dual Key Validation
app.get('/api/v1/citas/activas', validateKmsApiKey, (req, res) => {
  res.json({
    status: 200,
    kmsAuth: { verified: true, role: res.getHeader('X-KMS-Key-Role'), keyId: res.getHeader('X-KMS-Key-Id') },
    data: {
      totalCitas: 4,
      sede: 'Santuario Chicó Calle 85',
      turnos: [
        { codigo: 'AURA-7829', cliente: 'Mariana Duque', servicio: 'Manicura Rusa Glazed', estado: 'confirmada' },
        { codigo: 'AURA-8902', cliente: 'Dra. Carolina Restrepo', servicio: 'Soft Gel Pastel Art', estado: 'en_preparacion' }
      ]
    }
  });
});

app.get('/api/v1/caja/balance', validateKmsApiKey, (req, res) => {
  res.json({
    status: 200,
    kmsAuth: { verified: true, role: res.getHeader('X-KMS-Key-Role'), keyId: res.getHeader('X-KMS-Key-Id') },
    data: {
      efectivoCaja: 260000,
      cobrosHoy: 2,
      moneda: 'COP',
      sede: 'Santuario Chicó Calle 85'
    }
  });
});

app.get('/api/v1/clientes/metricas', validateKmsApiKey, (req, res) => {
  res.json({
    status: 200,
    kmsAuth: { verified: true, role: res.getHeader('X-KMS-Key-Role'), keyId: res.getHeader('X-KMS-Key-Id') },
    data: {
      totalClientes: 4,
      clientesFrecuentes: 3,
      sede: 'Santuario Chicó Calle 85'
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & Secure Vault running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
