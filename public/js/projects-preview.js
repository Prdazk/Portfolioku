document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('previewOverlay');
  const titleEl = document.getElementById('previewTitle');
  const descEl = document.getElementById('previewDescription');
  const imgEl = document.getElementById('previewImage');
  const placeholderEl = document.getElementById('previewPlaceholder');
  const techBadgesEl = document.getElementById('previewTechBadges');
  const openNewTabEl = document.getElementById('previewOpenNewTab');
  const fullSiteBtn = document.getElementById('previewFullSiteBtn');

  function openPreview(data) {
    titleEl.textContent = data.title.toUpperCase();
    descEl.textContent = data.description || 'Tidak ada deskripsi.';

    if (data.thumbnail) {
      imgEl.src = data.thumbnail;
      imgEl.style.display = 'block';
      placeholderEl.style.display = 'none';
    } else {
      imgEl.style.display = 'none';
      placeholderEl.style.display = 'flex';
    }

    techBadgesEl.innerHTML = '';
    (data.technologies || []).forEach(function (tech) {
      const span = document.createElement('span');
      span.textContent = tech;
      techBadgesEl.appendChild(span);
    });

    openNewTabEl.href = data.live;
    fullSiteBtn.href = data.live;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('is-visible');
      });
    });
  }

  function closePreview() {
    overlay.classList.remove('is-visible');
    document.body.style.overflow = '';

    setTimeout(function () {
      overlay.classList.remove('active');
    }, 250);
  }

  document.querySelectorAll('.js-preview-project').forEach(function (btn) {
    btn.addEventListener('click', function () {
      let technologies = [];
      try {
        technologies = JSON.parse(btn.dataset.technologies || '[]');
      } catch (e) {
        technologies = [];
      }

      openPreview({
        title: btn.dataset.title,
        description: btn.dataset.description,
        live: btn.dataset.live,
        thumbnail: btn.dataset.thumbnail,
        technologies: technologies
      });
    });
  });

  document.getElementById('previewCloseBtn').addEventListener('click', closePreview);
  document.getElementById('previewCloseBtn2').addEventListener('click', closePreview);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closePreview();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePreview();
  });
});