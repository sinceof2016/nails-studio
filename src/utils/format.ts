/**
 * Formateador de precios en Pesos Colombianos (COP)
 * Ejemplo: 95000 -> "$ 95.000 COP"
 */
export function formatCOP(amount: number | undefined | null, includeSymbol: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$ 0 COP';
  }
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return includeSymbol ? `$ ${formatted} COP` : `$ ${formatted}`;
}

export function formatNumberCOP(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
