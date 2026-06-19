/* navigation.js — sticky nav, active links, mobile menu, progress, theme,
   back-to-top, smooth anchors ---------------------------------------------- */
import { $, $$, rafThrottle } from './utils.js';
import { scrollTo } from './smooth-scroll.js';

export function initNavigation() {
  const nav      = $('#nav');
  const burger   = $('#navBurger');
  const navList  = $('#navList');
  const progress = $('#scrollProgress');
  const toTop    = $('#toTop');
  const links    = $$('[data-nav]');
  const sections = links
    .map((l) => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  /* —— sticky styling + scroll progress + back-to-top —— */
  const onScroll = rafThrottle(() => {
    const y = window.scrollY;
    nav?.classList.toggle('is-scrolled', y > 24);
    toTop?.classList.toggle('is-visible', y > 600);

    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${(y / max) * 100}%`;
  });
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* —— active-section highlighting via IntersectionObserver —— */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      links.forEach((l) =>
        l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`)
      );
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));

  /* —— mobile menu —— */
  const closeMenu = () => {
    navList?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.setAttribute('aria-label', 'Open menu');
  };
  burger?.addEventListener('click', () => {
    const open = navList.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  /* —— smooth anchor navigation (Lenis-aware) —— */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollTo(target);
      history.replaceState(null, '', id);
    });
  });

  /* —— escape closes mobile menu —— */
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}

/* —— Theme switcher: dark / light / auto, persisted in localStorage —— */
export function initTheme() {
  const toggle = $('#themeToggle');
  const root   = document.documentElement;
  const order  = ['dark', 'light', 'auto'];
  const system = matchMedia('(prefers-color-scheme: light)');

  const resolve = (mode) => (mode === 'auto' ? (system.matches ? 'light' : 'dark') : mode);
  const apply   = (mode) => {
    root.dataset.theme = resolve(mode);
    root.dataset.themeMode = mode;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolve(mode) === 'light' ? '#f6f6fb' : '#06060a');
  };

  let mode = localStorage.getItem('theme') || 'dark';
  apply(mode);

  toggle?.addEventListener('click', () => {
    mode = order[(order.indexOf(mode) + 1) % order.length];
    localStorage.setItem('theme', mode);
    apply(mode);
    toggle.title = `Theme: ${mode}`;
  });

  system.addEventListener('change', () => { if (mode === 'auto') apply('auto'); });
}
