export function formatInvoiceId(type: string, id: number): string {
  const prefixMap: Record<string, string> = {
    'FACTURA': 'FAC',
    'COTACAO': 'COT',
    'VD': 'VD',
    'RECIBO': 'REC'
  };

  const prefix = prefixMap[type] || type.substring(0, 3).toUpperCase();
  const paddedId = id.toString().padStart(3, '0');

  return `${prefix}-${paddedId}`;
}
