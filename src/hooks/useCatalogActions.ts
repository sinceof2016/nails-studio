import type { Dispatch, SetStateAction } from 'react';
import type { Service, ServiceCategory, Specialist } from '../types';
import { STORAGE_KEYS } from '../config/storageKeys';
import {
  saveServiceInFirestore,
  deleteServiceInFirestore,
  saveCategoryInFirestore,
  deleteCategoryInFirestore,
  saveSpecialistInFirestore,
  deleteSpecialistInFirestore
} from '../services/firestoreService';

interface UseCatalogActionsParams {
  services: Service[];
  setServices: Dispatch<SetStateAction<Service[]>>;
  serviceCategories?: ServiceCategory[];
  setServiceCategories: Dispatch<SetStateAction<ServiceCategory[]>>;
  specialists: Specialist[];
  setSelectedServiceDetail: Dispatch<SetStateAction<Service | null>>;
  setSelectedSpecialist: Dispatch<SetStateAction<Specialist | null>>;
  showToast: (message: string) => void;
}

export function useCatalogActions({
  services,
  setServices,
  setServiceCategories,
  specialists,
  setSelectedServiceDetail,
  setSelectedSpecialist,
  showToast
}: UseCatalogActionsParams) {
  const handleAddService = async (newService: Service) => {
    try {
      await saveServiceInFirestore(newService);
      setServices((prev) => {
        const updated = [newService, ...prev.filter((s) => s.id !== newService.id)];
        try {
          localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(updated));
        } catch {
          /* localStorage no disponible */
        }
        return updated;
      });
      showToast(`Servicio "${newService.name}" guardado y sincronizado.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleUpdateService = async (updatedService: Service) => {
    try {
      await saveServiceInFirestore(updatedService);
      setServices((prev) => {
        const updated = prev.map((s) => (s.id === updatedService.id ? updatedService : s));
        try {
          localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(updated));
        } catch {
          /* localStorage no disponible */
        }
        return updated;
      });
      showToast(`Servicio "${updatedService.name}" actualizado y sincronizado.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleUpdateServiceImage = async (serviceId: string, newImage: string) => {
    const target = services.find((s) => s.id === serviceId);
    if (!target) return;
    const updatedService: Service = { ...target, image: newImage };
    try {
      await saveServiceInFirestore(updatedService);
      setServices((prev) => {
        const updated = prev.map((s) => (s.id === serviceId ? updatedService : s));
        try {
          localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(updated));
        } catch {
          /* localStorage no disponible */
        }
        return updated;
      });
      setSelectedServiceDetail((prev) => (prev && prev.id === serviceId ? { ...prev, image: newImage } : prev));
      showToast('Foto del servicio guardada y sincronizada en todos los servidores.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteServiceInFirestore(serviceId);
      setServices((prev) => {
        const updated = prev.filter((s) => s.id !== serviceId);
        try {
          if (updated.length > 0) {
            localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(updated));
          } else {
            localStorage.removeItem(STORAGE_KEYS.services);
          }
        } catch {
          /* localStorage no disponible */
        }
        return updated;
      });
      showToast('Servicio eliminado y sincronizado.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo eliminar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleAddCategory = async (newCategory: ServiceCategory) => {
    try {
      await saveCategoryInFirestore(newCategory);
      setServiceCategories((prev) => {
        const updated = [...prev.filter((c) => c.id !== newCategory.id), newCategory];
        try {
          localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(updated));
        } catch {
          /* localStorage no disponible */
        }
        return updated;
      });
      showToast(`Tipo de servicio "${newCategory.label}" creado y sincronizado.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleUpdateCategory = async (updatedCategory: ServiceCategory) => {
    try {
      await saveCategoryInFirestore(updatedCategory);
      setServiceCategories((prev) => {
        const updated = prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c));
        try {
          localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(updated));
        } catch {
          /* localStorage no disponible */
        }
        return updated;
      });
      showToast(`Tipo de servicio "${updatedCategory.label}" actualizado y sincronizado.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryInFirestore(categoryId);
      setServiceCategories((prev) => {
        const updated = prev.filter((c) => c.id !== categoryId);
        try {
          if (updated.length > 0) {
            localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(updated));
          } else {
            localStorage.removeItem(STORAGE_KEYS.categories);
          }
        } catch {
          /* localStorage no disponible */
        }
        return updated;
      });
      showToast('Tipo de servicio eliminado y sincronizado.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo eliminar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleAddSpecialist = async (newSpecialist: Specialist) => {
    try {
      await saveSpecialistInFirestore(newSpecialist);
      showToast(`Manicurista "${newSpecialist.name}" registrada y sincronizada en Firestore.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleUpdateSpecialist = async (updatedSpecialist: Specialist) => {
    try {
      await saveSpecialistInFirestore(updatedSpecialist);
      showToast(`Manicurista "${updatedSpecialist.name}" actualizada y sincronizada en Firestore.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleUpdateSpecialistAvatar = async (specialistId: string, newAvatar: string) => {
    const target = specialists.find((s) => s.id === specialistId);
    if (!target) return;
    const updated = { ...target, avatar: newAvatar };
    try {
      await saveSpecialistInFirestore(updated);
      setSelectedSpecialist((prev) => (prev && prev.id === specialistId ? { ...prev, avatar: newAvatar } : prev));
      showToast('Foto de la especialista guardada y sincronizada en Firestore.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo guardar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  const handleDeleteSpecialist = async (specialistId: string) => {
    try {
      await deleteSpecialistInFirestore(specialistId);
      showToast('Manicurista eliminada de Firestore.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`No se pudo eliminar en el servidor: ${msg}. El cambio NO se publicó.`);
      throw err;
    }
  };

  return {
    handleAddService,
    handleUpdateService,
    handleUpdateServiceImage,
    handleDeleteService,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddSpecialist,
    handleUpdateSpecialist,
    handleUpdateSpecialistAvatar,
    handleDeleteSpecialist
  };
}
