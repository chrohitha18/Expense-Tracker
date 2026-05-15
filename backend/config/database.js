const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH 
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.resolve(__dirname, '../database/database.sqlite');
let dbInstance = null;

const initDb = async () => {
  if (dbInstance) return dbInstance;
  
  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  return dbInstance;
};

const pool = {
  execute: async (sql, params = []) => {
    const db = await initDb();
    
    // Convert boolean params from true/false to 1/0 for SQLite compatibility
    const safeParams = params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : p);

    // Some queries might use MySQL specific ON DUPLICATE KEY UPDATE or similar, but this app doesn't seem to have complex ones.
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.all(sql, safeParams);
      return [rows];
    } else {
      const result = await db.run(sql, safeParams);
      // Map SQLite's changes to MySQL's affectedRows for compatibility
      result.affectedRows = result.changes;
      return [result];
    }
  }
};

const testConnection = async () => {
  try {
    const db = await initDb();
    console.log('✅ SQLite connected successfully');
    
    // Initialize schema
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await db.exec(schemaSql);
      console.log('✅ SQLite schema synchronized');
    }
    
  } catch (err) {
    console.error('❌ SQLite connection/init failed:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
