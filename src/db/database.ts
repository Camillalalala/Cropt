import * as SQLite from 'expo-sqlite';
import type { LocalReport } from '../types/report';

const db = SQLite.openDatabaseSync('cropopt.db');

export async function initializeDatabase(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      disease_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      lat REAL NOT NULL,
      long REAL NOT NULL,
      user_text TEXT NOT NULL DEFAULT '',
      is_synced INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Migration path: earlier app versions created `reports` with `title/createdAt`.
  // That schema has NOT NULL constraints we do not write to anymore, so rebuild once.
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(reports);');
  const existing = new Set(columns.map((column) => column.name));

  if (existing.has('title') || existing.has('createdAt')) {
    await db.execAsync(`
      BEGIN TRANSACTION;
      CREATE TABLE IF NOT EXISTS reports_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        disease_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        lat REAL NOT NULL,
        long REAL NOT NULL,
        user_text TEXT NOT NULL DEFAULT '',
        is_synced INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO reports_new (id, disease_id, timestamp, lat, long, user_text, is_synced)
      SELECT
        id,
        COALESCE(disease_id, 'unknown') AS disease_id,
        COALESCE(timestamp, createdAt, '1970-01-01T00:00:00.000Z') AS timestamp,
        COALESCE(lat, 0) AS lat,
        COALESCE(long, 0) AS long,
        COALESCE(user_text, '') AS user_text,
        COALESCE(is_synced, 0) AS is_synced
      FROM reports;
      DROP TABLE reports;
      ALTER TABLE reports_new RENAME TO reports;
      COMMIT;
    `);
    return;
  }

  // Ensure required columns exist for any partially migrated table.
  if (!existing.has('disease_id')) {
    await db.execAsync(
      "ALTER TABLE reports ADD COLUMN disease_id TEXT NOT NULL DEFAULT 'unknown';"
    );
  }
  if (!existing.has('timestamp')) {
    await db.execAsync(
      "ALTER TABLE reports ADD COLUMN timestamp TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z';"
    );
  }
  if (!existing.has('lat')) {
    await db.execAsync('ALTER TABLE reports ADD COLUMN lat REAL NOT NULL DEFAULT 0;');
  }
  if (!existing.has('long')) {
    await db.execAsync('ALTER TABLE reports ADD COLUMN long REAL NOT NULL DEFAULT 0;');
  }
  if (!existing.has('user_text')) {
    await db.execAsync("ALTER TABLE reports ADD COLUMN user_text TEXT NOT NULL DEFAULT '';");
  }
  if (!existing.has('is_synced')) {
    await db.execAsync('ALTER TABLE reports ADD COLUMN is_synced INTEGER NOT NULL DEFAULT 0;');
  }
}

export async function createMockReport(): Promise<void> {
  const timestamp = new Date().toISOString();
  const diseaseId = 'leaf_rust';

  await db.runAsync(
    `INSERT INTO reports (disease_id, timestamp, lat, long, is_synced)
     VALUES (?, ?, ?, ?, ?);`,
    [diseaseId, timestamp, 34.0522, -118.2437, 0]
  );
}

export async function createReport(input: {
  diseaseId: string;
  lat: number;
  long: number;
  userText?: string;
  isSynced?: number;
}): Promise<void> {
  const timestamp = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO reports (disease_id, timestamp, lat, long, user_text, is_synced)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [input.diseaseId, timestamp, input.lat, input.long, input.userText ?? '', input.isSynced ?? 0]
  );
}

export async function getReports(): Promise<LocalReport[]> {
  return db.getAllAsync<LocalReport>(
    `SELECT id, disease_id, timestamp, lat, long, user_text, is_synced
     FROM reports
     ORDER BY id DESC;`
  );
}

export async function getUnsyncedReports(): Promise<LocalReport[]> {
  return db.getAllAsync<LocalReport>(
    `SELECT id, disease_id, timestamp, lat, long, user_text, is_synced
     FROM reports
     WHERE is_synced = 0
     ORDER BY id ASC;`
  );
}

export async function markReportSynced(id: number): Promise<void> {
  await db.runAsync('UPDATE reports SET is_synced = 1 WHERE id = ?;', [id]);
}
