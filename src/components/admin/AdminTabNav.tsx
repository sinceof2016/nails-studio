import React from 'react';

export interface AdminTabNavProps {
  activeAdminTab: 'agenda' | 'caja' | 'cortes' | 'clientes';
  onSelectTab: (tab: 'agenda' | 'caja' | 'cortes' | 'clientes') => void;
  isCajaRole: boolean;
  totalCount: number;
  clientProfilesCount: number;
  onOpenUltraMsgModal: () => void;
}

export const AdminTabNav: React.FC<AdminTabNavProps> = ({
  activeAdminTab,
  onSelectTab,
  isCajaRole,
  totalCount,
  clientProfilesCount,
  onOpenUltraMsgModal
}) => {
  return (
    <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-b border-[#C6BDAC]/70 pb-2">
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onSelectTab('agenda')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeAdminTab === 'agenda'
              ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
              : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]/70'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          <span>Agenda ({totalCount})</span>
        </button>

        <button
          onClick={() => onSelectTab('caja')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeAdminTab === 'caja'
              ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
              : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]/70'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
          <span>Caja &amp; Arqueo</span>
        </button>

        {!isCajaRole && (
          <button
            onClick={() => onSelectTab('cortes')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'cortes'
                ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]/70'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Liquidación</span>
          </button>
        )}

        <button
          onClick={() => onSelectTab('clientes')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeAdminTab === 'clientes'
              ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
              : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]/70'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">group</span>
          <span>Clientes ({clientProfilesCount})</span>
        </button>
      </div>

      <button
        onClick={onOpenUltraMsgModal}
        className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
        title="Configuración de Notificaciones Automáticas UltraMsg WhatsApp"
      >
        <span className="material-symbols-outlined text-[16px] text-emerald-600">bolt</span>
        <span>UltraMsg WhatsApp</span>
      </button>
    </div>
  );
};
