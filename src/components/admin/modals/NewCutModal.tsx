import React from 'react';
import { Specialist, Service } from '../../../types';
import { formatCOP } from '../../../utils/format';

interface NewCutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cutClientName: string;
  setCutClientName: (name: string) => void;
  cutClientPhone: string;
  setCutClientPhone: (phone: string) => void;
  cutServiceName: string;
  setCutServiceName: (name: string) => void;
  cutServicePrice: number;
  setCutServicePrice: (price: number) => void;
  cutTip: number;
  setCutTip: (tip: number) => void;
  cutSpecialistId: string;
  setCutSpecialistId: (id: string) => void;
  cutNote: string;
  setCutNote: (note: string) => void;
  cutPaymentMethod: 'efectivo' | 'nequi_daviplata' | 'tarjeta_datafono' | 'mixto';
  setCutPaymentMethod: (method: 'efectivo' | 'nequi_daviplata' | 'tarjeta_datafono' | 'mixto') => void;
  cutMontoEfectivo: number;
  setCutMontoEfectivo: (val: number) => void;
  cutMontoDigital: number;
  cutDigitalMethod: 'nequi_daviplata' | 'tarjeta_datafono';
  setCutDigitalMethod: (method: 'nequi_daviplata' | 'tarjeta_datafono') => void;
  cutCashReceived: number;
  setCutCashReceived: (val: number) => void;
  targetCashToPay: number;
  cashChange: number;
  cutValidationError: string | null;
  services: Service[];
  specialists: Specialist[];
  isSubmitting?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const NewCutModal: React.FC<NewCutModalProps> = ({
  isOpen,
  onClose,
  cutClientName,
  setCutClientName,
  cutClientPhone,
  setCutClientPhone,
  cutServiceName,
  setCutServiceName,
  cutServicePrice,
  setCutServicePrice,
  cutTip,
  setCutTip,
  cutSpecialistId,
  setCutSpecialistId,
  cutNote,
  setCutNote,
  cutPaymentMethod,
  setCutPaymentMethod,
  cutMontoEfectivo,
  setCutMontoEfectivo,
  cutMontoDigital,
  cutDigitalMethod,
  setCutDigitalMethod,
  cutCashReceived,
  setCutCashReceived,
  targetCashToPay,
  cashChange,
  cutValidationError,
  services,
  specialists,
  isSubmitting = false,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-3.5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-2">
          <h3 className="font-bold text-sm text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
            Registrar Servicio Realizado en Caja (COP)
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {cutValidationError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {cutValidationError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Nombre de la Clienta</label>
              <input
                type="text"
                required
                value={cutClientName}
                onChange={(e) => setCutClientName(e.target.value)}
                placeholder="Ej. Camila Gómez"
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">WhatsApp (+57)</label>
              <input
                type="text"
                required
                value={cutClientPhone}
                onChange={(e) => setCutClientPhone(e.target.value)}
                placeholder="Ej. 300 123 4567"
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs font-mono text-[#2B2420]"
              />
            </div>
          </div>

          {/* SELECTOR DE SERVICIO */}
          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Servicio del Catálogo</label>
            <select
              value={cutServiceName}
              onChange={(e) => {
                const selected = services.find((s) => s.name === e.target.value);
                setCutServiceName(e.target.value);
                if (selected) {
                  setCutServicePrice(selected.price);
                }
              }}
              className="w-full h-9 px-2 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
            >
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({formatCOP(s.price)})
                </option>
              ))}
              {services.length === 0 && (
                <option value={cutServiceName}>{cutServiceName}</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Valor en COP ($)</label>
              <input
                type="number"
                step="1000"
                required
                value={cutServicePrice}
                onChange={(e) => setCutServicePrice(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs font-mono font-bold text-[#2B2420]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Propina COP ($)</label>
              <input
                type="number"
                step="1000"
                value={cutTip}
                onChange={(e) => setCutTip(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs font-mono text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Manicurista Asignada</label>
            <select
              value={cutSpecialistId}
              onChange={(e) => setCutSpecialistId(e.target.value)}
              className="w-full h-9 px-2 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
            >
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.commissionRate}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Nota / Referencia de Cita (Opcional)</label>
            <input
              type="text"
              value={cutNote}
              onChange={(e) => setCutNote(e.target.value)}
              placeholder="Ej. Cita #AURA-123 o petición especial"
              maxLength={500}
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
            />
          </div>

          {/* PAYMENT METHOD SELECTOR WITH SPLIT PAYMENT SUPPORT */}
          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Método de Pago</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setCutPaymentMethod('efectivo')}
                className={`p-2 rounded-xl text-center border font-bold text-[11px] cursor-pointer transition-all ${
                  cutPaymentMethod === 'efectivo'
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold border-[#BB9C87]'
                    : 'bg-white text-[#5A4A43] border-[#C6BDAC]'
                }`}
              >
                💵 Efectivo
              </button>

              <button
                type="button"
                onClick={() => setCutPaymentMethod('nequi_daviplata')}
                className={`p-2 rounded-xl text-center border font-bold text-[11px] cursor-pointer transition-all ${
                  cutPaymentMethod === 'nequi_daviplata'
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold border-[#BB9C87]'
                    : 'bg-white text-[#5A4A43] border-[#C6BDAC]'
                }`}
              >
                📱 Nequi/Davi
              </button>

              <button
                type="button"
                onClick={() => setCutPaymentMethod('tarjeta_datafono')}
                className={`p-2 rounded-xl text-center border font-bold text-[11px] cursor-pointer transition-all ${
                  cutPaymentMethod === 'tarjeta_datafono'
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold border-[#BB9C87]'
                    : 'bg-white text-[#5A4A43] border-[#C6BDAC]'
                }`}
              >
                💳 Datáfono
              </button>

              <button
                type="button"
                onClick={() => setCutPaymentMethod('mixto')}
                className={`p-2 rounded-xl text-center border font-bold text-[11px] cursor-pointer transition-all ${
                  cutPaymentMethod === 'mixto'
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold border-[#BB9C87]'
                    : 'bg-white text-[#5A4A43] border-[#C6BDAC]'
                }`}
              >
                ⚡ Pago Mixto
              </button>
            </div>
          </div>

          {/* SPLIT PAYMENT CONFIGURATION */}
          {cutPaymentMethod === 'mixto' && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#C6BDAC] space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#2B2420]">
                <span>Desglose de Pago Dividido:</span>
                <span>Total: {formatCOP(cutServicePrice + cutTip)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#5A4A43] mb-0.5">
                    Monto Efectivo ($)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={cutMontoEfectivo}
                    onChange={(e) => setCutMontoEfectivo(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-lg bg-[#F4EFE9] border border-[#C6BDAC] text-xs font-mono font-bold text-[#2B2420]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#5A4A43] mb-0.5">
                    Monto Digital ($)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={cutMontoDigital}
                    className="w-full h-8 px-2.5 rounded-lg bg-gray-50 border border-[#C6BDAC] text-xs font-mono font-bold text-[#2B2420]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#5A4A43] mb-0.5">
                  Canal Digital del Restante
                </label>
                <select
                  value={cutDigitalMethod}
                  onChange={(e) => setCutDigitalMethod(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-lg bg-[#F4EFE9] border border-[#C6BDAC] text-xs text-[#2B2420]"
                >
                  <option value="nequi_daviplata">Transferencia Nequi / Daviplata</option>
                  <option value="tarjeta_datafono">Tarjeta Débito/Crédito Datáfono</option>
                </select>
              </div>
            </div>
          )}

          {/* CALCULADORA RÁPIDA DE DEVUELTAS */}
          {(cutPaymentMethod === 'efectivo' || cutPaymentMethod === 'mixto') && (
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">calculate</span>
                  <span>Calculadora de Devuelta</span>
                </span>
                <span className="text-[10px] text-emerald-800">
                  A Cobrar en Efectivo: <strong>{formatCOP(targetCashToPay)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-emerald-800 mb-0.5">Efectivo Recibido</label>
                  <input
                    type="number"
                    step="1000"
                    value={cutCashReceived}
                    onChange={(e) => setCutCashReceived(Number(e.target.value))}
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-emerald-300 text-xs font-mono font-bold text-[#2B2420]"
                  />
                </div>

                <div className="flex-1 text-right">
                  <span className="block text-[10px] text-emerald-800 mb-0.5">Devuelta Exacta:</span>
                  <div className="h-8 px-3 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-end shadow-2xs">
                    {formatCOP(cashChange)}
                  </div>
                </div>
              </div>

              {/* Fast bill pills */}
              <div className="flex items-center gap-1 pt-1">
                <span className="text-[9px] text-emerald-800">Billetes:</span>
                <button
                  type="button"
                  onClick={() => setCutCashReceived(targetCashToPay)}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  Exacto
                </button>
                <button
                  type="button"
                  onClick={() => setCutCashReceived(50000)}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  $50k
                </button>
                <button
                  type="button"
                  onClick={() => setCutCashReceived(100000)}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  $100k
                </button>
                <button
                  type="button"
                  onClick={() => setCutCashReceived(200000)}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  $200k
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando en Firestore...' : 'Guardar Cobro & Enviar Recibo WhatsApp'}
          </button>
        </form>
      </div>
    </div>
  );
};
