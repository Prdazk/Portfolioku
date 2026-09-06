const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

// Aktifkan foreign key constraint (WAJIB di better-sqlite3, defaultnya OFF)
db.pragma('foreign_keys = ON');

// ===== SETUP SCHEMA (otomatis jalan setiap server start, aman diulang) =====
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS technologies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    live_url TEXT,
    github_url TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_technologies (
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, technology_id)
  );

  CREATE TABLE IF NOT EXISTS project_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT,
    description TEXT
  );

    CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    phone TEXT,
    message TEXT NOT NULL,
    isRead INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    siteTitle TEXT,
    tagline TEXT,
    contactEmail TEXT,
    github TEXT,
    linkedin TEXT,
    maintenanceMode INTEGER NOT NULL DEFAULT 0
  );
`);

// ===== MIGRASI KOLOM BARU UNTUK TABEL LAMA (aman diulang tiap server start) =====
function addColumnIfNotExists(table, column, definition) {
  const existingColumns = db.prepare(`PRAGMA table_info(${table})`).all().map((col) => col.name);
  if (!existingColumns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Kolom "${column}" berhasil ditambahkan ke tabel "${table}".`);
  }
}

addColumnIfNotExists('messages', 'subject', 'TEXT');
addColumnIfNotExists('messages', 'phone', 'TEXT');

// ===== SEED DATA AWAL (biar dropdown kategori/teknologi tidak kosong) =====
const seedCategories = ['AI / Machine Learning', 'IoT', 'Web Development', 'Mobile Development', 'Data Science / Analytics', 'UI/UX Design'];
const seedTechnologies = ['JavaScript', 'Node.js', 'React', 'Express', 'Python', 'MySQL', 'SQLite', 'Tailwind CSS'];

const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
seedCategories.forEach((name) => insertCategory.run(name));

const insertTechnology = db.prepare('INSERT OR IGNORE INTO technologies (name) VALUES (?)');
seedTechnologies.forEach((name) => insertTechnology.run(name));

// Pastikan selalu ada 1 baris default di settings (id = 1)
db.prepare('INSERT OR IGNORE INTO settings (id, siteTitle, tagline, contactEmail) VALUES (1, ?, ?, ?)')
  .run('Portfolio Saya', 'Selalu belajar hal baru', '');

module.exports = db;