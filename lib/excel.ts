import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

export async function exportToExcel(data: any[], sheetName: string, fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
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
