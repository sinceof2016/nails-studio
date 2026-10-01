import React from 'react';
import { BUSINESS_CONFIG } from '../config/businessConfig';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPromo?: (discountPercent: number) => void;
  onNavigateToBooking?: () => void;
}

export const PromoModal: React.FC<PromoModalProps> = ({
  isOpen,
  onClose,
  onApplyPromo,
  onNavigateToBooking
}) => {
  if (!isOpen) return null;

  const handleBooking = () => {
    if (onApplyPromo) onApplyPromo(0);
    if (onNavigateToBooking) onNavigateToBooking();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-[#FAF4F5] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 z-10 animate-in slide-in-from-bottom duration-300 border border-[#EAD6D9] max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-[#EAD6D9] rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4D9DC] text-[#64444B] text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px] fill">
              spa
            </span>
            Experiencia Signature · {BUSINESS_CONFIG.brandName}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53] cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] leading-tight mb-2">
          El Ritual de Cuidado Clínico &amp; Bienestar
        </h3>

        <p className="text-xs sm:text-sm text-[#644E53] leading-relaxed mb-5">
          En {BUSINESS_CONFIG.brandName}, cada cita es un momento sagrado de calma y belleza. Diseñamos un protocolo integral enfocado en la salud ungueal, la máxima bioseguridad y acabados artísticos de alta costura.
        </p>

        {/* 4 Pillars of the Sanctuary */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-white border border-[#EAD6D9] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] text-[#64444B] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                1. Esterilización en Autoclave Grado Médico
              </h4>
              <p className="text-[11px] text-[#644E53] mt-0.5 leading-relaxed">
                Bioseguridad hospitalaria a 134°C. Cada instrumental se almacena en sobres termosellados con testigo biológico y se abre frente a tus ojos.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#EAD6D9] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] text-[#64444B] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                2. Manicura Rusa en Seco (Dry Manicure)
              </h4>
              <p className="text-[11px] text-[#644E53] mt-0.5 leading-relaxed">
                Limpieza anatómica de cutículas con fresas diamantadas de micraje alemán. Sin cortes ni químicos agresivos, logrando acabados pulcros y durabilidad de hasta 4 semanas.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#EAD6D9] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] text-[#64444B] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">diamond</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                3. Nivelación &amp; Fórmulas 10-Free
              </h4>
              <p className="text-[11px] text-[#644E53] mt-0.5 leading-relaxed">
                Bases rubber ricas en colágeno vegetal y esmaltes libres de toxinas dañinas (sin formaldehído, tolueno ni DBP), protegiendo la queratina natural de tus uñas.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#EAD6D9] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] text-[#64444B] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">self_improvement</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                4. Spa Sensorial &amp; Masaje Botánico
              </h4>
              <p className="text-[11px] text-[#644E53] mt-0.5 leading-relaxed">
                Exfoliación con polvo de cuarzo rosa, sales minerales y masaje hidratante con aceites orgánicos de almendras dulces y lavanda francesa.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleBooking}
          className="w-full py-3.5 px-4 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(100,68,75,0.25)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Agendar Cita en el Santuario</span>
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
};
