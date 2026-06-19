/* smooth-scroll.js — Lenis smooth scrolling synced with GSAP ScrollTrigger -- */
import { prefersReducedMotion } from './utils.js';

let lenis = null;

export function initSmoothScroll() {
  // Respect reduced-motion and bail if the Lenis CDN failed to load.
  if (prefersReducedMotion() || typeof window.Lenis === 'undefined') return null;

  lenis = new window.Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  // Drive Lenis from GSAP's ticker so scroll + animations share one clock.
  if (window.gsap) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  document.documentElement.classList.add('lenis');
  return lenis;
}

/** Smoothly scroll to a target (string selector or element). */
export function scrollTo(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.2, ...opts });
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}

export const getLenis = () => lenis;
