const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const db = new Database('database.db');

async function updateAdmin() {
  const args = process.argv.slice(2);
  const currentEmail = args[0];

  if (!currentEmail) {
    console.error('Pemakaian: node update-admin.js <email_saat_ini> [--email <email_baru>] [--password <password_baru>]');
    process.exit(1);
  }

  const emailIndex = args.indexOf('--email');
  const passwordIndex = args.indexOf('--password');

  const newEmail = emailIndex !== -1 ? args[emailIndex + 1] : null;
  const newPassword = passwordIndex !== -1 ? args[passwordIndex + 1] : null;

  if (!newEmail && !newPassword) {
    console.error('Minimal isi salah satu: --email atau --password');
    process.exit(1);
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(currentEmail);

  if (!admin) {
    console.error(`Admin dengan email "${currentEmail}" tidak ditemukan.`);
    process.exit(1);
  }

  if (newPassword && newPassword.length < 8) {
    console.error('Password baru minimal 8 karakter.');
    process.exit(1);
  }

  const finalEmail = newEmail || admin.email;
  const finalPasswordHash = newPassword
    ? await bcrypt.hash(newPassword, 10)
    : admin.password_hash;

  db.prepare(
    'UPDATE admins SET email = ?, password_hash = ? WHERE id = ?'
  ).run(finalEmail, finalPasswordHash, admin.id);

  console.log('Admin berhasil diupdate!');
  console.log(`Email lama : ${currentEmail}`);
  console.log(`Email baru : ${finalEmail}`);
  if (newPassword) console.log('Password   : berhasil diganti (tersimpan dalam bentuk hash)');
}

updateAdmin().catch((err) => {
  console.error('Gagal update admin:', err);
  process.exit(1);
});