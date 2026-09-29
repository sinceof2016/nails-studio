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
import { validateSafeText, validateOnlyPlainText, sanitizeToPlainText, validateColombianPhone, checkRateLimit } from '../utils/security';
import { sendUltraMsgWhatsApp, getUltraMsgConfig, renderTemplate } from '../services/whatsappService';

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
  const specialistsLiquidation = useMemo(() => {
    return SPECIALISTS.map((spec) => {
      const specCuts = cuts.filter((c) => c.especialistaId === spec.id);
      const totalServices = specCuts.reduce((acc, c) => acc + c.servicioPrecio, 0);
      const totalCommission = specCuts.reduce((acc, c) => acc + c.comisionEspecialista, 0);
      const totalTips = specCuts.reduce((acc, c) => acc + c.propina, 0);
      return {
        ...spec,
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
          gastoTotal: apt.totalPrice || 0,
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
        item.gastoTotal += apt.totalPrice || 0;
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
    const msg = `✨ *La Pelu SPA - Recordatorio de Cita* ✨\n\nHola ${apt.clientName}, te recordamos tu cita de *${apt.serviceName}* agendada para hoy a las *${apt.time}* con ${apt.specialistName}.\n\n📍 Sede Chicó Calle 85, Bogotá.\n🎫 Código: ${apt.bookingCode}\n\n¡Te esperamos con una copa de cortesía! 💅🥂`;
    
    await sendUltraMsgWhatsApp({
      phone: apt.clientPhone,
      message: msg,
      clientName: apt.clientName,
      bookingCode: apt.bookingCode
    });
    notify(`✓ Recordatorio enviado a ${apt.clientName} por WhatsApp`);
  };

  const handleTableReady = async (apt: Appointment) => {
    const msg = `💅 *¡Tu mesa está lista en La Pelu SPA!* 💅\n\nHola ${apt.clientName}, tu manicurista *${apt.specialistName}* ya tiene tu mesa esterilizada y lista en cabina para tu servicio *${apt.serviceName}*.\n\n¡Puedes pasar a tomar asiento! ✨`;
    
    await sendUltraMsgWhatsApp({
      phone: apt.clientPhone,
      message: msg,
      clientName: apt.clientName,
      bookingCode: apt.bookingCode
    });
    notify(`✓ Notificación de "Mesa Lista" enviada a ${apt.clientName}`);
  };

  // SEND SPECIALIST LIQUIDATION VIA WHATSAPP
  const handleSendSpecialistLiquidation = async (spec: typeof specialistsLiquidation[0]) => {
    const todayStr = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
    const msg = `✨ *LA PELU SPA - LIQUIDACIÓN DEL DÍA* ✨\n\n` +
      `👤 *Especialista:* ${spec.name}\n` +
      `📅 *Fecha:* ${todayStr}\n` +
      `🏢 *Sede:* Santuario Chicó Calle 85\n\n` +
      `💅 *Servicios Realizados:* ${spec.cutsCount} (${formatCOP(spec.totalServices)})\n` +
      `⭐ *Tu Comisión (${spec.commissionRate}%):* ${formatCOP(spec.totalCommission)}\n` +
      `🎁 *Propinas en Efectivo:* ${formatCOP(spec.totalTips)}\n` +
      `---------------------------------\n` +
      `💰 *TOTAL A RECIBIR HOY: ${formatCOP(spec.payoutTotal)}*\n\n` +
      `¡Excelente jornada de trabajo y gracias por tu dedicación! 💖💅`;

    await sendUltraMsgWhatsApp({
      phone: '+57 312 849 2011',
      message: msg,
      clientName: spec.name,
      bookingCode: `LIQ-${spec.id.toUpperCase()}`
    });
    notify(`✓ Reporte de liquidación enviado a ${spec.name} por WhatsApp.`);
  };

  // CREATE WALK-IN / TURNO EXPRESS APPOINTMENT (IN 10 SECONDS)
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
    const bookingCode = `AURA-W${Date.now().toString().slice(-4)}`;
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newApt: Appointment = {
      id: `apt-walkin-${Date.now()}`,
      serviceId: selectedServ.id,
      serviceName: selectedServ.name,
      servicePrice: selectedServ.price,
      serviceDuration: selectedServ.durationMinutes,
      serviceImage: selectedServ.image,
      specialistId: selectedSpec.id,
      specialistName: selectedSpec.name,
      specialistRole: selectedSpec.role,
      specialistAvatar: selectedSpec.avatar,
      date: 'Hoy (Walk-in)',
      time: currentTimeStr,
      clientName: cleanClientName,
      clientPhone: cleanClientPhone,
      notes: cleanNotes,
      selectedAddOns: [],
      totalPrice: selectedServ.price,
      status: expressStatus,
      bookingCode,
      createdAt: new Date().toISOString(),
      branchId: admin.branchId || 'chico'
    };

    if (onAddAppointment) {
      await onAddAppointment(newApt);
    }

    if (expressSendWhatsApp) {
      const msg = `✨ *La Pelu SPA - Turno Express Confirmado* ✨\n\nHola ${expressClientName}, bienvenida a nuestro Santuario Chicó Calle 85.\n\n💅 *Servicio:* ${selectedServ.name}\n👩‍🎨 *Especialista:* ${selectedSpec.name}\n⏰ *Hora:* ${currentTimeStr}\n🎫 *Turno:* ${bookingCode}\n💵 *Valor:* ${formatCOP(selectedServ.price)}\n\n¡Tu momento de relajación y belleza comienza ahora! ✨`;
      
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
        fecha: apt.date,
        hora: apt.time,
        sede: 'Santuario Chicó Calle 85',
        estado: statusLabel,
        monto: formatCOP(apt.totalPrice || apt.servicePrice)
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
    const commissionPercent = spec.commissionRate || 50;
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
      id: `cut-${Date.now().toString().slice(-5)}`,
      fecha: 'Hoy, 27 Sept',
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    setShowNewCutModal(false);
    setCutClientName('');
    setCutClientPhone('');
    setCutNote('');

    const ultraConfig = getUltraMsgConfig();
    if (ultraConfig.autoNotifyPayment) {
      const msg = renderTemplate(ultraConfig.paymentTemplate, {
        cliente: cleanCutClientName,
        codigo: `REC-${Date.now().toString().slice(-4)}`,
        servicio: cutServiceName,
        fecha: new Date().toLocaleDateString('es-CO'),
        hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        sede: 'Santuario Chicó Calle 85',
        estado: 'Pagado',
        monto: formatCOP(priceNum + tipNum)
      });

      sendUltraMsgWhatsApp({
        phone: cleanCutClientPhone,
        message: msg,
        clientName: cleanCutClientName,
        bookingCode: `REC-${Date.now().toString().slice(-4)}`
      });
    }
  };

  // Submit new expense
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
      id: `exp-${Date.now().toString().slice(-5)}`,
      fecha: 'Hoy, 27 Sept',
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
      id: `close-${Date.now().toString().slice(-5)}`,
      fecha: 'Hoy, 27 Sept',
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      
      {/* Admin Credentials & Quick Highlights Banner en Tonos Pasteles */}
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
        <div className="space-y-4">
          
          {/* Top Actions: Search + Fast Walk-in + Regular Booking */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[#7D676B] text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por clienta, código AURA o manicurista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-9 rounded-full bg-white border border-[#EAD6D9] text-xs text-[#1F1417] placeholder-[#7D676B] focus:outline-none focus:ring-1 focus:ring-[#64444B]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#7D676B] hover:text-[#1F1417]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* BUTTON 1: WALK-IN / TURNO EXPRESS (SOLVES RECEPTION BOTTLENECK) */}
              <button
                onClick={() => setShowExpressModal(true)}
                className="h-10 px-4 rounded-full bg-gradient-to-r from-[#C5838D] to-[#64444B] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all"
                title="Crear cita express para clientas que llegan sin reserva en 10 segundos"
              >
                <span className="material-symbols-outlined text-[18px]">flash_on</span>
                <span>+ Turno Express (Walk-in)</span>
              </button>

              <button
                onClick={onNavigateToBooking}
                className="h-10 px-4 rounded-full bg-white hover:bg-[#F6E3E6] border border-[#EAD6D9] text-[#1F1417] text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px] text-[#64444B]">add</span>
                <span>Nueva Cita</span>
              </button>
            </div>
          </div>

          {/* Quick Specialist Filter Chips (SOLVES SPECIALIST SCHEDULE BOTTLENECK) */}
          <div className="p-3 rounded-2xl bg-white border border-[#EAD6D9]/70 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#644E53] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#64444B]">face</span>
                <span>Ver Agenda por Especialista:</span>
              </span>
              {specialistFilter !== 'todos' && (
                <button
                  onClick={() => setSpecialistFilter('todos')}
                  className="text-[11px] font-bold text-[#64444B] hover:underline cursor-pointer"
                >
                  Ver Todas
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => setSpecialistFilter('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  specialistFilter === 'todos'
                    ? 'bg-[#64444B] text-white shadow-xs'
                    : 'bg-[#FAF4F5] text-[#644E53] border border-[#EAD6D9]/60 hover:bg-[#F6E3E6]'
                }`}
              >
                <span>Todas</span>
                <span className="text-[10px] opacity-80">({appointments.length})</span>
              </button>

              {SPECIALISTS.map((spec) => {
                const count = appointments.filter((a) => a.specialistId === spec.id).length;
                const isSelected = specialistFilter === spec.id;

                return (
                  <button
                    key={spec.id}
                    onClick={() => setSpecialistFilter(isSelected ? 'todos' : spec.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#64444B] text-white shadow-xs'
                        : 'bg-[#FAF4F5] text-[#1F1417] border border-[#EAD6D9]/60 hover:bg-[#F6E3E6]'
                    }`}
                  >
                    <img
                      src={spec.avatar}
                      alt={spec.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{spec.name.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'todos'
                  ? 'bg-[#64444B] text-white shadow-xs'
                  : 'bg-white text-[#644E53] border border-[#EAD6D9]/80 hover:bg-[#F6E3E6]'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus('confirmada')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'confirmada'
                  ? 'bg-[#2d6a4f] text-white shadow-xs'
                  : 'bg-white text-[#2d6a4f] border border-[#dce8dc] hover:bg-[#dce8dc]/40'
              }`}
            >
              Confirmadas ({confirmedCount})
            </button>
            <button
              onClick={() => setFilterStatus('en_preparacion')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'en_preparacion'
                  ? 'bg-[#71547c] text-white shadow-xs'
                  : 'bg-white text-[#71547c] border border-[#f8d8ff] hover:bg-[#f8d8ff]/40'
              }`}
            >
              En Cabina ({inPrepCount})
            </button>
            <button
              onClick={() => setFilterStatus('completada')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'completada'
                  ? 'bg-[#504444] text-white shadow-xs'
                  : 'bg-white text-[#504444] border border-[#ebe8e2] hover:bg-[#ebe8e2]/50'
              }`}
            >
              Completadas ({completedCount})
            </button>
            <button
              onClick={() => setFilterStatus('cancelada')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'cancelada'
                  ? 'bg-[#ba1a1a] text-white shadow-xs'
                  : 'bg-white text-[#ba1a1a] border border-[#ffdad6] hover:bg-[#ffdad6]/40'
              }`}
            >
              Canceladas ({canceledCount})
            </button>
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAppointments.length === 0 ? (
              <div className="col-span-full text-center py-12 px-6 bg-white rounded-3xl border border-[#EAD6D9]/60">
                <span className="material-symbols-outlined text-[#EAD6D9] text-[44px] mb-2">
                  event_busy
                </span>
                <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                  No se encontraron citas con estos filtros
                </h4>
                <p className="text-xs text-[#644E53] mt-1">
                  Prueba cambiando el estado o la búsqueda para ver más registros de la agenda.
                </p>
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const isExpanded = expandedAptId === apt.id;

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-3xl p-5 shadow-xs border border-[#EAD6D9]/60 space-y-3 transition-all hover:border-[#64444B]/40"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#64444B] bg-[#F6E3E6] px-2.5 py-0.5 rounded-md">
                          {apt.bookingCode}
                        </span>
                        <span className="text-xs text-[#644E53] font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#64444B]">schedule</span>
                          {apt.date} · {apt.time}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          apt.status === 'confirmada'
                            ? 'bg-[#dce8dc] text-[#2d6a4f]'
                            : apt.status === 'en_preparacion'
                            ? 'bg-[#f8d8ff] text-[#71547c]'
                            : apt.status === 'completada'
                            ? 'bg-[#f1ede7] text-[#504444]'
                            : 'bg-[#ffdad6] text-[#ba1a1a]'
                        }`}
                      >
                        {apt.status === 'confirmada' && 'Confirmada'}
                        {apt.status === 'en_preparacion' && 'En Cabina'}
                        {apt.status === 'completada' && 'Completada'}
                        {apt.status === 'cancelada' && 'Cancelada'}
                      </span>
                    </div>

                    {/* Client info & Service in COP */}
                    <div className="flex gap-3 items-center">
                      <img
                        src={apt.serviceImage}
                        alt={apt.serviceName}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] truncate">
                            {apt.clientName}
                          </h4>
                          <span className="text-sm font-bold text-[#64444B] font-mono shrink-0 ml-2">
                            {formatCOP(apt.totalPrice)}
                          </span>
                        </div>

                        <p className="text-xs text-[#644E53] truncate mt-0.5 font-medium">
                          {apt.serviceName} ({apt.serviceDuration} min)
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-[#64444B] mt-1">
                          <img
                            src={apt.specialistAvatar}
                            alt={apt.specialistName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="truncate">
                            Asignada: <strong>{apt.specialistName}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 1-CLIC FAST WHATSAPP ACTIONS (SOLVES DELAYS & NO-SHOW BOTTLENECK) */}
                    <div className="p-2.5 rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9]/50 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[#1F1417] font-semibold">
                        <span className="material-symbols-outlined text-[15px] text-[#52b788]">call</span>
                        <span>{apt.clientPhone}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickReminder(apt)}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="Enviar recordatorio automático por WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[13px]">notifications_active</span>
                          <span>Recordar</span>
                        </button>

                        <button
                          onClick={() => handleTableReady(apt)}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F6E3E6] text-[#64444B] text-[10px] font-bold border border-[#EAD6D9] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="Avisar a la clienta que su mesa en cabina está lista"
                        >
                          <span className="material-symbols-outlined text-[13px]">chair</span>
                          <span>Mesa Lista</span>
                        </button>

                        <a
                          href={`https://wa.me/${(apt.clientPhone || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-full text-[#52b788] hover:bg-emerald-50 transition-colors"
                          title="Abrir chat directo en WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </a>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-[#ebe8e2] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#644E53]">
                          <span>Estado:</span>
                          <select
                            value={apt.status}
                            onChange={(e) => handleStatusChangeWithNotification(apt, e.target.value as any)}
                            className="h-7 px-2 rounded-full bg-[#F6E3E6] border border-[#EAD6D9] text-[11px] font-bold text-[#1F1417] focus:outline-none cursor-pointer"
                          >
                            <option value="confirmada">Confirmada</option>
                            <option value="en_preparacion">En Cabina</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                        </div>

                        <button
                          onClick={() => setSelectedAppointmentForQr(apt)}
                          className="h-7 px-2.5 rounded-full bg-white border border-[#EAD6D9] hover:bg-[#F6E3E6] text-[#64444B] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">qr_code</span>
                          <span>Pase QR</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setExpandedAptId(isExpanded ? null : apt.id)}
                        className="text-xs font-semibold text-[#64444B] hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                      >
                        <span>{isExpanded ? 'Menos' : 'Detalles'}</span>
                        <span className="material-symbols-outlined text-[16px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="p-3 rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9]/50 space-y-2 text-xs text-[#644E53] animate-in fade-in duration-150">
                        {apt.notes && (
                          <div>
                            <strong className="text-[#1F1417] block">Observaciones:</strong>
                            <p className="italic text-[#64444B] mt-0.5">{apt.notes}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EAD6D9]/40">
                          <div>
                            <span className="text-[10px] text-[#7D676B]">Tono Solicitado:</span>
                            <div className="font-semibold text-[#1F1417]">{apt.polishColor || 'Por definir'}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7D676B]">Forma de Uña:</span>
                            <div className="font-semibold text-[#1F1417]">{apt.nailShape || 'Por definir'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. CAJA & ARQUEO TAB (WITH SPLIT PAYMENT & CHANGE CALCULATOR) */}
      {activeAdminTab === 'caja' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setShowNewCutModal(true)}
              className="p-4 rounded-3xl bg-[#64444B] text-white text-xs font-bold shadow-xs hover:bg-[#52363C] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>+ Registrar Cobro (Efectivo / Mixto)</span>
            </button>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="p-4 rounded-3xl bg-white border border-rose-300 text-[#ba1a1a] text-xs font-bold shadow-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">remove_circle_outline</span>
              <span>- Gasto de Caja Menor</span>
            </button>

            <button
              onClick={() => {
                setCountedCash(expectedCashInHand);
                setShowCloseModal(true);
              }}
              className="p-4 rounded-3xl bg-white border border-emerald-400 text-emerald-800 text-xs font-bold shadow-xs hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">lock_clock</span>
              <span>Arqueo &amp; Cierre de Caja</span>
            </button>
          </div>

          {/* Arqueo de Canales Dashboard in COP */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAD6D9]/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#ebe8e2] pb-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#64444B] text-[20px]">account_balance_wallet</span>
                Arqueo de Caja &amp; Gaveta Física (Pesos Colombianos)
              </h4>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                En Vivo Firestore
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9]">
                <span className="text-[10px] text-[#644E53] block font-semibold">Base Inicial en Caja:</span>
                <strong className="text-base text-[#1F1417] font-bold font-mono">{formatCOP(cashBase)}</strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9]">
                <span className="text-[10px] text-[#644E53] block font-semibold">(+) Entradas Efectivo:</span>
                <strong className="text-base text-emerald-700 font-bold font-mono">+{formatCOP(totalCashIncome)}</strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF4F5] border border-[#EAD6D9]">
                <span className="text-[10px] text-[#644E53] block font-semibold">(-) Gastos Caja Menor:</span>
                <strong className="text-base text-[#ba1a1a] font-bold font-mono">-{formatCOP(totalExpensesAmount)}</strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F6E3E6] border border-[#C5838D]">
                <span className="text-[10px] text-[#64444B] font-semibold block">Efectivo en Gaveta:</span>
                <strong className="text-base text-[#64444B] font-bold font-mono">{formatCOP(expectedCashInHand)}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ebe8e2] flex items-center justify-between text-xs">
              <span className="text-[#644E53] font-medium">Entradas Digitales (Nequi / Daviplata / Datáfono):</span>
              <strong className="text-[#71547c] font-mono text-sm font-bold">{formatCOP(totalDigitalIncome)}</strong>
            </div>
          </div>

          {/* Historial de Cobros Registrados */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAD6D9]/60 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
              Registro de Cobros de la Jornada ({cuts.length})
            </h4>

            {cuts.length === 0 ? (
              <p className="text-xs text-[#7D676B] text-center py-6">
                No hay cobros registrados aún en este turno.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#EAD6D9]/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF4F5] text-[#644E53] font-semibold border-b border-[#EAD6D9]/60">
                    <tr>
                      <th className="p-3">Hora</th>
                      <th className="p-3">Clienta</th>
                      <th className="p-3">Servicio</th>
                      <th className="p-3">Especialista</th>
                      <th className="p-3">Método</th>
                      <th className="p-3 text-right">Total Cobrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAD6D9]/40 bg-white">
                    {cuts.map((cut) => (
                      <tr key={cut.id} className="hover:bg-[#FAF4F5]/50 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-[#7D676B]">{cut.hora}</td>
                        <td className="p-3 font-semibold text-[#1F1417]">{cut.clienteNombre}</td>
                        <td className="p-3 text-[#644E53]">{cut.servicioNombre}</td>
                        <td className="p-3 text-[#64444B]">{cut.especialistaNombre}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cut.metodoPago === 'efectivo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cut.metodoPago === 'mixto'
                                ? 'bg-[#64444B]/15 text-[#64444B]'
                                : 'bg-[#f8d8ff] text-[#71547c]'
                            }`}
                          >
                            {cut.metodoPago === 'efectivo' && 'Efectivo'}
                            {cut.metodoPago === 'nequi_daviplata' && 'Nequi / Davi'}
                            {cut.metodoPago === 'tarjeta_datafono' && 'Datáfono'}
                            {cut.metodoPago === 'mixto' && 'Pago Mixto'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#1F1417]">
                          {formatCOP(cut.servicioPrecio + cut.propina)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. LIQUIDACIÓN TAB (WITH 1-CLIC WHATSAPP DISPATCH) */}
      {activeAdminTab === 'cortes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                Liquidación Diaria de Especialistas
              </h3>
              <p className="text-xs text-[#644E53]">
                Comisiones calculadas automáticamente según el porcentaje pactado + propinas directas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialistsLiquidation.map((spec) => (
              <div
                key={spec.id}
                className="bg-white rounded-3xl p-5 border border-[#EAD6D9]/60 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src={spec.avatar}
                      alt={spec.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-[#64444B]/30"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                        {spec.name}
                      </h4>
                      <p className="text-xs text-[#64444B] font-medium">
                        {spec.role} · {spec.commissionRate}% comisión
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-emerald-700 font-mono">
                        {formatCOP(spec.payoutTotal)}
                      </span>
                      <span className="block text-[10px] text-[#7D676B]">A Liquidar</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#ebe8e2] grid grid-cols-3 gap-1 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#7D676B] block">Servicios ({spec.cutsCount}):</span>
                      <strong className="text-[#1F1417] font-mono">{formatCOP(spec.totalServices)}</strong>
                    </div>
                    <div className="border-x border-[#ebe8e2]">
                      <span className="text-[10px] text-[#7D676B] block">Comisión:</span>
                      <strong className="text-[#64444B] font-mono">{formatCOP(spec.totalCommission)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7D676B] block">Propinas:</span>
                      <strong className="text-emerald-700 font-mono">+{formatCOP(spec.totalTips)}</strong>
                    </div>
                  </div>
                </div>

                {/* 1-CLIC SPECIALIST LIQUIDATION DISPATCH VIA WHATSAPP (SOLVES RECEPTION QUEUES) */}
                <div className="pt-3 border-t border-[#ebe8e2]">
                  <button
                    onClick={() => handleSendSpecialistLiquidation(spec)}
                    className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">send</span>
                    <span>Enviar Liquidación por WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CLIENTES TAB */}
      {activeAdminTab === 'clientes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
              Directorio de Clientes ({clientProfiles.length})
            </h3>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              100% Verificados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientProfiles.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-3xl p-5 border border-[#EAD6D9]/60 shadow-xs space-y-3 flex flex-col justify-between hover:border-[#64444B]/50 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                        {client.nombre}
                      </h4>
                      <p className="text-xs text-[#644E53] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px] text-[#52b788]">call</span>
                        <span>{client.telefono}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        client.clasificacion === 'VIP Frecuente'
                          ? 'bg-[#ffdadc] text-[#7c5357]'
                          : 'bg-[#dce8dc] text-[#2d6a4f]'
                      }`}
                    >
                      {client.clasificacion}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#ebe8e2] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#7D676B]">Total Visitas:</span>
                      <strong className="block text-[#1F1417]">{client.totalCitas} citas</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7D676B]">Inversión Total:</span>
                      <strong className="block text-[#64444B] font-mono">{formatCOP(client.gastoTotal)}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#ebe8e2] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedClientForHistory(client)}
                    className="px-3.5 py-1.5 rounded-full bg-[#64444B] hover:bg-[#52363C] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">history</span>
                    <span>Ver Citas</span>
                  </button>

                  <a
                    href={`https://wa.me/${(client.telefono || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">chat</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: TURNO EXPRESS (WALK-IN) EN 10 SEGUNDOS */}
      {showExpressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#64444B] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">flash_on</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                    Turno Express (Walk-in en 10s)
                  </h3>
                  <p className="text-[10px] text-[#644E53]">Ingreso rápido para clientas que llegan directamente a recepción</p>
                </div>
              </div>

              <button
                onClick={() => setShowExpressModal(false)}
                className="w-7 h-7 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {expressValidationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {expressValidationError}
              </div>
            )}

            <form onSubmit={handleCreateExpressAppointment} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#644E53] mb-1">Nombre de la Clienta</label>
                  <input
                    type="text"
                    required
                    value={expressClientName}
                    onChange={(e) => setExpressClientName(e.target.value)}
                    placeholder="Ej. Carolina Gómez"
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#644E53] mb-1">WhatsApp (+57)</label>
                  <input
                    type="text"
                    required
                    value={expressClientPhone}
                    onChange={(e) => setExpressClientPhone(e.target.value)}
                    placeholder="+57 312 849 2011"
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs font-mono text-[#1F1417]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Tratamiento / Servicio</label>
                <select
                  value={expressServiceId}
                  onChange={(e) => setExpressServiceId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                >
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {formatCOP(s.price)} ({s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#644E53] mb-1">Manicurista Disponible</label>
                  <select
                    value={expressSpecialistId}
                    onChange={(e) => setExpressSpecialistId(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                  >
                    {SPECIALISTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#644E53] mb-1">Estado de Entrada</label>
                  <select
                    value={expressStatus}
                    onChange={(e) => setExpressStatus(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                  >
                    <option value="en_preparacion">En Cabina (Inmediato)</option>
                    <option value="confirmada">En Sala de Espera</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Observación Rápida (Opcional)</label>
                <input
                  type="text"
                  value={expressNotes}
                  onChange={(e) => setExpressNotes(e.target.value)}
                  placeholder="Ej. Tono Glazed, uña almendrada..."
                  className="w-full h-8 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#EAD6D9]/80 flex items-center justify-between">
                <span className="text-[11px] text-[#644E53]">Enviar Pase Digital por WhatsApp</span>
                <input
                  type="checkbox"
                  checked={expressSendWhatsApp}
                  onChange={(e) => setExpressSendWhatsApp(e.target.checked)}
                  className="h-4 w-4 accent-[#64444B] cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Crear Turno Express &amp; Pasar a Cabina</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR CORTE / COBRO CON PAGO MIXTO Y CALCULADORA DE DEVUELTAS */}
      {showNewCutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-2">
              <h3 className="font-bold text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                Registrar Servicio Realizado en Caja (COP)
              </h3>
              <button
                onClick={() => setShowNewCutModal(false)}
                className="w-7 h-7 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {cutValidationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {cutValidationError}
              </div>
            )}

            <form onSubmit={handleSubmitCut} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#644E53] mb-1">Nombre de la Clienta</label>
                  <input
                    type="text"
                    required
                    value={cutClientName}
                    onChange={(e) => setCutClientName(e.target.value)}
                    placeholder="Ej. Mariana Duque"
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#644E53] mb-1">WhatsApp (+57)</label>
                  <input
                    type="text"
                    required
                    value={cutClientPhone}
                    onChange={(e) => setCutClientPhone(e.target.value)}
                    placeholder="+57 312 849 2011"
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs font-mono text-[#1F1417]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#644E53] mb-1">Valor en COP ($)</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={cutServicePrice}
                    onChange={(e) => setCutServicePrice(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs font-mono font-bold text-[#64444B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#644E53] mb-1">Propina COP ($)</label>
                  <input
                    type="number"
                    step="1000"
                    value={cutTip}
                    onChange={(e) => setCutTip(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs font-mono text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Manicurista Asignada</label>
                <select
                  value={cutSpecialistId}
                  onChange={(e) => setCutSpecialistId(e.target.value)}
                  className="w-full h-9 px-2 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                >
                  {SPECIALISTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.commissionRate}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* PAYMENT METHOD SELECTOR WITH SPLIT PAYMENT SUPPORT */}
              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Método de Pago</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCutPaymentMethod('efectivo')}
                    className={`p-2 rounded-xl text-center border font-bold text-[11px] cursor-pointer transition-all ${
                      cutPaymentMethod === 'efectivo'
                        ? 'bg-[#64444B] text-white border-[#64444B]'
                        : 'bg-white text-[#644E53] border-[#EAD6D9]'
                    }`}
                  >
                    💵 Efectivo
                  </button>

                  <button
                    type="button"
                    onClick={() => setCutPaymentMethod('nequi_daviplata')}
                    className={`p-2 rounded-xl text-center border font-bold text-[11px] cursor-pointer transition-all ${
                      cutPaymentMethod === 'nequi_daviplata'
                        ? 'bg-[#64444B] text-white border-[#64444B]'
                        : 'bg-white text-[#644E53] border-[#EAD6D9]'
                    }`}
                  >
                    📱 Nequi/Davi
                  </button>

                  <button
                    type="button"
                    onClick={() => setCutPaymentMethod('tarjeta_datafono')}
                    className={`p-2 rounded-xl text-center border font-bold text-[11px] cursor-pointer transition-all ${
                      cutPaymentMethod === 'tarjeta_datafono'
                        ? 'bg-[#64444B] text-white border-[#64444B]'
                        : 'bg-white text-[#644E53] border-[#EAD6D9]'
                    }`}
                  >
                    💳 Datáfono
                  </button>

                  <button
                    type="button"
                    onClick={() => setCutPaymentMethod('mixto')}
                    className={`p-2 rounded-xl text-center border font-bold text-[11px] cursor-pointer transition-all ${
                      cutPaymentMethod === 'mixto'
                        ? 'bg-[#64444B] text-white border-[#64444B]'
                        : 'bg-white text-[#644E53] border-[#EAD6D9]'
                    }`}
                  >
                    ⚡ Pago Mixto
                  </button>
                </div>
              </div>

              {/* SPLIT PAYMENT CONFIGURATION */}
              {cutPaymentMethod === 'mixto' && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#EAD6D9] space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#64444B]">
                    <span>Desglose de Pago Dividido:</span>
                    <span>Total: {formatCOP(cutServicePrice + cutTip)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#644E53] mb-0.5">
                        Monto Efectivo ($)
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={cutMontoEfectivo}
                        onChange={(e) => setCutMontoEfectivo(Number(e.target.value))}
                        className="w-full h-8 px-2.5 rounded-lg bg-[#FAF4F5] border border-[#EAD6D9] text-xs font-mono font-bold text-[#1F1417]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#644E53] mb-0.5">
                        Monto Digital ($)
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={cutMontoDigital}
                        className="w-full h-8 px-2.5 rounded-lg bg-gray-50 border border-[#EAD6D9] text-xs font-mono font-bold text-[#71547c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#644E53] mb-0.5">
                      Canal Digital del Restante
                    </label>
                    <select
                      value={cutDigitalMethod}
                      onChange={(e) => setCutDigitalMethod(e.target.value as any)}
                      className="w-full h-8 px-2 rounded-lg bg-[#FAF4F5] border border-[#EAD6D9] text-xs text-[#1F1417]"
                    >
                      <option value="nequi_daviplata">Transferencia Nequi / Daviplata</option>
                      <option value="tarjeta_datafono">Tarjeta Débito/Crédito Datáfono</option>
                    </select>
                  </div>
                </div>
              )}

              {/* CALCULADORA RÁPIDA DE DEVUELTAS (SOLVES CASH MISMATCHES) */}
              {(cutPaymentMethod === 'efectivo' || cutPaymentMethod === 'mixto') && (
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">calculate</span>
                      <span>Calculadora de Devuelta</span>
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      A Cobrar en Efectivo: <strong>{formatCOP(targetCashToPay)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] text-emerald-800 mb-0.5">Efectivo Recibido</label>
                      <input
                        type="number"
                        step="1000"
                        value={cutCashReceived}
                        onChange={(e) => setCutCashReceived(Number(e.target.value))}
                        className="w-full h-8 px-2.5 rounded-lg bg-white border border-emerald-300 text-xs font-mono font-bold text-[#1F1417]"
                      />
                    </div>

                    <div className="flex-1 text-right">
                      <span className="block text-[10px] text-emerald-800 mb-0.5">Devuelta Exacta:</span>
                      <div className="h-8 px-3 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-end shadow-2xs">
                        {formatCOP(cashChange)}
                      </div>
                    </div>
                  </div>

                  {/* Fast bill pills */}
                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-[9px] text-emerald-800">Billetes:</span>
                    <button
                      type="button"
                      onClick={() => setCutCashReceived(targetCashToPay)}
                      className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      Exacto
                    </button>
                    <button
                      type="button"
                      onClick={() => setCutCashReceived(50000)}
                      className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      $50k
                    </button>
                    <button
                      type="button"
                      onClick={() => setCutCashReceived(100000)}
                      className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      $100k
                    </button>
                    <button
                      type="button"
                      onClick={() => setCutCashReceived(200000)}
                      className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                    >
                      $200k
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              >
                Guardar Cobro &amp; Enviar Recibo WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GASTO DE CAJA MENOR */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-2">
              <h3 className="font-bold text-sm text-[#ba1a1a]">Registrar Egreso / Gasto de Caja Menor</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="w-7 h-7 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {expenseValidationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {expenseValidationError}
              </div>
            )}

            <form onSubmit={handleSubmitExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Concepto del Gasto</label>
                <input
                  type="text"
                  required
                  value={expenseConcept}
                  onChange={(e) => setExpenseConcept(e.target.value)}
                  placeholder="Ej. Insumos desechables o esterilización"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#EAD6D9] text-xs text-[#1F1417]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Monto en COP ($)</label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl bg-white border border-rose-300 text-xs font-mono font-bold text-[#ba1a1a]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              >
                Descontar de Caja Menor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ARQUEO CIEGO / CIERRE DE CAJA */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[#FAF4F5] rounded-3xl p-6 shadow-2xl border border-[#EAD6D9] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAD6D9]/50 pb-2">
              <h3 className="font-bold text-sm text-[#1F1417] font-['Plus_Jakarta_Sans',sans-serif]">
                Arqueo &amp; Cierre de Caja del Día
              </h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="w-7 h-7 rounded-full hover:bg-[#F6E3E6] flex items-center justify-center text-[#644E53]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#644E53]">
                <span>Efectivo Esperado en Gaveta:</span>
                <strong className="font-mono text-[#1F1417]">{formatCOP(expectedCashInHand)}</strong>
              </div>

              <div>
                <label className="block font-semibold text-[#644E53] mb-1">Efectivo Físico Contado ($)</label>
                <input
                  type="number"
                  step="1000"
                  value={countedCash}
                  onChange={(e) => setCountedCash(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#EAD6D9] text-sm font-mono font-bold text-[#64444B]"
                />
              </div>

              {/* Balance Badge */}
              <div
                className={`p-2.5 rounded-xl text-center font-bold text-xs ${
                  countedCash === expectedCashInHand
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : countedCash > expectedCashInHand
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {countedCash === expectedCashInHand && '✓ Caja Cuadrada Perfecta ($0 de Diferencia)'}
                {countedCash > expectedCashInHand && `⚠ Sobrante en Caja: +${formatCOP(countedCash - expectedCashInHand)}`}
                {countedCash < expectedCashInHand && `✕ Faltante en Caja: -${formatCOP(expectedCashInHand - countedCash)}`}
              </div>
            </div>

            <button
              onClick={handleSaveClose}
              className="w-full py-3 rounded-xl bg-[#64444B] hover:bg-[#52363C] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Confirmar Arqueo &amp; Firmar Cierre
            </button>
          </div>
        </div>
      )}

      {/* Client History Modal */}
      <ClientHistoryModal
        client={selectedClientForHistory}
        appointments={appointments}
        cuts={cuts}
        onClose={() => setSelectedClientForHistory(null)}
      />

      {/* QR Code Modal */}
      <QrCodeModal
        appointment={selectedAppointmentForQr}
        onClose={() => setSelectedAppointmentForQr(null)}
      />

      {/* UltraMsg Config Modal */}
      <UltraMsgConfigModal
        isOpen={isUltraMsgModalOpen}
        onClose={() => setIsUltraMsgModalOpen(false)}
      />
    </div>
  );
};
