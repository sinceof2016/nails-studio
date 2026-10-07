import type { Dispatch, SetStateAction } from 'react';
import type { SystemUser, AppTab } from '../types';
import { BusinessConfig, updateBusinessConfigFromFirestore } from '../config/businessConfig';
import { createSession, clearSession } from '../services/sessionManager';
import { logoutVault } from '../services/securityVault';
import {
  saveUserInFirestore,
  deleteUserInFirestore,
  saveBusinessConfigInFirestore
} from '../services/firestoreService';

export interface UseUserActionsParams {
  setCurrentUser: Dispatch<SetStateAction<SystemUser | null>>;
  setSystemUsers?: Dispatch<SetStateAction<SystemUser[]>>;
  setBusinessConfig: Dispatch<SetStateAction<BusinessConfig>>;
  handleNavigateTab: (tab: AppTab) => void;
  showToast: (message: string) => void;
}

export function useUserActions({
  setCurrentUser,
  setBusinessConfig,
  handleNavigateTab,
  showToast
}: UseUserActionsParams) {
  const handleLogin = (user: SystemUser) => {
    createSession(user);
    setCurrentUser(user);
    showToast(`Sesión iniciada como: ${user.nombre} (${user.rol})`);
  };

  const handleLogout = async () => {
    await logoutVault();
    clearSession();
    setCurrentUser(null);
    handleNavigateTab('servicios');
    showToast('Sesión cerrada. Ahora estás en Modo Público.');
  };

  const handleAddUser = async (newUser: SystemUser) => {
    try {
      await saveUserInFirestore(newUser);
      showToast(`Usuario "${newUser.nombre}" guardado en Firestore.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleUpdateUser = async (updatedUser: SystemUser) => {
    try {
      await saveUserInFirestore(updatedUser);
      showToast(`Usuario "${updatedUser.nombre}" actualizado en Firestore.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserInFirestore(userId);
      showToast('Usuario eliminado de Firestore.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo eliminar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleSaveBusinessConfig = async (newConfig: BusinessConfig) => {
    try {
      await saveBusinessConfigInFirestore(newConfig);
      setBusinessConfig(newConfig);
      updateBusinessConfigFromFirestore(newConfig);
      showToast('Datos del negocio guardados y sincronizados en Firestore.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  return {
    handleLogin,
    handleLogout,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleSaveBusinessConfig
  };
}
