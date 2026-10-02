import React from 'react';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseConcept: string;
  setExpenseConcept: (concept: string) => void;
  expenseCategory: 'insumos' | 'servicios' | 'mantenimiento' | 'caja_menor';
  setExpenseCategory: (category: 'insumos' | 'servicios' | 'mantenimiento' | 'caja_menor') => void;
  expenseAmount: number;
  setExpenseAmount: (amount: number) => void;
  expenseValidationError: string | null;
  isSubmitting?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseConcept,
  setExpenseConcept,
  expenseCategory,
  setExpenseCategory,
  expenseAmount,
  setExpenseAmount,
  expenseValidationError,
  isSubmitting = false,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-2">
          <h3 className="font-bold text-sm text-[#ba1a1a]">Registrar Egreso / Gasto de Caja Menor</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] disabled:opacity-50"
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
            <label className="block font-semibold text-[#5A4A43] mb-1">Concepto del Gasto</label>
            <input
              type="text"
              required
              value={expenseConcept}
              onChange={(e) => setExpenseConcept(e.target.value)}
              placeholder="Ej. Insumos desechables o esterilización"
              maxLength={200}
              disabled={isSubmitting}
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Categoría del Gasto</label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value as 'insumos' | 'servicios' | 'mantenimiento' | 'caja_menor')}
              disabled={isSubmitting}
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
            >
              <option value="insumos">Insumos y Materiales</option>
              <option value="servicios">Servicios Básicos / Públicos</option>
              <option value="mantenimiento">Mantenimiento y Reparaciones</option>
              <option value="caja_menor">Caja Menor / Gastos Varios</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Monto en COP ($)</label>
            <input
              type="number"
              step="1000"
              min="1000"
              required
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full h-9 px-3 rounded-xl bg-white border border-rose-300 text-xs font-mono font-bold text-[#ba1a1a]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Descontar de Caja Menor</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
