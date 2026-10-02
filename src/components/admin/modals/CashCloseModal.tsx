import React from 'react';
import { formatCOP } from '../../../utils/format';

interface CashCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashBase: number;
  setCashBase: (amount: number) => void;
  expectedCashInHand: number;
  countedCash: number;
  setCountedCash: (amount: number) => void;
  onSaveClose: () => void;
  isSubmitting?: boolean;
}

export const CashCloseModal: React.FC<CashCloseModalProps> = ({
  isOpen,
  onClose,
  cashBase,
  setCashBase,
  expectedCashInHand,
  countedCash,
  setCountedCash,
  onSaveClose,
  isSubmitting = false
}) => {
  if (!isOpen) return null;

  const isExpectedNegative = expectedCashInHand < 0;
  const isCountedNegative = countedCash < 0;
  const diff = countedCash - expectedCashInHand;
  const isFormInvalid = isExpectedNegative || isCountedNegative || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-2">
          <h3 className="font-bold text-sm text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
            Arqueo &amp; Cierre de Caja del Día
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {isExpectedNegative && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">error</span>
              Efectivo esperado negativo ({formatCOP(expectedCashInHand)})
            </p>
            <p className="text-[11px] leading-relaxed">
              Los egresos superan la base y cobros en efectivo. Las reglas de seguridad de Firestore exigen que el efectivo esperado sea mayor o igual a $0 COP. Ajusta la base inicial o revisa los gastos antes de firmar el cierre.
            </p>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Base Inicial en Caja ($)</label>
            <input
              type="number"
              step="1000"
              min="0"
              disabled={isSubmitting}
              value={cashBase}
              onChange={(e) => setCashBase(Math.max(0, Number(e.target.value) || 0))}
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs font-mono font-bold text-[#2B2420]"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#C6BDAC]/20 border border-[#C6BDAC]/60 flex justify-between items-center text-[#5A4A43]">
            <span className="font-medium">Efectivo Esperado en Gaveta:</span>
            <strong className={`font-mono text-sm ${isExpectedNegative ? 'text-rose-700 font-bold' : 'text-[#2B2420]'}`}>
              {formatCOP(expectedCashInHand)}
            </strong>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Efectivo Físico Contado ($)</label>
            <input
              type="number"
              step="1000"
              min="0"
              disabled={isSubmitting}
              value={countedCash}
              onChange={(e) => setCountedCash(Math.max(0, Number(e.target.value) || 0))}
              className="w-full h-10 px-3 rounded-xl bg-white border border-[#C6BDAC] text-sm font-mono font-bold text-[#2B2420]"
            />
          </div>

          {/* Balance Badge */}
          {!isExpectedNegative && (
            <div
              className={`p-2.5 rounded-xl text-center font-bold text-xs ${
                Math.abs(diff) < 100
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : diff > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {Math.abs(diff) < 100 && '✓ Caja Cuadrada Perfecta ($0 de Diferencia)'}
              {diff >= 100 && `⚠ Sobrante en Caja: +${formatCOP(diff)}`}
              {diff <= -100 && `✕ Faltante en Caja: -${formatCOP(Math.abs(diff))}`}
            </div>
          )}
        </div>

        <button
          onClick={onSaveClose}
          disabled={isFormInvalid}
          className="w-full py-3 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-[#2B2420] border-t-transparent rounded-full animate-spin" />
              <span>Guardando Cierre...</span>
            </>
          ) : (
            <span>Confirmar Arqueo &amp; Firmar Cierre</span>
          )}
        </button>
      </div>
    </div>
  );
};
