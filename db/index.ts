import { type SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA } from './schema';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
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

    currentDbVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
