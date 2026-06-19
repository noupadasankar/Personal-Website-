/* =============================================================
   main.js — application entry point
   Orchestrates the boot sequence and wires every module together.
   ES6 modules · runs after DOM parse (script is type="module", deferred).
============================================================= */
import { $ } from './modules/utils.js';
import { renderContent } from './modules/content.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initPreloader } from './modules/preloader.js';
import { initCursor, initMagnetic } from './modules/cursor.js';
import { initNavigation, initTheme } from './modules/navigation.js';
import { buildHeroTimeline, initTypewriter, initHeroParallax } from './modules/hero.js';
import { initHeroWebGL } from './modules/hero-webgl.js';
import { initReveals, initCounters } from './modules/animations.js';
import { initFilter, initTilt, initProjectModal } from './modules/projects.js';
import { initContactForm } from './modules/contact.js';

/* —— Static niceties that don't depend on the loader —— */
function initChrome() {
  // Dynamic year in footer
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Console easter egg 🥚
  const brand = 'color:#7c5cff;font:600 14px Space Grotesk,sans-serif';
  const soft  = 'color:#7a7b8c;font:13px Inter,sans-serif';
  console.log('%cNoupada Sankar — Full Stack Engineer', brand);
  console.log('%cLike what you see under the hood? Let\'s talk → noupadashankar78@gmail.com', soft);
  console.log('%cBuilt from scratch with vanilla JS, GSAP & Lenis. No framework was harmed. 🛠️', soft);
}

/* —— Boot sequence —— */
function boot() {
  // Theme first (avoids a flash of the wrong palette).
  initTheme();

  // Hydrate links + project cards from config.js BEFORE anything queries them.
  renderContent();

  initChrome();

  // Smooth scroll wires Lenis into the GSAP ticker.
  initSmoothScroll();

  // Persistent UI.
  initNavigation();
  initCursor();
  initMagnetic();

  // Section behaviours (these self-gate on reduced-motion internally).
  initReveals();
  initCounters();
  initTypewriter();
  initHeroParallax();
  initHeroWebGL();        // async, lazy-loads Three.js; self-gates & enhances progressively
  initFilter();
  initTilt();
  initProjectModal();
  initContactForm();

  // Build the hero intro now, play it the instant the preloader lifts.
  const heroTl = buildHeroTimeline();
  initPreloader().then(() => {
    heroTl?.play();
    // Recalculate ScrollTrigger positions once everything is laid out.
    window.ScrollTrigger?.refresh();
  });
}

// type="module" scripts are deferred, so the DOM is ready — but guard anyway.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
