/* cursor.js — custom cursor, trailing dot, contextual labels & magnetic ----- */
import { $, $$, lerp, isFinePointer, prefersReducedMotion, rafThrottle } from './utils.js';

export function initCursor() {
  if (!isFinePointer() || prefersReducedMotion()) return;

  const ring = $('#cursor');
  const dot  = $('#cursorDot');
  if (!ring || !dot) return;

  // Inject the contextual label (e.g. "VIEW" over a project card).
  const label = document.createElement('span');
  label.className = 'cursor__label';
  ring.appendChild(label);

  document.body.classList.add('has-cursor');

  // Target = real mouse; ring lerps toward it for a smooth trailing feel.
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;
  let visible = false;

  addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    if (!visible) { visible = true; document.body.classList.add('cursor-active'); }
  }, { passive: true });

  // Hide the cursor when it leaves the window; restore on return.
  addEventListener('mouseout', (e) => { if (!e.relatedTarget) document.body.classList.remove('cursor-active'); });
  addEventListener('mousedown', () => ring.classList.add('is-down'));
  addEventListener('mouseup',   () => ring.classList.remove('is-down'));

  const render = () => {
    rx = lerp(rx, mx, 0.18);
    ry = lerp(ry, my, 0.18);
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);

  // Generic hover grow on anything interactive.
  $$('a, button, [data-magnetic], .filter__btn, input, textarea').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
  });

  // Contextual label: explicit [data-cursor="text"], or "View" on project cards.
  $$('[data-cursor], .project').forEach((el) => {
    const text = (el.dataset.cursor || (el.classList.contains('project') ? 'View' : '')).trim();
    el.addEventListener('mouseenter', () => {
      ring.classList.add('is-hover');
      if (text) { ring.classList.add('is-label'); label.textContent = text; }
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('is-hover', 'is-label');
      label.textContent = '';
    });
  });
}

/** Magnetic attraction: elements drift toward the cursor on hover. */
export function initMagnetic() {
  if (!isFinePointer() || prefersReducedMotion()) return;

  $$('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetStrength) || 0.35;
    const onMove = rafThrottle((e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}
