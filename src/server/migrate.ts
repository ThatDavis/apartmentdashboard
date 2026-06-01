import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';

const dbPath = process.env.DATABASE_URL || './data/app.db';

// Ensure data directory exists (only for file-based DB)
if (dbPath !== ':memory:') {
  mkdirSync(dirname(dbPath), { recursive: true });
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const migrationsFolder = process.env.MIGRATIONS_FOLDER || join(process.cwd(), 'drizzle');

console.log('Running database migrations...');
console.log('Migrations folder:', migrationsFolder);
migrate(db, { migrationsFolder });
console.log('Migrations complete!');

if (dbPath !== ':memory:') {
  sqlite.close();
}
