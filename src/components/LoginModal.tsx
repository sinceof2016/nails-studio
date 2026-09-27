import React, { useState } from 'react';
import { SystemUser } from '../types';
import { authenticateWithVault } from '../services/securityVault';

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
      <div className="relative w-full max-w-md bg-[#FFF8F5] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#DFCBB5] z-10 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header with Vault Badge */}
        <div className="flex items-start justify-between border-b border-[#DFCBB5]/50 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7C571C]/15 border border-[#7C571C]/30 flex items-center justify-center text-[#7C571C] shrink-0">
              <span className="material-symbols-outlined text-[22px]">shield_person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                  Security Vault &amp; Acceso
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-bold border border-emerald-200">
                  SHA-256
                </span>
              </div>
              <p className="text-xs text-[#6F5A4B] mt-0.5">
                Bóveda de credenciales criptográficas protegidas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#FBEBE1] flex items-center justify-center text-[#6F5A4B] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Current Active User Status */}
        {currentUser ? (
          <div className="p-3.5 rounded-2xl bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                alt={currentUser.nombre}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#C49756]"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#221A14] block truncate font-['Plus_Jakarta_Sans',sans-serif]">
                  {currentUser.nombre}
                </span>
                <span className="text-[10px] text-[#7C571C] font-bold tracking-wider uppercase">
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
          <span className="block text-xs font-bold uppercase tracking-wider text-[#6F5A4B] mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
            {currentUser ? 'Cambiar a otra cuenta' : 'Ingreso con Credenciales'}
          </span>

          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-[#6F5A4B] mb-1">
                Usuario o Correo
              </label>
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Ingresa tu correo o usuario"
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#DFCBB5] text-xs text-[#221A14] focus:outline-none focus:ring-2 focus:ring-[#7C571C]/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6F5A4B] mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#DFCBB5] text-xs text-[#221A14] focus:outline-none focus:ring-2 focus:ring-[#7C571C]/30"
              />
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full h-10 rounded-xl bg-[#7C571C] hover:bg-[#684714] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
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
