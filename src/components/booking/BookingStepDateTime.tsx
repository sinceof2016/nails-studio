import React from 'react';
import { Specialist } from '../../types';
import { SPECIALISTS } from '../../data/mockData';
import { CalendarDayOption, SlotAvailability } from '../../utils/calendarAvailability';

interface BookingStepDateTimeProps {
  calendarDays: CalendarDayOption[];
  selectedDateOption: CalendarDayOption;
  setSelectedDateOption: (day: CalendarDayOption) => void;
  selectedSpecialistId: string;
  setSelectedSpecialistId: (id: string) => void;
  currentSpecialist: Specialist | null;
  daySpecialistStats: Record<string, { total: number; booked: number; free: number }>;
  availableTimeSlots: SlotAvailability[];
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  redirectionSlot: string | null;
  setRedirectionSlot: (slot: string | null) => void;
  redirectionAvailableSpecialists: Specialist[];
  handleRedirectToSpecialist: (specId: string, timeSlot: string) => void;
  onBack: () => void;
  onNext: () => void;
  specialists?: Specialist[];
}

export const BookingStepDateTime: React.FC<BookingStepDateTimeProps> = ({
  calendarDays,
  selectedDateOption,
  setSelectedDateOption,
  selectedSpecialistId,
  setSelectedSpecialistId,
  currentSpecialist,
  daySpecialistStats,
  availableTimeSlots,
  selectedTime,
  setSelectedTime,
  redirectionSlot,
  setRedirectionSlot,
  redirectionAvailableSpecialists,
  handleRedirectToSpecialist,
  onBack,
  onNext,
  specialists = SPECIALISTS
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Day Selector (Next 7 Days) */}
      <div className="bg-white rounded-3xl p-5 border border-[#C6BDAC] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B2420] text-[20px]">calendar_today</span>
            <span>Selecciona el día de tu cita</span>
          </h3>
          <span className="text-xs font-semibold text-[#2B2420]">
            {selectedDateOption.full}
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {calendarDays.map((item) => {
            const isSelected = selectedDateOption.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedDateOption(item);
                  setRedirectionSlot(null);
                }}
                className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs scale-102 font-bold'
                    : 'bg-[#F4EFE9] text-[#5A4A43] border border-[#C6BDAC] hover:border-[#BB9C87]/50 hover:bg-[#C6BDAC]/40'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase opacity-80">
                  {item.dayOfWeek}
                </span>
                <span className="text-lg font-bold my-0.5">
                  {item.dateNum}
                </span>
                <span className="text-[10px] font-medium opacity-90 truncate max-w-[64px]">
                  {item.dayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Specialist Selector with Live Availability Badges */}
      <div className="bg-white rounded-3xl p-5 border border-[#C6BDAC] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B2420] text-[20px]">face</span>
            <span>Elige tu Especialista o Asignación Libre</span>
          </h3>
          <span className="text-xs text-[#5A4A43]">
            {selectedDateOption.isToday ? 'Disponibilidad de Hoy' : `Para el ${selectedDateOption.dayName}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* ANY / AUTO ASSIGN */}
          <button
            onClick={() => {
              setSelectedSpecialistId('any');
              setRedirectionSlot(null);
            }}
            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              selectedSpecialistId === 'any'
                ? 'bg-[#F4EFE9] border-[#BB9C87] ring-2 ring-[#2B2420]/20 shadow-xs'
                : 'bg-white border-[#C6BDAC] hover:bg-[#F4EFE9]/50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#BB9C87]/10 text-[#2B2420] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div className="min-w-0">
              <strong className="block text-xs text-[#2B2420] font-bold truncate">
                Cualquiera Libre
              </strong>
              <span className="text-[11px] text-[#5A4A43] block truncate">
                Mayor disponibilidad
              </span>
            </div>
          </button>

          {/* ALL SPECIALISTS */}
          {specialists.map((spec) => {
            const isSelected = selectedSpecialistId === spec.id;
            const stats = daySpecialistStats[spec.id] || { free: 8 };

            return (
              <button
                key={spec.id}
                onClick={() => {
                  setSelectedSpecialistId(spec.id);
                  setRedirectionSlot(null);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#F4EFE9] border-[#BB9C87] ring-2 ring-[#2B2420]/20 shadow-xs'
                    : 'bg-white border-[#C6BDAC] hover:bg-[#F4EFE9]/50'
                }`}
              >
                <img
                  src={spec.avatar}
                  alt={spec.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#C6BDAC]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="block text-xs text-[#2B2420] font-bold truncate">
                      {spec.name}
                    </strong>
                    <span className="text-[10px] text-amber-500 font-bold flex items-center shrink-0">
                      ★ {spec.rating}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5A4A43] block truncate">
                    {stats.free > 0 ? (
                      <span className="text-emerald-700 font-medium">
                        {stats.free} turnos libres
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold">
                        Agenda llena hoy
                      </span>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Real-Time Time Slots (Available vs Busy with Redirection Assistant) */}
      <div className="bg-white rounded-3xl p-5 border border-[#C6BDAC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#C6BDAC]/60 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2B2420] text-[20px]">schedule</span>
              <span>Horarios Disponibles</span>
            </h3>
            <p className="text-[11px] text-[#5A4A43]">
              Horarios en verde tienen turno inmediato libre con la manicurista seleccionada.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#5A4A43]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Libre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C6BDAC] inline-block" />
              Ocupado
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {availableTimeSlots.map((slot) => {
            const isSelected = selectedTime === slot.slot;
            const isAvailable = slot.status === 'available';

            if (isAvailable) {
              return (
                <button
                  key={slot.slot}
                  onClick={() => {
                    setSelectedTime(slot.slot);
                    setRedirectionSlot(null);
                  }}
                  className={`py-3 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#BB9C87] text-[#2B2420] font-bold border-[#BB9C87] shadow-xs font-bold'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80 hover:border-emerald-300'
                  }`}
                >
                  <span className="text-xs font-bold block">{slot.slot}</span>
                  <span
                    className={`text-[10px] mt-0.5 block ${
                      isSelected ? 'text-[#2B2420]/80' : 'text-emerald-700'
                    }`}
                  >
                    Turno Libre
                  </span>
                </button>
              );
            }

            return (
              <button
                key={slot.slot}
                onClick={() => setRedirectionSlot(slot.slot)}
                className="py-3 px-3 rounded-2xl border border-[#C6BDAC] bg-[#F4EFE9] text-[#5A4A43] text-center opacity-85 hover:opacity-100 hover:border-amber-300 transition-all cursor-pointer group"
                title="Haz clic para ver qué otra especialista tiene este turno libre"
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-medium line-through text-[#5A4A43]">
                    {slot.slot}
                  </span>
                  <span className="material-symbols-outlined text-[13px] text-amber-600 group-hover:scale-120 transition-transform">
                    swap_horiz
                  </span>
                </div>
                <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                  Ver alternativa
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. SMART REDIRECTION ASSISTANT CARD */}
        {redirectionSlot && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-900 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-[20px]">swap_horiz</span>
                <div>
                  <strong className="block text-amber-950 font-['Plus_Jakarta_Sans',sans-serif]">
                    {currentSpecialist
                      ? `${currentSpecialist.name} está ocupada a las ${redirectionSlot}`
                      : `Horario ${redirectionSlot} parcialmente ocupado`}
                  </strong>
                  <span className="text-[11px] text-amber-800">
                    {redirectionAvailableSpecialists.length > 0
                      ? '¡Buenas noticias! Tenemos disponibilidad con las siguientes especialistas en esa misma hora:'
                      : 'No hay otras especialistas libres a esta hora exacta. Por favor selecciona otro horario verde.'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRedirectionSlot(null)}
                className="text-amber-800 hover:text-amber-950 p-1"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {redirectionAvailableSpecialists.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {redirectionAvailableSpecialists.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => handleRedirectToSpecialist(spec.id, redirectionSlot)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <img src={spec.avatar} alt={spec.name} className="w-5 h-5 rounded-full object-cover" />
                    <span>Reservar {redirectionSlot} con {spec.name}</span>
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">arrow_forward</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white border border-[#C6BDAC] text-[#5A4A43] text-xs font-semibold hover:bg-[#C6BDAC]/40 cursor-pointer"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!selectedTime}
          className="px-6 py-3 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{selectedTime ? 'Continuar a Personalización' : 'Selecciona un Horario'}</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
