import { type SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA } from './schema';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 2;
  // @ts-ignore
  let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      ${SCHEMA.createSettingsTable}
      ${SCHEMA.createClientsTable}
      ${SCHEMA.createProductsTable}
      ${SCHEMA.createInvoicesTable}
      ${SCHEMA.createInvoiceItemsTable}
      ${SCHEMA.createJournalTable}
    `);

    // Insert default settings if empty
    const result = await db.getFirstAsync('SELECT count(*) as count FROM settings');
    // @ts-ignore
    if (result && result.count === 0) {
      await db.runAsync(
        'INSERT INTO settings (company_name, locale, currency) VALUES (?, ?, ?)',
        'Minha Empresa', 'pt-MZ', 'MZN'
      );
    }
  }

  // Migration for version 2: Add document_type and invoice_id to journal_entries
  if (currentDbVersion < 2) {
    try {
      const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(journal_entries)');

      const hasDocumentType = tableInfo.some(col => col.name === 'document_type');
      if (!hasDocumentType) {
        await db.execAsync('ALTER TABLE journal_entries ADD COLUMN document_type TEXT');
      }

      const hasInvoiceId = tableInfo.some(col => col.name === 'invoice_id');
      if (!hasInvoiceId) {
        await db.execAsync('ALTER TABLE journal_entries ADD COLUMN invoice_id INTEGER REFERENCES invoices(id)');
      }
    } catch (e) {
      console.error('Migration error:', e);
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
