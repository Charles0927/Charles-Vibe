(function () {
  const starCanvas = document.querySelector('#starfield');
  const starContext = starCanvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stars = [];
  let starAnimation = 0;
  let starWidth = 0;
  let starHeight = 0;

  function seedStarfield() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    starWidth = window.innerWidth;
    starHeight = window.innerHeight;
    starCanvas.width = Math.round(starWidth * pixelRatio);
    starCanvas.height = Math.round(starHeight * pixelRatio);
    starCanvas.style.width = `${starWidth}px`;
    starCanvas.style.height = `${starHeight}px`;
    starContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const count = Math.min(520, Math.max(170, Math.round(starWidth * starHeight / 5200)));
    const palette = [[239, 231, 212], [166, 201, 217], [218, 195, 153], [224, 229, 226]];
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * starWidth,
      y: Math.random() * starHeight,
      radius: Math.random() < .12 ? .9 + Math.random() * 1.1 : .35 + Math.random() * .65,
      opacity: .18 + Math.random() * .55,
      speed: .00025 + Math.random() * .0012,
      phase: Math.random() * Math.PI * 2,
      color: palette[Math.floor(Math.random() * palette.length)],
      glint: Math.random() < .075
    }));
    drawStarfield(performance.now());
  }

  function drawStarfield(time) {
    starContext.clearRect(0, 0, starWidth, starHeight);
    for (const star of stars) {
      const shimmer = reducedMotion.matches ? .72 : .5 + Math.sin(time * star.speed + star.phase) * .5;
      const alpha = star.opacity * (.34 + shimmer * .66);
      const [red, green, blue] = star.color;
      starContext.beginPath();
      starContext.arc(star.x, star.y, star.radius * (star.glint ? .8 + shimmer * .45 : 1), 0, Math.PI * 2);
      starContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      if (star.glint && shimmer > .78) {
        starContext.shadowBlur = 5 + shimmer * 8;
        starContext.shadowColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      } else {
        starContext.shadowBlur = 0;
      }
      starContext.fill();
    }
    starContext.shadowBlur = 0;
    if (!reducedMotion.matches && !document.hidden) starAnimation = window.requestAnimationFrame(drawStarfield);
  }

  seedStarfield();
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(starAnimation);
    seedStarfield();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    window.cancelAnimationFrame(starAnimation);
    if (!document.hidden) drawStarfield(performance.now());
  });
  reducedMotion.addEventListener('change', () => {
    window.cancelAnimationFrame(starAnimation);
    drawStarfield(performance.now());
  });

  const content = window.siteContent;
  const grid = document.querySelector('#gallery-grid');
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxCount = lightbox.querySelector('.lightbox-count');
  const lightboxTitle = lightbox.querySelector('.lightbox-title');
  const heroImage = document.querySelector('.hero-image img');
  const documentRoot = document.documentElement;
  const shuffleButton = document.querySelector('.hero-shuffle');
  const heroCaptionTitle = document.querySelector('.hero-caption-title');
  const heroCaptionCount = document.querySelector('.hero-caption-count');
  const collectionTitle = document.querySelector('#collection-title');
  const collectionCode = document.querySelector('#collection-code');
  const collectionCount = document.querySelector('#collection-count');
  const filmDisplay = document.querySelector('#film-display');
  const filmControl = document.querySelector('#film-control');
  const filmUnroll = document.querySelector('#film-unroll');
  const filmStatus = document.querySelector('#film-status');
  const cartridgeBrand = document.querySelector('#cartridge-brand');
  const cartridgeStock = document.querySelector('#cartridge-stock');
  const cartridgeDetail = document.querySelector('#cartridge-detail');
  const cartridgeExp = document.querySelector('#cartridge-exp');
  const filmStockCount = document.querySelector('#film-stock-count');
  const orderedPhotos = new Map();
  const allPhotos = content.collections.flatMap((collection) => collection.photos);
  let activeCollection = 'hong-kong';
  let currentPhotos = [];
  let currentIndex = 0;
  let heroFrame = allPhotos[Math.floor(Math.random() * allPhotos.length)];
  let frameNumber = 1;
  const heroTransition = { token: 0, timer: 0 };
  const lightboxTransition = { token: 0, timer: 0 };
  const filmStocks = [
    { id: 'gold200', brand: 'KODAK', name: 'GOLD 200', detail: 'COLOR · 200', exp: '36 EXP', color: '#e5bd32', ink: '#24231d', accent: '#bd2026' },
    { id: 'ultramax400', brand: 'KODAK', name: 'ULTRAMAX 400', detail: 'COLOR · 400', exp: '36 EXP', color: '#252b2a', ink: '#f0d34c', accent: '#f0d34c' },
    { id: '5294', brand: 'KODAK', name: '5294', detail: 'VISION · 500T', exp: 'MOTION', color: '#d1d1c5', ink: '#292c2a', accent: '#315765' }
  ];
  let filmStockIndex = 0;
  let ribbonModelIndex = 0;
  let filmClickTimer;
  let filmCloseTimer;

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  content.collections.forEach((collection) => orderedPhotos.set(collection.id, shuffle(collection.photos)));

  heroImage.addEventListener('load', () => applyPhotoAtmosphere(heroImage));
  heroImage.src = heroFrame.src;
  heroImage.alt = heroFrame.alt;
  heroCaptionTitle.textContent = localized(heroFrame.title);

  function localized(value) {
    return typeof value === 'string' ? value : value[content.lang] || value.en || '';
  }

  function applyPhotoAtmosphere(image) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0;
      let green = 0;
      let blue = 0;
      let samples = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] < 32) continue;
        red += pixels[index];
        green += pixels[index + 1];
        blue += pixels[index + 2];
        samples += 1;
      }
      if (!samples) return;
      red /= samples;
      green /= samples;
      blue /= samples;
      const luminance = red * .2126 + green * .7152 + blue * .0722;
      const ambient = [red, green, blue].map((channel) => Math.round(12 + (luminance + (channel - luminance) * .48) * .2));
      const panel = ambient.map((channel) => Math.min(channel + 8, 72));
      documentRoot.style.setProperty('--scene-bg', `rgb(${ambient.join(' ')})`);
      documentRoot.style.setProperty('--scene-panel', `rgb(${panel.join(' ')})`);
      documentRoot.style.setProperty('--scene-glow', `rgba(${Math.round(red)} ${Math.round(green)} ${Math.round(blue)} / .14)`);
    } catch {
      documentRoot.style.setProperty('--scene-bg', '#111416');
      documentRoot.style.setProperty('--scene-panel', '#181c1f');
      documentRoot.style.setProperty('--scene-glow', 'rgba(110 125 132 / .12)');
    }
  }

  function transitionImage(image, photo, state, onSwap, options = {}) {
    window.clearTimeout(state.timer);
    window.clearTimeout(state.restoreTimer);
    const token = ++state.token;
    if (options.parent) options.parent.classList.add('is-transitioning');
    image.classList.add('is-changing');
    const incoming = new Image();
    const swap = () => {
      if (token !== state.token) return;
      state.timer = window.setTimeout(() => {
        if (token !== state.token) return;
        image.src = photo.src;
        image.alt = photo.alt;
        if (options.ambient) applyPhotoAtmosphere(incoming);
        if (onSwap) onSwap();
        if (options.parent) {
          state.restoreTimer = window.setTimeout(() => {
            if (token === state.token) options.parent.classList.remove('is-transitioning');
          }, options.fadeIn ?? 0);
        }
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
          if (token === state.token) image.classList.remove('is-changing');
        }));
      }, options.hold ?? 180);
    };
    incoming.onload = swap;
    incoming.onerror = swap;
    incoming.src = photo.src;
  }

  function renderFilmStock() {
    const stock = filmStocks[filmStockIndex];
    filmDisplay.style.setProperty('--stock-color', stock.color);
    filmDisplay.style.setProperty('--stock-ink', stock.ink);
    filmDisplay.style.setProperty('--stock-accent', stock.accent);
    filmDisplay.dataset.stock = stock.id;
    cartridgeBrand.textContent = stock.brand;
    cartridgeStock.textContent = stock.name;
    cartridgeDetail.textContent = stock.detail;
    cartridgeExp.textContent = stock.exp;
    filmStockCount.textContent = `${String(filmStockIndex + 1).padStart(2, '0')} / 03`;
    filmControl.setAttribute('aria-label', content.labels[content.lang].filmButtonAria.replace('{stock}', `${stock.brand} ${stock.name}`));
  }

  function cycleFilmStock() {
    filmStockIndex = (filmStockIndex + 1) % filmStocks.length;
    renderFilmStock();
    filmStatus.textContent = content.labels[content.lang].filmChanged.replace('{stock}', `${filmStocks[filmStockIndex].brand} ${filmStocks[filmStockIndex].name}`);
  }

  function toggleFilm() {
    const willOpen = !filmDisplay.classList.contains('is-open');
    if (willOpen) {
      window.clearTimeout(filmCloseTimer);
      const models = [1, 2, 3].filter((model) => model !== ribbonModelIndex);
      ribbonModelIndex = models[Math.floor(Math.random() * models.length)];
      filmDisplay.dataset.ribbon = String(ribbonModelIndex);
      filmDisplay.classList.remove('is-closing');
      filmDisplay.classList.add('is-open');
    } else {
      filmDisplay.classList.add('is-closing');
      filmCloseTimer = window.setTimeout(() => {
        filmDisplay.classList.remove('is-open', 'is-closing');
      }, 480);
    }
    const isOpen = willOpen;
    filmControl.setAttribute('aria-expanded', String(isOpen));
    filmUnroll.setAttribute('aria-hidden', String(!isOpen));
    filmStatus.textContent = content.labels[content.lang][isOpen ? 'filmOpened' : 'filmClosed'];
  }

  function renderGallery(collectionId, animate = true) {
    const collection = content.collections.find((item) => item.id === collectionId);
    if (!collection) return;
    activeCollection = collectionId;
    currentPhotos = orderedPhotos.get(collectionId);
    grid.classList.toggle('is-refreshing', animate);
    window.setTimeout(() => {
      collectionTitle.textContent = localized(collection.title);
      collectionCode.textContent = collection.code;
      collectionCount.textContent = content.labels[content.lang].collectionCount.replace('{count}', currentPhotos.length);
      grid.innerHTML = currentPhotos.map((photo, index) => `
        <button class="gallery-card" type="button" data-index="${index}" aria-label="${localized(photo.title)}">
          <span class="card-image"><img src="${photo.src}" alt="${localized(photo.alt)}" loading="lazy" decoding="async" /></span>
          <span class="card-caption"><strong>${localized(photo.title)}</strong><small>${photo.meta}</small></span>
        </button>`).join('');
      grid.querySelectorAll('.gallery-card').forEach((card, index) => {
        card.style.setProperty('--card-index', index % 10);
        card.addEventListener('click', () => openLightbox(Number(card.dataset.index)));
      });
      grid.classList.remove('is-refreshing');
    }, animate ? 180 : 0);
  }

  function openLightbox(index) {
    currentIndex = index;
    const photo = currentPhotos[currentIndex];
    const updateCaption = () => {
      lightboxCount.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(currentPhotos.length).padStart(2, '0')}`;
      lightboxTitle.textContent = localized(photo.title);
    };
    if (lightbox.classList.contains('is-open')) {
      transitionImage(lightboxImage, photo, lightboxTransition, updateCaption);
    } else {
      lightboxImage.classList.remove('is-changing');
      lightboxImage.src = photo.src;
      lightboxImage.alt = photo.alt;
      updateCaption();
    }
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeLightbox() {
    window.clearTimeout(lightboxTransition.timer);
    lightboxTransition.token += 1;
    lightboxImage.classList.remove('is-changing');
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function moveLightbox(direction) {
    openLightbox((currentIndex + direction + currentPhotos.length) % currentPhotos.length);
  }

  function shuffleHeroFrame() {
    const choices = allPhotos.filter((photo) => photo !== heroFrame);
    heroFrame = choices[Math.floor(Math.random() * choices.length)];
    frameNumber += 1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    transitionImage(heroImage, heroFrame, heroTransition, () => {
      heroCaptionTitle.textContent = localized(heroFrame.title);
      heroCaptionCount.textContent = `${String(frameNumber).padStart(2, '0')} / ${String(allPhotos.length).padStart(2, '0')}`;
    }, {
      parent: heroImage.closest('.hero-frame'),
      hold: reducedMotion ? 0 : 420,
      fadeIn: reducedMotion ? 0 : 760,
      ambient: true
    });
  }

  function setLanguage(language) {
    content.lang = language;
    document.documentElement.lang = { en: 'en', zh: 'zh-CN', ja: 'ja', ko: 'ko' }[language];
    document.querySelectorAll('[data-label]').forEach((element) => {
      const key = element.dataset.label;
      if (content.labels[language][key]) element.innerHTML = content.labels[language][key];
    });
    document.querySelectorAll('[data-label-aria]').forEach((element) => {
      const label = content.labels[language][element.dataset.labelAria];
      if (label) element.setAttribute('aria-label', label);
    });
    document.querySelector('.language-toggle').setAttribute('aria-label', content.labels[language].languageLabel);
    renderFilmStock();
    heroCaptionTitle.textContent = localized(heroFrame.title);
    heroImage.alt = localized(heroFrame.alt);
    if (lightbox.classList.contains('is-open')) lightboxImage.alt = localized(currentPhotos[currentIndex].alt);
    document.querySelectorAll('.collection-tab').forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.collection === activeCollection));
      tab.classList.toggle('is-active', tab.dataset.collection === activeCollection);
    });
    renderGallery(activeCollection, false);
  }

  renderGallery(activeCollection, false);
  renderFilmStock();
  filmControl.addEventListener('click', () => {
    if (filmClickTimer) window.clearTimeout(filmClickTimer);
    filmClickTimer = window.setTimeout(() => {
      cycleFilmStock();
      filmClickTimer = null;
    }, 260);
  });
  filmControl.addEventListener('dblclick', () => {
    if (filmClickTimer) window.clearTimeout(filmClickTimer);
    filmClickTimer = null;
    toggleFilm();
  });
  filmControl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      cycleFilmStock();
    } else if (event.key === ' ') {
      event.preventDefault();
      toggleFilm();
    }
  });
  shuffleButton.addEventListener('click', shuffleHeroFrame);
  document.querySelectorAll('[data-collection]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-collection]').forEach((item) => {
      const active = item.dataset.collection === button.dataset.collection;
      item.classList.toggle('is-active', active);
      if (item.classList.contains('roll-row')) item.classList.toggle('active', active);
      if (item.matches('[role="tab"]')) item.setAttribute('aria-selected', String(active));
    });
    renderGallery(button.dataset.collection);
    if (button.classList.contains('roll-row')) document.querySelector('#work').scrollIntoView({ behavior: 'smooth' });
  }));
  document.querySelector('.language-toggle').addEventListener('change', (event) => setLanguage(event.target.value));
  document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox-prev').addEventListener('click', () => moveLightbox(-1));
  document.querySelector('.lightbox-next').addEventListener('click', () => moveLightbox(1));
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });
  const menuToggle = document.querySelector('.menu-toggle');
  menuToggle.addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => document.body.classList.remove('nav-open')));
})();

