import React from 'react';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

interface CancellationPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CancellationPolicyModal: React.FC<CancellationPolicyModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancellation-policy-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#FAF4F5] rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#EAD6D9] z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Banner de Advertencia Legal */}
        <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-700 text-[16px] shrink-0">gavel</span>
          <span>
            <strong>BORRADOR PARA REVISIÓN LEGAL</strong> · PENDIENTE REVISIÓN LEGAL POR UN ABOGADO TITULADO
          </span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAD6D9]/70 pb-3 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64444B] bg-[#F6E3E6] px-2 py-0.5 rounded-full">
              Ley 1480 de 2011 · Transparencia
            </span>
            <h2 id="cancellation-policy-title" className="text-lg sm:text-xl font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] mt-1">
              Política de Cancelación, Cambios y Reembolsos
            </h2>
            <p className="text-xs text-[#644E53]">
              Versión: {BUSINESS_CONFIG.cancellationPolicyVersion} · {BUSINESS_CONFIG.brandName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53] cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 my-4 space-y-4 text-xs text-[#644E53] leading-relaxed text-justify">
          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#EAD6D9]/70">
            <h3 className="font-bold text-[#1F1417] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#64444B] text-[16px]">event_busy</span>
              1. Cancelación y Reprogramación Oportuna
            </h3>
            <p>
              Entendemos que pueden surgir imprevistos. Para cancelar o reprogramar una cita sin inconvenientes, solicitamos notificarnos con al menos <strong>{BUSINESS_CONFIG.cancellationNoticeHours} horas de anticipación</strong> a través de nuestra línea de WhatsApp <strong>{BUSINESS_CONFIG.whatsappFormatted || BUSINESS_CONFIG.whatsapp}</strong> o correo <strong>{BUSINESS_CONFIG.email}</strong>. <em>(PENDIENTE REVISIÓN LEGAL: Confirmar horas de anticipación requeridas por el negocio)</em>.
            </p>
          </section>

          <section className="space-y-1.5 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 text-emerald-950">
            <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-[16px]">credit_card_off</span>
              2. Ausencia de Cobro de Anticipos y Depósitos
            </h3>
            <p>
              <strong>{BUSINESS_CONFIG.brandName} no exige anticipos, abonos ni datos de tarjetas bancarias</strong> para apartar turnos en la página web. Por consiguiente, no se realizan deducciones bancarias automáticas por cancelaciones.
            </p>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#EAD6D9]/70">
            <h3 className="font-bold text-[#1F1417] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#64444B] text-[16px]">verified</span>
              3. Garantía del Servicio y Ajustes
            </h3>
            <p>
              En {BUSINESS_CONFIG.brandName} nos comprometemos con la excelencia técnica. Si presentas algún desprendimiento prematuro del esmalte o anomalía dentro de los <strong>tres (3) días calendario</strong> siguientes a la realización del servicio de manicura semipermanente o gel:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Comunícate de inmediato con soporte adjuntando una fotografía clara de las uñas afectadas.</li>
              <li>Coordinaremos una revisión y corrección sin costo adicional en el establecimiento, siempre que el desprendimiento no haya sido causado por golpes, arrancamiento forzado o uso de químicos agresivos sin guantes. <em>(PENDIENTE REVISIÓN LEGAL)</em>.</li>
            </ul>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#EAD6D9]/70">
            <h3 className="font-bold text-[#1F1417] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#64444B] text-[16px]">currency_exchange</span>
              4. Reembolsos
            </h3>
            <p>
              Dado que los servicios se pagan presencialmente al culminar la atención y tras la verificación a entera satisfacción del cliente, no aplican reembolsos en efectivo posteriores, sino la aplicación de la garantía de corrección técnica descrita en el numeral anterior. <em>(PENDIENTE REVISIÓN LEGAL)</em>.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#EAD6D9]/70 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
