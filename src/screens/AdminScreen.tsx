import React, { useState, useMemo, useEffect } from 'react';
import {
  Appointment,
  AdminUser,
  SystemUser,
  SalonCutRecord,
  ExpenseRecord,
  CashRegisterClose,
  ClientProfile,
  PaymentMethod,
  Service,
  Specialist,
  AgendaBlock
} from '../types';
import { QrCodeModal } from '../components/QrCodeModal';
import { ClientHistoryModal } from '../components/ClientHistoryModal';
import { UltraMsgConfigModal } from '../components/UltraMsgConfigModal';
import { formatCOP } from '../utils/format';
import { sendUltraMsgWhatsApp, getUltraMsgConfig, renderTemplate } from '../services/whatsappService';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { getColombiaDateISO, formatDisplayDate } from '../utils/dateAndId';
import { HOURLY_TIME_SLOTS } from '../utils/calendarAvailability';
import { AgendaBlockModal } from '../components/admin/modals/AgendaBlockModal';

// Subcomponents for tabs and modals
import { AdminAgendaTab } from '../components/admin/tabs/AdminAgendaTab';
import { AdminCajaTab } from '../components/admin/tabs/AdminCajaTab';
import { AdminCortesTab, SpecialistLiquidationItem } from '../components/admin/tabs/AdminCortesTab';
import { AdminClientesTab } from '../components/admin/tabs/AdminClientesTab';
import { AdminTabNav } from '../components/admin/AdminTabNav';
import { useAdminSubmitActions } from '../hooks/useAdminSubmitActions';
import {
  getAgendaStats,
  filterCutsByDate,
  filterExpensesByDate,
  calculateCashIncome,
  calculateDigitalIncome,
  calculateTotalExpenses,
  calculateSpecialistsLiquidation,
  calculateClientProfiles
} from '../utils/adminCalculations';
import { ExpressAppointmentModal } from '../components/admin/modals/ExpressAppointmentModal';
import { NewCutModal } from '../components/admin/modals/NewCutModal';
import { NewExpenseModal } from '../components/admin/modals/NewExpenseModal';
import { CashCloseModal } from '../components/admin/modals/CashCloseModal';

interface AdminScreenProps {
  admin: AdminUser | SystemUser;
  currentUser?: SystemUser | null;
  appointments: Appointment[];
  cuts: SalonCutRecord[];
  expenses: ExpenseRecord[];
  cashCloses: CashRegisterClose[];
  services: Service[];
  specialists: Specialist[];
  agendaBlocks?: AgendaBlock[];
  onAddAgendaBlocks?: (specialistIds: string[], dates: string[]) => Promise<void>;
  onRemoveAgendaBlock?: (blockId: string) => Promise<void>;
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => Promise<void> | void;
  onCancelAppointment: (appointmentId: string) => Promise<void> | void;
  onDeleteAppointment?: (appointmentId: string, extra?: { date?: string; specialistId?: string; time?: string; serviceDuration?: number }) => Promise<void> | void;
  onNavigateToBooking: () => void;
  onRegisterCut: (cut: SalonCutRecord) => Promise<void>;
  onAddExpense: (expense: ExpenseRecord) => Promise<void>;
  onSaveCashClose: (close: CashRegisterClose) => Promise<void>;
  onAddAppointment?: (appointment: Appointment) => Promise<void>;
  onDeleteCut?: (cutId: string) => Promise<void>;
  onToast?: (message: string) => void;
  initialTab?: 'agenda' | 'caja' | 'cortes' | 'clientes';
  onTabChange?: (tab: 'agenda' | 'caja' | 'cortes' | 'clientes') => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  admin,
  currentUser,
  appointments,
  cuts,
  expenses,
  cashCloses,
  services,
  specialists,
  agendaBlocks = [],
  onAddAgendaBlocks,
  onRemoveAgendaBlock,
  onUpdateStatus,
  onCancelAppointment,
  onDeleteAppointment,
  onNavigateToBooking,
  onRegisterCut,
  onDeleteCut,
  onAddExpense,
  onSaveCashClose,
  onAddAppointment,
  onToast,
  initialTab = 'agenda',
  onTabChange
}) => {
  // Navigation tabs within Admin
  const isCajaRole = (currentUser?.rol || ('rol' in admin ? admin.rol : admin.role)) === 'Caja';
  const effectiveInitialTab = isCajaRole && initialTab === 'cortes' ? 'agenda' : initialTab;
  const [activeAdminTab, setActiveAdminTab] = useState<'agenda' | 'caja' | 'cortes' | 'clientes'>(effectiveInitialTab);

  // Fecha seleccionada para la jornada de caja y liquidación (ISO Colombia)
  const [selectedDate, setSelectedDate] = useState<string>(getColombiaDateISO());

  // Base inicial en caja (editable)
  const [cashBase, setCashBase] = useState<number>(200000);

  // Modal para bloquear agenda
  const [showAgendaBlockModal, setShowAgendaBlockModal] = useState(false);

  useEffect(() => {
    if (initialTab) {
      if (isCajaRole && initialTab === 'cortes') {
        setActiveAdminTab('agenda');
      } else {
        setActiveAdminTab(initialTab);
      }
    }
  }, [initialTab, isCajaRole]);

  const handleSelectTab = (tab: 'agenda' | 'caja' | 'cortes' | 'clientes') => {
    if (isCajaRole && tab === 'cortes') return;
    setActiveAdminTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const notify = (msg: string) => {
    if (onToast) onToast(msg);
  };

  // Active user details
  const activeUserName = currentUser?.nombre || ('nombre' in admin ? admin.nombre : admin.name) || 'Personal de Salón';
  const activeUserRole = currentUser?.rol || ('rol' in admin ? admin.rol : admin.role) || 'Caja';
  const activeBranchId = currentUser?.sucursalAsignada || ('branchId' in admin ? admin.branchId : 'santuario-patio-bonito') || 'santuario-patio-bonito';
  const activeBranchName = BUSINESS_CONFIG.branchName;

  // Filters for Agenda
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [specialistFilter, setSpecialistFilter] = useState<string>('todos');
  const [selectedAppointmentForQr, setSelectedAppointmentForQr] = useState<Appointment | null>(null);
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [isUltraMsgModalOpen, setIsUltraMsgModalOpen] = useState(false);

  // Client History Modal state
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<ClientProfile | null>(null);

  // 1. WALK-IN / TURNO EXPRESS MODAL STATE
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressClientName, setExpressClientName] = useState('');
  const [expressClientPhone, setExpressClientPhone] = useState('+57 3');
  const [expressServiceId, setExpressServiceId] = useState(services[0]?.id || 'manicura-rusa-glazed');
  const [expressSpecialistId, setExpressSpecialistId] = useState(specialists[0]?.id || 'valentina-r');
  const [expressTime, setExpressTime] = useState(HOURLY_TIME_SLOTS[0] || '10:00 AM');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [expressStatus, setExpressStatus] = useState<'en_preparacion' | 'confirmada'>('en_preparacion');
  const [expressNotes, setExpressNotes] = useState('');
  const [expressSendWhatsApp, setExpressSendWhatsApp] = useState(true);
  const [expressValidationError, setExpressValidationError] = useState<string | null>(null);
  const [isSubmittingExpress, setIsSubmittingExpress] = useState(false);

  // 2. NEW CUT MODAL STATE
  const [showNewCutModal, setShowNewCutModal] = useState(false);
  const [selectedAppointmentIdForCut, setSelectedAppointmentIdForCut] = useState<string>('');
  const [cutClientName, setCutClientName] = useState('');
  const [cutClientPhone, setCutClientPhone] = useState('');
  const [cutServiceName, setCutServiceName] = useState(services[0]?.name || 'Manicura Rusa Glazed Donut');
  const [cutServicePrice, setCutServicePrice] = useState(services[0]?.price || 95000);
  const [cutSpecialistId, setCutSpecialistId] = useState(specialists[0]?.id || 'valentina-r');
  const [cutPaymentMethod, setCutPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cutTip, setCutTip] = useState(0);
  const [cutNote, setCutNote] = useState('');
  const [cutValidationError, setCutValidationError] = useState<string | null>(null);
  const [isSubmittingCut, setIsSubmittingCut] = useState(false);

  // Fast trigger to open cut modal with prefilled data from an appointment
  const handleOpenCutForAppointment = (apt: Appointment) => {
    setSelectedAppointmentIdForCut(apt.id);
    setCutClientName(apt.clientName);
    setCutClientPhone(apt.clientPhone);
    const matched = services.find(
      (s) => s.id === apt.serviceId || s.name.toLowerCase() === apt.serviceName.toLowerCase()
    );
    if (matched) {
      setCutServiceName(matched.name);
      setCutServicePrice(apt.totalPrice || matched.price);
    } else {
      setCutServiceName(apt.serviceName);
      setCutServicePrice(apt.totalPrice || apt.servicePrice || 0);
    }
    if (apt.specialistId) {
      setCutSpecialistId(apt.specialistId);
    }
    setCutNote(`Cita #${apt.bookingCode} · ${apt.date} ${apt.time}`);
    setShowNewCutModal(true);
  };

  // Split Payment & Cash change state
  const [cutMontoEfectivo, setCutMontoEfectivo] = useState(50000);
  const [cutMontoDigital, setCutMontoDigital] = useState(45000);
  const [cutDigitalMethod, setCutDigitalMethod] = useState<'nequi_daviplata' | 'tarjeta_datafono'>('nequi_daviplata');
  const [cutCashReceived, setCutCashReceived] = useState<number>(100000);

  // Sync split digital amount when total or cash amount changes
  useEffect(() => {
    const totalToPay = cutServicePrice + cutTip;
    if (cutPaymentMethod === 'mixto') {
      const remaining = Math.max(0, totalToPay - cutMontoEfectivo);
      setCutMontoDigital(remaining);
    }
  }, [cutServicePrice, cutTip, cutMontoEfectivo, cutPaymentMethod]);

  // 3. NEW EXPENSE MODAL STATE
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(45000);
  const [expenseCategory, setExpenseCategory] = useState<'insumos' | 'servicios' | 'mantenimiento' | 'caja_menor'>('insumos');
  const [expenseValidationError, setExpenseValidationError] = useState<string | null>(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // 4. CASH CLOSE MODAL STATE
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState(200000);
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Agenda stats
  const {
    totalCount,
    confirmedCount,
    inPrepCount,
    completedCount,
    canceledCount
  } = useMemo(() => getAgendaStats(appointments), [appointments]);

  // FILTRAR REGISTROS DE COBROS Y GASTOS POR LA FECHA SELECCIONADA
  const dayCuts = useMemo(() => {
    return filterCutsByDate(cuts, selectedDate);
  }, [cuts, selectedDate]);

  const dayExpenses = useMemo(() => {
    return filterExpensesByDate(expenses, selectedDate);
  }, [expenses, selectedDate]);

  // Daily totals calculation in COP based on selected date
  const totalCashIncome = useMemo(() => {
    return calculateCashIncome(dayCuts);
  }, [dayCuts]);

  const totalDigitalIncome = useMemo(() => {
    return calculateDigitalIncome(dayCuts);
  }, [dayCuts]);

  const totalExpensesAmount = useMemo(() => {
    return calculateTotalExpenses(dayExpenses);
  }, [dayExpenses]);

  const expectedCashInHand = cashBase + totalCashIncome - totalExpensesAmount;

  // Specialists liquidation breakdown for selected date
  const specialistsLiquidation: SpecialistLiquidationItem[] = useMemo(() => {
    return calculateSpecialistsLiquidation(specialists, dayCuts);
  }, [specialists, dayCuts]);

  // Clients database synthesized with safe normalization
  const clientProfiles: ClientProfile[] = useMemo(() => {
    return calculateClientProfiles(appointments);
  }, [appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchStatus = filterStatus === 'todos' || apt.status === filterStatus;
      const matchSpecialist =
        specialistFilter === 'todos' || apt.specialistId === specialistFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        q === '' ||
        (apt.clientName || '').toLowerCase().includes(q) ||
        (apt.bookingCode || '').toLowerCase().includes(q) ||
        (apt.serviceName || '').toLowerCase().includes(q) ||
        (apt.specialistName || '').toLowerCase().includes(q);
      return matchStatus && matchSpecialist && matchQuery;
    });
  }, [appointments, filterStatus, specialistFilter, searchQuery]);

  // 1-CLIC FAST DISPATCHES FOR AGENDA
  const handleQuickReminder = async (apt: Appointment) => {
    const msg = `✨ *${BUSINESS_CONFIG.brandName} - Recordatorio de Cita* ✨\n\nHola ${apt.clientName}, te recordamos tu cita de *${apt.serviceName}* agendada para hoy a las *${apt.time}* con ${apt.specialistName}.\n\n📍 ${BUSINESS_CONFIG.address}, ${BUSINESS_CONFIG.city}.\n🎫 Código: ${apt.bookingCode}\n\n¡Te esperamos con una copa de cortesía! 💅🥂`;

    const res = await sendUltraMsgWhatsApp({
      phone: apt.clientPhone,
      message: msg,
      clientName: apt.clientName,
      bookingCode: apt.bookingCode
    });
    if (res.messageId && !res.messageId.startsWith('static-wa-')) {
      notify(`✓ Recordatorio enviado a ${apt.clientName} por WhatsApp`);
    } else {
      notify(`✓ Recordatorio preparado para ${apt.clientName} (modo estático)`);
    }
  };

  const handleTableReady = async (apt: Appointment) => {
    const msg = `🌟 *${BUSINESS_CONFIG.brandName} - Tu Mesa está Lista* 🌟\n\n¡Hola ${apt.clientName}! Tu especialista ${apt.specialistName} ya tiene todo esterilizado y preparado en cabina para tu *${apt.serviceName}*.\n\nPuedes pasar a recepción cuando gustes. ¡Bienvenida a tu santuario de belleza! 💆‍♀️✨`;

    const res = await sendUltraMsgWhatsApp({
      phone: apt.clientPhone,
      message: msg,
      clientName: apt.clientName,
      bookingCode: apt.bookingCode
    });
    if (res.messageId && !res.messageId.startsWith('static-wa-')) {
      notify(`✓ Notificación de "Mesa Lista" enviada a ${apt.clientName}`);
    } else {
      notify(`✓ Notificación de "Mesa Lista" preparada para ${apt.clientName} (modo estático)`);
    }
  };

  // SEND SPECIALIST LIQUIDATION VIA WHATSAPP (al teléfono de la especialista)
  const handleSendSpecialistLiquidation = async (spec: SpecialistLiquidationItem) => {
    const dateStr = formatDisplayDate(selectedDate);
    const msg = `✨ *${BUSINESS_CONFIG.brandName.toUpperCase()} - LIQUIDACIÓN DEL DÍA* ✨\n\n` +
      `👤 *Especialista:* ${spec.name}\n` +
      `📅 *Fecha:* ${dateStr}\n` +
      `🏢 *Sede:* ${BUSINESS_CONFIG.address}, ${BUSINESS_CONFIG.city}\n\n` +
      `💅 *Servicios Realizados:* ${spec.cutsCount} (${formatCOP(spec.totalServices)})\n` +
      `⭐ *Tu Comisión (${spec.commissionRate}%):* ${formatCOP(spec.totalCommission)}\n` +
      `🎁 *Propinas en Efectivo:* ${formatCOP(spec.totalTips)}\n` +
      `---------------------------------\n` +
      `💰 *TOTAL A RECIBIR HOY: ${formatCOP(spec.payoutTotal)}*\n\n` +
      `¡Excelente jornada de trabajo y gracias por tu dedicación! 💖💅`;

    const targetPhone = spec.telefono || spec.phone || BUSINESS_CONFIG.phone || '';

    const res = await sendUltraMsgWhatsApp({
      phone: targetPhone,
      message: msg,
      clientName: spec.name,
      bookingCode: `LIQ-${spec.id.toUpperCase()}`
    });
    if (res.messageId && !res.messageId.startsWith('static-wa-')) {
      notify(`✓ Reporte de liquidación enviado a ${spec.name} por WhatsApp.`);
    } else {
      notify(`✓ Reporte de liquidación generado para ${spec.name} (modo estático).`);
    }
  };

  const {
    handleCreateExpressAppointment,
    handleSubmitCut,
    handleSubmitExpense,
    handleSaveClose
  } = useAdminSubmitActions({
    expressClientName,
    setExpressClientName,
    expressClientPhone,
    expressServiceId,
    expressSpecialistId,
    expressTime,
    expressStatus,
    expressNotes,
    setExpressNotes,
    expressSendWhatsApp,
    setExpressValidationError,
    setIsSubmittingExpress,
    setShowExpressModal,

    selectedAppointmentIdForCut,
    setSelectedAppointmentIdForCut,
    cutClientName,
    setCutClientName,
    cutClientPhone,
    cutServiceName,
    cutServicePrice,
    cutSpecialistId,
    cutPaymentMethod,
    cutTip,
    cutNote,
    setCutNote,
    cutMontoEfectivo,
    cutMontoDigital,
    cutDigitalMethod,
    setCutValidationError,
    setIsSubmittingCut,
    setShowNewCutModal,

    expenseConcept,
    setExpenseConcept,
    expenseAmount,
    expenseCategory,
    setExpenseValidationError,
    setIsSubmittingExpense,
    setShowExpenseModal,

    countedCash,
    setIsSubmittingClose,
    setShowCloseModal,
    cashBase,
    selectedDate,
    totalCashIncome,
    totalDigitalIncome,
    totalExpensesAmount,
    expectedCashInHand,

    appointments,
    services,
    specialists,
    agendaBlocks,
    activeBranchId,
    activeUserName,
    onAddAppointment,
    onRegisterCut,
    onUpdateStatus,
    onAddExpense,
    onSaveCashClose,
    notify
  });

  const handleStatusChangeWithNotification = async (
    apt: Appointment,
    newStatus: Appointment['status']
  ) => {
    await onUpdateStatus(apt.id, newStatus);

    const ultraConfig = getUltraMsgConfig();
    if (ultraConfig.autoNotifyStatusChange) {
      const statusLabel =
        newStatus === 'en_preparacion'
          ? 'En Cabina (En Preparación)'
          : newStatus === 'completada'
          ? 'Completada / Finalizada'
          : newStatus === 'confirmada'
          ? 'Confirmada Oficial'
          : 'Cancelada';

      const msg = renderTemplate(ultraConfig.statusChangeTemplate, {
        cliente: apt.clientName,
        codigo: apt.bookingCode,
        servicio: apt.serviceName,
        fecha: formatDisplayDate(apt.date),
        hora: apt.time,
        sede: `${BUSINESS_CONFIG.address}, ${BUSINESS_CONFIG.city}`,
        estado: statusLabel,
        monto: formatCOP(apt.totalPrice ?? apt.servicePrice ?? 0)
      });

      await sendUltraMsgWhatsApp({
        phone: apt.clientPhone,
        message: msg,
        clientName: apt.clientName,
        bookingCode: apt.bookingCode
      });
    }
  };

  const canVoidCut = !isCajaRole;

  const handleVoidCut = async (cut: SalonCutRecord) => {
    if (!canVoidCut) return;
    const confirmed = window.confirm(
      `¿Estás seguro de anular el cobro de ${cut.clienteNombre} (${formatCOP(cut.servicioPrecio + cut.propina)})? La cita asociada quedará disponible para cobrar nuevamente.`
    );
    if (!confirmed) return;
    try {
      if (onDeleteCut) {
        await onDeleteCut(cut.id);
      }
      notify('✓ Cobro anulado exitosamente.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al anular el cobro en Firestore.';
      notify(`⚠ Error: ${msg}`);
    }
  };

  // Calculate quick change for cash payment
  const targetCashToPay =
    cutPaymentMethod === 'efectivo'
      ? cutServicePrice + cutTip
      : cutPaymentMethod === 'mixto'
      ? cutMontoEfectivo
      : 0;
  const cashChange = Math.max(0, cutCashReceived - targetCashToPay);

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Admin Credentials & Quick Highlights Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#F4EFE9] via-[#C6BDAC]/30 to-[#F4EFE9] p-6 sm:p-7 text-[#2B2420] border border-[#C6BDAC]/80 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#C6BDAC]/40 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#2B2420] text-white flex items-center justify-center font-bold text-lg ring-2 ring-[#2B2420]/25 shadow-xs">
              {activeUserName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#2B2420]">
                  {activeUserName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#BB9C87]/20 text-[#2B2420] text-[10px] font-bold tracking-wider uppercase border border-[#BB9C87]/40">
                  ★ {activeUserRole}
                </span>
              </div>
              <p className="text-xs text-[#5A4A43]">{activeBranchName} · Panel de Control</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-medium border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Conexión Activa
            </span>
          </div>
        </div>

        {/* Quick Metrics in COP */}
        <div className="pt-4 border-t border-[#C6BDAC]/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center relative z-10">
          <div className="p-2.5 rounded-2xl bg-white/80 border border-[#C6BDAC]/50 shadow-2xs">
            <span className="text-[10px] text-[#5A4A43] block uppercase tracking-wider font-semibold">Citas Registradas</span>
            <strong className="text-base sm:text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#2B2420]">{totalCount}</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-[#C6BDAC]/50 shadow-2xs">
            <span className="text-[10px] text-[#5A4A43] block uppercase tracking-wider font-semibold">Caja en Gaveta</span>
            <strong className={`text-base sm:text-lg font-bold font-mono ${expectedCashInHand < 0 ? 'text-rose-700' : 'text-[#2B2420]'}`}>
              {formatCOP(expectedCashInHand)}
            </strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-[#C6BDAC]/50 shadow-2xs">
            <span className="text-[10px] text-[#5A4A43] block uppercase tracking-wider font-semibold">Cobros ({formatDisplayDate(selectedDate)})</span>
            <strong className="text-base sm:text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#2B2420]">{dayCuts.length}</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-[#C6BDAC]/50 shadow-2xs">
            <span className="text-[10px] text-[#5A4A43] block uppercase tracking-wider font-semibold">Directorio Clientes</span>
            <strong className="text-base sm:text-lg font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
              {clientProfiles.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Internal Sub-Navigation Tabs */}
      <AdminTabNav
        activeAdminTab={activeAdminTab}
        onSelectTab={handleSelectTab}
        isCajaRole={isCajaRole}
        totalCount={totalCount}
        clientProfilesCount={clientProfiles.length}
        onOpenUltraMsgModal={() => setIsUltraMsgModalOpen(true)}
      />

      {/* 1. AGENDA TAB */}
      {activeAdminTab === 'agenda' && (
        <AdminAgendaTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenExpressModal={() => setShowExpressModal(true)}
          onNavigateToBooking={onNavigateToBooking}
          specialistFilter={specialistFilter}
          setSpecialistFilter={setSpecialistFilter}
          appointments={appointments}
          cuts={cuts}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          totalCount={totalCount}
          confirmedCount={confirmedCount}
          inPrepCount={inPrepCount}
          completedCount={completedCount}
          canceledCount={canceledCount}
          filteredAppointments={filteredAppointments}
          expandedAptId={expandedAptId}
          setExpandedAptId={setExpandedAptId}
          onQuickReminder={handleQuickReminder}
          onTableReady={handleTableReady}
          onStatusChangeWithNotification={handleStatusChangeWithNotification}
          onSelectAppointmentForQr={setSelectedAppointmentForQr}
          onOpenCutForAppointment={handleOpenCutForAppointment}
          onDeleteAppointment={onDeleteAppointment ? (apt) => onDeleteAppointment(apt.id, { date: apt.date, specialistId: apt.specialistId, time: apt.time, serviceDuration: apt.serviceDuration }) : undefined}
          userRole={activeUserRole}
          specialists={specialists}
          agendaBlocks={agendaBlocks}
          canManageBlocks={!isCajaRole && Boolean(onAddAgendaBlocks)}
          onOpenBlockModal={() => setShowBlockModal(true)}
          onRemoveBlock={onRemoveAgendaBlock ? (id) => { onRemoveAgendaBlock(id).catch(() => undefined); } : undefined}
        />
      )}

      {/* 2. CAJA & ARQUEO TAB */}
      {activeAdminTab === 'caja' && (
        <AdminCajaTab
          cuts={dayCuts}
          allExpenses={dayExpenses}
          cashBase={cashBase}
          totalCashIncome={totalCashIncome}
          totalExpensesAmount={totalExpensesAmount}
          expectedCashInHand={expectedCashInHand}
          totalDigitalIncome={totalDigitalIncome}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          branchName={activeBranchName}
          registeredBy={activeUserName}
          onOpenNewCutModal={() => setShowNewCutModal(true)}
          onOpenExpenseModal={() => setShowExpenseModal(true)}
          onOpenCloseModal={() => setShowCloseModal(true)}
          canVoidCut={canVoidCut}
          onVoidCut={handleVoidCut}
        />
      )}

      {/* 3. CORTES & LIQUIDACIÓN TAB (Oculto para rol Caja) */}
      {activeAdminTab === 'cortes' && !isCajaRole && (
        <AdminCortesTab
          specialistsLiquidation={specialistsLiquidation}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          branchName={activeBranchName}
          registeredBy={activeUserName}
          onSendSpecialistLiquidation={handleSendSpecialistLiquidation}
        />
      )}

      {/* 4. CLIENTES TAB */}
      {activeAdminTab === 'clientes' && (
        <AdminClientesTab
          clientProfiles={clientProfiles}
          onSelectClientForHistory={setSelectedClientForHistory}
        />
      )}

      {/* MODAL: BLOQUEAR AGENDA (solo SuperAdmin y Administrador) */}
      {!isCajaRole && onAddAgendaBlocks && (
        <AgendaBlockModal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          specialists={specialists}
          appointments={appointments}
          existingBlocks={agendaBlocks}
          onSubmit={onAddAgendaBlocks}
        />
      )}

      {/* MODAL 1: WALK-IN / TURNO EXPRESS */}
      <ExpressAppointmentModal
        isOpen={showExpressModal}
        onClose={() => setShowExpressModal(false)}
        expressClientName={expressClientName}
        setExpressClientName={setExpressClientName}
        expressClientPhone={expressClientPhone}
        setExpressClientPhone={setExpressClientPhone}
        expressServiceId={expressServiceId}
        setExpressServiceId={setExpressServiceId}
        expressSpecialistId={expressSpecialistId}
        setExpressSpecialistId={setExpressSpecialistId}
        expressTime={expressTime}
        setExpressTime={setExpressTime}
        expressStatus={expressStatus}
        setExpressStatus={setExpressStatus}
        expressNotes={expressNotes}
        setExpressNotes={setExpressNotes}
        expressSendWhatsApp={expressSendWhatsApp}
        setExpressSendWhatsApp={setExpressSendWhatsApp}
        expressValidationError={expressValidationError}
        services={services}
        specialists={specialists}
        isSubmitting={isSubmittingExpress}
        onSubmit={handleCreateExpressAppointment}
      />

      {/* MODAL 2: NUEVO CORTE / COBRO */}
      <NewCutModal
        isOpen={showNewCutModal}
        onClose={() => {
          setShowNewCutModal(false);
          setSelectedAppointmentIdForCut('');
        }}
        cutClientName={cutClientName}
        setCutClientName={setCutClientName}
        cutClientPhone={cutClientPhone}
        setCutClientPhone={setCutClientPhone}
        cutServiceName={cutServiceName}
        setCutServiceName={setCutServiceName}
        cutServicePrice={cutServicePrice}
        setCutServicePrice={setCutServicePrice}
        cutTip={cutTip}
        setCutTip={setCutTip}
        cutSpecialistId={cutSpecialistId}
        setCutSpecialistId={setCutSpecialistId}
        cutNote={cutNote}
        setCutNote={setCutNote}
        cutPaymentMethod={cutPaymentMethod}
        setCutPaymentMethod={setCutPaymentMethod}
        cutMontoEfectivo={cutMontoEfectivo}
        setCutMontoEfectivo={setCutMontoEfectivo}
        cutMontoDigital={cutMontoDigital}
        cutDigitalMethod={cutDigitalMethod}
        setCutDigitalMethod={setCutDigitalMethod}
        cutCashReceived={cutCashReceived}
        setCutCashReceived={setCutCashReceived}
        targetCashToPay={targetCashToPay}
        cashChange={cashChange}
        cutValidationError={cutValidationError}
        services={services}
        specialists={specialists}
        appointments={appointments}
        cuts={cuts}
        selectedAppointmentId={selectedAppointmentIdForCut}
        onSelectAppointmentId={setSelectedAppointmentIdForCut}
        isSubmitting={isSubmittingCut}
        onSubmit={handleSubmitCut}
      />

      {/* MODAL 3: REGISTRAR GASTO */}
      <NewExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        expenseConcept={expenseConcept}
        setExpenseConcept={setExpenseConcept}
        expenseCategory={expenseCategory}
        setExpenseCategory={setExpenseCategory}
        expenseAmount={expenseAmount}
        setExpenseAmount={setExpenseAmount}
        expenseValidationError={expenseValidationError}
        isSubmitting={isSubmittingExpense}
        onSubmit={handleSubmitExpense}
      />

      {/* MODAL 4: ARQUEO DE CAJA */}
      <CashCloseModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        cashBase={cashBase}
        setCashBase={setCashBase}
        expectedCashInHand={expectedCashInHand}
        countedCash={countedCash}
        setCountedCash={setCountedCash}
        onSaveClose={handleSaveClose}
        isSubmitting={isSubmittingClose}
      />

      {/* MODAL 5: PASE QR */}
      {selectedAppointmentForQr && (
        <QrCodeModal
          appointment={selectedAppointmentForQr}
          onClose={() => setSelectedAppointmentForQr(null)}
        />
      )}

      {/* MODAL 6: HISTORIAL DE CLIENTA */}
      {selectedClientForHistory && (
        <ClientHistoryModal
          client={selectedClientForHistory}
          appointments={appointments}
          cuts={cuts}
          onClose={() => setSelectedClientForHistory(null)}
        />
      )}

      {/* MODAL 7: CONFIGURACIÓN ULTRAMSG WHATSAPP */}
      <UltraMsgConfigModal
        isOpen={isUltraMsgModalOpen}
        onClose={() => setIsUltraMsgModalOpen(false)}
        onToast={notify}
      />
    </div>
  );
};
