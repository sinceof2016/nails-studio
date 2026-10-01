import React from 'react';
import { COOKIE_CATALOG } from '../services/cookieService';
import { BUSINESS_CONFIG } from '../config/businessConfig';

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenDataPolicy?: () => void;
}

export const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenDataPolicy
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-policy-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-[#FAF4F5] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-[#EAD6D9] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Banner de Advertencia Legal */}
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-700 text-[16px] shrink-0">gavel</span>
          <span>
            <strong>BORRADOR PARA REVISIÓN LEGAL</strong> · PENDIENTE REVISIÓN LEGAL
          </span>
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#EAD6D9]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#64444B]/10 text-[#64444B] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">cookie</span>
            </div>
            <div>
              <h2 id="cookie-policy-title" className="text-lg sm:text-xl font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                Política de Cookies y Almacenamiento
              </h2>
              <p className="text-xs text-[#644E53]">
                {BUSINESS_CONFIG.brandName} · Conforme a la Política de Tratamiento de Datos Personales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53] cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-[#644E53] text-xs sm:text-sm leading-relaxed text-justify">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#64444B] text-[18px]">info</span>
              1. ¿Qué son las Cookies y qué elementos utiliza este sitio?
            </h3>
            <p>
              Las <strong>cookies</strong> y tecnologías de almacenamiento local (LocalStorage y SessionStorage) son pequeños registros que se guardan en tu navegador. En <strong>{BUSINESS_CONFIG.brandName}</strong> las utilizamos de forma responsable para recordar tus preferencias de navegación, mantener la seguridad de las sesiones de staff y optimizar la carga del catálogo en <strong>Pesos Colombianos (COP)</strong>.
            </p>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold text-xs">
              Transparencia Total: {BUSINESS_CONFIG.brandName} NO vende datos a terceros, NO utiliza píxeles de seguimiento publicitario externo ni redes de rastreo entre sitios.
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#64444B] text-[18px]">category</span>
              2. Clasificación de Elementos Utilizados
            </h3>
            <ul className="space-y-2.5 list-disc pl-5">
              <li>
                <strong>Cookies Técnicas y Estrictamente Necesarias:</strong> Imprescindibles para la navegación, autenticación en el panel administrativo y registro de tu consentimiento de privacidad. No se pueden desactivar.
              </li>
              <li>
                <strong>Cookies y Almacenamiento de Preferencias:</strong> Permiten guardar parámetros locales como tus preferencias de visualización y plantillas de notificación.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#64444B] text-[18px]">table_chart</span>
              3. Tabla de Elementos Técnicos del Sistema
            </h3>
            <div className="border border-[#EAD6D9] rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF4F5] text-[#1F1417] border-b border-[#EAD6D9] font-bold">
                    <tr>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Finalidad</th>
                      <th className="p-3">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAD6D9]/50 bg-white">
                    {COOKIE_CATALOG.map((c) => (
                      <tr key={c.name} className="hover:bg-[#FAF4F5]/50">
                        <td className="p-3 font-mono text-[11px] font-bold text-[#64444B]">{c.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF4F5] border border-[#EAD6D9]">
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3 text-[#644E53]">{c.purpose}</td>
                        <td className="p-3 text-[#644E53] whitespace-nowrap">{c.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#64444B] text-[18px]">settings</span>
              4. ¿Cómo configurar o revocar tu consentimiento?
            </h3>
            <p>
              Puedes modificar tus preferencias en cualquier momento a través del <strong>Centro de Preferencias de Cookies</strong> haciendo clic en el botón flotante en la esquina inferior izquierda o en el botón a continuación:
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-4 py-2 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Abrir Centro de Preferencias</span>
              </button>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#EAD6D9]/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {onOpenDataPolicy && (
            <button
              onClick={() => {
                onClose();
                onOpenDataPolicy();
              }}
              className="text-xs text-[#64444B] font-bold underline hover:text-[#52363C] cursor-pointer"
            >
              Consultar Política de Tratamiento de Datos
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-[#FAF4F5] text-[#644E53] font-bold text-xs border border-[#EAD6D9] cursor-pointer ml-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
