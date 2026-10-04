import React, { useState, useMemo } from 'react';
import { Service, Specialist, ServiceCategory, SystemUser } from '../types';
import { SERVICES, SPECIALISTS, INITIAL_SERVICE_CATEGORIES } from '../data/mockData';
import { formatCOP } from '../utils/format';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { compressImageFile } from '../utils/imageCompressor';

interface HomeScreenProps {
  onQuickBook: (service: Service) => void;
  onOpenSpecialist: (specialist: Specialist) => void;
  onOpenPromo: () => void;
  onOpenServiceDetail: (service: Service) => void;
  onOpenCookieSettings?: () => void;
  onOpenCookiePolicy?: () => void;
  services?: Service[];
  specialists?: Specialist[];
  serviceCategories?: ServiceCategory[];
  currentUser?: SystemUser | null;
  onUpdateServiceImage?: (serviceId: string, newImage: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onQuickBook,
  onOpenSpecialist,
  onOpenPromo,
  onOpenServiceDetail,
  onOpenCookieSettings,
  onOpenCookiePolicy,
  services = SERVICES,
  specialists = SPECIALISTS,
  serviceCategories = INITIAL_SERVICE_CATEGORIES,
  currentUser,
  onUpdateServiceImage
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uploadingServiceId, setUploadingServiceId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.rol === 'SuperAdmin';

  const handleServiceImageUpload = async (serviceId: string, file?: File) => {
    if (!file || !onUpdateServiceImage) return;

    try {
      setUploadingServiceId(serviceId);
      const compressed = await compressImageFile(file, 800, 800);
      onUpdateServiceImage(serviceId, compressed);
    } catch (err) {
      console.warn('Error subiendo imagen local de servicio:', err);
    } finally {
      setUploadingServiceId(null);
    }
  };

  const categories = useMemo(() => [
    { id: 'todos', label: 'Todos los Servicios' },
    ...serviceCategories.map((c) => ({ id: c.id, label: c.label }))
  ], [serviceCategories]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        activeCategory === 'todos' || service.category === activeCategory;
      const matchesQuery =
        searchQuery.trim() === '' ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [services, activeCategory, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner: Protocolo Signature & Ritual de Bienestar (Full Width) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#C6BDAC]/35 via-[#F4EFE9] to-white p-6 sm:p-8 md:p-10 shadow-xs border border-[#C6BDAC] flex flex-col justify-between">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/50 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 text-[#2B2420] text-xs font-semibold backdrop-blur-md shadow-2xs border border-[#C6BDAC] font-['Plus_Jakarta_Sans',sans-serif]">
            <span className="material-symbols-outlined text-[15px] text-[#2B2420] fill">
              auto_awesome
            </span>
            Protocolo Signature · {BUSINESS_CONFIG.brandName}
          </div>

          <h2 className="text-2xl sm:text-4xl text-[#2B2420] font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
            El Ritual de Manicura Rusa &amp; Bienestar Clínico
          </h2>

          <p className="text-sm sm:text-base text-[#5A4A43] leading-relaxed">
            Un santuario de belleza y salud ungueal de alta precisión. Combinamos esterilización hospitalaria en autoclave a 134°C, limpieza en seco con tecnología de fresas diamantadas y nutrición regenerativa con aceites botánicos orgánicos para unas uñas impecables y saludables.
          </p>
        </div>

        <div className="relative z-10 pt-4 flex flex-wrap items-center gap-4">
          <span className="text-xs sm:text-sm text-[#5A4A43] font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#2B2420]">verified</span>
            {BUSINESS_CONFIG.branchName} · Atención personalizada en cabina privada · Reserva en línea
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#C6BDAC] shadow-xs space-y-4">
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-4 text-[#5A4A43] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tratamiento, esmaltado, técnica rusa o spa..."
            className="w-full h-11 pl-11 pr-10 rounded-full bg-[#F4EFE9] border border-[#C6BDAC] text-xs sm:text-sm text-[#2B2420] placeholder-[#5A4A43] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 text-[#5A4A43] hover:text-[#2B2420]"
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
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                    : 'bg-[#C6BDAC]/40 text-[#5A4A43] hover:text-[#2B2420] hover:bg-[#C6BDAC]/50'
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
          <span className="w-2.5 h-2.5 rounded-full bg-[#BB9C87]" />
          <h3 className="text-xl sm:text-2xl text-[#2B2420] font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Carta de Tratamientos &amp; Servicios
          </h3>
        </div>
        <span className="text-xs sm:text-sm text-[#2B2420] font-semibold font-['Plus_Jakarta_Sans',sans-serif]">
          {filteredServices.length} {filteredServices.length === 1 ? 'servicio disponible' : 'servicios disponibles'}
        </span>
      </div>

      {/* Services Grid: Fully Responsive */}
      {filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#C6BDAC]">
          <span className="material-symbols-outlined text-[#2B2420] text-[44px] mb-2">
            spa
          </span>
          <p className="text-base font-semibold text-[#2B2420]">
            No encontramos servicios con ese criterio de búsqueda
          </p>
          <p className="text-xs text-[#5A4A43] mt-1">
            Prueba con otra palabra o selecciona "Todos los Servicios".
          </p>
          <button
            onClick={() => {
              setActiveCategory('todos');
              setSearchQuery('');
            }}
            className="mt-4 px-5 py-2 rounded-full bg-[#BB9C87] text-[#2B2420] font-bold text-xs font-semibold shadow-xs"
          >
            Ver todos los servicios
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-3xl bg-white p-5 shadow-[0_6px_20px_-4px_rgba(234,185,189,0.2)] border border-[#C6BDAC] flex flex-col justify-between transition-all hover:shadow-[0_12px_28px_-4px_rgba(234,185,189,0.35)] group"
            >
              <div>
                {/* Card Image Banner */}
                <div
                  className="relative w-full h-48 rounded-2xl overflow-hidden bg-[#F4EFE9] cursor-pointer mb-4"
                  onClick={() => onOpenServiceDetail(service)}
                >
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  {/* Rating Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#2B2420] text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-[#c59b27] fill">
                      star
                    </span>
                    {service.rating}{' '}
                    <span className="text-[#5A4A43] font-normal">
                      ({service.reviewsCount})
                    </span>
                  </div>

                  {/* Category / Feature Tag */}
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-xs ${
                      service.tagType === 'top'
                        ? 'bg-[#C6BDAC]/50 text-[#2B2420]'
                        : service.tagType === 'relax'
                        ? 'bg-[#C6BDAC]/40 text-[#2B2420]'
                        : service.tagType === 'trend'
                        ? 'bg-[#F4EFE9] text-[#AA8A74]'
                        : 'bg-[#F4EFE9] text-[#2B2420]'
                    }`}
                  >
                    {service.tag}
                  </div>

                  {/* SuperAdmin: Cambiar foto local */}
                  {isSuperAdmin && onUpdateServiceImage && (
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs cursor-pointer shadow-md transition-all select-none z-10"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {uploadingServiceId === service.id ? 'sync' : 'photo_camera'}
                      </span>
                      <span>{uploadingServiceId === service.id ? 'Cargando...' : 'Cambiar foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingServiceId === service.id}
                        className="hidden"
                        onChange={(e) => handleServiceImageUpload(service.id, e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>

                {/* Title & Price in COP */}
                <div
                  className="flex flex-col gap-1.5 cursor-pointer mb-3"
                  onClick={() => onOpenServiceDetail(service)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base sm:text-lg text-[#2B2420] font-bold font-['Plus_Jakarta_Sans',sans-serif] group-hover:text-[#2B2420] transition-colors leading-snug">
                      {service.name}
                    </h4>
                  </div>
                  <div className="text-lg font-bold text-[#2B2420] font-mono">
                    {formatCOP(service.price)}
                  </div>
                  <p className="text-xs text-[#5A4A43] leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Card Footer: Duration & CTA */}
              <div className="pt-3 border-t border-[#C6BDAC]/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#5A4A43] text-xs">
                  <span className="material-symbols-outlined text-[16px] text-[#2B2420]">
                    schedule
                  </span>
                  <span>{service.durationMinutes} min</span>
                </div>

                <button
                  onClick={() => onQuickBook(service)}
                  className="px-4 py-2 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs font-semibold transition-all duration-200 active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C6BDAC] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BB9C87]" />
            <h3 className="text-xl sm:text-2xl text-[#2B2420] font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Especialistas del Santuario
            </h3>
          </div>
          <span className="text-xs sm:text-sm text-[#2B2420] font-medium">
            Equipo certificado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {specialists.map((specialist) => (
            <div
              key={specialist.id}
              onClick={() => onOpenSpecialist(specialist)}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC] hover:border-[#BB9C87]/40 cursor-pointer transition-all hover:bg-white shadow-2xs group"
            >
              <img
                src={specialist.avatar}
                alt={specialist.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-[#E8CFD3] group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                  {specialist.name}
                </h4>
                <p className="text-xs text-[#2B2420] font-semibold truncate">{specialist.role}</p>
                <div className="flex items-center gap-1 text-[11px] text-[#5A4A43] mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-[#c59b27] fill">star</span>
                  <span className="font-bold text-[#2B2420]">{specialist.rating}</span>
                  <span>({specialist.reviewsCount})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spa Footer & Privacy / Cookie Links */}
      <footer className="pt-6 pb-2 text-center text-xs text-[#5A4A43] space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#5A4A43]">
          <button
            type="button"
            onClick={onOpenCookieSettings}
            className="hover:text-[#2B2420] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#2B2420]">cookie</span>
            <span>Configuración de Cookies</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenCookiePolicy}
            className="hover:text-[#2B2420] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#2B2420]">policy</span>
            <span>Política de Cookies &amp; Privacidad</span>
          </button>
          <span>•</span>
          <span className="text-[#5A4A43]">{BUSINESS_CONFIG.branchName} · {BUSINESS_CONFIG.city}</span>
        </div>
        <p className="text-[11px] text-[#5A4A43]">
          © {new Date().getFullYear()} {BUSINESS_CONFIG.brandName}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};
