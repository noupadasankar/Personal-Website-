/* animations.js — scroll reveals, count-up stats, progress rings ----------- */
import { $$, prefersReducedMotion } from './utils.js';

/**
 * Reveal [data-reveal] elements on scroll. Uses GSAP ScrollTrigger when
 * available (with a gentle stagger for grouped items), else an
 * IntersectionObserver fallback. Reduced-motion shows everything instantly.
 */
export function initReveals() {
  const items = $$('[data-reveal]').filter((el) => !el.closest('.hero'));

  if (prefersReducedMotion()) { items.forEach((el) => el.classList.add('is-in')); return; }

  if (window.gsap && window.ScrollTrigger) {
    const { gsap } = window;
    items.forEach((el) => {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        onStart: () => el.classList.add('is-in'),
      });
    });
    return;
  }

  // Fallback
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  items.forEach((el) => io.observe(el));
}

/** Animate a number from 0 → target when it scrolls into view. */
function countUp(el) {
  const target = parseFloat(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || '';
  const dur = 1600;
  let start;

  const step = (ts) => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Wire count-up + circular ring fills to a single observer. */
export function initCounters() {
  const nums  = $$('[data-count]');
  const rings = $$('.ring');

  if (prefersReducedMotion()) {
    nums.forEach((n) => (n.textContent = (n.dataset.count || '') + (n.dataset.suffix || '')));
    rings.forEach((r) => fillRing(r, false));
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      if (e.target.matches('[data-count]')) countUp(e.target);
      if (e.target.matches('.ring'))        fillRing(e.target, true);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.4 });

  [...nums, ...rings].forEach((el) => io.observe(el));
}

/** Set a ring's stroke-dashoffset based on its data-ring percentage. */
function fillRing(ring, animate) {
  const pct = parseFloat(ring.dataset.ring) || 0;
  const fill = ring.querySelector('.ring__fill');
  if (!fill) return;
  const C = 2 * Math.PI * 52; // r = 52 (matches SVG)
  fill.style.strokeDasharray = C;
  if (!animate) fill.style.transition = 'none';
  // next frame so the transition registers
  requestAnimationFrame(() => { fill.style.strokeDashoffset = C * (1 - pct / 100); });
}
