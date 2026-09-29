import React, { useState, useMemo } from 'react';
import { SERVICES } from '../data/mockData';
import { Service } from '../types';
import { formatCOP } from '../utils/format';

interface NotFoundScreenProps {
  onNavigateHome: () => void;
  onNavigateToBooking: () => void;
  onNavigateToSpecialists: () => void;
  onSelectService: (service: Service) => void;
}

type ScreenSimulationState = 'normal' | 'loading' | 'error' | 'empty';

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({
  onNavigateHome,
  onNavigateToBooking,
  onNavigateToSpecialists,
  onSelectService
}) => {
  // State for simulated preview / testing
  const [screenState, setScreenState] = useState<ScreenSimulationState>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  // Filter recommendations based on search
  const filteredServices = useMemo(() => {
    if (screenState === 'empty') return [];
    if (!searchQuery.trim()) return SERVICES.slice(0, 3);
    return SERVICES.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, screenState]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      setScreenState('normal');
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-6 sm:py-10 px-4 animate-in fade-in duration-200">
      
      {/* Simulation / State Switcher Toolbar */}
      <div className="bg-[#FAF4F5] border border-[#EAD6D9] rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#64444B]">tune</span>
          <span className="text-[11px] font-bold text-[#1F1417]">
            Modos de Pantalla 404:
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setScreenState('normal')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-xl transition-all cursor-pointer ${
              screenState === 'normal'
                ? 'bg-[#64444B] text-white shadow-2xs'
                : 'text-[#644E53] hover:bg-[#F6E3E6]'
            }`}
          >
            Normal (404)
          </button>

          <button
            onClick={() => setScreenState('loading')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              screenState === 'loading'
                ? 'bg-[#64444B] text-white shadow-2xs'
                : 'text-[#644E53] hover:bg-[#F6E3E6]'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
            <span>Cargando</span>
          </button>

          <button
            onClick={() => setScreenState('error')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              screenState === 'error'
                ? 'bg-[#ba1a1a] text-white shadow-2xs'
                : 'text-[#ba1a1a] hover:bg-rose-50'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">warning</span>
            <span>Error</span>
          </button>

          <button
            onClick={() => setScreenState('empty')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              screenState === 'empty'
                ? 'bg-[#64444B] text-white shadow-2xs'
                : 'text-[#644E53] hover:bg-[#F6E3E6]'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">folder_off</span>
            <span>Vacío</span>
          </button>
        </div>
      </div>

      {/* 1. ESTADO DE CARGA (LOADING STATE) */}
      {screenState === 'loading' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Skeleton Hero */}
          <div className="relative rounded-3xl bg-white border border-[#EAD6D9]/60 p-8 sm:p-14 text-center overflow-hidden">
            <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
              {/* Spinner & Brand Pulse */}
              <div className="relative w-16 h-16 rounded-full bg-[#F6E3E6] flex items-center justify-center text-[#64444B]">
                <div className="absolute inset-0 rounded-full border-2 border-[#64444B]/30 border-t-[#64444B] animate-spin" />
                <span className="material-symbols-outlined text-[28px] animate-pulse">spa</span>
              </div>

              <div className="space-y-2 w-full">
                <div className="h-3 w-40 bg-[#F6E3E6] rounded-full mx-auto animate-pulse" />
                <div className="h-10 w-32 bg-[#F6E3E6] rounded-2xl mx-auto animate-pulse" />
                <div className="h-4 w-64 bg-[#F6E3E6] rounded-full mx-auto animate-pulse" />
                <div className="h-3 w-80 bg-[#F6E3E6] rounded-full mx-auto animate-pulse" />
              </div>

              {/* Skeleton Buttons */}
              <div className="flex gap-3 w-full pt-4">
                <div className="h-11 flex-1 bg-[#F6E3E6] rounded-full animate-pulse" />
                <div className="h-11 flex-1 bg-[#F6E3E6] rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Skeleton Treatment Cards */}
          <div className="space-y-4">
            <div className="h-4 w-52 bg-[#F6E3E6] rounded-full animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-4 border border-[#EAD6D9]/50 space-y-3">
                  <div className="aspect-video w-full rounded-2xl bg-[#F6E3E6] animate-pulse" />
                  <div className="h-4 w-3/4 bg-[#F6E3E6] rounded-full animate-pulse" />
                  <div className="h-3 w-full bg-[#F6E3E6] rounded-full animate-pulse" />
                  <div className="h-3 w-1/2 bg-[#F6E3E6] rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ESTADO DE ERROR (ERROR STATE) */}
      {screenState === 'error' && (
        <div className="rounded-3xl bg-rose-50/70 border border-rose-200/80 p-8 sm:p-12 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-2xs">
            <span className="material-symbols-outlined text-[32px]">cloud_off</span>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="text-[11px] font-bold tracking-widest uppercase text-rose-700">
              Error de Comunicación
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-rose-950 font-['Plus_Jakarta_Sans',sans-serif]">
              No pudimos conectar con el catálogo de tratamientos
            </h3>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              Ocurrió un problema temporal al consultar la disponibilidad del Santuario. Tus reservas y datos anteriores están seguros.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="py-3 px-6 rounded-full bg-[#ba1a1a] hover:bg-rose-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[17px] ${isRetrying ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isRetrying ? 'Reconectando...' : 'Reintentar Carga'}</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="py-3 px-6 rounded-full bg-white hover:bg-rose-100/50 border border-rose-300 text-rose-900 text-xs font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">home</span>
              <span>Volver al Inicio</span>
            </button>
          </div>

          <p className="text-[11px] text-rose-600/80">
            Código de error: ERR_CATALOG_UNAVAILABLE · Sede Chicó Calle 85
          </p>
        </div>
      )}

      {/* 3. VISTA 404 NORMAL / ESTÁNDAR O VACÍO */}
      {(screenState === 'normal' || screenState === 'empty') && (
        <>
          {/* Hero 404 Section */}
          <div className="relative rounded-3xl bg-gradient-to-b from-[#FAF4F5] via-white to-[#F6E3E6]/40 border border-[#EAD6D9]/70 p-8 sm:p-14 text-center overflow-hidden shadow-xs">
            {/* Decorative ambient aura glows */}
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-[#E8B4B8]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-[#C5838D]/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#F6E3E6] border border-[#EAD6D9] flex items-center justify-center text-[#64444B] mb-4 shadow-2xs">
                <span className="material-symbols-outlined text-[32px]">spa</span>
              </div>

              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#64444B] font-['Plus_Jakarta_Sans',sans-serif] mb-1">
                Error 404 · Santuario No Localizado
              </span>

              <h2 className="text-6xl sm:text-8xl font-black font-['Plus_Jakarta_Sans',sans-serif] tracking-tight text-[#1F1417] select-none my-2">
                <span className="bg-gradient-to-r from-[#1F1417] via-[#64444B] to-[#C5838D] bg-clip-text text-transparent">
                  404
                </span>
              </h2>

              <h3 className="text-lg sm:text-2xl font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] max-w-lg mx-auto leading-snug">
                Esta página se ha retirado para un nuevo esmaltado
              </h3>

              <p className="text-xs sm:text-sm text-[#644E53] max-w-md mx-auto mt-3 leading-relaxed">
                La dirección que buscas no existe o fue trasladada. En La Pelu SPA cuidamos cada detalle: te ayudamos a regresar al santuario para que disfrutes de tu momento de cuidado personal.
              </p>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-6 w-full max-w-md">
                <button
                  onClick={onNavigateHome}
                  className="flex-1 min-w-[160px] py-3.5 px-5 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                  <span>Ir a la Carta de Servicios</span>
                </button>

                <button
                  onClick={onNavigateToBooking}
                  className="flex-1 min-w-[160px] py-3.5 px-5 rounded-full bg-white hover:bg-[#F6E3E6] border border-[#EAD6D9] text-[#1F1417] text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#64444B]">calendar_month</span>
                  <span>Agendar Cita Online</span>
                </button>
              </div>

              <button
                onClick={onNavigateToSpecialists}
                className="mt-4 text-xs font-semibold text-[#64444B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Conoce a nuestras Especialistas &amp; Artistas</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Section: Treatments or Empty Content State */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                  Tratamientos sugeridos en Sede Chicó Calle 85
                </h4>
                <p className="text-xs text-[#644E53]">
                  Explora las opciones preferidas por nuestras clientas en Bogotá
                </p>
              </div>

              {/* Search Bar for Recommendations */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#7D676B] text-[17px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (screenState === 'empty') setScreenState('normal');
                  }}
                  placeholder="Buscar tratamiento..."
                  className="w-full h-9 pl-9 pr-8 rounded-full bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-1 focus:ring-[#64444B]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#7D676B] hover:text-[#1F1417]"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* EMPTY STATE */}
            {filteredServices.length === 0 ? (
              <div className="rounded-3xl bg-white border border-[#EAD6D9]/70 p-8 sm:p-12 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-[#FAF4F5] border border-[#EAD6D9] flex items-center justify-center text-[#64444B] mx-auto shadow-2xs">
                  <span className="material-symbols-outlined text-[28px]">search_off</span>
                </div>

                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h5 className="font-bold text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                    No se encontraron tratamientos con esos criterios
                  </h5>
                  <p className="text-xs text-[#644E53]">
                    {searchQuery
                      ? `No hay coincidencias para "${searchQuery}". Revisa la ortografía o restablece la búsqueda.`
                      : 'Actualmente no hay tratamientos cargados en esta vista.'}
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setScreenState('normal');
                    }}
                    className="py-2.5 px-5 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    <span>Restablecer Filtros &amp; Ver Todo</span>
                  </button>
                </div>
              </div>
            ) : (
              /* GRID DE TARJETAS DE SERVICIO */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => onSelectService(service)}
                    className="group bg-white rounded-3xl p-4 border border-[#EAD6D9]/60 hover:border-[#64444B] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-[#F6E3E6]">
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-[#64444B] shadow-2xs">
                          {service.durationMinutes} min
                        </div>
                      </div>

                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[#1F1417] group-hover:text-[#64444B] transition-colors line-clamp-1 font-['Plus_Jakarta_Sans',sans-serif]">
                          {service.name}
                        </h5>
                        <p className="text-[11px] text-[#644E53] line-clamp-2 mt-1">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#EAD6D9]/40 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-[#7D676B] uppercase block">Precio en COP</span>
                        <span className="text-xs font-bold font-mono text-[#1F1417]">
                          {formatCOP(service.price)}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64444B] group-hover:translate-x-0.5 transition-transform">
                        <span>Reservar</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Boutique Help & WhatsApp Contact Banner */}
          <div className="rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#52b788]/20 border border-[#52b788]/40 flex items-center justify-center text-[#2d6a4f] shrink-0">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#1F1417]">
                  ¿Necesitas asistencia con tu reserva?
                </h5>
                <p className="text-[11px] text-[#644E53]">
                  Nuestro equipo de recepción Chicó está listo para atenderte por WhatsApp.
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/573128492011?text=Hola%20La%20Pelu%20SPA,%20estoy%20navegando%20en%20su%20web%20y%20deseo%20asistencia%20con%20una%20reserva"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#0b421a] font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">support_agent</span>
              <span>Contactar Recepción</span>
            </a>
          </div>
        </>
      )}

    </div>
  );
};
