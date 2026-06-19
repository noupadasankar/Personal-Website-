/* hero.js — split-text reveal, rotating-role typewriter, parallax & blob ---- */
import { $, rafThrottle, isFinePointer, prefersReducedMotion } from './utils.js';

/** Wrap each character of a [data-split] element in spans for staggering. */
function splitChars(el) {
  const text = el.textContent.trim();
  el.textContent = '';
  const frag = document.createDocumentFragment();
  text.split('').forEach((ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    frag.appendChild(span);
  });
  el.appendChild(frag);
  return [...el.children];
}

/**
 * Build (but don't play) the hero intro timeline. Returns a GSAP timeline so
 * the orchestrator can start it after the preloader lifts.
 */
export function buildHeroTimeline() {
  const title = $('[data-split]');
  const chars = title ? splitChars(title) : [];

  if (prefersReducedMotion() || !window.gsap) {
    // No motion: just make sure everything is visible.
    document.querySelectorAll('.hero [data-reveal]').forEach((n) => n.classList.add('is-in'));
    return null;
  }

  const { gsap } = window;

  // Hero reveal items are driven by GSAP, not the CSS reveal observer — so
  // clear their hidden state first. .from() then animates from hidden →
  // this now-visible resting state.
  document.querySelectorAll('.hero [data-reveal]').forEach((n) => n.classList.add('is-in'));

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });

  tl.from('.hero__eyebrow', { y: 20, opacity: 0, duration: 0.6 })
    .from(chars, { yPercent: 120, opacity: 0, stagger: 0.03, duration: 0.8 }, '-=0.2')
    .from('.hero__role', { y: 24, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.hero__lead', { y: 24, opacity: 0, duration: 0.6 }, '-=0.35')
    .from('.hero__cta',  { y: 24, opacity: 0, duration: 0.6 }, '-=0.35')
    .from('.hero__social', { y: 24, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.scroll-indicator', { opacity: 0, duration: 0.6 }, '-=0.2')
    .from('.hero__blob', { scale: 0.6, opacity: 0, duration: 1.1, ease: 'power2.out' }, 0.2);

  return tl;
}

/** Typewriter that cycles through the data-roles list. */
export function initTypewriter() {
  const el = $('#roleRotate');
  if (!el) return;
  const roles = (el.dataset.roles || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!roles.length) return;

  if (prefersReducedMotion()) { el.textContent = roles[0]; return; }

  let i = 0, char = 0, deleting = false;
  const type = () => {
    const word = roles[i];
    el.textContent = word.slice(0, char);
    if (!deleting && char < word.length) { char++; setTimeout(type, 90); }
    else if (!deleting && char === word.length) { deleting = true; setTimeout(type, 1600); }
    else if (deleting && char > 0) { char--; setTimeout(type, 45); }
    else { deleting = false; i = (i + 1) % roles.length; setTimeout(type, 350); }
  };
  type();
}

/** Pointer-driven parallax on the hero blob + subtle layer shift. */
export function initHeroParallax() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  const blob  = $('#heroBlob');
  const inner = $('.hero__inner');
  const hero  = $('#hero');
  if (!hero) return;

  const onMove = rafThrottle((e) => {
    const cx = (e.clientX / innerWidth  - 0.5);
    const cy = (e.clientY / innerHeight - 0.5);
    if (blob)  blob.style.transform  = `translate(${cx * 40}px, ${cy * 40}px)`;
    if (inner) inner.style.transform = `translate(${cx * -10}px, ${cy * -8}px)`;
  });
  hero.addEventListener('mousemove', onMove);
  hero.addEventListener('mouseleave', () => {
    if (blob) blob.style.transform = '';
    if (inner) inner.style.transform = '';
  });
}
