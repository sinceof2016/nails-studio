import React from 'react';
import { BUSINESS_CONFIG, LEGAL_LAST_UPDATE } from '../../config/businessConfig';

interface DataTreatmentPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataTreatmentPolicyModal: React.FC<DataTreatmentPolicyModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-policy-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#F4EFE9] rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#C6BDAC] z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#C6BDAC]/70 pb-3 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B2420] bg-[#C6BDAC]/40 px-2 py-0.5 rounded-full">
              Habeas Data · Ley 1581 de 2012
            </span>
            <h2 id="data-policy-title" className="text-lg sm:text-xl font-bold text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] mt-1">
              Política de Tratamiento de Datos Personales
            </h2>
            <p className="text-xs text-[#5A4A43]">
              Versión {BUSINESS_CONFIG.dataPolicyVersion} · Última actualización: {LEGAL_LAST_UPDATE}
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
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">business</span>
              1. Identificación del Responsable del Tratamiento
            </h3>
            <p>
              <strong>Razón Social:</strong> {BUSINESS_CONFIG.businessName}<br />
              <strong>Nombre Comercial:</strong> {BUSINESS_CONFIG.brandName}<br />
              <strong>NIT:</strong> {BUSINESS_CONFIG.nit}<br />
              <strong>Representante Legal:</strong> {BUSINESS_CONFIG.representanteLegal}<br />
              <strong>Domicilio Principal:</strong> {BUSINESS_CONFIG.address}, {BUSINESS_CONFIG.city}, {BUSINESS_CONFIG.country}<br />
              <strong>Teléfono:</strong> {BUSINESS_CONFIG.phoneFormatted || BUSINESS_CONFIG.phone}<br />
              <strong>Correo General:</strong> {BUSINESS_CONFIG.email}<br />
              <strong>Canal de Privacidad &amp; Habeas Data:</strong> {BUSINESS_CONFIG.privacyEmail}
            </p>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">database</span>
              2. Datos Personales que se Recolectan
            </h3>
            <p>
              En desarrollo de la relación comercial y la prestación de servicios estéticos de manicura, pedicura y spa, se recolectan únicamente los siguientes datos pertinentes:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Datos de Identificación y Contacto:</strong> Nombre y apellidos, número de teléfono móvil / WhatsApp, y correo electrónico opcional.</li>
              <li><strong>Datos de la Cita:</strong> Servicio seleccionado, especialista asignada, fecha, hora, sede y código de reserva.</li>
              <li><strong>Observaciones / Notas del Cliente:</strong> Información de preferencia del servicio.</li>
              <li><strong>Historial de Visitas y Pagos:</strong> Registro contable de servicios prestados, montos pagados y método de pago en punto físico.</li>
            </ul>
          </section>

          <section className="space-y-1.5 bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80 text-rose-950">
            <h3 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-rose-700 text-[16px]">health_and_safety</span>
              3. Datos Sensibles y Advertencia Expresa de Salud
            </h3>
            <p>
              De conformidad con el Artículo 6 de la Ley 1581 de 2012, los datos sensibles son aquellos que afectan la intimidad del titular o cuyo uso indebido puede generar discriminación.
            </p>
            <p className="font-semibold">
              El suministro de datos sensibles es de carácter facultativo. <strong>Se advierte expresamente a los usuarios NO ingresar datos médicos, diagnósticos clínicos, patologías de la piel/uñas o información de salud en el campo de "Observaciones"</strong>. Cualquier condición particular debe ser informada verbalmente de forma privada a la especialista al momento de la cita presencial.
            </p>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">target</span>
              4. Finalidades del Tratamiento
            </h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Gestionar, confirmar, reagendar o cancelar citas solicitadas a través de la plataforma web.</li>
              <li>Enviar notificaciones transaccionales directas sobre el estado de la cita vía WhatsApp o correo electrónico.</li>
              <li>Registrar el libro de caja, facturación y liquidación contable de los servicios prestados.</li>
              <li>Atender peticiones, consultas, quejas y reclamos (PQRS).</li>
              <li>Cumplir con las obligaciones legales, tributarias y comerciales vigentes en Colombia.</li>
            </ul>
            <p className="text-[11px] text-[#5A4A43] italic">
              * No se enviarán comunicaciones comerciales o publicitarias a menos que medie autorización expresa, previa e informada, respetando los horarios de contacto fijados por la Ley 2300 de 2023.
            </p>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">security</span>
              5. Derechos de los Titulares (Habeas Data)
            </h3>
            <p>Conforme al Artículo 8 de la Ley 1581 de 2012, el titular de los datos tiene derecho a:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Conocer, actualizar y rectificar sus datos personales frente al Responsable o Encargados.</li>
              <li>Solicitar prueba de la autorización otorgada.</li>
              <li>Ser informado respecto del uso que se le ha dado a sus datos personales.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</li>
              <li>Revocar la autorización y/o solicitar la supresión del dato cuando no medie un deber legal o contractual de permanecer en la base de datos.</li>
              <li>Acceder en forma gratuita a sus datos personales que hayan sido objeto de tratamiento.</li>
            </ul>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">contact_mail</span>
              6. Procedimiento para Consultas y Reclamos
            </h3>
            <p>
              El titular o sus causahabientes pueden ejercer sus derechos enviando una solicitud formal al correo <strong>{BUSINESS_CONFIG.privacyEmail}</strong> o a la dirección física <strong>{BUSINESS_CONFIG.address}, {BUSINESS_CONFIG.city}</strong>.
            </p>
            <div className="space-y-1.5 text-[11px] bg-[#F4EFE9] p-2.5 rounded-xl border border-[#C6BDAC]">
              <p>
                <strong>Consultas:</strong> Serán atendidas en un término máximo de <strong>diez (10) días hábiles</strong> contados a partir de la fecha de recibo. Si no fuere posible, se informará al interesado antes del vencimiento con plazo adicional no superior a <strong>cinco (5) días hábiles</strong>.
              </p>
              <p>
                <strong>Reclamos (Corrección, Actualización o Supresión):</strong> Serán atendidos en un término máximo de <strong>quince (15) días hábiles</strong> contados a partir del día siguiente a la fecha de su recibo, con prórroga máxima de <strong>ocho (8) días hábiles</strong> debidamente informada.
              </p>
            </div>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">cloud_sync</span>
              7. Transmisión Internacional de Datos y Encargados
            </h3>
            <p>
              Para el correcto funcionamiento de la plataforma digital y el envío de notificaciones transaccionales, los datos son tratados a través de proveedores tecnológicos que actúan como Encargados:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Google Cloud &amp; Firebase (Google LLC):</strong> Alojamiento de base de datos segura y servidores ubicados en Estados Unidos bajo estándares internacionales de seguridad de la información.</li>
              <li><strong>UltraMsg / Gateway WhatsApp:</strong> Infraestructura para el envío automático y cifrado de mensajes transaccionales de confirmación.</li>
            </ul>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">child_care</span>
              8. Menores de Edad
            </h3>
            <p>
              Los servicios del establecimiento y el agendamiento web están dirigidos exclusivamente a mayores de edad. La atención a niños, niñas y adolescentes requiere la presencia, autorización expresa y acompañamiento permanente de su representante legal o tutor.
            </p>
          </section>

          <section className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#C6BDAC]/70">
            <h3 className="font-bold text-[#2B2420] text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2B2420] text-[16px]">history</span>
              9. Periodo de Conservación y Vigencia
            </h3>
            <p>
              Los datos personales se conservarán durante el tiempo que dure la relación comercial y mientras sea necesario para cumplir las finalidades y las obligaciones contables y fiscales previstas por la ley colombiana. Esta política rige a partir de su publicación en el portal web.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#C6BDAC]/70 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#5A4A43]">
            {BUSINESS_CONFIG.brandName} · {BUSINESS_CONFIG.city}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
