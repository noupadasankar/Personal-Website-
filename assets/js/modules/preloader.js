/* preloader.js — counter + bar, resolves when the page is ready ------------ */
import { $, prefersReducedMotion } from './utils.js';

/**
 * Runs the intro loader and resolves once it's dismissed, so the hero
 * timeline can start exactly when the curtain lifts.
 */
export function initPreloader() {
  return new Promise((resolve) => {
    const el    = $('#preloader');
    const fill  = $('#preloaderFill');
    const count = $('#preloaderCount');
    if (!el) return resolve();

    const finish = () => {
      el.classList.add('is-done');
      document.body.style.overflow = '';
      setTimeout(resolve, 200);
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    };

    // Reduced motion → no theatrics, just clear it.
    if (prefersReducedMotion()) { finish(); return; }

    document.body.style.overflow = 'hidden';
    let pct = 0;
    const tick = setInterval(() => {
      // Ease toward 100, slowing near the end for a premium feel.
      pct += Math.max(1, (100 - pct) * 0.12);
      if (pct >= 100) { pct = 100; clearInterval(tick); setTimeout(finish, 280); }
      if (fill)  fill.style.width = `${pct}%`;
      if (count) count.textContent = Math.round(pct);
    }, 90);
  });
}
