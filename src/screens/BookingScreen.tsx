import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Service, Specialist, Appointment, SlotLock } from '../types';
import { SERVICES, SPECIALISTS, ADD_ON_OPTIONS } from '../data/mockData';
import { formatCOP } from '../utils/format';
import { sendUltraMsgWhatsApp, getUltraMsgConfig, renderTemplate } from '../services/whatsappService';
import { saveAppointmentWithLockInFirestore } from '../services/firestoreService';
import {
  getUpcomingCalendarDays,
  computeSlotAvailability,
  CalendarDayOption
} from '../utils/calendarAvailability';
import { sanitizeToPlainText, validateColombianPhone, checkRateLimit, validateAndClean, isValidEmail } from '../utils/security';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { getColombiaDateISO, generateSecureId, generateBookingCode, formatDisplayDate } from '../utils/dateAndId';
import { BookingConfirmationView } from '../components/booking/BookingConfirmationView';
import { trackBeginBooking } from '../services/analyticsService';
import { BookingStepService } from '../components/booking/BookingStepService';
import { BookingStepDateTime } from '../components/booking/BookingStepDateTime';
import { BookingStepCustomization } from '../components/booking/BookingStepCustomization';
import { BookingStepClientInfo } from '../components/booking/BookingStepClientInfo';

interface BookingScreenProps {
  initialService?: Service | null;
  initialSpecialist?: Specialist | null;
  promoDiscountPercent?: number;
  appointments?: Appointment[];
  slotLocks?: SlotLock[];
  onBookingSuccess: (appointment: Appointment) => void;
  onNavigateToAppointments: () => void;
  onNavigateToServices?: () => void;
  isPublicView?: boolean;
  services?: Service[];
  specialists?: Specialist[];
  onOpenDataPolicy?: () => void;
  onOpenPrivacyNotice?: () => void;
  onOpenTerms?: () => void;
  showToast?: (msg: string) => void;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  initialService,
  initialSpecialist,
  promoDiscountPercent = 0,
  appointments = [],
  slotLocks = [],
  onBookingSuccess,
  onNavigateToAppointments,
  onNavigateToServices,
  isPublicView = false,
  services = SERVICES,
  specialists = SPECIALISTS,
  onOpenDataPolicy,
  onOpenPrivacyNotice,
  onOpenTerms,
  showToast
}) => {
  const [step, setStep] = useState<number>(1);
  const bookingContainerRef = useRef<HTMLDivElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
  const dataPolicyCheckboxRef = useRef<HTMLInputElement>(null);
  const isFirstMount = useRef<boolean>(true);

  // Smooth scroll to the top of the booking section with sticky header offset
  const scrollToBookingTop = () => {
    const target = stepperRef.current || bookingContainerRef.current;
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Trigger smooth scroll upon step change (excluding initial render)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    scrollToBookingTop();
  }, [step]);

  const [formError, setFormError] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<Appointment | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Scroll to top when booking is confirmed
  useEffect(() => {
    if (bookingConfirmed) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [bookingConfirmed]);

  const goToStep = (nextStep: number) => {
    if (nextStep === 2) {
      trackBeginBooking(selectedService?.name || 'Servicio');
    }
    setStep(nextStep);
    if (nextStep > 1) {
      window.history.pushState({ bookingStep: nextStep }, '', `#/reservar/paso-${nextStep}`);
    } else {
      window.history.pushState({ bookingStep: 1 }, '', '#/reservar');
    }
    setTimeout(scrollToBookingTop, 20);
  };

  // Listen for browser Back / Forward between booking steps
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && typeof e.state.bookingStep === 'number') {
        setStep(e.state.bookingStep);
      } else {
        const hash = window.location.hash.toLowerCase();
        if (hash.includes('paso-4')) setStep(4);
        else if (hash.includes('paso-3')) setStep(3);
        else if (hash.includes('paso-2')) setStep(2);
        else if (hash.includes('reservar')) setStep(1);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Local calendar 7-day window
  const calendarDays = useMemo(() => getUpcomingCalendarDays(), []);

  // Form selections
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialService || services[0] || null
  );
  
  // Specialist selection ('any' or specialist id)
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>(
    initialSpecialist ? initialSpecialist.id : 'any'
  );

  // Determinar día inicial con disponibilidad (si hoy ya pasaron las horas, comenzar en mañana)
  const initialCalendarDay = useMemo(() => {
    if (calendarDays.length > 1) {
      const todaySlots = computeSlotAvailability(calendarDays[0], 'any', appointments, slotLocks, new Date(), specialists);
      const freeCount = todaySlots.filter((s) => s.status === 'available').length;
      if (freeCount === 0) {
        return calendarDays[1];
      }
    }
    return calendarDays[0];
  }, [calendarDays, appointments, slotLocks, specialists]);

  const [selectedDateOption, setSelectedDateOption] = useState<CalendarDayOption>(
    initialCalendarDay || calendarDays[0] || {
      id: '2026-09-28',
      label: 'Hoy',
      dayName: 'Hoy',
      dateNum: '28',
      full: 'Hoy, 28 Sept',
      dayOfWeek: 'Lun',
      isToday: true,
      dateObj: new Date()
    }
  );

  // Si en el primer render hoy no tiene turnos libres, mover al día con disponibilidad
  useEffect(() => {
    if (initialCalendarDay && selectedDateOption.isToday) {
      const todaySlots = computeSlotAvailability(selectedDateOption, selectedSpecialistId, appointments, slotLocks, new Date(), specialists);
      const freeCount = todaySlots.filter((s) => s.status === 'available').length;
      if (freeCount === 0 && calendarDays[1]) {
        setSelectedDateOption(calendarDays[1]);
      }
    }
  }, [initialCalendarDay]);

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPolish, setSelectedPolish] = useState<string>('Hailey Glazed Pearl');
  const [selectedShape, setSelectedShape] = useState<string>('Almendra Suave');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [acceptedDataPolicy, setAcceptedDataPolicy] = useState<boolean>(false);
  const [dataPolicyError, setDataPolicyError] = useState<boolean>(false);
  const [localToast, setLocalToast] = useState<string | null>(null);

  // Auto-dismiss local toast
  useEffect(() => {
    if (localToast) {
      const timer = setTimeout(() => setLocalToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [localToast]);

  // Sync if initial props change
  useEffect(() => {
    if (initialService) setSelectedService(initialService);
  }, [initialService]);

  useEffect(() => {
    if (initialSpecialist) setSelectedSpecialistId(initialSpecialist.id);
  }, [initialSpecialist]);

  // Resolve current specialist object
  const currentSpecialist = useMemo(() => {
    if (selectedSpecialistId === 'any') return null;
    return specialists.find((s) => s.id === selectedSpecialistId) || null;
  }, [selectedSpecialistId, specialists]);

  // Compute live availability for current specialist/date
  const availableTimeSlots = useMemo(() => {
    return computeSlotAvailability(
      selectedDateOption,
      selectedSpecialistId,
      appointments,
      slotLocks,
      new Date(),
      specialists
    );
  }, [selectedSpecialistId, selectedDateOption, appointments, slotLocks, specialists]);

  // Compute day stats for each specialist
  const daySpecialistStats = useMemo(() => {
    const map: Record<string, { total: number; booked: number; free: number }> = {};
    for (const spec of specialists) {
      const slots = computeSlotAvailability(selectedDateOption, spec.id, appointments, slotLocks, new Date(), specialists);
      const freeCount = slots.filter((s) => s.status === 'available').length;
      map[spec.id] = { total: slots.length, booked: slots.length - freeCount, free: freeCount };
    }
    return map;
  }, [selectedDateOption, appointments, slotLocks, specialists]);

  // Pricing Calculation in COP
  const basePrice = selectedService ? selectedService.price : 0;
  const addOnsTotal = selectedAddOns.reduce((acc, name) => {
    const opt = ADD_ON_OPTIONS.find((a) => a.name === name);
    return acc + (opt ? opt.price : 0);
  }, 0);
  const subtotal = basePrice + addOnsTotal;
  const discountAmount = promoDiscountPercent > 0 ? (subtotal * promoDiscountPercent) / 100 : 0;
  const finalPrice = Math.max(0, subtotal - discountAmount);

  // Toggle Add-ons
  const toggleAddOn = (addonName: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addonName) ? prev.filter((a) => a !== addonName) : [...prev, addonName]
    );
  };

  // Confirm booking & Plain Text Validation
  const handleConfirmBooking = async () => {
    setFormError(null);

    // B3: Sin servicio no se puede confirmar
    if (!selectedService) {
      setFormError('Por favor selecciona un servicio de nuestro menú para continuar.');
      return;
    }

    // 1. Validaciones y Saneamiento Centralizado de Texto Plano
    const nameClean = validateAndClean(clientName, 'Nombre Completo', 100);
    if (!nameClean.ok) {
      setFormError(nameClean.error || 'Nombre completo no válido.');
      return;
    }
    if (!nameClean.value.trim()) {
      setFormError('El nombre completo es obligatorio para confirmar tu reserva.');
      return;
    }

    const notesClean = validateAndClean(clientNotes, 'Observaciones y Notas', 500);
    if (!notesClean.ok) {
      setFormError(notesClean.error || 'Observaciones no válidas.');
      return;
    }

    const polishClean = validateAndClean(selectedPolish, 'Tono de Esmalte', 100);
    if (!polishClean.ok) {
      setFormError(polishClean.error || 'Tono de esmalte no válido.');
      return;
    }

    const shapeClean = validateAndClean(selectedShape, 'Forma de Uña', 100);
    if (!shapeClean.ok) {
      setFormError(shapeClean.error || 'Forma de uña no válida.');
      return;
    }

    // Validar correo opcional si se ingresó
    let cleanClientEmail = '';
    if (clientEmail && clientEmail.trim()) {
      const emailRes = validateAndClean(clientEmail, 'Correo Electrónico', 120);
      if (!emailRes.ok) {
        setFormError(emailRes.error || 'Correo electrónico inválido.');
        return;
      }
      if (!isValidEmail(emailRes.value)) {
        setFormError('El formato del correo electrónico no es válido (ej. usuario@dominio.com).');
        return;
      }
      cleanClientEmail = emailRes.value.toLowerCase();
    }

    // Validar horario obligatorio
    if (!selectedTime) {
      setFormError('Por favor selecciona un horario disponible en el paso 2.');
      return;
    }

    // B3: Autorización obligatoria de tratamiento de datos personales (Ley 1581 de 2012)
    if (!acceptedDataPolicy) {
      setDataPolicyError(true);
      const errorMsg = 'Debes aceptar el tratamiento de datos personales para confirmar tu reserva';
      setFormError(errorMsg);
      if (showToast) {
        showToast(errorMsg);
      }
      setLocalToast(errorMsg);
      setTimeout(() => {
        dataPolicyCheckboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dataPolicyCheckboxRef.current?.focus();
      }, 50);
      return;
    }

    // B3: El teléfono es obligatorio para confirmación de WhatsApp
    if (!clientPhone.trim()) {
      setFormError('El número de WhatsApp es obligatorio para confirmar tu reserva.');
      return;
    }

    const phoneCheck = validateColombianPhone(clientPhone);
    if (!phoneCheck.isValid) {
      setFormError(phoneCheck.reason || 'Número de WhatsApp inválido.');
      return;
    }

    // 2. Valores limpios garantizados
    const cleanClientName = nameClean.value || `Clienta ${BUSINESS_CONFIG.brandName}`;
    const cleanClientPhone = sanitizeToPlainText(clientPhone);
    const cleanClientNotes = notesClean.value;
    const cleanPolish = polishClean.value;
    const cleanShape = shapeClean.value;

    // B2: Resolver especialista asignada o rechazar con mensaje claro si no hay disponibilidad
    let assignedSpecialist = currentSpecialist;
    if (!assignedSpecialist) {
      const freeCandidate = specialists.find((spec) => {
        const slots = computeSlotAvailability(selectedDateOption, spec.id, appointments, slotLocks, new Date(), specialists);
        return slots.find((s) => s.slot === selectedTime)?.status === 'available';
      });
      if (!freeCandidate) {
        setFormError(`No hay especialistas disponibles a las ${selectedTime} para la fecha seleccionada. Por favor selecciona otro horario u otra fecha.`);
        return;
      }
      assignedSpecialist = freeCandidate;
    } else {
      const slots = computeSlotAvailability(selectedDateOption, assignedSpecialist.id, appointments, slotLocks, new Date(), specialists);
      const isAvailable = slots.find((s) => s.slot === selectedTime)?.status === 'available';
      if (!isAvailable) {
        setFormError(`La especialista ${assignedSpecialist.name} ya no tiene disponibilidad a las ${selectedTime}. Por favor selecciona otro horario disponible.`);
        return;
      }
    }

    const bookingCode = generateBookingCode(appointments.map((a) => a.bookingCode));

    const newAppointment: Appointment = {
      id: generateSecureId('apt'),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceDuration: selectedService.durationMinutes,
      serviceImage: selectedService.image || '',
      specialistId: assignedSpecialist.id,
      specialistName: assignedSpecialist.name,
      specialistRole: assignedSpecialist.role,
      specialistAvatar: assignedSpecialist.avatar || '',
      date: selectedDateOption.id,
      time: selectedTime,
      clientName: cleanClientName,
      clientPhone: cleanClientPhone,
      clientEmail: cleanClientEmail,
      notes: cleanClientNotes,
      polishColor: cleanPolish,
      nailShape: cleanShape,
      selectedAddOns,
      totalPrice: finalPrice,
      status: 'confirmada',
      bookingCode,
      createdAt: getColombiaDateISO(),
      autorizacionDatos: true,
      autorizacionFecha: getColombiaDateISO(),
      autorizacionVersion: BUSINESS_CONFIG.dataPolicyVersion
    };

    // Limite solo en el cliente. La proteccion real contra reservas masivas es Firebase App Check (pendiente).
    const rateCheck = checkRateLimit('booking');
    if (!rateCheck.allowed) {
      setFormError(`Has hecho muchas reservas seguidas. Espera ${rateCheck.retryAfterSeconds ?? 60} segundos.`);
      return;
    }

    setIsSendingWhatsApp(true);

    try {
      // B1: Bloqueo atómico en Firestore (impide colisiones y dobles reservas)
      await saveAppointmentWithLockInFirestore(newAppointment);

      try {
        const ultramsgConfig = getUltraMsgConfig();
        const messageBody = renderTemplate(ultramsgConfig.confirmationTemplate, {
          cliente: cleanClientName,
          servicio: selectedService.name,
          codigo: bookingCode,
          fecha: formatDisplayDate(selectedDateOption.id),
          hora: selectedTime,
          sede: BUSINESS_CONFIG.branchName,
          monto: formatCOP(finalPrice),
          estado: 'Confirmada'
        });

        await sendUltraMsgWhatsApp({
          phone: cleanClientPhone,
          message: messageBody,
          clientName: cleanClientName,
          bookingCode
        });
      } catch (notifErr) {
        console.warn('WhatsApp notificación no enviada:', notifErr);
      }

      onBookingSuccess(newAppointment);
      setBookingConfirmed(newAppointment);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error al procesar la reserva. Por favor intenta nuevamente.';
      setFormError(errMsg);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // If already confirmed:
  if (bookingConfirmed) {
    return (
      <BookingConfirmationView
        bookingConfirmed={bookingConfirmed}
        isPublicView={isPublicView}
        onNavigateToAppointments={onNavigateToAppointments}
        onReset={() => {
          setBookingConfirmed(null);
          setClientName('');
          setClientPhone('');
          setClientNotes('');
          setSelectedTime('');
          setAcceptedDataPolicy(false);
          setSelectedAddOns([]);
          setSelectedPolish('Hailey Glazed Pearl');
          setSelectedShape('Almendra Suave');
          setFormError(null);
          setDataPolicyError(false);
          setStep(1);
        }}
      />
    );
  }

  return (
    <div ref={bookingContainerRef} className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#C6BDAC]/35 via-[#F4EFE9] to-white p-6 sm:p-7 border border-[#C6BDAC] shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/50 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-[#2B2420] text-xs font-semibold mb-2 border border-[#C6BDAC]">
              <span className="material-symbols-outlined text-[15px] text-[#2B2420]">event_available</span>
              {BUSINESS_CONFIG.branchName} · Calendario en Tiempo Real
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#2B2420]">
              Reserva de Turno
            </h1>
            <p className="text-xs sm:text-sm text-[#5A4A43] mt-1 max-w-xl">
              Selecciona tu ritual de belleza, tu especialista favorita y un horario disponible en nuestro calendario local sincronizado.
            </p>
          </div>

          {onNavigateToServices && (
            <button
              onClick={onNavigateToServices}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#C6BDAC]/40 text-[#2B2420] border border-[#C6BDAC] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">spa</span>
              <span>Explorar Servicios</span>
            </button>
          )}
        </div>
      </div>

      {/* Booking Stepper */}
      <div ref={stepperRef} className="bg-white rounded-3xl p-4 sm:p-5 border border-[#C6BDAC] shadow-xs scroll-mt-24">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { num: 1, title: 'Servicio', icon: 'spa' },
            { num: 2, title: 'Horario', icon: 'calendar_month' },
            { num: 3, title: 'Estilo', icon: 'auto_fix_high' },
            { num: 4, title: 'Confirmar', icon: 'verified' }
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num <= step) goToStep(s.num);
                }}
                disabled={s.num > step}
                className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#BB9C87] text-[#2B2420] font-bold font-bold shadow-xs scale-[1.02]'
                    : isCompleted
                    ? 'bg-[#F4EFE9] text-[#2B2420] font-semibold hover:bg-[#C6BDAC]/40'
                    : 'bg-transparent text-[#5A4A43] opacity-50 cursor-not-allowed'
                }`}
                title={`Paso ${s.num}: ${s.title}`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">{s.num}.</span>
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Harmonious Transition Container for Active Step */}
      <div
        key={step}
        className="transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      >
        {/* STEP 1: SERVICE SELECTION */}
        {step === 1 && (
          <BookingStepService
            selectedService={selectedService}
            onSelectService={setSelectedService}
            onNext={() => goToStep(2)}
            services={services}
          />
        )}

        {/* STEP 2: DATE & SPECIALIST */}
        {step === 2 && (
          <BookingStepDateTime
            calendarDays={calendarDays}
            selectedDateOption={selectedDateOption}
            setSelectedDateOption={setSelectedDateOption}
            selectedSpecialistId={selectedSpecialistId}
            setSelectedSpecialistId={setSelectedSpecialistId}
            currentSpecialist={currentSpecialist}
            daySpecialistStats={daySpecialistStats}
            availableTimeSlots={availableTimeSlots}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            specialists={specialists}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        )}

        {/* STEP 3: PERSONALIZATION */}
        {step === 3 && (
          <BookingStepCustomization
            selectedShape={selectedShape}
            setSelectedShape={setSelectedShape}
            selectedPolish={selectedPolish}
            setSelectedPolish={setSelectedPolish}
            selectedAddOns={selectedAddOns}
            toggleAddOn={toggleAddOn}
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
          />
        )}

        {/* STEP 4: CLIENT CONTACT & FINAL CONFIRMATION */}
        {step === 4 && (
          <BookingStepClientInfo
            selectedService={selectedService}
            selectedDateOption={selectedDateOption}
            selectedTime={selectedTime}
            currentSpecialist={currentSpecialist}
            finalPrice={finalPrice}
            formError={formError}
            clientName={clientName}
            setClientName={setClientName}
            clientPhone={clientPhone}
            setClientPhone={setClientPhone}
            clientNotes={clientNotes}
            setClientNotes={setClientNotes}
            acceptedDataPolicy={acceptedDataPolicy}
            setAcceptedDataPolicy={setAcceptedDataPolicy}
            dataPolicyError={dataPolicyError}
            checkboxRef={dataPolicyCheckboxRef}
            onClearDataPolicyError={() => {
              setDataPolicyError(false);
              setLocalToast(null);
            }}
            onOpenDataPolicy={onOpenDataPolicy}
            onOpenPrivacyNotice={onOpenPrivacyNotice}
            onOpenTerms={onOpenTerms}
            isSendingWhatsApp={isSendingWhatsApp}
            onClearError={() => {
              setFormError(null);
              setDataPolicyError(false);
            }}
            onBack={() => goToStep(3)}
            onConfirm={handleConfirmBooking}
          />
        )}
      </div>

      {/* Floating alert toast for mobile and desktop */}
      {localToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#2B2420] text-[#F4EFE9] text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 max-w-[90vw]"
        >
          <span className="material-symbols-outlined text-rose-400 text-[20px] shrink-0">warning</span>
          <span>{localToast}</span>
        </div>
      )}
    </div>
  );
};
