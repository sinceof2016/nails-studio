import React, { useState } from 'react';
import { LOGO_URL } from '../data/mockData';
import { AppNotification, SystemUser, AppTab } from '../types';

interface HeaderProps {
  currentTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  currentUser: SystemUser | null;
  onOpenLogin: () => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  activeAppointmentsCount?: number;
  onSyncGoogleCalendar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onOpenLogin,
  notifications,
  onMarkNotificationAsRead,
  activeAppointmentsCount = 0,
  onSyncGoogleCalendar
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => n.isUnread).length;

  // Build permitted tabs according to user privileges
  const isDavid = currentUser?.id === 'USR-DAVID-01' ||
    currentUser?.email?.toLowerCase().includes('david') ||
    currentUser?.email?.toLowerCase().includes('orjuela') ||
    currentUser?.nombre?.toLowerCase().includes('david orjuela');

  const isAdmin = currentUser?.rol === 'Administrador' || currentUser?.rol === 'SuperAdmin' || isDavid;
  const isCaja = currentUser?.rol === 'Caja';

  const allTabs: { id: AppTab; label: string; icon: string; badge?: number; minRole: 'public' | 'caja' | 'admin' | 'david' }[] = [
    { id: 'servicios', label: 'Servicios & Carta', icon: 'spa', minRole: 'public' },
    { id: 'reservar', label: 'Reservar Turno', icon: 'calendar_month', minRole: 'public' },
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
    { id: 'usuarios', label: 'Usuarios', icon: 'manage_accounts', minRole: 'david' }, // ONLY David
    { id: 'api', label: 'Consola API', icon: 'terminal', minRole: 'david' } // ONLY David / SuperAdmin with puedeVerApi
  ];

  const visibleTabs = allTabs.filter((tab) => {
    if (tab.minRole === 'public') return true;
    if (!currentUser) return false; // Public user cannot see any admin tabs
    if (tab.minRole === 'david') return isDavid;
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
      default:
        return 'Aura Nails & Spa';
    }
  };

  return (
    <>
      <header className="sticky top-0 w-full z-40 bg-[#FFF8F5]/95 backdrop-blur-xl border-b border-[#DFCBB5]/50 shadow-[0_1px_8px_rgba(44,29,17,0.05)]">
        {/* Main Header Top Row */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Logo & Dynamic Brand Header */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0 group select-none"
              onClick={() => onNavigate('servicios')}
            >
              <img
                alt="Aura Nails Boutique Logo"
                className="h-9 sm:h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
                src={LOGO_URL}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-[11px] tracking-widest uppercase font-bold text-[#7C571C] truncate font-['Plus_Jakarta_Sans',sans-serif]">
                  Aura Nails &amp; Spa
                </span>
                <h1 className="text-sm sm:text-base text-[#221A14] font-bold leading-tight font-['Plus_Jakarta_Sans',sans-serif] truncate">
                  {getSectionTitle()}
                </h1>
              </div>
            </div>

            {/* Right Status Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Google Calendar Quick Icon Button */}
              <button
                type="button"
                onClick={onSyncGoogleCalendar}
                className="w-10 h-10 rounded-full bg-[#FBEBE1] hover:bg-[#F4DCC7] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5] transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                title="Sincronizar con Google Calendar"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </button>

              {/* Exact User Profile Pill matching uploaded image */}
              {currentUser ? (
                <div
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 sm:gap-2.5 bg-[#FBEBE1] hover:bg-[#F4DCC7] pl-2 pr-2.5 sm:pr-3 py-1.5 rounded-full border border-[#DFCBB5] shadow-xs cursor-pointer select-none transition-all group"
                  title="Haz clic para cambiar de usuario o cerrar sesión"
                >
                  <img
                    alt={currentUser.nombre}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-[#C49756] shrink-0"
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                  />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif] leading-tight truncate max-w-[110px] sm:max-w-[140px]">
                      {currentUser.nombre}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#7C571C] font-bold tracking-wider uppercase leading-none mt-0.5">
                      ★ {currentUser.rol}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#6F5A4B] text-[18px] group-hover:text-[#221A14] group-hover:translate-x-0.5 transition-transform ml-0.5">
                    logout
                  </span>
                </div>
              ) : (
                /* Public user login button */
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="bg-[#7C571C] hover:bg-[#684714] text-[#FFFFFF] text-xs font-semibold px-3 sm:px-4 py-2 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1.5 tracking-wider cursor-pointer font-sans"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span className="hidden sm:inline">Acceso Maestro</span>
                  <span className="sm:hidden">Ingresar</span>
                </button>
              )}

              {/* Notifications Button */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 rounded-full bg-[#FBEBE1] hover:bg-[#F4DCC7] border border-[#DFCBB5] flex items-center justify-center text-[#6F5A4B] transition-colors cursor-pointer shadow-2xs"
                title="Notificaciones"
                aria-label="Ver notificaciones"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7C571C] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Subnav Navigation Bar: Fully Coupled Tabs identical to GitHub */}
        <div className="border-t border-[#DFCBB5]/50 bg-[#FFF8F5]">
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
                        ? 'bg-[#7C571C] text-white shadow-xs font-bold'
                        : 'bg-[#FBEBE1]/70 hover:bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5]/60'
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
                            ? 'bg-white text-[#7C571C]'
                            : 'bg-[#7C571C] text-white'
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

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setShowNotifications(false)}
          />
          <div className="relative w-full max-w-sm bg-[#FFF8F5] h-full shadow-2xl flex flex-col z-10 border-l border-[#DFCBB5] animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-[#DFCBB5]/50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7C571C] text-[20px]">
                  notifications
                </span>
                <h3 className="font-semibold text-base text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
                  Novedades del Salón
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#FBEBE1] text-[#7C571C] font-bold">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#6F5A4B] cursor-pointer"
                aria-label="Cerrar notificaciones"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-[#6F5A4B] text-sm">
                  No tienes notificaciones pendientes.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => onMarkNotificationAsRead(notif.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      notif.isUnread
                        ? 'bg-white border-[#C49756] shadow-sm'
                        : 'bg-[#FBEBE1]/40 border-[#DFCBB5] text-[#6F5A4B]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-xs font-semibold ${notif.isUnread ? 'text-[#221A14]' : 'text-[#6F5A4B]'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-[#6F5A4B] whitespace-nowrap">
                        {notif.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-[#6F5A4B] mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.isUnread && (
                      <span className="inline-block mt-2 text-[10px] text-[#7C571C] font-semibold">
                        Marcar como leída
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
