import React, { useState, useMemo } from 'react';
import { Service, Specialist } from '../types';
import { SERVICES, SPECIALISTS } from '../data/mockData';
import { formatCOP } from '../utils/format';

interface HomeScreenProps {
  onQuickBook: (service: Service) => void;
  onOpenSpecialist: (specialist: Specialist) => void;
  onOpenPromo: () => void;
  onOpenServiceDetail: (service: Service) => void;
  onOpenCookieSettings?: () => void;
  onOpenCookiePolicy?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onQuickBook,
  onOpenSpecialist,
  onOpenPromo,
  onOpenServiceDetail,
  onOpenCookieSettings,
  onOpenCookiePolicy
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'todos', label: 'Todos los Servicios' },
    { id: 'manicura', label: 'Manicura Rusa' },
    { id: 'nail-art', label: 'Nail Art Pastel' },
    { id: 'pedicura', label: 'Pedicura Spa' },
    { id: 'gel', label: 'Gel & Kapping' },
    { id: 'tratamientos', label: 'Tratamientos & Cuidado' }
  ];

  const filteredServices = useMemo(() => {
    return SERVICES.filter((service) => {
      const matchesCategory =
        activeCategory === 'todos' || service.category === activeCategory;
      const matchesQuery =
        searchQuery.trim() === '' ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner: Welcome & Special Offer (Full Width) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#e8b4b8]/70 via-[#f5d0ff]/60 to-[#fdf9f3] p-6 sm:p-8 md:p-10 shadow-[0_8px_24px_-4px_rgba(232,180,184,0.3)] border border-[#e8b4b8]/30 flex flex-col justify-between">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/40 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 text-[#6b4448] text-xs font-semibold backdrop-blur-md shadow-2xs font-['Plus_Jakarta_Sans',sans-serif]">
            <span className="material-symbols-outlined text-[15px] text-[#7c5357] fill">
              auto_awesome
            </span>
            Santuario de Manicura Rusa &amp; Spa · Chicó Bogotá
          </div>

          <h2 className="text-2xl sm:text-4xl text-[#1c1c18] font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
            15% OFF en Manicura Rusa &amp; Spa Deluxe
          </h2>

          <p className="text-sm sm:text-base text-[#504444] leading-relaxed">
            Disfruta de exfoliación de cuarzo rosa, nivelación rubber con colágeno y acabado aperlado glazed donut con esmaltado semipermanente de máxima durabilidad y cuidado clínico de cutículas.
          </p>
        </div>

        <div className="relative z-10 pt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={onOpenPromo}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#7c5357] text-white text-xs sm:text-sm font-semibold shadow-[0_4px_16px_rgba(124,83,87,0.25)] hover:bg-[#674246] active:scale-95 transition-all cursor-pointer"
          >
            <span>Aprovechar 15% OFF</span>
            <span className="material-symbols-outlined text-[17px] ml-1.5">local_florist</span>
          </button>
          <span className="text-xs sm:text-sm text-[#504444] font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#7c5357]">location_on</span>
            Sede Chicó · Carrera 11 # 93-40 · Reserva online en COP
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e8b4b8]/30 shadow-xs space-y-4">
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-4 text-[#827474] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tratamiento, esmaltado, técnica rusa o spa..."
            className="w-full h-11 pl-11 pr-10 rounded-full bg-[#fdf9f3] border border-[#e8b4b8]/40 text-xs sm:text-sm text-[#1c1c18] placeholder-[#827474] focus:outline-none focus:ring-2 focus:ring-[#7c5357]/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 text-[#827474] hover:text-[#1c1c18]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold font-['Plus_Jakarta_Sans',sans-serif] whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#7c5357] text-white shadow-xs'
                    : 'bg-[#f7f3ed] text-[#504444] hover:text-[#7c5357] hover:bg-[#e8b4b8]/20'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7c5357]" />
          <h3 className="text-xl sm:text-2xl text-[#1c1c18] font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Carta de Tratamientos &amp; Servicios
          </h3>
        </div>
        <span className="text-xs sm:text-sm text-[#7c5357] font-semibold font-['Plus_Jakarta_Sans',sans-serif]">
          {filteredServices.length} {filteredServices.length === 1 ? 'servicio disponible' : 'servicios disponibles'}
        </span>
      </div>

      {/* Services Grid: Fully Responsive */}
      {filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#e8b4b8]/30">
          <span className="material-symbols-outlined text-[#7c5357] text-[44px] mb-2">
            spa
          </span>
          <p className="text-base font-semibold text-[#1c1c18]">
            No encontramos servicios con ese criterio de búsqueda
          </p>
          <p className="text-xs text-[#504444] mt-1">
            Prueba con otra palabra o selecciona "Todos los Servicios".
          </p>
          <button
            onClick={() => {
              setActiveCategory('todos');
              setSearchQuery('');
            }}
            className="mt-4 px-5 py-2 rounded-full bg-[#7c5357] text-white text-xs font-semibold shadow-xs"
          >
            Ver todos los servicios
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-3xl bg-white p-5 shadow-[0_6px_20px_-4px_rgba(232,180,184,0.2)] border border-[#e8b4b8]/20 flex flex-col justify-between transition-all hover:shadow-[0_12px_28px_-4px_rgba(232,180,184,0.35)] group"
            >
              <div>
                {/* Card Image Banner */}
                <div
                  className="relative w-full h-48 rounded-2xl overflow-hidden bg-[#f7f3ed] cursor-pointer mb-4"
                  onClick={() => onOpenServiceDetail(service)}
                >
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  {/* Rating Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1c1c18] text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-[#c59b27] fill">
                      star
                    </span>
                    {service.rating}{' '}
                    <span className="text-[#504444] font-normal">
                      ({service.reviewsCount})
                    </span>
                  </div>

                  {/* Category / Feature Tag */}
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-xs ${
                      service.tagType === 'top'
                        ? 'bg-[#e8b4b8] text-[#6b4448]'
                        : service.tagType === 'relax'
                        ? 'bg-[#f5d0ff] text-[#74567e]'
                        : service.tagType === 'trend'
                        ? 'bg-[#ffdbc9] text-[#2a170b]'
                        : 'bg-[#f1ede7] text-[#1c1c18]'
                    }`}
                  >
                    {service.tag}
                  </div>
                </div>

                {/* Title & Price in COP */}
                <div
                  className="flex flex-col gap-1.5 cursor-pointer mb-3"
                  onClick={() => onOpenServiceDetail(service)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base sm:text-lg text-[#1c1c18] font-bold font-['Plus_Jakarta_Sans',sans-serif] group-hover:text-[#7c5357] transition-colors leading-snug">
                      {service.name}
                    </h4>
                  </div>
                  <div className="text-lg font-bold text-[#7c5357] font-mono">
                    {formatCOP(service.price)}
                  </div>
                  <p className="text-xs text-[#504444] leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Card Footer: Duration & CTA */}
              <div className="pt-3 border-t border-[#ebe8e2] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#504444] text-xs">
                  <span className="material-symbols-outlined text-[16px] text-[#7c5357]">
                    schedule
                  </span>
                  <span>{service.durationMinutes} min</span>
                </div>

                <button
                  onClick={() => onQuickBook(service)}
                  className="px-4 py-2 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white text-xs font-semibold transition-all duration-200 active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Reservar</span>
                  <span className="material-symbols-outlined text-[15px]">
                    calendar_add_on
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Specialists Spotlight Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8b4b8]/30 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#71547c]" />
            <h3 className="text-xl sm:text-2xl text-[#1c1c18] font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Especialistas del Santuario
            </h3>
          </div>
          <span className="text-xs sm:text-sm text-[#71547c] font-medium">
            Equipo certificado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SPECIALISTS.map((specialist) => (
            <div
              key={specialist.id}
              onClick={() => onOpenSpecialist(specialist)}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#fdf9f3] border border-[#e8b4b8]/30 hover:border-[#7c5357]/40 cursor-pointer transition-all hover:bg-white shadow-2xs group"
            >
              <img
                src={specialist.avatar}
                alt={specialist.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-[#e8b4b8] group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                  {specialist.name}
                </h4>
                <p className="text-xs text-[#7c5357] font-semibold truncate">{specialist.role}</p>
                <div className="flex items-center gap-1 text-[11px] text-[#504444] mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-[#c59b27] fill">star</span>
                  <span className="font-bold text-[#1c1c18]">{specialist.rating}</span>
                  <span>({specialist.reviewsCount})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spa Footer & Privacy / Cookie Links */}
      <footer className="pt-6 pb-2 text-center text-xs text-[#827474] space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#504444]">
          <button
            type="button"
            onClick={onOpenCookieSettings}
            className="hover:text-[#7c5357] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#7c5357]">cookie</span>
            <span>Configuración de Cookies</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenCookiePolicy}
            className="hover:text-[#7c5357] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#7c5357]">policy</span>
            <span>Política de Cookies &amp; Privacidad</span>
          </button>
          <span>•</span>
          <span className="text-[#827474]">Sede Chicó · Bogotá D.C.</span>
        </div>
        <p className="text-[11px] text-[#827474]">
          © {new Date().getFullYear()} Aura Nails &amp; Spa. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};
