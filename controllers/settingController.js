const db = require('../database/db');

exports.index = (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.render('admin/settings', { settings });
};

exports.update = (req, res) => {
  const { siteTitle, tagline, contactEmail, github, linkedin } = req.body;
  const maintenanceMode = req.body.maintenanceMode ? 1 : 0;

  db.prepare(`
    UPDATE settings
    SET siteTitle=?, tagline=?, contactEmail=?, github=?, linkedin=?, maintenanceMode=?
    WHERE id = 1
  `).run(siteTitle, tagline, contactEmail, github, linkedin, maintenanceMode);

  res.redirect('/admin/settings');
};