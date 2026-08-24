/* =========================================
   LAS VEGAS SOCCER LEAGUE — Main JavaScript
   ========================================= */

'use strict';

/* ===================== LANGUAGE ===================== */
const LVSL_DEFAULT_LANG = 'es';
const LVSL_STORAGE_KEY  = 'lvsl-lang';

function getSavedLang() {
  try {
    const saved = localStorage.getItem(LVSL_STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch (e) { /* private mode — fall through */ }
  return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : LVSL_DEFAULT_LANG;
}

function applyLang(lang) {
  const dict = (window.LVSL_TRANSLATIONS || {})[lang];
  if (!dict) return;

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const val = dict[el.dataset.i18n];
    if (val !== undefined) el.innerHTML = val;
  });

  // Attribute translations: data-i18n-attr="placeholder:key, aria-label:key"
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const val = dict[key];
      if (attr && val !== undefined) el.setAttribute(attr, val);
    });
  });

  const title = dict[document.body.dataset.pageTitleKey];
  if (title) document.title = title.replace(/<[^>]+>/g, '');

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
  });

  try { localStorage.setItem(LVSL_STORAGE_KEY, lang); } catch (e) { /* ignore */ }
}

function initLang() {
  applyLang(getSavedLang());
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
}

/* ===================== NAVBAR ===================== */
function initNav() {
  const navbar    = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (hamburger && mobileNav) {
    const toggle = (force) => {
      const open = force !== undefined ? force : !mobileNav.classList.contains('open');
      mobileNav.classList.toggle('open', open);
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    hamburger.addEventListener('click', () => toggle());
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) toggle(false);
    });
  }
}

/* ===================== SCROLL REVEAL ===================== */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('visible'), i * 70);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  items.forEach((el) => io.observe(el));
}

/* ===================== COUNTERS ===================== */
function initCounters() {
  const nums = document.querySelectorAll('[data-count]');
  if (!nums.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const start  = performance.now();
      const dur    = 1400;

      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach((el) => io.observe(el));
}

/* ===================== FAQ ACCORDION ===================== */
function initFaq() {
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const ans  = item.querySelector('.faq-a');
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '';
    });
  });

  // Keep an open answer sized correctly after a language switch or resize
  const resize = () => {
    document.querySelectorAll('.faq-item.open .faq-a').forEach((ans) => {
      ans.style.maxHeight = ans.scrollHeight + 'px';
    });
  };
  window.addEventListener('resize', resize, { passive: true });
  document.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => setTimeout(resize, 60)));
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', () => {
  initLang();
  initNav();
  initReveal();
  initCounters();
  initFaq();
});
