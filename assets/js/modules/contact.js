/* contact.js — client-side validation, animated errors, submit states ------ */
import { $, $$ } from './utils.js';

const RULES = {
  name:    (v) => v.trim().length >= 2            || 'Please enter your name.',
  email:   (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address.',
  message: (v) => v.trim().length >= 10           || 'Tell me a little more (10+ characters).',
};

export function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;
  const status = $('#contactStatus');
  const btn    = $('#submitBtn');

  const setError = (field, msg) => {
    const wrap = field.closest('.field');
    const err  = $(`[data-error-for="${field.name}"]`);
    if (msg) { wrap.classList.add('is-invalid'); if (err) err.textContent = msg; }
    else     { wrap.classList.remove('is-invalid'); if (err) err.textContent = ''; }
  };

  const validate = (field) => {
    const rule = RULES[field.name];
    if (!rule) return true;
    const res = rule(field.value);
    setError(field, res === true ? '' : res);
    return res === true;
  };

  // Live-validate after first blur.
  $$('.field__input', form).forEach((field) => {
    field.addEventListener('blur', () => validate(field));
    field.addEventListener('input', () => {
      if (field.closest('.field').classList.contains('is-invalid')) validate(field);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = $$('.field__input', form);
    const allValid = fields.map(validate).every(Boolean);
    if (!allValid) {
      status.textContent = 'Please fix the highlighted fields.';
      status.className = 'contact__status is-error';
      return;
    }

    // Loading state
    btn.classList.add('is-loading');
    btn.disabled = true;
    status.textContent = '';
    status.className = 'contact__status';

    try {
      // FormSubmit's /ajax/ route returns JSON and allows CORS (the plain
      // action is kept on the <form> so no-JS submits still work natively).
      const endpoint = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Network response was not ok');
      status.textContent = '✓ Thanks — your message is on its way. I\'ll reply soon.';
      status.className = 'contact__status is-success';
      form.reset();
    } catch (err) {
      status.textContent = 'Something went wrong. Email me directly at noupadashankar78@gmail.com.';
      status.className = 'contact__status is-error';
    } finally {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  });
}
