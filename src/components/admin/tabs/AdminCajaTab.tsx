import React from 'react';
import { SalonCutRecord } from '../../../types';
import { formatCOP } from '../../../utils/format';
import { formatDisplayDate } from '../../../utils/dateAndId';
import { downloadCsv } from '../../../utils/exportCsv';

interface AdminCajaTabProps {
  cuts: SalonCutRecord[];
  allExpenses?: Array<{ id: string; fecha: string; concepto: string; categoria: string; monto: number; registradoPor?: string }>;
  cashBase: number;
  totalCashIncome: number;
  totalExpensesAmount: number;
  expectedCashInHand: number;
  totalDigitalIncome: number;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  branchName: string;
  registeredBy: string;
  onOpenNewCutModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenCloseModal: () => void;
  canVoidCut?: boolean;
  onVoidCut?: (cut: SalonCutRecord) => void;
}

export const AdminCajaTab: React.FC<AdminCajaTabProps> = ({
  cuts,
  allExpenses = [],
  cashBase,
  totalCashIncome,
  totalExpensesAmount,
  expectedCashInHand,
  totalDigitalIncome,
  selectedDate,
  setSelectedDate,
  branchName,
  registeredBy,
  onOpenNewCutModal,
  onOpenExpenseModal,
  onOpenCloseModal,
  canVoidCut = false,
  onVoidCut
}) => {
  const handleExportCsv = () => {
    const rows: (string | number)[][] = [
      ['REPORTE DE CAJA Y ARQUEO DIARIO'],
      ['Sede', branchName],
      ['Fecha', formatDisplayDate(selectedDate)],
      ['Generado Por', registeredBy],
      [''],
      ['RESUMEN DE CAJA', 'MONTO (COP)'],
      ['Base Inicial en Caja', cashBase],
      ['(+) Entradas Efectivo', totalCashIncome],
      ['(-) Gastos Caja Menor', totalExpensesAmount],
      ['(=) Efectivo Esperado en Gaveta', expectedCashInHand],
      ['Entradas Digitales (Nequi / Daviplata / Datáfono)', totalDigitalIncome],
      ['Total General Facturado (Efectivo + Digital)', totalCashIncome + totalDigitalIncome],
      [''],
      ['DETALLE DE COBROS DE LA JORNADA'],
      ['Hora', 'Clienta', 'Teléfono', 'Servicio', 'Especialista', 'Método de Pago', 'Precio Servicio', 'Propina', 'Total Cobrado', 'Monto Efectivo', 'Monto Digital', 'Canal Digital', 'Nota / Ref']
    ];

    cuts.forEach((cut) => {
      rows.push([
        cut.hora,
        cut.clienteNombre,
        cut.clienteTelefono || '',
        cut.servicioNombre,
        cut.especialistaNombre,
        cut.metodoPago,
        cut.servicioPrecio,
        cut.propina,
        cut.servicioPrecio + cut.propina,
        cut.montoEfectivo ?? (cut.metodoPago === 'efectivo' ? cut.servicioPrecio + cut.propina : 0),
        cut.montoDigital ?? (cut.metodoPago !== 'efectivo' && cut.metodoPago !== 'mixto' ? cut.servicioPrecio + cut.propina : 0),
        cut.digitalMethod || (cut.metodoPago !== 'efectivo' ? cut.metodoPago : ''),
        cut.nota || ''
      ]);
    });

    rows.push(['']);
    rows.push(['DETALLE DE GASTOS Y EGRESOS DE CAJA MENOR']);
    rows.push(['ID', 'Concepto', 'Categoría', 'Monto (COP)', 'Registrado Por']);

    allExpenses.forEach((exp) => {
      rows.push([
        exp.id,
        exp.concepto,
        exp.categoria,
        exp.monto,
        exp.registradoPor || registeredBy
      ]);
    });

    downloadCsv(`caja_${selectedDate}_${branchName.toLowerCase().replace(/\s+/g, '_')}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      {/* Selector de fecha y botón de exportar */}
      <div className="bg-white rounded-3xl p-4 border border-[#C6BDAC]/60 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5A4A43] text-[20px]">calendar_today</span>
          <label className="text-xs font-bold text-[#2B2420] whitespace-nowrap">Fecha de Jornada:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#C6BDAC] text-xs font-medium text-[#2B2420] bg-[#F4EFE9]"
          />
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-2xl bg-white border border-[#C6BDAC] hover:bg-[#F4EFE9] text-[#2B2420] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-700">download</span>
          <span>Exportar a Excel (CSV)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={onOpenNewCutModal}
          className="p-4 rounded-3xl bg-[#BB9C87] text-[#2B2420] font-bold text-xs shadow-xs hover:bg-[#AA8A74] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>+ Registrar Cobro (Efectivo / Mixto)</span>
        </button>

        <button
          onClick={onOpenExpenseModal}
          className="p-4 rounded-3xl bg-white border border-rose-300 text-[#ba1a1a] text-xs font-bold shadow-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">remove_circle_outline</span>
          <span>- Gasto de Caja Menor</span>
        </button>

        <button
          onClick={onOpenCloseModal}
          className="p-4 rounded-3xl bg-white border border-emerald-400 text-emerald-800 text-xs font-bold shadow-xs hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">lock_clock</span>
          <span>Arqueo &amp; Cierre de Caja</span>
        </button>
      </div>

      {/* Arqueo de Canales Dashboard in COP */}
      <div className="bg-white rounded-3xl p-6 border border-[#C6BDAC]/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#C6BDAC] pb-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B2420] text-[20px]">account_balance_wallet</span>
            Arqueo de Caja &amp; Gaveta Física ({formatDisplayDate(selectedDate)})
          </h4>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {cuts.length} {cuts.length === 1 ? 'Cobro' : 'Cobros'} Hoy
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]">
            <span className="text-[10px] text-[#5A4A43] block font-semibold">Base Inicial en Caja:</span>
            <strong className="text-base text-[#2B2420] font-bold font-mono">{formatCOP(cashBase)}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]">
            <span className="text-[10px] text-[#5A4A43] block font-semibold">(+) Entradas Efectivo:</span>
            <strong className="text-base text-emerald-700 font-bold font-mono">+{formatCOP(totalCashIncome)}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]">
            <span className="text-[10px] text-[#5A4A43] block font-semibold">(-) Gastos Caja Menor:</span>
            <strong className="text-base text-[#ba1a1a] font-bold font-mono">-{formatCOP(totalExpensesAmount)}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#C6BDAC]/40 border border-[#918380]">
            <span className="text-[10px] text-[#2B2420] font-semibold block">Efectivo en Gaveta:</span>
            <strong className={`text-base font-bold font-mono ${expectedCashInHand < 0 ? 'text-rose-700' : 'text-[#2B2420]'}`}>
              {formatCOP(expectedCashInHand)}
            </strong>
          </div>
        </div>

        <div className="pt-3 border-t border-[#C6BDAC] flex items-center justify-between text-xs">
          <span className="text-[#5A4A43] font-medium">Entradas Digitales (Nequi / Daviplata / Datáfono):</span>
          <strong className="text-[#2B2420] font-mono text-sm font-bold">{formatCOP(totalDigitalIncome)}</strong>
        </div>
      </div>

      {/* Historial de Cobros Registrados */}
      <div className="bg-white rounded-3xl p-6 border border-[#C6BDAC]/60 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
          Registro de Cobros de la Jornada ({cuts.length})
        </h4>

        {cuts.length === 0 ? (
          <p className="text-xs text-[#5A4A43] text-center py-6">
            No hay cobros registrados en la fecha seleccionada ({formatDisplayDate(selectedDate)}).
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#C6BDAC]/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4EFE9] text-[#5A4A43] font-semibold border-b border-[#C6BDAC]/60">
                <tr>
                  <th className="p-3">Hora</th>
                  <th className="p-3">Clienta</th>
                  <th className="p-3">Servicio</th>
                  <th className="p-3">Especialista</th>
                  <th className="p-3">Método</th>
                  <th className="p-3 text-right">Total Cobrado</th>
                  {canVoidCut && onVoidCut && <th className="p-3 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C6BDAC]/40 bg-white">
                {cuts.map((cut) => (
                  <tr key={cut.id} className="hover:bg-[#F4EFE9]/50 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-[#5A4A43]">
                      {cut.hora}
                    </td>
                    <td className="p-3 font-semibold text-[#2B2420]">{cut.clienteNombre}</td>
                    <td className="p-3 text-[#5A4A43]">{cut.servicioNombre}</td>
                    <td className="p-3 text-[#2B2420]">{cut.especialistaNombre}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cut.metodoPago === 'efectivo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cut.metodoPago === 'mixto'
                            ? 'bg-[#BB9C87]/15 text-[#2B2420]'
                            : 'bg-[#C6BDAC]/30 text-[#2B2420] border border-[#C6BDAC]/60'
                        }`}
                      >
                        {cut.metodoPago === 'efectivo' && 'Efectivo'}
                        {cut.metodoPago === 'nequi_daviplata' && 'Nequi / Davi'}
                        {cut.metodoPago === 'tarjeta_datafono' && 'Datáfono'}
                        {cut.metodoPago === 'mixto' && 'Pago Mixto'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#2B2420]">
                      {formatCOP(cut.servicioPrecio + cut.propina)}
                    </td>
                    {canVoidCut && onVoidCut && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onVoidCut(cut)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Anular cobro"
                        >
                          <span className="material-symbols-outlined text-[13px]">delete</span>
                          <span>Anular</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
