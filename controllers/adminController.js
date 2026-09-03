const bcrypt = require('bcrypt');
const pool = require('../database/db');

// GET /admin/login
exports.loginPage = (req, res) => {
  res.render('admin/login', { error: null });
};

// POST /admin/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.render('admin/login', { error: 'Email atau password salah.' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.render('admin/login', { error: 'Email atau password salah.' });
    }

    // Simpan session
    req.session.admin = { id: admin.id, email: admin.email };
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.render('admin/login', { error: 'Terjadi kesalahan server, coba lagi.' });
  }
};

// GET /admin/logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
};

// GET /admin/dashboard
exports.dashboard = (req, res) => {
  res.render('admin/dashboard', { admin: req.session.admin });
};