/**
 * Claves de localStorage del catálogo en caché. Los valores no cambian: así no se pierde
 * el caché que ya tienen los navegadores de las personas que usan el sitio.
 */
export const STORAGE_KEYS = {
  services: 'aura_tarifas_2026_services',
  specialists: 'aura_tarifas_2026_specialists',
  categories: 'aura_tarifas_2026_categories'
} as const;
