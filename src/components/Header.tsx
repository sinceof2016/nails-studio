import React from 'react';
import { BrandLogo } from './BrandLogo';
import { AppNotification, SystemUser, AppTab } from '../types';
import { BUSINESS_CONFIG } from '../config/businessConfig';

interface HeaderProps {
  currentTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  currentUser: SystemUser | null;
  onOpenLogin: () => void;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  activeAppointmentsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onOpenLogin,
  activeAppointmentsCount = 0
}) => {
  // Build permitted tabs according to user privileges
  const isSuperAdmin = currentUser?.rol === 'SuperAdmin';
  const isAdmin = currentUser?.rol === 'Administrador' || isSuperAdmin;
  const isCaja = currentUser?.rol === 'Caja';

  const allTabs: { id: AppTab; label: string; icon: string; badge?: number; minRole: 'public' | 'caja' | 'admin' | 'superadmin' }[] = [
    { id: 'reservar', label: 'Reservar Turno', icon: 'calendar_month', minRole: 'public' },
    { id: 'servicios', label: 'Servicios & Carta', icon: 'spa', minRole: 'public' },
    { id: 'especialistas', label: 'Especialistas', icon: 'face', minRole: 'public' },
    {
      id: 'agenda',
      label: 'Libro de Citas',
      icon: 'event',
      minRole: 'caja',
      badge: activeAppointmentsCount > 0 ? activeAppointmentsCount : undefined
    },
    { id: 'cobro', label: 'Registrar Cobro', icon: 'point_of_sale', minRole: 'caja' },
    { id: 'liquidaciones', label: 'Liquidación', icon: 'receipt_long', minRole: 'admin' },
    { id: 'caja', label: 'Caja & Arqueo', icon: 'account_balance_wallet', minRole: 'caja' },
    { id: 'clientes', label: 'Directorio Clientes', icon: 'groups', minRole: 'caja' },
    { id: 'usuarios', label: 'Usuarios', icon: 'manage_accounts', minRole: 'superadmin' },
    { id: 'api', label: 'Consola API', icon: 'terminal', minRole: 'superadmin' }
  ];

  const visibleTabs = allTabs.filter((tab) => {
    if (tab.minRole === 'public') return true;
    if (!currentUser) return false; // Public user cannot see any admin tabs
    if (tab.minRole === 'superadmin') return Boolean(isSuperAdmin || currentUser.puedeVerUsuarios || currentUser.puedeVerApi);
    if (tab.minRole === 'admin') return isAdmin;
    if (tab.minRole === 'caja') return isCaja || isAdmin;
    return false;
  });

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'servicios':
        return 'Servicios & Carta';
      case 'reservar':
        return 'Reserva de Turno';
      case 'especialistas':
        return 'Maestras & Especialistas';
      case 'agenda':
        return 'Libro Maestro de Turnos';
      case 'cobro':
        return 'Registrar Servicio en Caja';
      case 'liquidaciones':
        return 'Liquidación & Comisiones';
      case 'caja':
        return 'Caja & Arqueo del Día';
      case 'clientes':
        return 'Directorio de Clientes';
      case 'usuarios':
        return 'Gestión de Usuarios del Sistema';
      case 'api':
        return 'Consola de API REST';
      case '404':
        return 'Página No Encontrada (404)';
      default:
        return BUSINESS_CONFIG.brandName;
    }
  };

  return (
    <>
      <header className="sticky top-0 w-full z-40 bg-[#F4EFE9]/95 backdrop-blur-xl border-b border-[#C6BDAC]/70 shadow-[0_1px_8px_rgba(44,29,17,0.04)]">
        {/* Main Header Top Row */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Logo & Dynamic Brand Header */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0 group select-none"
              onClick={() => onNavigate('reservar')}
            >
              <BrandLogo className="h-11 sm:h-12 w-11 sm:w-12 rounded-full object-cover shrink-0 border border-[#C6BDAC] group-hover:scale-105 transition-transform" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-[11px] tracking-widest uppercase font-bold text-[#2B2420] truncate font-['Plus_Jakarta_Sans',sans-serif]">
                  {BUSINESS_CONFIG.brandName}
                </span>
                <h1 className="text-sm sm:text-base text-[#2B2420] font-bold leading-tight font-['Plus_Jakarta_Sans',sans-serif] truncate">
                  {getSectionTitle()}
                </h1>
              </div>
            </div>

            {/* Right Status Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Exact User Profile Pill matching uploaded image */}
              {currentUser ? (
                <div
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 sm:gap-2.5 bg-[#C6BDAC]/40 hover:bg-[#C6BDAC]/50 pl-2 pr-2.5 sm:pr-3 py-1.5 rounded-full border border-[#C6BDAC] shadow-xs cursor-pointer select-none transition-all group"
                  title="Haz clic para cambiar de usuario o cerrar sesión"
                >
                  <img
                    alt={currentUser.nombre}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-[#918380] shrink-0"
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                  />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] leading-tight truncate max-w-[110px] sm:max-w-[140px]">
                      {currentUser.nombre}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#2B2420] font-bold tracking-wider uppercase leading-none mt-0.5">
                      ★ {currentUser.rol}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#5A4A43] text-[18px] group-hover:text-[#2B2420] group-hover:translate-x-0.5 transition-transform ml-0.5">
                    logout
                  </span>
                </div>
              ) : (
                /* Public user login button */
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs font-semibold px-3 sm:px-4 py-2 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1.5 tracking-wider cursor-pointer font-sans"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span className="hidden sm:inline">Acceso Maestro</span>
                  <span className="sm:hidden">Ingresar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subnav Navigation Bar: Fully Coupled Tabs identical to GitHub */}
        <div className="border-t border-[#C6BDAC]/60 bg-[#F4EFE9]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
              {visibleTabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavigate(tab.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 font-['Plus_Jakarta_Sans',sans-serif] ${
                      isActive
                        ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs font-bold'
                        : 'bg-[#C6BDAC]/40/70 hover:bg-[#C6BDAC]/40 text-[#5A4A43] hover:text-[#2B2420] border border-[#C6BDAC]/60'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isActive ? 'fill' : ''}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-white text-[#2B2420]'
                            : 'bg-[#BB9C87] text-[#2B2420] font-bold'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
};
