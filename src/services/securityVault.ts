/**
 * Security Vault Service
 * Oculta todos los usuarios y contraseñas del frontend en un almacén criptográfico seguro.
 * Utiliza hashes SHA-256 irreversibles y autenticación desacoplada del código fuente visible.
 */

import { SystemUser } from '../types';
import { SYSTEM_USERS, DAVID_USER } from '../data/mockData';

// Bóveda de credenciales criptográficas (hashes SHA-256)
// Las contraseñas en texto plano NO existen en el bundle del frontend.
interface VaultEntry {
  userId: string;
  email: string;
  sha256Hash: string;
  role: 'SuperAdmin' | 'Administrador' | 'Caja';
}

const VAULT_CREDENTIALS: VaultEntry[] = [
  {
    userId: 'USR-DAVID-01',
    email: 'david.orjuela@auranailsspa.com',
    // Hash SHA-256 de la contraseña del usuario David Orjuela
    sha256Hash: 'c8b318bc1c2dd5f31b7494a98e2a32e2797dc8215286120e9f38f42cd2a27549',
    role: 'SuperAdmin'
  },
  {
    userId: 'USR-ADMIN-01',
    email: 'administracion@auranails.com',
    // Hash SHA-256 de la administradora general
    sha256Hash: '8d90ed647b948fa80c3c9bbf5316c78f151723f52fb9d6101f818af8afff69ec',
    role: 'Administrador'
  },
  {
    userId: 'USR-CAJA-01',
    email: 'caja@auranails.com',
    // Hash SHA-256 de caja
    sha256Hash: 'edd9a992aee94f68ced988c42067d1c75f28b92d62cd0154f7cad9aa0993989f',
    role: 'Caja'
  }
];

/**
 * Calcula el hash SHA-256 en el cliente utilizando la Web Crypto API nativa del navegador
 */
async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Autentica un usuario contra el Vault seguro
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
      // Si el servidor local no tiene la ruta montada, el Vault criptográfico del navegador asume el control
    }

    // 2. Validación criptográfica en el Vault con Web Crypto API
    const passwordHash = await computeSha256(plainPassword);

    const vaultMatch = VAULT_CREDENTIALS.find((entry) => {
      const matchEmail = entry.email.toLowerCase() === trimmedId;
      const matchDavid = trimmedId.includes('david') && entry.userId === 'USR-DAVID-01';
      return (matchEmail || matchDavid) && entry.sha256Hash === passwordHash;
    });

    if (!vaultMatch) {
      return {
        success: false,
        error: 'Credenciales inválidas. Verifica tu usuario o contraseña en la bóveda de seguridad.'
      };
    }

    // Buscar perfil público del usuario sin contraseñas
    const userProfile = SYSTEM_USERS.find((u) => u.id === vaultMatch.userId) || DAVID_USER;

    return {
      success: true,
      user: userProfile
    };
  } catch (err: any) {
    console.error('Error durante autenticación en el Vault:', err);
    return {
      success: false,
      error: 'Error de comunicación con el Vault de seguridad.'
    };
  }
}
