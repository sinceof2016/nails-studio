/**
 * Helper para exportar datos a CSV compatible con Excel en español (BOM UTF-8, separador ;)
 */

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escapeCell = (cell: string | number | undefined | null): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = rows
    .map((row) => row.map(escapeCell).join(';'))
    .join('\r\n');

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
}
