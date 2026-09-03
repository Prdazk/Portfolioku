const db = require('../database/db');

exports.index = (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY createdAt DESC').all();
  res.render('admin/messages', { messages });
};

// dipanggil dari form kontak publik (/contact)
exports.storeFromPublic = (req, res) => {
  const { name, email, message } = req.body;
  db.prepare('INSERT INTO messages (name, email, message, isRead, createdAt) VALUES (?, ?, ?, 0, datetime("now"))')
    .run(name, email, message);
  res.redirect('/contact?sent=1');
};

exports.destroy = (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  res.redirect('/admin/messages');
};