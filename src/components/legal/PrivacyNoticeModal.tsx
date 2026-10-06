import React from 'react';
import { BUSINESS_CONFIG, LEGAL_LAST_UPDATE } from '../../config/businessConfig';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullPolicy: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  onOpenFullPolicy
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-notice-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] z-10 flex flex-col space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-[#C6BDAC]/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#BB9C87]/10 text-[#2B2420] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div>
              <h3 id="privacy-notice-title" className="font-bold text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                Aviso de Privacidad
              </h3>
              <p className="text-xs text-[#5A4A43]">
                Versión {BUSINESS_CONFIG.privacyNoticeVersion} · Última actualización: {LEGAL_LAST_UPDATE}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#5A4A43] leading-relaxed">
          <p>
            <strong>{BUSINESS_CONFIG.businessName}</strong> (en adelante <strong>"{BUSINESS_CONFIG.brandName}"</strong>), con NIT {BUSINESS_CONFIG.nit}, con domicilio en {BUSINESS_CONFIG.address}, {BUSINESS_CONFIG.city}, en calidad de Responsable del Tratamiento de datos personales, informa:
          </p>

          <p>
            Los datos personales que usted nos suministra (nombre, teléfono, correo y datos de agendamiento) serán tratados para: <strong>(i)</strong> agendar, confirmar y gestionar sus turnos y citas de belleza; <strong>(ii)</strong> enviar recordatorios transaccionales vía WhatsApp o correo electrónico; y <strong>(iii)</strong> llevar el control contable y de facturación del servicio prestado en el establecimiento.
          </p>

          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1 text-[11px]">
            <strong className="block text-rose-900">Advertencia sobre Datos Sensibles y de Salud:</strong>
            <span>
              El suministro de datos sensibles es estrictamente facultativo. <strong>No ingrese información médica, diagnósticos ni datos sensibles en los campos de observaciones</strong>.
            </span>
          </div>

          <p>
            Como titular, usted tiene derecho a conocer, actualizar, rectificar y suprimir sus datos, o revocar su autorización dirigiéndose al correo <strong>{BUSINESS_CONFIG.privacyEmail}</strong> o a través de nuestros canales de atención.
          </p>
        </div>

        <div className="pt-3 border-t border-[#C6BDAC]/70 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenFullPolicy();
            }}
            className="text-xs text-[#2B2420] font-bold underline hover:text-[#AA8A74] cursor-pointer"
          >
            Ver Política Completa de Datos
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
