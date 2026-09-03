const fs = require('fs');
const path = require('path');
const db = require('../database/db');

function getCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY name').all();
}

function getTechnologies() {
  return db.prepare('SELECT * FROM technologies ORDER BY name').all();
}

function getSelectedTechIds(projectId) {
  const rows = db
    .prepare('SELECT technology_id FROM project_technologies WHERE project_id = ?')
    .all(projectId);
  return rows.map((r) => r.technology_id);
}

function getProjectImages(projectId) {
  return db
    .prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, id ASC')
    .all(projectId);
}

// GET /admin/projects
exports.index = (req, res) => {
  const projects = db
    .prepare(
      `SELECT projects.*, categories.name AS category_name
       FROM projects
       LEFT JOIN categories ON categories.id = projects.category_id
       ORDER BY projects.created_at DESC`
    )
    .all();

  // Sisipkan array semua gambar per project (buat modal gallery)
  projects.forEach((project) => {
    project.images = getProjectImages(project.id).map((img) => img.image_path);
  });

  res.render('admin/projects', { projects });
};

// GET /admin/projects/new
exports.newForm = (req, res) => {
  res.render('admin/project-form', {
    project: null,
    categories: getCategories(),
    technologies: getTechnologies(),
    selectedTechIds: [],
    existingImages: [],
    error: null
  });
};

// POST /admin/projects
exports.create = (req, res) => {
  const { title, description, live_url, github_url, category_id } = req.body;
  let technologies = req.body.technologies || [];
  if (!Array.isArray(technologies)) technologies = [technologies];

  if (!title || title.trim() === '') {
    return res.render('admin/project-form', {
      project: req.body,
      categories: getCategories(),
      technologies: getTechnologies(),
      selectedTechIds: technologies.map(Number),
      existingImages: [],
      error: 'Judul project wajib diisi.'
    });
  }

  const files = req.files || [];
  const coverImage = files.length > 0 ? `/uploads/projects/${files[0].filename}` : null;

  const insertProject = db.prepare(`
    INSERT INTO projects (title, description, image, live_url, github_url, category_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = insertProject.run(
    title.trim(),
    description || null,
    coverImage,
    live_url || null,
    github_url || null,
    category_id || null
  );

  const projectId = result.lastInsertRowid;

  const insertTech = db.prepare(
    'INSERT INTO project_technologies (project_id, technology_id) VALUES (?, ?)'
  );
  technologies.forEach((techId) => insertTech.run(projectId, Number(techId)));

  const insertImage = db.prepare(
    'INSERT INTO project_images (project_id, image_path, sort_order) VALUES (?, ?, ?)'
  );
  files.forEach((file, index) => {
    insertImage.run(projectId, `/uploads/projects/${file.filename}`, index);
  });

  res.redirect('/admin/projects');
};

// GET /admin/projects/:id/edit
exports.editForm = (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

  if (!project) {
    return res.redirect('/admin/projects');
  }

  res.render('admin/project-form', {
    project,
    categories: getCategories(),
    technologies: getTechnologies(),
    selectedTechIds: getSelectedTechIds(project.id),
    existingImages: getProjectImages(project.id),
    error: null
  });
};

// POST /admin/projects/:id/update
exports.update = (req, res) => {
  const { title, description, live_url, github_url, category_id } = req.body;
  let technologies = req.body.technologies || [];
  if (!Array.isArray(technologies)) technologies = [technologies];

  let deleteImageIds = req.body.delete_images || [];
  if (!Array.isArray(deleteImageIds)) deleteImageIds = [deleteImageIds];
  deleteImageIds = deleteImageIds.map(Number);

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.redirect('/admin/projects');
  }

  if (!title || title.trim() === '') {
    return res.render('admin/project-form', {
      project: { ...existing, ...req.body },
      categories: getCategories(),
      technologies: getTechnologies(),
      selectedTechIds: technologies.map(Number),
      existingImages: getProjectImages(req.params.id),
      error: 'Judul project wajib diisi.'
    });
  }

  // Hapus gambar yang dicentang untuk dihapus
  if (deleteImageIds.length > 0) {
    const placeholders = deleteImageIds.map(() => '?').join(',');

    const imagesToDelete = db
      .prepare(`SELECT * FROM project_images WHERE project_id = ? AND id IN (${placeholders})`)
      .all(req.params.id, ...deleteImageIds);

    imagesToDelete.forEach((img) => {
      const imgPath = path.join(__dirname, '..', 'public', img.image_path);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    });

    db.prepare(`DELETE FROM project_images WHERE project_id = ? AND id IN (${placeholders})`)
      .run(req.params.id, ...deleteImageIds);
  }

  // Tambah gambar baru kalau ada upload
  const files = req.files || [];
  if (files.length > 0) {
    const maxOrderRow = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM project_images WHERE project_id = ?')
      .get(req.params.id);

    const insertImage = db.prepare(
      'INSERT INTO project_images (project_id, image_path, sort_order) VALUES (?, ?, ?)'
    );
    files.forEach((file, index) => {
      insertImage.run(req.params.id, `/uploads/projects/${file.filename}`, maxOrderRow.maxOrder + 1 + index);
    });
  }

  // Thumbnail utama = gambar pertama yang tersisa setelah hapus/tambah
  const remainingImages = getProjectImages(req.params.id);
  const newCover = remainingImages.length > 0 ? remainingImages[0].image_path : null;

  db.prepare(`
    UPDATE projects
    SET title = ?, description = ?, image = ?, live_url = ?, github_url = ?, category_id = ?
    WHERE id = ?
  `).run(
    title.trim(),
    description || null,
    newCover,
    live_url || null,
    github_url || null,
    category_id || null,
    req.params.id
  );

  db.prepare('DELETE FROM project_technologies WHERE project_id = ?').run(req.params.id);
  const insertTech = db.prepare(
    'INSERT INTO project_technologies (project_id, technology_id) VALUES (?, ?)'
  );
  technologies.forEach((techId) => insertTech.run(req.params.id, Number(techId)));

  res.redirect('/admin/projects');
};

// POST /admin/projects/:id/delete
exports.destroy = (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

  if (project) {
    const images = getProjectImages(project.id);
    images.forEach((img) => {
      const imgPath = path.join(__dirname, '..', 'public', img.image_path);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    });

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    // project_images ikut terhapus otomatis (ON DELETE CASCADE)
  }

  res.redirect('/admin/projects');
};

function getProjectTechnologies(projectId) {
  return db
    .prepare(
      `SELECT technologies.name FROM project_technologies
       JOIN technologies ON technologies.id = project_technologies.technology_id
       WHERE project_technologies.project_id = ?`
    )
    .all(projectId)
    .map((t) => t.name);
}

exports.publicIndex = (req, res) => {
  const projects = db
    .prepare(
      `SELECT projects.*, categories.name AS category_name
       FROM projects
       LEFT JOIN categories ON categories.id = projects.category_id
       ORDER BY projects.created_at DESC`
    )
    .all();

  projects.forEach((project) => {
    const images = getProjectImages(project.id).map((img) => img.image_path);
    project.images = images;
    project.thumbnail = images.length > 0 ? images[0] : project.image;
    project.technologies = getProjectTechnologies(project.id); // baris baru
  });

  res.render('projects', { page: 'projects', projects });
};