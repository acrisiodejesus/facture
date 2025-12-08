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
  console.log('Fetching clients...');
  const result = await db.getAllAsync('SELECT * FROM clients ORDER BY name ASC');
  console.log('Clients fetched:', result.length);
  return result;
}

export async function addClient(db: SQLiteDatabase, client: any) {
  console.log('Adding client:', client);
  const { name, nuit, email, phone, address } = client;
  try {
    const result = await db.runAsync(
      'INSERT INTO clients (name, nuit, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      name, nuit, email, phone, address
    );
    console.log('Client added result:', result);
    return result;
  } catch (e) {
    console.error('Error adding client:', e);
    throw e;
  }
}

export async function updateClient(db: SQLiteDatabase, id: number, client: any) {
  console.log('Updating client:', id, client);
  const { name, nuit, email, phone, address } = client;
  try {
    const result = await db.runAsync(
      'UPDATE clients SET name = ?, nuit = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      name, nuit, email, phone, address, id
    );
    console.log('Client updated result:', result);
    return result;
  } catch (e) {
    console.error('Error updating client:', e);
    throw e;
  }
}

// Products
export async function getProducts(db: SQLiteDatabase) {
  console.log('Fetching products...');
  const result = await db.getAllAsync('SELECT * FROM products ORDER BY name ASC');
  console.log('Products fetched:', result.length);
  return result;
}

export async function addProduct(db: SQLiteDatabase, product: any) {
  console.log('Adding product:', product);
  const { name, code, price, tax_rate, description } = product;
  try {
    const result = await db.runAsync(
      'INSERT INTO products (name, code, price, tax_rate, description) VALUES (?, ?, ?, ?, ?)',
      name, code, price, tax_rate, description
    );
    console.log('Product added result:', result);
    return result;
  } catch (e) {
    console.error('Error adding product:', e);
    throw e;
  }
}

// Journal
export async function getJournalEntries(db: SQLiteDatabase) {
  return await db.getAllAsync('SELECT * FROM journal_entries ORDER BY date DESC');
}

export async function addJournalEntry(db: SQLiteDatabase, entry: any) {
  const { type, amount, description, category } = entry;
  return await db.runAsync(
    'INSERT INTO journal_entries (type, amount, description, category) VALUES (?, ?, ?, ?)',
    type, amount, description, category
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
