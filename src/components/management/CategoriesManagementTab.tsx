import React from 'react';
import { ServiceCategory, Service } from '../../types';

interface CategoriesManagementTabProps {
  categories: ServiceCategory[];
  services: Service[];
  onOpenCreateModal: () => void;
  onEditCategory: (category: ServiceCategory) => void;
  onDeleteCategory: (category: ServiceCategory) => void;
}

export const CategoriesManagementTab: React.FC<CategoriesManagementTabProps> = ({
  categories,
  services,
  onOpenCreateModal,
  onEditCategory,
  onDeleteCategory
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAD6D9]/70 shadow-2xs">
        <div>
          <h3 className="font-bold text-base text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
            Tipos y Categorías de Servicios ({categories.length})
          </h3>
          <p className="text-xs text-[#644E53]">
            Clasifica los servicios de tu carta (Manicura, Nail Art, Pedicura, Gel, etc.) para la navegación de clientes.
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>+ Nuevo Tipo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const associatedServicesCount = services.filter((s) => s.category === cat.id).length;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-5 border border-[#EAD6D9]/70 shadow-2xs flex flex-col justify-between space-y-3 hover:border-[#64444B]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#64444B]/10 text-[#64444B] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">{cat.icon || 'spa'}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F6E3E6] text-[#64444B] text-[11px] font-bold">
                    {associatedServicesCount} servicios
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-base text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                    {cat.label}
                  </h4>
                  <span className="text-[11px] font-mono text-[#8C767B] block mt-0.5">
                    ID: {cat.id}
                  </span>
                  {cat.description && (
                    <p className="text-xs text-[#644E53] mt-2 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#ebe8e2] flex items-center justify-end gap-1.5">
                <button
                  onClick={() => onEditCategory(cat)}
                  className="p-1.5 rounded-lg bg-white hover:bg-[#F6E3E6] text-[#64444B] border border-[#EAD6D9] transition-colors cursor-pointer flex items-center gap-1"
                  title="Modificar Tipo de Servicio"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span className="text-[11px] font-semibold pr-0.5">Editar</span>
                </button>

                <button
                  onClick={() => onDeleteCategory(cat)}
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-[#ba1a1a] border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="Eliminar Tipo de Servicio"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  <span className="text-[11px] font-semibold pr-0.5">Eliminar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
