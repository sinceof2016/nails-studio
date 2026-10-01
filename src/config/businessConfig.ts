/**
 * Configuración centralizada de datos legales y de contacto de La Pelu SPA.
 * PENDIENTE REVISIÓN LEGAL: Los datos marcados con PENDIENTE_ son marcadores que deben ser
 * completados con la información jurídica y corporativa real del negocio.
 */

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
  address: getEnv('VITE_BUSINESS_ADDRESS', 'PENDIENTE_DOMICILIO_DIRECCION'),
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
  branchName: getEnv('VITE_BRANCH_NAME', 'Sede Principal'),
  bookingCodePrefix: getEnv('VITE_BOOKING_CODE_PREFIX', 'PELU'),

  // Régimen comercial y consumidor (Ley 1480 de 2011)
  // PENDIENTE REVISIÓN LEGAL: Confirmar si el negocio es responsable de IVA (Régimen Común/Simple) y política de propinas
  taxNotice: 'Precios en pesos colombianos (COP). No incluyen IVA.',
  cancellationNoticeHours: 24, // PENDIENTE REVISIÓN LEGAL: Confirmar plazo de anticipación para cancelación
  advancePaymentRequired: false, // La reserva online NO cobra anticipo ni solicita datos de pago en línea

  // Versiones de documentos legales (Habeas Data & Consumidor)
  dataPolicyVersion: 'v1.0-2026-BORRADOR',
  privacyNoticeVersion: 'v1.0-2026-BORRADOR',
  termsVersion: 'v1.0-2026-BORRADOR',
  cancellationPolicyVersion: 'v1.0-2026-BORRADOR'
};

/**
 * Validador de producción: emite advertencias en consola si hay marcadores pendientes.
 */
export function checkPendingBusinessData(): string[] {
  const pendingKeys: string[] = [];
  const entries = Object.entries(BUSINESS_CONFIG);
  for (const [k, v] of entries) {
    if (typeof v === 'string' && v.startsWith('PENDIENTE_')) {
      pendingKeys.push(k);
    }
  }
  if (pendingKeys.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `[La Pelu SPA - Cumplimiento Legal] Hay ${pendingKeys.length} datos del negocio pendientes por configurar en variables de entorno:`,
      pendingKeys.join(', ')
    );
  }
  return pendingKeys;
}
