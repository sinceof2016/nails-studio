import type { Dispatch, SetStateAction } from 'react';
import type {
  Appointment,
  SalonCutRecord,
  ExpenseRecord,
  CashRegisterClose,
  SystemUser
} from '../types';
import { addUnique } from '../utils/collections';
import {
  saveAppointmentWithLockInFirestore,
  updateAppointmentStatusInFirestore,
  reactivateAppointmentWithLockInFirestore,
  cancelAppointmentWithLockReleaseInFirestore,
  deleteAppointmentInFirestore,
  addAgendaBlocksInFirestore,
  deleteAgendaBlockInFirestore,
  addSalonCutToFirestore,
  deleteSalonCutFromFirestore,
  addExpenseToFirestore,
  addCashCloseToFirestore
} from '../services/firestoreService';

export interface UseOperationsActionsParams {
  appointments: Appointment[];
  setAppointments: Dispatch<SetStateAction<Appointment[]>>;
  setCuts: Dispatch<SetStateAction<SalonCutRecord[]>>;
  setExpenses: Dispatch<SetStateAction<ExpenseRecord[]>>;
  setCashCloses: Dispatch<SetStateAction<CashRegisterClose[]>>;
  currentUser?: SystemUser | null;
  showToast: (message: string) => void;
}

export function useOperationsActions({
  appointments,
  setAppointments,
  setCuts,
  setExpenses,
  setCashCloses,
  showToast
}: UseOperationsActionsParams) {
  const handleAddExpressAppointment = async (newAppointment: Appointment) => {
    await saveAppointmentWithLockInFirestore(newAppointment);
    setAppointments((prev) => addUnique(prev, newAppointment));
    showToast(`¡Turno express ${newAppointment.bookingCode} guardado en Firestore!`);
  };

  const handleUpdateStatus = async (id: string, newStatus: Appointment['status']) => {
    const previous = appointments.find((a) => a.id === id);
    if (!previous || previous.status === newStatus) return;

    if (newStatus === 'cancelada') {
      try {
        await cancelAppointmentWithLockReleaseInFirestore(previous);
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'cancelada' as const } : a))
        );
        showToast('Cita cancelada y horario liberado.');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al cancelar la cita en Firestore.';
        showToast(`⚠ Error: ${msg}`);
      }
      return;
    }

    if (previous.status === 'cancelada' && (newStatus === 'confirmada' || newStatus === 'en_preparacion')) {
      try {
        await reactivateAppointmentWithLockInFirestore(previous, newStatus);
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
        showToast(`✓ Cita reactivada con éxito. Horario bloqueado. Estado: ${newStatus === 'en_preparacion' ? 'En Cabina' : 'Confirmada'}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al reactivar la cita en Firestore.';
        showToast(`⚠ ${msg}`);
      }
      return;
    }

    try {
      await updateAppointmentStatusInFirestore(id, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      showToast(`✓ Estado actualizado: ${newStatus === 'en_preparacion' ? 'En Cabina' : newStatus === 'completada' ? 'Completada' : newStatus}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar estado en Firestore.';
      showToast(`⚠ Error: ${msg}`);
    }
  };

  const handleDeleteAppointment = async (
    id: string,
    extra?: { date?: string; specialistId?: string; time?: string; serviceDuration?: number }
  ) => {
    const previous = appointments.find((a) => a.id === id);
    const date = extra?.date || previous?.date;
    const specialistId = extra?.specialistId || previous?.specialistId;
    const time = extra?.time || previous?.time;
    const serviceDuration = extra?.serviceDuration ?? previous?.serviceDuration;

    try {
      await deleteAppointmentInFirestore(id, { date, specialistId, time, serviceDuration });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      showToast('Cita eliminada permanentemente y horario liberado.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar cita en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleAddAgendaBlocks = async (specialistIds: string[], dates: string[]) => {
    try {
      const total = await addAgendaBlocksInFirestore(specialistIds, dates);
      showToast(`✓ Agenda bloqueada: ${total} ${total === 1 ? 'día' : 'días'}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al bloquear la agenda.';
      showToast(`⚠ No se pudo bloquear la agenda: ${msg}`);
      throw error;
    }
  };

  const handleRemoveAgendaBlock = async (blockId: string) => {
    try {
      await deleteAgendaBlockInFirestore(blockId);
      showToast('✓ Agenda desbloqueada.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al desbloquear la agenda.';
      showToast(`⚠ No se pudo desbloquear la agenda: ${msg}`);
      throw error;
    }
  };

  const handleRegisterCut = async (cut: SalonCutRecord) => {
    try {
      await addSalonCutToFirestore(cut);
      setCuts((prev) => addUnique(prev, cut));
      showToast(`Cobro de ${cut.clienteNombre} registrado en caja.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrar el cobro en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleDeleteCut = async (cutId: string) => {
    try {
      await deleteSalonCutFromFirestore(cutId);
      setCuts((prev) => prev.filter((c) => c.id !== cutId));
      showToast('✓ Cobro anulado exitosamente.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al anular el cobro en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleAddExpense = async (expense: ExpenseRecord) => {
    try {
      await addExpenseToFirestore(expense);
      setExpenses((prev) => addUnique(prev, expense));
      showToast(`Gasto registrado en caja menor.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al registrar el gasto en Firestore.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  const handleSaveCashClose = async (close: CashRegisterClose) => {
    try {
      await addCashCloseToFirestore(close);
      setCashCloses((prev) => addUnique(prev, close));
      showToast(`Arqueo de caja del día guardado en Firestore.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el arqueo de caja.';
      showToast(`⚠ Error: ${msg}`);
      throw error;
    }
  };

  return {
    handleAddExpressAppointment,
    handleUpdateStatus,
    handleDeleteAppointment,
    handleAddAgendaBlocks,
    handleRemoveAgendaBlock,
    handleRegisterCut,
    handleDeleteCut,
    handleAddExpense,
    handleSaveCashClose
  };
}
