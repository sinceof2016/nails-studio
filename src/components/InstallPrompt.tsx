import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pelu_install_dismissed';

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* sin almacenamiento: el aviso volverá a salir, no pasa nada */
  }
}

function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

// iPhone/iPad en Safari (los navegadores internos de Instagram, Facebook o WhatsApp no pueden instalar)
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|FBAN|FBAV|Instagram|Line|GSA/.test(ua);
  return isIos && isSafari;
}

/**
 * Aviso pequeño para instalar la app en la pantalla de inicio.
 * - Android/Chrome: botón "Instalar" que abre el aviso del navegador.
 * - iPhone/Safari: explica "Compartir > Añadir a pantalla de inicio".
 * Aparece unos segundos después de entrar, solo una vez, y se puede cerrar.
 */
export const InstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled() || wasDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const ios = isIosSafari();
    setShowIosHint(ios);

    // Espera un rato para no taparle la reserva (ni el aviso de cookies) apenas entra
    const timer = window.setTimeout(() => setVisible(true), 20000);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.clearTimeout(timer);
    };
  }, []);

  const close = () => {
    rememberDismissed();
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } catch {
      /* el usuario cerró el aviso del navegador */
    }
    setInstallEvent(null);
    close();
  };

  if (!visible || (!installEvent && !showIosHint)) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar la app de La Pelu SPA"
      className="fixed left-3 right-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-40 rounded-2xl bg-white border border-[#C6BDAC] shadow-lg p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <img src={`${import.meta.env.BASE_URL}logo-la-pelu-icono.webp`} alt="" width={40} height={40} className="w-10 h-10 rounded-full shrink-0 border border-[#C6BDAC]" />
      <div className="flex-1 min-w-0 text-xs text-[#2B2420]">
        <p className="font-bold text-sm">Instala La Pelu SPA</p>
        {installEvent ? (
          <p className="text-[#5A4A43] mt-0.5">Agrégala a tu pantalla de inicio y reserva con un toque.</p>
        ) : (
          <p className="text-[#5A4A43] mt-0.5">
            Toca <span className="font-bold">Compartir</span> (el cuadro con la flecha) y luego <span className="font-bold">Añadir a pantalla de inicio</span>.
          </p>
        )}
        {installEvent && (
          <button
            type="button"
            onClick={install}
            className="mt-2 h-8 px-4 rounded-full bg-[#BB9C87] hover:bg-[#a98a76] text-[#2B2420] font-bold cursor-pointer active:scale-95 transition-all"
          >
            Instalar
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Cerrar aviso de instalación"
        className="w-7 h-7 rounded-full hover:bg-[#F4EFE9] flex items-center justify-center text-[#5A4A43] cursor-pointer shrink-0"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};
