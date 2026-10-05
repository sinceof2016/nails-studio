import React, { useRef, useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'manicura', label: 'Manicure' },
    { id: 'pedicura', label: 'Pedicure' },
    { id: 'rubber', label: 'Base Rubber' },
    { id: 'extensiones', label: 'Acrílico & Polygel' },
    { id: 'adicionales', label: 'Arreglos & Extras' }
  ];

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCat = selectedCategory === 'todos' || s.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.tag && s.tag.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

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
        <h3 className="text-base font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
          1. Selecciona tu Servicio de Uñas o Spa
        </h3>
        <div className="flex items-center gap-2 text-xs text-[#5A4A43]">
          <span className="inline-flex items-center gap-1 text-[11px] text-[#2B2420] bg-[#C6BDAC]/40 px-2.5 py-0.5 rounded-full font-medium">
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            Doble clic para avanzar
          </span>
          <span>{filteredServices.length} disponibles</span>
        </div>
      </div>

      {/* Buscador y Filtros de Categoría */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#C6BDAC] shadow-2xs space-y-2.5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#5A4A43]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por servicio (ej. Arreglo permanente, Semipermanente, Acrílico)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F4EFE9] border border-[#C6BDAC] text-xs text-[#2B2420] placeholder-[#5A4A43]/70 focus:outline-none focus:border-[#BB9C87] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5A4A43] hover:text-[#2B2420]"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isCatActive
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-2xs'
                    : 'bg-[#F4EFE9] text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#C6BDAC] text-xs text-[#5A4A43] space-y-2">
          <span className="material-symbols-outlined text-[32px] text-[#BB9C87]">search_off</span>
          <p className="font-semibold text-sm text-[#2B2420]">
            {services.length === 0
              ? 'No hay servicios disponibles por ahora'
              : 'No encontramos servicios con esa búsqueda'}
          </p>
          <p>
            {services.length === 0
              ? 'Estamos actualizando nuestra carta de servicios. Por favor vuelve a consultar más tarde.'
              : 'Prueba con otra palabra clave como "manicure", "pedicure", "arreglo" o limpia los filtros.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('todos');
            }}
            className="mt-2 px-4 py-1.5 rounded-full bg-[#BB9C87] text-[#2B2420] font-bold text-xs shadow-2xs hover:bg-[#AA8A74]"
          >
            Ver todos los servicios
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredServices.map((service) => {
            const isSelected = selectedService?.id === service.id;

            return (
              <div
                key={service.id}
                onClick={() => handleCardClick(service)}
                onDoubleClick={() => handleCardDoubleClick(service)}
                onTouchEnd={() => handleTouchEnd(service)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#F4EFE9] border-[#BB9C87] ring-2 ring-[#2B2420]/25 shadow-xs scale-[1.008]'
                    : 'bg-white border-[#C6BDAC] hover:border-[#BB9C87]/50 hover:bg-[#F4EFE9]/40 hover:shadow-2xs'
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
                      <h4 className="text-sm font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                        {service.name}
                      </h4>
                    </div>
                    <div className="text-sm font-bold text-[#2B2420] font-mono mt-1">
                      {formatCOP(service.price)}
                    </div>
                    <span className="text-[11px] text-[#5A4A43] mt-0.5 block">
                      {service.durationMinutes} minutos · {service.categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#C6BDAC]/60 flex items-center justify-between text-xs">
                  <span className="text-[#5A4A43] text-[11px] font-medium">{service.tag}</span>
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#BB9C87] bg-[#BB9C87] text-[#2B2420] font-bold shadow-2xs'
                        : 'border-[#C6BDAC] bg-white text-transparent group-hover:border-[#BB9C87]/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">check</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span>Continuar a Fecha &amp; Especialista</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
