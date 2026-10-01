import React from 'react';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

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

      <div className="relative w-full max-w-lg bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] z-10 flex flex-col space-y-4 animate-in zoom-in-95 duration-200">
        <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-amber-700">gavel</span>
          <span>BORRADOR PENDIENTE REVISIÓN LEGAL</span>
        </div>

        <div className="flex items-start justify-between border-b border-[#EAD6D9]/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#64444B]/10 text-[#64444B] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div>
              <h3 id="privacy-notice-title" className="font-bold text-base text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                Aviso de Privacidad
              </h3>
              <p className="text-xs text-[#644E53]">
                {BUSINESS_CONFIG.brandName} · {BUSINESS_CONFIG.privacyNoticeVersion}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#644E53] leading-relaxed">
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

        <div className="pt-3 border-t border-[#EAD6D9]/70 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenFullPolicy();
            }}
            className="text-xs text-[#64444B] font-bold underline hover:text-[#52363C] cursor-pointer"
          >
            Ver Política Completa de Datos
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
