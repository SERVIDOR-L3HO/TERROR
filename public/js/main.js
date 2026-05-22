// ====== LOADING SCREEN ======
window.addEventListener('load', () => {
  setTimeout(() => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
  }, 1500);
});

// ====== NAVBAR ======
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
}

// ====== SCROLL EFFECTS ======
window.addEventListener('scroll', () => {
  // Reading progress bar
  const progress = document.getElementById('readingProgress');
  if (progress) {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = `${pct}%`;
  }

  // Fade-in on scroll
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) el.classList.add('visible');
  });
});

// ====== PARTICLES ======
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = window.innerWidth < 768 ? 15 : 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: ${Math.random() * 0.5};
    `;
    container.appendChild(p);
  }
}
createParticles();

// ====== DRIPS (Hero) ======
function createDrips() {
  const container = document.getElementById('drips');
  if (!container) return;
  const count = 15;
  for (let i = 0; i < count; i++) {
    const drip = document.createElement('div');
    drip.className = 'drip';
    drip.style.cssText = `
      animation-duration: ${Math.random() * 3 + 2}s;
      animation-delay: ${Math.random() * 5}s;
      width: ${Math.random() * 3 + 1}px;
    `;
    container.appendChild(drip);
  }
}
createDrips();

// ====== CURSOR TRAIL ======
if (window.innerWidth > 768) {
  const trails = [];
  const trailCount = 8;
  for (let i = 0; i < trailCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'cursor-trail';
    dot.style.opacity = (1 - i / trailCount) * 0.7;
    dot.style.width = dot.style.height = `${6 - i * 0.5}px`;
    document.body.appendChild(dot);
    trails.push({ el: dot, x: 0, y: 0 });
  }

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  function animateTrail() {
    let x = mouseX, y = mouseY;
    trails.forEach((trail, i) => {
      trail.el.style.left = (x - 3) + 'px';
      trail.el.style.top = (y - 3) + 'px';
      const prev = trails[i - 1];
      if (prev) { x = prev.x; y = prev.y; }
      trail.x = x; trail.y = y;
    });
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
}

// ====== TOAST NOTIFICATIONS ======
window.showToast = function(msg, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = msg;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 4000);
};

// ====== INITIAL FADE-IN TRIGGER ======
setTimeout(() => {
  document.querySelectorAll('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) el.classList.add('visible');
  });
}, 200);

// ====== HORROR FLICKER on Title ======
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
  setInterval(() => {
    if (Math.random() > 0.97) {
      heroTitle.style.opacity = '0.3';
      setTimeout(() => { heroTitle.style.opacity = '1'; }, 80);
      setTimeout(() => { heroTitle.style.opacity = '0.7'; }, 120);
      setTimeout(() => { heroTitle.style.opacity = '1'; }, 200);
    }
  }, 1000);
}
