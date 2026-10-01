import React from 'react';
import { formatCOP } from '../../../utils/format';

export interface SpecialistLiquidationItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  commissionRate: number;
  cutsCount: number;
  totalServices: number;
  totalCommission: number;
  totalTips: number;
  payoutTotal: number;
}

interface AdminCortesTabProps {
  specialistsLiquidation: SpecialistLiquidationItem[];
  onSendSpecialistLiquidation: (spec: SpecialistLiquidationItem) => void;
}

export const AdminCortesTab: React.FC<AdminCortesTabProps> = ({
  specialistsLiquidation,
  onSendSpecialistLiquidation
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
            Liquidación Diaria de Especialistas
          </h3>
          <p className="text-xs text-[#644E53]">
            Comisiones calculadas automáticamente según el porcentaje pactado + propinas directas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {specialistsLiquidation.map((spec) => (
          <div
            key={spec.id}
            className="bg-white rounded-3xl p-5 border border-[#EAD6D9]/60 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <img
                  src={spec.avatar}
                  alt={spec.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#64444B]/30"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                    {spec.name}
                  </h4>
                  <p className="text-xs text-[#64444B] font-medium">
                    {spec.role} · {spec.commissionRate}% comisión
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {formatCOP(spec.payoutTotal)}
                  </span>
                  <span className="block text-[10px] text-[#7D676B]">A Liquidar</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#ebe8e2] grid grid-cols-3 gap-1 text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#7D676B] block">Servicios ({spec.cutsCount}):</span>
                  <strong className="text-[#1F1417] font-mono">{formatCOP(spec.totalServices)}</strong>
                </div>
                <div className="border-x border-[#ebe8e2]">
                  <span className="text-[10px] text-[#7D676B] block">Comisión:</span>
                  <strong className="text-[#64444B] font-mono">{formatCOP(spec.totalCommission)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7D676B] block">Propinas:</span>
                  <strong className="text-emerald-700 font-mono">+{formatCOP(spec.totalTips)}</strong>
                </div>
              </div>
            </div>

            {/* 1-CLIC SPECIALIST LIQUIDATION DISPATCH VIA WHATSAPP */}
            <div className="pt-3 border-t border-[#ebe8e2]">
              <button
                onClick={() => onSendSpecialistLiquidation(spec)}
                className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">send</span>
                <span>Enviar Liquidación por WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
