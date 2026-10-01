import React from 'react';
import { Service, Specialist, Appointment } from '../../../types';
import { formatCOP } from '../../../utils/format';

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
  expressStatus: 'confirmada' | 'en_preparacion';
  setExpressStatus: (status: 'confirmada' | 'en_preparacion') => void;
  expressNotes: string;
  setExpressNotes: (notes: string) => void;
  expressSendWhatsApp: boolean;
  setExpressSendWhatsApp: (send: boolean) => void;
  expressValidationError: string | null;
  services: Service[];
  specialists: Specialist[];
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
  expressStatus,
  setExpressStatus,
  expressNotes,
  setExpressNotes,
  expressSendWhatsApp,
  setExpressSendWhatsApp,
  expressValidationError,
  services,
  specialists,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-3.5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#64444B] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">flash_on</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                Turno Express (Walk-in en 10s)
              </h3>
              <p className="text-[10px] text-[#644E53]">Ingreso rápido para clientas que llegan directamente a recepción</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]"
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
              <label className="block font-semibold text-[#644E53] mb-1">Nombre de la Clienta</label>
              <input
                type="text"
                required
                value={expressClientName}
                onChange={(e) => setExpressClientName(e.target.value)}
                placeholder="Ej. Carolina Gómez"
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#644E53] mb-1">WhatsApp (+57)</label>
              <input
                type="text"
                required
                value={expressClientPhone}
                onChange={(e) => setExpressClientPhone(e.target.value)}
                placeholder="+57 300 000 0000"
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs font-mono text-[#1F1417]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Tratamiento / Servicio</label>
            <select
              value={expressServiceId}
              onChange={(e) => setExpressServiceId(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
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
              <label className="block font-semibold text-[#644E53] mb-1">Manicurista Disponible</label>
              <select
                value={expressSpecialistId}
                onChange={(e) => setExpressSpecialistId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
              >
                {specialists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#644E53] mb-1">Estado de Entrada</label>
              <select
                value={expressStatus}
                onChange={(e) => setExpressStatus(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
              >
                <option value="en_preparacion">En Cabina (Inmediato)</option>
                <option value="confirmada">En Sala de Espera</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Observación Rápida (Opcional)</label>
            <input
              type="text"
              value={expressNotes}
              onChange={(e) => setExpressNotes(e.target.value)}
              placeholder="Ej. Tono Glazed, uña almendrada..."
              className="w-full h-8 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-[#EAD6D9]/80 flex items-center justify-between">
            <span className="text-[11px] text-[#644E53]">Enviar Pase Digital por WhatsApp</span>
            <input
              type="checkbox"
              checked={expressSendWhatsApp}
              onChange={(e) => setExpressSendWhatsApp(e.target.checked)}
              className="h-4 w-4 accent-[#64444B] cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Crear Turno Express &amp; Pasar a Cabina</span>
          </button>
        </form>
      </div>
    </div>
  );
};
