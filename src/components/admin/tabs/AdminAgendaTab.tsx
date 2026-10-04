import React, { useState } from 'react';
import { Appointment, Specialist } from '../../../types';
import { SPECIALISTS as DEFAULT_SPECIALISTS } from '../../../data/mockData';
import { formatCOP } from '../../../utils/format';
import { formatDisplayDate } from '../../../utils/dateAndId';

interface AdminAgendaTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenExpressModal: () => void;
  onNavigateToBooking: () => void;
  specialistFilter: string;
  setSpecialistFilter: (specId: string) => void;
  appointments: Appointment[];
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  totalCount: number;
  confirmedCount: number;
  inPrepCount: number;
  completedCount: number;
  canceledCount: number;
  filteredAppointments: Appointment[];
  expandedAptId: string | null;
  setExpandedAptId: (id: string | null) => void;
  onQuickReminder: (apt: Appointment) => void;
  onTableReady: (apt: Appointment) => void;
  onStatusChangeWithNotification: (apt: Appointment, newStatus: Appointment['status']) => void;
  onSelectAppointmentForQr: (apt: Appointment) => void;
  onOpenCutForAppointment?: (apt: Appointment) => void;
  onDeleteAppointment?: (apt: Appointment) => void;
  userRole?: string;
  specialists?: Specialist[];
}

export const AdminAgendaTab: React.FC<AdminAgendaTabProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenExpressModal,
  onNavigateToBooking,
  specialistFilter,
  setSpecialistFilter,
  appointments,
  filterStatus,
  setFilterStatus,
  totalCount,
  confirmedCount,
  inPrepCount,
  completedCount,
  canceledCount,
  filteredAppointments,
  expandedAptId,
  setExpandedAptId,
  onQuickReminder,
  onTableReady,
  onStatusChangeWithNotification,
  onSelectAppointmentForQr,
  onOpenCutForAppointment,
  onDeleteAppointment,
  userRole,
  specialists = DEFAULT_SPECIALISTS
}) => {
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const canDeleteAppointments = userRole === 'SuperAdmin' || userRole === 'Administrador';

  const confirmDelete = () => {
    if (appointmentToDelete && onDeleteAppointment) {
      onDeleteAppointment(appointmentToDelete);
      setAppointmentToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Diálogo de confirmación para eliminar cita */}
      {appointmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-3.5">
            <div className="flex items-center gap-2 text-rose-800">
              <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              <h3 className="font-bold text-sm text-[#2B2420]">Eliminar Cita #{appointmentToDelete.bookingCode}</h3>
            </div>
            <p className="text-xs text-[#5A4A43] leading-relaxed">
              ¿Estás seguro de eliminar permanentemente la cita de <strong className="text-[#2B2420]">{appointmentToDelete.clientName}</strong>? Esta acción borrará el registro de Firestore y liberará el horario de las {appointmentToDelete.time} con {appointmentToDelete.specialistName}.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C6BDAC]/50">
              <button
                type="button"
                onClick={() => setAppointmentToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#C6BDAC] text-xs font-semibold text-[#5A4A43] hover:bg-[#C6BDAC]/30 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Actions: Search + Fast Walk-in + Regular Booking */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[#5A4A43] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por clienta, código AURA o manicurista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-9 rounded-full bg-white border border-[#C6BDAC] text-xs text-[#2B2420] placeholder-[#5A4A43] focus:outline-none focus:ring-1 focus:ring-[#2B2420]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-[#5A4A43] hover:text-[#2B2420] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* BUTTON 1: WALK-IN / TURNO EXPRESS */}
          <button
            onClick={onOpenExpressModal}
            className="h-10 px-4 rounded-full bg-gradient-to-r from-[#BB9C87] to-[#AA8A74] hover:opacity-95 text-[#2B2420] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all"
            title="Crear cita express para clientas que llegan sin reserva en 10 segundos"
          >
            <span className="material-symbols-outlined text-[18px]">flash_on</span>
            <span>+ Turno Express (Walk-in)</span>
          </button>

          <button
            onClick={onNavigateToBooking}
            className="h-10 px-4 rounded-full bg-white hover:bg-[#C6BDAC]/40 border border-[#C6BDAC] text-[#2B2420] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-[#2B2420]">add</span>
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Quick Specialist Filter Chips */}
      <div className="p-3 rounded-2xl bg-white border border-[#C6BDAC]/70 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#5A4A43] uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#2B2420]">face</span>
            <span>Ver Agenda por Especialista:</span>
          </span>
          {specialistFilter !== 'todos' && (
            <button
              onClick={() => setSpecialistFilter('todos')}
              className="text-[11px] font-bold text-[#2B2420] hover:underline cursor-pointer"
            >
              Ver Todas
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setSpecialistFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              specialistFilter === 'todos'
                ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                : 'bg-[#F4EFE9] text-[#5A4A43] border border-[#C6BDAC]/60 hover:bg-[#C6BDAC]/40'
            }`}
          >
            <span>Todas</span>
            <span className="text-[10px] opacity-80">({appointments.length})</span>
          </button>

          {specialists.map((spec) => {
            const count = appointments.filter((a) => a.specialistId === spec.id).length;
            const isSelected = specialistFilter === spec.id;

            return (
              <button
                key={spec.id}
                onClick={() => setSpecialistFilter(isSelected ? 'todos' : spec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                    : 'bg-[#F4EFE9] text-[#2B2420] border border-[#C6BDAC]/60 hover:bg-[#C6BDAC]/40'
                }`}
              >
                <img
                  src={spec.avatar}
                  alt={spec.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span>{spec.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setFilterStatus('todos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2420] ${
            filterStatus === 'todos'
              ? 'bg-[#2B2420] text-white shadow-xs font-bold'
              : 'bg-white text-[#5A4A43] border border-[#C6BDAC]/70 hover:bg-[#C6BDAC]/40'
          }`}
        >
          Todas ({totalCount})
        </button>

        <button
          onClick={() => setFilterStatus('confirmada')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2420] ${
            filterStatus === 'confirmada'
              ? 'bg-[#dce8dc] text-[#2d6a4f] shadow-xs font-bold border border-[#2d6a4f]/40'
              : 'bg-white text-[#2d6a4f] border border-[#dce8dc] hover:bg-[#dce8dc]/40'
          }`}
        >
          Confirmadas ({confirmedCount})
        </button>

        <button
          onClick={() => setFilterStatus('en_preparacion')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2420] ${
            filterStatus === 'en_preparacion'
              ? 'bg-[#BB9C87] text-[#2B2420] shadow-xs font-bold'
              : 'bg-white text-[#2B2420] border border-[#C6BDAC] hover:bg-[#BB9C87]/20'
          }`}
        >
          En Cabina ({inPrepCount})
        </button>

        <button
          onClick={() => setFilterStatus('completada')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2420] ${
            filterStatus === 'completada'
              ? 'bg-[#C6BDAC] text-[#2B2420] shadow-xs font-bold'
              : 'bg-white text-[#5A4A43] border border-[#C6BDAC]/70 hover:bg-[#C6BDAC]/40'
          }`}
        >
          Completadas ({completedCount})
        </button>

        <button
          onClick={() => setFilterStatus('cancelada')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2420] ${
            filterStatus === 'cancelada'
              ? 'bg-rose-100 text-rose-800 shadow-xs font-bold border border-rose-300'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          Canceladas ({canceledCount})
        </button>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#C6BDAC]/60 space-y-2">
          <span className="material-symbols-outlined text-[36px] text-[#5A4A43]">event_busy</span>
          <h4 className="text-sm font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
            No hay citas registradas con este criterio
          </h4>
          <p className="text-xs text-[#5A4A43]">
            Intenta cambiar el filtro de estado o la búsqueda de clienta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredAppointments.map((apt) => {
            const isExpanded = expandedAptId === apt.id;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-[#C6BDAC]/60 shadow-xs space-y-3.5 hover:border-[#BB9C87] transition-all"
              >
                {/* Header: Date, Time & Status badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#F4EFE9] text-[#2B2420] px-2.5 py-1 rounded-xl border border-[#C6BDAC]/60">
                      {apt.time}
                    </span>
                    <span className="text-xs font-semibold text-[#5A4A43]">
                      {formatDisplayDate(apt.date)}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      apt.status === 'confirmada'
                        ? 'bg-[#dce8dc] text-[#2d6a4f]'
                        : apt.status === 'en_preparacion'
                        ? 'bg-[#BB9C87]/20 text-[#2B2420] border border-[#BB9C87]/40'
                        : apt.status === 'completada'
                        ? 'bg-[#F4EFE9] text-[#5A4A43]'
                        : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}
                  >
                    {apt.status === 'confirmada' && 'Confirmada'}
                    {apt.status === 'en_preparacion' && 'En Cabina'}
                    {apt.status === 'completada' && 'Completada'}
                    {apt.status === 'cancelada' && 'Cancelada'}
                  </span>
                </div>

                {/* Client info & Service in COP */}
                <div className="flex gap-3 items-center">
                  <img
                    src={apt.serviceImage}
                    alt={apt.serviceName}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-sm font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                        {apt.clientName}
                      </h4>
                      <span className="text-sm font-bold text-[#2B2420] font-mono shrink-0 ml-2">
                        {formatCOP(apt.totalPrice)}
                      </span>
                    </div>

                    <p className="text-xs text-[#5A4A43] truncate mt-0.5 font-medium">
                      {apt.serviceName} ({apt.serviceDuration} min)
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-[#2B2420] mt-1">
                      <img
                        src={apt.specialistAvatar}
                        alt={apt.specialistName}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="truncate">
                        Asignada: <strong>{apt.specialistName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-CLIC FAST WHATSAPP ACTIONS */}
                <div className="p-2.5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]/50 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[#2B2420] font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-[#52b788]">call</span>
                    <span>{apt.clientPhone}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickReminder(apt)}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      title="Enviar recordatorio automático por WhatsApp"
                    >
                      <span className="material-symbols-outlined text-[13px]">notifications_active</span>
                      <span>Recordar</span>
                    </button>

                    <button
                      onClick={() => onTableReady(apt)}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#C6BDAC]/40 text-[#2B2420] text-[10px] font-bold border border-[#C6BDAC] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      title="Avisar a la clienta que su mesa en cabina está lista"
                    >
                      <span className="material-symbols-outlined text-[13px]">chair</span>
                      <span>Mesa Lista</span>
                    </button>

                    <a
                      href={`https://wa.me/${(apt.clientPhone || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-full text-[#52b788] hover:bg-emerald-50 transition-colors"
                      title="Abrir chat directo en WhatsApp"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-2 border-t border-[#C6BDAC] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#5A4A43]">
                      <span>Estado:</span>
                      <select
                        value={apt.status}
                        onChange={(e) => onStatusChangeWithNotification(apt, e.target.value as any)}
                        className="h-7 px-2 rounded-full bg-[#C6BDAC]/40 border border-[#C6BDAC] text-[11px] font-bold text-[#2B2420] focus:outline-none cursor-pointer"
                      >
                        <option value="confirmada">Confirmada</option>
                        <option value="en_preparacion">En Cabina</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>

                    <button
                      onClick={() => onSelectAppointmentForQr(apt)}
                      className="h-7 px-2.5 rounded-full bg-white border border-[#C6BDAC] hover:bg-[#C6BDAC]/40 text-[#2B2420] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">qr_code</span>
                      <span>Pase QR</span>
                    </button>

                    {onOpenCutForAppointment && apt.status !== 'cancelada' && (
                      <button
                        onClick={() => onOpenCutForAppointment(apt)}
                        className="h-7 px-2.5 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                        title="Registrar cobro de esta cita en caja"
                      >
                        <span className="material-symbols-outlined text-[14px]">point_of_sale</span>
                        <span>Cobrar</span>
                      </button>
                    )}

                    {canDeleteAppointments && (
                      <button
                        onClick={() => setAppointmentToDelete(apt)}
                        className="h-7 px-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Eliminar cita permanentemente de Firestore"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedAptId(isExpanded ? null : apt.id)}
                    className="text-xs font-semibold text-[#2B2420] hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                  >
                    <span>{isExpanded ? 'Menos' : 'Detalles'}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-3 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]/50 space-y-2 text-xs text-[#5A4A43] animate-in fade-in duration-150">
                    {apt.notes && (
                      <div>
                        <strong className="text-[#2B2420] block">Observaciones:</strong>
                        <p className="italic text-[#2B2420] mt-0.5">{apt.notes}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#C6BDAC]/40">
                      <div>
                        <span className="text-[10px] text-[#5A4A43]">Tono Solicitado:</span>
                        <div className="font-semibold text-[#2B2420]">{apt.polishColor || 'Por definir'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#5A4A43]">Forma de Uña:</span>
                        <div className="font-semibold text-[#2B2420]">{apt.nailShape || 'Por definir'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
