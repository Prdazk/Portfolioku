document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('previewOverlay');
  const titleEl = document.getElementById('previewTitle');
  const descEl = document.getElementById('previewDescription');
  const techBadgesEl = document.getElementById('previewTechBadges');

  const imgEl = document.getElementById('previewImage');
  const placeholderEl = document.getElementById('previewPlaceholder');
  const prevBtn = document.getElementById('previewPrevBtn');
  const nextBtn = document.getElementById('previewNextBtn');
  const counterEl = document.getElementById('previewImageCounter');

  let currentImages = [];
  let currentIndex = 0;

  function renderImage(animate) {
    if (currentImages.length === 0) {
      imgEl.style.display = 'none';
      placeholderEl.style.display = 'flex';
      counterEl.style.display = 'none';
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      return;
    }

    function applyImage() {
      imgEl.src = currentImages[currentIndex];
      imgEl.style.display = 'block';
      placeholderEl.style.display = 'none';

      if (currentImages.length > 1) {
        counterEl.textContent = (currentIndex + 1) + ' / ' + currentImages.length;
        counterEl.style.display = 'block';
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
      } else {
        counterEl.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      }

      requestAnimationFrame(function () {
        imgEl.classList.remove('is-fading');
      });
    }

    if (animate) {
      imgEl.classList.add('is-fading');
      setTimeout(applyImage, 200);
    } else {
      applyImage();
    }
  }

  function openPreview(data) {
    titleEl.textContent = data.title.toUpperCase();
    descEl.textContent = data.description || 'Tidak ada deskripsi.';

    techBadgesEl.innerHTML = '';
    (data.technologies || []).forEach(function (tech) {
      const span = document.createElement('span');
      span.textContent = tech;
      techBadgesEl.appendChild(span);
    });

    currentImages = data.images || [];
    currentIndex = 0;
    renderImage();

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
      imgEl.src = '';
    }, 250);
  }

  prevBtn.addEventListener('click', function () {
    if (currentImages.length === 0) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    renderImage(true);
  });

  nextBtn.addEventListener('click', function () {
    if (currentImages.length === 0) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    renderImage(true);
  });

  document.querySelectorAll('.js-preview-project').forEach(function (btn) {
    btn.addEventListener('click', function () {
      let images = [];
      let technologies = [];
      try {
        images = JSON.parse(btn.dataset.images || '[]');
      } catch (e) {
        images = [];
      }
      try {
        technologies = JSON.parse(btn.dataset.technologies || '[]');
      } catch (e) {
        technologies = [];
      }

      openPreview({
        title: btn.dataset.title,
        description: btn.dataset.description,
        images: images,
        technologies: technologies
      });
    });
  });

  document.getElementById('previewCloseBtn2').addEventListener('click', closePreview);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closePreview();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePreview();
  });
});
