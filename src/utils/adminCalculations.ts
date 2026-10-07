import type {
  Appointment,
  SalonCutRecord,
  ExpenseRecord,
  Specialist,
  ClientProfile
} from '../types';
import type { SpecialistLiquidationItem } from '../components/admin/tabs/AdminCortesTab';

/**
 * Estadísticas de agenda por estado de cita
 */
export function getAgendaStats(appointments: Appointment[]) {
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmada').length;
  const inPrepCount = appointments.filter((a) => a.status === 'en_preparacion').length;
  const completedCount = appointments.filter((a) => a.status === 'completada').length;
  const canceledCount = appointments.filter((a) => a.status === 'cancelada').length;

  return {
    totalCount,
    confirmedCount,
    inPrepCount,
    completedCount,
    canceledCount
  };
}

/**
 * Filtrar cobros por la fecha seleccionada
 */
export function filterCutsByDate(cuts: SalonCutRecord[], selectedDate: string): SalonCutRecord[] {
  return cuts.filter((c) => !c.fecha || c.fecha === selectedDate);
}

/**
 * Filtrar gastos por la fecha seleccionada
 */
export function filterExpensesByDate(expenses: ExpenseRecord[], selectedDate: string): ExpenseRecord[] {
  return expenses.filter((e) => !e.fecha || e.fecha === selectedDate);
}

/**
 * Cálculo del total de ingresos en efectivo del día
 */
export function calculateCashIncome(dayCuts: SalonCutRecord[]): number {
  return dayCuts.reduce((acc, curr) => {
    if (curr.metodoPago === 'efectivo') {
      return acc + curr.servicioPrecio + curr.propina;
    } else if (curr.metodoPago === 'mixto' && curr.montoEfectivo !== undefined) {
      return acc + curr.montoEfectivo;
    }
    return acc;
  }, 0);
}

/**
 * Cálculo del total de ingresos digitales del día
 */
export function calculateDigitalIncome(dayCuts: SalonCutRecord[]): number {
  return dayCuts.reduce((acc, curr) => {
    if (curr.metodoPago === 'nequi_daviplata' || curr.metodoPago === 'tarjeta_datafono') {
      return acc + curr.servicioPrecio + curr.propina;
    } else if (curr.metodoPago === 'mixto' && curr.montoDigital !== undefined) {
      return acc + curr.montoDigital;
    }
    return acc;
  }, 0);
}

/**
 * Cálculo del total de gastos del día
 */
export function calculateTotalExpenses(dayExpenses: ExpenseRecord[]): number {
  return dayExpenses.reduce((acc, curr) => acc + curr.monto, 0);
}

/**
 * Desglose de liquidación por especialista para la fecha seleccionada
 */
export function calculateSpecialistsLiquidation(
  specialists: Specialist[],
  dayCuts: SalonCutRecord[]
): SpecialistLiquidationItem[] {
  return specialists.map((spec) => {
    const specCuts = dayCuts.filter((c) => c.especialistaId === spec.id);
    const totalServices = specCuts.reduce((acc, c) => acc + c.servicioPrecio, 0);
    const totalCommission = specCuts.reduce((acc, c) => acc + c.comisionEspecialista, 0);
    const totalTips = specCuts.reduce((acc, c) => acc + c.propina, 0);
    return {
      id: spec.id,
      name: spec.name,
      role: spec.role,
      avatar: spec.avatar,
      phone: spec.phone,
      telefono: spec.telefono,
      commissionRate: spec.commissionRate ?? 50,
      cutsCount: specCuts.length,
      totalServices,
      totalCommission,
      totalTips,
      payoutTotal: totalCommission + totalTips
    };
  });
}

/**
 * Base de clientes sintetizada con normalización segura
 */
export function calculateClientProfiles(appointments: Appointment[]): ClientProfile[] {
  const map = new Map<string, ClientProfile>();

  appointments.forEach((apt) => {
    const cleanPhone = (apt.clientPhone || '').replace(/\D/g, '').slice(-10);
    const key = cleanPhone || (apt.clientName || 'Cliente').toLowerCase().trim();

    if (!map.has(key)) {
      map.set(key, {
        id: `client-${key}`,
        nombre: apt.clientName || 'Clienta Anónima',
        telefono: apt.clientPhone || '',
        email: apt.clientEmail || '',
        totalCitas: 1,
        gastoTotal: apt.totalPrice ?? 0,
        primeraVisita: apt.date || 'Reciente',
        ultimaVisita: apt.date || 'Reciente',
        servicioFavorito: apt.serviceName || 'Manicura Rusa',
        especialistaFavorita: apt.specialistName || 'Valentina R.',
        clasificacion: 'Nuevo',
        notasCuidado: apt.notes
      });
    } else {
      const item = map.get(key)!;
      item.totalCitas += 1;
      item.gastoTotal += apt.totalPrice ?? 0;
      item.ultimaVisita = apt.date || item.ultimaVisita;
      item.clasificacion = item.totalCitas >= 3 ? 'VIP Frecuente' : 'Recurrente';
    }
  });

  return Array.from(map.values());
}
