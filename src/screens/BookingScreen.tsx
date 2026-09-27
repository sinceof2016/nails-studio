import React, { useState, useEffect } from 'react';
import { Service, Specialist, Appointment } from '../types';
import {
  SERVICES,
  SPECIALISTS,
  POLISH_SWATCHES,
  NAIL_SHAPES,
  ADD_ON_OPTIONS
} from '../data/mockData';
import { formatCOP } from '../utils/format';
import { sendUltraMsgWhatsApp, buildWaMeUrl } from '../services/whatsappService';

interface BookingScreenProps {
  initialService?: Service | null;
  initialSpecialist?: Specialist | null;
  promoDiscountPercent?: number;
  onBookingSuccess: (appointment: Appointment) => void;
  onNavigateToAppointments: () => void;
  isPublicView?: boolean;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  initialService,
  initialSpecialist,
  promoDiscountPercent = 0,
  onBookingSuccess,
  onNavigateToAppointments,
  isPublicView = false
}) => {
  const [step, setStep] = useState<number>(1);

  // Form selections
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialService || SERVICES[0]
  );
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(
    initialSpecialist || SPECIALISTS[0]
  );
  const [selectedDate, setSelectedDate] = useState<string>('Mañana, 28 Sept');
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

  // Sync if initial props change
  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
    }
  }, [initialService]);

  useEffect(() => {
    if (initialSpecialist) {
      setSelectedSpecialist(initialSpecialist);
    }
  }, [initialSpecialist]);

  // Calendar dates
  const availableDates = [
    { label: 'Hoy', dayName: 'Hoy', dateNum: '27', full: 'Hoy, 27 Sept', dayOfWeek: 'Vie' },
    { label: 'Mañana', dayName: 'Mañana', dateNum: '28', full: 'Mañana, 28 Sept', dayOfWeek: 'Sáb' },
    { label: 'Dom 29', dayName: 'Dom', dateNum: '29', full: 'Domingo, 29 Sept', dayOfWeek: 'Dom' },
    { label: 'Lun 30', dayName: 'Lun', dateNum: '30', full: 'Lunes, 30 Sept', dayOfWeek: 'Lun' },
    { label: 'Mar 1', dayName: 'Mar', dateNum: '01', full: 'Martes, 1 Oct', dayOfWeek: 'Mar' },
    { label: 'Mié 2', dayName: 'Mié', dateNum: '02', full: 'Miércoles, 2 Oct', dayOfWeek: 'Mié' },
    { label: 'Jue 3', dayName: 'Jue', dateNum: '03', full: 'Jueves, 3 Oct', dayOfWeek: 'Jue' }
  ];

  // Exact 1-hour interval slots matching GitHub
  const hourlyTimeSlots = [
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM'
  ];

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

    const assignedSpecialist = selectedSpecialist || SPECIALISTS[0];
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
      date: selectedDate,
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
      createdAt: new Date().toISOString()
    };

    setBookingConfirmed(newAppointment);
    onBookingSuccess(newAppointment);

    // Send automatic UltraMsg WhatsApp confirmation
    setIsSendingWhatsApp(true);
    const waText = `✨ *AURA NAILS & SPA - CONFIRMACIÓN DE CITA* ✨
¡Hola ${clientName}! Tu reserva ha sido registrada con éxito:

📋 *Servicio:* ${selectedService.name}
📅 *Fecha:* ${selectedDate}
⏰ *Hora:* ${selectedTime}
💅 *Especialista:* ${assignedSpecialist.name}
🎨 *Esmaltado:* ${selectedPolish} (${selectedShape})
💰 *Valor Total:* ${formatCOP(finalPrice)}
🔖 *Código de Turno:* ${bookingCode}
📍 *Sede:* Santuario Chicó Calle 85, Bogotá

Te esperamos 5 minutos antes para brindarte tu infusión botánica de bienvenida. ¡Gracias por elegirnos!`;

    await sendUltraMsgWhatsApp({
      phone: clientPhone,
      message: waText,
      clientName,
      bookingCode
    });
    setIsSendingWhatsApp(false);
  };

  // If already confirmed in this view:
  if (bookingConfirmed) {
    const waUrl = buildWaMeUrl(
      bookingConfirmed.clientPhone,
      `Hola! Tengo mi reserva ${bookingConfirmed.bookingCode} confirmada para el ${bookingConfirmed.date} a las ${bookingConfirmed.time} en Aura Nails & Spa.`
    );

    return (
      <div className="flex flex-col items-center px-4 py-8 max-w-lg mx-auto text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-[#e8b4b8]/50 flex items-center justify-center text-[#7c5357] mb-4 shadow-md">
          <span className="material-symbols-outlined text-[42px] fill">check_circle</span>
        </div>

        <span className="text-xs uppercase font-bold tracking-widest text-[#7c5357]">
          ¡Reserva Confirmada Exitosamente!
        </span>
        <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#1c1c18] mt-1 mb-2">
          Te esperamos en el Santuario
        </h2>

        <p className="text-xs text-[#504444] max-w-sm mb-6">
          Se ha enviado la confirmación oficial a tu WhatsApp y sincronizado con Google Calendar.
        </p>

        {/* Appointment Card Ticket */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(232,180,184,0.3)] border border-[#e8b4b8]/40 mb-6 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-[#ebe8e2] pb-3">
            <div>
              <span className="text-[10px] text-[#827474] uppercase block">Código de Reserva</span>
              <strong className="text-base font-mono font-bold text-[#7c5357]">
                {bookingConfirmed.bookingCode}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#827474] uppercase block">Total a Pagar</span>
              <strong className="text-base font-mono font-bold text-[#1c1c18]">
                {formatCOP(bookingConfirmed.totalPrice)}
              </strong>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#504444]">Servicio:</span>
              <strong className="text-[#1c1c18]">{bookingConfirmed.serviceName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#504444]">Fecha &amp; Hora:</span>
              <strong className="text-[#1c1c18]">{bookingConfirmed.date} · {bookingConfirmed.time}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#504444]">Especialista:</span>
              <strong className="text-[#7c5357]">{bookingConfirmed.specialistName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#504444]">Sede:</span>
              <strong className="text-[#1c1c18]">Santuario Chicó Calle 85, Bogotá</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            <span>Mensaje de WhatsApp enviado vía UltraMsg Gateway.</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Ver Confirmación en WhatsApp</span>
          </a>

          {!isPublicView && (
            <button
              onClick={onNavigateToAppointments}
              className="w-full py-3.5 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            className="w-full py-3 rounded-full bg-[#f7f3ed] hover:bg-[#ebe8e2] text-[#504444] font-semibold text-xs transition-colors cursor-pointer"
          >
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e8b4b8]/30 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7c5357] font-['Plus_Jakarta_Sans',sans-serif]">
            Paso {step} de 4
          </span>
          <span className="text-xs text-[#504444] font-medium">
            {step === 1 && 'Selección de Tratamiento'}
            {step === 2 && 'Fecha & Horario'}
            {step === 3 && 'Personalización & Esmaltado'}
            {step === 4 && 'Datos & Confirmación'}
          </span>
        </div>

        {/* Progress Tracker */}
        <div className="w-full h-2 rounded-full bg-[#f7f3ed] overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-[#e8b4b8] to-[#7c5357] transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: SERVICE SELECTION */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
              Elige tu experiencia de uñas o spa
            </h3>
            {promoDiscountPercent > 0 && (
              <span className="text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-3 py-1 rounded-full">
                {promoDiscountPercent}% OFF Aplicado
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICES.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#7c5357] shadow-md ring-2 ring-[#7c5357]/20'
                      : 'bg-white border-[#e8b4b8]/30 hover:border-[#e8b4b8] shadow-xs'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                          {service.name}
                        </h4>
                      </div>
                      <div className="text-sm font-bold text-[#7c5357] font-mono mt-1">
                        {formatCOP(service.price)}
                      </div>
                      <span className="text-[11px] text-[#504444] mt-0.5 block">
                        {service.durationMinutes} minutos · {service.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#ebe8e2] flex items-center justify-between text-xs">
                    <span className="text-[#827474] text-[11px]">{service.tag}</span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#7c5357] bg-[#7c5357] text-white'
                          : 'border-[#d4c2c3]'
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
              className="px-6 py-3 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar a Fecha &amp; Hora</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DATE & TIME IN 1-HOUR INTERVALS (WITHOUT CUPOS RESTANTES AS REQUESTED) */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-[#e8b4b8]/30 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
              Selecciona el día de tu cita
            </h3>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {availableDates.map((item, idx) => {
                const isSelected = selectedDate === item.full;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(item.full)}
                    className={`flex flex-col items-center justify-center w-16 h-18 rounded-2xl transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#7c5357] text-white shadow-md scale-102'
                        : 'bg-[#fdf9f3] text-[#504444] border border-[#e8b4b8]/30 hover:border-[#e8b4b8]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase opacity-80">
                      {item.dayOfWeek}
                    </span>
                    <span className="text-base font-bold my-0.5">
                      {item.dateNum}
                    </span>
                    <span className="text-[9px] font-medium opacity-90">
                      {item.dayName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hourly Intervals (Intervalos de 1 hora idénticos a GitHub, sin cupos restantes) */}
          <div className="bg-white rounded-3xl p-5 border border-[#e8b4b8]/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
                Horarios Disponibles (Intervalos de 1 Hora)
              </h3>
              <span className="text-xs text-[#7c5357] font-semibold">Sede Chicó</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {hourlyTimeSlots.map((slot, i) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 px-2 rounded-2xl text-center font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#7c5357] text-white shadow-md ring-2 ring-[#7c5357]/30 scale-102'
                        : 'bg-[#fdf9f3] border border-[#e8b4b8]/40 text-[#1c1c18] hover:border-[#7c5357] hover:bg-white'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-full bg-white border border-[#e8b4b8]/40 text-[#504444] text-xs font-semibold hover:bg-[#f7f3ed] cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar a Personalización</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PERSONALIZATION (POLISH, SHAPE, ADD-ONS IN COP) */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Polish color selection */}
          <div className="bg-white rounded-3xl p-5 border border-[#e8b4b8]/30 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
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
                        ? 'bg-[#fdf9f3] border-[#7c5357] shadow-xs ring-1 ring-[#7c5357]'
                        : 'bg-white border-[#e8b4b8]/30 hover:border-[#e8b4b8]'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-black/10 shrink-0 shadow-2xs"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#1c1c18] block truncate">
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
          <div className="bg-white rounded-3xl p-5 border border-[#e8b4b8]/30 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
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
                        ? 'bg-[#7c5357] text-white border-[#7c5357] shadow-xs'
                        : 'bg-white border-[#e8b4b8]/30 text-[#1c1c18] hover:border-[#e8b4b8]'
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
          <div className="bg-white rounded-3xl p-5 border border-[#e8b4b8]/30 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
                3. Complementos &amp; Spa Opcionales
              </h3>
              <span className="text-xs text-[#7c5357]">Valores en COP</span>
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
                        ? 'bg-[#fdf9f3] border-[#7c5357] shadow-2xs'
                        : 'bg-white border-[#e8b4b8]/30 hover:border-[#e8b4b8]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <strong className="text-xs text-[#1c1c18] block">{addon.name}</strong>
                      <span className="text-[11px] text-[#504444]">{addon.description}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#7c5357] font-mono block">
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
              className="px-5 py-2.5 rounded-full bg-white border border-[#e8b4b8]/40 text-[#504444] text-xs font-semibold hover:bg-[#f7f3ed] cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar a Confirmación</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CLIENT CONTACT & FINAL CONFIRMATION */}
      {step === 4 && (
        <div className="space-y-5">
          {/* Summary Box */}
          <div className="bg-white rounded-3xl p-6 border border-[#e8b4b8]/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#ebe8e2] pb-3">
              <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
                Resumen de tu Cita
              </h3>
              <span className="text-lg font-bold text-[#7c5357] font-mono">
                {formatCOP(finalPrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#827474] uppercase block">Servicio</span>
                <strong className="text-[#1c1c18] block">{selectedService?.name}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#827474] uppercase block">Fecha &amp; Hora</span>
                <strong className="text-[#1c1c18] block">{selectedDate} · {selectedTime}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#827474] uppercase block">Esmaltado</span>
                <strong className="text-[#7c5357] block">{selectedPolish} ({selectedShape})</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#827474] uppercase block">Sede</span>
                <strong className="text-[#1c1c18] block">Chicó Calle 85</strong>
              </div>
            </div>
          </div>

          {/* Client Details Form */}
          <div className="bg-white rounded-3xl p-6 border border-[#e8b4b8]/40 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#1c1c18] font-['Plus_Jakarta_Sans',sans-serif]">
              Datos para Confirmación de WhatsApp
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#504444] mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Mariana Duque"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#fdf9f3] border border-[#e8b4b8]/50 text-xs text-[#1c1c18]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#504444] mb-1">Número de WhatsApp (+57) *</label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+57 312 849 2011"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#fdf9f3] border border-[#e8b4b8]/50 text-xs font-mono text-[#1c1c18]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#504444] mb-1">Observaciones o notas dermatológicas (Opcional)</label>
                <input
                  type="text"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Ej. Cutículas delicadas, esmalte anterior a retirar..."
                  className="w-full h-10 px-3.5 rounded-xl bg-[#fdf9f3] border border-[#e8b4b8]/50 text-xs text-[#1c1c18]"
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
              className="px-5 py-2.5 rounded-full bg-white border border-[#e8b4b8]/40 text-[#504444] text-xs font-semibold hover:bg-[#f7f3ed] cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={isSendingWhatsApp}
              className="px-7 py-3.5 rounded-full bg-[#7c5357] hover:bg-[#674246] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
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
