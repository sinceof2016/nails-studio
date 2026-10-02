import React from 'react';

interface ToastProps {
  message: string | null;
  onView?: () => void;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onView }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm px-4 py-3 rounded-full bg-[#2B2420] text-[#F4EFE9] shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="material-symbols-outlined text-[#BB9C87] text-[20px] shrink-0 fill">
          check_circle
        </span>
        <span className="text-sm font-medium truncate">{message}</span>
      </div>
      {onView && (
        <button
          onClick={onView}
          className="text-xs font-semibold text-[#BB9C87] hover:underline cursor-pointer shrink-0 ml-1"
        >
          Ver
        </button>
      )}
    </div>
  );
};
