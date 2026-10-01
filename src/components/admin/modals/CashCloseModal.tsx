import React from 'react';
import { formatCOP } from '../../../utils/format';

interface CashCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedCashInHand: number;
  countedCash: number;
  setCountedCash: (amount: number) => void;
  onSaveClose: () => void;
}

export const CashCloseModal: React.FC<CashCloseModalProps> = ({
  isOpen,
  onClose,
  expectedCashInHand,
  countedCash,
  setCountedCash,
  onSaveClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-2">
          <h3 className="font-bold text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
            Arqueo &amp; Cierre de Caja del Día
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-[#644E53]">
            <span>Efectivo Esperado en Gaveta:</span>
            <strong className="font-mono text-[#1F1417]">{formatCOP(expectedCashInHand)}</strong>
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Efectivo Físico Contado ($)</label>
            <input
              type="number"
              step="1000"
              value={countedCash}
              onChange={(e) => setCountedCash(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl bg-white border border-[#EAD6D9] text-sm font-mono font-bold text-[#64444B]"
            />
          </div>

          {/* Balance Badge */}
          <div
            className={`p-2.5 rounded-xl text-center font-bold text-xs ${
              countedCash === expectedCashInHand
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : countedCash > expectedCashInHand
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            {countedCash === expectedCashInHand && '✓ Caja Cuadrada Perfecta ($0 de Diferencia)'}
            {countedCash > expectedCashInHand && `⚠ Sobrante en Caja: +${formatCOP(countedCash - expectedCashInHand)}`}
            {countedCash < expectedCashInHand && `✕ Faltante en Caja: -${formatCOP(expectedCashInHand - countedCash)}`}
          </div>
        </div>

        <button
          onClick={onSaveClose}
          className="w-full py-3 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
        >
          Confirmar Arqueo &amp; Firmar Cierre
        </button>
      </div>
    </div>
  );
};
