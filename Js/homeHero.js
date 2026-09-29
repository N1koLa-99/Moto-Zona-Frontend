(function () {
  'use strict';

  var hero = document.getElementById('hero');
  if (!hero) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var topbar        = document.querySelector('.topbar');

  // ─── Бутони ───────────────────────────────────────────────────
  // „Качи обява“ минава през същата логика като бутона в навигацията (login redirect и т.н.)
  var heroUploadBtn = document.getElementById('heroUploadBtn');
  var topbarUploadBtn = document.getElementById('topbarUploadBtn');
  if (heroUploadBtn && topbarUploadBtn) {
    heroUploadBtn.addEventListener('click', function () { topbarUploadBtn.click(); });
  }

  // Скрол до обявите с отчитане на sticky навигацията и банера
  function scrollToListings(event) {
    var target = document.getElementById('listingsSection');
    if (!target) return;
    event.preventDefault();
    var offset = topbar ? topbar.offsetHeight : 0;
    var banner = document.getElementById('devBanner');
    if (banner && banner.offsetParent !== null) offset += banner.offsetHeight;
    var top = target.getBoundingClientRect().top + window.scrollY - offset - 16;
    window.scrollTo({ top: top, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  ['heroBrowseBtn', 'heroScrollCue'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', scrollToListings);
  });

  // ─── Скрол прогрес в навигацията ──────────────────────────────
  function onScroll() {
    var y = window.scrollY;
    if (topbar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      topbar.style.setProperty('--sp', max > 0 ? Math.min(y / max, 1).toFixed(4) : '0');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reducedMotion) return;

  // ─── Сцена: наклон, светлина, скрол ──────────────────────────
  var mouse   = { x: 0, y: 0, tx: 0, ty: 0, gx: 70, gy: 45, tgx: 70, tgy: 45 };
  var visible = true;
  var rafId   = 0;
  var last    = {};

  function setVar(name, value) {
    if (last[name] === value) return;
    last[name] = value;
    hero.style.setProperty(name, value);
  }

  if (finePointer) {
    hero.addEventListener('pointermove', function (e) {
      var rect = hero.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      mouse.tx = px * 2 - 1;
      mouse.ty = py * 2 - 1;
      mouse.tgx = px * 100;
      mouse.tgy = py * 100;
    });
    hero.addEventListener('pointerleave', function () {
      mouse.tx = 0;
      mouse.ty = 0;
      mouse.tgx = 70;
      mouse.tgy = 45;
    });
  }

  function frame() {
    rafId = 0;

    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    mouse.gx += (mouse.tgx - mouse.gx) * 0.1;
    mouse.gy += (mouse.tgy - mouse.gy) * 0.1;

    var h = hero.offsetHeight || 1;
    var hp = Math.min(Math.max(window.scrollY / h, 0), 1);

    setVar('--mx', mouse.x.toFixed(3));
    setVar('--my', mouse.y.toFixed(3));
    setVar('--gx', mouse.gx.toFixed(1) + '%');
    setVar('--gy', mouse.gy.toFixed(1) + '%');
    setVar('--hp', hp.toFixed(3));

    if (visible) rafId = requestAnimationFrame(frame);
  }

  function run() {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) run();
    }).observe(hero);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      visible = false;
    } else if (hero.getBoundingClientRect().bottom > 0) {
      visible = true;
      run();
    }
  });

  run();
})();
