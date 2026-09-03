const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware: hanya bisa akses kalau sudah login
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/admin/login');
}

router.get('/login', adminController.loginPage);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);
router.get('/dashboard', requireAuth, adminController.dashboard);

module.exports = router;