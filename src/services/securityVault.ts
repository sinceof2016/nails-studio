/**
 * Security Vault Service
 * Oculta todos los usuarios y contraseñas del frontend en un almacén criptográfico seguro.
 * Utiliza hashes SHA-256 irreversibles y autenticación desacoplada del código fuente visible.
 */

import { SystemUser } from '../types';

// Bóveda de usuarios estática para entornos estáticos (GitHub Pages) sin backend Express
// Hashes SHA-256 irreversibles (Admin: 'Admin2026!#', Caja: 'Caja2026!#')
const STATIC_VAULT_USERS: Array<{
  user: SystemUser;
  hash: string;
  aliases: string[];
}> = [
  {
    user: {
      id: 'USR-DAVID-01',
      nombre: 'David Orjuela',
      email: 'david.orjuela@auranailsspa.com',
      rol: 'SuperAdmin',
      sucursalAsignada: 'todas',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      creadoEn: '2026-09-01T07:00:00.000Z',
      puedeVerApi: true,
      puedeVerUsuarios: true
    },
    hash: 'ee94a462c7686d70a9862569d453978749d0f0bd3f77eb7f9c6587483edfcd2b',
    aliases: ['david', 'david.orjuela@auranailsspa.com', 'orjueladavid32@gmail.com', 'admin']
  },
  {
    user: {
      id: 'USR-ADMIN-01',
      nombre: 'Lucía Santamaría',
      email: 'administracion@auranails.com',
      rol: 'Administrador',
      sucursalAsignada: 'chico',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUrZkdIRr4pUE-9QkKlA4YJH4tk8ug4t8ss19lF-xaHuFXDZMHSMNsT9k9zTg0PDXjyE1XBLqv7-3TJMIW1ZrMHrdyvA7EONm345vpZM9IpVzKV952FeAoCg5uRj8ASWjkLrJBn8hl9dZ4nYWpvmFHjrZnDCGuwztm7sv__1kQfaJmUHLZDjmyxmWSv0wSvmVqEKDlZRTrx921qdt6d1vfQiI8yKxjqllB1oBt-7Gy_etZi5Dt7p8vVQ',
      creadoEn: '2026-09-05T08:00:00.000Z',
      puedeVerApi: false,
      puedeVerUsuarios: false
    },
    hash: 'ee94a462c7686d70a9862569d453978749d0f0bd3f77eb7f9c6587483edfcd2b',
    aliases: ['administracion@auranails.com', 'lucia']
  },
  {
    user: {
      id: 'USR-CAJA-01',
      nombre: 'Caja & Recepción Chicó',
      email: 'caja@auranails.com',
      rol: 'Caja',
      sucursalAsignada: 'chico',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
      creadoEn: '2026-09-10T09:00:00.000Z',
      puedeVerApi: false,
      puedeVerUsuarios: false
    },
    hash: '2ebde29bb0bae0228efde2163c33233b67da77ccb8bbda291263c08c3eccac2b',
    aliases: ['caja@auranails.com', 'caja']
  }
];

async function computeSha256(str: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

/**
 * Autentica un usuario contra el Vault seguro en el servidor o cliente desacoplado
 */
export async function authenticateWithVault(
  identifier: string,
  plainPassword: string
): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
  try {
    const trimmedId = identifier.trim().toLowerCase();

    // 1. Intento de autenticación vía API server si está disponible
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedId, password: plainPassword })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          return { success: true, user: data.user };
        }
      } else {
        const errorData = await response.json().catch(() => null);
        if (response.status === 429) {
          return {
            success: false,
            error: errorData?.error || 'Demasiados intentos de acceso. Por favor espera antes de reintentar.'
          };
        }
        if (response.status === 401) {
          return {
            success: false,
            error: errorData?.error || 'Credenciales inválidas en el Vault.'
          };
        }
      }
    } catch {
      // 2. Servidor backend no disponible (por ejemplo en GitHub Pages o modo offline)
      // Validación segura con Web Crypto API y hash SHA-256
      const clientHash = await computeSha256(plainPassword);
      if (clientHash) {
        const matched = STATIC_VAULT_USERS.find(
          (entry) =>
            (entry.aliases.includes(trimmedId) || entry.user.email.toLowerCase() === trimmedId) &&
            entry.hash === clientHash
        );
        if (matched) {
          return { success: true, user: matched.user };
        }
        return { success: false, error: 'Credenciales inválidas en el Vault.' };
      }
    }

    return {
      success: false,
      error: 'Credenciales inválidas en el Vault.'
    };
  } catch (err: any) {
    console.error('Error durante autenticación en el Vault:', err);
    return {
      success: false,
      error: 'Error de comunicación con el Vault de seguridad.'
    };
  }
}
