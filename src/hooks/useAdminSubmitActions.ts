import type { FormEvent, Dispatch, SetStateAction } from 'react';
import type {
  Appointment,
  SalonCutRecord,
  ExpenseRecord,
  CashRegisterClose,
  Service,
  Specialist,
  AgendaBlock,
  PaymentMethod
} from '../types';
import { sanitizeToPlainText, validateColombianPhone, checkRateLimit, validateAndClean } from '../utils/security';
import { sendUltraMsgWhatsApp, getUltraMsgConfig, renderTemplate } from '../services/whatsappService';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { getColombiaDateISO, getColombiaTimeStr, generateSecureId, generateBookingCode, formatDisplayDate } from '../utils/dateAndId';
import { getCoveredSlots, isSpecialistBlockedOnDate } from '../utils/calendarAvailability';
import { formatCOP } from '../utils/format';

export interface UseAdminSubmitActionsParams {
  // Express appointment state & setters
  expressClientName: string;
  setExpressClientName: Dispatch<SetStateAction<string>>;
  expressClientPhone: string;
  expressServiceId: string;
  expressSpecialistId: string;
  expressTime: string;
  expressStatus: 'en_preparacion' | 'confirmada';
  expressNotes: string;
  setExpressNotes: Dispatch<SetStateAction<string>>;
  expressSendWhatsApp: boolean;
  setExpressValidationError: Dispatch<SetStateAction<string | null>>;
  setIsSubmittingExpress: Dispatch<SetStateAction<boolean>>;
  setShowExpressModal: Dispatch<SetStateAction<boolean>>;

  // Cut state & setters
  selectedAppointmentIdForCut: string;
  setSelectedAppointmentIdForCut: Dispatch<SetStateAction<string>>;
  cutClientName: string;
  setCutClientName: Dispatch<SetStateAction<string>>;
  cutClientPhone: string;
  cutServiceName: string;
  cutServicePrice: number;
  cutSpecialistId: string;
  cutPaymentMethod: PaymentMethod;
  cutTip: number;
  cutNote: string;
  setCutNote: Dispatch<SetStateAction<string>>;
  cutMontoEfectivo: number;
  cutMontoDigital: number;
  cutDigitalMethod: 'nequi_daviplata' | 'tarjeta_datafono';
  setCutValidationError: Dispatch<SetStateAction<string | null>>;
  setIsSubmittingCut: Dispatch<SetStateAction<boolean>>;
  setShowNewCutModal: Dispatch<SetStateAction<boolean>>;

  // Expense state & setters
  expenseConcept: string;
  setExpenseConcept: Dispatch<SetStateAction<string>>;
  expenseAmount: number;
  expenseCategory: 'insumos' | 'servicios' | 'mantenimiento' | 'caja_menor';
  setExpenseValidationError: Dispatch<SetStateAction<string | null>>;
  setIsSubmittingExpense: Dispatch<SetStateAction<boolean>>;
  setShowExpenseModal: Dispatch<SetStateAction<boolean>>;

  // Cash close state & setters
  countedCash: number;
  setIsSubmittingClose: Dispatch<SetStateAction<boolean>>;
  setShowCloseModal: Dispatch<SetStateAction<boolean>>;
  cashBase: number;
  selectedDate: string;
  totalCashIncome: number;
  totalDigitalIncome: number;
  totalExpensesAmount: number;
  expectedCashInHand: number;

  // External context & handlers
  appointments: Appointment[];
  services: Service[];
  specialists: Specialist[];
  agendaBlocks: AgendaBlock[];
  activeBranchId: string;
  activeUserName: string;
  onAddAppointment?: (appointment: Appointment) => Promise<void>;
  onRegisterCut: (cut: SalonCutRecord) => Promise<void>;
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => Promise<void> | void;
  onAddExpense: (expense: ExpenseRecord) => Promise<void>;
  onSaveCashClose: (close: CashRegisterClose) => Promise<void>;
  notify: (msg: string) => void;
}

export function useAdminSubmitActions({
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
}: UseAdminSubmitActionsParams) {
  // CREATE WALK-IN / TURNO EXPRESS APPOINTMENT
  const handleCreateExpressAppointment = async (e: FormEvent) => {
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

    if (isSpecialistBlockedOnDate(selectedSpec.id, currentDateISO, agendaBlocks)) {
      setExpressValidationError(`La agenda de ${selectedSpec.name} está bloqueada hoy. Elige otra especialista.`);
      return;
    }
    if (getCoveredSlots(expressTime, selectedServ.durationMinutes) === null) {
      setExpressValidationError(`Este servicio dura ${selectedServ.durationMinutes} minutos y terminaría después de las 7:00 p. m. Elige un horario más temprano.`);
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

  // Submit new Cut with validation, split payment & rate limit
  const handleSubmitCut = async (e: FormEvent) => {
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

  // Submit expense
  const handleSubmitExpense = async (e: FormEvent) => {
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

  return {
    handleCreateExpressAppointment,
    handleSubmitCut,
    handleSubmitExpense,
    handleSaveClose
  };
}
