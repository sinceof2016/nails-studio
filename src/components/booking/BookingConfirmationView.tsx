import React from 'react';
import { Appointment } from '../../types';
import { formatCOP } from '../../utils/format';
import { buildWaMeUrl } from '../../services/whatsappService';
import { BUSINESS_CONFIG } from '../../config/businessConfig';
import { formatDisplayDate } from '../../utils/dateAndId';

interface BookingConfirmationViewProps {
  bookingConfirmed: Appointment;
  isPublicView?: boolean;
  onNavigateToAppointments: () => void;
  onReset: () => void;
}

export const BookingConfirmationView: React.FC<BookingConfirmationViewProps> = ({
  bookingConfirmed,
  isPublicView,
  onNavigateToAppointments,
  onReset
}) => {
  const formattedDate = formatDisplayDate(bookingConfirmed.date);
  const waUrl = buildWaMeUrl(
    bookingConfirmed.clientPhone,
    `Hola! Tengo mi reserva ${bookingConfirmed.bookingCode} confirmada para el ${formattedDate} a las ${bookingConfirmed.time} con ${bookingConfirmed.specialistName} en ${BUSINESS_CONFIG.brandName}.`
  );

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-lg mx-auto text-center animate-in zoom-in-95 duration-200">
      <div className="w-20 h-20 rounded-full bg-[#F4D9DC] border border-[#EAD6D9] flex items-center justify-center text-[#64444B] mb-4 shadow-xs">
        <span className="material-symbols-outlined text-[42px]">check_circle</span>
      </div>

      <span className="text-xs uppercase font-bold tracking-widest text-[#64444B]">
        ¡Reserva Confirmada Exitosamente!
      </span>
      <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#1F1417] mt-1 mb-2">
        Te esperamos en el Santuario
      </h2>
      <p className="text-xs text-[#644E53] mb-6 max-w-xs">
        Hemos sincronizado tu turno en nuestro libro de citas y bloqueado el horario con tu especialista.
      </p>

      {/* Appointment Card */}
      <div className="w-full bg-white rounded-3xl p-6 border border-[#EAD6D9] shadow-xs text-left space-y-4 mb-6">
        <div className="flex items-center justify-between border-b border-[#EAD6D9]/60 pb-3">
          <div>
            <span className="text-[10px] text-[#644E53] uppercase tracking-wider block">
              Código de Turno
            </span>
            <strong className="text-base font-mono text-[#64444B]">
              {bookingConfirmed.bookingCode}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#644E53] uppercase tracking-wider block">
              Total a Pagar en Sede
            </span>
            <strong className="text-base font-mono text-[#1F1417]">
              {formatCOP(bookingConfirmed.totalPrice)}
            </strong>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#644E53]">Servicio:</span>
            <strong className="text-[#1F1417]">{bookingConfirmed.serviceName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#644E53]">Fecha &amp; Hora:</span>
            <strong className="text-[#1F1417]">{formattedDate} · {bookingConfirmed.time}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#644E53]">Especialista Asignada:</span>
            <strong className="text-[#64444B]">{bookingConfirmed.specialistName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#644E53]">Sede:</span>
            <strong className="text-[#1F1417]">{BUSINESS_CONFIG.branchName}</strong>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
          <span>
            ¡Cita confirmada exitosamente! Hemos enviado los detalles y recordatorio a tu WhatsApp.
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full flex flex-col gap-2.5">
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#0b421a] font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Ver Confirmación en WhatsApp</span>
        </a>

        {!isPublicView && (
          <button
            onClick={onNavigateToAppointments}
            className="w-full py-3.5 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>Ver Cita en el Libro Maestro</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full py-3 rounded-full bg-white hover:bg-[#F6E3E6] border border-[#EAD6D9] text-[#644E53] font-semibold text-xs transition-colors cursor-pointer"
        >
          Reservar Otra Cita
        </button>
      </div>
    </div>
  );
};
