/* utils.js — shared helpers ------------------------------------------------ */

/** Honour the user's reduced-motion preference everywhere. */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True on fine-pointer (mouse) devices — gates the custom cursor / tilt. */
export const isFinePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Linear interpolation — the backbone of smooth cursor / parallax easing. */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Clamp a number to a range. */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Trailing debounce — for resize and other bursty events. */
export function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** rAF throttle — fire at most once per frame (scroll/mousemove). */
export function rafThrottle(fn) {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { fn.apply(this, args); ticking = false; });
  };
}

/** Query helpers. */
export const $  = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
