/**
 * Script untuk MEMBUAT akun admin baru ATAU ME-RESET password admin lama.
 *
 * Cara pakai:
 *   1. Isi ADMIN_EMAIL & ADMIN_PASSWORD baru di file .env
 *   2. Jalankan: node create-admin.js
 *
 * Otomatis bikin tabel `admins` kalau belum ada, lalu insert admin baru,
 * atau UPDATE password_hash kalau email sudah terdaftar (aman dipakai
 * berkali-kali untuk reset password).
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./database/db');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('❌ ADMIN_EMAIL dan ADMIN_PASSWORD harus diisi di file .env');
  process.exit(1);
}

try {
  // Pastikan tabel admins ada, sesuai kolom yang dipakai app.js (password_hash)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const passwordHash = bcrypt.hashSync(password, 10);

  const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);

  if (existing) {
    db.prepare('UPDATE admins SET password_hash = ? WHERE email = ?').run(passwordHash, email);
    console.log('✅ Password admin berhasil di-RESET.');
  } else {
    db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run(email, passwordHash);
    console.log('✅ Akun admin baru berhasil DIBUAT.');
  }

  console.log(`   Email    : ${email}`);
  console.log(`   Password : (sesuai yang kamu set di .env)`);
} catch (err) {
  console.error('❌ Gagal membuat/reset admin:', err.message);
}