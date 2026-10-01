import React, { useState } from 'react';
import { Appointment } from '../types';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { formatDisplayDate } from '../utils/dateAndId';

interface QrCodeModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  appointment,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  if (!appointment) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(appointment.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-[#fdf9f3] rounded-3xl shadow-2xl overflow-hidden p-6 z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7c5357]">
              qr_code_scanner
            </span>
            <h3 className="font-semibold text-base text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
              Pase Digital de Cita
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#ebe8e2] flex items-center justify-center text-[#504444]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Ticket card */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8b4b8]/40 shadow-sm text-center relative overflow-hidden">
          <div className="text-xs uppercase tracking-widest text-[#7c5357] font-semibold mb-1">
            {BUSINESS_CONFIG.brandName} Sanctuary
          </div>
          <h4 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
            {appointment.serviceName}
          </h4>
          <p className="text-xs text-[#504444] mt-0.5">
            Especialista: <strong className="text-[#1c1c18]">{appointment.specialistName}</strong>
          </p>

          {/* QR code visual */}
          <div className="my-4 mx-auto w-44 h-44 bg-[#fdf9f3] p-3 rounded-2xl border-2 border-dashed border-[#e8b4b8] flex flex-col items-center justify-center shadow-inner">
            <svg
              className="w-36 h-36"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" fill="#fdf9f3" />
              {/* Corner markers */}
              <rect x="10" y="10" width="24" height="24" fill="#3e2c35" rx="4" />
              <rect x="14" y="14" width="16" height="16" fill="#fdf9f3" rx="2" />
              <rect x="18" y="18" width="8" height="8" fill="#7c5357" rx="1" />

              <rect x="66" y="10" width="24" height="24" fill="#3e2c35" rx="4" />
              <rect x="70" y="14" width="16" height="16" fill="#fdf9f3" rx="2" />
              <rect x="74" y="18" width="8" height="8" fill="#7c5357" rx="1" />

              <rect x="10" y="66" width="24" height="24" fill="#3e2c35" rx="4" />
              <rect x="14" y="70" width="16" height="16" fill="#fdf9f3" rx="2" />
              <rect x="18" y="74" width="8" height="8" fill="#7c5357" rx="1" />

              {/* Data matrix pattern aesthetic */}
              <rect x="42" y="12" width="6" height="6" fill="#7c5357" />
              <rect x="52" y="12" width="6" height="6" fill="#3e2c35" />
              <rect x="42" y="24" width="16" height="6" fill="#7c5357" />
              <rect x="12" y="42" width="8" height="8" fill="#3e2c35" />
              <rect x="24" y="42" width="12" height="6" fill="#7c5357" />
              <rect x="42" y="40" width="16" height="16" fill="#3e2c35" rx="2" />
              <rect x="46" y="44" width="8" height="8" fill="#e8b4b8" />
              <rect x="66" y="42" width="12" height="6" fill="#7c5357" />
              <rect x="82" y="42" width="6" height="18" fill="#3e2c35" />
              <rect x="42" y="66" width="6" height="12" fill="#7c5357" />
              <rect x="54" y="66" width="18" height="6" fill="#3e2c35" />
              <rect x="76" y="66" width="12" height="12" fill="#7c5357" />
              <rect x="54" y="78" width="6" height="10" fill="#3e2c35" />
              <rect x="66" y="82" width="12" height="6" fill="#7c5357" />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f7f3ed] border border-[#ebe8e2]">
            <span className="text-xs font-mono font-bold text-[#7c5357]">
              {appointment.bookingCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="text-[10px] text-[#504444] hover:text-[#7c5357] font-semibold"
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-[#ebe8e2] text-xs text-[#504444] space-y-1">
            <div className="flex justify-between">
              <span>Fecha:</span>
              <strong className="text-[#1c1c18]">{formatDisplayDate(appointment.date)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Hora:</span>
              <strong className="text-[#1c1c18]">{appointment.time}</strong>
            </div>
            <div className="flex justify-between">
              <span>Sede:</span>
              <strong className="text-[#1c1c18]">{BUSINESS_CONFIG.address}</strong>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-[#504444]">
            Presenta este código al ingresar a la recepción de nuestro santuario.
          </p>
        </div>
      </div>
    </div>
  );
};
