const db = require('../database/db');

exports.index = (req, res) => {
  const skills = db.prepare('SELECT * FROM skills ORDER BY category, name').all();
  res.render('admin/skills', { skills });
};

exports.newForm = (req, res) => {
  res.render('admin/skill-form', { skill: null });
};

exports.create = (req, res) => {
  const { name, category, level, icon, sort_order } = req.body;
  db.prepare('INSERT INTO skills (name, category, level, icon, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(name, category, level, icon || null, sort_order || 0);
  res.redirect('/admin/skills');
};

exports.editForm = (req, res) => {
  const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
  res.render('admin/skill-form', { skill });
};

exports.update = (req, res) => {
  const { name, category, level, icon, sort_order } = req.body;
  db.prepare('UPDATE skills SET name = ?, category = ?, level = ?, icon = ?, sort_order = ? WHERE id = ?')
    .run(name, category, level, icon || null, sort_order || 0, req.params.id);
  res.redirect('/admin/skills');
};

exports.destroy = (req, res) => {
  db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
  res.redirect('/admin/skills');
};