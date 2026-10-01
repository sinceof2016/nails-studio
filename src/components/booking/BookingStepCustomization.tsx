import React from 'react';
import { NAIL_SHAPES, ADD_ON_OPTIONS } from '../../data/mockData';
import { formatCOP } from '../../utils/format';

interface BookingStepCustomizationProps {
  selectedShape: string;
  setSelectedShape: (shape: string) => void;
  selectedAddOns: string[];
  toggleAddOn: (addonName: string) => void;
  onBack: () => void;
  onNext: () => void;
  selectedPolish?: string;
  setSelectedPolish?: (polish: string) => void;
}

export const BookingStepCustomization: React.FC<BookingStepCustomizationProps> = ({
  selectedShape,
  setSelectedShape,
  selectedAddOns,
  toggleAddOn,
  onBack,
  onNext
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Forma de Uña */}
      <div className="bg-white rounded-3xl p-5 border border-[#EAD6D9] shadow-xs space-y-3">
        <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
          1. Forma de Uña Preferida
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {NAIL_SHAPES.map((shape) => {
            const isSelected = selectedShape === shape.name;
            return (
              <button
                key={shape.id}
                onClick={() => setSelectedShape(shape.name)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#64444B] text-white border-[#64444B] shadow-xs'
                    : 'bg-white border-[#EAD6D9] text-[#1F1417] hover:border-[#64444B]/50'
                }`}
              >
                <span className="text-xs font-bold block">{shape.name}</span>
                <span className={`text-[10px] line-clamp-2 mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#7D676B]'}`}>
                  {shape.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Add-ons in COP */}
      <div className="bg-white rounded-3xl p-5 border border-[#EAD6D9] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
            2. Complementos &amp; Spa Opcionales
          </h3>
          <span className="text-xs text-[#64444B] font-bold">Valores en COP</span>
        </div>
        <div className="space-y-2">
          {ADD_ON_OPTIONS.map((addon) => {
            const isSelected = selectedAddOns.includes(addon.name);
            return (
              <div
                key={addon.id}
                onClick={() => toggleAddOn(addon.name)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#FAF4F5] border-[#64444B] shadow-2xs'
                    : 'bg-white border-[#EAD6D9] hover:border-[#64444B]/50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <strong className="text-xs text-[#1F1417] block">{addon.name}</strong>
                  <span className="text-[11px] text-[#644E53]">{addon.description}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#64444B] font-mono block">
                    +{formatCOP(addon.price)}
                  </span>
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-700' : 'text-[#7D676B]'}`}>
                    {isSelected ? '✓ Agregado' : '+ Agregar'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white border border-[#EAD6D9] text-[#644E53] text-xs font-semibold hover:bg-[#F6E3E6] cursor-pointer"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span>Continuar a Confirmación</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
