import React, { useState } from 'react';

interface ToastProps {
  message: string | null;
  onView?: () => void;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onView, onClose }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const isError =
    message.startsWith('⚠') ||
    message.startsWith('✕') ||
    message.toLowerCase().includes('error') ||
    message.toLowerCase().includes('rechazad') ||
    message.toLowerCase().includes('bloquead') ||
    message.toLowerCase().includes('faltan') ||
    message.toLowerCase().includes('inválid') ||
    message.toLowerCase().includes('debes aceptar');

  const cleanMessage = message.replace(/^[✓⚠✕]\s*/, '');

  const handleOpenDetail = () => {
    setIsDetailOpen(true);
    if (onView) {
      onView();
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Toast Notification Pill */}
      <div
        role="status"
        className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg px-4 py-3 rounded-2xl bg-[#2B2420] text-[#F4EFE9] shadow-2xl border border-[#5A4A43]/50 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        <div
          onClick={handleOpenDetail}
          className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 cursor-pointer group"
          title="Haz clic para ver el detalle completo"
        >
          <span
            className={`material-symbols-outlined text-[20px] shrink-0 fill ${
              isError ? 'text-rose-400' : 'text-[#BB9C87]'
            }`}
          >
            {isError ? 'error' : 'check_circle'}
          </span>
          <span className="text-xs sm:text-sm font-medium truncate group-hover:text-[#BB9C87] transition-colors">
            {message}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenDetail}
            className="text-xs font-bold text-[#2B2420] bg-[#BB9C87] hover:bg-[#AA8A74] px-2.5 py-1 rounded-full shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            title="Ver información completa"
          >
            <span className="material-symbols-outlined text-[13px]">visibility</span>
            <span>Ver</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#C6BDAC] hover:text-white cursor-pointer transition-colors"
              aria-label="Cerrar notificación"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal con la Información Completa al pulsar "Ver" */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#C6BDAC]/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    isError ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isError ? 'error' : 'check_circle'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                    {isError ? 'Notificación del Sistema' : 'Detalle de la Operación'}
                  </h3>
                  <span className="text-[10px] text-[#5A4A43] font-medium block">
                    La Pelu SPA · Registro en Vivo
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Mensaje Completo Sin Truncar */}
            <div className="p-4 rounded-2xl bg-white border border-[#C6BDAC] text-xs sm:text-sm text-[#2B2420] leading-relaxed whitespace-pre-wrap font-medium shadow-2xs">
              {cleanMessage}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#C6BDAC]/60">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-[#5A4A43] border border-[#C6BDAC] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  if (onClose) onClose();
                }}
                className="px-5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs shadow-xs cursor-pointer transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
