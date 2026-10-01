import React from 'react';
import { ClientProfile, Appointment, SalonCutRecord } from '../types';
import { formatCOP } from '../utils/format';
import { buildWaMeUrl } from '../services/whatsappService';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { formatDisplayDate } from '../utils/dateAndId';

interface ClientHistoryModalProps {
  client: ClientProfile | null;
  appointments: Appointment[];
  cuts: SalonCutRecord[];
  onClose: () => void;
}

export const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  client,
  appointments = [],
  cuts = [],
  onClose
}) => {
  if (!client) return null;

  // Safe search across all appointments
  const clientPhoneDigits = (client.telefono || '').replace(/\D/g, '').slice(-8);
  const clientNameNormalized = (client.nombre || '').toLowerCase().trim();

  const clientAppointments = appointments.filter((apt) => {
    if (!apt) return false;
    const aptPhoneDigits = (apt.clientPhone || '').replace(/\D/g, '').slice(-8);
    const aptName = (apt.clientName || '').toLowerCase().trim();

    const matchesPhone = Boolean(clientPhoneDigits && aptPhoneDigits && (clientPhoneDigits === aptPhoneDigits || aptPhoneDigits.includes(clientPhoneDigits)));
    const matchesName = Boolean(clientNameNormalized && aptName && (aptName.includes(clientNameNormalized) || clientNameNormalized.includes(aptName)));

    return matchesPhone || matchesName;
  });

  const clientCuts = cuts.filter((cut) => {
    if (!cut) return false;
    const cutPhoneDigits = (cut.clienteTelefono || '').replace(/\D/g, '').slice(-8);
    const cutName = (cut.clienteNombre || '').toLowerCase().trim();

    const matchesPhone = Boolean(clientPhoneDigits && cutPhoneDigits && (clientPhoneDigits === cutPhoneDigits || cutPhoneDigits.includes(clientPhoneDigits)));
    const matchesName = Boolean(clientNameNormalized && cutName && (cutName.includes(clientNameNormalized) || clientNameNormalized.includes(cutName)));

    return matchesPhone || matchesName;
  });

  const waUrl = buildWaMeUrl(
    client.telefono,
    `Hola ${client.nombre}, te saludamos desde ${BUSINESS_CONFIG.brandName}. Queremos darte seguimiento a tus citas y consentirte en tu próxima visita.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#FAF4F5] rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#EAD6D9] z-10 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAD6D9]/50 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#F6E3E6] border border-[#EAD6D9] flex items-center justify-center text-[#64444B] shrink-0">
              <span className="material-symbols-outlined text-[24px]">history_edu</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                  Historial de Citas: {client.nombre}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${client.clasificacion === 'VIP Frecuente' ? 'bg-[#ffdadc] text-[#7c5357]' : 'bg-[#dce8dc] text-[#2d6a4f]'}`}>
                  {client.clasificacion}
                </span>
              </div>
              <p className="text-xs text-[#644E53] mt-0.5 flex items-center gap-2">
                <span>Tel: {client.telefono}</span>
                <span>·</span>
                <span className="font-semibold text-[#64444B]">
                  {clientAppointments.length} turnos registrados
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53] cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-3 rounded-2xl bg-white border border-[#EAD6D9]/60">
            <span className="text-[10px] text-[#644E53] uppercase block">Total Citas</span>
            <strong className="text-base text-[#1F1417] font-bold">{client.totalCitas || clientAppointments.length}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#EAD6D9]/60">
            <span className="text-[10px] text-[#644E53] uppercase block">Gasto Total</span>
            <strong className="text-sm font-bold text-[#64444B] font-mono">{formatCOP(client.gastoTotal)}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#EAD6D9]/60">
            <span className="text-[10px] text-[#644E53] uppercase block">Favorito</span>
            <span className="text-xs font-semibold text-[#1F1417] block truncate">{client.servicioFavorito || 'Manicura Rusa'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#EAD6D9]/60">
            <span className="text-[10px] text-[#644E53] uppercase block">Especialista</span>
            <span className="text-xs font-semibold text-[#64444B] block truncate">{client.especialistaFavorita || 'Valentina R.'}</span>
          </div>
        </div>

        {/* Action Button: WhatsApp Contact */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 text-xs text-emerald-900">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">chat</span>
            <span className="font-semibold">Comunicación directa con la clienta</span>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Abrir WhatsApp</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>

        {/* Detailed Appointments List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#644E53] font-['Plus_Jakarta_Sans',sans-serif]">
            Turnos &amp; Reservas en Agenda ({clientAppointments.length})
          </h4>

          {clientAppointments.length === 0 ? (
            <div className="py-6 text-center bg-white rounded-2xl border border-[#EAD6D9]/60 text-xs text-[#644E53]">
              <span className="material-symbols-outlined text-[28px] text-[#C5838D] mb-1">calendar_today</span>
              <p className="font-semibold text-[#1F1417]">No se encontraron turnos en agenda para esta ficha.</p>
              <p className="text-[11px] text-[#644E53] mt-0.5">Las citas agendadas aparecerán automáticamente aquí.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clientAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#EAD6D9]/60 hover:border-[#64444B]/40 transition-all text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#64444B] bg-[#F6E3E6] px-2 py-0.5 rounded-md text-[11px]">
                        {apt.bookingCode}
                      </span>
                      <strong className="text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                        {apt.serviceName}
                      </strong>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      apt.status === 'confirmada'
                        ? 'bg-[#dce8dc] text-[#2d6a4f]'
                        : apt.status === 'en_preparacion'
                        ? 'bg-[#f8d8ff] text-[#71547c]'
                        : apt.status === 'completada'
                        ? 'bg-[#f1ede7] text-[#504444]'
                        : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}>
                      {apt.status === 'confirmada' && 'Confirmada'}
                      {apt.status === 'en_preparacion' && 'En Cabina'}
                      {apt.status === 'completada' && 'Completada'}
                      {apt.status === 'cancelada' && 'Cancelada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#644E53] pt-1 border-t border-[#ebe8e2]">
                    <div>
                      <span>Fecha &amp; Hora:</span>
                      <strong className="block text-[#1F1417]">{formatDisplayDate(apt.date)} · {apt.time}</strong>
                    </div>
                    <div>
                      <span>Especialista Asignada:</span>
                      <strong className="block text-[#64444B]">{apt.specialistName || 'Por asignar'}</strong>
                    </div>
                    <div>
                      <span>Precio Total:</span>
                      <strong className="block text-[#1F1417] font-mono">{formatCOP(apt.totalPrice)}</strong>
                    </div>
                  </div>

                  {apt.notes && (
                    <div className="text-[11px] text-[#644E53] italic bg-[#FAF4F5] p-2 rounded-xl border border-[#ebe8e2]">
                      Observación: {apt.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cuts & Cash Receipts History */}
        {clientCuts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#EAD6D9]/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#644E53] font-['Plus_Jakarta_Sans',sans-serif]">
              Servicios Facturados en Caja ({clientCuts.length})
            </h4>
            <div className="space-y-1.5">
              {clientCuts.map((cut) => (
                <div key={cut.id} className="p-2.5 rounded-xl bg-white border border-[#EAD6D9]/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#1F1417] block">{cut.servicioNombre}</span>
                    <span className="text-[10px] text-[#644E53]">{formatDisplayDate(cut.fecha)} · {cut.hora} · Manicurista: {cut.especialistaNombre}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#64444B] block">{formatCOP(cut.servicioPrecio)}</span>
                    <span className="text-[10px] text-emerald-700 capitalize">Pago {cut.metodoPago.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
