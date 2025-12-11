import { readAsStringAsync } from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatInvoiceId } from './formatters';

async function imageToBase64(uri: string): Promise<string | null> {
  try {
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    return `data:image/jpeg;base64,${base64}`;
  } catch (e) {
    console.error('Failed to convert image to base64:', e);
    return null;
  }
}

export async function generateInvoicePDF(invoice: any, items: any[], settings: any, client: any) {
  let logoHtml = '';
  if (settings.logo_uri) {
    const base64Logo = await imageToBase64(settings.logo_uri);
    if (base64Logo) {
      logoHtml = `<img src="${base64Logo}" style="width: 80px; height: 80px; object-fit: contain;" />`;
    }
  }

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company-info h1 { margin: 0; color: #606c38; }
          .invoice-info { text-align: right; }
          .client-info { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; background-color: #f8f9fa; padding: 10px; border-bottom: 2px solid #ddd; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .totals { float: right; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; margin-top: 10px; pt: 10px; }
          .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #777; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            ${logoHtml}
            <h1>${settings.company_name}</h1>
            <p>${settings.address}</p>
            <p>Tel: ${settings.phone}</p>
            <p>Email: ${settings.email}</p>
            <p>NUIT: ${settings.nuit}</p>
          </div>
          <div class="invoice-info">
            <h2>${invoice.type}</h2>
            <p>${formatInvoiceId(invoice.type, invoice.id)}</p>
            <p>Data: ${new Date(invoice.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="client-info">
          <h3>Cliente:</h3>
          <p><strong>${client ? client.name : 'Consumidor Final'}</strong></p>
          ${client && client.nuit ? `<p>NUIT: ${client.nuit}</p>` : ''}
          ${client && client.address ? `<p>${client.address}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Preço Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${invoice.subtotal.toFixed(2)} ${settings.currency}</span>
          </div>
          <div class="total-row">
            <span>IVA:</span>
            <span>${invoice.tax_total.toFixed(2)} ${settings.currency}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total:</span>
            <span>${invoice.total.toFixed(2)} ${settings.currency}</span>
          </div>
        </div>

        <div class="footer">
          <p>Processado por computador. © Facture</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (e: any) {
    if (e.message && e.message.includes('Unable to activate keep awake')) {
      return;
    }
    throw e;
  }
}

export async function generateJournalPDF(entries: any[], settings: any) {
  let logoHtml = '';
  if (settings.logo_uri) {
    const base64Logo = await imageToBase64(settings.logo_uri);
    if (base64Logo) {
      logoHtml = `<img src="${base64Logo}" style="width: 80px; height: 80px; object-fit: contain;" />`;
    }
  }

  const totalAmount = entries.reduce((sum, item) => sum + item.amount, 0);

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #606c38; padding-bottom: 20px; }
          .company-info h1 { margin: 0; color: #606c38; font-size: 24px; }
          .company-info p { margin: 2px 0; font-size: 12px; }
          .report-title { text-align: right; }
          .report-title h2 { margin: 0; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { text-align: left; background-color: #f8f9fa; padding: 8px; border-bottom: 2px solid #ddd; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          .amount-col { text-align: right; }
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #777; }
          .total-row { font-weight: bold; background-color: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            ${logoHtml}
            <h1>${settings.company_name || 'Minha Empresa'}</h1>
            <p>${settings.address || ''}</p>
            <p>Tel: ${settings.phone || ''} | Email: ${settings.email || ''}</p>
            <p>NUIT: ${settings.nuit || ''}</p>
          </div>
          <div class="report-title">
            <h2>Diário</h2>
            <p>Data: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Documento</th>
              <th>Descrição</th>
              <th class="amount-col">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map((item: any) => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString()}</td>
                  <td>${item.type === 'ENTRY' ? 'Entrada' : 'Saída'}</td>
                  <td>${item.invoice_number ? formatInvoiceId(item.invoice_type, parseInt(item.invoice_number)) : (item.document_type || '-')}</td>
                  <td>${item.description}</td>
                  <td class="amount-col">${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            <tr class="total-row">
                <td colspan="4" style="text-align: right;">TOTAL</td>
                <td class="amount-col">${totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Processado por computador. © Facture</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (e: any) {
    if (e.message && e.message.includes('Unable to activate keep awake')) {
      return;
    }
    throw e;
  }
}

export async function generateSalesMapPDF(entries: any[], settings: any) {
  let logoHtml = '';
  if (settings.logo_uri) {
    const base64Logo = await imageToBase64(settings.logo_uri);
    if (base64Logo) {
      logoHtml = `<img src="${base64Logo}" style="width: 80px; height: 80px; object-fit: contain;" />`;
    }
  }

  const totalAmount = entries.reduce((sum, item) => sum + item.amount, 0);
  const totalTax = totalAmount * 0.16;
  const totalTotal = totalAmount + totalTax;

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #606c38; padding-bottom: 20px; }
          .company-info h1 { margin: 0; color: #606c38; font-size: 24px; }
          .company-info p { margin: 2px 0; font-size: 12px; }
          .report-title { text-align: right; }
          .report-title h2 { margin: 0; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { text-align: left; background-color: #f8f9fa; padding: 8px; border-bottom: 2px solid #ddd; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          .amount-col { text-align: right; }
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #777; }
          .total-row { font-weight: bold; background-color: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            ${logoHtml}
            <h1>${settings.company_name || 'Minha Empresa'}</h1>
            <p>${settings.address || ''}</p>
            <p>Tel: ${settings.phone || ''} | Email: ${settings.email || ''}</p>
            <p>NUIT: ${settings.nuit || ''}</p>
          </div>
          <div class="report-title">
            <h2>Mapa de Vendas</h2>
            <p>Data: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Documento</th>
              <th>Descrição</th>
              <th class="amount-col">Valor</th>
              <th class="amount-col">IVA (16%)</th>
              <th class="amount-col">Total</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map((item: any) => {
    const total = item.amount;
    const subtotal = total / 1.16;
    const tax = total - subtotal;
    return `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString()}</td>
                  <td>${item.invoice_number ? formatInvoiceId(item.invoice_type, parseInt(item.invoice_number)) : (item.document_type || '-')}</td>
                  <td>${item.description}</td>
                  <td class="amount-col">${subtotal.toFixed(2)}</td>
                  <td class="amount-col">${tax.toFixed(2)}</td>
                  <td class="amount-col">${total.toFixed(2)}</td>
                </tr>
              `;
  }).join('')}
            <tr class="total-row">
                <td colspan="3" style="text-align: right;">TOTAIS</td>
                <td class="amount-col">${(totalAmount / 1.16).toFixed(2)}</td>
                <td class="amount-col">${(totalAmount - (totalAmount / 1.16)).toFixed(2)}</td>
                <td class="amount-col">${totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Processado por computador. © Facture</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (e: any) {
    if (e.message && e.message.includes('Unable to activate keep awake')) {
      return;
    }
    throw e;
  }
}

export async function generateReceiptPDF(entry: any, settings: any) {
  let logoHtml = '';
  if (settings.logo_uri) {
    const base64Logo = await imageToBase64(settings.logo_uri);
    if (base64Logo) {
      logoHtml = `<img src="${base64Logo}" style="width: 80px; height: 80px; object-fit: contain;" />`;
    }
  }

  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #606c38; margin: 10px 0; }
          .receipt-title { font-size: 32px; font-weight: bold; margin: 20px 0; letter-spacing: 2px; }
          .content { margin-bottom: 40px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f5f5f5; padding-bottom: 5px; }
          .label { font-weight: bold; color: #666; }
          .value { font-size: 18px; }
          .amount { font-size: 24px; font-weight: bold; color: #606c38; }
          .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <div class="company-name">${settings.company_name || 'Minha Empresa'}</div>
          <div>${settings.address || ''}</div>
          <div>Tel: ${settings.phone || ''} | Email: ${settings.email || ''}</div>
          <div>NUIT: ${settings.nuit || ''}</div>
        </div>

        <div style="text-align: center;">
            <div class="receipt-title">RECIBO</div>
            <p>${formatInvoiceId('RECIBO', entry.id)}</p>
        </div>

        <div class="content">
            <div class="row">
                <span class="label">Data:</span>
                <span class="value">${new Date(entry.date).toLocaleDateString()}</span>
            </div>
            <div class="row">
                <span class="label">Recebemos de:</span>
                <span class="value">${entry.client_name || 'Cliente Diverso'}</span>
            </div>
            <div class="row">
                <span class="label">A quantia de:</span>
                <span class="amount">${entry.amount.toFixed(2)} ${settings.currency || 'MT'}</span>
            </div>
            <div class="row">
                <span class="label">Referente a:</span>
                <span class="value">${entry.invoice_id
      ? `Pagamento ${entry.invoice_type || entry.document_type || 'Factura'} ${entry.invoice_number ? formatInvoiceId(entry.invoice_type || entry.document_type, parseInt(entry.invoice_number)) : formatInvoiceId(entry.invoice_type || entry.document_type, entry.invoice_id)}`
      : entry.description}</span>
            </div>
        </div>

        <div class="footer">
            <p>Este documento serve como comprovativo de pagamento.</p>
            <p>Processado por computador. © Facture</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (e: any) {
    if (e.message && e.message.includes('Unable to activate keep awake')) {
      return;
    }
    throw e;
  }
}
