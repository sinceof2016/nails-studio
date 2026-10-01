import React from 'react';
import { ClientProfile } from '../../../types';
import { formatCOP } from '../../../utils/format';

interface AdminClientesTabProps {
  clientProfiles: ClientProfile[];
  onSelectClientForHistory: (client: ClientProfile) => void;
}

export const AdminClientesTab: React.FC<AdminClientesTabProps> = ({
  clientProfiles,
  onSelectClientForHistory
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
          Directorio de Clientes ({clientProfiles.length})
        </h3>
        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          100% Verificados
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientProfiles.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-3xl p-5 border border-[#EAD6D9]/60 shadow-xs space-y-3 flex flex-col justify-between hover:border-[#64444B]/50 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                    {client.nombre}
                  </h4>
                  <p className="text-xs text-[#644E53] flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-[#52b788]">call</span>
                    <span>{client.telefono}</span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    client.clasificacion === 'VIP Frecuente'
                      ? 'bg-[#ffdadc] text-[#7c5357]'
                      : 'bg-[#dce8dc] text-[#2d6a4f]'
                  }`}
                >
                  {client.clasificacion}
                </span>
              </div>

              <div className="pt-2 border-t border-[#ebe8e2] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#7D676B]">Total Visitas:</span>
                  <strong className="block text-[#1F1417]">{client.totalCitas} citas</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7D676B]">Inversión Total:</span>
                  <strong className="block text-[#64444B] font-mono">{formatCOP(client.gastoTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ebe8e2] flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectClientForHistory(client)}
                className="px-3.5 py-1.5 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span>Ver Citas</span>
              </button>

              <a
                href={`https://wa.me/${(client.telefono || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
