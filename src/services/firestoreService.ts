import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Appointment,
  SalonCutRecord,
  ExpenseRecord,
  CashRegisterClose,
  SlotLock,
  AgendaBlock,
  Service,
  Specialist,
  SpecialistPublic,
  SpecialistPrivate,
  ServiceCategory,
  SystemUser
} from '../types';
import { BusinessConfig } from '../config/businessConfig';
import { getColombiaDateISO } from '../utils/dateAndId';
import { validateImageSize } from '../utils/imageCompressor';
import { getCoveredSlots, getOccupiedSlots } from '../utils/calendarAvailability';

const APPOINTMENTS_COLLECTION = 'appointments';
const SLOT_LOCKS_COLLECTION = 'slot_locks';
const AGENDA_BLOCKS_COLLECTION = 'agenda_blocks';
const CUTS_COLLECTION = 'salon_cuts';
const EXPENSES_COLLECTION = 'expenses';
const CLOSES_COLLECTION = 'cash_closes';
const SERVICES_COLLECTION = 'services';
const SPECIALISTS_COLLECTION = 'specialists';
const SPECIALISTS_PRIVATE_COLLECTION = 'specialists_private';
const CATEGORIES_COLLECTION = 'service_categories';
const SETTINGS_COLLECTION = 'settings';
const USERS_COLLECTION = 'users';

export function getSlotLockDocId(date: string, specialistId: string, time: string): string {
  const cleanSlot = time.replace(/[: ]/g, '-');
  return `${date}_${specialistId}_${cleanSlot}`;
}

export function getAppointmentLockIds(
  date: string,
  specialistId: string,
  time: string,
  durationMinutes: number = 60
): string[] {
  const slots = getCoveredSlots(time, durationMinutes) || getOccupiedSlots(time, durationMinutes);
  return slots.map((slot) => getSlotLockDocId(date, specialistId, slot));
}

// Subscribes to real-time slot locks (publicly readable to prevent double booking without personal data)
export function subscribeToSlotLocks(callback: (locks: SlotLock[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, SLOT_LOCKS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: SlotLock[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<SlotLock, 'id'>) });
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching slot locks:', error);
    }
  );
}

// Subscribes to real-time agenda blocks (publicly readable to reflect full-day blocks)
export function subscribeToAgendaBlocks(
  callback: (blocks: AgendaBlock[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, AGENDA_BLOCKS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AgendaBlock[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<AgendaBlock, 'id'>) });
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching Firestore agenda blocks:', error);
    }
  );
}

export async function addAgendaBlocksInFirestore(
  blocks: { specialistId: string; date: string }[]
): Promise<void> {
  if (!blocks || blocks.length === 0) return;
  const batch = writeBatch(db);
  const now = getColombiaDateISO();

  for (const block of blocks) {
    const blockId = `${block.date}_${block.specialistId}`;
    const docRef = doc(db, AGENDA_BLOCKS_COLLECTION, blockId);
    batch.set(docRef, {
      specialistId: block.specialistId,
      date: block.date,
      createdAt: now
    });
  }

  await batch.commit();
}

export async function deleteAgendaBlockInFirestore(blockId: string): Promise<void> {
  const docRef = doc(db, AGENDA_BLOCKS_COLLECTION, blockId);
  await deleteDoc(docRef);
}

// Subscribes to real-time appointments (exclusivo para staff, respeta snapshots vacíos)
export function subscribeToAppointments(
  callback: (appointments: Appointment[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, APPOINTMENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Appointment, 'id'>) });
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching Firestore appointments:', error);
    }
  );
}

// Guarda una cita atómicamente junto con todos los bloqueos de horario en slot_locks para impedir doble reserva
export async function saveAppointmentWithLockInFirestore(appointment: Appointment): Promise<void> {
  const aptDocRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);
  const duration = appointment.serviceDuration || 60;
  const slots = getCoveredSlots(appointment.time, duration) || getOccupiedSlots(appointment.time, duration);

  // Limpiar propiedades undefined y null para garantizar compatibilidad estricta con Firestore
  const cleanAppointment = Object.entries(appointment).reduce<Record<string, unknown>>((acc, [key, val]) => {
    if (val !== undefined && val !== null) {
      acc[key] = val;
    }
    return acc;
  }, {});

  const now = appointment.createdAt || getColombiaDateISO();
  const lockEntries = slots.map((slot) => {
    const lockId = getSlotLockDocId(appointment.date, appointment.specialistId, slot);
    const lockDocRef = doc(db, SLOT_LOCKS_COLLECTION, lockId);
    const lockData: SlotLock = {
      appointmentId: appointment.id,
      slot: slot,
      date: appointment.date,
      specialistId: appointment.specialistId,
      createdAt: now
    };
    return { lockDocRef, lockData, slot };
  });

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Verificar si alguno de los horarios ya está bloqueado
      for (const { lockDocRef, slot } of lockEntries) {
        const lockSnap = await transaction.get(lockDocRef);
        if (lockSnap.exists()) {
          throw new Error(`El horario de las ${slot} ya se encuentra ocupado con esta especialista.`);
        }
      }

      // 2. Escribir atómicamente todos los bloqueos y la nueva cita
      for (const { lockDocRef, lockData } of lockEntries) {
        transaction.set(lockDocRef, lockData);
      }
      transaction.set(aptDocRef, cleanAppointment);
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('ya se encuentra ocupado')) {
      throw error;
    }

    // Fallback de reintento directo si la transacción falló por concurrencia
    try {
      for (const { lockDocRef, lockData } of lockEntries) {
        await setDoc(lockDocRef, lockData);
      }
      await setDoc(aptDocRef, cleanAppointment);
    } catch {
      throw error;
    }
  }
}

// Update appointment status in Firestore
export async function updateAppointmentStatusInFirestore(
  appointmentId: string,
  newStatus: Appointment['status']
): Promise<void> {
  const docRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(docRef, { status: newStatus });
}

// Reactivate a cancelled appointment with slot locks in a single transaction
export async function reactivateAppointmentWithLockInFirestore(
  appointment: Appointment,
  newStatus: Appointment['status']
): Promise<void> {
  const duration = appointment.serviceDuration || 60;
  const slots = getCoveredSlots(appointment.time, duration) || getOccupiedSlots(appointment.time, duration);
  const aptDocRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);
  const now = getColombiaDateISO();

  const lockEntries = slots.map((slot) => {
    const lockId = getSlotLockDocId(appointment.date, appointment.specialistId, slot);
    const lockDocRef = doc(db, SLOT_LOCKS_COLLECTION, lockId);
    return { lockDocRef, slot };
  });

  await runTransaction(db, async (transaction) => {
    for (const { lockDocRef, slot } of lockEntries) {
      const lockSnap = await transaction.get(lockDocRef);
      if (lockSnap.exists()) {
        throw new Error(`El horario de las ${slot} con ${appointment.specialistName} ya se encuentra ocupado por otra cita.`);
      }
    }

    for (const { lockDocRef, slot } of lockEntries) {
      transaction.set(lockDocRef, {
        appointmentId: appointment.id,
        slot: slot,
        date: appointment.date,
        specialistId: appointment.specialistId,
        createdAt: now
      });
    }

    transaction.update(aptDocRef, { status: newStatus });
  });
}

// Cancels an appointment and releases all its slot locks in a single atomic transaction
export async function cancelAppointmentWithLockReleaseInFirestore(
  appointment: Appointment
): Promise<void> {
  const duration = appointment.serviceDuration || 60;
  const slots = getCoveredSlots(appointment.time, duration) || getOccupiedSlots(appointment.time, duration);
  const aptDocRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);

  const lockDocRefs = slots.map((slot) => {
    const lockId = getSlotLockDocId(appointment.date, appointment.specialistId, slot);
    return doc(db, SLOT_LOCKS_COLLECTION, lockId);
  });

  await runTransaction(db, async (transaction) => {
    for (const lockDocRef of lockDocRefs) {
      transaction.delete(lockDocRef);
    }
    transaction.update(aptDocRef, { status: 'cancelada' as const });
  });
}

// Delete appointment and all its slot locks in Firestore
export async function deleteAppointmentInFirestore(
  appointmentId: string,
  extra?: { date?: string; specialistId?: string; time?: string; serviceDuration?: number }
): Promise<void> {
  const aptDocRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);

  if (extra?.date && extra?.specialistId && extra?.time) {
    const duration = extra.serviceDuration || 60;
    const slots = getCoveredSlots(extra.time, duration) || getOccupiedSlots(extra.time, duration);
    const lockDocRefs = slots.map((slot) => {
      const lockId = getSlotLockDocId(extra.date!, extra.specialistId!, slot);
      return doc(db, SLOT_LOCKS_COLLECTION, lockId);
    });

    await runTransaction(db, async (transaction) => {
      for (const lockDocRef of lockDocRefs) {
        transaction.delete(lockDocRef);
      }
      transaction.delete(aptDocRef);
    });
  } else {
    await deleteDoc(aptDocRef);
  }
}

// =========================================================================
// REGISTROS DE CAJA Y FINANZAS (SALON CUTS, EXPENSES, CASH CLOSES)
// =========================================================================

export function subscribeToSalonCuts(
  callback: (cuts: SalonCutRecord[]) => void,
  branchId?: string,
  onError?: (error: unknown) => void
) {
  const isSpecificBranch = branchId && branchId !== 'todas';
  const q = isSpecificBranch
    ? query(collection(db, CUTS_COLLECTION), where('sucursalId', '==', branchId))
    : collection(db, CUTS_COLLECTION);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SalonCutRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<SalonCutRecord, 'id'>;
        if (!branchId || branchId === 'todas' || data.sucursalId === branchId) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching salon cuts:', error);
    }
  );
}

export async function addSalonCutToFirestore(cut: SalonCutRecord): Promise<void> {
  const docRef = doc(db, CUTS_COLLECTION, cut.id);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (docSnap.exists()) {
      throw new Error(`El cobro ${cut.id} ya existe en Firestore.`);
    }
    transaction.set(docRef, cut);
  });
}

export async function deleteSalonCutFromFirestore(cutId: string): Promise<void> {
  const docRef = doc(db, CUTS_COLLECTION, cutId);
  await deleteDoc(docRef);
}

export function subscribeToExpenses(
  callback: (expenses: ExpenseRecord[]) => void,
  branchId?: string,
  onError?: (error: unknown) => void
) {
  const isSpecificBranch = branchId && branchId !== 'todas';
  const q = isSpecificBranch
    ? query(collection(db, EXPENSES_COLLECTION), where('sucursalId', '==', branchId))
    : collection(db, EXPENSES_COLLECTION);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ExpenseRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<ExpenseRecord, 'id'>;
        if (!branchId || branchId === 'todas' || data.sucursalId === branchId) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching expenses:', error);
    }
  );
}

export async function addExpenseToFirestore(expense: ExpenseRecord): Promise<void> {
  const docRef = doc(db, EXPENSES_COLLECTION, expense.id);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (docSnap.exists()) {
      throw new Error(`El gasto ${expense.id} ya existe en Firestore.`);
    }
    transaction.set(docRef, expense);
  });
}

export function subscribeToCashCloses(
  callback: (closes: CashRegisterClose[]) => void,
  branchId?: string,
  onError?: (error: unknown) => void
) {
  const isSpecificBranch = branchId && branchId !== 'todas';
  const q = isSpecificBranch
    ? query(collection(db, CLOSES_COLLECTION), where('sucursalId', '==', branchId))
    : collection(db, CLOSES_COLLECTION);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CashRegisterClose[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<CashRegisterClose, 'id'>;
        if (!branchId || branchId === 'todas' || data.sucursalId === branchId) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching cash closes:', error);
    }
  );
}

export async function addCashCloseToFirestore(close: CashRegisterClose): Promise<void> {
  const docRef = doc(db, CLOSES_COLLECTION, close.id);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (docSnap.exists()) {
      throw new Error(`El cierre ${close.id} ya existe en Firestore.`);
    }
    transaction.set(docRef, close);
  });
}

// =========================================================================
// SERVICIOS (CATÁLOGO PÚBLICO)
// =========================================================================

export function subscribeToServices(
  callback: (services: Service[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, SERVICES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Service[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Service, 'id'>) }));
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching live services from Firestore:', error);
    }
  );
}

export async function saveServiceInFirestore(service: Service): Promise<void> {
  if (service.image) {
    const sizeCheck = validateImageSize(service.image);
    if (!sizeCheck.isValid) {
      throw new Error(sizeCheck.error || 'La imagen excede el límite permitido de 150 KB.');
    }
  }

  const docRef = doc(db, SERVICES_COLLECTION, service.id);
  const cleanData: Record<string, unknown> = {
    id: service.id,
    name: service.name,
    category: service.category,
    categoryLabel: service.categoryLabel || '',
    price: Number(service.price) || 0,
    durationMinutes: Number(service.durationMinutes) || 30,
    rating: typeof service.rating === 'number' ? service.rating : 5,
    reviewsCount: typeof service.reviewsCount === 'number' ? service.reviewsCount : 0,
    description: service.description || '',
    steps: Array.isArray(service.steps) ? service.steps.slice(0, 20) : []
  };

  if (service.tag) cleanData.tag = String(service.tag).slice(0, 40);
  if (service.tagType) cleanData.tagType = service.tagType;
  if (service.image) cleanData.image = service.image;
  if (service.recommendedFor) cleanData.recommendedFor = String(service.recommendedFor).slice(0, 300);

  await setDoc(docRef, cleanData);
}

export async function deleteServiceInFirestore(serviceId: string): Promise<void> {
  const docRef = doc(db, SERVICES_COLLECTION, serviceId);
  await deleteDoc(docRef);
}

// =========================================================================
// ESPECIALISTAS (SEPARACIÓN ESTRICTA: PÚBLICA / PRIVADA)
// =========================================================================

export function subscribeToSpecialists(
  callback: (specialists: SpecialistPublic[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, SPECIALISTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: SpecialistPublic[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as SpecialistPublic;
        list.push({
          id: d.id,
          name: data.name || '',
          role: data.role || 'Especialista',
          rating: typeof data.rating === 'number' ? data.rating : 5,
          reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 0,
          avatar: data.avatar || '',
          bio: data.bio || '',
          certifications: Array.isArray(data.certifications) ? data.certifications : [],
          availableDays: Array.isArray(data.availableDays) ? data.availableDays : [],
          specialties: Array.isArray(data.specialties) ? data.specialties : []
        });
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching live specialists from Firestore:', error);
    }
  );
}

export function subscribeToSpecialistsPrivate(
  callback: (privateMap: Record<string, SpecialistPrivate>) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, SPECIALISTS_PRIVATE_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const map: Record<string, SpecialistPrivate> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          commissionRate: typeof data.commissionRate === 'number' ? data.commissionRate : 50,
          phone: data.phone || ''
        };
      });
      callback(map);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching private specialists data:', error);
    }
  );
}

/**
 * Guarda una especialista en lote atómico:
 * - specialists/{id}: SOLO campos públicos (sin comisión ni teléfono)
 * - specialists_private/{id}: SOLO campos privados (phone, commissionRate)
 */
export async function saveSpecialistInFirestore(specialist: Specialist): Promise<void> {
  if (specialist.avatar) {
    const sizeCheck = validateImageSize(specialist.avatar);
    if (!sizeCheck.isValid) {
      throw new Error(sizeCheck.error || 'El avatar excede el límite permitido de 150 KB.');
    }
  }

  const batch = writeBatch(db);
  const publicDocRef = doc(db, SPECIALISTS_COLLECTION, specialist.id);
  const privateDocRef = doc(db, SPECIALISTS_PRIVATE_COLLECTION, specialist.id);

  // Parte PÚBLICA (Regla isValidSpecialist: sin comisión ni teléfono)
  const publicData: Record<string, unknown> = {
    id: specialist.id,
    name: specialist.name,
    role: specialist.role || 'Especialista',
    rating: typeof specialist.rating === 'number' ? specialist.rating : 5,
    reviewsCount: typeof specialist.reviewsCount === 'number' ? specialist.reviewsCount : 0,
    avatar: specialist.avatar || '',
    bio: specialist.bio || '',
    certifications: Array.isArray(specialist.certifications) ? specialist.certifications.slice(0, 20) : [],
    availableDays: Array.isArray(specialist.availableDays) ? specialist.availableDays.slice(0, 7) : [],
    specialties: Array.isArray(specialist.specialties) ? specialist.specialties.slice(0, 20) : []
  };

  // Parte PRIVADA (Regla isValidSpecialistPrivate: solo phone y commissionRate)
  const commRate = typeof specialist.commissionRate === 'number' && !isNaN(specialist.commissionRate)
    ? Math.max(0, Math.min(100, specialist.commissionRate))
    : 50;
  const phone = specialist.phone || specialist.telefono || '';

  const privateData: Record<string, unknown> = {
    commissionRate: commRate
  };
  if (phone) {
    privateData.phone = String(phone).slice(0, 30);
  }

  batch.set(publicDocRef, publicData);
  batch.set(privateDocRef, privateData);

  await batch.commit();
}

/**
 * Elimina una especialista borrando atómicamente la parte pública y privada
 */
export async function deleteSpecialistInFirestore(specialistId: string): Promise<void> {
  const batch = writeBatch(db);
  const publicDocRef = doc(db, SPECIALISTS_COLLECTION, specialistId);
  const privateDocRef = doc(db, SPECIALISTS_PRIVATE_COLLECTION, specialistId);

  batch.delete(publicDocRef);
  batch.delete(privateDocRef);

  await batch.commit();
}

// =========================================================================
// CATEGORÍAS DE SERVICIOS
// =========================================================================

export function subscribeToCategories(
  callback: (categories: ServiceCategory[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ServiceCategory[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ServiceCategory, 'id'>) }));
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching live categories from Firestore:', error);
    }
  );
}

export async function saveCategoryInFirestore(category: ServiceCategory): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, category.id);
  const cleanData: Record<string, unknown> = {
    id: category.id,
    label: category.label
  };
  if (category.icon) cleanData.icon = String(category.icon).slice(0, 40);
  if (category.description) cleanData.description = String(category.description).slice(0, 200);

  await setDoc(docRef, cleanData);
}

export async function deleteCategoryInFirestore(categoryId: string): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
  await deleteDoc(docRef);
}

// =========================================================================
// DATOS DEL NEGOCIO (settings/negocio)
// =========================================================================

export function subscribeToBusinessConfig(
  callback: (config: BusinessConfig | null) => void,
  onError?: (error: unknown) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, 'negocio');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as BusinessConfig);
      } else {
        callback(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching business settings:', error);
    }
  );
}

export async function saveBusinessConfigInFirestore(config: BusinessConfig): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, 'negocio');
  const cleanData: Record<string, unknown> = {
    businessName: String(config.businessName || '').slice(0, 200),
    brandName: String(config.brandName || '').slice(0, 100),
    nit: String(config.nit || '').slice(0, 40),
    representanteLegal: String(config.representanteLegal || '').slice(0, 120),
    address: String(config.address || '').slice(0, 250),
    city: String(config.city || '').slice(0, 80),
    country: String(config.country || '').slice(0, 80),
    phone: String(config.phone || '').slice(0, 30),
    phoneFormatted: String(config.phoneFormatted || '').slice(0, 40),
    whatsapp: String(config.whatsapp || '').slice(0, 30),
    whatsappFormatted: String(config.whatsappFormatted || '').slice(0, 40),
    email: String(config.email || '').slice(0, 120),
    privacyEmail: String(config.privacyEmail || '').slice(0, 120),
    branchName: String(config.branchName || '').slice(0, 100),
    bookingCodePrefix: String(config.bookingCodePrefix || 'PELU').slice(0, 10),
    taxNotice: String(config.taxNotice || '').slice(0, 300),
    cancellationNoticeHours: Number(config.cancellationNoticeHours) || 24,
    advancePaymentRequired: Boolean(config.advancePaymentRequired),
    dataPolicyVersion: String(config.dataPolicyVersion || 'v1.0-2026').slice(0, 40),
    privacyNoticeVersion: String(config.privacyNoticeVersion || 'v1.0-2026').slice(0, 40),
    termsVersion: String(config.termsVersion || 'v1.0-2026').slice(0, 40),
    cancellationPolicyVersion: String(config.cancellationPolicyVersion || 'v1.0-2026').slice(0, 40)
  };

  await setDoc(docRef, cleanData);
}

// =========================================================================
// USUARIOS DEL PERSONAL (users/{uid})
// =========================================================================

export function subscribeToUsers(
  callback: (users: SystemUser[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: SystemUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          nombre: data.nombre || data.name || 'Personal',
          email: data.email || '',
          rol: data.rol || data.role || 'Caja',
          sucursalAsignada: data.sucursalAsignada || data.branchId || 'santuario-patio-bonito',
          avatar: data.avatar || undefined,
          creadoEn: data.creadoEn || data.createdAt || new Date().toISOString(),
          puedeVerApi: Boolean(data.puedeVerApi || data.rol === 'SuperAdmin'),
          puedeVerUsuarios: Boolean(data.puedeVerUsuarios || data.rol === 'SuperAdmin')
        });
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching system users:', error);
    }
  );
}

export async function saveUserInFirestore(user: SystemUser): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, user.id);
  const cleanData: Record<string, unknown> = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    sucursalAsignada: user.sucursalAsignada || 'santuario-patio-bonito',
    creadoEn: user.creadoEn || new Date().toISOString(),
    puedeVerApi: Boolean(user.puedeVerApi),
    puedeVerUsuarios: Boolean(user.puedeVerUsuarios)
  };
  if (user.avatar) {
    cleanData.avatar = user.avatar;
  }
  await setDoc(docRef, cleanData);
}

export async function deleteUserInFirestore(userId: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(docRef);
}

// =========================================================================
// VERIFICACIÓN Y CARGA EXPLÍCITA DEL CATÁLOGO INICIAL (SOLO SUPERADMIN)
// =========================================================================

export async function checkIfCatalogEmpty(): Promise<boolean> {
  try {
    const srvSnap = await getDocs(collection(db, SERVICES_COLLECTION));
    const specSnap = await getDocs(collection(db, SPECIALISTS_COLLECTION));
    const catSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    return srvSnap.empty && specSnap.empty && catSnap.empty;
  } catch {
    return false;
  }
}

/**
 * Carga explícita del catálogo inicial ejecutada únicamente por el SuperAdmin
 * mediante el botón en el panel de gestión. Comprueba que cada documento no exista antes
 * de escribirlo para no pisar ediciones previas.
 */
export async function bootstrapInitialCatalog(
  defaultServices: Service[],
  defaultSpecialists: Specialist[],
  defaultCategories: ServiceCategory[],
  onProgress?: (msg: string) => void
): Promise<{ successCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];

  // 1. Categorías
  for (const cat of defaultCategories) {
    try {
      const snap = await getDoc(doc(db, CATEGORIES_COLLECTION, cat.id));
      if (!snap.exists()) {
        await saveCategoryInFirestore(cat);
        successCount++;
        onProgress?.(`Tipo de servicio "${cat.label}" cargado.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Error en categoría ${cat.id}: ${msg}`);
    }
  }

  // 2. Especialistas (con parte privada)
  for (const spec of defaultSpecialists) {
    try {
      const snap = await getDoc(doc(db, SPECIALISTS_COLLECTION, spec.id));
      if (!snap.exists()) {
        await saveSpecialistInFirestore(spec);
        successCount++;
        onProgress?.(`Especialista "${spec.name}" cargada.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Error en especialista ${spec.id}: ${msg}`);
    }
  }

  // 3. Servicios
  for (const srv of defaultServices) {
    try {
      const snap = await getDoc(doc(db, SERVICES_COLLECTION, srv.id));
      if (!snap.exists()) {
        await saveServiceInFirestore(srv);
        successCount++;
        onProgress?.(`Servicio "${srv.name}" cargado.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Error en servicio ${srv.id}: ${msg}`);
    }
  }

  return { successCount, errors };
}

