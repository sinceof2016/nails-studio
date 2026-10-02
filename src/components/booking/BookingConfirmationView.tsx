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
      <div className="w-20 h-20 rounded-full bg-[#C6BDAC]/50 border border-[#C6BDAC] flex items-center justify-center text-[#2B2420] mb-4 shadow-xs">
        <span className="material-symbols-outlined text-[42px]">check_circle</span>
      </div>

      <span className="text-xs uppercase font-bold tracking-widest text-[#2B2420]">
        ¡Reserva Confirmada Exitosamente!
      </span>
      <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#2B2420] mt-1 mb-2">
        Te esperamos en el Santuario
      </h2>
      <p className="text-xs text-[#5A4A43] mb-6 max-w-xs">
        Hemos sincronizado tu turno en nuestro libro de citas y bloqueado el horario con tu especialista.
      </p>

      {/* Appointment Card */}
      <div className="w-full bg-white rounded-3xl p-6 border border-[#C6BDAC] shadow-xs text-left space-y-4 mb-6">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/60 pb-3">
          <div>
            <span className="text-[10px] text-[#5A4A43] uppercase tracking-wider block">
              Código de Turno
            </span>
            <strong className="text-base font-mono text-[#2B2420]">
              {bookingConfirmed.bookingCode}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#5A4A43] uppercase tracking-wider block">
              Total a Pagar en Sede
            </span>
            <strong className="text-base font-mono text-[#2B2420]">
              {formatCOP(bookingConfirmed.totalPrice)}
            </strong>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#5A4A43]">Servicio:</span>
            <strong className="text-[#2B2420]">{bookingConfirmed.serviceName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5A4A43]">Fecha &amp; Hora:</span>
            <strong className="text-[#2B2420]">{formattedDate} · {bookingConfirmed.time}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5A4A43]">Especialista Asignada:</span>
            <strong className="text-[#2B2420]">{bookingConfirmed.specialistName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5A4A43]">Sede:</span>
            <strong className="text-[#2B2420]">{BUSINESS_CONFIG.branchName}</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0 mt-0.5">check_circle</span>
          <span className="leading-relaxed">
            Tu cita quedó registrada. Pulsa «Confirmar por WhatsApp» para enviar los detalles al negocio.
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full flex flex-col gap-2.5">
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-4 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#0b421a] font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          <span>Confirmar por WhatsApp</span>
        </a>

        {!isPublicView && (
          <button
            onClick={onNavigateToAppointments}
            className="w-full py-3.5 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>Ver Cita en el Libro Maestro</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full py-3 rounded-full bg-white hover:bg-[#C6BDAC]/40 border border-[#C6BDAC] text-[#5A4A43] font-semibold text-xs transition-colors cursor-pointer"
        >
          Reservar Otra Cita
        </button>
      </div>
    </div>
  );
};
