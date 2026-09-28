/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { LoginModal } from './components/LoginModal';
import { SpecialistModal } from './components/SpecialistModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { PromoModal } from './components/PromoModal';
import { CookieBanner } from './components/CookieBanner';
import { CookieSettingsModal } from './components/CookieSettingsModal';
import { CookiePolicyModal } from './components/CookiePolicyModal';
import { HomeScreen } from './screens/HomeScreen';
import { BookingScreen } from './screens/BookingScreen';
import { SpecialistsScreen } from './screens/SpecialistsScreen';
import { AdminScreen } from './screens/AdminScreen';
import { UsersManagementScreen } from './screens/UsersManagementScreen';
import { ApiConsoleScreen } from './screens/ApiConsoleScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import {
  Service,
  Specialist,
  Appointment,
  AppNotification,
  SalonCutRecord,
  ExpenseRecord,
  CashRegisterClose,
  SystemUser,
  AppTab,
  CookiePreferences
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
import {
  INITIAL_APPOINTMENTS,
  NOTIFICATIONS,
  SERVICES,
  ADMIN_USER,
  SYSTEM_USERS,
  DAVID_USER
} from './data/mockData';
import {
  subscribeToAppointments,
  saveAppointmentToFirestore,
  updateAppointmentStatusInFirestore,
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

  const handleNavigateTab = (tab: AppTab) => {
    setCurrentTab(tab);
    if (tab === 'reservar' || tab === 'servicios') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Listen for hash / path changes to route to 404 or specific tabs
  useEffect(() => {
    const handleUrlRoute = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === '404' || hash === 'notfound' || hash === 'error') {
        setCurrentTab('404');
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, []);

  // System users list
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem('aura_system_users');
      return saved ? JSON.parse(saved) : SYSTEM_USERS;
    } catch {
      return SYSTEM_USERS;
    }
  });

  // Login Modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Appointments State with Firestore sync
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);

  // Cuts Ledger State in COP
  const [cuts, setCuts] = useState<SalonCutRecord[]>([
    {
      id: 'cut-01',
      fecha: 'Hoy, 27 Sept',
      hora: '10:30 AM',
      clienteNombre: 'Mariana Duque Valenzuela',
      clienteTelefono: '+57 312 849 2011',
      servicioNombre: 'Manicura Rusa Glazed Donut',
      servicioPrecio: 95000,
      especialistaId: 'valentina',
      especialistaNombre: 'Valentina R.',
      comisionPorcentaje: 50,
      comisionEspecialista: 47500,
      recaudoSalon: 47500,
      propina: 10000,
      metodoPago: 'efectivo',
      sucursalId: 'chico'
    },
    {
      id: 'cut-02',
      fecha: 'Hoy, 27 Sept',
      hora: '01:15 PM',
      clienteNombre: 'Dra. Carolina Restrepo',
      clienteTelefono: '+57 315 902 3341',
      servicioNombre: 'Soft Gel & Minimalist Pastel Art',
      servicioPrecio: 145000,
      especialistaId: 'camila',
      especialistaNombre: 'Camila M.',
      comisionPorcentaje: 50,
      comisionEspecialista: 72500,
      recaudoSalon: 72500,
      propina: 15000,
      metodoPago: 'nequi_daviplata',
      sucursalId: 'chico'
    }
  ]);

  // Expenses State in COP
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: 'exp-01',
      fecha: 'Hoy, 27 Sept',
      concepto: 'Kits desechables de esterilización & guantes de nitrilo',
      categoria: 'insumos',
      monto: 45000,
      sucursalId: 'chico',
      registradoPor: 'Lucía Santamaría'
    }
  ]);

  // Cash Closes State
  const [cashCloses, setCashCloses] = useState<CashRegisterClose[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('aura_notifications');
      return saved ? JSON.parse(saved) : NOTIFICATIONS;
    } catch {
      return NOTIFICATIONS;
    }
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<Service | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Cookie Management State
  const [cookieConsent, setCookieConsent] = useState<CookiePreferences | null>(() => getCookieConsent());
  const [isCookieBannerOpen, setIsCookieBannerOpen] = useState<boolean>(() => !hasConsentAnswered());
  const [isCookieSettingsOpen, setIsCookieSettingsOpen] = useState<boolean>(false);
  const [isCookiePolicyOpen, setIsCookiePolicyOpen] = useState<boolean>(false);

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
    revokeConsent();
    setCookieConsent(null);
    setIsCookieBannerOpen(true);
    showToast('Consentimiento de cookies revocado. Puedes volver a configurar.');
  };

  // Subscribe to Firestore collections in real-time
  useEffect(() => {
    const unsubApts = subscribeToAppointments((data) => {
      if (data && data.length > 0) {
        setAppointments(data);
      }
    });

    const unsubCuts = subscribeToSalonCuts((data) => {
      if (data && data.length > 0) {
        setCuts(data);
      }
    });

    const unsubExpenses = subscribeToExpenses((data) => {
      if (data && data.length > 0) {
        setExpenses(data);
      }
    });

    const unsubCloses = subscribeToCashCloses((data) => {
      if (data && data.length > 0) {
        setCashCloses(data);
      }
    });

    return () => {
      unsubApts();
      unsubCuts();
      unsubExpenses();
      unsubCloses();
    };
  }, []);

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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Handlers
  const handleQuickBook = (service: Service) => {
    setBookingService(service);
    showToast(`${service.name} seleccionado`);
    setCurrentTab('reservar');
  };

  const handleBookWithSpecialist = (specialist: Specialist) => {
    setBookingSpecialist(specialist);
    showToast(`Especialista ${specialist.name} asignada`);
    setCurrentTab('reservar');
  };

  const handleApplyPromo = (percent: number) => {
    setPromoDiscount(percent);
    const promoService = SERVICES.find((s) => s.id === 'manicura-rusa-glazed') || SERVICES[0];
    setBookingService(promoService);
    showToast(`¡${percent}% OFF aplicado con éxito!`);
    setCurrentTab('reservar');
  };

  const handleBookingSuccess = async (newAppointment: Appointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
    await saveAppointmentToFirestore(newAppointment);
    showToast(`¡Cita ${newAppointment.bookingCode} confirmada & notificada por WhatsApp!`);
  };

  const handleUpdateStatus = async (id: string, newStatus: Appointment['status']) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    await updateAppointmentStatusInFirestore(id, newStatus);
    showToast(`Estado actualizado: ${newStatus}`);
  };

  const handleCancelAppointment = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelada' as const } : a))
    );
    await updateAppointmentStatusInFirestore(id, 'cancelada');
    showToast('Cita cancelada.');
  };

  const handleRegisterCut = async (cut: SalonCutRecord) => {
    setCuts((prev) => [cut, ...prev]);
    await addSalonCutToFirestore(cut);
    showToast(`Cobro de ${cut.clienteNombre} registrado en caja.`);
  };

  const handleAddExpense = async (expense: ExpenseRecord) => {
    setExpenses((prev) => [expense, ...prev]);
    await addExpenseToFirestore(expense);
    showToast(`Gasto registrado en caja menor.`);
  };

  const handleSaveCashClose = async (close: CashRegisterClose) => {
    setCashCloses((prev) => [close, ...prev]);
    await addCashCloseToFirestore(close);
    showToast(`Arqueo de caja del día guardado en Firestore.`);
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

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setCurrentTab('servicios');
    showToast('Sesión cerrada. Ahora estás en Modo Público.');
  };

  const handleAddUser = (newUser: SystemUser) => {
    setSystemUsers((prev) => [newUser, ...prev]);
    showToast(`Usuario ${newUser.nombre} creado exitosamente.`);
  };

  const handleUpdateUser = (updatedUser: SystemUser) => {
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    showToast(`Usuario ${updatedUser.nombre} actualizado.`);
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
    <div className="min-h-screen bg-[#FFF8F5] text-[#221A14] flex flex-col font-sans selection:bg-[#C49756] selection:text-[#FFFFFF]">
      {/* Background Subtle Accent Pattern */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#FFF8F5]" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(#DFCBB5_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Unified Header with exact user pill */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigateTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
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
          />
        )}

        {/* RESERVAR CITA (PÁGINA PRINCIPAL) */}
        {currentTab === 'reservar' && (
          <BookingScreen
            initialService={bookingService}
            initialSpecialist={bookingSpecialist}
            promoDiscountPercent={promoDiscount}
            appointments={appointments}
            onBookingSuccess={handleBookingSuccess}
            onNavigateToAppointments={() => setCurrentTab('agenda')}
            onNavigateToServices={() => setCurrentTab('servicios')}
            isPublicView={!currentUser}
          />
        )}

        {/* ESPECIALISTAS */}
        {currentTab === 'especialistas' && (
          <SpecialistsScreen
            onBookWithSpecialist={handleBookWithSpecialist}
            onOpenSpecialistModal={setSelectedSpecialist}
          />
        )}

        {/* ADMIN VIEWS: AGENDA, COBRO, LIQUIDACIONES, CAJA, CLIENTES */}
        {(currentTab === 'agenda' ||
          currentTab === 'cobro' ||
          currentTab === 'liquidaciones' ||
          currentTab === 'caja' ||
          currentTab === 'clientes') && (
          <AdminScreen
            admin={ADMIN_USER}
            appointments={appointments}
            cuts={cuts}
            expenses={expenses}
            cashCloses={cashCloses}
            onUpdateStatus={handleUpdateStatus}
            onCancelAppointment={handleCancelAppointment}
            onNavigateToBooking={() => setCurrentTab('reservar')}
            onRegisterCut={handleRegisterCut}
            onAddExpense={handleAddExpense}
            onSaveCashClose={handleSaveCashClose}
            onAddAppointment={handleBookingSuccess}
            onToast={showToast}
            initialTab={getAdminInitialTab(currentTab)}
            onTabChange={(adminTab) => {
              if (adminTab === 'agenda') setCurrentTab('agenda');
              else if (adminTab === 'caja') setCurrentTab('caja');
              else if (adminTab === 'cortes') setCurrentTab('liquidaciones');
              else if (adminTab === 'clientes') setCurrentTab('clientes');
            }}
          />
        )}

        {/* GESTIÓN DE USUARIOS - EXCLUSIVO PARA DAVID */}
        {currentTab === 'usuarios' && currentUser && (
          <UsersManagementScreen
            currentUser={currentUser}
            systemUsers={systemUsers}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
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
      <footer className="mt-12 border-t border-[#DFCBB5]/50 bg-[#FFF8F5]/80 py-7 px-4 text-center text-xs text-[#6F5A4B] space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
          <button onClick={() => setCurrentTab('servicios')} className="hover:text-[#221A14] cursor-pointer">
            Servicios &amp; Carta
          </button>
          <span>·</span>
          <button onClick={() => setCurrentTab('reservar')} className="hover:text-[#221A14] cursor-pointer">
            Reservas Online
          </button>
          <span>·</span>
          <button onClick={() => setCurrentTab('especialistas')} className="hover:text-[#221A14] cursor-pointer">
            Especialistas
          </button>
          <span>·</span>
          <button onClick={() => setIsCookiePolicyOpen(true)} className="hover:text-[#221A14] cursor-pointer">
            Políticas &amp; Cookies
          </button>
          <span>·</span>
          <button
            onClick={() => setCurrentTab('404')}
            className={`cursor-pointer flex items-center gap-1 transition-colors ${
              currentTab === '404' ? 'text-[#7C571C] font-bold underline' : 'text-[#827474] hover:text-[#7C571C]'
            }`}
            title="Ver pantalla de error 404 personalizada"
          >
            <span className="material-symbols-outlined text-[14px]">link_off</span>
            <span>Vista 404</span>
          </button>
        </div>
        <p className="text-[11px] text-[#827474]">
          © {new Date().getFullYear()} Aura Nails &amp; Spa · Santuario de Belleza · Chicó Calle 85, Bogotá · WhatsApp (+57) 312 849 2011
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
          if (currentUser && currentTab !== 'agenda') {
            setCurrentTab('agenda');
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

      {/* Promotional Modal */}
      <PromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        onApplyPromo={handleApplyPromo}
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
      />

      {/* Floating Cookie Settings Trigger (Persistent) */}
      <button
        type="button"
        onClick={() => setIsCookieSettingsOpen(true)}
        title="Centro de Preferencias de Cookies"
        className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#7c5357] shadow-[0_4px_16px_rgba(28,28,24,0.18)] border border-[#e8b4b8]/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-xs group"
        aria-label="Abrir centro de preferencias de cookies"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">cookie</span>
      </button>
    </div>
  );
}
