import React from 'react';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseConcept: string;
  setExpenseConcept: (concept: string) => void;
  expenseAmount: number;
  setExpenseAmount: (amount: number) => void;
  expenseValidationError: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseConcept,
  setExpenseConcept,
  expenseAmount,
  setExpenseAmount,
  expenseValidationError,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-2">
          <h3 className="font-bold text-sm text-[#ba1a1a]">Registrar Egreso / Gasto de Caja Menor</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {expenseValidationError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {expenseValidationError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Concepto del Gasto</label>
            <input
              type="text"
              required
              value={expenseConcept}
              onChange={(e) => setExpenseConcept(e.target.value)}
              placeholder="Ej. Insumos desechables o esterilización"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#644E53] mb-1">Monto en COP ($)</label>
            <input
              type="number"
              step="1000"
              required
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-xl bg-white border border-rose-300 text-xs font-mono font-bold text-[#ba1a1a]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
          >
            Descontar de Caja Menor
          </button>
        </form>
      </div>
    </div>
  );
};
