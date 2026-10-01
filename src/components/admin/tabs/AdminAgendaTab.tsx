import React from 'react';
import { Appointment } from '../../../types';
import { SPECIALISTS } from '../../../data/mockData';
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
  onSelectAppointmentForQr
}) => {
  return (
    <div className="space-y-4">
      {/* Top Actions: Search + Fast Walk-in + Regular Booking */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[#7D676B] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por clienta, código AURA o manicurista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-9 rounded-full bg-white border border-[#EAD6D9] text-xs text-[#1F1417] placeholder-[#7D676B] focus:outline-none focus:ring-1 focus:ring-[#64444B]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-[#7D676B] hover:text-[#1F1417] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* BUTTON 1: WALK-IN / TURNO EXPRESS */}
          <button
            onClick={onOpenExpressModal}
            className="h-10 px-4 rounded-full bg-gradient-to-r from-[#C5838D] to-[#64444B] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all"
            title="Crear cita express para clientas que llegan sin reserva en 10 segundos"
          >
            <span className="material-symbols-outlined text-[18px]">flash_on</span>
            <span>+ Turno Express (Walk-in)</span>
          </button>

          <button
            onClick={onNavigateToBooking}
            className="h-10 px-4 rounded-full bg-white hover:bg-[#F6E3E6] border border-[#EAD6D9] text-[#1F1417] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-[#64444B]">add</span>
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Quick Specialist Filter Chips */}
      <div className="p-3 rounded-2xl bg-white border border-[#EAD6D9]/70 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#644E53] uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#64444B]">face</span>
            <span>Ver Agenda por Especialista:</span>
          </span>
          {specialistFilter !== 'todos' && (
            <button
              onClick={() => setSpecialistFilter('todos')}
              className="text-[11px] font-bold text-[#64444B] hover:underline cursor-pointer"
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
                ? 'bg-[#64444B] text-white shadow-xs'
                : 'bg-[#FAF4F5] text-[#644E53] border border-[#EAD6D9]/60 hover:bg-[#F6E3E6]'
            }`}
          >
            <span>Todas</span>
            <span className="text-[10px] opacity-80">({appointments.length})</span>
          </button>

          {SPECIALISTS.map((spec) => {
            const count = appointments.filter((a) => a.specialistId === spec.id).length;
            const isSelected = specialistFilter === spec.id;

            return (
              <button
                key={spec.id}
                onClick={() => setSpecialistFilter(isSelected ? 'todos' : spec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#64444B] text-white shadow-xs'
                    : 'bg-[#FAF4F5] text-[#1F1417] border border-[#EAD6D9]/60 hover:bg-[#F6E3E6]'
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
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'todos'
              ? 'bg-[#64444B] text-white shadow-xs'
              : 'bg-white text-[#644E53] border border-[#EAD6D9]/80 hover:bg-[#F6E3E6]'
          }`}
        >
          Todas ({totalCount})
        </button>
        <button
          onClick={() => setFilterStatus('confirmada')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'confirmada'
              ? 'bg-[#2d6a4f] text-white shadow-xs'
              : 'bg-white text-[#2d6a4f] border border-[#dce8dc] hover:bg-[#dce8dc]/40'
          }`}
        >
          Confirmadas ({confirmedCount})
        </button>
        <button
          onClick={() => setFilterStatus('en_preparacion')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'en_preparacion'
              ? 'bg-[#71547c] text-white shadow-xs'
              : 'bg-white text-[#71547c] border border-[#f8d8ff] hover:bg-[#f8d8ff]/40'
          }`}
        >
          En Cabina ({inPrepCount})
        </button>
        <button
          onClick={() => setFilterStatus('completada')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'completada'
              ? 'bg-[#504444] text-white shadow-xs'
              : 'bg-white text-[#504444] border border-[#ebe8e2] hover:bg-[#ebe8e2]/50'
          }`}
        >
          Completadas ({completedCount})
        </button>
        <button
          onClick={() => setFilterStatus('cancelada')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'cancelada'
              ? 'bg-[#ba1a1a] text-white shadow-xs'
              : 'bg-white text-[#ba1a1a] border border-[#ffdad6] hover:bg-[#ffdad6]/40'
          }`}
        >
          Canceladas ({canceledCount})
        </button>
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full text-center py-12 px-6 bg-white rounded-3xl border border-[#EAD6D9]/60">
            <span className="material-symbols-outlined text-[#EAD6D9] text-[44px] mb-2">
              event_busy
            </span>
            <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
              No se encontraron citas con estos filtros
            </h4>
            <p className="text-xs text-[#644E53] mt-1">
              Prueba cambiando el estado o la búsqueda para ver más registros de la agenda.
            </p>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const isExpanded = expandedAptId === apt.id;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-3xl p-5 shadow-xs border border-[#EAD6D9]/60 space-y-3 transition-all hover:border-[#64444B]/40"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#64444B] bg-[#F6E3E6] px-2.5 py-0.5 rounded-md">
                      {apt.bookingCode}
                    </span>
                    <span className="text-xs text-[#644E53] font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#64444B]">schedule</span>
                      {formatDisplayDate(apt.date)} · {apt.time}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      apt.status === 'confirmada'
                        ? 'bg-[#dce8dc] text-[#2d6a4f]'
                        : apt.status === 'en_preparacion'
                        ? 'bg-[#f8d8ff] text-[#71547c]'
                        : apt.status === 'completada'
                        ? 'bg-[#f1ede7] text-[#504444]'
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
                      <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                        {apt.clientName}
                      </h4>
                      <span className="text-sm font-bold text-[#64444B] font-mono shrink-0 ml-2">
                        {formatCOP(apt.totalPrice)}
                      </span>
                    </div>

                    <p className="text-xs text-[#644E53] truncate mt-0.5 font-medium">
                      {apt.serviceName} ({apt.serviceDuration} min)
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-[#64444B] mt-1">
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
                <div className="p-2.5 rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9]/50 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[#1F1417] font-semibold">
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
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F6E3E6] text-[#64444B] text-[10px] font-bold border border-[#EAD6D9] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
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
                <div className="pt-2 border-t border-[#ebe8e2] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#644E53]">
                      <span>Estado:</span>
                      <select
                        value={apt.status}
                        onChange={(e) => onStatusChangeWithNotification(apt, e.target.value as any)}
                        className="h-7 px-2 rounded-full bg-[#F6E3E6] border border-[#EAD6D9] text-[11px] font-bold text-[#1F1417] focus:outline-none cursor-pointer"
                      >
                        <option value="confirmada">Confirmada</option>
                        <option value="en_preparacion">En Cabina</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>

                    <button
                      onClick={() => onSelectAppointmentForQr(apt)}
                      className="h-7 px-2.5 rounded-full bg-white border border-[#EAD6D9] hover:bg-[#F6E3E6] text-[#64444B] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">qr_code</span>
                      <span>Pase QR</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setExpandedAptId(isExpanded ? null : apt.id)}
                    className="text-xs font-semibold text-[#64444B] hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                  >
                    <span>{isExpanded ? 'Menos' : 'Detalles'}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-3 rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9]/50 space-y-2 text-xs text-[#644E53] animate-in fade-in duration-150">
                    {apt.notes && (
                      <div>
                        <strong className="text-[#1F1417] block">Observaciones:</strong>
                        <p className="italic text-[#64444B] mt-0.5">{apt.notes}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EAD6D9]/40">
                      <div>
                        <span className="text-[10px] text-[#7D676B]">Tono Solicitado:</span>
                        <div className="font-semibold text-[#1F1417]">{apt.polishColor || 'Por definir'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#7D676B]">Forma de Uña:</span>
                        <div className="font-semibold text-[#1F1417]">{apt.nailShape || 'Por definir'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
