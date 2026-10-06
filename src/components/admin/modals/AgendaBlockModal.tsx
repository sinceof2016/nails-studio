import React, { useMemo, useState } from 'react';
import { Appointment, Specialist, AgendaBlock } from '../../../types';
import { getColombiaDateISO } from '../../../utils/dateAndId';

interface AgendaBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialists: Specialist[];
  appointments: Appointment[];
  existingBlocks: AgendaBlock[];
  onSubmit: (specialistIds: string[], dates: string[]) => Promise<void>;
}

const DAYS_AHEAD = 45;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** Suma días a una fecha AAAA-MM-DD sin depender de la zona horaria del navegador. */
function addDays(dateId: string, days: number): string {
  const [y, m, d] = dateId.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`;
}

function labelOf(dateId: string): { weekday: string; day: number; month: string } {
  const [y, m, d] = dateId.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  return { weekday: WEEKDAYS[utc.getUTCDay()], day: d, month: MONTHS[m - 1] };
}

export const AgendaBlockModal: React.FC<AgendaBlockModalProps> = ({
  isOpen,
  onClose,
  specialists,
  appointments,
  existingBlocks,
  onSubmit
}) => {
  const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = getColombiaDateISO();
  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)), [today]);
  const blockedKeys = useMemo(() => new Set(existingBlocks.map((b) => `${b.date}_${b.specialistId}`)), [existingBlocks]);

  // Citas activas que ya existen en los días y con las especialistas elegidas
  const affectedAppointments = useMemo(
    () =>
      appointments.filter(
        (a) => a.status !== 'cancelada' && selectedSpecialists.includes(a.specialistId) && selectedDates.includes(a.date)
      ),
    [appointments, selectedSpecialists, selectedDates]
  );

  const newBlocksCount = useMemo(
    () =>
      selectedSpecialists.reduce(
        (total, specialistId) => total + selectedDates.filter((date) => !blockedKeys.has(`${date}_${specialistId}`)).length,
        0
      ),
    [selectedSpecialists, selectedDates, blockedKeys]
  );

  if (!isOpen) return null;

  const toggle = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setError(null);
  };

  const addRange = () => {
    if (!rangeFrom || !rangeTo) {
      setError('Elige la fecha de inicio y la de fin del rango.');
      return;
    }
    if (rangeFrom > rangeTo) {
      setError('La fecha de inicio no puede ser posterior a la de fin.');
      return;
    }
    const inRange = days.filter((d) => d >= rangeFrom && d <= rangeTo);
    if (inRange.length === 0) {
      setError(`Solo se pueden bloquear los próximos ${DAYS_AHEAD} días.`);
      return;
    }
    setSelectedDates((prev) => Array.from(new Set([...prev, ...inRange])).sort());
    setError(null);
  };

  const reset = () => {
    setSelectedSpecialists([]);
    setSelectedDates([]);
    setRangeFrom('');
    setRangeTo('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSpecialists.length === 0) {
      setError('Elige al menos una especialista.');
      return;
    }
    if (selectedDates.length === 0) {
      setError('Elige al menos un día.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(selectedSpecialists, selectedDates);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo bloquear la agenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#BB9C87]/10 text-[#2B2420] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">event_busy</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2B2420]">Bloquear agenda</h3>
              <p className="text-[11px] text-[#5A4A43]">El día completo no aparecerá disponible en las reservas.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-[#5A4A43] hover:text-[#2B2420] cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Especialistas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#5A4A43] uppercase tracking-wider">1. ¿A quién?</span>
              <button
                type="button"
                onClick={() => setSelectedSpecialists(selectedSpecialists.length === specialists.length ? [] : specialists.map((s) => s.id))}
                className="text-[11px] font-bold text-[#2B2420] hover:underline cursor-pointer"
              >
                {selectedSpecialists.length === specialists.length ? 'Quitar todas' : 'Todas'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {specialists.map((spec) => {
                const active = selectedSpecialists.includes(spec.id);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => toggle(selectedSpecialists, spec.id, setSelectedSpecialists)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                      active
                        ? 'bg-[#BB9C87] border-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                        : 'bg-white border-[#C6BDAC] text-[#5A4A43] hover:bg-[#C6BDAC]/40'
                    }`}
                  >
                    {spec.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Días */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#5A4A43] uppercase tracking-wider">2. ¿Qué días?</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setSelectedDates([today]); setError(null); }} className="text-[11px] font-bold text-[#2B2420] hover:underline cursor-pointer">
                  Solo hoy
                </button>
                <button type="button" onClick={() => { setSelectedDates([addDays(today, 1)]); setError(null); }} className="text-[11px] font-bold text-[#2B2420] hover:underline cursor-pointer">
                  Solo mañana
                </button>
                {selectedDates.length > 0 && (
                  <button type="button" onClick={() => setSelectedDates([])} className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer">
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
              {days.map((date) => {
                const active = selectedDates.includes(date);
                const { weekday, day, month } = labelOf(date);
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => toggle(selectedDates, date, setSelectedDates)}
                    aria-pressed={active}
                    aria-label={`${weekday} ${day} de ${month}`}
                    className={`py-1.5 rounded-xl text-center border cursor-pointer transition-all ${
                      active
                        ? 'bg-[#BB9C87] border-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                        : 'bg-white border-[#C6BDAC] text-[#5A4A43] hover:bg-[#C6BDAC]/40'
                    }`}
                  >
                    <span className="block text-[9px] uppercase opacity-80">{weekday}</span>
                    <span className="block text-sm font-bold leading-tight">{day}</span>
                    <span className="block text-[9px] opacity-80">{month}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-end gap-2 pt-1">
              <label className="text-[11px] text-[#5A4A43] font-semibold">
                Desde
                <input
                  type="date"
                  value={rangeFrom}
                  min={today}
                  max={days[days.length - 1]}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="block h-8 mt-0.5 px-2 rounded-lg bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
                />
              </label>
              <label className="text-[11px] text-[#5A4A43] font-semibold">
                Hasta
                <input
                  type="date"
                  value={rangeTo}
                  min={today}
                  max={days[days.length - 1]}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="block h-8 mt-0.5 px-2 rounded-lg bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
                />
              </label>
              <button
                type="button"
                onClick={addRange}
                className="h-8 px-3 rounded-lg bg-white border border-[#C6BDAC] text-xs font-bold text-[#2B2420] hover:bg-[#C6BDAC]/40 cursor-pointer"
              >
                Agregar rango
              </button>
            </div>
          </div>

          {/* Resumen y avisos */}
          {selectedSpecialists.length > 0 && selectedDates.length > 0 && (
            <div className="p-3 rounded-2xl bg-white border border-[#C6BDAC]/70 text-xs text-[#5A4A43] space-y-1">
              <p>
                Se bloquearán <strong className="text-[#2B2420]">{newBlocksCount}</strong>{' '}
                {newBlocksCount === 1 ? 'día de agenda' : 'días de agenda'}
                {newBlocksCount < selectedSpecialists.length * selectedDates.length && ' (los que ya estaban bloqueados no se repiten)'}.
              </p>
              {affectedAppointments.length > 0 && (
                <p className="text-amber-800 font-semibold">
                  ⚠ Ya hay {affectedAppointments.length} {affectedAppointments.length === 1 ? 'cita' : 'citas'} en esos días con esas
                  especialistas. Seguirán en la agenda: avísales a las clientas o reprograma las citas.
                </p>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C6BDAC]/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#C6BDAC] text-xs font-semibold text-[#5A4A43] hover:bg-[#C6BDAC]/30 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#2B2420] hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Bloqueando…' : 'Bloquear agenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
