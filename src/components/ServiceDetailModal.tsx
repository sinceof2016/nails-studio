import React from 'react';
import { Service } from '../types';
import { formatCOP } from '../utils/format';

interface ServiceDetailModalProps {
  service: Service | null;
  onClose: () => void;
  onBookService: (service: Service) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookService
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-[#F4EFE9] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        {/* Top image banner */}
        <div className="relative w-full h-52 shrink-0 bg-[#f7f3ed]">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#2B2420] hover:bg-white transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#2B2420] text-xs font-semibold flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-[#5A4A43] fill">
              star
            </span>
            {service.rating} <span className="text-[#5A4A43] font-normal">({service.reviewsCount})</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5A4A43]">
                {service.categoryLabel}
              </span>
              <h3 className="text-xl font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                {service.name}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-bold font-mono text-[#2B2420]">
                {formatCOP(service.price)}
              </span>
              <span className="block text-[10px] text-[#5A4A43]">COP</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#5A4A43] py-1 border-y border-[#C6BDAC]/20">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#5A4A43]">
                schedule
              </span>
              <span>{service.durationMinutes} minutos</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#52b788]">
                verified
              </span>
              <span>Esterilización médica individual</span>
            </div>
          </div>

          <p className="text-xs text-[#5A4A43] leading-relaxed">
            {service.description}
          </p>

          {/* Steps */}
          {service.steps && service.steps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                ¿Qué incluye esta sesión?
              </h4>
              <ol className="space-y-2">
                {service.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs text-[#5A4A43]">
                    <span className="w-5 h-5 rounded-full bg-[#C6BDAC]/40 text-[#623c40] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Recommended for */}
          {service.recommendedFor && (
            <div className="p-3 rounded-2xl bg-[#C6BDAC]/40/30 border border-[#C6BDAC]/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5A4A43] mb-1 font-['Plus_Jakarta_Sans',sans-serif]">
                <span className="material-symbols-outlined text-[16px]">
                  auto_awesome
                </span>
                Ideal para
              </div>
              <p className="text-xs text-[#5A4A43]">
                {service.recommendedFor}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/90 border-t border-[#C6BDAC]/20 flex gap-2">
          <button
            onClick={() => {
              onBookService(service);
              onClose();
            }}
            className="w-full py-3 px-4 rounded-full bg-primary hover:bg-[#AA8A74] text-on-primary font-bold text-sm shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Reservar este servicio ({formatCOP(service.price)})</span>
            <span className="material-symbols-outlined text-[18px]">
              calendar_add_on
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
