import React, { useState, useEffect } from 'react';
import { SystemUser } from '../types';
import {
  sendUltraMsgWhatsApp,
  getWhatsAppHistory,
  WhatsAppDispatchRecord
} from '../services/whatsappService';

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
        <p className="text-xs text-[#6F5A4B] mt-1">
          El usuario administrador no tiene permisos para acceder a la Consola de API REST ni a la configuración del Gateway.
        </p>
      </div>
    );
  }

  const [testPhone, setTestPhone] = useState('+57 312 849 2011');
  const [testMessage, setTestMessage] = useState('Hola! Tu turno en Aura Nails & Spa ha sido confirmado exitosamente.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [history, setHistory] = useState<WhatsAppDispatchRecord[]>(getWhatsAppHistory());
  const [gatewayStatus, setGatewayStatus] = useState({
    status: 'connected',
    provider: 'UltraMsg WhatsApp Cloud Gateway',
    instance: 'instance191642',
    tokenSecured: true,
    serverSideProxy: true
  });

  // REST API simulated tester
  const [selectedEndpoint, setSelectedEndpoint] = useState<'citas' | 'caja' | 'clientes' | 'whatsapp'>('citas');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    fetch('/api/whatsapp/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setGatewayStatus(data);
        }
      })
      .catch(() => {
        // Modo estático GitHub Pages
      });
  }, []);

  const handleSendTestWhatsApp = async () => {
    setSendingTest(true);
    setTestResult(null);

    const res = await sendUltraMsgWhatsApp({
      phone: testPhone,
      message: testMessage,
      clientName: 'Prueba API',
      bookingCode: 'TEST-AURA'
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

  const handleTestEndpoint = (endpoint: string) => {
    switch (endpoint) {
      case 'citas':
        setApiResponse(
          JSON.stringify(
            {
              status: 200,
              data: {
                totalCitas: 4,
                sede: 'Chicó Calle 85',
                sincronizacionGoogleCalendar: true,
                turnos: [
                  { codigo: 'AURA-7829', cliente: 'Mariana Duque', servicio: 'Manicura Rusa Glazed', estado: 'confirmada' },
                  { codigo: 'AURA-8902', cliente: 'Dra. Carolina Restrepo', servicio: 'Soft Gel Pastel Art', estado: 'en_preparacion' }
                ]
              }
            },
            null,
            2
          )
        );
        break;
      case 'caja':
        setApiResponse(
          JSON.stringify(
            {
              status: 200,
              data: {
                moneda: 'COP',
                baseInicial: 200000,
                entradasEfectivo: 95000,
                entradasDigitales: 145000,
                egresos: 65000,
                efectivoEnGaveta: 230000,
                estado: 'cuadrada'
              }
            },
            null,
            2
          )
        );
        break;
      case 'whatsapp':
        setApiResponse(
          JSON.stringify(
            {
              status: 200,
              gateway: gatewayStatus.provider,
              instanceId: gatewayStatus.instance,
              activo: true,
              tokenStatus: 'Oculto & Cifrado en Backend Vault',
              mensajesEnviadosHoy: history.length,
              proxyEndpoint: '/api/whatsapp/send'
            },
            null,
            2
          )
        );
        break;
      case 'clientes':
        setApiResponse(
          JSON.stringify(
            {
              status: 200,
              totalClientes: 42,
              segmentacion: { vip: 14, frecuente: 20, nuevo: 8 },
              privacidad: 'Protegida con RBAC y Vault SHA-256'
            },
            null,
            2
          )
        );
        break;
      default:
        setApiResponse(JSON.stringify({ status: 200, message: 'OK' }, null, 2));
    }
  };

  const curlCommand = `curl -X POST "https://aura-nails-spa.app/api/whatsapp/send" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SECURE_VAULT_SESSION_TOKEN>" \\
  -d '{
    "phone": "573128492011",
    "message": "Turno confirmado en Aura Nails & Spa",
    "clientName": "Mariana Duque"
  }'`;

  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1c1c18] via-[#2a1c22] to-[#7C571C] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#DFCBB5] text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[15px] text-[#C49756]">shield_lock</span>
            Consola Exclusiva de Seguridad &amp; API · David Orjuela
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-white">
            Seguridad de API &amp; Gateway WhatsApp
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
            Tus API keys, tokens de autenticación y webhooks están protegidos en el Vault backend con rate limiting activo y anti-fugas.
          </p>
        </div>
      </div>

      {/* Security Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#DFCBB5]/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFCBB5]/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#128C7E]">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
                UltraMsg Gateway &amp; Proxy Seguro
              </h3>
              <p className="text-xs text-[#6F5A4B]">
                Envío automático de notificaciones a WhatsApp sin exponer credenciales en el cliente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Vault Cifrado Activo
            </span>
          </div>
        </div>

        {/* Masked Credentials Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5]/80">
            <span className="text-[11px] font-semibold text-[#6F5A4B] block mb-1">
              Gateway Provider
            </span>
            <span className="font-bold text-[#221A14] block">UltraMsg Cloud API</span>
            <span className="text-[10px] text-emerald-700 font-semibold">✓ Conexión encriptada</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5]/80">
            <span className="text-[11px] font-semibold text-[#6F5A4B] block mb-1">
              UltraMsg Instance ID
            </span>
            <span className="font-mono font-bold text-[#221A14] block">{gatewayStatus.instance}</span>
            <span className="text-[10px] text-emerald-700 font-semibold">✓ Enrutado vía Proxy</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5]/80">
            <span className="text-[11px] font-semibold text-[#6F5A4B] block mb-1">
              Token de Autenticación
            </span>
            <span className="font-mono font-bold text-[#221A14] block">••••••••••••••••</span>
            <span className="text-[10px] text-emerald-700 font-semibold">✓ Oculto en Vault</span>
          </div>
        </div>

        {/* Interactive Live Message Tester */}
        <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C571C] font-['Plus_Jakarta_Sans',sans-serif]">
            Disparador de Prueba de Gateway Seguro
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#6F5A4B] mb-1">
                Teléfono de Destino (+57...)
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+57 312 849 2011"
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#DFCBB5] text-xs text-[#221A14]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#6F5A4B] mb-1">
                Mensaje de Notificación
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#DFCBB5] text-xs text-[#221A14]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSendTestWhatsApp}
              disabled={sendingTest}
              className="px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#0b421a] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{sendingTest ? 'Enviando por Proxy...' : 'Ejecutar Envío de Prueba'}</span>
            </button>

            {testResult && (
              <span className="text-xs font-semibold text-[#7C571C] animate-in fade-in">
                {testResult}
              </span>
            )}
          </div>
        </div>

        {/* cURL Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6F5A4B]">
              Ejemplo de Consulta API Segura (cURL)
            </span>
            <button
              onClick={copyCurlToClipboard}
              className="text-xs font-semibold text-[#7C571C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copiedCurl ? '¡Copiado!' : 'Copiar cURL'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-2xl bg-[#1c1c18] text-[#DFCBB5] text-xs font-mono overflow-x-auto border border-[#3a2b20]">
            {curlCommand}
          </pre>
        </div>
      </div>

      {/* REST API Tester & Endpoints */}
      <div className="bg-white rounded-3xl p-6 border border-[#DFCBB5]/80 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
          Prueba de Endpoints REST del Sistema
        </h3>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedEndpoint('citas');
              handleTestEndpoint('citas');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedEndpoint === 'citas' ? 'bg-[#7C571C] text-white' : 'bg-[#FBEBE1] text-[#6F5A4B]'
            }`}
          >
            GET /api/v1/citas/activas
          </button>
          <button
            onClick={() => {
              setSelectedEndpoint('caja');
              handleTestEndpoint('caja');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedEndpoint === 'caja' ? 'bg-[#7C571C] text-white' : 'bg-[#FBEBE1] text-[#6F5A4B]'
            }`}
          >
            GET /api/v1/caja/balance
          </button>
          <button
            onClick={() => {
              setSelectedEndpoint('whatsapp');
              handleTestEndpoint('whatsapp');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedEndpoint === 'whatsapp' ? 'bg-[#7C571C] text-white' : 'bg-[#FBEBE1] text-[#6F5A4B]'
            }`}
          >
            GET /api/v1/whatsapp/status
          </button>
          <button
            onClick={() => {
              setSelectedEndpoint('clientes');
              handleTestEndpoint('clientes');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedEndpoint === 'clientes' ? 'bg-[#7C571C] text-white' : 'bg-[#FBEBE1] text-[#6F5A4B]'
            }`}
          >
            GET /api/v1/clientes/metricas
          </button>
        </div>

        {apiResponse && (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#6F5A4B]">Respuesta JSON Simulada:</span>
            <pre className="p-3.5 rounded-2xl bg-[#1c1c18] text-emerald-400 text-xs font-mono overflow-x-auto border border-[#3a2b20]">
              {apiResponse}
            </pre>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#DFCBB5]/80 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-[#221A14] font-['Plus_Jakarta_Sans',sans-serif]">
          Registro de Despachos WhatsApp Recientes ({history.length})
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-[#6F5A4B] italic">No hay registros de envíos de mensajes aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DFCBB5]/50 text-[#6F5A4B]">
                  <th className="pb-2 font-bold">Fecha / Hora</th>
                  <th className="pb-2 font-bold">Destinatario</th>
                  <th className="pb-2 font-bold">Cliente</th>
                  <th className="pb-2 font-bold">Mensaje</th>
                  <th className="pb-2 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFCBB5]/30">
                {history.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-[#FFF8F5]">
                    <td className="py-2 text-[#6F5A4B]">{item.fechaHora}</td>
                    <td className="py-2 font-mono font-semibold">{item.destinatario}</td>
                    <td className="py-2 text-[#221A14]">{item.clienteNombre}</td>
                    <td className="py-2 text-[#6F5A4B] max-w-xs truncate">{item.mensaje}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.estado === 'enviado'
                          ? 'bg-emerald-50 text-emerald-800'
                          : item.estado === 'simulado'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}>
                        {item.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
