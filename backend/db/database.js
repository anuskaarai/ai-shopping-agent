const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the db directory exists
const dbDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'shopsense.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB] Error opening database:', err.message);
  } else {
    console.log('[DB] Connected to SQLite database.');
    
    // Initialize the users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('[DB] Error creating users table:', err.message);
      } else {
        console.log('[DB] Users table is ready.');
      }
    });
  }
});

module.exports = db;
