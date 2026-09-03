const db = require('../database/db');

// GET /admin/technologies
exports.index = (req, res) => {
  const technologies = db.prepare(`
    SELECT t.id, t.name, COUNT(pt.project_id) AS project_count
    FROM technologies t
    LEFT JOIN project_technologies pt ON pt.technology_id = t.id
    GROUP BY t.id
    ORDER BY t.name ASC
  `).all();

  res.render('admin/technologies', {
    active: 'technologies',
    technologies,
    error: req.query.error || null,
  });
};

// POST /admin/technologies
exports.create = (req, res) => {
  const name = (req.body.name || '').trim();

  if (!name) {
    return res.redirect('/admin/technologies?error=' + encodeURIComponent('Nama teknologi tidak boleh kosong'));
  }

  try {
    db.prepare('INSERT INTO technologies (name) VALUES (?)').run(name);
    res.redirect('/admin/technologies');
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.redirect('/admin/technologies?error=' + encodeURIComponent(`Teknologi "${name}" sudah ada`));
    }
    console.error(err);
    res.redirect('/admin/technologies?error=' + encodeURIComponent('Gagal menambah teknologi'));
  }
};

// POST /admin/technologies/:id/update
exports.update = (req, res) => {
  const { id } = req.params;
  const name = (req.body.name || '').trim();

  if (!name) {
    return res.redirect('/admin/technologies?error=' + encodeURIComponent('Nama teknologi tidak boleh kosong'));
  }

  try {
    const result = db.prepare('UPDATE technologies SET name = ? WHERE id = ?').run(name, id);
    if (result.changes === 0) {
      return res.redirect('/admin/technologies?error=' + encodeURIComponent('Teknologi tidak ditemukan'));
    }
    res.redirect('/admin/technologies');
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.redirect('/admin/technologies?error=' + encodeURIComponent(`Teknologi "${name}" sudah ada`));
    }
    console.error(err);
    res.redirect('/admin/technologies?error=' + encodeURIComponent('Gagal mengubah teknologi'));
  }
};

// POST /admin/technologies/:id/delete
exports.destroy = (req, res) => {
  const { id } = req.params;

  try {
    // Kalau ada FK constraint dari project_technologies ke technologies,
    // pastikan relasi ON DELETE CASCADE / SET NULL sudah diatur di schema,
    // supaya delete di sini tidak gagal karena constraint error.
    db.prepare('DELETE FROM technologies WHERE id = ?').run(id);
    res.redirect('/admin/technologies');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/technologies?error=' + encodeURIComponent('Gagal menghapus teknologi'));
  }
};