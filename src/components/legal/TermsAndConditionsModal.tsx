import React from 'react';
import { BUSINESS_CONFIG } from '../../config/businessConfig';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCancellationPolicy?: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  isOpen,
  onClose,
  onOpenCancellationPolicy
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#F4EFE9] rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#C6BDAC] z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Banner de Advertencia Legal */}
        <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-700 text-[16px] shrink-0">gavel</span>
          <span>
            <strong>BORRADOR PARA REVISIÓN LEGAL</strong> · PENDIENTE REVISIÓN LEGAL POR UN ABOGADO TITULADO
          </span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#C6BDAC]/70 pb-3 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B2420] bg-[#C6BDAC]/40 px-2 py-0.5 rounded-full">
              Estatuto del Consumidor · Ley 1480 de 2011
            </span>
            <h2 id="terms-title" className="text-lg sm:text-xl font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] mt-1">
              Términos y Condiciones del Servicio
            </h2>
            <p className="text-xs text-[#5A4A43]">
              Versión: {BUSINESS_CONFIG.termsVersion} · {BUSINESS_CONFIG.brandName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] cursor-pointer"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 my-4 space-y-4 text-xs text-[#5A4A43] leading-relaxed text-justify">
          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">info</span>
              1. Objeto y Ámbito de Aplicación
            </h3>
            <p>
              Los presentes Términos y Condiciones regulan el acceso, la reserva en línea y la prestación de servicios estéticos, de manicura, pedicura y spa prestados en las instalaciones de <strong>{BUSINESS_CONFIG.brandName}</strong> ({BUSINESS_CONFIG.businessName}, NIT {BUSINESS_CONFIG.nit}).
            </p>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">event</span>
              2. Procedimiento de Reserva en Línea
            </h3>
            <p>
              El agendamiento en el sitio web permite apartar un turno con una especialista determinada o disponible en la fecha y hora seleccionadas. La reserva genera un código de reserva único (ej. {BUSINESS_CONFIG.bookingCodePrefix}-XXXX) que el cliente debe presentar al momento de su llegada al local.
            </p>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold text-[11px]">
              <strong>Sin Cobro Anticipado en Línea:</strong> La plataforma web NO solicita números de tarjeta de crédito, cuentas bancarias ni realiza cobros por internet para apartar citas. Todos los servicios se pagan presencialmente en el establecimiento una vez finalizada la atención.
            </div>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">payments</span>
              3. Precios y Medios de Pago en Punto de Venta
            </h3>
            <p>
              Todos los precios informados en el catálogo y durante la reserva están expresados en <strong>Pesos Colombianos (COP)</strong>.
            </p>
            <p className="font-semibold text-[#2B2420]">
              {BUSINESS_CONFIG.taxNotice}
            </p>
            <p>
              <strong>Medios de pago aceptados en sede:</strong> Efectivo, transferencias electrónicas a través de Nequi y Daviplata, y tarjetas débito/crédito a través de datáfono físico.
            </p>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">schedule</span>
              4. Puntualidad, Tolerancia y Llegadas Tarde
            </h3>
            <p>
              Con el fin de garantizar la calidad del servicio y respetar la agenda de los demás clientes:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Se solicita llegar con <strong>diez (10) minutos de anticipación</strong> a la hora pactada.</li>
              <li>Existe un tiempo máximo de tolerancia de <strong>diez (10) minutos</strong> de retraso. <em>(PENDIENTE REVISIÓN LEGAL)</em>.</li>
              <li>Pasado el tiempo de tolerancia, el establecimiento podrá modificar el diseño a uno más sencillo acorde al tiempo restante o reasignar el turno para no afectar a los clientes siguientes.</li>
            </ul>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">support_agent</span>
              5. Peticiones, Quejas, Reclamos y Sugerencias (PQRS)
            </h3>
            <p>
              De conformidad con la Ley 1480 de 2011, los usuarios pueden formular sus solicitudes o reclamos a través del correo <strong>{BUSINESS_CONFIG.email}</strong> o en el libro físico de sugerencias disponible en recepción. Las PQRS serán resueltas dentro de los <strong>quince (15) días hábiles</strong> siguientes a su radicación. <em>(PENDIENTE REVISIÓN LEGAL)</em>.
            </p>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">gavel</span>
              6. Legislación Aplicable y Jurisdicción
            </h3>
            <p>
              Estos Términos y Condiciones se rigen e interpretan conforme a las leyes de la República de Colombia. Cualquier controversia será dirimida en primera instancia ante los canales directos del establecimiento o ante la Superintendencia de Industria y Comercio (SIC).
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#C6BDAC]/70 flex items-center justify-between gap-3 shrink-0">
          {onOpenCancellationPolicy && (
            <button
              onClick={() => {
                onClose();
                onOpenCancellationPolicy();
              }}
              className="text-xs text-[#2B2420] font-bold underline hover:text-[#AA8A74] cursor-pointer text-left"
            >
              Ver Política de Cancelación
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all cursor-pointer ml-auto"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
