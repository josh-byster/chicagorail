import Database from 'better-sqlite3';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;

export const initDatabase = (): Database.Database => {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const dataDir = path.dirname(env.DATABASE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize SQLite database
  db = new Database(env.DATABASE_PATH);

  // Enable WAL mode for better concurrent access (research.md recommendation)
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('temp_store = MEMORY');

  console.log('✅ Database initialized with WAL mode');
  console.log(`📁 Database path: ${env.DATABASE_PATH}`);

  return db;
};

export const getDatabase = (): Database.Database => {
  if (!db) {
    return initDatabase();
  }
  return db;
};

export const closeDatabase = (): void => {
  if (db) {
    db.pragma('optimize');
    db.close();
    db = null;
    console.log('✅ Database connection closed');
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
