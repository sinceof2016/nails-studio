/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { COOKIE_CATALOG } from '../services/cookieService';

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-policy-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-[#fdf9f3] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_20px_50px_rgba(28,28,24,0.25)] border border-[#e8b4b8]/50 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#e8b4b8]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f8d8ff] to-[#ffdbc9] flex items-center justify-center text-[#7c5357]">
              <span className="material-symbols-outlined text-[22px]">policy</span>
            </div>
            <div>
              <h2 id="cookie-policy-title" className="text-lg sm:text-xl font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
                Política de Tratamiento y Uso de Cookies
              </h2>
              <p className="text-xs text-[#504444]">
                La Pelu SPA · Actualizado Septiembre 2026 · Conforme Ley 1581 / RGPD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#fdf9f3] hover:bg-[#e8b4b8]/20 flex items-center justify-center text-[#504444] transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-[#504444] text-xs sm:text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7c5357] text-[18px]">info</span>
              1. ¿Qué es una Cookie y para qué se utiliza?
            </h3>
            <p>
              Una <strong>cookie</strong> es un pequeño archivo de texto que un sitio web descarga en tu ordenador, smartphone o tableta cuando accedes a él. Las cookies permiten a <strong>La Pelu SPA</strong> almacenar y recuperar información sobre tus hábitos de navegación, recordar tu sesión activa, agilizar tus reservas de manicura rusa y personalizar la visualización de precios en <strong>Pesos Colombianos (COP)</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7c5357] text-[18px]">category</span>
              2. Clasificación de Cookies que utilizamos
            </h3>
            <ul className="space-y-2.5 list-disc pl-5">
              <li>
                <strong>Cookies Técnicas y Estrictamente Necesarias:</strong> Imprescindibles para que puedas reservar tu cita, navegar de forma segura mediante HTTPS y mantener la sesión de administración. Sin ellas, el santuario digital no puede operar.
              </li>
              <li>
                <strong>Cookies de Personalización y Preferencias:</strong> Recuerdan tus elecciones como tu sede habitual (Chicó Bogotá), formato de visualización y tus especialistas de preferencia.
              </li>
              <li>
                <strong>Cookies Analíticas y de Rendimiento:</strong> Recogen información anónima sobre el tráfico y tiempos de carga con el único propósito de mejorar la velocidad del servicio.
              </li>
              <li>
                <strong>Cookies de Comunicación y Marketing:</strong> Permiten la integración segura con WhatsApp Business para recibir confirmaciones de cita y promociones del 15% OFF.
              </li>
            </ul>
          </section>

          {/* Section 3: Technical Table */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7c5357] text-[18px]">table_chart</span>
              3. Inventario Técnico de Cookies
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-[#e8b4b8]/30 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5e6e8] text-[#1c1c18]">
                  <tr>
                    <th className="p-3 font-semibold">Nombre</th>
                    <th className="p-3 font-semibold">Tipo</th>
                    <th className="p-3 font-semibold">Titular</th>
                    <th className="p-3 font-semibold">Duración</th>
                    <th className="p-3 font-semibold">Finalidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8b4b8]/20 bg-white">
                  {COOKIE_CATALOG.map((c) => (
                    <tr key={c.name} className="hover:bg-[#fdf9f3]">
                      <td className="p-3 font-mono text-[#7c5357] font-bold">{c.name}</td>
                      <td className="p-3 capitalize">{c.category}</td>
                      <td className="p-3">{c.provider}</td>
                      <td className="p-3 font-medium">{c.duration}</td>
                      <td className="p-3 text-[#504444]">{c.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Legal Basis */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7c5357] text-[18px]">gavel</span>
              4. Base Legal y Marco Normativo
            </h3>
            <p>
              El tratamiento de tus datos a través de cookies se realiza en estricto apego al <strong>Reglamento General de Protección de Datos (RGPD / GDPR)</strong>, a la <strong>Ley Estatutaria 1581 de 2012 de Colombia (Habeas Data)</strong> y demás normativas internacionales de privacidad digital. Tu consentimiento expreso es la base que legitima el uso de cookies no esenciales.
            </p>
          </section>

          {/* Section 5: Browser Management */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7c5357] text-[18px]">settings_suggest</span>
              5. ¿Cómo bloquear o eliminar cookies desde tu navegador?
            </h3>
            <p>
              Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones del navegador instalado en tu dispositivo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white border border-[#e8b4b8]/30">
                <strong className="block text-[#1c1c18] font-semibold text-xs">Google Chrome</strong>
                <span className="text-[11px] text-[#7D676B]">Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e8b4b8]/30">
                <strong className="block text-[#1c1c18] font-semibold text-xs">Apple Safari (iOS / macOS)</strong>
                <span className="text-[11px] text-[#7D676B]">Preferencias &gt; Privacidad &gt; Bloquear todas las cookies o gestionar datos del sitio.</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e8b4b8]/30">
                <strong className="block text-[#1c1c18] font-semibold text-xs">Mozilla Firefox</strong>
                <span className="text-[11px] text-[#7D676B]">Opciones &gt; Privacidad &amp; Seguridad &gt; Cookies y datos del sitio.</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e8b4b8]/30">
                <strong className="block text-[#1c1c18] font-semibold text-xs">Microsoft Edge</strong>
                <span className="text-[11px] text-[#7D676B]">Configuración &gt; Permisos del sitio &gt; Cookies y datos almacenados.</span>
              </div>
            </div>
          </section>

          {/* Section 6: Contact */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7c5357] text-[18px]">contact_support</span>
              6. Contacto de Privacidad y Delegado de Protección de Datos
            </h3>
            <p>
              Si tienes dudas o deseas ejercer tus derechos de acceso, rectificación o supresión de datos, puedes escribir a nuestro equipo de privacidad en:
            </p>
            <div className="p-3.5 rounded-2xl bg-white border border-[#e8b4b8]/30 text-xs space-y-1">
              <p><strong>La Pelu SPA Bogotá</strong> · Carrera 11 # 93-40, Barrio Chicó, Bogotá D.C., Colombia.</p>
              <p><strong>Correo electrónico:</strong> <a href="mailto:privacidad@lapeluspa.com" className="text-[#7c5357] underline">privacidad@lapeluspa.com</a></p>
              <p><strong>WhatsApp Oficial:</strong> +57 312 849 2011</p>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#e8b4b8]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-[#7D676B]">
            Puedes modificar tus preferencias en cualquier momento.
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-[#fdf9f3] hover:bg-[#f6eeea] text-[#7c5357] text-xs font-semibold border border-[#e8b4b8]/50 transition-all cursor-pointer text-center"
            >
              Configurar Cookies
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer text-center"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
