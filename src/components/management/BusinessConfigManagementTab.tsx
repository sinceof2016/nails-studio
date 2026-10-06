import React, { useState, useEffect } from 'react';
import { BusinessConfig } from '../../config/businessConfig';
import { validateAndClean, validateEmail } from '../../utils/security';

interface BusinessConfigManagementTabProps {
  config: BusinessConfig;
  onSaveConfig: (updatedConfig: BusinessConfig) => Promise<void>;
  onToast?: (message: string) => void;
}

export const BusinessConfigManagementTab: React.FC<BusinessConfigManagementTabProps> = ({
  config,
  onSaveConfig,
  onToast
}) => {
  const [formData, setFormData] = useState<BusinessConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setFormData({ ...config });
  }, [config]);

  const handleChange = (field: keyof BusinessConfig, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Validar campos de texto con validateAndClean (máx 200; dirección 300)
    const textValidations: { key: keyof BusinessConfig; label: string; max: number }[] = [
      { key: 'brandName', label: 'Nombre Comercial', max: 100 },
      { key: 'businessName', label: 'Razón Social', max: 200 },
      { key: 'nit', label: 'NIT', max: 40 },
      { key: 'representanteLegal', label: 'Representante Legal', max: 120 },
      { key: 'address', label: 'Dirección Principal', max: 300 },
      { key: 'city', label: 'Ciudad', max: 80 },
      { key: 'country', label: 'País', max: 80 },
      { key: 'phoneFormatted', label: 'Teléfono Visible', max: 40 },
      { key: 'whatsappFormatted', label: 'WhatsApp Visible', max: 40 },
      { key: 'branchName', label: 'Nombre de la Sede', max: 100 },
      { key: 'bookingCodePrefix', label: 'Prefijo de Códigos', max: 10 },
      { key: 'taxNotice', label: 'Aviso Fiscal', max: 300 },
      { key: 'dataPolicyVersion', label: 'Versión Política de Datos', max: 40 },
      { key: 'privacyNoticeVersion', label: 'Versión Aviso de Privacidad', max: 40 },
      { key: 'termsVersion', label: 'Versión Términos y Condiciones', max: 40 },
      { key: 'cancellationPolicyVersion', label: 'Versión Política de Cancelación', max: 40 }
    ];

    const cleanedData: Partial<BusinessConfig> = {};

    for (const item of textValidations) {
      const val = formData[item.key] as string;
      const res = validateAndClean(val, item.label, item.max);
      if (!res.ok) {
        setErrorMsg(res.error || `Error en el campo "${item.label}".`);
        return;
      }
      cleanedData[item.key] = res.value as any;
    }

    if (!String(cleanedData.brandName || '').trim()) {
      setErrorMsg('El nombre comercial de la marca es obligatorio.');
      return;
    }

    // 2. whatsapp y phone: solo dígitos (permitir +)
    const phoneVal = String(formData.phone || '').trim();
    if (!phoneVal) {
      setErrorMsg('El teléfono es obligatorio.');
      return;
    }
    const phoneCheck = validateAndClean(phoneVal, 'Teléfono', 30);
    if (!phoneCheck.ok) {
      setErrorMsg(phoneCheck.error || 'Teléfono inválido.');
      return;
    }
    if (!phoneVal.startsWith('PENDIENTE_') && !/^\+?[0-9]+$/.test(phoneVal.replace(/[\s\-]/g, ''))) {
      setErrorMsg('El teléfono solo debe contener dígitos (se permite el prefijo +).');
      return;
    }
    cleanedData.phone = phoneCheck.value;

    const whatsappVal = String(formData.whatsapp || '').trim();
    if (!whatsappVal) {
      setErrorMsg('El número de WhatsApp es obligatorio.');
      return;
    }
    const whatsappCheck = validateAndClean(whatsappVal, 'WhatsApp', 30);
    if (!whatsappCheck.ok) {
      setErrorMsg(whatsappCheck.error || 'WhatsApp inválido.');
      return;
    }
    if (!whatsappVal.startsWith('PENDIENTE_') && !/^\+?[0-9]+$/.test(whatsappVal.replace(/[\s\-]/g, ''))) {
      setErrorMsg('El WhatsApp solo debe contener dígitos (se permite el prefijo +).');
      return;
    }
    cleanedData.whatsapp = whatsappCheck.value;

    // 3. email y privacyEmail: formato de correo
    const emailVal = String(formData.email || '').trim();
    if (!emailVal) {
      setErrorMsg('El correo electrónico de atención es obligatorio.');
      return;
    }
    const emailRes = validateEmail(emailVal, 'Correo de Atención', 120);
    if (!emailRes.isValid) {
      setErrorMsg(emailRes.reason || 'Correo de atención inválido.');
      return;
    }
    cleanedData.email = emailVal.toLowerCase();

    const privacyEmailVal = String(formData.privacyEmail || '').trim();
    if (!privacyEmailVal) {
      setErrorMsg('El correo de privacidad es obligatorio.');
      return;
    }
    const privacyEmailRes = validateEmail(privacyEmailVal, 'Correo de Privacidad', 120);
    if (!privacyEmailRes.isValid) {
      setErrorMsg(privacyEmailRes.reason || 'Correo de privacidad inválido.');
      return;
    }
    cleanedData.privacyEmail = privacyEmailVal.toLowerCase();

    // 4. cancellationNoticeHours: entero 0-168
    const cancelHours = Number(formData.cancellationNoticeHours);
    if (!Number.isInteger(cancelHours) || cancelHours < 0 || cancelHours > 168) {
      setErrorMsg('Las horas de anticipación para cancelación deben ser un número entero entre 0 y 168 horas.');
      return;
    }
    cleanedData.cancellationNoticeHours = cancelHours;

    cleanedData.advancePaymentRequired = Boolean(formData.advancePaymentRequired);

    setIsSaving(true);
    try {
      await onSaveConfig({
        ...formData,
        ...(cleanedData as BusinessConfig)
      });
      setSuccessMsg('✓ Datos del negocio guardados y sincronizados correctamente en Firestore.');
      if (onToast) {
        onToast('Datos del negocio actualizados con éxito.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Error al guardar en Firestore: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-[#C6BDAC]/70 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
            Información y Configuración del Negocio (settings/negocio)
          </h3>
          <p className="text-xs text-[#5A4A43]">
            Fuente única de verdad para identidad comercial, datos jurídicos, WhatsApp, políticas legales y sedes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Identidad Jurídica y Marca */}
        <div className="bg-white p-5 rounded-2xl border border-[#C6BDAC]/70 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#C6BDAC]/40">
            <span className="material-symbols-outlined text-[18px] text-[#BB9C87]">verified</span>
            <h4 className="font-bold text-sm text-[#2B2420]">Identidad Jurídica & Comercial</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Nombre Comercial (Marca) *</label>
              <input
                type="text"
                required
                value={formData.brandName}
                onChange={(e) => handleChange('brandName', e.target.value)}
                placeholder="Ej. La Pelu SPA"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Razón Social del Titular</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                placeholder="Ej. PENDIENTE_RAZON_SOCIAL"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">NIT / Identificación Tributaria</label>
              <input
                type="text"
                value={formData.nit}
                onChange={(e) => handleChange('nit', e.target.value)}
                placeholder="Ej. PENDIENTE_NIT"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Representante Legal</label>
              <input
                type="text"
                value={formData.representanteLegal}
                onChange={(e) => handleChange('representanteLegal', e.target.value)}
                placeholder="Ej. PENDIENTE_REPRESENTANTE_LEGAL"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>
          </div>
        </div>

        {/* 2. Domicilio y Sedes */}
        <div className="bg-white p-5 rounded-2xl border border-[#C6BDAC]/70 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#C6BDAC]/40">
            <span className="material-symbols-outlined text-[18px] text-[#BB9C87]">store</span>
            <h4 className="font-bold text-sm text-[#2B2420]">Ubicación y Sedes</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#5A4A43] mb-1">Nombre de la Sede</label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => handleChange('branchName', e.target.value)}
                placeholder="Ej. Santuario Patio Bonito"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#5A4A43] mb-1">Dirección Física</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Ej. PENDIENTE_DIRECCION"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Ciudad</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ej. PENDIENTE_CIUDAD"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">País</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Colombia"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Prefijo Códigos de Reserva</label>
              <input
                type="text"
                value={formData.bookingCodePrefix}
                onChange={(e) => handleChange('bookingCodePrefix', e.target.value)}
                placeholder="PELU"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Horas Anticipación Cancelación</label>
              <input
                type="number"
                min="0"
                max="720"
                value={formData.cancellationNoticeHours}
                onChange={(e) => handleChange('cancellationNoticeHours', Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3. Canales de Contacto */}
        <div className="bg-white p-5 rounded-2xl border border-[#C6BDAC]/70 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#C6BDAC]/40">
            <span className="material-symbols-outlined text-[18px] text-[#BB9C87]">contact_phone</span>
            <h4 className="font-bold text-sm text-[#2B2420]">Canales de Contacto & WhatsApp</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">WhatsApp Numérico (E.164 sin +)</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="Ej. PENDIENTE_WHATSAPP"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">WhatsApp Formateado (Visual)</label>
              <input
                type="text"
                value={formData.whatsappFormatted}
                onChange={(e) => handleChange('whatsappFormatted', e.target.value)}
                placeholder="Ej. PENDIENTE_WHATSAPP_FORMATO"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Teléfono Numérico</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Ej. PENDIENTE_TELEFONO"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Teléfono Formateado (Visual)</label>
              <input
                type="text"
                value={formData.phoneFormatted}
                onChange={(e) => handleChange('phoneFormatted', e.target.value)}
                placeholder="Ej. PENDIENTE_TELEFONO_FORMATO"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Correo Electrónico General / PQRS</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Ej. PENDIENTE_CORREO_GENERAL"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Correo Exclusivo Privacidad / Habeas Data</label>
              <input
                type="email"
                value={formData.privacyEmail}
                onChange={(e) => handleChange('privacyEmail', e.target.value)}
                placeholder="Ej. PENDIENTE_CORREO_PRIVACIDAD"
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>
          </div>
        </div>

        {/* 4. Políticas Legales y Régimen Fiscal */}
        <div className="bg-white p-5 rounded-2xl border border-[#C6BDAC]/70 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#C6BDAC]/40">
            <span className="material-symbols-outlined text-[18px] text-[#BB9C87]">gavel</span>
            <h4 className="font-bold text-sm text-[#2B2420]">Régimen Legal & Versiones Vigentes</h4>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Aviso Fiscal / IVA (Ley 1480 de 2011)</label>
              <input
                type="text"
                value={formData.taxNotice}
                onChange={(e) => handleChange('taxNotice', e.target.value)}
                placeholder="Precios en pesos colombianos (COP)."
                className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-[#5A4A43] mb-1">Versión Política de Datos</label>
                <input
                  type="text"
                  value={formData.dataPolicyVersion}
                  onChange={(e) => handleChange('dataPolicyVersion', e.target.value)}
                  placeholder="v1.0-2026"
                  className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5A4A43] mb-1">Versión Aviso de Privacidad</label>
                <input
                  type="text"
                  value={formData.privacyNoticeVersion}
                  onChange={(e) => handleChange('privacyNoticeVersion', e.target.value)}
                  placeholder="v1.0-2026"
                  className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5A4A43] mb-1">Versión Términos</label>
                <input
                  type="text"
                  value={formData.termsVersion}
                  onChange={(e) => handleChange('termsVersion', e.target.value)}
                  placeholder="v1.0-2026"
                  className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#5A4A43] mb-1">Versión Cancelación</label>
                <input
                  type="text"
                  value={formData.cancellationPolicyVersion}
                  onChange={(e) => handleChange('cancellationPolicyVersion', e.target.value)}
                  placeholder="v1.0-2026"
                  className="w-full h-9 px-3 rounded-xl bg-[#F4EFE9]/40 border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>Guardando en Firestore...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Guardar Datos del Negocio</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
