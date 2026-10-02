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
  dataPolicyError?: boolean;
  checkboxRef?: React.RefObject<HTMLInputElement | null>;
  onClearDataPolicyError?: () => void;
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
  dataPolicyError,
  checkboxRef,
  onClearDataPolicyError,
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
      <div className="bg-white rounded-3xl p-6 border border-[#C6BDAC] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/60 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
              Resumen de tu Cita
            </h3>
            <p className="text-[11px] text-[#5A4A43]">
              {BUSINESS_CONFIG.taxNotice}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#2B2420] font-mono block">
              {formatCOP(finalPrice)}
            </span>
            <span className="text-[10px] text-[#5A4A43]">Pago en sede al finalizar</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-[#5A4A43] uppercase block">Servicio</span>
            <strong className="text-[#2B2420] block">{selectedService?.name}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#5A4A43] uppercase block">Fecha &amp; Hora</span>
            <strong className="text-[#2B2420] block">{selectedDateOption.full} · {selectedTime}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#5A4A43] uppercase block">Especialista</span>
            <strong className="text-[#2B2420] block">{currentSpecialist?.name || 'Asignación Libre'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#5A4A43] uppercase block">Sede</span>
            <strong className="text-[#2B2420] block">{BUSINESS_CONFIG.branchName}</strong>
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
      <div className="bg-white rounded-3xl p-6 border border-[#C6BDAC] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
            Datos para Confirmación de Reserva
          </h3>
          <span className="text-[11px] text-[#2B2420] bg-[#C6BDAC]/40 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">verified_user</span>
            Habeas Data Ley 1581
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              maxLength={100}
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                onClearError();
              }}
              placeholder="Ej. Camila Gómez"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F4EFE9] border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/30"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Número de WhatsApp (+57) *</label>
            <input
              type="text"
              required
              value={clientPhone}
              onChange={(e) => {
                setClientPhone(e.target.value);
                onClearError();
              }}
              placeholder="Ej. 300 123 4567"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F4EFE9] border border-[#C6BDAC] text-xs font-mono text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/30"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-[#5A4A43] mb-1">
              Observaciones del servicio (Opcional)
            </label>
            <input
              type="text"
              maxLength={500}
              value={clientNotes}
              onChange={(e) => {
                setClientNotes(e.target.value);
                onClearError();
              }}
              placeholder="Ej. Esmalte anterior a retirar, preferencia de tono..."
              className="w-full h-10 px-3.5 rounded-xl bg-[#F4EFE9] border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/30"
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
        <div className="pt-2 border-t border-[#C6BDAC]/60">
          <label
            className={`flex items-start gap-3 p-3.5 rounded-2xl transition-all cursor-pointer ${
              dataPolicyError
                ? 'bg-rose-50/80 border-2 border-rose-500 ring-2 ring-rose-200'
                : 'bg-[#F4EFE9] border border-[#C6BDAC] hover:bg-[#C6BDAC]/40'
            }`}
          >
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={acceptedDataPolicy}
              aria-invalid={dataPolicyError ? 'true' : 'false'}
              aria-describedby={dataPolicyError ? 'data-policy-error-msg' : undefined}
              onChange={(e) => {
                setAcceptedDataPolicy(e.target.checked);
                if (onClearDataPolicyError) onClearDataPolicyError();
                onClearError();
              }}
              className="mt-0.5 w-4 h-4 rounded text-[#2B2420] focus:ring-[#2B2420] accent-[#2B2420] cursor-pointer shrink-0"
              required
            />
            <span className="text-xs text-[#2B2420] leading-relaxed">
              <strong>Autorizo expresamente el tratamiento de mis datos personales</strong> conforme a la{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenDataPolicy) onOpenDataPolicy();
                }}
                className="text-[#2B2420] font-bold underline hover:text-[#AA8A74] cursor-pointer"
              >
                Política de Tratamiento de Datos
              </button>
              , el{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenPrivacyNotice) onOpenPrivacyNotice();
                }}
                className="text-[#2B2420] font-bold underline hover:text-[#AA8A74] cursor-pointer"
              >
                Aviso de Privacidad
              </button>
              {' '}y los{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenTerms) onOpenTerms();
                }}
                className="text-[#2B2420] font-bold underline hover:text-[#AA8A74] cursor-pointer"
              >
                Términos y Condiciones
              </button>
              {' '}de {BUSINESS_CONFIG.brandName}, para la gestión, confirmación y facturación de mi cita.
            </span>
          </label>

          {dataPolicyError && (
            <div
              id="data-policy-error-msg"
              role="alert"
              className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1.5 animate-in fade-in"
            >
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>Debes aceptar el tratamiento de datos personales para confirmar tu reserva</span>
            </div>
          )}
        </div>

        {/* Notificación WhatsApp Transaccional */}
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">mark_chat_read</span>
          <span>
            Podrás enviar y confirmar los detalles de tu cita ({BUSINESS_CONFIG.bookingCodePrefix}-XXXX) directamente por WhatsApp al registrar tu reserva.
          </span>
        </div>
      </div>

      {/* Confirm Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white border border-[#C6BDAC] text-[#5A4A43] text-xs font-semibold hover:bg-[#C6BDAC]/40 cursor-pointer"
        >
          Atrás
        </button>
        <button
          onClick={onConfirm}
          disabled={isSendingWhatsApp}
          className="px-7 py-3.5 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{isSendingWhatsApp ? 'Registrando cita...' : 'Confirmar Reserva en COP'}</span>
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
        </button>
      </div>
    </div>
  );
};
