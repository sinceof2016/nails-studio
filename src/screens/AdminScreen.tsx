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
import { sanitizeToPlainText, validateColombianPhone, checkRateLimit, validateAndClean } from '../utils/security';
import { sendUltraMsgWhatsApp, getUltraMsgConfig, renderTemplate } from '../services/whatsappService';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { getColombiaDateISO, getColombiaTimeStr, generateSecureId, generateBookingCode, formatDisplayDate } from '../utils/dateAndId';
import { HOURLY_TIME_SLOTS, getCoveredSlots } from '../utils/calendarAvailability';

// Subcomponents for tabs and modals
import { AdminAgendaTab } from '../components/admin/tabs/AdminAgendaTab';
import { AdminCajaTab } from '../components/admin/tabs/AdminCajaTab';
import { AdminCortesTab, SpecialistLiquidationItem } from '../components/admin/tabs/AdminCortesTab';
import { AdminClientesTab } from '../components/admin/tabs/AdminClientesTab';
import { ExpressAppointmentModal } from '../components/admin/modals/ExpressAppointmentModal';
import { NewCutModal } from '../components/admin/modals/NewCutModal';
import { NewExpenseModal } from '../components/admin/modals/NewExpenseModal';
import { CashCloseModal } from '../components/admin/modals/CashCloseModal';
import { AgendaBlockModal } from '../components/admin/modals/AgendaBlockModal';

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
  const [expressTime, setExpressTime] = useState(HOURLY_TIME_SLOTS[2] || '10:00 AM');
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
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmada').length;
  const inPrepCount = appointments.filter((a) => a.status === 'en_preparacion').length;
  const completedCount = appointments.filter((a) => a.status === 'completada').length;
  const canceledCount = appointments.filter((a) => a.status === 'cancelada').length;

  // FILTRAR REGISTROS DE COBROS Y GASTOS POR LA FECHA SELECCIONADA
  const dayCuts = useMemo(() => {
    return cuts.filter((c) => !c.fecha || c.fecha === selectedDate);
  }, [cuts, selectedDate]);

  const dayExpenses = useMemo(() => {
    return expenses.filter((e) => !e.fecha || e.fecha === selectedDate);
  }, [expenses, selectedDate]);

  // Daily totals calculation in COP based on selected date
  const totalCashIncome = useMemo(() => {
    return dayCuts.reduce((acc, curr) => {
      if (curr.metodoPago === 'efectivo') {
        return acc + curr.servicioPrecio + curr.propina;
      } else if (curr.metodoPago === 'mixto' && curr.montoEfectivo !== undefined) {
        return acc + curr.montoEfectivo;
      }
      return acc;
    }, 0);
  }, [dayCuts]);

  const totalDigitalIncome = useMemo(() => {
    return dayCuts.reduce((acc, curr) => {
      if (curr.metodoPago === 'nequi_daviplata' || curr.metodoPago === 'tarjeta_datafono') {
        return acc + curr.servicioPrecio + curr.propina;
      } else if (curr.metodoPago === 'mixto' && curr.montoDigital !== undefined) {
        return acc + curr.montoDigital;
      }
      return acc;
    }, 0);
  }, [dayCuts]);

  const totalExpensesAmount = useMemo(() => {
    return dayExpenses.reduce((acc, curr) => acc + curr.monto, 0);
  }, [dayExpenses]);

  const expectedCashInHand = cashBase + totalCashIncome - totalExpensesAmount;

  // Specialists liquidation breakdown for selected date
  const specialistsLiquidation: SpecialistLiquidationItem[] = useMemo(() => {
    return specialists.map((spec) => {
      const specCuts = dayCuts.filter((c) => c.especialistaId === spec.id);
      const totalServices = specCuts.reduce((acc, c) => acc + c.servicioPrecio, 0);
      const totalCommission = specCuts.reduce((acc, c) => acc + c.comisionEspecialista, 0);
      const totalTips = specCuts.reduce((acc, c) => acc + c.propina, 0);
      return {
        id: spec.id,
        name: spec.name,
        role: spec.role,
        avatar: spec.avatar,
        phone: spec.phone,
        telefono: spec.telefono,
        commissionRate: spec.commissionRate ?? 50,
        cutsCount: specCuts.length,
        totalServices,
        totalCommission,
        totalTips,
        payoutTotal: totalCommission + totalTips
      };
    });
  }, [specialists, dayCuts]);

  // Clients database synthesized with safe normalization
  const clientProfiles: ClientProfile[] = useMemo(() => {
    const map = new Map<string, ClientProfile>();

    appointments.forEach((apt) => {
      const cleanPhone = (apt.clientPhone || '').replace(/\D/g, '').slice(-10);
      const key = cleanPhone || (apt.clientName || 'Cliente').toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          id: `client-${key}`,
          nombre: apt.clientName || 'Clienta Anónima',
          telefono: apt.clientPhone || '',
          email: apt.clientEmail || '',
          totalCitas: 1,
          gastoTotal: apt.totalPrice ?? 0,
          primeraVisita: apt.date || 'Reciente',
          ultimaVisita: apt.date || 'Reciente',
          servicioFavorito: apt.serviceName || 'Manicura Rusa',
          especialistaFavorita: apt.specialistName || 'Valentina R.',
          clasificacion: 'Nuevo',
          notasCuidado: apt.notes
        });
      } else {
        const item = map.get(key)!;
        item.totalCitas += 1;
        item.gastoTotal += apt.totalPrice ?? 0;
        item.ultimaVisita = apt.date || item.ultimaVisita;
        item.clasificacion = item.totalCitas >= 3 ? 'VIP Frecuente' : 'Recurrente';
      }
    });

    return Array.from(map.values());
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

  // CREATE WALK-IN / TURNO EXPRESS APPOINTMENT
  const handleCreateExpressAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpressValidationError(null);

    const nameRes = validateAndClean(expressClientName, 'Nombre de la Clienta', 100);
    if (!nameRes.ok) {
      setExpressValidationError(nameRes.error || 'Nombre no válido.');
      return;
    }

    let cleanNotes = '[Turno Express Walk-in en Salón]';
    if (expressNotes && expressNotes.trim()) {
      const noteRes = validateAndClean(expressNotes, 'Notas del Turno Express', 500);
      if (!noteRes.ok) {
        setExpressValidationError(noteRes.error || 'Las notas solo admiten texto plano sin scripts ni código.');
        return;
      }
      cleanNotes = `[Walk-in] ${noteRes.value}`;
    }

    const phoneVal = validateColombianPhone(expressClientPhone);
    if (!phoneVal.isValid) {
      setExpressValidationError(phoneVal.reason || 'Teléfono no válido.');
      return;
    }

    const cleanClientName = nameRes.value || 'Clienta Walk-in';
    const cleanClientPhone = sanitizeToPlainText(expressClientPhone);

    const selectedServ = services.find((s) => s.id === expressServiceId) || services[0];
    const selectedSpec = specialists.find((s) => s.id === expressSpecialistId) || specialists[0];
    const bookingCode = generateBookingCode(appointments.map((a) => a.bookingCode));
    const currentDateISO = getColombiaDateISO();

    if (agendaBlocks.some((b) => b.specialistId === selectedSpec.id && b.date === currentDateISO)) {
      setExpressValidationError(`La agenda de ${selectedSpec.name} está bloqueada para el día de hoy.`);
      return;
    }

    if (getCoveredSlots(expressTime, selectedServ.durationMinutes) === null) {
      setExpressValidationError(`Este servicio dura ${selectedServ.durationMinutes} minutos y terminaría después de la hora de cierre (07:00 PM).`);
      return;
    }

    const newApt: Appointment = {
      id: generateSecureId('apt-walkin'),
      serviceId: selectedServ.id,
      serviceName: selectedServ.name,
      servicePrice: selectedServ.price,
      serviceDuration: selectedServ.durationMinutes,
      serviceImage: selectedServ.image || '',
      specialistId: selectedSpec.id,
      specialistName: selectedSpec.name,
      specialistRole: selectedSpec.role,
      specialistAvatar: selectedSpec.avatar || '',
      date: currentDateISO,
      time: expressTime,
      clientName: cleanClientName,
      clientPhone: cleanClientPhone,
      notes: cleanNotes,
      selectedAddOns: [],
      totalPrice: selectedServ.price,
      status: expressStatus,
      bookingCode,
      createdAt: currentDateISO,
      branchId: activeBranchId,
      autorizacionDatos: true,
      autorizacionFecha: currentDateISO,
      autorizacionVersion: BUSINESS_CONFIG.dataPolicyVersion
    };

    setIsSubmittingExpress(true);
    try {
      if (onAddAppointment) {
        await onAddAppointment(newApt);
      }

      if (expressSendWhatsApp) {
        try {
          const ultramsgConfig = getUltraMsgConfig();
          const messageBody = renderTemplate(ultramsgConfig.confirmationTemplate, {
            cliente: cleanClientName,
            servicio: selectedServ.name,
            codigo: bookingCode,
            fecha: formatDisplayDate(currentDateISO),
            hora: expressTime,
            sede: BUSINESS_CONFIG.branchName,
            monto: formatCOP(selectedServ.price),
            estado: expressStatus === 'en_preparacion' ? 'En Cabina' : 'Confirmada'
          });

          await sendUltraMsgWhatsApp({
            phone: cleanClientPhone,
            message: messageBody,
            clientName: cleanClientName,
            bookingCode
          });
        } catch (notifErr) {
          console.warn('WhatsApp notificación no enviada para turno express:', notifErr);
        }
      }

      setShowExpressModal(false);
      setExpressClientName('');
      setExpressNotes('');
      notify(`✓ Turno Express agendado: ${cleanClientName} (${expressTime} con ${selectedSpec.name})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la cita en Firestore.';
      setExpressValidationError(msg);
    } finally {
      setIsSubmittingExpress(false);
    }
  };

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

  // Submit new Cut with validation, split payment & rate limit
  const handleSubmitCut = async (e: React.FormEvent) => {
    e.preventDefault();
    setCutValidationError(null);

    const nameRes = validateAndClean(cutClientName, 'Nombre del Cliente', 100);
    if (!nameRes.ok) {
      setCutValidationError(nameRes.error || 'Nombre no válido.');
      return;
    }

    let cleanCutNote = '';
    if (cutNote && cutNote.trim()) {
      const noteRes = validateAndClean(cutNote, 'Nota del Servicio', 500);
      if (!noteRes.ok) {
        setCutValidationError(noteRes.error || 'Nota no válida.');
        return;
      }
      cleanCutNote = noteRes.value;
    }

    const phoneVal = validateColombianPhone(cutClientPhone);
    if (!phoneVal.isValid) {
      setCutValidationError(phoneVal.reason || 'Teléfono no válido.');
      return;
    }

    const cleanCutClientName = nameRes.value || 'Cliente en Salón';
    const cleanCutClientPhone = sanitizeToPlainText(cutClientPhone);

    const spec = specialists.find((s) => s.id === cutSpecialistId) || specialists[0];
    const commissionPercent = spec.commissionRate ?? 50;
    const priceNum = Math.max(0, Number(cutServicePrice) || 0);
    const tipNum = Math.max(0, Number(cutTip) || 0);
    const totalCobro = priceNum + tipNum;
    const comisionEspecialista = Math.round((priceNum * commissionPercent) / 100);
    const recaudoSalon = priceNum - comisionEspecialista;

    let finalMontoEfectivo: number | undefined;
    let finalMontoDigital: number | undefined;
    let finalDigitalMethod: 'nequi_daviplata' | 'tarjeta_datafono' | undefined;

    if (cutPaymentMethod === 'mixto') {
      finalMontoEfectivo = Math.min(totalCobro, Math.max(0, Number(cutMontoEfectivo) || 0));
      finalMontoDigital = Math.max(0, totalCobro - finalMontoEfectivo);
      finalDigitalMethod = cutDigitalMethod;
    }

    const isFromAppointment = Boolean(selectedAppointmentIdForCut && selectedAppointmentIdForCut.trim());
    const cutId = isFromAppointment ? `cut-${selectedAppointmentIdForCut}` : generateSecureId('cut');

    // CONSTRUCCIÓN ESTRICTA SIN VALORES UNDEFINED (cumple reglas isValidCut)
    const newCut: SalonCutRecord = {
      id: cutId,
      fecha: selectedDate,
      hora: getColombiaTimeStr(),
      clienteNombre: cleanCutClientName,
      clienteTelefono: cleanCutClientPhone,
      servicioNombre: cutServiceName,
      servicioPrecio: priceNum,
      especialistaId: spec.id,
      especialistaNombre: spec.name,
      comisionPorcentaje: commissionPercent,
      comisionEspecialista,
      recaudoSalon,
      propina: tipNum,
      metodoPago: cutPaymentMethod,
      ...(cutPaymentMethod === 'mixto' ? {
        montoEfectivo: finalMontoEfectivo,
        montoDigital: finalMontoDigital,
        digitalMethod: finalDigitalMethod
      } : {}),
      sucursalId: activeBranchId,
      ...(cleanCutNote ? { nota: cleanCutNote } : {}),
      ...(isFromAppointment ? { appointmentId: selectedAppointmentIdForCut } : {})
    };

    // Limite solo en el cliente. La proteccion real contra reservas masivas es Firebase App Check (pendiente).
    const rateCheck = checkRateLimit('corte_rapido');
    if (!rateCheck.allowed) {
      setCutValidationError(`Has superado el límite de operaciones rápidas. Espera ${rateCheck.retryAfterSeconds}s.`);
      return;
    }

    setIsSubmittingCut(true);
    try {
      await onRegisterCut(newCut);

      const ultraConfig = getUltraMsgConfig();
      if (ultraConfig.autoNotifyPayment) {
        const paymentMsg = renderTemplate(ultraConfig.paymentTemplate, {
          cliente: cleanCutClientName,
          codigo: newCut.id.toUpperCase(),
          servicio: cutServiceName,
          fecha: formatDisplayDate(newCut.fecha),
          hora: newCut.hora,
          sede: `${BUSINESS_CONFIG.address}, ${BUSINESS_CONFIG.city}`,
          estado: 'Pagado',
          monto: formatCOP(totalCobro)
        });

        sendUltraMsgWhatsApp({
          phone: cleanCutClientPhone,
          message: paymentMsg,
          clientName: cleanCutClientName,
          bookingCode: newCut.id.toUpperCase()
        });
      }

      if (selectedAppointmentIdForCut) {
        try {
          await onUpdateStatus(selectedAppointmentIdForCut, 'completada');
        } catch (firstErr) {
          // Reintentar una vez si falló el cambio de estado
          try {
            await onUpdateStatus(selectedAppointmentIdForCut, 'completada');
          } catch (secondErr) {
            console.warn('Error al marcar la cita como completada tras el cobro:', secondErr);
            notify('Cobro registrado, pero no se pudo marcar la cita como completada.');
          }
        }
      }

      setShowNewCutModal(false);
      setSelectedAppointmentIdForCut('');
      setCutClientName('');
      setCutNote('');
      notify(`✓ Cobro registrado: ${formatCOP(priceNum)} (${spec.name} +${formatCOP(comisionEspecialista)})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el cobro en Firestore.';
      if (msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('already exists')) {
        setCutValidationError('Esta cita ya fue cobrada.');
      } else {
        setCutValidationError(msg);
      }
    } finally {
      setIsSubmittingCut(false);
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

  // Submit expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseValidationError(null);

    const val = validateAndClean(expenseConcept, 'Concepto del Gasto', 200);
    if (!val.ok) {
      setExpenseValidationError(val.error || 'Concepto no válido.');
      return;
    }

    const cleanConcept = val.value;

    const amountNum = Math.max(0, Number(expenseAmount) || 0);
    if (amountNum <= 0) {
      setExpenseValidationError('El monto del gasto debe ser mayor a $0 COP.');
      return;
    }

    const newExp: ExpenseRecord = {
      id: generateSecureId('exp'),
      fecha: selectedDate,
      concepto: cleanConcept,
      categoria: expenseCategory,
      monto: amountNum,
      sucursalId: activeBranchId,
      registradoPor: activeUserName
    };

    setIsSubmittingExpense(true);
    try {
      await onAddExpense(newExp);
      setShowExpenseModal(false);
      setExpenseConcept('');
      notify(`✓ Gasto de ${formatCOP(amountNum)} registrado en caja menor.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el gasto en Firestore.';
      setExpenseValidationError(msg);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Submit cash close with real-time discrepancy checking
  const handleSaveClose = async () => {
    if (expectedCashInHand < 0) {
      notify('⚠ No se puede cerrar la caja con efectivo esperado negativo.');
      return;
    }

    const diff = countedCash - expectedCashInHand;
    const newClose: CashRegisterClose = {
      id: generateSecureId('close'),
      fecha: selectedDate,
      hora: getColombiaTimeStr(),
      baseInicial: cashBase,
      entradasEfectivo: totalCashIncome,
      entradasDigitales: totalDigitalIncome,
      egresosGastos: totalExpensesAmount,
      efectivoEsperado: Math.max(0, expectedCashInHand),
      efectivoContado: Math.max(0, countedCash),
      diferencia: diff,
      estado: Math.abs(diff) < 100 ? 'cuadrada' : 'descuadre',
      responsableNombre: activeUserName,
      sucursalId: activeBranchId
    };

    setIsSubmittingClose(true);
    try {
      await onSaveCashClose(newClose);
      setShowCloseModal(false);
      notify(
        Math.abs(diff) < 100
          ? '✓ Cierre de caja guardado con éxito. Caja Cuadrada.'
          : `⚠ Cierre de caja guardado con diferencia de ${formatCOP(diff)}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el arqueo de caja.';
      notify(`⚠ ${msg}`);
    } finally {
      setIsSubmittingClose(false);
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
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-b border-[#C6BDAC]/70 pb-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleSelectTab('agenda')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'agenda'
                ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]/70'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>Agenda ({totalCount})</span>
          </button>

          <button
            onClick={() => handleSelectTab('caja')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'caja'
                ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]/70'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
            <span>Caja &amp; Arqueo</span>
          </button>

          {!isCajaRole && (
            <button
              onClick={() => handleSelectTab('cortes')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeAdminTab === 'cortes'
                  ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                  : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]/70'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Liquidación</span>
            </button>
          )}

          <button
            onClick={() => handleSelectTab('clientes')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'clientes'
                ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-xs'
                : 'bg-white text-[#5A4A43] hover:bg-[#C6BDAC]/40 border border-[#C6BDAC]/70'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>Clientes ({clientProfiles.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsUltraMsgModalOpen(true)}
          className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          title="Configuración de Notificaciones Automáticas UltraMsg WhatsApp"
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-600">bolt</span>
          <span>UltraMsg WhatsApp</span>
        </button>
      </div>

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
          onOpenAgendaBlockModal={() => setShowAgendaBlockModal(true)}
          onRemoveAgendaBlock={onRemoveAgendaBlock}
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

      {/* MODAL 8: BLOQUEAR AGENDA */}
      <AgendaBlockModal
        isOpen={showAgendaBlockModal}
        onClose={() => setShowAgendaBlockModal(false)}
        specialists={specialists}
        appointments={appointments}
        existingBlocks={agendaBlocks}
        onSubmit={async (specialistIds, dates) => {
          if (onAddAgendaBlocks) {
            await onAddAgendaBlocks(specialistIds, dates);
          }
        }}
      />
    </div>
  );
};
