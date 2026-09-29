import React from 'react';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPromo: (discountPercent: number) => void;
}

export const PromoModal: React.FC<PromoModalProps> = ({
  isOpen,
  onClose,
  onApplyPromo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-[#FAF4F5] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 z-10 animate-in slide-in-from-bottom duration-300 border border-[#EAD6D9]">
        <div className="w-12 h-1.5 bg-[#EAD6D9] rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4D9DC] text-[#64444B] text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px] fill">
              local_florist
            </span>
            Semana de Autocuidado
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <h3 className="text-xl font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] leading-tight mb-2">
          15% OFF en Manicura Rusa &amp; Spa Deluxe
        </h3>

        <p className="text-xs text-[#644E53] leading-relaxed mb-4">
          Regálate un momento de pausa y mimo exclusivo. Incluye exfoliación botánica con cuarzo rosa, nutrición profunda de manos y esmaltado impecable de larga duración.
        </p>

        <div className="p-3.5 rounded-2xl bg-white border border-[#EAD6D9] shadow-sm space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#644E53]">Código promocional aplicado:</span>
            <span className="font-mono font-bold text-[#64444B] bg-[#F4D9DC]/70 px-2 py-0.5 rounded-md">
              AUTOCUIDADO15
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#644E53]">Vigencia:</span>
            <span className="font-medium text-[#1F1417]">Hasta este domingo</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#644E53]">Válido con:</span>
            <span className="font-medium text-[#1F1417]">Cualquier especialista</span>
          </div>
        </div>

        <button
          onClick={() => {
            onApplyPromo(15);
            onClose();
          }}
          className="w-full py-3.5 px-4 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(100,68,75,0.25)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Aprovechar Oferta y Reservar Cita</span>
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
};
