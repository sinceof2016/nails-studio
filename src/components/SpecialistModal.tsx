import React from 'react';
import { Specialist } from '../types';

interface SpecialistModalProps {
  specialist: Specialist | null;
  onClose: () => void;
  onBookWithSpecialist: (specialist: Specialist) => void;
}

export const SpecialistModal: React.FC<SpecialistModalProps> = ({
  specialist,
  onClose,
  onBookWithSpecialist
}) => {
  if (!specialist) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-[#fdf9f3] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        {/* Grab handle for touch ergonomics */}
        <div className="w-12 h-1.5 bg-[#d4c2c3] rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Header bar */}
        <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-[#e8b4b8]/20">
          <span className="text-xs uppercase tracking-wider text-[#7c5357] font-semibold font-['Plus_Jakarta_Sans',sans-serif]">
            Perfil de Especialista
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#ebe8e2] flex items-center justify-center text-[#504444] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Avatar and basic info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#e8b4b8] ring-offset-2 ring-offset-[#fdf9f3] bg-[#ffdadc]">
                <img
                  src={specialist.avatar}
                  alt={specialist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#52b788] ring-2 ring-white"
                title="Disponible hoy"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
                {specialist.name}
              </h3>
              <p className="text-xs font-semibold text-[#7c5357]">
                {specialist.role}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="material-symbols-outlined text-[#745849] text-[16px] fill">
                  star
                </span>
                <span className="text-xs font-bold text-[#1c1c18]">
                  {specialist.rating}
                </span>
                <span className="text-xs text-[#504444]">
                  ({specialist.reviewsCount} reseñas verificadas)
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#e8b4b8]/30 shadow-sm">
            <h4 className="text-xs font-semibold text-[#1c1c18] mb-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Sobre mí
            </h4>
            <p className="text-xs text-[#504444] leading-relaxed">
              {specialist.bio}
            </p>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-xs font-semibold text-[#1c1c18] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Especialidades Destacadas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {specialist.specialties.map((spec, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-[#f5d0ff]/50 text-[#71547c] font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h4 className="text-xs font-semibold text-[#1c1c18] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Certificaciones &amp; Higiene
            </h4>
            <div className="space-y-1.5">
              {specialist.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#504444]">
                  <span className="material-symbols-outlined text-[#52b788] text-[16px]">
                    verified
                  </span>
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Days available */}
          <div className="p-3 rounded-2xl bg-[#f7f3ed] border border-[#ebe8e2]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c1c18] mb-1 font-['Plus_Jakarta_Sans',sans-serif]">
              <span className="material-symbols-outlined text-[16px] text-[#7c5357]">
                calendar_month
              </span>
              Días de atención en salón
            </div>
            <div className="flex flex-wrap gap-1 text-[11px] text-[#504444]">
              {specialist.availableDays.map((day, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#ebe8e2] font-medium"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-white/90 border-t border-[#e8b4b8]/20 flex gap-2">
          <button
            onClick={() => {
              onBookWithSpecialist(specialist);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(124,83,87,0.25)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Reservar Cita con {specialist.name}</span>
            <span className="material-symbols-outlined text-[18px]">
              calendar_add_on
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
