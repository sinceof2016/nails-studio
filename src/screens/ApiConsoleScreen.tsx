import React, { useState, useEffect } from 'react';
import { SystemUser } from '../types';
import { validateOnlyPlainText, sanitizeToPlainText } from '../utils/security';
import {
  sendUltraMsgWhatsApp,
  getWhatsAppHistory,
  WhatsAppDispatchRecord
} from '../services/whatsappService';
import { UltraMsgConfigModal } from '../components/UltraMsgConfigModal';
import {
  getKmsKeys,
  rotateDualKeys,
  swapKmsKeys,
  verifyKmsKey,
  KmsStatusResponse,
  KmsVerifyResponse
} from '../services/kmsService';

interface ApiConsoleScreenProps {
  currentUser: SystemUser;
  onSendFeedback: (msg: string) => void;
}

export const ApiConsoleScreen: React.FC<ApiConsoleScreenProps> = ({
  currentUser,
  onSendFeedback
}) => {
  // Security guard: Only David / SuperAdmin can access
  const isDavid = currentUser.id === 'USR-DAVID-01' ||
    currentUser.email.toLowerCase().includes('david') ||
    currentUser.email.toLowerCase().includes('orjuela') ||
    currentUser.nombre.toLowerCase().includes('david orjuela');

  if (!isDavid && !currentUser.puedeVerApi) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 text-rose-800">
        <span className="material-symbols-outlined text-[48px] text-rose-600 mb-2">lock</span>
        <h3 className="text-lg font-bold">Acceso Denegado</h3>
        <p className="text-xs text-[#5A4A43] mt-1">
          El usuario administrador no tiene permisos para acceder a la Consola de API REST ni a la configuración del Gateway.
        </p>
      </div>
    );
  }

  // KMS State
  const [kmsData, setKmsData] = useState<KmsStatusResponse | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [revealPrimary, setRevealPrimary] = useState(false);
  const [revealSecondary, setRevealSecondary] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Real-time verification
  const [testCandidateKey, setTestCandidateKey] = useState('');
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<KmsVerifyResponse | null>(null);

  // WhatsApp Gateway
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hola! Tu turno en el Santuario de Belleza ha sido confirmado exitosamente.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [history, setHistory] = useState<WhatsAppDispatchRecord[]>(getWhatsAppHistory());
  const [isUltraMsgModalOpen, setIsUltraMsgModalOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState({
    status: 'connected',
    provider: 'UltraMsg WhatsApp Cloud Gateway',
    instance: 'instance192909',
    tokenSecured: true,
    serverSideProxy: true
  });

  // REST API simulated/live tester
  const [selectedEndpoint, setSelectedEndpoint] = useState<'citas' | 'caja' | 'clientes' | 'whatsapp'>('citas');
  const [keyToUseForApi, setKeyToUseForApi] = useState<'primary' | 'secondary' | 'invalid'>('primary');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiResponseHeaders, setApiResponseHeaders] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Fetch KMS and Gateway status on mount
  const refreshKmsData = async () => {
    const data = await getKmsKeys();
    setKmsData(data);
  };

  useEffect(() => {
    refreshKmsData();

    fetch('/api/whatsapp/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setGatewayStatus(data);
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  // Handle Dual Key Rotation
  const handleExecuteRotation = async () => {
    if (!window.confirm('¿Deseas ejecutar la Rotación Doble de Llaves?\n\nLa Llave Primaria actual pasará a ser Secundaria (período de gracia), la Secundaria anterior se revocará y se generará una nueva Llave Primaria criptográfica de 256 bits sin tiempo de inactividad.')) {
      return;
    }

    setIsRotating(true);
    const res = await rotateDualKeys('Rotación manual solicitada por David Orjuela desde consola');
    setIsRotating(false);

    if (res.success) {
      await refreshKmsData();
      onSendFeedback('✓ Rotación doble completada: Nueva Llave Primaria activa y Llave previa en gracia.');
    } else {
      onSendFeedback(res.message || 'Error al ejecutar rotación de llaves.');
    }
  };

  // Handle Immediate Key Swap (Failover)
  const handleExecuteSwap = async () => {
    setIsSwapping(true);
    const res = await swapKmsKeys();
    setIsSwapping(false);

    if (res.success) {
      await refreshKmsData();
      onSendFeedback('✓ Intercambio inmediato (Swap) de llaves completado.');
    } else {
      onSendFeedback(res.message || 'Error al intercambiar llaves.');
    }
  };

  // Handle Verify Key
  const handleVerifyCandidateKey = async () => {
    if (!testCandidateKey.trim()) return;
    setVerifyingKey(true);
    setVerificationFeedback(null);
    const result = await verifyKmsKey(testCandidateKey.trim());
    setVerifyingKey(false);
    setVerificationFeedback(result);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
    onSendFeedback(`Copiado: ${label}`);
  };

  const handleSendTestWhatsApp = async () => {
    // Validar que el mensaje sea únicamente texto plano sin código ejecutable
    const val = validateOnlyPlainText(testMessage, 'Mensaje de Prueba', 500);
    if (!val.isValid) {
      setTestResult(val.reason || 'El mensaje solo admite texto plano sin scripts ni código ejecutable.');
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    const safeMessage = sanitizeToPlainText(testMessage);

    const res = await sendUltraMsgWhatsApp({
      phone: testPhone,
      message: safeMessage,
      clientName: 'Prueba API',
      bookingCode: 'TEST-PELU'
    });

    setSendingTest(false);
    if (res.success) {
      setTestResult('Mensaje procesado exitosamente a través del Gateway Seguro.');
      setHistory(getWhatsAppHistory());
      onSendFeedback('Mensaje de WhatsApp procesado vía Proxy Seguro.');
    } else {
      setTestResult(`Error al enviar: ${res.error}`);
    }
  };

  // Execute actual REST API call against server using selected key
  const handleExecuteRestTest = async (endpoint: 'citas' | 'caja' | 'clientes' | 'whatsapp') => {
    setSelectedEndpoint(endpoint);
    let chosenKey = '';
    if (keyToUseForApi === 'primary') {
      chosenKey = kmsData?.primaryKey.rawSecret || 'aura_live_k1_8f9c2d1e0b4a736458291a7e4b';
    } else if (keyToUseForApi === 'secondary') {
      chosenKey = kmsData?.secondaryKey.rawSecret || 'aura_live_k2_3a7b1c9e8d2f405167382b6c9d';
    } else {
      chosenKey = 'aura_invalid_key_xyz_000';
    }

    const path =
      endpoint === 'citas'
        ? '/api/v1/citas/activas'
        : endpoint === 'caja'
        ? '/api/v1/caja/balance'
        : endpoint === 'whatsapp'
        ? '/api/v1/whatsapp/status'
        : '/api/v1/clientes/metricas';

    try {
      const res = await fetch(path, {
        headers: {
          'X-API-Key': chosenKey,
          'Accept': 'application/json'
        }
      });

      const roleHeader = res.headers.get('x-kms-key-role') || 'NO_AUTH';
      const warningHeader = res.headers.get('x-kms-warning');
      const data = await res.json();

      setApiResponse(JSON.stringify(data, null, 2));
      setApiResponseHeaders(
        `HTTP ${res.status} ${res.statusText}\nX-KMS-Key-Role: ${roleHeader}${warningHeader ? `\nX-KMS-Warning: ${warningHeader}` : ''}`
      );
    } catch {
      setApiResponse(
        JSON.stringify(
          {
            error: 'No se pudo conectar con el endpoint local. Ejecutando en simulación de cliente.',
            endpoint: path,
            keyUsada: keyToUseForApi
          },
          null,
          2
        )
      );
      setApiResponseHeaders('Simulación Frontend');
    }
  };

  const curlCommand = `curl -X GET "https://lapeluspa.com/api/v1/citas/activas" \\
  -H "X-API-Key: ${kmsData?.primaryKey.rawSecret || 'pelu_live_k1_8f9c2d1e0b4a736458291a7e4b'}" \\
  -H "Content-Type: application/json"`;

  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Banner Principal con Colores Pasteles Suaves */}
      <div className="rounded-3xl bg-gradient-to-r from-[#F4EFE9] via-[#C6BDAC]/30 to-[#F4EFE9] p-6 sm:p-8 text-[#2B2420] border border-[#C6BDAC]/80 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#C6BDAC]/40/20 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BB9C87]/10 text-[#2B2420] text-xs font-semibold mb-2 border border-[#BB9C87]/20">
            <span className="material-symbols-outlined text-[15px] text-[#2B2420]">shield_lock</span>
            Consola Exclusiva de Seguridad &amp; Control de Llaves · David Orjuela
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#2B2420]">
            Servicio de Control de Llaves (KMS) &amp; Gateway
          </h2>
          <p className="text-xs sm:text-sm text-[#5A4A43] mt-1 max-w-xl">
            Gestión criptográfica con protocolo de <strong>Rotación Doble (Dual Key Rotation)</strong> con cero tiempo de inactividad, bóveda de secretos y UltraMsg WhatsApp Gateway.
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: SERVICIO DE CONTROL DE LLAVES (KMS) CON ROTACIÓN DOBLE */}
      <div className="bg-white rounded-3xl p-6 border border-[#C6BDAC]/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C6BDAC]/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#BB9C87]/10 border border-[#BB9C87]/25 flex items-center justify-center text-[#2B2420]">
              <span className="material-symbols-outlined text-[28px]">key</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                  Motor de Control de Llaves Criptográficas (KMS)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Protocolo Doble Llave Activo
                </span>
              </div>
              <p className="text-xs text-[#5A4A43]">
                Mantiene dos llaves vigentes en simultáneo para garantizar rotación sin desconectar clientes ni integraciones POS.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExecuteSwap}
              disabled={isSwapping}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#C6BDAC]/40 border border-[#C6BDAC] text-[#2B2420] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Intercambia roles entre la Llave Primaria y Secundaria de forma instantánea"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSwapping ? 'animate-spin' : ''}`}>
                swap_horiz
              </span>
              <span>{isSwapping ? 'Intercambiando...' : 'Swap Failover'}</span>
            </button>

            <button
              onClick={handleExecuteRotation}
              disabled={isRotating}
              className="px-4 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRotating ? 'animate-spin' : ''}`}>
                autorenew
              </span>
              <span>{isRotating ? 'Rotando Criptográficamente...' : 'Ejecutar Rotación Doble'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Llave Primaria y Llave Secundaria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LLAVE PRIMARIA */}
          <div className="p-5 rounded-2xl bg-[#F4EFE9] border-2 border-[#BB9C87]/40 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#2B2420]">
                  Llave Primaria (Tráfico Principal)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ACTIVA · VIGENTE
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#5A4A43] block">ID de Llave: {kmsData?.primaryKey.id}</span>
              <div className="flex items-center justify-between mt-1 bg-white p-2.5 rounded-xl border border-[#C6BDAC]">
                <code className="text-xs font-mono font-bold text-[#2B2420]">
                  {revealPrimary
                    ? kmsData?.primaryKey.rawSecret
                    : kmsData?.primaryKey.maskedSecret}
                </code>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRevealPrimary(!revealPrimary)}
                    className="p-1 text-[#5A4A43] hover:text-[#2B2420] cursor-pointer"
                    title={revealPrimary ? 'Ocultar' : 'Revelar'}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {revealPrimary ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleCopyText(
                        kmsData?.primaryKey.rawSecret || '',
                        'Llave Primaria'
                      )
                    }
                    className="p-1 text-[#5A4A43] hover:text-[#2B2420] cursor-pointer"
                    title="Copiar Llave Primaria"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedKey === 'Llave Primaria' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5A4A43] pt-1">
              <div>
                <span className="text-[10px] text-[#5A4A43] block">Algoritmo</span>
                <span className="font-semibold text-[#2B2420]">AES-256-GCM / SHA-256</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5A4A43] block">Emisión</span>
                <span className="font-semibold text-[#2B2420]">
                  {kmsData?.primaryKey.createdAt
                    ? new Date(kmsData.primaryKey.createdAt).toLocaleDateString('es-CO')
                    : 'Reciente'}
                </span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#5A4A43] truncate bg-white/60 p-1.5 rounded-lg border border-[#C6BDAC]/50">
              Fingerprint: {kmsData?.primaryKey.fingerprint.slice(0, 32)}...
            </div>
          </div>

          {/* LLAVE SECUNDARIA (TRANSICIÓN / PERÍODO DE GRACIA) */}
          <div className="p-5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#5A4A43]">
                  Llave Secundaria (Transición / Gracia)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                EN GRACIA (14 DÍAS)
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#5A4A43] block">ID de Llave: {kmsData?.secondaryKey.id}</span>
              <div className="flex items-center justify-between mt-1 bg-white p-2.5 rounded-xl border border-[#C6BDAC]">
                <code className="text-xs font-mono font-bold text-[#5A4A43]">
                  {revealSecondary
                    ? kmsData?.secondaryKey.rawSecret
                    : kmsData?.secondaryKey.maskedSecret}
                </code>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRevealSecondary(!revealSecondary)}
                    className="p-1 text-[#5A4A43] hover:text-[#2B2420] cursor-pointer"
                    title={revealSecondary ? 'Ocultar' : 'Revelar'}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {revealSecondary ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleCopyText(
                        kmsData?.secondaryKey.rawSecret || '',
                        'Llave Secundaria'
                      )
                    }
                    className="p-1 text-[#5A4A43] hover:text-[#2B2420] cursor-pointer"
                    title="Copiar Llave Secundaria"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedKey === 'Llave Secundaria' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5A4A43] pt-1">
              <div>
                <span className="text-[10px] text-[#5A4A43] block">Propósito</span>
                <span className="font-semibold text-[#2B2420]">Failover &amp; Cero Caídas</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5A4A43] block">Estado de Rotación</span>
                <span className="font-semibold text-amber-700">Aceptada en Headers</span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#5A4A43] truncate bg-white/60 p-1.5 rounded-lg border border-[#C6BDAC]/50">
              Fingerprint: {kmsData?.secondaryKey.fingerprint.slice(0, 32)}...
            </div>
          </div>
        </div>

        {/* Verificador de Llaves en Tiempo Real */}
        <div className="p-4 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC] space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B2420] text-[18px]">verified_user</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B2420]">
              Verificador Criptográfico de Llaves en Vivo
            </h4>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={testCandidateKey}
              onChange={(e) => setTestCandidateKey(e.target.value)}
              placeholder="Pega cualquier API Key aquí para comprobar su validez en el KMS..."
              className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-[#C6BDAC] text-xs font-mono text-[#2B2420] focus:outline-none focus:ring-1 focus:ring-[#2B2420]"
            />
            <button
              onClick={handleVerifyCandidateKey}
              disabled={verifyingKey || !testCandidateKey.trim()}
              className="px-4 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {verifyingKey ? 'Comprobando...' : 'Comprobar en KMS'}
            </button>
          </div>

          {verificationFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                verificationFeedback.valid
                  ? verificationFeedback.keyRole === 'PRIMARY'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {verificationFeedback.valid ? 'check_circle' : 'cancel'}
              </span>
              <span>{verificationFeedback.message}</span>
            </div>
          )}
        </div>

        {/* Libro Mayor de Auditoría de Rotaciones */}
        {kmsData?.auditTrail && kmsData.auditTrail.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A4A43]">
              Libro Mayor de Auditoría de Rotaciones (KMS Ledger)
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-[#C6BDAC]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4EFE9] text-[#5A4A43] font-semibold border-b border-[#C6BDAC]">
                  <tr>
                    <th className="p-3">Marca de Tiempo</th>
                    <th className="p-3">Acción Criptográfica</th>
                    <th className="p-3">Responsable</th>
                    <th className="p-3">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C6BDAC]/50 bg-white">
                  {kmsData.auditTrail.map((record) => (
                    <tr key={record.id} className="hover:bg-[#F4EFE9]/60 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[#5A4A43]">
                        {new Date(record.timestamp).toLocaleString('es-CO')}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#BB9C87]/10 text-[#2B2420] font-bold text-[10px]">
                          {record.action}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#2B2420]">{record.triggeredBy}</td>
                      <td className="p-3 text-[#5A4A43]">{record.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: PROBADOR DE ENDPOINTS REST CON AUTENTICACIÓN KMS DUAL */}
      <div className="bg-white rounded-3xl p-6 border border-[#C6BDAC]/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C6BDAC]/50 pb-3">
          <div>
            <h3 className="font-bold text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
              Prueba de Endpoints REST con Llave Activa
            </h3>
            <p className="text-xs text-[#5A4A43]">
              Selecciona con qué llave deseas autenticarte para verificar la respuesta del backend
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F4EFE9] p-1 rounded-xl border border-[#C6BDAC]">
            <span className="text-[11px] font-semibold text-[#5A4A43] px-2">Autenticar con:</span>
            <button
              onClick={() => setKeyToUseForApi('primary')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                keyToUseForApi === 'primary' ? 'bg-[#BB9C87] text-[#2B2420] font-bold shadow-2xs' : 'text-[#5A4A43]'
              }`}
            >
              Primaria
            </button>
            <button
              onClick={() => setKeyToUseForApi('secondary')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                keyToUseForApi === 'secondary' ? 'bg-amber-700 text-white shadow-2xs' : 'text-[#5A4A43]'
              }`}
            >
              Secundaria
            </button>
            <button
              onClick={() => setKeyToUseForApi('invalid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                keyToUseForApi === 'invalid' ? 'bg-rose-700 text-white shadow-2xs' : 'text-[#5A4A43]'
              }`}
            >
              Inválida
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExecuteRestTest('citas')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedEndpoint === 'citas' ? 'bg-[#BB9C87] text-[#2B2420] font-bold' : 'bg-[#C6BDAC]/40 text-[#5A4A43]'
            }`}
          >
            GET /api/v1/citas/activas
          </button>
          <button
            onClick={() => handleExecuteRestTest('caja')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedEndpoint === 'caja' ? 'bg-[#BB9C87] text-[#2B2420] font-bold' : 'bg-[#C6BDAC]/40 text-[#5A4A43]'
            }`}
          >
            GET /api/v1/caja/balance
          </button>
          <button
            onClick={() => handleExecuteRestTest('whatsapp')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedEndpoint === 'whatsapp' ? 'bg-[#BB9C87] text-[#2B2420] font-bold' : 'bg-[#C6BDAC]/40 text-[#5A4A43]'
            }`}
          >
            GET /api/v1/whatsapp/status
          </button>
          <button
            onClick={() => handleExecuteRestTest('clientes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedEndpoint === 'clientes' ? 'bg-[#BB9C87] text-[#2B2420] font-bold' : 'bg-[#C6BDAC]/40 text-[#5A4A43]'
            }`}
          >
            GET /api/v1/clientes/metricas
          </button>
        </div>

        {apiResponse && (
          <div className="space-y-2 pt-2">
            {apiResponseHeaders && (
              <div className="p-2 rounded-xl bg-[#C6BDAC]/40 text-xs font-mono text-[#2B2420]">
                {apiResponseHeaders}
              </div>
            )}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#5A4A43]">Respuesta del Servidor:</span>
              <pre className="p-3.5 rounded-2xl bg-[#F4EFE9] text-[#2B2420] text-xs font-mono overflow-x-auto border border-[#C6BDAC]">
                {apiResponse}
              </pre>
            </div>
          </div>
        )}

        {/* cURL Example */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A4A43]">
              Ejemplo de Consulta API Segura (cURL)
            </span>
            <button
              onClick={copyCurlToClipboard}
              className="text-xs font-semibold text-[#2B2420] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copiedCurl ? '¡Copiado!' : 'Copiar cURL'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-2xl bg-[#F4EFE9] text-[#2B2420] text-xs font-mono overflow-x-auto border border-[#C6BDAC]">
            {curlCommand}
          </pre>
        </div>
      </div>

      {/* SECCIÓN 3: GATEWAY WHATSAPP ULTRAMSG */}
      <div className="bg-white rounded-3xl p-6 border border-[#C6BDAC]/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C6BDAC]/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <span className="material-symbols-outlined text-[28px]">chat</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
                UltraMsg Gateway &amp; Proxy Seguro
              </h3>
              <p className="text-xs text-[#5A4A43]">
                Envío automático de notificaciones a WhatsApp sin exponer credenciales en el cliente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUltraMsgModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              <span>Configurar Disparos &amp; Plantillas</span>
            </button>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Vault Cifrado Activo
            </span>
          </div>
        </div>

        {/* Masked Credentials Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]/80">
            <span className="text-[11px] font-semibold text-[#5A4A43] block mb-1">
              Gateway Provider
            </span>
            <span className="font-bold text-[#2B2420] block">UltraMsg Cloud API</span>
            <span className="text-[10px] text-emerald-700 font-semibold">✓ Conexión encriptada</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]/80">
            <span className="text-[11px] font-semibold text-[#5A4A43] block mb-1">
              UltraMsg Instance ID
            </span>
            <span className="font-mono font-bold text-[#2B2420] block">{gatewayStatus.instance}</span>
            <span className="text-[10px] text-emerald-700 font-semibold">✓ Enrutado vía Proxy</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC]/80">
            <span className="text-[11px] font-semibold text-[#5A4A43] block mb-1">
              Token de Autenticación
            </span>
            <span className="font-mono font-bold text-[#2B2420] block">••••••••••••••••</span>
            <span className="text-[10px] text-emerald-700 font-semibold">✓ Oculto en Vault</span>
          </div>
        </div>

        {/* Interactive Live Message Tester */}
        <div className="p-4 rounded-2xl bg-[#F4EFE9] border border-[#C6BDAC] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
            Disparador de Prueba de Gateway Seguro
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">
                Teléfono de Destino (+57...)
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Ej. 300 123 4567"
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">
                Mensaje de Notificación
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSendTestWhatsApp}
              disabled={sendingTest}
              className="px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#0b421a] font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{sendingTest ? 'Enviando por Proxy...' : 'Ejecutar Envío de Prueba'}</span>
            </button>

            {testResult && (
              <span className="text-xs font-semibold text-[#2B2420] animate-in fade-in">
                {testResult}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#C6BDAC]/80 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
          Registro de Despachos WhatsApp Recientes ({history.length})
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-[#5A4A43] py-4 text-center">
            Aún no se han enviado mensajes en esta sesión. Los disparos automáticos aparecerán aquí.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#C6BDAC]/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4EFE9] text-[#5A4A43] font-semibold border-b border-[#C6BDAC]/70">
                <tr>
                  <th className="p-3">Hora</th>
                  <th className="p-3">Destinatario</th>
                  <th className="p-3">Mensaje</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Gateway</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C6BDAC]/40 bg-white">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-[#F4EFE9]/50 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-[#5A4A43]">
                      {record.fechaHora ? record.fechaHora.slice(11, 16) : '--:--'}
                    </td>
                    <td className="p-3 font-semibold text-[#2B2420]">{record.destinatario}</td>
                    <td className="p-3 text-[#5A4A43] max-w-xs truncate">{record.mensaje}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          record.estado === 'enviado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.estado === 'simulado'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {record.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#2B2420]">
                      {record.detallesHttp || 'UltraMsg Proxy'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de UltraMsg */}
      <UltraMsgConfigModal
        isOpen={isUltraMsgModalOpen}
        onClose={() => {
          setIsUltraMsgModalOpen(false);
          setHistory(getWhatsAppHistory());
        }}
        onToast={onSendFeedback}
      />
    </div>
  );
};
