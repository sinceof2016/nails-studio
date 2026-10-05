/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CookiePreferences } from '../types';
import { COOKIE_CATALOG, getAllCookies } from '../services/cookieService';
import { BUSINESS_CONFIG } from '../config/businessConfig';

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: CookiePreferences | null;
  onSavePreferences: (prefs: { preferences: boolean; analytics: boolean; marketing: boolean }) => void;
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onRevokeAll: () => void;
  onOpenPolicy: () => void;
}

export const CookieSettingsModal: React.FC<CookieSettingsModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onSavePreferences,
  onAcceptAll,
  onRejectOptional,
  onRevokeAll,
  onOpenPolicy
}) => {
  const [prefValues, setPrefValues] = useState({
    preferences: currentPreferences ? currentPreferences.preferences : false,
    analytics: currentPreferences ? currentPreferences.analytics : false,
    marketing: currentPreferences ? currentPreferences.marketing : false
  });

  const [activeTab, setActiveTab] = useState<'categories' | 'inspector'>('categories');
  const [liveCookies, setLiveCookies] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setPrefValues({
        preferences: currentPreferences ? currentPreferences.preferences : false,
        analytics: currentPreferences ? currentPreferences.analytics : false,
        marketing: currentPreferences ? currentPreferences.marketing : false
      });
      setLiveCookies(getAllCookies());
    }
  }, [isOpen, currentPreferences]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences(prefValues);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-[#F4EFE9] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(28,28,24,0.25)] border border-[#C6BDAC]/50 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#C6BDAC]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]/50 flex items-center justify-center text-[#5A4A43]">
              <span className="material-symbols-outlined text-[22px]">tune</span>
            </div>
            <div>
              <h2 id="cookie-modal-title" className="text-lg sm:text-xl font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                Centro de Preferencias de Cookies
              </h2>
              <p className="text-xs text-[#5A4A43]">
                {BUSINESS_CONFIG.brandName} · Transparencia y Control de tus Datos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F4EFE9] hover:bg-[#C6BDAC]/30 flex items-center justify-center text-[#5A4A43] transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-white/60 border-b border-[#C6BDAC]/20 flex gap-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'border-[#BB9C87] text-[#2B2420] font-bold'
                : 'border-transparent text-[#5A4A43] hover:text-[#2B2420]'
            }`}
          >
            Configuración por Categoría
          </button>
          <button
            onClick={() => {
              setLiveCookies(getAllCookies());
              setActiveTab('inspector');
            }}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'border-[#BB9C87] text-[#2B2420] font-bold'
                : 'border-transparent text-[#5A4A43] hover:text-[#2B2420]'
            }`}
          >
            <span>Inspector en Vivo</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#BB9C87]/20 text-[#2B2420] text-[10px] font-bold">
              {Object.keys(liveCookies).length}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'categories' ? (
            <>
              <p className="text-xs sm:text-sm text-[#5A4A43] leading-relaxed">
                Personaliza cómo utilizamos las cookies en tu dispositivo. Las cookies técnicas son obligatorias para el funcionamiento de la agenda y la seguridad de tus reservas en COP.
              </p>

              {/* 1. Necessary (Always Active) */}
              <div className="p-4 rounded-2xl bg-white border border-[#C6BDAC]/40 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2d6a4f] text-[20px]">verified_user</span>
                    <strong className="text-sm text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                      1. Cookies Técnicas y de Seguridad
                    </strong>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#dce8dc] text-[#2d6a4f] text-[11px] font-bold">
                    Siempre Activas
                  </span>
                </div>
                <p className="text-xs text-[#5A4A43] leading-relaxed">
                  Indispensables para navegar, autenticar tu sesión, sincronizar citas con Firestore en tiempo real y proteger contra ataques automatizados. Este sitio usa Google reCAPTCHA (Fraud Defense) para prevenir abuso automatizado; aplican la Política de Privacidad y los Términos de Google. No pueden desactivarse.
                </p>
                <div className="pt-1 text-[11px] text-[#5A4A43] font-mono">
                  Cookies: pelu_cookie_consent, pelu_auth_session, _GRECAPTCHA, rc::*
                </div>
              </div>

              {/* 2. Preferences */}
              <div className="p-4 rounded-2xl bg-white border border-[#C6BDAC]/40 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5A4A43] text-[20px]">room_preferences</span>
                    <strong className="text-sm text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                      2. Cookies de Preferencias &amp; Funcionalidad
                    </strong>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefValues.preferences}
                      onChange={(e) =>
                        setPrefValues((prev) => ({ ...prev, preferences: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#C6BDAC] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#918380] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#918380] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BB9C87]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#5A4A43] leading-relaxed">
                  Permiten recordar tu sucursal favorita ({BUSINESS_CONFIG.branchName}), tu moneda predeterminada (COP) y tus filtros de búsqueda en el catálogo.
                </p>
                <div className="pt-1 text-[11px] text-[#5A4A43] font-mono">
                  Cookies: aura_branch_pref, aura_currency_display, aura_theme_mode
                </div>
              </div>

              {/* 3. Analytics */}
              <div className="p-4 rounded-2xl bg-white border border-[#C6BDAC]/40 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#918380] text-[20px]">insights</span>
                    <strong className="text-sm text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                      3. Cookies de Rendimiento &amp; Analítica Anónima
                    </strong>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefValues.analytics}
                      onChange={(e) =>
                        setPrefValues((prev) => ({ ...prev, analytics: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#C6BDAC] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#918380] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#918380] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BB9C87]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#5A4A43] leading-relaxed">
                  Nos ayudan a entender de forma completamente anónima qué servicios de uñas son los más populares y qué páginas tardan en cargar para optimizarlas.
                </p>
                <div className="pt-1 text-[11px] text-[#5A4A43] font-mono">
                  Cookies: aura_analytics_uid, aura_perf_metrics
                </div>
              </div>

              {/* 4. Marketing */}
              <div className="p-4 rounded-2xl bg-white border border-[#C6BDAC]/40 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#b07d62] text-[20px]">campaign</span>
                    <strong className="text-sm text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                      4. Cookies de Marketing &amp; Promociones
                    </strong>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefValues.marketing}
                      onChange={(e) =>
                        setPrefValues((prev) => ({ ...prev, marketing: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#C6BDAC] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#918380] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#918380] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BB9C87]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#5A4A43] leading-relaxed">
                  Controlan la frecuencia del bono del 15% OFF y facilitan el contacto directo con tu especialista a través de WhatsApp Business.
                </p>
                <div className="pt-1 text-[11px] text-[#5A4A43] font-mono">
                  Cookies: aura_promo_seen, aura_wa_channel_ref
                </div>
              </div>
            </>
          ) : (
            /* Live Inspector Tab */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC] text-xs text-[#5A4A43] flex items-center justify-between">
                <div>
                  <strong>Registro Real del Navegador:</strong> Muestra las cookies guardadas actualmente en <code className="font-mono bg-white/60 px-1 py-0.5 rounded">document.cookie</code>.
                </div>
                <button
                  type="button"
                  onClick={() => setLiveCookies(getAllCookies())}
                  className="px-2.5 py-1 rounded-lg bg-white text-[#5A4A43] font-semibold text-[11px] shadow-2xs hover:bg-[#F4EFE9]"
                >
                  Refrescar
                </button>
              </div>

              <div className="space-y-2">
                {Object.keys(liveCookies).length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5A4A43] bg-white rounded-2xl border border-dashed border-[#C6BDAC]/60">
                    No hay cookies activas en este momento o el almacenamiento está limpio.
                  </div>
                ) : (
                  Object.entries(liveCookies).map(([key, val]) => (
                    <div key={key} className="p-3 bg-white rounded-xl border border-[#C6BDAC]/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#5A4A43]">{key}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4EFE9] text-[#5A4A43]">
                          HTTP Cookie
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#5A4A43] break-all bg-[#F4EFE9] p-1.5 rounded">
                        {val}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Technical Catalog Table */}
              <div className="pt-3">
                <h4 className="text-xs font-bold text-[#2B2420] uppercase tracking-wider mb-2">
                  Catálogo Técnico Completo ({COOKIE_CATALOG.length} Elementos)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[#C6BDAC]/30">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#F4EFE9] text-[#5A4A43]">
                      <tr>
                        <th className="p-2.5 font-semibold">Cookie</th>
                        <th className="p-2.5 font-semibold">Categoría</th>
                        <th className="p-2.5 font-semibold">Duración</th>
                        <th className="p-2.5 font-semibold">Finalidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C6BDAC]/20 bg-white">
                      {COOKIE_CATALOG.map((c) => (
                        <tr key={c.name} className="hover:bg-[#F4EFE9]">
                          <td className="p-2.5 font-mono text-[#5A4A43] font-semibold">{c.name}</td>
                          <td className="p-2.5 capitalize">{c.category}</td>
                          <td className="p-2.5">{c.duration}</td>
                          <td className="p-2.5 text-[#5A4A43]">{c.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#C6BDAC]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onOpenPolicy}
              className="text-xs font-semibold text-[#5A4A43] underline hover:text-[#2B2420] cursor-pointer"
            >
              Leer Política Completa
            </button>
            <button
              type="button"
              onClick={() => {
                onRevokeAll();
                onClose();
              }}
              className="text-xs font-medium text-red-600 hover:text-red-700 underline cursor-pointer"
            >
              Revocar Todo
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onRejectOptional();
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-[#F4EFE9] hover:bg-[#C6BDAC]/20 text-[#5A4A43] text-xs font-semibold border border-[#C6BDAC]/50 transition-all cursor-pointer text-center"
            >
              Rechazar Opcionales
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-primary hover:bg-[#AA8A74] text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer text-center"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
