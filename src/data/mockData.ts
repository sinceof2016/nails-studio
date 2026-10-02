export * from './catalogo';
import { SystemUser, Appointment, AppNotification, SavedDesign } from '../types';

/**
 * Colecciones iniciales vacías para producción (datos limpios en cero).
 */
export const SYSTEM_USERS: SystemUser[] = [];
export const NOTIFICATIONS: AppNotification[] = [];
export const SAVED_DESIGNS: SavedDesign[] = [];
