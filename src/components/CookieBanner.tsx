/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CookieBannerProps {
  isOpen: boolean;
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onOpenSettings: () => void;
  onOpenPolicy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({
  isOpen,
  onAcceptAll,
  onRejectOptional,
  onOpenSettings,
  onOpenPolicy
}) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Aviso de cookies y privacidad"
      className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 sm:bottom-6 z-50 max-w-4xl mx-auto animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(28,28,24,0.18)] border border-[#e8b4b8]/50 flex flex-col md:flex-row items-start md:items-center gap-5 justify-between">
        {/* Left Side: Icon & Copy */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#f8d8ff] to-[#ffdbc9] flex items-center justify-center text-[#7c5357] shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-[24px]">cookie</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
                Uso de Cookies en La Pelu SPA
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#fdf9f3] text-[10px] font-semibold text-[#7c5357] border border-[#e8b4b8]/40">
                Privacidad &amp; Transparencia
              </span>
            </div>
            <p className="text-xs text-[#504444] leading-relaxed max-w-2xl">
              Utilizamos cookies propias y técnicas necesarias para garantizar la seguridad de tus citas, recordar tu sede preferida en Bogotá y mejorar la velocidad del catálogo. Puedes aceptar todas, mantener solo las esenciales o{' '}
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-[#7c5357] font-semibold underline hover:text-[#5d363a] transition-colors cursor-pointer"
              >
                personalizar tus preferencias
              </button>
              . Conoce todos los detalles en nuestra{' '}
              <button
                type="button"
                onClick={onOpenPolicy}
                className="text-[#7c5357] font-semibold underline hover:text-[#5d363a] transition-colors cursor-pointer"
              >
                Política de Cookies
              </button>
              .
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#e8b4b8]/30">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-full bg-[#fdf9f3] hover:bg-[#f6eeea] text-[#504444] text-xs font-semibold border border-[#e8b4b8]/50 transition-all cursor-pointer text-center"
          >
            Configurar
          </button>
          <button
            type="button"
            onClick={onRejectOptional}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-white hover:bg-[#fdf9f3] text-[#7c5357] text-xs font-semibold border border-[#7c5357]/30 transition-all cursor-pointer text-center"
          >
            Solo Necesarias
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white text-xs font-semibold shadow-[0_4px_14px_rgba(124,83,87,0.25)] active:scale-95 transition-all cursor-pointer text-center"
          >
            Aceptar Todas
          </button>
        </div>
      </div>
    </aside>
  );
};
