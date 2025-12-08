import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generateInvoicePDF(invoice: any, items: any[], settings: any, client: any) {
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
            <h1>${settings.company_name}</h1>
            <p>${settings.address}</p>
            <p>Tel: ${settings.phone}</p>
            <p>Email: ${settings.email}</p>
            <p>NUIT: ${settings.nuit}</p>
          </div>
          <div class="invoice-info">
            <h2>${invoice.type}</h2>
            <p>#${invoice.id}</p>
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
          <p>Processado por computador.</p>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
}
