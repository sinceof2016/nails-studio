/**
 * Agrega un elemento al inicio de la lista solo si todavía no existe uno con el mismo id.
 * Evita duplicados cuando el registro llega dos veces: una por la escritura local y otra por
 * la suscripción en tiempo real de Firestore.
 */
export function addUnique<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((existing) => existing.id === item.id) ? list : [item, ...list];
}
