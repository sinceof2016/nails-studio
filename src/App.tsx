/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
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
import { AdminScreen } from './screens/AdminScreen';
import { UsersManagementScreen } from './screens/UsersManagementScreen';
import { ApiConsoleScreen } from './screens/ApiConsoleScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { BUSINESS_CONFIG } from './config/businessConfig';
import { getColombiaDateISO } from './utils/dateAndId';
import {
  Service,
  Specialist,
  ServiceCategory,
  Appointment,
  AppNotification,
  SalonCutRecord,
  ExpenseRecord,
  CashRegisterClose,
  SystemUser,
  AppTab,
  CookiePreferences,
  SlotLock
} from './types';
import {
  getCookieConsent,
  saveCookieConsent,
  acceptAllCookies,
  rejectNonEssentialCookies,
  revokeConsent,
  hasConsentAnswered
} from './services/cookieService';
import {
  getActiveUser,
  createSession,
  clearSession,
  touchSession,
  getActiveSession
} from './services/sessionManager';
import { logoutVault } from './services/securityVault';
import {
  NOTIFICATIONS,
  SERVICES,
  INITIAL_SERVICE_CATEGORIES,
  SPECIALISTS,
  ADMIN_USER,
  SYSTEM_USERS
} from './data/mockData';
import { doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  subscribeToAppointments,
  saveAppointmentWithLockInFirestore,
  updateAppointmentStatusInFirestore,
  reactivateAppointmentWithLockInFirestore,
  cancelAppointmentWithLockReleaseInFirestore,
  deleteAppointmentInFirestore,
  subscribeToSlotLocks,
  getSlotLockDocId,
  subscribeToSalonCuts,
  addSalonCutToFirestore,
  subscribeToExpenses,
  addExpenseToFirestore,
  subscribeToCashCloses,
  addCashCloseToFirestore
} from './services/firestoreService';

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
    const onUserAction = () => {
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

  // Limpieza de datos demo en montaje y versionado de localStorage v2
  useEffect(() => {
    try {
      localStorage.removeItem('pelu_system_users');
      localStorage.removeItem('aura_notifications');
      localStorage.removeItem('aura_current_user');
      localStorage.removeItem('pelu_services');
      localStorage.removeItem('pelu_specialists');
      localStorage.removeItem('pelu_service_categories');
    } catch {}
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

  // System users list (vacío en producción inicial)
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // Services catalog list (SuperAdmin editable)
  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem('pelu_v2_services');
      return saved ? JSON.parse(saved) : SERVICES;
    } catch {
      return SERVICES;
    }
  });

  // Service categories list (SuperAdmin editable)
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(() => {
    try {
      const saved = localStorage.getItem('pelu_v2_service_categories');
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_CATEGORIES;
    } catch {
      return INITIAL_SERVICE_CATEGORIES;
    }
  });

  // Specialists / Manicuristas list (SuperAdmin editable)
  const [specialists, setSpecialists] = useState<Specialist[]>(() => {
    try {
      const saved = localStorage.getItem('pelu_v2_specialists');
      return saved ? JSON.parse(saved) : SPECIALISTS;
    } catch {
      return SPECIALISTS;
    }
  });

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

  // Notifications State (datos en cero)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  // Cookie Handlers
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
    showToast('Tus preferencias de cookies han sido actualizadas.');
  };

  const handleRevokeCookies = () => {
    disableAnalytics();
    revokeConsent();
    setCookieConsent(null);
    setIsCookieBannerOpen(true);
    showToast('Consentimiento de cookies revocado. Puedes volver a configurar.');
  };

  const isStaff = Boolean(
    currentUser && ['SuperAdmin', 'Administrador', 'Caja'].includes(currentUser.rol)
  );
  const isCaja = currentUser?.rol === 'Caja';
  const branchFilter = isCaja ? currentUser.sucursalAsignada : undefined;

  // 1. Subscribe to public slot locks (siempre activo para prevenir doble reserva)
  useEffect(() => {
    const unsubLocks = subscribeToSlotLocks((data) => {
      setSlotLocks(data || []);
    });
    return () => unsubLocks();
  }, []);

  // 2. Subscribe to private Firestore collections in real-time (SOLO si hay usuario staff)
  useEffect(() => {
    if (!isStaff) {
      // Visitante: no tiene sesión de staff, no se suscribe a colecciones privadas
      return;
    }

    const unsubApts = subscribeToAppointments(
      (data) => {
        setAppointments(data || []);
      },
      (err) => console.warn('Error en suscripción de citas:', err)
    );

    const unsubCuts = subscribeToSalonCuts(
      (data) => {
        setCuts(data || []);
      },
      branchFilter,
      (err) => console.warn('Error en suscripción de cortes:', err)
    );

    const unsubExpenses = subscribeToExpenses(
      (data) => {
        setExpenses(data || []);
      },
      branchFilter,
      (err) => console.warn('Error en suscripción de gastos:', err)
    );

    const unsubCloses = subscribeToCashCloses(
      (data) => {
        setCashCloses(data || []);
      },
      branchFilter,
      (err) => console.warn('Error en suscripción de cierres:', err)
    );

    return () => {
      unsubApts();
      unsubCuts();
      unsubExpenses();
      unsubCloses();
    };
  }, [isStaff, branchFilter]);

  // Persist user and notifications
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('aura_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('aura_current_user');
      }
    } catch (e) {
      console.warn('Could not save user to localStorage', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_system_users', JSON.stringify(systemUsers));
    } catch (e) {
      console.warn('Could not save system users to localStorage', e);
    }
  }, [systemUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not save notifications to localStorage', e);
    }
  }, [notifications]);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    setAppointments((prev) => [newAppointment, ...prev]);
    showToast(`¡Cita ${newAppointment.bookingCode} confirmada exitosamente!`);
    trackBookingConfirmed(newAppointment.serviceId, BUSINESS_CONFIG.branchName);
  };

  const handleAddExpressAppointment = async (newAppointment: Appointment) => {
    await saveAppointmentWithLockInFirestore(newAppointment);
    setAppointments((prev) => [newAppointment, ...prev]);
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
    extra?: { date?: string; specialistId?: string; time?: string }
  ) => {
    const previous = appointments.find((a) => a.id === id);
    const date = extra?.date || previous?.date;
    const specialistId = extra?.specialistId || previous?.specialistId;
    const time = extra?.time || previous?.time;

    try {
      await deleteAppointmentInFirestore(id, { date, specialistId, time });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      showToast('Cita eliminada permanentemente y horario liberado.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar cita en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleRegisterCut = async (cut: SalonCutRecord) => {
    try {
      await addSalonCutToFirestore(cut);
      setCuts((prev) => [cut, ...prev]);
      showToast(`Cobro de ${cut.clienteNombre} registrado en caja.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrar el cobro en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleAddExpense = async (expense: ExpenseRecord) => {
    try {
      await addExpenseToFirestore(expense);
      setExpenses((prev) => [expense, ...prev]);
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
      setCashCloses((prev) => [close, ...prev]);
      showToast(`Arqueo de caja del día guardado en Firestore.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el arqueo de caja.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

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

  const handleAddUser = (newUser: SystemUser, password?: string) => {
    setSystemUsers((prev) => {
      const updated = [newUser, ...prev];
      try {
        localStorage.setItem('pelu_system_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Esta lista es solo local. Para dar acceso, crea la cuenta en la consola de Firebase y el perfil con el UID.');
  };

  const handleUpdateUser = (updatedUser: SystemUser, password?: string) => {
    setSystemUsers((prev) => {
      const updated = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      try {
        localStorage.setItem('pelu_system_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Usuario ${updatedUser.nombre} actualizado.`);
  };

  const handleDeleteUser = (userId: string) => {
    setSystemUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem('pelu_system_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Usuario eliminado del sistema.');
  };

  const handleAddService = (newService: Service) => {
    setServices((prev) => {
      const updated = [newService, ...prev];
      try {
        localStorage.setItem('pelu_services', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Servicio "${newService.name}" agregado a la carta.`);
  };

  const handleUpdateService = (updatedService: Service) => {
    setServices((prev) => {
      const updated = prev.map((s) => (s.id === updatedService.id ? updatedService : s));
      try {
        localStorage.setItem('pelu_services', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Servicio "${updatedService.name}" actualizado.`);
  };

  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => {
      const updated = prev.filter((s) => s.id !== serviceId);
      try {
        localStorage.setItem('pelu_services', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Servicio eliminado de la carta.');
  };

  const handleAddCategory = (newCategory: ServiceCategory) => {
    setServiceCategories((prev) => {
      const updated = [...prev, newCategory];
      try {
        localStorage.setItem('pelu_service_categories', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Tipo de servicio "${newCategory.label}" creado.`);
  };

  const handleUpdateCategory = (updatedCategory: ServiceCategory) => {
    setServiceCategories((prev) => {
      const updated = prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c));
      try {
        localStorage.setItem('pelu_service_categories', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Tipo de servicio "${updatedCategory.label}" actualizado.`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setServiceCategories((prev) => {
      const updated = prev.filter((c) => c.id !== categoryId);
      try {
        localStorage.setItem('pelu_service_categories', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Tipo de servicio eliminado.');
  };

  const handleAddSpecialist = (newSpecialist: Specialist) => {
    setSpecialists((prev) => {
      const updated = [newSpecialist, ...prev];
      try {
        localStorage.setItem('pelu_specialists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Manicurista "${newSpecialist.name}" registrada en el equipo.`);
  };

  const handleUpdateSpecialist = (updatedSpecialist: Specialist) => {
    setSpecialists((prev) => {
      const updated = prev.map((s) => (s.id === updatedSpecialist.id ? updatedSpecialist : s));
      try {
        localStorage.setItem('pelu_specialists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Manicurista "${updatedSpecialist.name}" actualizada.`);
  };

  const handleDeleteSpecialist = (specialistId: string) => {
    setSpecialists((prev) => {
      const updated = prev.filter((s) => s.id !== specialistId);
      try {
        localStorage.setItem('pelu_specialists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Manicurista eliminada del equipo.');
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
            services={services}
            specialists={specialists}
            serviceCategories={serviceCategories}
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
            onBookingSuccess={handleBookingSuccess}
            onNavigateToAppointments={() => handleNavigateTab('agenda')}
            onNavigateToServices={() => handleNavigateTab('servicios')}
            isPublicView={!currentUser}
            services={services}
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
          />
        )}

        {/* ADMIN VIEWS: AGENDA, COBRO, LIQUIDACIONES, CAJA, CLIENTES */}
        {(currentTab === 'agenda' ||
          currentTab === 'cobro' ||
          currentTab === 'liquidaciones' ||
          currentTab === 'caja' ||
          currentTab === 'clientes') && isStaff && currentUser ? (
          <AdminScreen
            admin={currentUser}
            currentUser={currentUser}
            appointments={appointments}
            cuts={cuts}
            expenses={expenses}
            cashCloses={cashCloses}
            services={services}
            specialists={specialists}
            onUpdateStatus={handleUpdateStatus}
            onCancelAppointment={(id) => handleUpdateStatus(id, 'cancelada')}
            onDeleteAppointment={handleDeleteAppointment}
            onNavigateToBooking={() => handleNavigateTab('reservar')}
            onRegisterCut={handleRegisterCut}
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
          <UsersManagementScreen
            currentUser={currentUser}
            systemUsers={systemUsers}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            services={services}
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
            onToast={showToast}
          />
        )}

        {/* CONSOLA DE API REST & ULTRAMSG - EXCLUSIVO PARA DAVID */}
        {currentTab === 'api' && currentUser && (
          <ApiConsoleScreen
            currentUser={currentUser}
            onSendFeedback={showToast}
          />
        )}

        {/* PANTALLA 404 PERSONALIZADA */}
        {currentTab === '404' && (
          <NotFoundScreen
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
          © {new Date().getFullYear()} {BUSINESS_CONFIG.brandName} · {BUSINESS_CONFIG.businessName} (NIT: {BUSINESS_CONFIG.nit}) · {BUSINESS_CONFIG.branchName} · {BUSINESS_CONFIG.address}, {BUSINESS_CONFIG.city}
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
      />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedServiceDetail}
        onClose={() => setSelectedServiceDetail(null)}
        onBookService={handleQuickBook}
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
