import React, { useState } from 'react';
import { validateAndClean } from '../utils/security';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import {
  getUltraMsgConfig,
  saveUltraMsgConfig,
  UltraMsgConfig,
  DEFAULT_ULTRAMSG_CONFIG,
  getWhatsAppHistory,
  sendUltraMsgWhatsApp,
  verifyUltraMsgConnection,
  renderTemplate
} from '../services/whatsappService';

interface UltraMsgConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

export const UltraMsgConfigModal: React.FC<UltraMsgConfigModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [config, setConfig] = useState<UltraMsgConfig>(() => getUltraMsgConfig());
  const [activeTab, setActiveTab] = useState<'disparos' | 'credenciales' | 'plantillas' | 'historial'>('disparos');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Prueba de integración de mensajería');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; msg: string; status?: string } | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const history = getWhatsAppHistory();

  if (!isOpen) return null;

  const handleSave = () => {
    const confRes = validateAndClean(config.confirmationTemplate, 'Plantilla de Confirmación', 2000);
    if (!confRes.ok) {
      if (onToast) onToast(confRes.error || 'Error en plantilla de confirmación.');
      return;
    }
    const statusRes = validateAndClean(config.statusChangeTemplate, 'Plantilla de Cambio de Estado', 2000);
    if (!statusRes.ok) {
      if (onToast) onToast(statusRes.error || 'Error en plantilla de cambio de estado.');
      return;
    }
    const payRes = validateAndClean(config.paymentTemplate, 'Plantilla de Cobro', 2000);
    if (!payRes.ok) {
      if (onToast) onToast(payRes.error || 'Error en plantilla de cobro.');
      return;
    }
    const instRes = validateAndClean(config.instanceId, 'ID de Instancia', 100);
    if (!instRes.ok) {
      if (onToast) onToast(instRes.error || 'Error en ID de instancia.');
      return;
    }
    const tokenRes = validateAndClean(config.token, 'Token', 150);
    if (!tokenRes.ok) {
      if (onToast) onToast(tokenRes.error || 'Error en token de UltraMsg.');
      return;
    }

    const cleanConfig: UltraMsgConfig = {
      ...config,
      instanceId: instRes.value,
      token: tokenRes.value,
      confirmationTemplate: confRes.value,
      statusChangeTemplate: statusRes.value,
      paymentTemplate: payRes.value
    };
    saveUltraMsgConfig(cleanConfig);
    setConfig(cleanConfig);
    if (onToast) onToast('¡Configuración de UltraMsg guardada correctamente!');
    onClose();
  };

  const handleVerifyConnection = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    const res = await verifyUltraMsgConnection({
      instanceId: config.instanceId,
      token: config.token
    });

    setIsVerifying(false);
    if (res.success) {
      const isQr = res.accountStatus === 'qr';
      setVerificationResult({
        success: true,
        msg: isQr
          ? `Instancia ${res.instance || config.instanceId} activa en UltraMsg (Esperando vinculación QR en WhatsApp).`
          : `Instancia ${res.instance || config.instanceId} autenticada y vinculada a WhatsApp.`,
        status: res.accountStatus
      });
      if (isQr) {
        setShowQrCode(true);
      }
      if (onToast) onToast('✓ Conexión con UltraMsg verificada exitosamente.');
    } else {
      setVerificationResult({
        success: false,
        msg: res.error || 'No se pudo conectar con la instancia de UltraMsg.'
      });
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_ULTRAMSG_CONFIG);
    saveUltraMsgConfig(DEFAULT_ULTRAMSG_CONFIG);
    if (onToast) onToast('Plantillas y credenciales restauradas por defecto.');
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      setTestResult({ success: false, msg: 'Ingresa un número de WhatsApp válido' });
      return;
    }

    const val = validateAndClean(testMessage, 'Mensaje de Prueba', 500);
    if (!val.ok) {
      setTestResult({ success: false, msg: val.error || 'El mensaje solo admite texto plano.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const safeMessage = val.value;

    const res = await sendUltraMsgWhatsApp({
      phone: testPhone,
      message: safeMessage,
      clientName: 'Cliente de Prueba'
    });

    setIsTesting(false);
    if (res.success) {
      setTestResult({
        success: true,
        msg: `Mensaje enviado con éxito vía UltraMsg. Ref/ID: ${res.messageId || 'OK'}`
      });
      if (onToast) onToast('Disparo de prueba enviado a WhatsApp');
    } else {
      setTestResult({
        success: false,
        msg: res.error || 'No se pudo conectar con UltraMsg Gateway.'
      });
    }
  };

  const samplePreviewVars = {
    cliente: 'Valeria Gomez',
    codigo: 'AURA-9821',
    servicio: 'Manicura Rusa Glazed Donut',
    fecha: '2026-09-30',
    hora: '03:30 PM',
    sede: BUSINESS_CONFIG.branchName,
    estado: 'En Preparación',
    monto: '95.000'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#C6BDAC] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F4EFE9] via-[#C6BDAC]/30 to-[#F4EFE9] text-[#2B2420] border-b border-[#C6BDAC] p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <span className="material-symbols-outlined text-[24px]">chat</span>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-['Plus_Jakarta_Sans',sans-serif] text-[#2B2420]">
                Configuración UltraMsg Gateway WhatsApp
              </h3>
              <p className="text-xs text-[#5A4A43]">
                Disparos automáticos y plantillas de confirmación para citas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#BB9C87]/10 hover:bg-[#BB9C87]/20 text-[#2B2420] flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#C6BDAC]/40 bg-[#F4EFE9] px-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('disparos')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'disparos'
                ? 'border-[#BB9C87] text-[#2B2420]'
                : 'border-transparent text-[#5A4A43] hover:text-[#2B2420]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Disparos Automáticos</span>
          </button>

          <button
            onClick={() => setActiveTab('plantillas')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'plantillas'
                ? 'border-[#BB9C87] text-[#2B2420]'
                : 'border-transparent text-[#5A4A43] hover:text-[#2B2420]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Plantillas de Mensaje</span>
          </button>

          <button
            onClick={() => setActiveTab('credenciales')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'credenciales'
                ? 'border-[#BB9C87] text-[#2B2420]'
                : 'border-transparent text-[#5A4A43] hover:text-[#2B2420]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>API & Credenciales</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'historial'
                ? 'border-[#BB9C87] text-[#2B2420]'
                : 'border-transparent text-[#5A4A43] hover:text-[#2B2420]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Historial ({history.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: DISPAROS AUTOMÁTICOS */}
          {activeTab === 'disparos' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-[#C6BDAC]/40 p-4 rounded-2xl border border-[#C6BDAC] text-xs text-[#5A4A43] flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-[#2B2420] shrink-0 mt-0.5">info</span>
                <div>
                  <strong className="block text-[#2B2420] font-bold">Automatización en Tiempo Real</strong>
                  Al activar estos disparos, la aplicación enviará automáticamente los mensajes de confirmación sin requerir intervención manual por parte de la recepcionista.
                </div>
              </div>

              <div className="space-y-3">
                {/* Switch 1: Confirmation */}
                <div className="p-4 rounded-2xl border border-[#C6BDAC] bg-white flex items-center justify-between hover:border-[#BB9C87] transition-all">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[22px] text-[#52b788] mt-0.5">event_available</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#2B2420]">1. Confirmación de Nueva Reserva</h4>
                      <p className="text-xs text-[#5A4A43]">Envia mensaje de confirmación instantáneo con código de turno al agendar en la web.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoConfirmOnBooking}
                      onChange={(e) => setConfig({ ...config, autoConfirmOnBooking: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#52b788]"></div>
                  </label>
                </div>

                {/* Switch 2: Status Change */}
                <div className="p-4 rounded-2xl border border-[#C6BDAC] bg-white flex items-center justify-between hover:border-[#BB9C87] transition-all">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[22px] text-[#2B2420] mt-0.5">published_with_changes</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#2B2420]">2. Cambio de Estado de Turno</h4>
                      <p className="text-xs text-[#5A4A43]">Notifica al cliente cuando pase a "En preparación" o "Completada" desde la Agenda.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoNotifyStatusChange}
                      onChange={(e) => setConfig({ ...config, autoNotifyStatusChange: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#52b788]"></div>
                  </label>
                </div>

                {/* Switch 3: Payment Receipt */}
                <div className="p-4 rounded-2xl border border-[#C6BDAC] bg-white flex items-center justify-between hover:border-[#BB9C87] transition-all">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[22px] text-[#0284c7] mt-0.5">receipt_long</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#2B2420]">3. Recibo de Pago en Cajas</h4>
                      <p className="text-xs text-[#5A4A43]">Envía comprobante digital y detalle de cobro al registrar un pago en caja rápida.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.autoNotifyPayment}
                      onChange={(e) => setConfig({ ...config, autoNotifyPayment: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#52b788]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLANTILLAS */}
          {activeTab === 'plantillas' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-xs text-[#5A4A43]">
                Variables permitidas en plantillas: <code className="bg-[#C6BDAC]/40 px-1.5 py-0.5 rounded text-[#2B2420] font-mono">{'{cliente}'}</code>, <code className="bg-[#C6BDAC]/40 px-1.5 py-0.5 rounded text-[#2B2420] font-mono">{'{codigo}'}</code>, <code className="bg-[#C6BDAC]/40 px-1.5 py-0.5 rounded text-[#2B2420] font-mono">{'{servicio}'}</code>, <code className="bg-[#C6BDAC]/40 px-1.5 py-0.5 rounded text-[#2B2420] font-mono">{'{fecha}'}</code>, <code className="bg-[#C6BDAC]/40 px-1.5 py-0.5 rounded text-[#2B2420] font-mono">{'{hora}'}</code>, <code className="bg-[#C6BDAC]/40 px-1.5 py-0.5 rounded text-[#2B2420] font-mono">{'{sede}'}</code>, <code className="bg-[#C6BDAC]/40 px-1.5 py-0.5 rounded text-[#2B2420] font-mono">{'{estado}'}</code>, <code className="bg-[#C6BDAC]/40 px-1.5 py-0.5 rounded text-[#2B2420] font-mono">{'{monto}'}</code>
              </div>

              {/* Template 1 */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2B2420]">
                  Plantilla 1: Confirmación de Cita Creada
                </label>
                <textarea
                  rows={4}
                  value={config.confirmationTemplate}
                  onChange={(e) => setConfig({ ...config, confirmationTemplate: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-[#C6BDAC] font-mono text-xs focus:ring-2 focus:ring-[#2B2420] focus:outline-none text-[#2B2420]"
                />
                <div className="p-3 bg-[#F4EFE9] rounded-xl border border-[#C6BDAC]/50 text-xs text-[#5A4A43]">
                  <strong className="block text-[10px] uppercase text-[#2B2420] font-bold mb-1">Vista previa simulada:</strong>
                  <p className="whitespace-pre-wrap">{renderTemplate(config.confirmationTemplate, samplePreviewVars)}</p>
                </div>
              </div>

              {/* Template 2 */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2B2420]">
                  Plantilla 2: Actualización de Estado de Turno
                </label>
                <textarea
                  rows={3}
                  value={config.statusChangeTemplate}
                  onChange={(e) => setConfig({ ...config, statusChangeTemplate: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-[#C6BDAC] font-mono text-xs focus:ring-2 focus:ring-[#2B2420] focus:outline-none text-[#2B2420]"
                />
              </div>

              {/* Template 3 */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2B2420]">
                  Plantilla 3: Comprobante de Pago en Cajas
                </label>
                <textarea
                  rows={3}
                  value={config.paymentTemplate}
                  onChange={(e) => setConfig({ ...config, paymentTemplate: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-[#C6BDAC] font-mono text-xs focus:ring-2 focus:ring-[#2B2420] focus:outline-none text-[#2B2420]"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CREDENCIALES & PRUEBA */}
          {activeTab === 'credenciales' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">
                    UltraMsg Instance ID
                  </label>
                  <input
                    type="text"
                    value={config.instanceId}
                    onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                    placeholder="ej. instance000000"
                    className="w-full p-3 rounded-2xl border border-[#C6BDAC] font-mono text-xs focus:ring-2 focus:ring-[#2B2420] text-[#2B2420]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B2420] mb-1">
                    UltraMsg Token / API Key
                  </label>
                  <input
                    type="password"
                    value={config.token}
                    onChange={(e) => setConfig({ ...config, token: e.target.value })}
                    placeholder="ej. eanhimzs6xv0o1e2"
                    className="w-full p-3 rounded-2xl border border-[#C6BDAC] font-mono text-xs focus:ring-2 focus:ring-[#2B2420] text-[#2B2420]"
                  />
                </div>
              </div>

              {/* Live Connection Verification */}
              <div className="p-3.5 rounded-2xl border border-[#C6BDAC] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    verificationResult?.success
                      ? 'bg-emerald-100 text-emerald-700'
                      : verificationResult?.success === false
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-[#C6BDAC]/40 text-[#2B2420]'
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {verificationResult?.success ? 'verified' : verificationResult?.success === false ? 'error' : 'wifi_tethering'}
                    </span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#2B2420]">
                      {verificationResult
                        ? verificationResult.success
                          ? 'Instancia Activa & Autenticada'
                          : 'Falla de Conexión UltraMsg'
                        : 'Verificación de Enlace UltraMsg'}
                    </h5>
                    <p className="text-[11px] text-[#5A4A43]">
                      {verificationResult
                        ? verificationResult.msg
                        : 'Comprueba si la instancia y el token responden en la API de UltraMsg.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyConnection}
                  disabled={isVerifying}
                  className="px-3.5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isVerifying ? 'animate-spin' : ''}`}>
                    {isVerifying ? 'refresh' : 'sync'}
                  </span>
                  <span>{isVerifying ? 'Verificando...' : 'Comprobar Conexión'}</span>
                </button>
              </div>

              {/* QR Code Scanner for Pairing */}
              {showQrCode && (
                <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/60 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-700 text-[20px]">qr_code_scanner</span>
                      <h5 className="text-xs font-bold text-[#2B2420]">
                        Escanear Código QR con WhatsApp
                      </h5>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQrCode(false)}
                      className="text-xs text-[#5A4A43] hover:text-[#2B2420] cursor-pointer"
                    >
                      Ocultar QR
                    </button>
                  </div>
                  <p className="text-[11px] text-[#5A4A43]">
                    Abre WhatsApp en tu teléfono &gt; Dispositivos vinculados &gt; Vincular un dispositivo y escanea este código:
                  </p>
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-amber-200 max-w-xs mx-auto">
                    <img
                      src={`https://api.ultramsg.com/${config.instanceId}/instance/qr?token=${config.token}`}
                      alt="WhatsApp QR Code"
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                    <span className="text-[10px] text-[#5A4A43] mt-2 text-center">
                      Instancia: {config.instanceId}
                    </span>
                  </div>
                </div>
              )}

              {/* Dispatch Test Box */}
              <div className="p-4 rounded-2xl border border-[#C6BDAC] bg-[#F4EFE9] space-y-3">
                <h4 className="text-xs font-bold text-[#2B2420] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#2B2420]">send</span>
                  <span>Prueba de Disparo Instantáneo</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A4A43] mb-1">WhatsApp (+57)</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="3001234567"
                      className="w-full p-2.5 rounded-xl border border-[#C6BDAC] text-xs text-[#2B2420]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#5A4A43] mb-1">Mensaje</label>
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#C6BDAC] text-xs text-[#2B2420]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSendTest}
                    disabled={isTesting}
                    className="px-4 py-2 rounded-xl bg-[#52b788] hover:bg-[#40916c] text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>{isTesting ? 'Enviando...' : 'Probar Disparo UltraMsg'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    testResult.success ? 'bg-[#dce8dc] text-[#2d6a4f]' : 'bg-[#f8d7da] text-[#721c24]'
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {testResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span>{testResult.msg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIAL */}
          {activeTab === 'historial' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {history.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5A4A43]">
                  No hay disparos de WhatsApp registrados aún.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((rec) => (
                    <div key={rec.id} className="p-3 rounded-2xl border border-[#C6BDAC]/60 bg-white text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-[#2B2420] font-bold">{rec.clienteNombre}</strong>
                          <span className="text-[#5A4A43]">{rec.destinatario}</span>
                          {rec.bookingCode && (
                            <span className="bg-[#C6BDAC]/40 text-[#2B2420] px-1.5 py-0.5 rounded text-[10px] font-mono">
                              {rec.bookingCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5A4A43] line-clamp-1">{rec.mensaje}</p>
                        <span className="text-[10px] text-[#5A4A43] block">{rec.fechaHora} · {rec.detallesHttp}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        rec.estado === 'enviado'
                          ? 'bg-[#dce8dc] text-[#2d6a4f]'
                          : rec.estado === 'simulado'
                          ? 'bg-[#e0f2fe] text-[#0369a1]'
                          : 'bg-[#f8d7da] text-[#721c24]'
                      }`}>
                        {rec.estado.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F4EFE9] border-t border-[#C6BDAC] flex items-center justify-between shrink-0">
          <button
            onClick={handleResetDefaults}
            className="text-xs font-semibold text-[#5A4A43] hover:text-[#2B2420] underline cursor-pointer"
          >
            Restaurar Valores por Defecto
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#C6BDAC] text-xs font-semibold text-[#5A4A43] hover:bg-[#C6BDAC]/40 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs font-bold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
