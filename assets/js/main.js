(function () {
  'use strict';

  // The hero video autoplays by default (HTML attribute) so it still works
  // without JS. Here we back off for anyone who has asked for less motion.
  var video = document.querySelector('.hero-video');
  if (!video) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    video.removeAttribute('autoplay');
    video.pause();
  }
})();

(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  function closeMenu() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.addEventListener('click', function (event) {
    if (event.target.tagName === 'A') closeMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });
})();

(function () {
  'use strict';

  // "Services" and "Areas" each carry a caret button that expands a
  // submenu of their sub-pages. Desktop also reveals it on hover/focus
  // (pure CSS), but touch has no hover, so the click handling here is
  // what mobile relies on.
  var toggles = document.querySelectorAll('.nav-submenu-toggle');
  if (!toggles.length) return;

  function closeSubmenu(toggle) {
    toggle.closest('.nav-item--has-submenu').classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  Array.prototype.forEach.call(toggles, function (toggle) {
    toggle.addEventListener('click', function () {
      var item = toggle.closest('.nav-item--has-submenu');
      var isOpen = item.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));

      Array.prototype.forEach.call(toggles, function (other) {
        if (other !== toggle) closeSubmenu(other);
      });
    });
  });

  document.addEventListener('click', function (event) {
    Array.prototype.forEach.call(toggles, function (toggle) {
      var item = toggle.closest('.nav-item--has-submenu');
      if (!item.contains(event.target)) closeSubmenu(toggle);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    Array.prototype.forEach.call(toggles, closeSubmenu);
  });
})();

(function () {
  'use strict';

  var trigger = document.querySelector('[data-lightbox-trigger]');
  var dialog = document.querySelector('.lightbox');
  var closeBtn = dialog && dialog.querySelector('[data-lightbox-close]');
  if (!trigger || !dialog || !closeBtn) return;

  trigger.addEventListener('click', function () {
    dialog.showModal();
  });

  closeBtn.addEventListener('click', function () {
    dialog.close();
  });

  // Click on the ::backdrop still bubbles to the dialog, so tell it apart
  // from a click inside the dialog's own box by comparing coordinates.
  dialog.addEventListener('click', function (event) {
    var box = dialog.getBoundingClientRect();
    var clickedOutside = event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom;
    if (clickedOutside) dialog.close();
  });
})();

(function () {
  'use strict';

  // Browsers that support `animation-timeline: view()` already get the
  // scroll-linked reveal straight from CSS. This is only for engines that
  // don't (Firefox, at the time of writing) — everyone else's content
  // starts fully visible and stays that way if this script never runs.
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var hasNativeSupport = window.CSS && CSS.supports &&
    CSS.supports('animation-timeline: view()');
  if (hasNativeSupport) return;

  if (!('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll(
    '.vacant-band, .results-card, .service-card, .how li, .path-presale, .path-movein'
  );
  if (!targets.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  Array.prototype.forEach.call(targets, function (target) {
    target.classList.add('reveal-pending');
    observer.observe(target);
  });
})();
