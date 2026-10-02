import React from 'react';

interface BottomNavProps {
  currentTab: 'servicios' | 'reservar' | 'admin';
  onNavigate: (tab: 'servicios' | 'reservar' | 'admin') => void;
  activeAppointmentsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  activeAppointmentsCount = 0
}) => {
  const tabs = [
    {
      id: 'servicios' as const,
      label: 'Servicios',
      icon: 'spa'
    },
    {
      id: 'reservar' as const,
      label: 'Reservar',
      icon: 'calendar_today'
    },
    {
      id: 'admin' as const,
      label: 'Panel Citas',
      icon: 'admin_panel_settings',
      badge: activeAppointmentsCount > 0 ? activeAppointmentsCount : undefined
    }
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 w-full z-40 bg-[#F4EFE9]/95 backdrop-blur-xl border-t border-[#C6BDAC]/30 shadow-[0_-4px_24px_rgba(232,180,184,0.2)]"
    >
      <div className="w-full max-w-lg mx-auto h-16 px-4 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center w-20 h-13 rounded-2xl transition-all duration-200 group relative cursor-pointer ${
                isActive
                  ? 'text-[#5A4A43] font-semibold'
                  : 'text-[#5A4A43] hover:text-[#5A4A43]'
              }`}
            >
              <div
                className={`w-11 h-7 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                  isActive
                    ? 'bg-[#C6BDAC]/40/40 scale-105'
                    : 'group-hover:bg-[#ebe8e2]/50'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform ${
                    isActive ? 'fill scale-105' : ''
                  }`}
                >
                  {tab.icon}
                </span>

                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7c5357] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-0.5 font-['Plus_Jakarta_Sans',sans-serif]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
