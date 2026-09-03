const db = require('../database/db');

// GET /admin/categories
exports.index = (req, res) => {
  const categories = db.prepare(`
    SELECT c.id, c.name, COUNT(p.id) AS project_count
    FROM categories c
    LEFT JOIN projects p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `).all();

  res.render('admin/categories', {
    active: 'categories',
    categories,
    error: req.query.error || null,
  });
};

// POST /admin/categories
exports.create = (req, res) => {
  const name = (req.body.name || '').trim();

  if (!name) {
    return res.redirect('/admin/categories?error=' + encodeURIComponent('Nama kategori tidak boleh kosong'));
  }

  try {
    db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    res.redirect('/admin/categories');
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.redirect('/admin/categories?error=' + encodeURIComponent(`Kategori "${name}" sudah ada`));
    }
    console.error(err);
    res.redirect('/admin/categories?error=' + encodeURIComponent('Gagal menambah kategori'));
  }
};

// POST /admin/categories/:id/update
exports.update = (req, res) => {
  const { id } = req.params;
  const name = (req.body.name || '').trim();

  if (!name) {
    return res.redirect('/admin/categories?error=' + encodeURIComponent('Nama kategori tidak boleh kosong'));
  }

  try {
    const result = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
    if (result.changes === 0) {
      return res.redirect('/admin/categories?error=' + encodeURIComponent('Kategori tidak ditemukan'));
    }
    res.redirect('/admin/categories');
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.redirect('/admin/categories?error=' + encodeURIComponent(`Kategori "${name}" sudah ada`));
    }
    console.error(err);
    res.redirect('/admin/categories?error=' + encodeURIComponent('Gagal mengubah kategori'));
  }
};

// POST /admin/categories/:id/delete
exports.destroy = (req, res) => {
  const { id } = req.params;

  try {
    // FK category_id di projects pakai ON DELETE SET NULL,
    // jadi project yang pakai kategori ini TIDAK ikut terhapus.
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.redirect('/admin/categories');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/categories?error=' + encodeURIComponent('Gagal menghapus kategori'));
  }
};