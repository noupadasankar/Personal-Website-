/* content.js — render links + projects from config.js (single source) ------ */
import { CONFIG } from '../config.js';
import { $, $$ } from './utils.js';

/** Escape user text before it lands in HTML / attributes. */
const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* —— Apply every [data-link="key"] from CONFIG.links —— */
function applyLinks() {
  const L = CONFIG.links || {};
  $$('[data-link]').forEach((el) => {
    const key = el.dataset.link;
    let val = (L[key] || '').trim();

    // Empty → hide the link (its <li> if it lives in a list).
    if (!val) { (el.closest('li') || el).style.display = 'none'; return; }

    if (key === 'email') {
      el.setAttribute('href', `mailto:${val}`);
      if ('linkText' in el.dataset) el.textContent = val;
    } else {
      el.setAttribute('href', val);
    }
  });
}

/* —— Build a single project card (markup mirrors the original HTML) —— */
function projectCard(p) {
  const tags = (p.tags || []).map((t) => `<li>${esc(t)}</li>`).join('');
  return `
  <article class="project" data-category="${esc(p.category || '')}" data-tilt data-reveal
           data-title="${esc(p.title)}"
           data-tags="${esc((p.tags || []).join(','))}"
           data-challenge="${esc(p.challenge)}"
           data-solution="${esc(p.solution)}"
           data-result="${esc(p.result)}"
           data-img="${esc(p.image)}"
           data-live="${esc(p.live || '#')}"
           data-repo="${esc(p.repo || '#')}">
    <div class="project__media">
      <img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title + ' preview')}"
           loading="lazy" decoding="async" width="1200" height="750" />
      <div class="project__overlay"><span>View case study</span></div>
    </div>
    <div class="project__body">
      <div class="project__row">
        <h3 class="project__title">${esc(p.title)}</h3>
        <span class="project__year">${esc(p.year || '')}</span>
      </div>
      <p class="project__desc">${esc(p.desc)}</p>
      <ul class="project__tags">${tags}</ul>
    </div>
  </article>`;
}

/* —— Render the work grid —— */
function renderProjects() {
  const grid = $('#workGrid');
  if (!grid) return;
  grid.innerHTML = (CONFIG.projects || []).map(projectCard).join('');
}

/* —— Point the contact form at the right endpoint —— */
function applyFormEndpoint() {
  const form = $('#contactForm');
  if (!form) return;
  const endpoint =
    (CONFIG.formEndpoint || '').trim() ||
    (CONFIG.links?.email ? `https://formsubmit.co/${CONFIG.links.email}` : form.action);
  form.action = endpoint;
}

/**
 * Hydrate the page from config. MUST run before modules that query links or
 * project cards (cursor, reveals, filter, tilt, modal).
 */
export function renderContent() {
  applyLinks();
  renderProjects();
  applyFormEndpoint();
}
