import React from 'react';
import { formatCOP } from '../../../utils/format';
import { formatDisplayDate } from '../../../utils/dateAndId';
import { downloadCsv } from '../../../utils/exportCsv';

export interface SpecialistLiquidationItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  phone?: string;
  telefono?: string;
  commissionRate: number;
  cutsCount: number;
  totalServices: number;
  totalCommission: number;
  totalTips: number;
  payoutTotal: number;
}

interface AdminCortesTabProps {
  specialistsLiquidation: SpecialistLiquidationItem[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  branchName: string;
  registeredBy: string;
  onSendSpecialistLiquidation: (spec: SpecialistLiquidationItem) => void;
}

export const AdminCortesTab: React.FC<AdminCortesTabProps> = ({
  specialistsLiquidation,
  selectedDate,
  setSelectedDate,
  branchName,
  registeredBy,
  onSendSpecialistLiquidation
}) => {
  const handleExportCsv = () => {
    const rows: (string | number)[][] = [
      ['REPORTE DE LIQUIDACIÓN DE ESPECIALISTAS'],
      ['Sede', branchName],
      ['Fecha', formatDisplayDate(selectedDate)],
      ['Generado Por', registeredBy],
      [''],
      ['Especialista', 'Rol', '% Comisión', 'Servicios Realizados', 'Total Facturado (COP)', 'Comisión a Pagar (COP)', 'Propinas (COP)', 'TOTAL A LIQUIDAR (COP)', 'Teléfono']
    ];

    specialistsLiquidation.forEach((spec) => {
      rows.push([
        spec.name,
        spec.role,
        `${spec.commissionRate}%`,
        spec.cutsCount,
        spec.totalServices,
        spec.totalCommission,
        spec.totalTips,
        spec.payoutTotal,
        spec.telefono || spec.phone || ''
      ]);
    });

    const totalGeneral = specialistsLiquidation.reduce((acc, s) => acc + s.payoutTotal, 0);
    const totalServicios = specialistsLiquidation.reduce((acc, s) => acc + s.totalServices, 0);
    const totalComisiones = specialistsLiquidation.reduce((acc, s) => acc + s.totalCommission, 0);
    const totalPropinas = specialistsLiquidation.reduce((acc, s) => acc + s.totalTips, 0);

    rows.push(['']);
    rows.push(['TOTALES GENERALES', '', '', '', totalServicios, totalComisiones, totalPropinas, totalGeneral, '']);

    downloadCsv(`liquidacion_${selectedDate}_${branchName.toLowerCase().replace(/\s+/g, '_')}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-4 border border-[#C6BDAC]/60 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
            Liquidación Diaria de Especialistas
          </h3>
          <p className="text-xs text-[#5A4A43]">
            Jornada del {formatDisplayDate(selectedDate)} · Comisiones calculadas automáticamente + propinas directas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#C6BDAC] text-xs font-medium text-[#2B2420] bg-[#F4EFE9]"
          />
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-2xl bg-white border border-[#C6BDAC] hover:bg-[#F4EFE9] text-[#2B2420] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-700">download</span>
            <span>Exportar a Excel (CSV)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {specialistsLiquidation.map((spec) => (
          <div
            key={spec.id}
            className="bg-white rounded-3xl p-5 border border-[#C6BDAC]/60 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <img loading="lazy" decoding="async"
                  src={spec.avatar}
                  alt={spec.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#2B2420]/30"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                    {spec.name}
                  </h4>
                  <p className="text-xs text-[#2B2420] font-medium">
                    {spec.role} · {spec.commissionRate}% comisión
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {formatCOP(spec.payoutTotal)}
                  </span>
                  <span className="block text-[10px] text-[#5A4A43]">A Liquidar</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#C6BDAC] grid grid-cols-3 gap-1 text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#5A4A43] block">Servicios ({spec.cutsCount}):</span>
                  <strong className="text-[#2B2420] font-mono">{formatCOP(spec.totalServices)}</strong>
                </div>
                <div className="border-x border-[#C6BDAC]">
                  <span className="text-[10px] text-[#5A4A43] block">Comisión:</span>
                  <strong className="text-[#2B2420] font-mono">{formatCOP(spec.totalCommission)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#5A4A43] block">Propinas:</span>
                  <strong className="text-emerald-700 font-mono">+{formatCOP(spec.totalTips)}</strong>
                </div>
              </div>
            </div>

            {/* 1-CLIC SPECIALIST LIQUIDATION DISPATCH VIA WHATSAPP */}
            <div className="pt-3 border-t border-[#C6BDAC]">
              <button
                onClick={() => onSendSpecialistLiquidation(spec)}
                className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">send</span>
                <span>Enviar Liquidación al WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
