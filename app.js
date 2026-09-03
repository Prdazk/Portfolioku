// Import express
const express = require('express');
const app = express();

// Import package tambahan
const session = require('express-session');
const bcrypt = require('bcrypt');

// Set EJS sebagai view engine
app.set('view engine', 'ejs');

// Middleware untuk membaca file static (CSS, JS, gambar)
app.use(express.static('public'));

// Middleware untuk membaca data dari form (req.body)
app.use(express.urlencoded({ extended: true }));

// Middleware session (WAJIB sebelum middleware yang pakai req.session)
app.use(session({
  secret: 'rahasia-portfolio-kamu',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 jam
}));

// Middleware: kirim status login ke semua view (WAJIB setelah session di atas)
app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.userId ? true : false;
  next();
});

// Middleware: cek apakah user sudah login (khusus proteksi halaman admin)
function requireAdminLogin(req, res, next) {
  res.set('Cache-Control', 'no-store');
  if (!req.session.userId) {
    return res.redirect('/admin/login');
  }
  next();
}

// Import koneksi database
const db = require('./database/db');

// Import controller & middleware upload untuk Projects
const projectController = require('./controllers/projectController');
const categoryController = require('./controllers/categoryController.');
const technologyController = require('./controllers/technologyController');
const upload = require('./middleware/upload');


// Tentukan port server
const PORT = process.env.PORT || 3000;

// ===== ROUTE PUBLIC =====
app.get('/', (req, res) => {
  res.render('home', { page: 'home' });
});

app.get('/projects', projectController.publicIndex);

app.get('/about', (req, res) => {
  res.render('about', { page: 'about' });
});

app.get('/pendidikan', (req, res) => {
  res.render('pendidikan', { page: 'pendidikan' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { page: 'contact' });
});

// ===== ROUTE ADMIN - LOGIN =====
app.get('/admin/login', (req, res) => {
  res.render('admin/login', { error: null });
});

app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);

    if (!admin) {
      return res.render('admin/login', { error: 'Email atau password salah' });
    }

    const match = await bcrypt.compare(password, admin.password_hash);

    if (!match) {
      return res.render('admin/login', { error: 'Email atau password salah' });
    }

    req.session.userId = admin.id;
    res.redirect('/admin/dashboard');

  } catch (err) {
    console.error(err);
    res.render('admin/login', { error: 'Terjadi kesalahan server' });
  }
});

app.get('/admin/dashboard', requireAdminLogin, (req, res) => {
  const totalProjects = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
  const totalCategories = db.prepare('SELECT COUNT(*) AS count FROM categories').get().count;
  const totalTechnologies = db.prepare('SELECT COUNT(*) AS count FROM technologies').get().count;

  res.render('admin/dashboard', { totalProjects, totalCategories, totalTechnologies });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ===== ROUTE ADMIN - PROJECTS (CRUD) =====
app.get('/admin/projects', requireAdminLogin, projectController.index);
app.get('/admin/projects/new', requireAdminLogin, projectController.newForm);
app.post('/admin/projects', requireAdminLogin, upload.array('images', 10), projectController.create);
app.get('/admin/projects/:id/edit', requireAdminLogin, projectController.editForm);
app.post('/admin/projects/:id/update', requireAdminLogin, upload.array('images', 10), projectController.update);
app.post('/admin/projects/:id/delete', requireAdminLogin, projectController.destroy);

   // ===== ROUTE ADMIN - CATEGORIES (CRUD) =====
   app.get('/admin/categories', requireAdminLogin, categoryController.index);
   app.post('/admin/categories', requireAdminLogin, categoryController.create);
   app.post('/admin/categories/:id/update', requireAdminLogin, categoryController.update);
   app.post('/admin/categories/:id/delete', requireAdminLogin, categoryController.destroy);

   
// ===== ROUTE ADMIN - TECHNOLOGIES (CRUD) =====
app.get('/admin/technologies', requireAdminLogin, technologyController.index);
app.post('/admin/technologies', requireAdminLogin, technologyController.create);
app.post('/admin/technologies/:id/update', requireAdminLogin, technologyController.update);
app.post('/admin/technologies/:id/delete', requireAdminLogin, technologyController.destroy);

// ===== ROUTE TEST DATABASE =====
app.get('/test-db', (req, res) => {
  try {
    const result = db.prepare('SELECT datetime("now") as now').get();
    res.send(`Database terkoneksi! Waktu server: ${result.now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal konek ke database: ' + err.message);
  }
});

// ===== ROUTE 404 - WAJIB PALING BAWAH, SETELAH SEMUA ROUTE LAIN =====
app.use((req, res) => {
  res.status(404).render('404', { url: req.originalUrl });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});