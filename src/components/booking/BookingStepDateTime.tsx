import React from 'react';
import { Specialist } from '../../types';
import { SPECIALISTS } from '../../data/mockData';
import {
  CalendarDayOption,
  SlotAvailability
} from '../../utils/calendarAvailability';

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
  onBack: () => void;
  onNext: () => void;
  serviceDuration?: number;
  specialists?: Specialist[];
  redirectionSlot?: string | null;
  setRedirectionSlot?: (slot: string | null) => void;
  redirectionAvailableSpecialists?: Specialist[];
  handleRedirectToSpecialist?: (specId: string, timeSlot: string) => void;
}

export const BookingStepDateTime: React.FC<BookingStepDateTimeProps> = ({
  calendarDays,
  selectedDateOption,
  setSelectedDateOption,
  selectedSpecialistId,
  setSelectedSpecialistId,
  availableTimeSlots,
  selectedTime,
  setSelectedTime,
  onBack,
  onNext,
  serviceDuration,
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
                type="button"
                onClick={() => {
                  setSelectedDateOption(item);
                  setSelectedTime(''); // Limpiar hora elegida al cambiar de día
                }}
                className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs scale-102'
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

      {/* 2. Specialist Selector */}
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
            type="button"
            onClick={() => {
              setSelectedSpecialistId('any');
              setSelectedTime(''); // Limpiar hora elegida al cambiar de especialista
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

            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => {
                  setSelectedSpecialistId(spec.id);
                  setSelectedTime(''); // Limpiar hora elegida al cambiar de especialista
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#F4EFE9] border-[#BB9C87] ring-2 ring-[#2B2420]/20 shadow-xs'
                    : 'bg-white border-[#C6BDAC] hover:bg-[#F4EFE9]/50'
                }`}
              >
                <img loading="lazy" decoding="async"
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
                  <span className="text-[11px] text-[#5A4A43] block truncate">
                    {spec.role}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Real-Time Time Slots */}
      <div className="bg-white rounded-3xl p-5 border border-[#C6BDAC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#C6BDAC]/60 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2B2420] text-[20px]">schedule</span>
              <span>Horarios Disponibles</span>
            </h3>
            <p className="text-[11px] text-[#5A4A43]">
              Horarios en verde tienen turno libre. Horarios en gris/ámbar están reservados o fuera de atención.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#5A4A43]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Libre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Reservado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
              Pasado
            </span>
          </div>
        </div>

        {/* Aviso de servicio largo (ocupa 2 horarios seguidos) */}
        {(serviceDuration || 60) > 60 && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0">info</span>
            <span>Este servicio dura {serviceDuration} minutos y ocupa 2 horarios seguidos.</span>
          </div>
        )}

        <div className="text-[11px] text-[#5A4A43] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">schedule</span>
          <span>Horario de atención: 10:00 AM a 07:00 PM (última cita empieza a las 06:00 PM).</span>
        </div>

        {/* Banner cuando no hay turnos libres en el día seleccionado */}
        {availableTimeSlots.filter((s) => s.status === 'available').length === 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0">event_busy</span>
              <span>
                {selectedDateOption.isToday
                  ? 'Los turnos para hoy han finalizado o están completos. Te invitamos a seleccionar Mañana o los siguientes días para tu cita:'
                  : 'No hay horarios disponibles para esta fecha. Por favor selecciona otro día en el calendario arriba.'}
              </span>
            </div>
            {calendarDays.length > 1 && selectedDateOption.isToday && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDateOption(calendarDays[1]);
                  setSelectedTime('');
                }}
                className="px-4 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
              >
                <span>Ver horarios de Mañana ({calendarDays[1].full})</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {availableTimeSlots.map((slot) => {
            const isSelected = selectedTime === slot.slot;
            const isAvailable = slot.status === 'available';
            const isPassed = slot.status === 'passed';

            if (isAvailable) {
              return (
                <button
                  key={slot.slot}
                  type="button"
                  onClick={() => {
                    setSelectedTime(slot.slot);
                  }}
                  className={`py-3 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#BB9C87] text-[#2B2420] font-bold border-[#BB9C87] shadow-xs'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80 hover:border-emerald-300'
                  }`}
                >
                  <span className="text-xs font-bold block">{slot.slot}</span>
                  <span
                    className={`text-[10px] mt-0.5 block ${
                      isSelected ? 'text-[#2B2420]/80 font-bold' : 'text-emerald-700'
                    }`}
                  >
                    Turno Libre
                  </span>
                </button>
              );
            }

            if (isPassed) {
              return (
                <div
                  key={slot.slot}
                  className="py-3 px-3 rounded-2xl border border-gray-200 bg-gray-100/80 text-gray-400 text-center cursor-not-allowed select-none"
                  title="Este horario ya pasó el día de hoy"
                >
                  <span className="text-xs font-medium line-through text-gray-400 block">
                    {slot.slot}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                    Hora Pasada
                  </span>
                </div>
              );
            }

            // Ocupado / Reservado / Día no laboral
            return (
              <div
                key={slot.slot}
                className="py-3 px-3 rounded-2xl border border-[#C6BDAC] bg-[#F4EFE9] text-[#5A4A43] text-center opacity-85 select-none"
                title="Horario reservado"
              >
                <span className="text-xs font-medium line-through text-[#5A4A43] block">
                  {slot.slot}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block mt-0.5 truncate">
                  Reservado
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation step buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white border border-[#C6BDAC] text-[#5A4A43] text-xs font-semibold hover:bg-[#C6BDAC]/40 cursor-pointer transition-colors"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedTime}
          className={`px-6 py-3 rounded-full text-xs font-bold shadow-xs transition-all flex items-center gap-2 ${
            selectedTime
              ? 'bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] active:scale-95 cursor-pointer'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Continuar a Estilo</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

