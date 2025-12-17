import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

export async function exportToExcel(data: any[], sheetName: string, fileName: string, exportType: 'JOURNAL' | 'SALES_MAP', settings: any) {
  const wb = XLSX.utils.book_new();

  // Group data by month
  const groupedData: { [key: string]: any[] } = {};

  const taxRate = (settings?.tax_percentage || 16) / 100;

  data.forEach(entry => {
    const date = new Date(entry.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groupedData[monthKey]) {
      groupedData[monthKey] = [];
    }

    const amount = entry.amount;

    if (exportType === 'SALES_MAP') {
      const taxAmount = amount * taxRate;

      groupedData[monthKey].push({
        Data: date.toLocaleDateString(),
        Documento: entry.invoice_number ? `${entry.invoice_type} #${entry.invoice_number}` : (entry.document_type || '-'),
        Descrição: entry.description,
        Valor: amount,
        [`IVA (${settings?.tax_percentage || 16}%)`]: taxAmount.toFixed(2),
        Total: (amount + taxAmount).toFixed(2)
      });
    } else {
      // JOURNAL
      groupedData[monthKey].push({
        Data: date.toLocaleDateString(),
        Tipo: entry.type === 'ENTRY' ? 'Entrada' : 'Saída',
        Documento: entry.invoice_number ? `${entry.invoice_type} #${entry.invoice_number}` : (entry.document_type || '-'),
        Descrição: entry.description,
        Categoria: entry.category,
        Valor: amount
      });
    }
  });

  // Create a sheet for each month
  Object.keys(groupedData).sort().forEach(month => {
    const sheetData = groupedData[month];

    // Calculate Totals
    if (exportType === 'SALES_MAP') {
      const totalValor = sheetData.reduce((sum, item) => sum + item.Valor, 0);
      const totalIVA = sheetData.reduce((sum, item) => sum + parseFloat(item[`IVA (${settings?.tax_percentage || 16}%)`]), 0);
      const totalTotal = sheetData.reduce((sum, item) => sum + parseFloat(item.Total), 0);

      sheetData.push({
        Data: 'TOTAIS',
        Documento: '',
        Descrição: '',
        Valor: totalValor,
        [`IVA (${settings?.tax_percentage || 16}%)`]: totalIVA.toFixed(2),
        Total: totalTotal.toFixed(2)
      });
    } else {
      // JOURNAL Totals
      const totalValor = sheetData.reduce((sum, item) => sum + item.Valor, 0);
      sheetData.push({
        Data: 'TOTAL',
        Tipo: '',
        Documento: '',
        Descrição: '',
        Categoria: '',
        Valor: totalValor
      });
    }

    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, month);
  });

  // If no data, create a default sheet
  if (Object.keys(groupedData).length === 0) {
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, 'Geral');
  }

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  const uri = FileSystem.documentDirectory + fileName + '.xlsx';
  await FileSystem.writeAsStringAsync(uri, wbout, {
    encoding: 'base64'
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    UTI: 'com.microsoft.excel.xlsx'
  });
}
