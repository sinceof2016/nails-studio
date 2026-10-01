import React, { useState } from 'react';
import { SystemUser } from '../types';
import { authenticateWithVault } from '../services/securityVault';
import { checkRateLimit } from '../utils/security';
import { BUSINESS_CONFIG } from '../config/businessConfig';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser | null;
  onLogin: (user: SystemUser) => void;
  onLogout: () => void;
  systemUsers?: SystemUser[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Rate Limiter: Máximo 5 intentos por minuto
    const rateCheck = checkRateLimit('login_attempt');
    if (!rateCheck.allowed) {
      setErrorMessage(
        `Demasiados intentos de acceso fallidos. Por seguridad, espera ${rateCheck.retryAfterSeconds ?? 60} segundos.`
      );
      return;
    }

    setIsValidating(true);

    const result = await authenticateWithVault(emailInput, passwordInput);

    setIsValidating(false);

    if (result.success && result.user) {
      onLogin(result.user);
      onClose();
      setEmailInput('');
      setPasswordInput('');
    } else {
      setErrorMessage(result.error || 'Credenciales inválidas en el Vault.');
    }
  };

  const handleSwitchToPublic = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#FAF4F5] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#EAD6D9] z-10 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAD6D9]/50 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#64444B]/15 border border-[#64444B]/30 flex items-center justify-center text-[#64444B] shrink-0">
              <span className="material-symbols-outlined text-[22px]">lock</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                Acceso al Sistema
              </h3>
              <p className="text-xs text-[#644E53] mt-0.5">
                Panel de gestión y administración de {BUSINESS_CONFIG.brandName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Current Active User Status */}
        {currentUser ? (
          <div className="p-3.5 rounded-2xl bg-[#F6E3E6] border border-[#EAD6D9] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                alt={currentUser.nombre}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#C5838D]"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#1F1417] block truncate font-['Plus_Jakarta_Sans',sans-serif]">
                  {currentUser.nombre}
                </span>
                <span className="text-[10px] text-[#64444B] font-bold tracking-wider uppercase">
                  ★ {currentUser.rol}
                </span>
              </div>
            </div>
            <button
              onClick={handleSwitchToPublic}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-[#ba1a1a] text-xs font-semibold border border-rose-200 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0">info</span>
            <span>Estás en <strong>Modo Público</strong>. Ingresa tus credenciales para acceder a funciones administrativas.</span>
          </div>
        )}

        {/* Form Login to Vault */}
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-[#644E53] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
            {currentUser ? 'Cambiar a otra cuenta' : 'Ingreso con Credenciales'}
          </span>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-[#644E53] mb-1">
                Usuario o Correo
              </label>
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Ingresa tu correo o usuario"
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#644E53] mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417] focus:outline-none focus:ring-2 focus:ring-[#64444B]/30"
              />
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full h-10 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              <span>{isValidating ? 'Validando en Vault...' : 'Ingresar al Sistema'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
