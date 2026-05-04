(function () {
  'use strict';

  // ─── Topbar: добавя сянка при скролване ──────────────────────
  var topbar = document.querySelector('.topbar');
  if (topbar) {
    function onScroll() {
      topbar.classList.toggle('topbar--scrolled', window.scrollY > 4);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─── Scroll reveal (не се активира при намалено движение) ────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SELECTORS = [
    '.card',
    '.category-feature-card',
    '.seo-copy__inner',
    '.auth-card',
    '.auth-side',
    '.listing-detail',
    '.listing-form-section',
    '.profile-section',
    '.admin-stat',
    '.admin-table-wrap',
  ].join(',');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

  function setup() {
    var parentCount = new WeakMap();
    document.querySelectorAll(SELECTORS).forEach(function (el) {
      var parent = el.parentElement;
      var idx = parentCount.has(parent) ? parentCount.get(parent) : 0;
      parentCount.set(parent, idx + 1);
      el.style.setProperty('--reveal-delay', (Math.min(idx * 0.07, 0.28)) + 's');
      el.classList.add('reveal-ready');
      io.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
