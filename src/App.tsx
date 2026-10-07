/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { LoginModal } from './components/LoginModal';
import { SpecialistModal } from './components/SpecialistModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { PromoModal } from './components/PromoModal';
import { CookieBanner } from './components/CookieBanner';
import { CookieSettingsModal } from './components/CookieSettingsModal';
import { CookiePolicyModal } from './components/CookiePolicyModal';
import { DataTreatmentPolicyModal } from './components/legal/DataTreatmentPolicyModal';
import { PrivacyNoticeModal } from './components/legal/PrivacyNoticeModal';
import { TermsAndConditionsModal } from './components/legal/TermsAndConditionsModal';
import { CancellationPolicyModal } from './components/legal/CancellationPolicyModal';
import { enableAnalytics, disableAnalytics, trackPageView, trackBookingConfirmed } from './services/analyticsService';
import { HomeScreen } from './screens/HomeScreen';
import { BookingScreen } from './screens/BookingScreen';
import { SpecialistsScreen } from './screens/SpecialistsScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { BUSINESS_CONFIG } from './config/businessConfig';
import { getColombiaDateISO } from './utils/dateAndId';
import {
  Service,
  Specialist,
  ServiceCategory,
  Appointment,
  SalonCutRecord,
  ExpenseRecord,
  CashRegisterClose,
  SystemUser,
  AppTab,
  CookiePreferences,
  SlotLock,
  AgendaBlock
} from './types';
import {
  getCookieConsent,
  hasConsentAnswered
} from './services/cookieService';
import {
  getActiveUser,
  touchSession,
  getActiveSession
} from './services/sessionManager';
import { SERVICES, INITIAL_SERVICE_CATEGORIES, SPECIALISTS, withBrandPhoto } from './data/mockData';
import { STORAGE_KEYS } from './config/storageKeys';
import { addUnique } from './utils/collections';
import {
  subscribeToAppointments,
  saveAppointmentWithLockInFirestore,
  updateAppointmentStatusInFirestore,
  reactivateAppointmentWithLockInFirestore,
  cancelAppointmentWithLockReleaseInFirestore,
  deleteAppointmentInFirestore,
  subscribeToSlotLocks,
  subscribeToAgendaBlocks,
  addAgendaBlocksInFirestore,
  deleteAgendaBlockInFirestore,
  subscribeToSalonCuts,
  addSalonCutToFirestore,
  deleteSalonCutFromFirestore,
  subscribeToExpenses,
  addExpenseToFirestore,
  subscribeToCashCloses,
  addCashCloseToFirestore,
  subscribeToServices,
  subscribeToSpecialists,
  subscribeToSpecialistsPrivate,
  subscribeToCategories,
  subscribeToBusinessConfig,
  subscribeToUsers
} from './services/firestoreService';
import { updateBusinessConfigFromFirestore, BusinessConfig } from './config/businessConfig';
import { useCatalogActions } from './hooks/useCatalogActions';
import { useUserActions } from './hooks/useUserActions';
import { useCookieActions } from './hooks/useCookieActions';
import { SpecialistPublic, SpecialistPrivate } from './types';

// Pantallas de personal: se descargan solo cuando alguien entra a ellas, no con la página pública
const AdminScreen = lazy(() => import('./screens/AdminScreen').then((m) => ({ default: m.AdminScreen })));
const UsersManagementScreen = lazy(() =>
  import('./screens/UsersManagementScreen').then((m) => ({ default: m.UsersManagementScreen }))
);
const ApiConsoleScreen = lazy(() => import('./screens/ApiConsoleScreen').then((m) => ({ default: m.ApiConsoleScreen })));

function ScreenLoading() {
  return (
    <div role="status" aria-live="polite" className="p-8 text-center text-xs text-[#5A4A43]">
      Cargando…
    </div>
  );
}

const TOUCH_SESSION_MIN_INTERVAL_MS = 15 * 1000;

export default function App() {
  // Current active tab: Defaults to 'reservar' as the primary home screen
  const [currentTab, setCurrentTab] = useState<AppTab>('reservar');

  // Active authenticated user: defaults to sessionManager validation (auto-expires on inactivity)
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => getActiveUser());

  // Auto-expiration watcher and user activity listener
  useEffect(() => {
    if (!currentUser) return;

    // Check expiration every 30 seconds
    const interval = setInterval(() => {
      const activeSession = getActiveSession();
      if (!activeSession) {
        setCurrentUser(null);
        setCurrentTab('reservar');
        showToast('Tu sesión ha expirado por inactividad. Por favor ingresa nuevamente.');
      }
    }, 30 * 1000);

    // Event listeners to refresh user activity
    // touchSession lee y escribe sessionStorage: basta con refrescar la actividad cada pocos segundos
    let lastTouch = 0;
    const onUserAction = () => {
      const now = Date.now();
      if (now - lastTouch < TOUCH_SESSION_MIN_INTERVAL_MS) return;
      lastTouch = now;
      touchSession();
    };

    window.addEventListener('click', onUserAction);
    window.addEventListener('keydown', onUserAction);
    window.addEventListener('touchstart', onUserAction);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', onUserAction);
      window.removeEventListener('keydown', onUserAction);
      window.removeEventListener('touchstart', onUserAction);
    };
  }, [currentUser]);

  // Helper to parse hash into AppTab
  const getTabFromHash = (hashStr: string): AppTab | null => {
    const clean = hashStr.replace(/^#\/?/, '').toLowerCase().trim();
    if (!clean) return null;
    const baseTab = clean.split('/')[0];
    if (['404', 'notfound', 'error'].includes(baseTab)) return '404';
    if (['servicios', 'carta'].includes(baseTab)) return 'servicios';
    if (['reservar', 'reserva', 'agendar', 'inicio'].includes(baseTab)) return 'reservar';
    if (['especialistas', 'manicuristas', 'equipo'].includes(baseTab)) return 'especialistas';
    if (['agenda', 'turnos', 'citas'].includes(baseTab)) return 'agenda';
    if (['cobro', 'cortes'].includes(baseTab)) return 'cobro';
    if (['liquidaciones', 'liquidacion'].includes(baseTab)) return 'liquidaciones';
    if (['caja', 'arqueo'].includes(baseTab)) return 'caja';
    if (['clientes', 'directorio'].includes(baseTab)) return 'clientes';
    if (['usuarios', 'personal', 'administracion'].includes(baseTab)) return 'usuarios';
    if (['api', 'consola'].includes(baseTab)) return 'api';
    return null;
  };

  const handleNavigateTab = (tab: AppTab) => {
    setCurrentTab(tab);
    const targetHash = `#/${tab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ tab }, '', targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for browser Back / Forward (popstate & hashchange)
  useEffect(() => {
    const handleUrlRoute = () => {
      const matchedTab = getTabFromHash(window.location.hash);
      if (matchedTab) {
        setCurrentTab((prev) => (prev !== matchedTab ? matchedTab : prev));
      } else if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        setCurrentTab('reservar');
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, []);

  // Cookie Management State (declared early for analytics effect)
  const [cookieConsent, setCookieConsent] = useState<CookiePreferences | null>(() => getCookieConsent());
  const [isCookieBannerOpen, setIsCookieBannerOpen] = useState<boolean>(() => !hasConsentAnswered());
  const [isCookieSettingsOpen, setIsCookieSettingsOpen] = useState<boolean>(false);
  const [isCookiePolicyOpen, setIsCookiePolicyOpen] = useState<boolean>(false);

  // Limpieza en el montaje de claves antiguas de localStorage que ya no se usan
  useEffect(() => {
    try {
      localStorage.removeItem('pelu_system_users');
      localStorage.removeItem('aura_notifications');
      localStorage.removeItem('aura_system_users');
      localStorage.removeItem('aura_current_user');
      localStorage.removeItem('pelu_services');
      localStorage.removeItem('pelu_specialists');
      localStorage.removeItem('pelu_service_categories');
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  // Analytics consent and page view tracking
  useEffect(() => {
    // Si aún no hay decisión de consentimiento (primera visita), no interactuar con Analytics
    if (!cookieConsent) {
      return;
    }

    if (cookieConsent.analytics) {
      enableAnalytics().then(() => {
        trackPageView(currentTab, window.location.hash || '#/' + currentTab);
      });
    } else {
      disableAnalytics();
    }
  }, [cookieConsent]);

  useEffect(() => {
    if (cookieConsent?.analytics) {
      trackPageView(currentTab, window.location.hash || '#/' + currentTab);
    }
  }, [currentTab, cookieConsent]);

  // System users list (vacío en producción inicial, sincronizado desde users/{uid} en Firestore)
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // Services catalog list (SuperAdmin editable, syncs with Firestore)
  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.services);
      return saved ? JSON.parse(saved) : SERVICES;
    } catch {
      return SERVICES;
    }
  });

  const servicesView = useMemo(() => services.map(withBrandPhoto), [services]);

  // Service categories list (SuperAdmin editable, syncs with Firestore)
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.categories);
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_CATEGORIES;
    } catch {
      return INITIAL_SERVICE_CATEGORIES;
    }
  });

  // Public specialists list (from Firestore specialists collection)
  const [publicSpecialists, setPublicSpecialists] = useState<SpecialistPublic[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.specialists);
      return saved ? JSON.parse(saved) : SPECIALISTS;
    } catch {
      return SPECIALISTS;
    }
  });

  // Private specialists map (commissionRate & phone - ONLY fetched for authenticated staff)
  const [privateSpecialistsMap, setPrivateSpecialistsMap] = useState<Record<string, SpecialistPrivate>>({});

  // Combined specialists list for the application (merges public profile + private commission/phone when staff)
  const specialists: Specialist[] = useMemo(() => {
    return publicSpecialists.map((pub) => {
      const priv = privateSpecialistsMap[pub.id];
      return {
        ...pub,
        commissionRate: typeof priv?.commissionRate === 'number' ? priv.commissionRate : (pub as Specialist).commissionRate ?? 50,
        phone: priv?.phone || (pub as Specialist).phone || '',
        telefono: priv?.phone || (pub as Specialist).telefono || ''
      };
    });
  }, [publicSpecialists, privateSpecialistsMap]);

  // Business Config state (settings/negocio)
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(() => ({ ...BUSINESS_CONFIG }));

  // Login Modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Appointments State (datos en cero)
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Cuts Ledger State (datos en cero)
  const [cuts, setCuts] = useState<SalonCutRecord[]>([]);

  // Expenses State (datos en cero)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Cash Closes State
  const [cashCloses, setCashCloses] = useState<CashRegisterClose[]>([]);

  // Slot Locks State (prevents double booking)
  const [slotLocks, setSlotLocks] = useState<SlotLock[]>([]);

  // Agenda Blocks State (bloqueos de día completo)
  const [agendaBlocks, setAgendaBlocks] = useState<AgendaBlock[]>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<Service | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Legal Modals State
  const [isDataPolicyOpen, setIsDataPolicyOpen] = useState(false);
  const [isPrivacyNoticeOpen, setIsPrivacyNoticeOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isCancellationPolicyOpen, setIsCancellationPolicyOpen] = useState(false);

  // Booking pre-fills
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [bookingSpecialist, setBookingSpecialist] = useState<Specialist | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  const isStaff = Boolean(
    currentUser && ['SuperAdmin', 'Administrador', 'Caja'].includes(currentUser.rol)
  );
  const isCaja = currentUser?.rol === 'Caja';
  const branchFilter = isCaja ? currentUser.sucursalAsignada : undefined;

  // Limpiar mapa privado de especialistas y usuarios si no hay sesión de personal
  useEffect(() => {
    if (!isStaff) {
      setPrivateSpecialistsMap({});
      setSystemUsers([]);
    }
  }, [isStaff]);

  // 1. Subscribe to public Firestore collections in real-time (servicios, manicuristas, categorías, datos negocio y bloqueos)
  useEffect(() => {
    const unsubLocks = subscribeToSlotLocks((data) => {
      setSlotLocks(data || []);
    });

    const unsubAgendaBlocks = subscribeToAgendaBlocks(
      (data) => {
        setAgendaBlocks(data || []);
      },
      getColombiaDateISO(),
      (err) => console.warn('Error en suscripción de bloqueos de agenda:', err)
    );

    const unsubServices = subscribeToServices((liveServices) => {
      if (Array.isArray(liveServices)) {
        if (liveServices.length > 0) {
          setServices(liveServices);
          try {
            localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(liveServices));
          } catch {
            /* localStorage no disponible */
          }
        } else {
          // Si Firestore está vacío (catálogo inicial aún no cargado), el visitante mantiene el catálogo local
          const saved = localStorage.getItem(STORAGE_KEYS.services);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setServices(Array.isArray(parsed) && parsed.length > 0 ? parsed : SERVICES);
            } catch {
              /* localStorage no disponible */
              setServices(SERVICES);
            }
          } else {
            setServices(SERVICES);
          }
        }
      }
    });

    const unsubSpecialists = subscribeToSpecialists((liveSpecialists) => {
      if (Array.isArray(liveSpecialists)) {
        if (liveSpecialists.length > 0) {
          setPublicSpecialists(liveSpecialists);
          try {
            localStorage.setItem(STORAGE_KEYS.specialists, JSON.stringify(liveSpecialists));
          } catch {
            /* localStorage no disponible */
          }
        } else {
          const saved = localStorage.getItem(STORAGE_KEYS.specialists);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setPublicSpecialists(Array.isArray(parsed) && parsed.length > 0 ? parsed : SPECIALISTS);
            } catch {
              /* localStorage no disponible */
              setPublicSpecialists(SPECIALISTS);
            }
          } else {
            setPublicSpecialists(SPECIALISTS);
          }
        }
      }
    });

    const unsubCategories = subscribeToCategories((liveCats) => {
      if (Array.isArray(liveCats)) {
        if (liveCats.length > 0) {
          setServiceCategories(liveCats);
          try {
            localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(liveCats));
          } catch {
            /* localStorage no disponible */
          }
        } else {
          const saved = localStorage.getItem(STORAGE_KEYS.categories);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setServiceCategories(Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SERVICE_CATEGORIES);
            } catch {
              /* localStorage no disponible */
              setServiceCategories(INITIAL_SERVICE_CATEGORIES);
            }
          } else {
            setServiceCategories(INITIAL_SERVICE_CATEGORIES);
          }
        }
      }
    });

    const unsubBusiness = subscribeToBusinessConfig((liveConfig) => {
      if (liveConfig) {
        updateBusinessConfigFromFirestore(liveConfig);
        setBusinessConfig((prev) => ({ ...prev, ...liveConfig }));
      }
    });

    return () => {
      unsubLocks();
      unsubAgendaBlocks();
      unsubServices();
      unsubSpecialists();
      unsubCategories();
      unsubBusiness();
    };
  }, []);

  // 2. Subscribe to private Firestore collections in real-time (SOLO si hay usuario staff)
  const permissionErrorShownRef = useRef<boolean>(false);

  useEffect(() => {
    permissionErrorShownRef.current = false;
  }, [currentUser?.id, currentUser?.rol, branchFilter]);

  useEffect(() => {
    if (!isStaff) {
      // Visitante: no tiene sesión de staff, no se suscribe a colecciones privadas
      return;
    }

    if (isCaja) {
      if (!currentUser?.sucursalAsignada || !currentUser.sucursalAsignada.trim()) {
        showToast('Tu usuario no tiene sede asignada. Pide al SuperAdmin que la configure.');
        return;
      }
      if (currentUser.sucursalAsignada === 'todas') {
        showToast('Tu usuario necesita una sede concreta o rol Administrador.');
        return;
      }
    }

    const handleSubError = (colName: string, phrase: string) => (err: unknown) => {
      console.warn(`Error en suscripción de ${colName}:`, err);
      if (!permissionErrorShownRef.current) {
        permissionErrorShownRef.current = true;
        showToast(`No tienes permiso para ver ${phrase}`);
      }
    };

    const unsubApts = subscribeToAppointments(
      (data) => {
        setAppointments(data || []);
      },
      handleSubError('citas', 'las citas')
    );

    const unsubCuts = subscribeToSalonCuts(
      (data) => {
        setCuts(data || []);
      },
      branchFilter,
      handleSubError('cortes', 'los cobros de esta sede')
    );

    const unsubExpenses = subscribeToExpenses(
      (data) => {
        setExpenses(data || []);
      },
      branchFilter,
      handleSubError('gastos', 'los gastos de esta sede')
    );

    const unsubCloses = subscribeToCashCloses(
      (data) => {
        setCashCloses(data || []);
      },
      branchFilter,
      handleSubError('cierres', 'los cierres de esta sede')
    );

    const unsubSpecialistsPriv = subscribeToSpecialistsPrivate(
      (privMap) => {
        setPrivateSpecialistsMap(privMap || {});
      },
      handleSubError('datos privados de especialistas', 'los datos de especialistas')
    );

    const canSubscribeUsers = currentUser?.rol === 'SuperAdmin' || currentUser?.rol === 'Administrador';
    let unsubUsers = () => {};

    if (canSubscribeUsers) {
      unsubUsers = subscribeToUsers(
        (liveUsers) => {
          setSystemUsers(liveUsers || []);
        },
        handleSubError('usuarios', 'los usuarios')
      );
    } else {
      setSystemUsers([]);
    }

    return () => {
      unsubApts();
      unsubCuts();
      unsubExpenses();
      unsubCloses();
      unsubSpecialistsPriv();
      unsubUsers();
    };
  }, [isStaff, isCaja, currentUser?.sucursalAsignada, currentUser?.rol, branchFilter]);

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3500);
  };

  const {
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
  } = useCatalogActions({
    services,
    setServices,
    serviceCategories,
    setServiceCategories,
    specialists,
    setSelectedServiceDetail,
    setSelectedSpecialist,
    showToast
  });

  const {
    handleAcceptAllCookies,
    handleRejectOptionalCookies,
    handleSaveCookiePreferences,
    handleRevokeCookies
  } = useCookieActions({
    setCookieConsent,
    setIsCookieBannerOpen,
    setIsCookieSettingsOpen,
    showToast
  });

  const {
    handleLogin,
    handleLogout,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleSaveBusinessConfig
  } = useUserActions({
    setCurrentUser,
    setSystemUsers,
    setBusinessConfig,
    handleNavigateTab,
    showToast
  });

  // Handlers
  const handleQuickBook = (service: Service) => {
    setBookingService(service);
    showToast(`${service.name} seleccionado`);
    handleNavigateTab('reservar');
  };

  const handleBookWithSpecialist = (specialist: Specialist) => {
    setBookingSpecialist(specialist);
    showToast(`Especialista ${specialist.name} asignada`);
    handleNavigateTab('reservar');
  };

  const handleApplyPromo = (percent: number) => {
    if (percent <= 0) {
      setPromoDiscount(0);
      handleNavigateTab('reservar');
      return;
    }
    setPromoDiscount(percent);
    const promoService = services.find((s) => s.id === 'manicura-rusa-glazed') || services[0];
    setBookingService(promoService);
    showToast(`¡${percent}% OFF aplicado con éxito!`);
    handleNavigateTab('reservar');
  };

  const handleBookingSuccess = (newAppointment: Appointment) => {
    setAppointments((prev) => addUnique(prev, newAppointment));
    showToast(`¡Cita ${newAppointment.bookingCode} confirmada exitosamente!`);
    trackBookingConfirmed(newAppointment.serviceId, BUSINESS_CONFIG.branchName);
  };

  const handleAddExpressAppointment = async (newAppointment: Appointment) => {
    await saveAppointmentWithLockInFirestore(newAppointment);
    setAppointments((prev) => addUnique(prev, newAppointment));
    showToast(`¡Turno express ${newAppointment.bookingCode} guardado en Firestore!`);
  };

  const handleUpdateStatus = async (id: string, newStatus: Appointment['status']) => {
    const previous = appointments.find((a) => a.id === id);
    if (!previous || previous.status === newStatus) return;

    if (newStatus === 'cancelada') {
      try {
        await cancelAppointmentWithLockReleaseInFirestore(previous);
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'cancelada' as const } : a))
        );
        showToast('Cita cancelada y horario liberado.');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al cancelar la cita en Firestore.';
        showToast(`⚠ Error: ${msg}`);
      }
      return;
    }

    if (previous.status === 'cancelada' && (newStatus === 'confirmada' || newStatus === 'en_preparacion')) {
      try {
        await reactivateAppointmentWithLockInFirestore(previous, newStatus);
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
        showToast(`✓ Cita reactivada con éxito. Horario bloqueado. Estado: ${newStatus === 'en_preparacion' ? 'En Cabina' : 'Confirmada'}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al reactivar la cita en Firestore.';
        showToast(`⚠ ${msg}`);
      }
      return;
    }

    try {
      await updateAppointmentStatusInFirestore(id, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      showToast(`✓ Estado actualizado: ${newStatus === 'en_preparacion' ? 'En Cabina' : newStatus === 'completada' ? 'Completada' : newStatus}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar estado en Firestore.';
      showToast(`⚠ Error: ${msg}`);
    }
  };

  const handleDeleteAppointment = async (
    id: string,
    extra?: { date?: string; specialistId?: string; time?: string; serviceDuration?: number }
  ) => {
    const previous = appointments.find((a) => a.id === id);
    const date = extra?.date || previous?.date;
    const specialistId = extra?.specialistId || previous?.specialistId;
    const time = extra?.time || previous?.time;
    const serviceDuration = extra?.serviceDuration ?? previous?.serviceDuration;

    try {
      await deleteAppointmentInFirestore(id, { date, specialistId, time, serviceDuration });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      showToast('Cita eliminada permanentemente y horario liberado.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar cita en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleAddAgendaBlocks = async (specialistIds: string[], dates: string[]) => {
    try {
      const total = await addAgendaBlocksInFirestore(specialistIds, dates);
      showToast(`✓ Agenda bloqueada: ${total} ${total === 1 ? 'día' : 'días'}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al bloquear la agenda.';
      showToast(`⚠ No se pudo bloquear la agenda: ${msg}`);
      throw error;
    }
  };

  const handleRemoveAgendaBlock = async (blockId: string) => {
    try {
      await deleteAgendaBlockInFirestore(blockId);
      showToast('✓ Agenda desbloqueada.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al desbloquear la agenda.';
      showToast(`⚠ No se pudo desbloquear la agenda: ${msg}`);
      throw error;
    }
  };

  const handleRegisterCut = async (cut: SalonCutRecord) => {
    try {
      await addSalonCutToFirestore(cut);
      setCuts((prev) => addUnique(prev, cut));
      showToast(`Cobro de ${cut.clienteNombre} registrado en caja.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrar el cobro en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleDeleteCut = async (cutId: string) => {
    try {
      await deleteSalonCutFromFirestore(cutId);
      setCuts((prev) => prev.filter((c) => c.id !== cutId));
      showToast('✓ Cobro anulado exitosamente.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al anular el cobro en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleAddExpense = async (expense: ExpenseRecord) => {
    try {
      await addExpenseToFirestore(expense);
      setExpenses((prev) => addUnique(prev, expense));
      showToast(`Gasto registrado en caja menor.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrar el gasto en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleSaveCashClose = async (close: CashRegisterClose) => {
    try {
      await addCashCloseToFirestore(close);
      setCashCloses((prev) => addUnique(prev, close));
      showToast(`Arqueo de caja del día guardado en Firestore.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el arqueo de caja.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const activeAppointmentsCount = appointments.filter(
    (a) => a.status === 'confirmada' || a.status === 'en_preparacion'
  ).length;

  // Map Admin Tab
  const getAdminInitialTab = (tab: AppTab): 'agenda' | 'caja' | 'cortes' | 'clientes' => {
    if (tab === 'cobro' || tab === 'caja') return 'caja';
    if (tab === 'liquidaciones') return 'cortes';
    if (tab === 'clientes') return 'clientes';
    return 'agenda';
  };

  return (
    <div className="min-h-screen bg-[#F4EFE9] text-[#2B2420] flex flex-col font-sans selection:bg-[#C6BDAC]/50 selection:text-[#2B2420]">
      {/* Background Subtle Accent Pattern */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#F4EFE9]" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(#C6BDAC_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      </div>

      {/* Unified Header with exact user pill */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigateTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        activeAppointmentsCount={activeAppointmentsCount}
      />

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* SERVICIOS */}
        {currentTab === 'servicios' && (
          <HomeScreen
            onQuickBook={handleQuickBook}
            onOpenSpecialist={setSelectedSpecialist}
            onOpenPromo={() => setIsPromoModalOpen(true)}
            onOpenServiceDetail={setSelectedServiceDetail}
            onOpenCookieSettings={() => setIsCookieSettingsOpen(true)}
            onOpenCookiePolicy={() => setIsCookiePolicyOpen(true)}
            services={servicesView}
            specialists={specialists}
            serviceCategories={serviceCategories}
            currentUser={currentUser}
            onUpdateServiceImage={handleUpdateServiceImage}
          />
        )}

        {/* RESERVAR CITA (PÁGINA PRINCIPAL) */}
        {currentTab === 'reservar' && (
          <BookingScreen
            initialService={bookingService}
            initialSpecialist={bookingSpecialist}
            promoDiscountPercent={promoDiscount}
            appointments={appointments}
            slotLocks={slotLocks}
            agendaBlocks={agendaBlocks}
            onBookingSuccess={handleBookingSuccess}
            onNavigateToAppointments={() => handleNavigateTab('agenda')}
            onNavigateToServices={() => handleNavigateTab('servicios')}
            isPublicView={!currentUser}
            services={servicesView}
            specialists={specialists}
            showToast={showToast}
            onOpenDataPolicy={() => setIsDataPolicyOpen(true)}
            onOpenPrivacyNotice={() => setIsPrivacyNoticeOpen(true)}
            onOpenTerms={() => setIsTermsOpen(true)}
          />
        )}

        {/* ESPECIALISTAS */}
        {currentTab === 'especialistas' && (
          <SpecialistsScreen
            onBookWithSpecialist={handleBookWithSpecialist}
            onOpenSpecialistModal={setSelectedSpecialist}
            specialists={specialists}
            currentUser={currentUser}
            onUpdateSpecialistAvatar={handleUpdateSpecialistAvatar}
          />
        )}

        {/* ADMIN VIEWS: AGENDA, COBRO, LIQUIDACIONES, CAJA, CLIENTES */}
        {(currentTab === 'agenda' ||
          currentTab === 'cobro' ||
          currentTab === 'liquidaciones' ||
          currentTab === 'caja' ||
          currentTab === 'clientes') && isStaff && currentUser ? (
          <Suspense fallback={<ScreenLoading />}>
          <AdminScreen
            admin={currentUser}
            currentUser={currentUser}
            appointments={appointments}
            cuts={cuts}
            expenses={expenses}
            cashCloses={cashCloses}
            services={servicesView}
            specialists={specialists}
            agendaBlocks={agendaBlocks}
            onAddAgendaBlocks={handleAddAgendaBlocks}
            onRemoveAgendaBlock={handleRemoveAgendaBlock}
            onUpdateStatus={handleUpdateStatus}
            onCancelAppointment={(id) => handleUpdateStatus(id, 'cancelada')}
            onDeleteAppointment={handleDeleteAppointment}
            onNavigateToBooking={() => handleNavigateTab('reservar')}
            onRegisterCut={handleRegisterCut}
            onDeleteCut={handleDeleteCut}
            onAddExpense={handleAddExpense}
            onSaveCashClose={handleSaveCashClose}
            onAddAppointment={handleAddExpressAppointment}
            onToast={showToast}
            initialTab={getAdminInitialTab(currentTab)}
            onTabChange={(adminTab) => {
              if (adminTab === 'agenda') handleNavigateTab('agenda');
              else if (adminTab === 'caja') handleNavigateTab('caja');
              else if (adminTab === 'cortes') handleNavigateTab('liquidaciones');
              else if (adminTab === 'clientes') handleNavigateTab('clientes');
            }}
          />
          </Suspense>
        ) : (currentTab === 'agenda' ||
          currentTab === 'cobro' ||
          currentTab === 'liquidaciones' ||
          currentTab === 'caja' ||
          currentTab === 'clientes') ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#C6BDAC] max-w-md mx-auto my-8 space-y-3">
            <span className="material-symbols-outlined text-[48px] text-[#BB9C87]">lock</span>
            <h3 className="text-lg font-bold text-[#2B2420]">Acceso Exclusivo para Personal</h3>
            <p className="text-xs text-[#5A4A43]">
              Para ingresar al panel de control de La Pelu SPA debes iniciar sesión con tu cuenta verificada.
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Iniciar Sesión
            </button>
          </div>
        ) : null}

        {/* GESTIÓN DE USUARIOS, SERVICIOS, CATEGORÍAS & MANICURISTAS - EXCLUSIVO PARA SUPERADMIN */}
        {currentTab === 'usuarios' && currentUser && (
          <Suspense fallback={<ScreenLoading />}>
          <UsersManagementScreen
            currentUser={currentUser}
            systemUsers={systemUsers}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            services={servicesView}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
            serviceCategories={serviceCategories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            specialists={specialists}
            onAddSpecialist={handleAddSpecialist}
            onUpdateSpecialist={handleUpdateSpecialist}
            onDeleteSpecialist={handleDeleteSpecialist}
            businessConfig={businessConfig}
            onSaveBusinessConfig={handleSaveBusinessConfig}
            onToast={showToast}
          />
          </Suspense>
        )}

        {/* CONSOLA DE API REST & ULTRAMSG - EXCLUSIVO PARA DAVID */}
        {currentTab === 'api' && currentUser && (
          <Suspense fallback={<ScreenLoading />}>
          <ApiConsoleScreen
            currentUser={currentUser}
            onSendFeedback={showToast}
          />
          </Suspense>
        )}

        {/* PANTALLA 404 PERSONALIZADA */}
        {currentTab === '404' && (
          <NotFoundScreen
            services={servicesView}
            onNavigateHome={() => setCurrentTab('servicios')}
            onNavigateToBooking={() => setCurrentTab('reservar')}
            onNavigateToSpecialists={() => setCurrentTab('especialistas')}
            onSelectService={(service) => {
              setBookingService(service);
              setCurrentTab('reservar');
            }}
          />
        )}
      </main>

      {/* Footer del Santuario con acceso a políticas y prueba de 404 */}
      <footer className="mt-12 border-t border-[#C6BDAC]/70 bg-[#F4EFE9]/90 py-7 px-4 text-center text-xs text-[#5A4A43] space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold">
          <button onClick={() => setCurrentTab('servicios')} className="hover:text-[#2B2420] cursor-pointer">
            Servicios &amp; Carta
          </button>
          <span>·</span>
          <button onClick={() => setCurrentTab('reservar')} className="hover:text-[#2B2420] cursor-pointer">
            Reservas Online
          </button>
          <span>·</span>
          <button onClick={() => setCurrentTab('especialistas')} className="hover:text-[#2B2420] cursor-pointer">
            Especialistas
          </button>
          <span>·</span>
          <button onClick={() => setIsDataPolicyOpen(true)} className="hover:text-[#2B2420] cursor-pointer underline">
            Política de Datos
          </button>
          <span>·</span>
          <button onClick={() => setIsPrivacyNoticeOpen(true)} className="hover:text-[#2B2420] cursor-pointer underline">
            Aviso de Privacidad
          </button>
          <span>·</span>
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-[#2B2420] cursor-pointer underline">
            Términos y Condiciones
          </button>
          <span>·</span>
          <button onClick={() => setIsCancellationPolicyOpen(true)} className="hover:text-[#2B2420] cursor-pointer underline">
            Política de Cancelación
          </button>
          <span>·</span>
          <button onClick={() => setIsCookiePolicyOpen(true)} className="hover:text-[#2B2420] cursor-pointer underline">
            Política de Cookies
          </button>
          <span>·</span>
          <button
            onClick={() => setCurrentTab('404')}
            className={`cursor-pointer flex items-center gap-1 transition-colors ${
              currentTab === '404' ? 'text-[#2B2420] font-bold underline' : 'text-[#5A4A43] hover:text-[#2B2420]'
            }`}
            title="Ver pantalla de error 404 personalizada"
          >
            <span className="material-symbols-outlined text-[14px]">link_off</span>
            <span>Vista 404</span>
          </button>
        </div>
        <p className="text-[11px] text-[#5A4A43]">
          © {new Date().getFullYear()} {businessConfig.brandName} · {businessConfig.businessName} (NIT: {businessConfig.nit}) · {businessConfig.branchName} · {businessConfig.address}, {businessConfig.city}
        </p>
      </footer>

      {/* Login & User Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        systemUsers={systemUsers}
      />

      {/* Global Toast */}
      <Toast
        message={toastMessage}
        onView={() => {
          if (!toastMessage) return;
          const lower = toastMessage.toLowerCase();
          if (currentUser) {
            if (lower.includes('cita') || lower.includes('turno') || lower.includes('mesa lista') || lower.includes('recordatorio')) {
              handleNavigateTab('agenda');
            } else if (lower.includes('cobro') || lower.includes('gasto') || lower.includes('arqueo')) {
              handleNavigateTab('caja');
            } else if (lower.includes('liquidación') || lower.includes('liquidacion')) {
              handleNavigateTab('liquidaciones');
            }
          }
        }}
        onClose={() => setToastMessage(null)}
      />

      {/* Specialist Profile Modal */}
      <SpecialistModal
        specialist={selectedSpecialist}
        onClose={() => setSelectedSpecialist(null)}
        onBookWithSpecialist={handleBookWithSpecialist}
        currentUser={currentUser}
        onUpdateSpecialistAvatar={handleUpdateSpecialistAvatar}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedServiceDetail}
        onClose={() => setSelectedServiceDetail(null)}
        onBookService={handleQuickBook}
        currentUser={currentUser}
        onUpdateServiceImage={handleUpdateServiceImage}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Experience & Ritual Modal */}
      <PromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        onApplyPromo={handleApplyPromo}
        onNavigateToBooking={() => {
          setCurrentTab('reservar');
          setIsPromoModalOpen(false);
        }}
      />

      {/* Cookie Consent Banner */}
      <CookieBanner
        isOpen={isCookieBannerOpen}
        onAcceptAll={handleAcceptAllCookies}
        onRejectOptional={handleRejectOptionalCookies}
        onOpenSettings={() => setIsCookieSettingsOpen(true)}
        onOpenPolicy={() => setIsCookiePolicyOpen(true)}
      />

      {/* Cookie Granular Settings Modal */}
      <CookieSettingsModal
        isOpen={isCookieSettingsOpen}
        onClose={() => setIsCookieSettingsOpen(false)}
        currentPreferences={cookieConsent}
        onSavePreferences={handleSaveCookiePreferences}
        onAcceptAll={handleAcceptAllCookies}
        onRejectOptional={handleRejectOptionalCookies}
        onRevokeAll={handleRevokeCookies}
        onOpenPolicy={() => {
          setIsCookieSettingsOpen(false);
          setIsCookiePolicyOpen(true);
        }}
      />

      {/* Cookie & Privacy Policy Modal */}
      <CookiePolicyModal
        isOpen={isCookiePolicyOpen}
        onClose={() => setIsCookiePolicyOpen(false)}
        onOpenSettings={() => {
          setIsCookiePolicyOpen(false);
          setIsCookieSettingsOpen(true);
        }}
        onOpenDataPolicy={() => {
          setIsCookiePolicyOpen(false);
          setIsDataPolicyOpen(true);
        }}
      />

      {/* Legal Modals */}
      <DataTreatmentPolicyModal
        isOpen={isDataPolicyOpen}
        onClose={() => setIsDataPolicyOpen(false)}
      />
      <PrivacyNoticeModal
        isOpen={isPrivacyNoticeOpen}
        onClose={() => setIsPrivacyNoticeOpen(false)}
        onOpenFullPolicy={() => {
          setIsPrivacyNoticeOpen(false);
          setIsDataPolicyOpen(true);
        }}
      />
      <TermsAndConditionsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onOpenCancellationPolicy={() => {
          setIsTermsOpen(false);
          setIsCancellationPolicyOpen(true);
        }}
      />
      <CancellationPolicyModal
        isOpen={isCancellationPolicyOpen}
        onClose={() => setIsCancellationPolicyOpen(false)}
      />

      {/* Floating Cookie Settings Trigger (Persistent) */}
      <button
        type="button"
        onClick={() => setIsCookieSettingsOpen(true)}
        title="Centro de Preferencias de Cookies"
        className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#5A4A43] shadow-[0_4px_16px_rgba(28,28,24,0.18)] border border-[#C6BDAC]/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-xs group"
        aria-label="Abrir centro de preferencias de cookies"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">cookie</span>
      </button>
    </div>
  );
}
