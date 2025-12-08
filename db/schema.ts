export const SCHEMA = {
  createSettingsTable: `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT,
      nuit TEXT,
      address TEXT,
      email TEXT,
      phone TEXT,
      logo_uri TEXT,
      locale TEXT DEFAULT 'pt-MZ',
      currency TEXT DEFAULT 'MZN',
      tax_percentage REAL DEFAULT 16
    );
  `,
  createClientsTable: `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nuit TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,
  createProductsTable: `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,
  createInvoicesTable: `
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'FACTURA', 'COTACAO', 'VD'
      client_id INTEGER,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME,
      subtotal REAL NOT NULL,
      tax_total REAL NOT NULL,
      discount_total REAL DEFAULT 0,
      total REAL NOT NULL,
      status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'PAID', 'SENT'
      invoice_number TEXT,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    );
  `,
  createInvoiceItemsTable: `
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );
  `,
  createJournalTable: `
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'ENTRY', 'EXIT'
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      category TEXT
    );
  `
};
