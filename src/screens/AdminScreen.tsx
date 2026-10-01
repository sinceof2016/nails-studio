import React, { useState, useMemo, useEffect } from 'react';
import {
  Appointment,
  AdminUser,
  SalonCutRecord,
  ExpenseRecord,
  CashRegisterClose,
  ClientProfile,
  PaymentMethod
} from '../types';
import { QrCodeModal } from '../components/QrCodeModal';
import { ClientHistoryModal } from '../components/ClientHistoryModal';
import { UltraMsgConfigModal } from '../components/UltraMsgConfigModal';
import { SPECIALISTS, SERVICES } from '../data/mockData';
import { formatCOP } from '../utils/format';
import { validateOnlyPlainText, sanitizeToPlainText, validateColombianPhone, checkRateLimit } from '../utils/security';
import { sendUltraMsgWhatsApp, getUltraMsgConfig, renderTemplate } from '../services/whatsappService';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { getColombiaDateISO, getColombiaTimeStr, generateSecureId, generateBookingCode, formatDisplayDate } from '../utils/dateAndId';

// Subcomponents for tabs and modals (divided for high maintainability)
import { AdminAgendaTab } from '../components/admin/tabs/AdminAgendaTab';
import { AdminCajaTab } from '../components/admin/tabs/AdminCajaTab';
import { AdminCortesTab, SpecialistLiquidationItem } from '../components/admin/tabs/AdminCortesTab';
import { AdminClientesTab } from '../components/admin/tabs/AdminClientesTab';
import { ExpressAppointmentModal } from '../components/admin/modals/ExpressAppointmentModal';
import { NewCutModal } from '../components/admin/modals/NewCutModal';
import { NewExpenseModal } from '../components/admin/modals/NewExpenseModal';
import { CashCloseModal } from '../components/admin/modals/CashCloseModal';

interface AdminScreenProps {
  admin: AdminUser;
  appointments: Appointment[];
  cuts: SalonCutRecord[];
  expenses: ExpenseRecord[];
  cashCloses: CashRegisterClose[];
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onNavigateToBooking: () => void;
  onRegisterCut: (cut: SalonCutRecord) => void;
  onAddExpense: (expense: ExpenseRecord) => void;
  onSaveCashClose: (close: CashRegisterClose) => void;
  onAddAppointment?: (appointment: Appointment) => Promise<void> | void;
  onToast?: (message: string) => void;
  initialTab?: 'agenda' | 'caja' | 'cortes' | 'clientes';
  onTabChange?: (tab: 'agenda' | 'caja' | 'cortes' | 'clientes') => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  admin,
  appointments,
  cuts,
  expenses,
  cashCloses,
  onUpdateStatus,
  onCancelAppointment,
  onNavigateToBooking,
  onRegisterCut,
  onAddExpense,
  onSaveCashClose,
  onAddAppointment,
  onToast,
  initialTab = 'agenda',
  onTabChange
}) => {
  // Navigation tabs within Admin
  const [activeAdminTab, setActiveAdminTab] = useState<'agenda' | 'caja' | 'cortes' | 'clientes'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveAdminTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tab: 'agenda' | 'caja' | 'cortes' | 'clientes') => {
    setActiveAdminTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const notify = (msg: string) => {
    if (onToast) onToast(msg);
  };

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
  const [expressServiceId, setExpressServiceId] = useState(SERVICES[0].id);
  const [expressSpecialistId, setExpressSpecialistId] = useState(SPECIALISTS[0].id);
  const [expressStatus, setExpressStatus] = useState<'en_preparacion' | 'confirmada'>('en_preparacion');
  const [expressNotes, setExpressNotes] = useState('');
  const [expressSendWhatsApp, setExpressSendWhatsApp] = useState(true);
  const [expressValidationError, setExpressValidationError] = useState<string | null>(null);

  // 2. NEW CUT MODAL STATE (WITH SPLIT PAYMENT & CHANGE CALCULATOR)
  const [showNewCutModal, setShowNewCutModal] = useState(false);
  const [cutClientName, setCutClientName] = useState('');
  const [cutClientPhone, setCutClientPhone] = useState('');
  const [cutServiceName, setCutServiceName] = useState('Manicura Rusa Glazed Donut');
  const [cutServicePrice, setCutServicePrice] = useState(95000);
  const [cutSpecialistId, setCutSpecialistId] = useState(SPECIALISTS[0].id);
  const [cutPaymentMethod, setCutPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cutTip, setCutTip] = useState(0);
  const [cutNote, setCutNote] = useState('');
  const [cutValidationError, setCutValidationError] = useState<string | null>(null);

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

  // New Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(45000);
  const [expenseCategory, setExpenseCategory] = useState<'insumos' | 'servicios' | 'mantenimiento' | 'caja_menor'>('insumos');
  const [expenseValidationError, setExpenseValidationError] = useState<string | null>(null);

  // Cash Close modal state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [cashBase, setCashBase] = useState(200000);
  const [countedCash, setCountedCash] = useState(200000);

  // Status counters
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmada').length;
  const inPrepCount = appointments.filter((a) => a.status === 'en_preparacion').length;
  const completedCount = appointments.filter((a) => a.status === 'completada').length;
  const canceledCount = appointments.filter((a) => a.status === 'cancelada').length;

  // Daily totals calculation in COP (handles split payments accurately)
  const totalCashIncome = cuts.reduce((acc, curr) => {
    if (curr.metodoPago === 'efectivo') {
      return acc + curr.servicioPrecio + curr.propina;
    } else if (curr.metodoPago === 'mixto' && curr.montoEfectivo !== undefined) {
      return acc + curr.montoEfectivo;
    }
    return acc;
  }, 0);

  const totalDigitalIncome = cuts.reduce((acc, curr) => {
    if (curr.metodoPago === 'nequi_daviplata' || curr.metodoPago === 'tarjeta_datafono') {
      return acc + curr.servicioPrecio + curr.propina;
    } else if (curr.metodoPago === 'mixto' && curr.montoDigital !== undefined) {
      return acc + curr.montoDigital;
    }
    return acc;
  }, 0);

  const totalExpensesAmount = expenses.reduce((acc, curr) => acc + curr.monto, 0);
  const expectedCashInHand = cashBase + totalCashIncome - totalExpensesAmount;

  // Specialists liquidation breakdown
  const specialistsLiquidation: SpecialistLiquidationItem[] = useMemo(() => {
    return SPECIALISTS.map((spec) => {
      const specCuts = cuts.filter((c) => c.especialistaId === spec.id);
      const totalServices = specCuts.reduce((acc, c) => acc + c.servicioPrecio, 0);
      const totalCommission = specCuts.reduce((acc, c) => acc + c.comisionEspecialista, 0);
      const totalTips = specCuts.reduce((acc, c) => acc + c.propina, 0);
      return {
        id: spec.id,
        name: spec.name,
        role: spec.role,
        avatar: spec.avatar,
        commissionRate: spec.commissionRate ?? 50,
        cutsCount: specCuts.length,
        totalServices,
        totalCommission,
        totalTips,
        payoutTotal: totalCommission + totalTips
      };
    });
  }, [cuts]);

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
          telefono: apt.clientPhone || '+57 300 000 0000',
          email: apt.clientEmail || `${(apt.clientName || 'cliente').toLowerCase().replace(/\s+/g, '.')}@auranailsspa.com`,
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
    
    await sendUltraMsgWhatsApp({
      phone: apt.clientPhone,
      message: msg,
      clientName: apt.clientName,
      bookingCode: apt.bookingCode
    });
    notify(`✓ Recordatorio enviado a ${apt.clientName} por WhatsApp`);
  };

  const handleTableReady = async (apt: Appointment) => {
    const msg = `💅 *¡Tu mesa está lista en ${BUSINESS_CONFIG.brandName}!* 💅\n\nHola ${apt.clientName}, tu manicurista *${apt.specialistName}* ya tiene tu mesa esterilizada y lista en cabina para tu servicio *${apt.serviceName}*.\n\n¡Puedes pasar a tomar asiento! ✨`;
    
    await sendUltraMsgWhatsApp({
      phone: apt.clientPhone,
      message: msg,
      clientName: apt.clientName,
      bookingCode: apt.bookingCode
    });
    notify(`✓ Notificación de "Mesa Lista" enviada a ${apt.clientName}`);
  };

  // SEND SPECIALIST LIQUIDATION VIA WHATSAPP
  const handleSendSpecialistLiquidation = async (spec: SpecialistLiquidationItem) => {
    const todayStr = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
    const msg = `✨ *${BUSINESS_CONFIG.brandName.toUpperCase()} - LIQUIDACIÓN DEL DÍA* ✨\n\n` +
      `👤 *Especialista:* ${spec.name}\n` +
      `📅 *Fecha:* ${todayStr}\n` +
      `🏢 *Sede:* ${BUSINESS_CONFIG.address}, ${BUSINESS_CONFIG.city}\n\n` +
      `💅 *Servicios Realizados:* ${spec.cutsCount} (${formatCOP(spec.totalServices)})\n` +
      `⭐ *Tu Comisión (${spec.commissionRate}%):* ${formatCOP(spec.totalCommission)}\n` +
      `🎁 *Propinas en Efectivo:* ${formatCOP(spec.totalTips)}\n` +
      `---------------------------------\n` +
      `💰 *TOTAL A RECIBIR HOY: ${formatCOP(spec.payoutTotal)}*\n\n` +
      `¡Excelente jornada de trabajo y gracias por tu dedicación! 💖💅`;

    await sendUltraMsgWhatsApp({
      phone: BUSINESS_CONFIG.phone || '+57 300 000 0000',
      message: msg,
      clientName: spec.name,
      bookingCode: `LIQ-${spec.id.toUpperCase()}`
    });
    notify(`✓ Reporte de liquidación enviado a ${spec.name} por WhatsApp.`);
  };

  // CREATE WALK-IN / TURNO EXPRESS APPOINTMENT
  const handleCreateExpressAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpressValidationError(null);

    const nameVal = validateOnlyPlainText(expressClientName, 'Nombre de la Clienta', 100);
    if (!nameVal.isValid) {
      setExpressValidationError(nameVal.reason || 'Nombre no válido.');
      return;
    }

    if (expressNotes && expressNotes.trim()) {
      const noteVal = validateOnlyPlainText(expressNotes, 'Notas del Turno Express', 500);
      if (!noteVal.isValid) {
        setExpressValidationError(noteVal.reason || 'Las notas solo admiten texto plano sin scripts ni código.');
        return;
      }
    }

    const phoneVal = validateColombianPhone(expressClientPhone);
    if (!phoneVal.isValid) {
      setExpressValidationError(phoneVal.reason || 'Teléfono no válido.');
      return;
    }

    const cleanClientName = sanitizeToPlainText(expressClientName) || 'Clienta Walk-in';
    const cleanClientPhone = sanitizeToPlainText(expressClientPhone);
    const cleanNotes = expressNotes ? `[Walk-in] ${sanitizeToPlainText(expressNotes)}` : '[Turno Express Walk-in en Salón]';

    const selectedServ = SERVICES.find((s) => s.id === expressServiceId) || SERVICES[0];
    const selectedSpec = SPECIALISTS.find((s) => s.id === expressSpecialistId) || SPECIALISTS[0];
    const bookingCode = generateBookingCode(appointments.map((a) => a.bookingCode));
    const currentDateISO = getColombiaDateISO();
    const currentTimeStr = getColombiaTimeStr();

    const newApt: Appointment = {
      id: generateSecureId('apt-walkin'),
      serviceId: selectedServ.id,
      serviceName: selectedServ.name,
      servicePrice: selectedServ.price,
      serviceDuration: selectedServ.durationMinutes,
      serviceImage: selectedServ.image,
      specialistId: selectedSpec.id,
      specialistName: selectedSpec.name,
      specialistRole: selectedSpec.role,
      specialistAvatar: selectedSpec.avatar,
      date: currentDateISO,
      time: currentTimeStr,
      clientName: cleanClientName,
      clientPhone: cleanClientPhone,
      notes: cleanNotes,
      selectedAddOns: [],
      totalPrice: selectedServ.price,
      status: expressStatus,
      bookingCode,
      createdAt: currentDateISO,
      branchId: admin.branchId || 'chico'
    };

    if (onAddAppointment) {
      await onAddAppointment(newApt);
    }

    if (expressSendWhatsApp) {
      const msg = `✨ *${BUSINESS_CONFIG.brandName} - Turno Express Confirmado* ✨\n\nHola ${expressClientName}, bienvenida a nuestro santuario.\n\n💅 *Servicio:* ${selectedServ.name}\n👩‍🎨 *Especialista:* ${selectedSpec.name}\n⏰ *Hora:* ${currentTimeStr}\n🎫 *Turno:* ${bookingCode}\n💵 *Valor:* ${formatCOP(selectedServ.price)}\n\n¡Tu momento de relajación y belleza comienza ahora! ✨`;
      
      await sendUltraMsgWhatsApp({
        phone: expressClientPhone,
        message: msg,
        clientName: expressClientName,
        bookingCode
      });
    }

    setShowExpressModal(false);
    setExpressClientName('');
    setExpressNotes('');
    notify(`✓ Turno Express ${bookingCode} registrado y asignado a ${selectedSpec.name}`);
  };

  // Status Change with optional UltraMsg WhatsApp notification
  const handleStatusChangeWithNotification = async (apt: Appointment, newStatus: Appointment['status']) => {
    onUpdateStatus(apt.id, newStatus);

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
  const handleSubmitCut = (e: React.FormEvent) => {
    e.preventDefault();
    setCutValidationError(null);

    const rateCheck = checkRateLimit('booking');
    if (!rateCheck.allowed) {
      setCutValidationError(`Has superado el límite de operaciones rápidas. Espera ${rateCheck.retryAfterSeconds}s.`);
      return;
    }

    const nameVal = validateOnlyPlainText(cutClientName, 'Nombre del Cliente', 100);
    if (!nameVal.isValid) {
      setCutValidationError(nameVal.reason || 'Nombre no válido.');
      return;
    }

    const noteVal = validateOnlyPlainText(cutNote, 'Nota del Servicio', 500);
    if (!noteVal.isValid) {
      setCutValidationError(noteVal.reason || 'Nota no válida.');
      return;
    }

    const phoneVal = validateColombianPhone(cutClientPhone);
    if (!phoneVal.isValid) {
      setCutValidationError(phoneVal.reason || 'Teléfono no válido.');
      return;
    }

    const cleanCutClientName = sanitizeToPlainText(cutClientName) || 'Cliente en Salón';
    const cleanCutClientPhone = sanitizeToPlainText(cutClientPhone) || '+57 300 000 0000';
    const cleanCutNote = sanitizeToPlainText(cutNote);

    const spec = SPECIALISTS.find((s) => s.id === cutSpecialistId) || SPECIALISTS[0];
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

    const newCut: SalonCutRecord = {
      id: generateSecureId('cut'),
      fecha: getColombiaDateISO(),
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
      montoEfectivo: finalMontoEfectivo,
      montoDigital: finalMontoDigital,
      digitalMethod: finalDigitalMethod,
      sucursalId: admin.branchId || 'chico',
      nota: cleanCutNote
    };

    onRegisterCut(newCut);

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

    setShowNewCutModal(false);
    setCutClientName('');
    setCutNote('');
    notify(`✓ Cobro registrado: ${formatCOP(priceNum)} (${spec.name} +${formatCOP(comisionEspecialista)})`);
  };

  // Submit expense
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseValidationError(null);

    const val = validateOnlyPlainText(expenseConcept, 'Concepto del Gasto', 200);
    if (!val.isValid) {
      setExpenseValidationError(val.reason || 'Concepto no válido.');
      return;
    }

    const cleanConcept = sanitizeToPlainText(expenseConcept);

    const amountNum = Math.max(0, Number(expenseAmount) || 0);
    if (amountNum <= 0) {
      setExpenseValidationError('El monto del gasto debe ser mayor a $0 COP.');
      return;
    }

    const newExp: ExpenseRecord = {
      id: generateSecureId('exp'),
      fecha: getColombiaDateISO(),
      concepto: cleanConcept,
      categoria: expenseCategory,
      monto: amountNum,
      sucursalId: admin.branchId || 'chico',
      registradoPor: admin.name
    };

    onAddExpense(newExp);
    setShowExpenseModal(false);
    setExpenseConcept('');
  };

  // Submit cash close with real-time discrepancy checking
  const handleSaveClose = () => {
    const diff = countedCash - expectedCashInHand;
    const newClose: CashRegisterClose = {
      id: generateSecureId('close'),
      fecha: getColombiaDateISO(),
      hora: getColombiaTimeStr(),
      baseInicial: cashBase,
      entradasEfectivo: totalCashIncome,
      entradasDigitales: totalDigitalIncome,
      egresosGastos: totalExpensesAmount,
      efectivoEsperado: expectedCashInHand,
      efectivoContado: countedCash,
      diferencia: diff,
      estado: Math.abs(diff) < 100 ? 'cuadrada' : 'descuadre',
      responsableNombre: admin.name,
      sucursalId: admin.branchId || 'chico'
    };

    onSaveCashClose(newClose);
    setShowCloseModal(false);
    notify(
      Math.abs(diff) < 100
        ? '✓ Cierre de caja guardado con éxito. Caja Cuadrada.'
        : `⚠ Cierre de caja guardado con diferencia de ${formatCOP(diff)}.`
    );
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
      <div className="rounded-3xl bg-gradient-to-r from-[#FAF4F5] via-[#F6E3E6] to-[#F7E5DE] p-6 sm:p-7 text-[#1F1417] border border-[#EAD6D9]/80 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#E8B4B8]/20 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <img
              src={admin.avatar}
              alt={admin.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[#64444B]/25 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#1F1417]">
                  {admin.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#64444B]/10 text-[#64444B] text-[10px] font-bold tracking-wider uppercase border border-[#64444B]/20">
                  ★ {admin.role}
                </span>
              </div>
              <p className="text-xs text-[#644E53]">{admin.title} · {admin.branch}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-mono border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firestore Sincronizado
            </span>
          </div>
        </div>

        {/* Quick Metrics in COP */}
        <div className="pt-4 border-t border-[#EAD6D9]/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center relative z-10">
          <div className="p-2.5 rounded-2xl bg-white/80 border border-[#EAD6D9]/50 shadow-2xs">
            <span className="text-[10px] text-[#644E53] block uppercase tracking-wider font-semibold">Citas Hoy</span>
            <strong className="text-base sm:text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#1F1417]">{totalCount}</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-[#EAD6D9]/50 shadow-2xs">
            <span className="text-[10px] text-[#644E53] block uppercase tracking-wider font-semibold">Caja Efectivo</span>
            <strong className="text-base sm:text-lg font-bold text-[#64444B] font-mono">
              {formatCOP(expectedCashInHand)}
            </strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-[#EAD6D9]/50 shadow-2xs">
            <span className="text-[10px] text-[#644E53] block uppercase tracking-wider font-semibold">Cortes / Cobros</span>
            <strong className="text-base sm:text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#1F1417]">{cuts.length}</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/80 border border-[#EAD6D9]/50 shadow-2xs">
            <span className="text-[10px] text-[#644E53] block uppercase tracking-wider font-semibold">Directorio Clientes</span>
            <strong className="text-base sm:text-lg font-bold text-emerald-700 font-['Plus_Jakarta_Sans',sans-serif]">
              {clientProfiles.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Internal Sub-Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar border-b border-[#EAD6D9]/70 pb-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleSelectTab('agenda')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'agenda'
                ? 'bg-[#64444B] text-white shadow-xs'
                : 'bg-white text-[#644E53] hover:bg-[#F6E3E6] border border-[#EAD6D9]/70'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>Agenda ({totalCount})</span>
          </button>

          <button
            onClick={() => handleSelectTab('caja')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'caja'
                ? 'bg-[#64444B] text-white shadow-xs'
                : 'bg-white text-[#644E53] hover:bg-[#F6E3E6] border border-[#EAD6D9]/70'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
            <span>Caja &amp; Arqueo</span>
          </button>

          <button
            onClick={() => handleSelectTab('cortes')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'cortes'
                ? 'bg-[#64444B] text-white shadow-xs'
                : 'bg-white text-[#644E53] hover:bg-[#F6E3E6] border border-[#EAD6D9]/70'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Liquidación</span>
          </button>

          <button
            onClick={() => handleSelectTab('clientes')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'clientes'
                ? 'bg-[#64444B] text-white shadow-xs'
                : 'bg-white text-[#644E53] hover:bg-[#F6E3E6] border border-[#EAD6D9]/70'
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
        />
      )}

      {/* 2. CAJA & ARQUEO TAB */}
      {activeAdminTab === 'caja' && (
        <AdminCajaTab
          cuts={cuts}
          cashBase={cashBase}
          totalCashIncome={totalCashIncome}
          totalExpensesAmount={totalExpensesAmount}
          expectedCashInHand={expectedCashInHand}
          totalDigitalIncome={totalDigitalIncome}
          onOpenNewCutModal={() => setShowNewCutModal(true)}
          onOpenExpenseModal={() => setShowExpenseModal(true)}
          onOpenCloseModal={() => setShowCloseModal(true)}
        />
      )}

      {/* 3. CORTES & LIQUIDACIÓN TAB */}
      {activeAdminTab === 'cortes' && (
        <AdminCortesTab
          specialistsLiquidation={specialistsLiquidation}
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
        expressStatus={expressStatus}
        setExpressStatus={setExpressStatus}
        expressNotes={expressNotes}
        setExpressNotes={setExpressNotes}
        expressSendWhatsApp={expressSendWhatsApp}
        setExpressSendWhatsApp={setExpressSendWhatsApp}
        expressValidationError={expressValidationError}
        services={SERVICES}
        specialists={SPECIALISTS}
        onSubmit={handleCreateExpressAppointment}
      />

      {/* MODAL 2: NUEVO CORTE / COBRO */}
      <NewCutModal
        isOpen={showNewCutModal}
        onClose={() => setShowNewCutModal(false)}
        cutClientName={cutClientName}
        setCutClientName={setCutClientName}
        cutClientPhone={cutClientPhone}
        setCutClientPhone={setCutClientPhone}
        cutServicePrice={cutServicePrice}
        setCutServicePrice={setCutServicePrice}
        cutTip={cutTip}
        setCutTip={setCutTip}
        cutSpecialistId={cutSpecialistId}
        setCutSpecialistId={setCutSpecialistId}
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
        specialists={SPECIALISTS}
        onSubmit={handleSubmitCut}
      />

      {/* MODAL 3: REGISTRAR GASTO */}
      <NewExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        expenseConcept={expenseConcept}
        setExpenseConcept={setExpenseConcept}
        expenseAmount={expenseAmount}
        setExpenseAmount={setExpenseAmount}
        expenseValidationError={expenseValidationError}
        onSubmit={handleSubmitExpense}
      />

      {/* MODAL 4: ARQUEO DE CAJA */}
      <CashCloseModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        expectedCashInHand={expectedCashInHand}
        countedCash={countedCash}
        setCountedCash={setCountedCash}
        onSaveClose={handleSaveClose}
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
