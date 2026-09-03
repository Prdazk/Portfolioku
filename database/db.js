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
`);

// ===== SEED DATA AWAL (biar dropdown kategori/teknologi tidak kosong) =====
const seedCategories = ['AI / Machine Learning', 'IoT', 'Web Development', 'Mobile Development', 'Data Science / Analytics', 'UI/UX Design'];
const seedTechnologies = ['JavaScript', 'Node.js', 'React', 'Express', 'Python', 'MySQL', 'SQLite', 'Tailwind CSS'];

const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
seedCategories.forEach((name) => insertCategory.run(name));

const insertTechnology = db.prepare('INSERT OR IGNORE INTO technologies (name) VALUES (?)');
seedTechnologies.forEach((name) => insertTechnology.run(name));

module.exports = db;