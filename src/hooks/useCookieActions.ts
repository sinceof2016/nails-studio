import type { Dispatch, SetStateAction } from 'react';
import type { CookiePreferences } from '../types';
import {
  acceptAllCookies,
  rejectNonEssentialCookies,
  saveCookieConsent,
  revokeConsent
} from '../services/cookieService';
import { disableAnalytics } from '../services/analyticsService';

export interface UseCookieActionsParams {
  setCookieConsent: Dispatch<SetStateAction<CookiePreferences | null>>;
  setIsCookieBannerOpen: Dispatch<SetStateAction<boolean>>;
  setIsCookieSettingsOpen?: Dispatch<SetStateAction<boolean>>;
  showToast: (message: string) => void;
}

export function useCookieActions({
  setCookieConsent,
  setIsCookieBannerOpen,
  setIsCookieSettingsOpen,
  showToast
}: UseCookieActionsParams) {
  const handleAcceptAllCookies = () => {
    const prefs = acceptAllCookies();
    setCookieConsent(prefs);
    setIsCookieBannerOpen(false);
    showToast('Preferencias guardadas: Todas las cookies han sido autorizadas.');
  };

  const handleRejectOptionalCookies = () => {
    const prefs = rejectNonEssentialCookies();
    setCookieConsent(prefs);
    setIsCookieBannerOpen(false);
    showToast('Preferencias guardadas: Solo cookies técnicas necesarias activas.');
  };

  const handleSaveCookiePreferences = (customPrefs: {
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
  }) => {
    const prefs = saveCookieConsent(customPrefs);
    setCookieConsent(prefs);
    setIsCookieBannerOpen(false);
    if (setIsCookieSettingsOpen) {
      setIsCookieSettingsOpen(false);
    }
    showToast('Tus preferencias de cookies han sido actualizadas.');
  };

  const handleRevokeCookies = () => {
    disableAnalytics();
    revokeConsent();
    setCookieConsent(null);
    setIsCookieBannerOpen(true);
    showToast('Consentimiento de cookies revocado. Puedes volver a configurar.');
  };

  return {
    handleAcceptAllCookies,
    handleRejectOptionalCookies,
    handleSaveCookiePreferences,
    handleRevokeCookies
  };
}
