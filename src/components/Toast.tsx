import React from 'react';

interface ToastProps {
  message: string | null;
  onView?: () => void;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onView, onClose }) => {
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

  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm px-4 py-3 rounded-full bg-[#2B2420] text-[#F4EFE9] shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
        <span
          className={`material-symbols-outlined text-[20px] shrink-0 fill ${
            isError ? 'text-rose-400' : 'text-[#BB9C87]'
          }`}
        >
          {isError ? 'error' : 'check_circle'}
        </span>
        <span className="text-xs sm:text-sm font-medium truncate">{message}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onView && (
          <button
            onClick={onView}
            className="text-xs font-bold text-[#BB9C87] hover:underline cursor-pointer px-1.5 py-0.5 rounded"
          >
            Ver
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-[#C6BDAC] hover:text-white cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
};
