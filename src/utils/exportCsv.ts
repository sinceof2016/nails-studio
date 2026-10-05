/**
 * Helper para exportar datos a CSV compatible con Excel en español (BOM UTF-8, separador ;)
 * Protegido contra CSV Formula Injection (Inyección de Fórmulas en Excel / LibreOffice).
 */

export function escapeCell(cell: string | number | undefined | null): string {
  if (cell === null || cell === undefined) return '""';
  // Los números (type number) no se tocan; solo las cadenas
  if (typeof cell === 'number') {
    return `"${cell}"`;
  }
  let str = String(cell);
  // Mitigación de Inyección de Fórmulas CSV:
  // Si el texto empieza con =, +, -, @, tab (\t) o retorno de carro (\r),
  // anteponer una comilla simple ' antes de entrecomillar.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function formatCsvContent(rows: (string | number | undefined | null)[][]): string {
  return rows
    .map((row) => row.map(escapeCell).join(';'))
    .join('\r\n');
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csvContent = formatCsvContent(rows);

  if (typeof document === 'undefined') {
    return csvContent;
  }

  // \uFEFF es el Byte Order Mark (BOM) para que Excel detecte codificación UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return csvContent;
}
