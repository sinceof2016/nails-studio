import React from 'react';
import { Service, Specialist } from '../../../types';
import { formatCOP } from '../../../utils/format';
import { HOURLY_TIME_SLOTS } from '../../../utils/calendarAvailability';

interface ExpressAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  expressClientName: string;
  setExpressClientName: (name: string) => void;
  expressClientPhone: string;
  setExpressClientPhone: (phone: string) => void;
  expressServiceId: string;
  setExpressServiceId: (id: string) => void;
  expressSpecialistId: string;
  setExpressSpecialistId: (id: string) => void;
  expressTime: string;
  setExpressTime: (time: string) => void;
  expressStatus: 'confirmada' | 'en_preparacion';
  setExpressStatus: (status: 'confirmada' | 'en_preparacion') => void;
  expressNotes: string;
  setExpressNotes: (notes: string) => void;
  expressSendWhatsApp: boolean;
  setExpressSendWhatsApp: (send: boolean) => void;
  expressValidationError: string | null;
  services: Service[];
  specialists: Specialist[];
  isSubmitting?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ExpressAppointmentModal: React.FC<ExpressAppointmentModalProps> = ({
  isOpen,
  onClose,
  expressClientName,
  setExpressClientName,
  expressClientPhone,
  setExpressClientPhone,
  expressServiceId,
  setExpressServiceId,
  expressSpecialistId,
  setExpressSpecialistId,
  expressTime,
  setExpressTime,
  expressStatus,
  setExpressStatus,
  expressNotes,
  setExpressNotes,
  expressSendWhatsApp,
  setExpressSendWhatsApp,
  expressValidationError,
  services,
  specialists,
  isSubmitting = false,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-3.5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#BB9C87] text-[#2B2420] font-bold flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">flash_on</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                Turno Express (Walk-in en 10s)
              </h3>
              <p className="text-[10px] text-[#5A4A43]">Ingreso rápido para clientas que llegan directamente a recepción</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {expressValidationError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {expressValidationError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Nombre de la Clienta</label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={expressClientName}
                onChange={(e) => setExpressClientName(e.target.value)}
                placeholder="Ej. Carolina Gómez"
                maxLength={100}
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">WhatsApp (+57)</label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={expressClientPhone}
                onChange={(e) => setExpressClientPhone(e.target.value)}
                placeholder="Ej. 300 123 4567"
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs font-mono text-[#2B2420]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Tratamiento / Servicio</label>
            <select
              value={expressServiceId}
              disabled={isSubmitting}
              onChange={(e) => setExpressServiceId(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatCOP(s.price)} ({s.durationMinutes} min)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Manicurista Asignada</label>
              <select
                value={expressSpecialistId}
                disabled={isSubmitting}
                onChange={(e) => setExpressSpecialistId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
              >
                {specialists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Franja Horaria de Hoy</label>
              <select
                value={expressTime}
                disabled={isSubmitting}
                onChange={(e) => setExpressTime(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#C6BDAC] text-xs font-mono font-bold text-[#2B2420]"
              >
                {HOURLY_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Estado de Entrada</label>
            <select
              value={expressStatus}
              disabled={isSubmitting}
              onChange={(e) => setExpressStatus(e.target.value as 'confirmada' | 'en_preparacion')}
              className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
            >
              <option value="en_preparacion">En Cabina (Inmediato)</option>
              <option value="confirmada">En Sala de Espera</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Observación Rápida (Opcional)</label>
            <input
              type="text"
              disabled={isSubmitting}
              value={expressNotes}
              onChange={(e) => setExpressNotes(e.target.value)}
              placeholder="Ej. Tono Glazed, uña almendrada..."
              maxLength={500}
              className="w-full h-8 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-[#C6BDAC]/80 flex items-center justify-between">
            <span className="text-[11px] text-[#5A4A43]">Enviar Pase Digital por WhatsApp</span>
            <input
              type="checkbox"
              disabled={isSubmitting}
              checked={expressSendWhatsApp}
              onChange={(e) => setExpressSendWhatsApp(e.target.checked)}
              className="h-4 w-4 accent-[#2B2420] cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#2B2420] border-t-transparent rounded-full animate-spin" />
                <span>Guardando Cita y Bloqueo en Firestore...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Crear Turno Express &amp; Pasar a Cabina</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
