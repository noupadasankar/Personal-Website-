/* projects.js — category filtering, 3D tilt, and case-study modal ---------- */
import { $, $$, isFinePointer, prefersReducedMotion, clamp } from './utils.js';
import { createProjectViewer } from './project3d.js';

/* —— Filtering with smooth fade transitions —— */
export function initFilter() {
  const buttons = $$('.filter__btn');
  const cards   = $$('#workGrid .project');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const show = filter === 'all' || (card.dataset.category || '').includes(filter);
        card.style.transition = 'opacity .35s ease, transform .35s ease';
        if (show) {
          card.classList.remove('is-hidden');
          requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = ''; });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(.96)';
          setTimeout(() => card.classList.add('is-hidden'), 320);
        }
      });
    });
  });
}

/* —— 3D tilt on [data-tilt] cards (mouse only) —— */
export function initTilt() {
  if (!isFinePointer() || prefersReducedMotion()) return;

  $$('[data-tilt]').forEach((card) => {
    const max = 8; // degrees
    let raf = null;

    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5;
      const py = (e.clientY - r.top)  / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform =
          `perspective(900px) rotateX(${clamp(-py * max, -max, max)}deg) ` +
          `rotateY(${clamp(px * max, -max, max)}deg) translateZ(0)`;
      });
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* —— Case-study modal —— */
export function initProjectModal() {
  const modal = $('#projectModal');
  if (!modal) return;

  const els = {
    img:       $('#modalImg'),
    title:     $('#modalTitle'),
    tags:      $('#modalTags'),
    challenge: $('#modalChallenge'),
    solution:  $('#modalSolution'),
    result:    $('#modalResult'),
    live:      $('#modalLive'),
    repo:      $('#modalRepo'),
  };
  let lastFocused = null;

  // Real 3D project view (drag-to-rotate card). Falls back to the <img>.
  const media  = $('#modalMedia');
  const viewer = createProjectViewer($('#modalViewer'));

  const open = (project) => {
    const d = project.dataset;
    els.img.src = d.img || '';
    els.img.alt = `${d.title} preview`;
    // Mount the 3D card; on success the CSS hides the flat fallback image.
    viewer?.show(d.img).then((ok) => media?.classList.toggle('has-3d', !!ok));
    els.title.textContent = d.title || '';
    els.challenge.textContent = d.challenge || '';
    els.solution.textContent  = d.solution  || '';
    els.result.textContent    = d.result    || '';
    els.tags.innerHTML = (d.tags || '').split(',')
      .map((t) => `<li>${t.trim()}</li>`).join('');
    els.live.href = d.live || '#';
    els.repo.href = d.repo || '#';
    els.live.style.display = d.live && d.live !== '#' ? '' : 'none';
    els.repo.style.display = d.repo && d.repo !== '#' ? '' : 'none';

    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__close')?.focus();
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    viewer?.hide();
    lastFocused?.focus();
  };

  $$('#workGrid .project').forEach((p) => {
    p.addEventListener('click', () => open(p));
    p.setAttribute('tabindex', '0');
    p.setAttribute('role', 'button');
    p.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(p); }
    });
  });

  $$('[data-close-modal]', modal).forEach((el) => el.addEventListener('click', close));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}
