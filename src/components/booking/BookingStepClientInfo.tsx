import React from 'react';
import { Service, Specialist } from '../../types';
import { CalendarDayOption } from '../../utils/calendarAvailability';
import { formatCOP } from '../../utils/format';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

interface BookingStepClientInfoProps {
  selectedService: Service | null;
  selectedDateOption: CalendarDayOption;
  selectedTime: string;
  currentSpecialist: Specialist | null;
  finalPrice: number;
  formError: string | null;
  clientName: string;
  setClientName: (name: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  clientNotes: string;
  setClientNotes: (notes: string) => void;
  acceptedDataPolicy: boolean;
  setAcceptedDataPolicy: (val: boolean) => void;
  onOpenDataPolicy?: () => void;
  onOpenPrivacyNotice?: () => void;
  onOpenTerms?: () => void;
  isSendingWhatsApp: boolean;
  onClearError: () => void;
  onBack: () => void;
  onConfirm: () => void;
}

export const BookingStepClientInfo: React.FC<BookingStepClientInfoProps> = ({
  selectedService,
  selectedDateOption,
  selectedTime,
  currentSpecialist,
  finalPrice,
  formError,
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  clientNotes,
  setClientNotes,
  acceptedDataPolicy,
  setAcceptedDataPolicy,
  onOpenDataPolicy,
  onOpenPrivacyNotice,
  onOpenTerms,
  isSendingWhatsApp,
  onClearError,
  onBack,
  onConfirm
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Summary Box */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAD6D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAD6D9]/60 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
              Resumen de tu Cita
            </h3>
            <p className="text-[11px] text-[#644E53]">
              {BUSINESS_CONFIG.taxNotice}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#64444B] font-mono block">
              {formatCOP(finalPrice)}
            </span>
            <span className="text-[10px] text-[#7D676B]">Pago en sede al finalizar</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-[#7D676B] uppercase block">Servicio</span>
            <strong className="text-[#1F1417] block">{selectedService?.name}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#7D676B] uppercase block">Fecha &amp; Hora</span>
            <strong className="text-[#1F1417] block">{selectedDateOption.full} · {selectedTime}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#7D676B] uppercase block">Especialista</span>
            <strong className="text-[#64444B] block">{currentSpecialist?.name || 'Asignación Libre'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#7D676B] uppercase block">Sede</span>
            <strong className="text-[#1F1417] block">{BUSINESS_CONFIG.branchName}</strong>
          </div>
        </div>
      </div>

      {/* Error Banner if any validation fails */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-center gap-2.5 animate-in shake duration-150 shadow-xs">
          <span className="material-symbols-outlined text-rose-600 text-[20px] shrink-0">shield_lock</span>
          <span className="font-semibold">{formError}</span>
        </div>
      )}

      {/* Client Details Form */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAD6D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
            Datos para Confirmación de Reserva
          </h3>
          <span className="text-[11px] text-[#64444B] bg-[#F6E3E6] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">verified_user</span>
            Habeas Data Ley 1581
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                onClearError();
              }}
              placeholder="Ej. Mariana Duque"
              className="w-full h-10 px-3.5 rounded-xl bg-[#FAF4F5] border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Número de WhatsApp (+57) *</label>
            <input
              type="text"
              required
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                onClearError();
              }}
              placeholder="+57 300 000 0000"
              className="w-full h-10 px-3.5 rounded-xl bg-[#FAF4F5] border border-[#EAD6D9] text-xs font-mono text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-[#644E53] mb-1">
              Observaciones del servicio (Opcional)
            </label>
            <input
              type="text"
              value={clientNotes}
              onChange={(e) => {
                setClientNotes(e.target.value);
                onClearError();
              }}
              placeholder="Ej. Esmalte anterior a retirar, preferencia de tono..."
              className="w-full h-10 px-3.5 rounded-xl bg-[#FAF4F5] border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/30"
            />
            {/* Advertencia expresa de salud y datos sensibles (Ley 1581) */}
            <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-[11px] mt-2 flex items-start gap-1.5">
              <span className="material-symbols-outlined text-amber-700 text-[15px] shrink-0 mt-0.5">info</span>
              <span>
                <strong>Aviso de Privacidad:</strong> No escribas datos de salud, condiciones médicas ni información sensible en este campo. Cualquier condición particular debe indicarse verbalmente a la especialista.
              </span>
            </div>
          </div>
        </div>

        {/* Casilla de Autorización de Tratamiento de Datos Personales (Ley 1581) */}
        <div className="pt-2 border-t border-[#EAD6D9]/60">
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9] cursor-pointer hover:bg-[#F6E3E6]/40 transition-colors">
            <input
              type="checkbox"
              checked={acceptedDataPolicy}
              onChange={(e) => {
                setAcceptedDataPolicy(e.target.checked);
                onClearError();
              }}
              className="mt-0.5 w-4 h-4 rounded text-[#64444B] focus:ring-[#64444B] accent-[#64444B] cursor-pointer shrink-0"
              required
            />
            <span className="text-xs text-[#1F1417] leading-relaxed">
              <strong>Autorizo expresamente el tratamiento de mis datos personales</strong> conforme a la{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenDataPolicy) onOpenDataPolicy();
                }}
                className="text-[#64444B] font-bold underline hover:text-[#52363C] cursor-pointer"
              >
                Política de Tratamiento de Datos Personales
              </button>{' '}
              y el{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenPrivacyNotice) onOpenPrivacyNotice();
                }}
                className="text-[#64444B] font-bold underline hover:text-[#52363C] cursor-pointer"
              >
                Aviso de Privacidad
              </button>{' '}
              de {BUSINESS_CONFIG.brandName}, para la gestión, confirmación y facturación de mi cita.
            </span>
          </label>
        </div>

        {/* Notificación WhatsApp Transaccional */}
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">mark_chat_read</span>
          <span>
            Se enviará una notificación transaccional con tu código de reserva ({BUSINESS_CONFIG.bookingCodePrefix}-XXXX) a tu número de WhatsApp.
          </span>
        </div>
      </div>

      {/* Confirm Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white border border-[#EAD6D9] text-[#644E53] text-xs font-semibold hover:bg-[#F6E3E6] cursor-pointer"
        >
          Atrás
        </button>
        <button
          onClick={onConfirm}
          disabled={isSendingWhatsApp}
          className="px-7 py-3.5 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{isSendingWhatsApp ? 'Enviando WhatsApp...' : 'Confirmar Reserva en COP'}</span>
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
        </button>
      </div>
    </div>
  );
};
