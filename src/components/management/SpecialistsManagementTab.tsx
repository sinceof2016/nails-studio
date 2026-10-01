import React from 'react';
import { Specialist } from '../../types';

interface SpecialistsManagementTabProps {
  specialists: Specialist[];
  onOpenCreateModal: () => void;
  onEditSpecialist: (specialist: Specialist) => void;
  onDeleteSpecialist: (specialist: Specialist) => void;
}

export const SpecialistsManagementTab: React.FC<SpecialistsManagementTabProps> = ({
  specialists,
  onOpenCreateModal,
  onEditSpecialist,
  onDeleteSpecialist
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAD6D9]/70 shadow-2xs">
        <div>
          <h3 className="font-bold text-base text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
            Manicuristas y Especialistas ({specialists.length})
          </h3>
          <p className="text-xs text-[#644E53]">
            Modifica nombres, cargos, comisiones de liquidación y disponibilidad de turnos de tu equipo.
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>+ Nueva Manicurista</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {specialists.map((spec) => (
          <div
            key={spec.id}
            className="bg-white rounded-2xl p-5 border border-[#EAD6D9]/70 shadow-2xs flex flex-col justify-between space-y-3.5 hover:border-[#64444B]/40 transition-all"
          >
            <div>
              <div className="flex items-start gap-3">
                <img
                  src={spec.avatar}
                  alt={spec.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-[#C5838D]/60 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-base text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                      {spec.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold shrink-0">
                      ★ {spec.rating}
                    </span>
                  </div>
                  <span className="text-xs text-[#64444B] font-semibold block truncate">
                    {spec.role}
                  </span>
                  <span className="text-[11px] text-[#644E53] block mt-0.5">
                    Comisión: <strong className="text-emerald-700">{spec.commissionRate}%</strong>
                  </span>
                </div>
              </div>

              {spec.bio && (
                <p className="text-xs text-[#644E53] line-clamp-2 mt-2.5 leading-relaxed">
                  {spec.bio}
                </p>
              )}

              {/* Days available */}
              <div className="mt-3 pt-2.5 border-t border-[#ebe8e2]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#644E53] block mb-1">
                  Días Disponibles:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(spec.availableDays || []).map((day) => (
                    <span
                      key={day}
                      className="px-2 py-0.5 rounded bg-[#FAF4F5] text-[#64444B] text-[10px] font-medium border border-[#EAD6D9]"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              {spec.specialties && spec.specialties.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#ebe8e2]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#644E53] block mb-1">
                    Especialidades:
                  </span>
                  <p className="text-xs text-[#1F1417] line-clamp-1">
                    {spec.specialties.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-[#ebe8e2] flex items-center justify-end gap-1.5">
              <button
                onClick={() => onEditSpecialist(spec)}
                className="p-1.5 rounded-lg bg-white hover:bg-[#F6E3E6] text-[#64444B] border border-[#EAD6D9] transition-colors cursor-pointer flex items-center gap-1"
                title="Modificar Manicurista"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                <span className="text-[11px] font-semibold pr-0.5">Editar</span>
              </button>

              <button
                onClick={() => onDeleteSpecialist(spec)}
                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-[#ba1a1a] border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Eliminar Manicurista"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span className="text-[11px] font-semibold pr-0.5">Eliminar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
