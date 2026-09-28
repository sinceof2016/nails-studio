import React, { useState, useEffect, useMemo } from 'react';
import { Service, Specialist, Appointment } from '../types';
import {
  SERVICES,
  SPECIALISTS,
  POLISH_SWATCHES,
  NAIL_SHAPES,
  ADD_ON_OPTIONS
} from '../data/mockData';
import { formatCOP } from '../utils/format';
import { sendUltraMsgWhatsApp, buildWaMeUrl, getUltraMsgConfig, renderTemplate } from '../services/whatsappService';
import {
  getUpcomingCalendarDays,
  computeSlotAvailability,
  CalendarDayOption,
  SlotAvailability
} from '../utils/calendarAvailability';

interface BookingScreenProps {
  initialService?: Service | null;
  initialSpecialist?: Specialist | null;
  promoDiscountPercent?: number;
  appointments?: Appointment[];
  onBookingSuccess: (appointment: Appointment) => void;
  onNavigateToAppointments: () => void;
  onNavigateToServices?: () => void;
  isPublicView?: boolean;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  initialService,
  initialSpecialist,
  promoDiscountPercent = 0,
  appointments = [],
  onBookingSuccess,
  onNavigateToAppointments,
  onNavigateToServices,
  isPublicView = false
}) => {
  const [step, setStep] = useState<number>(1);

  // Local calendar 7-day window
  const calendarDays = useMemo(() => getUpcomingCalendarDays(), []);

  // Form selections
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialService || SERVICES[0]
  );
  
  // Specialist selection ('any' or specialist id)
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>(
    initialSpecialist ? initialSpecialist.id : 'any'
  );

  const [selectedDateOption, setSelectedDateOption] = useState<CalendarDayOption>(
    calendarDays[0] || {
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

  const [selectedTime, setSelectedTime] = useState<string>('11:00 AM');
  const [selectedPolish, setSelectedPolish] = useState<string>('Hailey Glazed Pearl');
  const [selectedShape, setSelectedShape] = useState<string>('Almendra Suave');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [clientName, setClientName] = useState<string>('Mariana Duque');
  const [clientPhone, setClientPhone] = useState<string>('+57 312 849 2011');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [bookingConfirmed, setBookingConfirmed] = useState<Appointment | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Active Redirection Assistant state when clicking on a busy slot
  const [redirectionSlot, setRedirectionSlot] = useState<string | null>(null);

  // Sync if initial props change
  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
    }
  }, [initialService]);

  useEffect(() => {
    if (initialSpecialist) {
      setSelectedSpecialistId(initialSpecialist.id);
    }
  }, [initialSpecialist]);

  // Active specialist object
  const currentSpecialist = useMemo(() => {
    if (selectedSpecialistId === 'any') return null;
    return SPECIALISTS.find((s) => s.id === selectedSpecialistId) || null;
  }, [selectedSpecialistId]);

  // Compute real-time slots availability for selected day & specialist
  const slotsAvailability = useMemo(() => {
    return computeSlotAvailability(
      selectedDateOption,
      selectedSpecialistId,
      appointments,
      new Date()
    );
  }, [selectedDateOption, selectedSpecialistId, appointments]);

  // Auto-adjust selectedTime if the current slot is not available
  useEffect(() => {
    const currentSlotData = slotsAvailability.find((s) => s.slot === selectedTime);
    if (!currentSlotData || currentSlotData.status !== 'available') {
      const firstAvailable = slotsAvailability.find((s) => s.status === 'available');
      if (firstAvailable) {
        setSelectedTime(firstAvailable.slot);
        setRedirectionSlot(null);
      }
    }
  }, [slotsAvailability, selectedTime]);

  // Calculate free slots count for each specialist on this selected day
  const specialistFreeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SPECIALISTS.forEach((spec) => {
      const specSlots = computeSlotAvailability(selectedDateOption, spec.id, appointments, new Date());
      counts[spec.id] = specSlots.filter((s) => s.status === 'available').length;
    });
    return counts;
  }, [selectedDateOption, appointments]);

  // Redirection suggestions for a busy slot
  const redirectionAvailableSpecialists = useMemo(() => {
    if (!redirectionSlot) return [];
    const slotInfo = slotsAvailability.find((s) => s.slot === redirectionSlot);
    if (!slotInfo || slotInfo.isPassed) return [];

    return SPECIALISTS.filter((spec) => slotInfo.availableSpecialistIds.includes(spec.id));
  }, [redirectionSlot, slotsAvailability]);

  // Handle slot click
  const handleSlotClick = (slotInfo: SlotAvailability) => {
    if (slotInfo.isPassed) return;

    if (slotInfo.status === 'booked') {
      setRedirectionSlot(slotInfo.slot);
      return;
    }

    setSelectedTime(slotInfo.slot);
    setRedirectionSlot(null);
  };

  // Switch specialist and select redirected slot in 1 click
  const handleRedirectToSpecialist = (specId: string, slot: string) => {
    setSelectedSpecialistId(specId);
    setSelectedTime(slot);
    setRedirectionSlot(null);
  };

  // Pricing calculation in COP
  const basePrice = selectedService ? selectedService.price : 0;
  const addOnsTotal = selectedAddOns.reduce((acc, addOnName) => {
    const item = ADD_ON_OPTIONS.find((a) => a.name === addOnName);
    return acc + (item ? item.price : 0);
  }, 0);
  const subtotal = basePrice + addOnsTotal;
  const discountAmount = promoDiscountPercent > 0 ? (subtotal * promoDiscountPercent) / 100 : 0;
  const finalPrice = Math.round(subtotal - discountAmount);

  const toggleAddOn = (name: string) => {
    if (selectedAddOns.includes(name)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a !== name));
    } else {
      setSelectedAddOns([...selectedAddOns, name]);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedService) return;

    // Resolve assigned specialist
    let assignedSpecialist = currentSpecialist;
    if (!assignedSpecialist) {
      // Pick first available specialist at selected slot
      const slotData = slotsAvailability.find((s) => s.slot === selectedTime);
      const freeSpecId = slotData?.availableSpecialistIds[0] || SPECIALISTS[0].id;
      assignedSpecialist = SPECIALISTS.find((s) => s.id === freeSpecId) || SPECIALISTS[0];
    }

    const bookingCode = `AURA-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now().toString().slice(-4)}`,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceDuration: selectedService.durationMinutes,
      serviceImage: selectedService.image,
      specialistId: assignedSpecialist.id,
      specialistName: assignedSpecialist.name,
      specialistRole: assignedSpecialist.role,
      specialistAvatar: assignedSpecialist.avatar,
      date: selectedDateOption.full,
      time: selectedTime,
      clientName: clientName || 'Clienta Aura',
      clientPhone: clientPhone || '+57 300 000 0000',
      clientEmail,
      notes: clientNotes,
      polishColor: selectedPolish,
      nailShape: selectedShape,
      selectedAddOns,
      totalPrice: finalPrice,
      status: 'confirmada',
      bookingCode,
      createdAt: new Date().toISOString(),
      branchId: 'chico'
    };

    setBookingConfirmed(newAppointment);
    onBookingSuccess(newAppointment);

    // Send UltraMsg WhatsApp confirmation
    const ultraConfig = getUltraMsgConfig();
    if (ultraConfig.autoConfirmOnBooking) {
      setIsSendingWhatsApp(true);
      const effectiveClient = clientName && clientName.trim() ? clientName.trim() : 'Clienta Aura';
      const effectivePhone = clientPhone && clientPhone.trim() ? clientPhone.trim() : '+57 312 849 2011';

      const waText = renderTemplate(ultraConfig.confirmationTemplate, {
        cliente: effectiveClient,
        codigo: bookingCode,
        servicio: selectedService.name,
        fecha: selectedDateOption.full,
        hora: selectedTime,
        sede: 'Santuario Chicó Calle 85',
        estado: 'Confirmada',
        monto: formatCOP(finalPrice)
      });

      await sendUltraMsgWhatsApp({
        phone: effectivePhone,
        message: waText,
        clientName: effectiveClient,
        bookingCode
      });

      setIsSendingWhatsApp(false);
    }
  };

  // If already confirmed:
  if (bookingConfirmed) {
    const waUrl = buildWaMeUrl(
      bookingConfirmed.clientPhone,
      `Hola! Tengo mi reserva ${bookingConfirmed.bookingCode} confirmada para el ${bookingConfirmed.date} a las ${bookingConfirmed.time} con ${bookingConfirmed.specialistName} en Aura Nails & Spa.`
    );

    return (
      <div className="flex flex-col items-center px-4 py-8 max-w-lg mx-auto text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-[#E8B4B8]/40 border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] mb-4 shadow-xs">
          <span className="material-symbols-outlined text-[42px]">check_circle</span>
        </div>

        <span className="text-xs uppercase font-bold tracking-widest text-[#7C571C]">
          ¡Reserva Confirmada Exitosamente!
        </span>
        <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#221A14] mt-1 mb-2">
          Te esperamos en el Santuario
        </h2>
        <p className="text-xs text-[#6F5A4B] mb-6 max-w-xs">
          Hemos sincronizado tu turno en nuestro libro de citas y bloqueado el horario con tu especialista.
        </p>

        {/* Appointment Card */}
        <div className="w-full bg-white rounded-3xl p-6 border border-[#DFCBB5]/80 shadow-xs text-left space-y-4 mb-6">
          <div className="flex items-center justify-between border-b border-[#DFCBB5]/50 pb-3">
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase tracking-wider block">
                Código de Turno
              </span>
              <strong className="text-base font-mono text-[#7C571C]">
                {bookingConfirmed.bookingCode}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#6F5A4B] uppercase tracking-wider block">
                Total a Pagar en Sede
              </span>
              <strong className="text-base font-mono text-[#221A14]">
                {formatCOP(bookingConfirmed.totalPrice)}
              </strong>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6F5A4B]">Servicio:</span>
              <strong className="text-[#221A14]">{bookingConfirmed.serviceName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6F5A4B]">Fecha &amp; Hora:</span>
              <strong className="text-[#221A14]">{bookingConfirmed.date} · {bookingConfirmed.time}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6F5A4B]">Especialista Asignada:</span>
              <strong className="text-[#7C571C]">{bookingConfirmed.specialistName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6F5A4B]">Sede:</span>
              <strong className="text-[#221A14]">Santuario Chicó Calle 85, Bogotá</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            <span>
              ¡Cita confirmada exitosamente! Hemos enviado los detalles y recordatorio a tu WhatsApp.
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#0b421a] font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Ver Confirmación en WhatsApp</span>
          </a>

          {!isPublicView && (
            <button
              onClick={onNavigateToAppointments}
              className="w-full py-3.5 rounded-full bg-[#7C571C] hover:bg-[#684714] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>Ver Cita en el Libro Maestro</span>
            </button>
          )}

          <button
            onClick={() => {
              setBookingConfirmed(null);
              setStep(1);
            }}
            className="w-full py-3 rounded-full bg-white hover:bg-[#FBEBE1] border border-[#DFCBB5] text-[#6F5A4B] font-semibold text-xs transition-colors cursor-pointer"
          >
            Reservar Otra Cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF8F5] via-[#FBEBE1] to-[#F7E5DE] p-6 sm:p-7 border border-[#DFCBB5]/80 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-[#E8B4B8]/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C571C]/10 text-[#7C571C] text-xs font-semibold mb-2 border border-[#7C571C]/20">
              <span className="material-symbols-outlined text-[15px] text-[#7C571C]">event_available</span>
              Santuario Chicó Calle 85 · Calendario en Tiempo Real
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#221A14]">
              Reserva de Turno
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5A4B] mt-1 max-w-xl">
              Selecciona tu ritual de belleza, tu especialista favorita y un horario disponible en nuestro calendario local sincronizado.
            </p>
          </div>

          {onNavigateToServices && (
            <button
              onClick={onNavigateToServices}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">spa</span>
              <span>Explorar Servicios</span>
            </button>
          )}
        </div>
      </div>

      {/* Booking Stepper */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#DFCBB5]/80 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { num: 1, title: 'Servicio' },
            { num: 2, title: 'Fecha & Hora' },
            { num: 3, title: 'Personalizar' },
            { num: 4, title: 'Confirmar' }
          ].map((s) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;

            return (
              <button
                key={s.num}
                onClick={() => {
                  if (s.num < step) setStep(s.num);
                }}
                disabled={s.num > step}
                className={`p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#7C571C] text-white shadow-xs font-bold'
                    : isDone
                    ? 'bg-[#FBEBE1] text-[#7C571C] font-semibold hover:bg-[#f3dfd2]'
                    : 'bg-[#FFF8F5] text-[#827474] opacity-60 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                    isCurrent
                      ? 'bg-white text-[#7C571C]'
                      : isDone
                      ? 'bg-[#7C571C] text-white'
                      : 'bg-black/10 text-[#827474]'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </span>
                <span className="text-[11px] sm:text-xs truncate">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: SERVICE SELECTION */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
              1. Selecciona tu Servicio de Uñas o Spa
            </h3>
            <span className="text-xs text-[#6F5A4B]">{SERVICES.length} disponibles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SERVICES.map((service) => {
              const isSelected = selectedService?.id === service.id;

              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#FFF8F5] border-[#7C571C] ring-2 ring-[#7C571C]/20 shadow-xs'
                      : 'bg-white border-[#DFCBB5]/70 hover:border-[#7C571C]/50 hover:bg-[#FFF8F5]/40'
                  }`}
                >
                  <div className="flex gap-3.5 items-start">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                          {service.name}
                        </h4>
                      </div>
                      <div className="text-sm font-bold text-[#7C571C] font-mono mt-1">
                        {formatCOP(service.price)}
                      </div>
                      <span className="text-[11px] text-[#6F5A4B] mt-0.5 block">
                        {service.durationMinutes} minutos · {service.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#DFCBB5]/50 flex items-center justify-between text-xs">
                    <span className="text-[#827474] text-[11px]">{service.tag}</span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#7C571C] bg-[#7C571C] text-white'
                          : 'border-[#DFCBB5]'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px]">check</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-full bg-[#7C571C] hover:bg-[#684714] text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar a Fecha &amp; Especialista</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: REAL-TIME LOCAL CALENDAR, SPECIALIST DISPONIBILITY & REDIRECTION */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* 1. Day Selector (Next 7 Days) */}
          <div className="bg-white rounded-3xl p-5 border border-[#DFCBB5]/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7C571C] text-[20px]">calendar_today</span>
                <span>Selecciona el día de tu cita</span>
              </h3>
              <span className="text-xs font-semibold text-[#7C571C]">
                {selectedDateOption.full}
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {calendarDays.map((item) => {
                const isSelected = selectedDateOption.id === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedDateOption(item);
                      setRedirectionSlot(null);
                    }}
                    className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#7C571C] text-white shadow-xs scale-102 font-bold'
                        : 'bg-[#FFF8F5] text-[#6F5A4B] border border-[#DFCBB5]/80 hover:border-[#7C571C]/50 hover:bg-[#FBEBE1]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase opacity-80">
                      {item.dayOfWeek}
                    </span>
                    <span className="text-lg font-bold my-0.5">
                      {item.dateNum}
                    </span>
                    <span className="text-[10px] font-medium opacity-90 truncate max-w-[64px]">
                      {item.dayName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Specialist Selector with Live Availability Badges */}
          <div className="bg-white rounded-3xl p-5 border border-[#DFCBB5]/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7C571C] text-[20px]">face</span>
                <span>Elige tu Especialista o Asignación Libre</span>
              </h3>
              <span className="text-xs text-[#6F5A4B]">
                {selectedDateOption.isToday ? 'Disponibilidad de Hoy' : `Para el ${selectedDateOption.dayName}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              
              {/* ANY / AUTO ASSIGN */}
              <button
                onClick={() => {
                  setSelectedSpecialistId('any');
                  setRedirectionSlot(null);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  selectedSpecialistId === 'any'
                    ? 'bg-[#FFF8F5] border-[#7C571C] ring-2 ring-[#7C571C]/25 shadow-2xs'
                    : 'bg-[#FFF8F5]/60 border-[#DFCBB5]/70 hover:border-[#7C571C]/40'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#7C571C]/15 border border-[#7C571C]/25 flex items-center justify-center text-[#7C571C] shrink-0 font-bold text-xs">
                  ✨
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#221A14] block truncate">
                    Cualquiera Libre
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    Mayor flexibilidad
                  </span>
                </div>
              </button>

              {/* INDIVIDUAL SPECIALISTS */}
              {SPECIALISTS.map((spec) => {
                const isSelected = selectedSpecialistId === spec.id;
                const freeCount = specialistFreeCounts[spec.id] || 0;

                return (
                  <button
                    key={spec.id}
                    onClick={() => {
                      setSelectedSpecialistId(spec.id);
                      setRedirectionSlot(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#FFF8F5] border-[#7C571C] ring-2 ring-[#7C571C]/25 shadow-2xs'
                        : 'bg-white border-[#DFCBB5]/70 hover:border-[#7C571C]/40'
                    }`}
                  >
                    <img
                      src={spec.avatar}
                      alt={spec.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-[#DFCBB5]"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#221A14] block truncate">
                        {spec.name}
                      </span>
                      <span className="text-[10px] text-[#7C571C] block truncate">
                        {spec.role}
                      </span>
                      <span
                        className={`text-[9px] font-bold mt-0.5 block ${
                          freeCount > 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {freeCount > 0 ? `● ${freeCount} horas libres` : '● Sin cupos'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Hourly Time Slots with Live Booking & Passed Hour Blocking */}
          <div className="bg-white rounded-3xl p-5 border border-[#DFCBB5]/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#DFCBB5]/50 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7C571C] text-[20px]">schedule</span>
                  <span>Horarios en Intervalos de 1 Hora</span>
                </h3>
                <p className="text-xs text-[#6F5A4B] mt-0.5">
                  Las citas ya reservadas y las horas ya transcurridas están deshabilitadas automáticamente.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#6F5A4B]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reservado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300" /> Pasada
                </span>
              </div>
            </div>

            {/* Grid of Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {slotsAvailability.map((slotInfo, i) => {
                const isSelected = selectedTime === slotInfo.slot && slotInfo.status === 'available';
                const isRedirectionActive = redirectionSlot === slotInfo.slot;

                if (slotInfo.isPassed) {
                  return (
                    <div
                      key={i}
                      className="py-3 px-2 rounded-2xl text-center font-mono text-xs bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed select-none flex flex-col items-center justify-center gap-0.5"
                    >
                      <span className="line-through">{slotInfo.slot}</span>
                      <span className="text-[9px] font-sans text-stone-400 font-semibold uppercase tracking-wider">
                        Hora Pasada
                      </span>
                    </div>
                  );
                }

                if (slotInfo.status === 'booked') {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSlotClick(slotInfo)}
                      className={`py-3 px-2 rounded-2xl text-center font-mono text-xs transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                        isRedirectionActive
                          ? 'bg-amber-100 border-amber-400 text-amber-900 ring-2 ring-amber-300 scale-102'
                          : 'bg-amber-50/70 border-amber-200 text-amber-800 hover:bg-amber-100'
                      }`}
                      title="Horario ocupado con esta especialista. Haz clic para ver quién más tiene disponibilidad en esta hora."
                    >
                      <span className="font-bold">{slotInfo.slot}</span>
                      <span className="text-[9px] font-sans font-bold text-amber-700 uppercase tracking-wider flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">lock</span>
                        <span>Ocupado (Ver opciones)</span>
                      </span>
                    </button>
                  );
                }

                // Available slot
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSlotClick(slotInfo)}
                    className={`py-3 px-2 rounded-2xl text-center font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-[#7C571C] text-white border-[#7C571C] shadow-xs ring-2 ring-[#7C571C]/25 scale-102'
                        : 'bg-[#FFF8F5] border-[#DFCBB5] text-[#221A14] hover:border-[#7C571C] hover:bg-white'
                    }`}
                  >
                    <span>{slotInfo.slot}</span>
                    <span
                      className={`text-[9px] font-sans font-semibold uppercase tracking-wider ${
                        isSelected ? 'text-emerald-200' : 'text-emerald-700'
                      }`}
                    >
                      ✓ Disponible
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 4. SMART REDIRECTION ASSISTANT CARD */}
            {redirectionSlot && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-900 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-700 text-[20px]">swap_horiz</span>
                    <div>
                      <strong className="block text-amber-950 font-['Plus_Jakarta_Sans',sans-serif]">
                        {currentSpecialist
                          ? `${currentSpecialist.name} está ocupada a las ${redirectionSlot}`
                          : `Horario ${redirectionSlot} parcialmente ocupado`}
                      </strong>
                      <span className="text-[11px] text-amber-800">
                        {redirectionAvailableSpecialists.length > 0
                          ? '¡Buenas noticias! Tenemos disponibilidad con las siguientes especialistas en esa misma hora:'
                          : 'No hay otras especialistas libres a esta hora exacta. Por favor selecciona otro horario verde.'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setRedirectionSlot(null)}
                    className="text-amber-800 hover:text-amber-950 p-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {redirectionAvailableSpecialists.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {redirectionAvailableSpecialists.map((spec) => (
                      <button
                        key={spec.id}
                        onClick={() => handleRedirectToSpecialist(spec.id, redirectionSlot)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        <img src={spec.avatar} alt={spec.name} className="w-5 h-5 rounded-full object-cover" />
                        <span>Reservar {redirectionSlot} con {spec.name}</span>
                        <span className="material-symbols-outlined text-[14px] text-emerald-600">arrow_forward</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-full bg-white border border-[#DFCBB5] text-[#6F5A4B] text-xs font-semibold hover:bg-[#FBEBE1] cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 rounded-full bg-[#7C571C] hover:bg-[#684714] text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar a Personalización</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PERSONALIZATION (POLISH, SHAPE, ADD-ONS IN COP) */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Polish color selection */}
          <div className="bg-white rounded-3xl p-5 border border-[#DFCBB5]/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
              1. Tono de Esmalte Deseado
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {POLISH_SWATCHES.map((swatch) => {
                const isSelected = selectedPolish === swatch.name;
                return (
                  <button
                    key={swatch.id}
                    onClick={() => setSelectedPolish(swatch.name)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#FFF8F5] border-[#7C571C] shadow-2xs ring-1 ring-[#7C571C]'
                        : 'bg-white border-[#DFCBB5]/60 hover:border-[#7C571C]/50'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-black/10 shrink-0 shadow-2xs"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#221A14] block truncate">
                        {swatch.name}
                      </span>
                      <span className="text-[10px] text-[#827474] capitalize block">{swatch.finish}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nail Shape */}
          <div className="bg-white rounded-3xl p-5 border border-[#DFCBB5]/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
              2. Forma de Uña
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {NAIL_SHAPES.map((shape) => {
                const isSelected = selectedShape === shape.name;
                return (
                  <button
                    key={shape.id}
                    onClick={() => setSelectedShape(shape.name)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#7C571C] text-white border-[#7C571C] shadow-xs'
                        : 'bg-white border-[#DFCBB5]/60 text-[#221A14] hover:border-[#7C571C]/50'
                    }`}
                  >
                    <span className="text-xs font-bold block">{shape.name}</span>
                    <span className={`text-[10px] line-clamp-2 mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#827474]'}`}>
                      {shape.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add-ons in COP */}
          <div className="bg-white rounded-3xl p-5 border border-[#DFCBB5]/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
                3. Complementos &amp; Spa Opcionales
              </h3>
              <span className="text-xs text-[#7C571C]">Valores en COP</span>
            </div>
            <div className="space-y-2">
              {ADD_ON_OPTIONS.map((addon) => {
                const isSelected = selectedAddOns.includes(addon.name);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddOn(addon.name)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FFF8F5] border-[#7C571C] shadow-2xs'
                        : 'bg-white border-[#DFCBB5]/60 hover:border-[#7C571C]/50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <strong className="text-xs text-[#221A14] block">{addon.name}</strong>
                      <span className="text-[11px] text-[#6F5A4B]">{addon.description}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#7C571C] font-mono block">
                        +{formatCOP(addon.price)}
                      </span>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-700' : 'text-[#827474]'}`}>
                        {isSelected ? '✓ Agregado' : '+ Agregar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-full bg-white border border-[#DFCBB5] text-[#6F5A4B] text-xs font-semibold hover:bg-[#FBEBE1] cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 rounded-full bg-[#7C571C] hover:bg-[#684714] text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar a Confirmación</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CLIENT CONTACT & FINAL CONFIRMATION */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Summary Box */}
          <div className="bg-white rounded-3xl p-6 border border-[#DFCBB5]/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFCBB5]/50 pb-3">
              <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
                Resumen de tu Cita
              </h3>
              <span className="text-lg font-bold text-[#7C571C] font-mono">
                {formatCOP(finalPrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#827474] uppercase block">Servicio</span>
                <strong className="text-[#221A14] block">{selectedService?.name}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#827474] uppercase block">Fecha &amp; Hora</span>
                <strong className="text-[#221A14] block">{selectedDateOption.full} · {selectedTime}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#827474] uppercase block">Especialista</span>
                <strong className="text-[#7C571C] block">{currentSpecialist?.name || 'Asignación Libre'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#827474] uppercase block">Sede</span>
                <strong className="text-[#221A14] block">Chicó Calle 85</strong>
              </div>
            </div>
          </div>

          {/* Client Details Form */}
          <div className="bg-white rounded-3xl p-6 border border-[#DFCBB5]/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
              Datos para Confirmación de WhatsApp
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#6F5A4B] mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Mariana Duque"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#FFF8F5] border border-[#DFCBB5] text-xs text-[#221A14]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#6F5A4B] mb-1">Número de WhatsApp (+57) *</label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+57 312 849 2011"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#FFF8F5] border border-[#DFCBB5] text-xs font-mono text-[#221A14]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#6F5A4B] mb-1">Observaciones o notas dermatológicas (Opcional)</label>
                <input
                  type="text"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Ej. Cutículas delicadas, esmalte anterior a retirar..."
                  className="w-full h-10 px-3.5 rounded-xl bg-[#FFF8F5] border border-[#DFCBB5] text-xs text-[#221A14]"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">mark_chat_read</span>
              <span>
                Al confirmar, se enviará una notificación instantánea a tu WhatsApp con el código de turno oficial de Aura Nails &amp; Spa.
              </span>
            </div>
          </div>

          {/* Confirm Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-full bg-white border border-[#DFCBB5] text-[#6F5A4B] text-xs font-semibold hover:bg-[#FBEBE1] cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={isSendingWhatsApp}
              className="px-7 py-3.5 rounded-full bg-[#7C571C] hover:bg-[#684714] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>{isSendingWhatsApp ? 'Enviando WhatsApp...' : 'Confirmar Reserva en COP'}</span>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
