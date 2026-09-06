const db = require('../database/db');

exports.index = (req, res) => {
  const filter = req.query.filter || 'all';

  let sql = 'SELECT * FROM messages';
  if (filter === 'unread') sql += ' WHERE isRead = 0';
  if (filter === 'read') sql += ' WHERE isRead = 1';
  sql += ' ORDER BY createdAt DESC';

  const messages = db.prepare(sql).all();
  const unreadCount = db.prepare('SELECT COUNT(*) AS count FROM messages WHERE isRead = 0').get().count;

  res.render('admin/messages', {
    messages,
    currentFilter: filter,
    unreadCount
  });
};

exports.markAsRead = (req, res) => {
  db.prepare('UPDATE messages SET isRead = 1 WHERE id = ?').run(req.params.id);
  res.sendStatus(200);
};

// dipanggil dari form kontak publik (/contact)
exports.storeFromPublic = (req, res) => {
  const { name, email, subject, phone, message } = req.body;
  db.prepare("INSERT INTO messages (name, email, subject, phone, message, isRead, createdAt) VALUES (?, ?, ?, ?, ?, 0, datetime('now'))")
    .run(name, email, subject || null, phone || null, message);
  res.redirect('/contact?sent=1');
};

exports.destroy = (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  res.redirect('/admin/messages');
};