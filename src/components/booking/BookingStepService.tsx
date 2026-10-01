import React, { useRef } from 'react';
import { Service } from '../../types';
import { SERVICES } from '../../data/mockData';
import { formatCOP } from '../../utils/format';

interface BookingStepServiceProps {
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
  onNext: () => void;
  services?: Service[];
}

export const BookingStepService: React.FC<BookingStepServiceProps> = ({
  selectedService,
  onSelectService,
  onNext,
  services = SERVICES
}) => {
  const lastTapRef = useRef<{ time: number; serviceId: string }>({ time: 0, serviceId: '' });

  const handleCardClick = (service: Service) => {
    onSelectService(service);
  };

  const handleCardDoubleClick = (service: Service) => {
    onSelectService(service);
    onNext();
  };

  const handleTouchEnd = (service: Service) => {
    const now = Date.now();
    if (lastTapRef.current.serviceId === service.id && now - lastTapRef.current.time < 350) {
      onSelectService(service);
      onNext();
      lastTapRef.current = { time: 0, serviceId: '' };
    } else {
      lastTapRef.current = { time: now, serviceId: service.id };
      onSelectService(service);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
          1. Selecciona tu Servicio de Uñas o Spa
        </h3>
        <div className="flex items-center gap-2 text-xs text-[#644E53]">
          <span className="inline-flex items-center gap-1 text-[11px] text-[#64444B] bg-[#F6E3E6] px-2.5 py-0.5 rounded-full font-medium">
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            Doble clic para avanzar
          </span>
          <span>{services.length} disponibles</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {services.map((service) => {
          const isSelected = selectedService?.id === service.id;

          return (
            <div
              key={service.id}
              onClick={() => handleCardClick(service)}
              onDoubleClick={() => handleCardDoubleClick(service)}
              onTouchEnd={() => handleTouchEnd(service)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between group ${
                isSelected
                  ? 'bg-[#FAF4F5] border-[#64444B] ring-2 ring-[#64444B]/25 shadow-xs scale-[1.008]'
                  : 'bg-white border-[#EAD6D9] hover:border-[#64444B]/50 hover:bg-[#FAF4F5]/40 hover:shadow-2xs'
              }`}
              title="Haz clic para seleccionar o doble clic para avanzar directamente"
            >
              <div className="flex gap-3.5 items-start">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                      {service.name}
                    </h4>
                  </div>
                  <div className="text-sm font-bold text-[#64444B] font-mono mt-1">
                    {formatCOP(service.price)}
                  </div>
                  <span className="text-[11px] text-[#644E53] mt-0.5 block">
                    {service.durationMinutes} minutos · {service.categoryLabel}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#EAD6D9]/60 flex items-center justify-between text-xs">
                <span className="text-[#7D676B] text-[11px] font-medium">{service.tag}</span>
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#64444B] bg-[#64444B] text-white shadow-2xs'
                      : 'border-[#EAD6D9] bg-white text-transparent group-hover:border-[#64444B]/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span>Continuar a Fecha &amp; Especialista</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
