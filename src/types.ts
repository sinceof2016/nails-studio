export interface ServiceCategory {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  durationMinutes: number;
  rating?: number;
  reviewsCount?: number;
  tag?: string;
  tagType?: 'top' | 'relax' | 'trend' | 'care';
  description: string;
  image?: string;
  steps?: string[];
  recommendedFor?: string;
}

export interface SpecialistPublic {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
  bio: string;
  certifications: string[];
  availableDays: string[];
  specialties: string[];
}

export interface SpecialistPrivate {
  commissionRate: number; // e.g. 50%
  phone?: string;
}

export interface Specialist extends SpecialistPublic {
  commissionRate?: number; // e.g. 50% (exclusivo para personal staff)
  phone?: string;
  telefono?: string;
}

export interface PolishSwatch {
  id: string;
  name: string;
  hex: string;
  accentHex?: string;
  finish: 'glazed' | 'creamy' | 'chrome' | 'pastel';
}

export interface NailShape {
  id: string;
  name: string;
  description: string;
}

export interface AddOnOption {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
}

export type PaymentMethod = 'efectivo' | 'nequi_daviplata' | 'tarjeta_datafono' | 'mixto';

export interface SlotLock {
  id?: string;
  appointmentId: string;
  slot: string;
  date: string;
  specialistId: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  serviceImage?: string;
  specialistId: string;
  specialistName: string;
  specialistRole: string;
  specialistAvatar?: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  notes?: string;
  polishColor?: string;
  nailShape?: string;
  selectedAddOns: string[];
  totalPrice: number;
  paymentMethod?: PaymentMethod;
  montoEfectivo?: number;
  montoDigital?: number;
  digitalMethod?: 'nequi_daviplata' | 'tarjeta_datafono';
  tipAmount?: number;
  status: 'confirmada' | 'en_preparacion' | 'completada' | 'cancelada';
  bookingCode: string;
  createdAt: string;
  notifiedViaWhatsApp?: boolean;
  branchId?: string;
  isGroupBooking?: boolean;
  groupGuestsCount?: number;
  autorizacionDatos?: boolean;
  autorizacionFecha?: string;
  autorizacionVersion?: string;
}

export interface SalonCutRecord {
  id: string;
  fecha: string;
  hora: string;
  clienteNombre: string;
  clienteTelefono: string;
  servicioNombre: string;
  servicioPrecio: number;
  especialistaId: string;
  especialistaNombre: string;
  comisionPorcentaje: number;
  comisionEspecialista: number;
  recaudoSalon: number;
  propina: number;
  metodoPago: PaymentMethod;
  montoEfectivo?: number;
  montoDigital?: number;
  digitalMethod?: 'nequi_daviplata' | 'tarjeta_datafono';
  sucursalId: string;
  nota?: string;
  appointmentId?: string;
}

export interface ExpenseRecord {
  id: string;
  fecha: string;
  concepto: string;
  categoria: 'insumos' | 'servicios' | 'mantenimiento' | 'caja_menor';
  monto: number;
  sucursalId: string;
  registradoPor: string;
}

export interface CashRegisterClose {
  id: string;
  fecha: string;
  hora: string;
  baseInicial: number;
  entradasEfectivo: number;
  entradasDigitales: number;
  egresosGastos: number;
  efectivoEsperado: number;
  efectivoContado: number;
  diferencia: number;
  estado: 'cuadrada' | 'descuadre';
  responsableNombre: string;
  sucursalId: string;
}

export interface ClientProfile {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  totalCitas: number;
  gastoTotal: number;
  primeraVisita: string;
  ultimaVisita: string;
  servicioFavorito: string;
  especialistaFavorita: string;
  clasificacion: 'VIP Frecuente' | 'Recurrente' | 'Nuevo';
  notasCuidado?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  role: 'SuperAdmin' | 'Administrador' | 'Caja';
  title: string;
  email: string;
  phone: string;
  branch: string;
  branchId: string;
  avatar: string;
  permissions: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  isUnread: boolean;
  type: 'promo' | 'reminder' | 'reward';
}

export interface SystemUser {
  id: string;
  nombre: string;
  email: string;
  rol: 'SuperAdmin' | 'Administrador' | 'Caja';
  sucursalAsignada: string;
  avatar?: string;
  creadoEn?: string;
  puedeVerApi?: boolean;
  puedeVerUsuarios?: boolean;
}

export type AppTab =
  | 'servicios'
  | 'reservar'
  | 'especialistas'
  | 'agenda'
  | 'cobro'
  | 'liquidaciones'
  | 'caja'
  | 'clientes'
  | 'usuarios'
  | 'api'
  | '404';

export interface SavedDesign {
  id: string;
  title: string;
  artist: string;
  image: string;
  tag: string;
}

export interface CookiePreferences {
  accepted: boolean;
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export interface CookieInfo {
  name: string;
  category: 'necessary' | 'preferences' | 'analytics' | 'marketing';
  purpose: string;
  provider: string;
  duration: string;
  type: 'HTTP Cookie' | 'LocalStorage' | 'Session';
}
