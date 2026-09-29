import React from 'react';
import { Specialist } from '../types';
import { SPECIALISTS } from '../data/mockData';

interface SpecialistsScreenProps {
  onBookWithSpecialist: (specialist: Specialist) => void;
  onOpenSpecialistModal: (specialist: Specialist) => void;
}

export const SpecialistsScreen: React.FC<SpecialistsScreenProps> = ({
  onBookWithSpecialist,
  onOpenSpecialistModal
}) => {
  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#7c5357] via-[#8c5f64] to-[#71547c] p-6 sm:p-8 text-white shadow-[0_10px_28px_-4px_rgba(124,83,87,0.35)] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#ffdadc] text-xs font-semibold mb-3">
            <span className="material-symbols-outlined text-[15px] fill">stars</span>
            Equipo Profesional Certificado
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight text-white mb-2">
            Maestras de Manicura, Nail Art &amp; Bienestar
          </h2>
          <p className="text-sm text-white/85 leading-relaxed">
            Cada una de nuestras especialistas cuenta con certificación internacional en técnica rusa, esterilización de grado médico y diseño personalizado. Elige a tu manicurista preferida para tu próxima cita.
          </p>
        </div>
      </div>

      {/* Specialists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SPECIALISTS.map((specialist) => (
          <div
            key={specialist.id}
            className="bg-white rounded-3xl p-5 border border-[#e8b4b8]/30 shadow-[0_6px_20px_-4px_rgba(232,180,184,0.2)] hover:shadow-[0_12px_30px_-4px_rgba(232,180,184,0.35)] transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header: Avatar, Name, Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative shrink-0">
                  <img
                    src={specialist.avatar}
                    alt={specialist.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-[#e8b4b8] ring-offset-2 ring-offset-white group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" title="Disponible hoy" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                      {specialist.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#7c5357] font-semibold">{specialist.role}</p>

                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <div className="flex items-center text-[#c59b27]">
                      <span className="material-symbols-outlined text-[15px] fill">star</span>
                      <span className="font-bold ml-0.5 text-[#1c1c18]">{specialist.rating}</span>
                    </div>
                    <span className="text-[#7D676B]">({specialist.reviewsCount} reseñas)</span>
                  </div>
                </div>
              </div>

              {/* Bio snippet */}
              <p className="text-xs text-[#504444] leading-relaxed mb-4 line-clamp-3">
                {specialist.bio}
              </p>

              {/* Specialties tags */}
              <div className="mb-4">
                <span className="text-[11px] font-semibold text-[#7D676B] block mb-1.5 uppercase tracking-wider">
                  Especialidades:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {specialist.specialties?.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full bg-[#fdf9f3] text-[#7c5357] text-[11px] font-medium border border-[#e8b4b8]/40"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Available Days */}
              <div className="p-3 rounded-2xl bg-[#f7f3ed] text-xs text-[#504444] mb-4 flex items-center justify-between">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#7c5357]">calendar_today</span>
                  Días de Atención:
                </span>
                <span className="font-semibold text-[#1c1c18]">{specialist.availableDays.join(', ')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#ebe8e2] flex items-center gap-2">
              <button
                onClick={() => onOpenSpecialistModal(specialist)}
                className="flex-1 py-2 px-3 rounded-full bg-[#fdf9f3] hover:bg-[#ffdadc]/40 text-[#7c5357] text-xs font-semibold border border-[#e8b4b8]/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">badge</span>
                <span>Ver Perfil</span>
              </button>

              <button
                onClick={() => onBookWithSpecialist(specialist)}
                className="flex-1 py-2 px-3 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                <span>Agendar con Ella</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
