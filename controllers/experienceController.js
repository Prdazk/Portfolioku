const db = require('../database/db');

exports.index = (req, res) => {
  const experiences = db.prepare('SELECT * FROM experiences ORDER BY startDate DESC').all();
  res.render('admin/experience', { experiences });
};

exports.newForm = (req, res) => {
  res.render('admin/experience-form', { experience: null });
};

exports.create = (req, res) => {
  const { role, company, startDate, endDate, description } = req.body;
  db.prepare('INSERT INTO experiences (role, company, startDate, endDate, description) VALUES (?, ?, ?, ?, ?)')
    .run(role, company, startDate, endDate || null, description);
  res.redirect('/admin/experience');
};

exports.editForm = (req, res) => {
  const experience = db.prepare('SELECT * FROM experiences WHERE id = ?').get(req.params.id);
  res.render('admin/experience-form', { experience });
};

exports.update = (req, res) => {
  const { role, company, startDate, endDate, description } = req.body;
  db.prepare('UPDATE experiences SET role=?, company=?, startDate=?, endDate=?, description=? WHERE id=?')
    .run(role, company, startDate, endDate || null, description, req.params.id);
  res.redirect('/admin/experience');
};

exports.destroy = (req, res) => {
  db.prepare('DELETE FROM experiences WHERE id = ?').run(req.params.id);
  res.redirect('/admin/experience');
};