import { type SQLiteDatabase } from 'expo-sqlite';

// Settings
export async function getSettings(db: SQLiteDatabase) {
  return await db.getFirstAsync('SELECT * FROM settings LIMIT 1');
}

export async function updateSettings(db: SQLiteDatabase, settings: any) {
  const { company_name, nuit, address, email, phone, logo_uri, locale, currency, tax_percentage } = settings;
  return await db.runAsync(
    `UPDATE settings SET 
      company_name = ?, nuit = ?, address = ?, email = ?, phone = ?, 
      logo_uri = ?, locale = ?, currency = ?, tax_percentage = ? 
    WHERE id = 1`,
    company_name, nuit, address, email, phone, logo_uri, locale, currency, tax_percentage
  );
}

// Clients
export async function getClients(db: SQLiteDatabase) {
  const result = await db.getAllAsync('SELECT * FROM clients ORDER BY name ASC');
  return result;
}

export async function addClient(db: SQLiteDatabase, client: any) {
  const { name, nuit, email, phone, address } = client;
  try {
    const result = await db.runAsync(
      'INSERT INTO clients (name, nuit, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      name, nuit, email, phone, address
    );
    return result;
  } catch (e) {
    console.error('Error adding client:', e);
    throw e;
  }
}

export async function getInvoices(db: SQLiteDatabase) {
  // Fetch invoices that are not fully paid or just all invoices for selection
  // For simplicity, let's fetch all. In a real app, maybe filter by status.
  return await db.getAllAsync('SELECT * FROM invoices ORDER BY date DESC');
}

export async function updateClient(db: SQLiteDatabase, id: number, client: any) {
  const { name, nuit, email, phone, address } = client;
  try {
    const result = await db.runAsync(
      'UPDATE clients SET name = ?, nuit = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      name, nuit, email, phone, address, id
    );
    return result;
  } catch (e) {
    console.error('Error updating client:', e);
    throw e;
  }
}

// Products
export async function getProducts(db: SQLiteDatabase) {
  const result = await db.getAllAsync('SELECT * FROM products ORDER BY name ASC');
  return result;
}

export async function addProduct(db: SQLiteDatabase, product: any) {
  const { name, code, price, tax_rate, description } = product;
  try {
    const result = await db.runAsync(
      'INSERT INTO products (name, code, price, tax_rate, description) VALUES (?, ?, ?, ?, ?)',
      name, code, price, tax_rate, description
    );
    return result;
  } catch (e) {
    console.error('Error adding product:', e);
    throw e;
  }
}

// Journal
export async function getJournalEntries(db: SQLiteDatabase) {
  return await db.getAllAsync(`
    SELECT j.*, i.invoice_number, i.type as invoice_type, c.name as client_name 
    FROM journal_entries j 
    LEFT JOIN invoices i ON j.invoice_id = i.id 
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY j.date DESC
  `);
}

export async function addJournalEntry(db: SQLiteDatabase, entry: any) {
  const { type, amount, description, category, document_type, invoice_id } = entry;
  return await db.runAsync(
    'INSERT INTO journal_entries (type, amount, description, category, document_type, invoice_id) VALUES (?, ?, ?, ?, ?, ?)',
    type, amount, description, category, document_type, invoice_id
  );
}

export async function getJournalBalance(db: SQLiteDatabase) {
  const entries = await db.getAllAsync<{ type: string, amount: number }>('SELECT type, amount FROM journal_entries');
  let balance = 0;
  entries.forEach(e => {
    if (e.type === 'ENTRY') balance += e.amount;
    else balance -= e.amount;
  });
  return balance;
}

export async function getJournalEntry(db: SQLiteDatabase, id: number) {
  return await db.getFirstAsync('SELECT * FROM journal_entries WHERE id = ?', id);
}

export async function updateJournalEntry(db: SQLiteDatabase, id: number, entry: any) {
  const { amount, description, category, document_type, invoice_id } = entry;
  return await db.runAsync(
    'UPDATE journal_entries SET amount = ?, description = ?, category = ?, document_type = ?, invoice_id = ? WHERE id = ?',
    amount, description, category, document_type, invoice_id, id
  );
}

export async function getInvoice(db: SQLiteDatabase, id: number) {
  return await db.getFirstAsync('SELECT * FROM invoices WHERE id = ?', id);
}

export async function getInvoiceItems(db: SQLiteDatabase, invoiceId: number) {
  return await db.getAllAsync('SELECT * FROM invoice_items WHERE invoice_id = ?', invoiceId);
}

export async function updateInvoice(db: SQLiteDatabase, id: number, invoice: any, items: any[]) {
  const { client_id, type, date, due_date, subtotal, tax_total, total } = invoice;

  await db.runAsync(
    'UPDATE invoices SET client_id = ?, type = ?, date = ?, due_date = ?, subtotal = ?, tax_total = ?, total = ? WHERE id = ?',
    client_id, type, date, due_date, subtotal, tax_total, total, id
  );

  // Delete existing items and re-insert (simplest approach for update)
  await db.runAsync('DELETE FROM invoice_items WHERE invoice_id = ?', id);

  for (const item of items) {
    await db.runAsync(
      'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)',
      id, item.description, item.quantity, item.unit_price, item.total
    );
  }
}

export async function deleteJournalEntry(db: SQLiteDatabase, id: number) {
  return await db.runAsync('DELETE FROM journal_entries WHERE id = ?', id);
}

export async function deleteInvoice(db: SQLiteDatabase, id: number) {
  // Unlink journal entries
  await db.runAsync('UPDATE journal_entries SET invoice_id = NULL WHERE invoice_id = ?', id);
  // Delete items
  await db.runAsync('DELETE FROM invoice_items WHERE invoice_id = ?', id);
  // Delete invoice
  return await db.runAsync('DELETE FROM invoices WHERE id = ?', id);
}
