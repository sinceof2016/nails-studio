import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Appointment, SalonCutRecord, ExpenseRecord, CashRegisterClose } from '../types';
import { INITIAL_APPOINTMENTS } from '../data/mockData';

const APPOINTMENTS_COLLECTION = 'appointments';
const CUTS_COLLECTION = 'salon_cuts';
const EXPENSES_COLLECTION = 'expenses';
const CLOSES_COLLECTION = 'cash_closes';

// Subscribes to real-time appointments
export function subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
  const colRef = collection(db, APPOINTMENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        callback(INITIAL_APPOINTMENTS);
      } else {
        const list: Appointment[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Appointment, 'id'>) });
        });
        callback(list);
      }
    },
    (error) => {
      console.warn('Error fetching Firestore appointments, using local state:', error);
    }
  );
}

// Save or create appointment in Firestore
export async function saveAppointmentToFirestore(appointment: Appointment): Promise<void> {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);
    await setDoc(docRef, appointment, { merge: true });
  } catch (error) {
    console.error('Error saving appointment to Firestore:', error);
  }
}

// Update appointment status in Firestore
export async function updateAppointmentStatusInFirestore(
  appointmentId: string,
  newStatus: Appointment['status']
): Promise<void> {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    await updateDoc(docRef, { status: newStatus });
  } catch (error) {
    console.error('Error updating status in Firestore:', error);
  }
}

// Delete appointment in Firestore
export async function deleteAppointmentInFirestore(appointmentId: string): Promise<void> {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting appointment in Firestore:', error);
  }
}

// Salon cuts ledger
export function subscribeToSalonCuts(callback: (cuts: SalonCutRecord[]) => void) {
  const colRef = collection(db, CUTS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const list: SalonCutRecord[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<SalonCutRecord, 'id'>) }));
    callback(list);
  });
}

export async function addSalonCutToFirestore(cut: SalonCutRecord): Promise<void> {
  const docRef = doc(db, CUTS_COLLECTION, cut.id);
  await setDoc(docRef, cut);
}

// Expenses
export function subscribeToExpenses(callback: (expenses: ExpenseRecord[]) => void) {
  const colRef = collection(db, EXPENSES_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const list: ExpenseRecord[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ExpenseRecord, 'id'>) }));
    callback(list);
  });
}

export async function addExpenseToFirestore(expense: ExpenseRecord): Promise<void> {
  const docRef = doc(db, EXPENSES_COLLECTION, expense.id);
  await setDoc(docRef, expense);
}

// Cash Closes (Arqueos)
export function subscribeToCashCloses(callback: (closes: CashRegisterClose[]) => void) {
  const colRef = collection(db, CLOSES_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const list: CashRegisterClose[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<CashRegisterClose, 'id'>) }));
    callback(list);
  });
}

export async function addCashCloseToFirestore(close: CashRegisterClose): Promise<void> {
  const docRef = doc(db, CLOSES_COLLECTION, close.id);
  await setDoc(docRef, close);
}
