# Noupada Sankar — Developer Portfolio

A hand-built, Awwwards-aspiring developer portfolio. Premium dark theme, GSAP +
ScrollTrigger choreography, Lenis smooth scroll, custom cursor, glassmorphism and
an aurora background — **vanilla HTML/CSS/JS, no framework, no build step.**

> Live target: deploy `index.html` as a static site (Netlify / Vercel / GitHub Pages).

---

## ✨ Highlights

- **Design system** — CSS custom properties for color, fluid `clamp()` typography,
  spacing, radius, z-index. Dark / light / auto themes.
- **WebGL hero (realistic)** — a physically-based glass orb (Three.js
  `MeshPhysicalMaterial`: clearcoat + iridescence) lit by a **generated studio
  environment** (PMREM / RoomEnvironment) for believable reflections, with custom
  GLSL injected via `onBeforeCompile` for noise displacement + recomputed normals
  and a neon fresnel rim, orbiting colored lights, a backlight glow and a particle
  field. **Lazy-loaded**, feature-/motion-gated, pauses off-screen, CSS-blob fallback.
- **3D project views** — every case-study modal renders the project on a real,
  **drag-to-rotate 3D card** (textured screen + reflective frame in the same studio
  environment). One reusable renderer, lazy-built on first open, paused on close;
  falls back to the flat image if WebGL is unavailable.
- **Custom cursor** — trailing ring + dot with contextual states: grows on
  interactive elements, shows a "View" pill over project cards, and supports a
  `data-cursor="..."` attribute on any element to set a custom label.
- **Motion** — preloader → hero split-text stagger → scroll reveals, count-ups,
  circular progress rings, infinite marquee, magnetic buttons, 3D tilt cards.
- **UX** — sticky glass nav, active-section highlighting, scroll progress bar,
  smooth anchors, animated mobile menu, project filtering + case-study modal,
  validated contact form with floating labels.
- **Accessible & fast** — semantic HTML, ARIA, keyboard support, focus rings,
  full `prefers-reduced-motion` fallback, lazy images, rAF-throttled events.

---

## ✏️ Edit your content — one file

**`assets/js/config.js` is your single source of truth (the static-site
equivalent of a `.env`).** Open it and edit:

- **`links`** — GitHub, LinkedIn, LeetCode, Twitter/X, email, résumé. Leave any
  value `""` and that link **auto-hides** everywhere.
- **`projects`** — add / edit / reorder project cards. Each project's
  case-study modal (challenge / solution / result), tags, year, live + repo
  buttons and image all come from here. An empty `live`/`repo` hides that button.

A **preset 3rd project** is already in place with placeholder text and an
on-brand placeholder image (`assets/img/project-3.svg`). To finish it: edit that
object's text and replace the image with **`assets/img/project-3.jpg` at
1200 × 750 px (16:10)**. Any size works (it's cropped to fit), but 16:10 is cleanest.

> No HTML editing needed — `config.js` → `modules/content.js` renders the links
> and project grid into the page at runtime.

---

## 📁 Project structure

```
sank/
├── index.html                 # Single-page markup (semantic, accessible)
├── SANKAR_RESUME.pdf          # CV (linked from hero)
├── assets/
│   ├── css/
│   │   └── styles.css         # Full design system + components (BEM)
│   ├── js/
│   │   ├── config.js         # ⭐ EDIT THIS — all links + projects (your ".env")
│   │   ├── main.js            # Entry point / boot orchestrator
│   │   └── modules/
│   │       ├── content.js        # renders links + project cards from config.js
│   │       ├── hero-webgl.js      # Three.js physically-based glass orb hero
│   │       ├── project3d.js       # interactive 3D project card (modal viewer)
│   │       ├── utils.js          # helpers: lerp, debounce, rafThrottle, $/$$
│   │       ├── smooth-scroll.js   # Lenis + GSAP ticker sync
│   │       ├── preloader.js       # intro loader (returns a Promise)
│   │       ├── cursor.js          # custom cursor + magnetic elements
│   │       ├── navigation.js      # sticky nav, active links, theme, progress
│   │       ├── hero.js            # split-text, typewriter, parallax
│   │       ├── animations.js      # scroll reveals, count-ups, rings
│   │       ├── projects.js        # filter, 3D tilt, case-study modal
│   │       └── contact.js         # validation, floating labels, submit states
│   └── img/                   # profile + project imagery
└── README.md
```

---

## 🚀 Run locally

ES modules require **HTTP** (not `file://`). Use any static server:

```bash
# Python (already on most machines)
python3 -m http.server 5577
# → open http://localhost:5577

# or Node
npx serve .

# or VS Code: right-click index.html → "Open with Live Server"
```

There is **no build step** — edit and refresh.

---

## 🎬 Animation sequence (how the choreography works)

1. **Preloader** (`preloader.js`) — counts 0→100 on an easing curve, then lifts
   the curtain and **resolves a Promise**. This gates the hero so motion only
   starts once the page is visible.
2. **Hero intro** (`hero.js` → `buildHeroTimeline`) — a *paused* GSAP timeline is
   built up front, then `.play()` fires the instant the preloader resolves:
   eyebrow → **per-character title stagger** (`splitChars`) → role → lead → CTA →
   socials → scroll cue, with the aurora blob scaling in underneath.
3. **Background motion** — CSS keyframes (`drift`, `blob`) animate the aurora and
   hero blob continuously; `initHeroParallax` adds mouse-reactive layer shift.
4. **Scroll reveals** (`animations.js`) — every `[data-reveal]` outside the hero
   is tied to a `ScrollTrigger` (`start: 'top 85%'`, fires once). Falls back to
   `IntersectionObserver` if GSAP is unavailable.
5. **Counters & rings** — a single `IntersectionObserver` triggers `requestAnimationFrame`
   count-ups (ease-out-cubic) and animates each ring's `stroke-dashoffset`.
6. **Smooth scroll** (`smooth-scroll.js`) — Lenis is driven from GSAP's ticker so
   scrolling and ScrollTrigger share one clock (no jitter).

Each module **self-gates on `prefers-reduced-motion`** — when reduced motion is
requested, everything renders in its final state with no animation.

---

## ⚡ Performance optimizations

- **No framework / no bundle** — only three small CDN libs (GSAP, ScrollTrigger,
  Lenis), all `defer`-loaded; app code ships as native ES modules.
- `preconnect` to font + CDN hosts; fonts loaded with `display=swap`.
- Images use `loading="lazy"`, `decoding="async"`, and explicit `width`/`height`
  to **reserve space and avoid layout shift (CLS)**.
- Scroll / mousemove handlers are **rAF-throttled**; resize is **debounced**.
- Animations use only **`transform` / `opacity`** (GPU-friendly, no reflow);
  `will-change` applied to moving layers.
- Custom cursor, tilt and parallax are **disabled on touch / coarse pointers**.

**Lighthouse tips to hit 95+:** self-host the three libs and the fonts, add
`<link rel="preload">` for the hero image, and serve over HTTP/2 with caching.

---

## ♿ Accessibility checklist (WCAG 2.1 AA)

- [x] Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`)
- [x] Skip-to-content link
- [x] `aria-label`s on icon-only buttons & social links
- [x] Project cards keyboard-operable (`role="button"`, Enter/Space, `tabindex`)
- [x] Modal: `role="dialog"`, `aria-modal`, Esc to close, focus returned to opener
- [x] Visible focus rings (`:focus-visible`)
- [x] Form `<label>`s linked to inputs; inline, announced error messages
- [x] `prefers-reduced-motion` fully respected (animations + cursor disabled)
- [x] `aria-live` regions for the rotating role and form status
- [x] Color contrast meets AA in both dark and light themes

---

## 🌐 Deployment

**Netlify / Vercel** (recommended — zero config):
1. Push this folder to a Git repo.
2. Import the repo; framework preset = **None / Other**; publish directory = root.
3. Deploy. (No build command needed.)

**GitHub Pages:**
1. Push to `main`.
2. Settings → Pages → Source = `Deploy from a branch` → `main` / root.
3. Your site serves at `https://<user>.github.io/<repo>/`.

> The contact form posts to **FormSubmit** (`formsubmit.co`). On first real submit
> you'll receive a one-time email to confirm the address.

---

## 🔭 Future enhancements

- Self-host GSAP/Lenis + fonts and add a tiny service worker for offline + caching.
- Add a **command palette** (`⌘K`) for quick section nav.
- Optional **Three.js / WebGL** hero (particles or a shader gradient) behind a
  capability + reduced-motion check.
- **Horizontal-scroll** projects section pinned with ScrollTrigger.
- Page-transition layer (Barba.js) if it grows to multiple pages / a blog.
- Wire real GitHub/live URLs into each project's `data-live` / `data-repo`.
- Replace placeholder project imagery with high-res, optimized WebP/AVIF.

---

Built from scratch by **Noupada Sankar** · [GitHub](https://github.com/noupadasankar) ·
[LinkedIn](https://www.linkedin.com/in/shankar-noupada-7a5b77301)
