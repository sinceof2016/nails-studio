/**
 * Configuración centralizada de datos legales y de contacto de La Pelu SPA.
 * Textos publicados sin revisión de abogado por decisión del dueño (2026-10-05).
 * Los datos marcados con PENDIENTE_ son marcadores que se completan desde la administración del negocio.
 */

/** Comisión por defecto de una especialista nueva (en porcentaje). */
export const DEFAULT_COMMISSION_RATE = 50;

export const LEGAL_LAST_UPDATE = '2026-10-05';

function getEnv(key: string, fallback: string): string {
  let val: string | undefined;
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      val = (import.meta.env as any)[key];
    }
  } catch {
    // Entornos sin import.meta
  }
  if (!val && typeof process !== 'undefined' && process.env) {
    val = process.env[key];
  }
  return val || fallback;
}

export interface BusinessConfig {
  businessName: string;            // Razón social del titular
  brandName: string;               // Nombre comercial
  nit: string;                     // Número de Identificación Tributaria
  representanteLegal: string;      // Nombre del representante legal
  address: string;                 // Domicilio comercial / sede principal
  city: string;                    // Ciudad de domicilio
  country: string;                 // País
  phone: string;                   // Teléfono de atención
  phoneFormatted: string;          // Teléfono para visualización
  whatsapp: string;                // WhatsApp transaccional
  whatsappFormatted: string;       // WhatsApp para visualización
  email: string;                   // Correo de atención al cliente / PQRS
  privacyEmail: string;            // Canal exclusivo para ejercicio de derechos Habeas Data (Ley 1581)
  branchName: string;              // Nombre de la sede
  bookingCodePrefix: string;       // Prefijo para códigos de reserva
  taxNotice: string;               // Indicación de precios e IVA (Ley 1480 de 2011)
  cancellationNoticeHours: number; // Horas mínimas para cancelación sin penalidad
  advancePaymentRequired: boolean; // Si se exige cobro de anticipo
  dataPolicyVersion: string;       // Versión vigente de la Política de Tratamiento de Datos
  privacyNoticeVersion: string;    // Versión del Aviso de Privacidad
  termsVersion: string;            // Versión de Términos y Condiciones
  cancellationPolicyVersion: string; // Versión de Política de Cancelación
}

export const BUSINESS_CONFIG: BusinessConfig = {
  // Identidad jurídica y comercial
  businessName: getEnv('VITE_BUSINESS_NAME', 'PENDIENTE_RAZON_SOCIAL'),
  brandName: getEnv('VITE_BRAND_NAME', 'La Pelu SPA'),
  nit: getEnv('VITE_BUSINESS_NIT', 'PENDIENTE_NIT'),
  representanteLegal: getEnv('VITE_REPRESENTANTE_LEGAL', 'PENDIENTE_REPRESENTANTE_LEGAL'),

  // Domicilio y ubicación
  address: getEnv('VITE_BUSINESS_ADDRESS', 'PENDIENTE_DIRECCION'),
  city: getEnv('VITE_BUSINESS_CITY', 'PENDIENTE_CIUDAD'),
  country: getEnv('VITE_BUSINESS_COUNTRY', 'Colombia'),

  // Canales de contacto
  phone: getEnv('VITE_BUSINESS_PHONE', 'PENDIENTE_TELEFONO'),
  phoneFormatted: getEnv('VITE_BUSINESS_PHONE_FORMATTED', 'PENDIENTE_TELEFONO_FORMATO'),
  whatsapp: getEnv('VITE_BUSINESS_WHATSAPP', 'PENDIENTE_WHATSAPP'),
  whatsappFormatted: getEnv('VITE_BUSINESS_WHATSAPP_FORMATTED', 'PENDIENTE_WHATSAPP_FORMATO'),
  email: getEnv('VITE_BUSINESS_EMAIL', 'PENDIENTE_CORREO_GENERAL'),
  privacyEmail: getEnv('VITE_PRIVACY_EMAIL', 'PENDIENTE_CORREO_PRIVACIDAD'),

  // Operación y sedes
  branchName: getEnv('VITE_BRANCH_NAME', 'Santuario Patio Bonito'),
  bookingCodePrefix: getEnv('VITE_BOOKING_CODE_PREFIX', 'PELU'),

  // Régimen comercial y consumidor (Ley 1480 de 2011)
  taxNotice: 'Precios en pesos colombianos (COP).',
  cancellationNoticeHours: 24, // Plazo de anticipación para cancelación (en horas)
  advancePaymentRequired: false, // La reserva online NO cobra anticipo ni solicita datos de pago en línea

  // Versiones de documentos legales (Habeas Data & Consumidor)
  dataPolicyVersion: 'v1.0-2026',
  privacyNoticeVersion: 'v1.0-2026',
  termsVersion: 'v1.0-2026',
  cancellationPolicyVersion: 'v1.0-2026'
};

/**
 * Actualiza la configuración en memoria cuando se reciben datos en vivo desde settings/negocio en Firestore.
 */
export function updateBusinessConfigFromFirestore(liveConfig: Partial<BusinessConfig> | null) {
  if (!liveConfig) return;
  for (const [key, value] of Object.entries(liveConfig)) {
    if (value !== undefined && value !== null && key in BUSINESS_CONFIG) {
      (BUSINESS_CONFIG as any)[key] = value;
    }
  }
}
