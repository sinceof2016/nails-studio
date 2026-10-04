import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Appointment, SalonCutRecord, ExpenseRecord, CashRegisterClose, SlotLock } from '../types';
import { getColombiaDateISO } from '../utils/dateAndId';

const APPOINTMENTS_COLLECTION = 'appointments';
const SLOT_LOCKS_COLLECTION = 'slot_locks';
const CUTS_COLLECTION = 'salon_cuts';
const EXPENSES_COLLECTION = 'expenses';
const CLOSES_COLLECTION = 'cash_closes';

export function getSlotLockDocId(date: string, specialistId: string, time: string): string {
  const cleanSlot = time.replace(/[: ]/g, '-');
  return `${date}_${specialistId}_${cleanSlot}`;
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

// Save or create appointment in Firestore
export async function saveAppointmentToFirestore(appointment: Appointment): Promise<void> {
  const docRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);
  await setDoc(docRef, appointment, { merge: true });
}

// Guarda una cita atómicamente junto con un bloqueo de horario en slot_locks para impedir doble reserva
export async function saveAppointmentWithLockInFirestore(appointment: Appointment): Promise<void> {
  const aptDocRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);
  const lockId = getSlotLockDocId(appointment.date, appointment.specialistId, appointment.time);
  const lockDocRef = doc(db, SLOT_LOCKS_COLLECTION, lockId);

  // Limpiar propiedades undefined y null para garantizar compatibilidad estricta con Firestore
  const cleanAppointment = Object.entries(appointment).reduce<Record<string, unknown>>((acc, [key, val]) => {
    if (val !== undefined && val !== null) {
      acc[key] = val;
    }
    return acc;
  }, {});

  const lockData: SlotLock = {
    appointmentId: appointment.id,
    slot: appointment.time,
    date: appointment.date,
    specialistId: appointment.specialistId,
    createdAt: appointment.createdAt || getColombiaDateISO()
  };

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Verificar si el horario ya está bloqueado (lectura pública permitida en slot_locks)
      const lockSnap = await transaction.get(lockDocRef);
      if (lockSnap.exists()) {
        throw new Error(`El horario de las ${appointment.time} ya se encuentra ocupado con esta especialista.`);
      }

      // 2. Escribir atómicamente el bloqueo y la nueva cita
      transaction.set(lockDocRef, lockData);
      transaction.set(aptDocRef, cleanAppointment);
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('ya se encuentra ocupado')) {
      throw error;
    }

    // Si falló por concurrencia o contención en transacción, intentar persistencia directa segura
    try {
      await setDoc(lockDocRef, lockData);
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

// Reactivate a cancelled appointment with slot lock in a single transaction
export async function reactivateAppointmentWithLockInFirestore(
  appointment: Appointment,
  newStatus: Appointment['status']
): Promise<void> {
  const lockId = getSlotLockDocId(appointment.date, appointment.specialistId, appointment.time);
  const lockDocRef = doc(db, SLOT_LOCKS_COLLECTION, lockId);
  const aptDocRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);

  await runTransaction(db, async (transaction) => {
    const lockSnap = await transaction.get(lockDocRef);
    if (lockSnap.exists()) {
      throw new Error(`El horario de las ${appointment.time} con ${appointment.specialistName} ya se encuentra ocupado por otra cita.`);
    }

    const aptSnap = await transaction.get(aptDocRef);
    if (!aptSnap.exists()) {
      throw new Error(`La cita con ID ${appointment.id} no existe en Firestore.`);
    }

    const lockData: SlotLock = {
      appointmentId: appointment.id,
      slot: appointment.time,
      date: appointment.date,
      specialistId: appointment.specialistId,
      createdAt: getColombiaDateISO()
    };

    transaction.set(lockDocRef, lockData);
    transaction.update(aptDocRef, { status: newStatus });
  });
}

// Cancel appointment and release its lock in a single atomic transaction
export async function cancelAppointmentWithLockReleaseInFirestore(
  appointment: Appointment
): Promise<void> {
  const lockId = getSlotLockDocId(appointment.date, appointment.specialistId, appointment.time);
  const lockDocRef = doc(db, SLOT_LOCKS_COLLECTION, lockId);
  const aptDocRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);

  await runTransaction(db, async (transaction) => {
    transaction.update(aptDocRef, { status: 'cancelada' });
    transaction.delete(lockDocRef);
  });
}

// Delete appointment in Firestore (y libera su bloqueo de horario si existe)
export async function deleteAppointmentInFirestore(
  appointmentId: string,
  extra?: { date?: string; specialistId?: string; time?: string }
): Promise<void> {
  const docRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await deleteDoc(docRef);

  if (extra?.date && extra?.specialistId && extra?.time) {
    const lockId = getSlotLockDocId(extra.date, extra.specialistId, extra.time);
    try {
      await deleteDoc(doc(db, SLOT_LOCKS_COLLECTION, lockId));
    } catch {
      // Ignorar si el bloqueo ya fue eliminado
    }
  }
}

// Salon cuts ledger (soporta filtro por sede para cajeros y callback de error)
export function subscribeToSalonCuts(
  callback: (cuts: SalonCutRecord[]) => void,
  branchId?: string,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, CUTS_COLLECTION);
  const q = branchId && branchId !== 'todas'
    ? query(colRef, where('sucursalId', '==', branchId))
    : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SalonCutRecord[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<SalonCutRecord, 'id'>) }));
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn('Error fetching cuts:', error);
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

// Expenses (soporta filtro por sede para cajeros y callback de error)
export function subscribeToExpenses(
  callback: (expenses: ExpenseRecord[]) => void,
  branchId?: string,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, EXPENSES_COLLECTION);
  const q = branchId && branchId !== 'todas'
    ? query(colRef, where('sucursalId', '==', branchId))
    : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ExpenseRecord[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ExpenseRecord, 'id'>) }));
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

// Cash Closes (Arqueos - soporta filtro por sede para cajeros y callback de error)
export function subscribeToCashCloses(
  callback: (closes: CashRegisterClose[]) => void,
  branchId?: string,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, CLOSES_COLLECTION);
  const q = branchId && branchId !== 'todas'
    ? query(colRef, where('sucursalId', '==', branchId))
    : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CashRegisterClose[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<CashRegisterClose, 'id'>) }));
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
