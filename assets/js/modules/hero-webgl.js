/* hero-webgl.js — Interactive AI Globe hero (Three.js) ----------------------
   A glowing dotted globe with neural-network connections, pulsing data nodes,
   a glowing crystal core and orbiting particle trails. Represents global,
   networked, AI/cloud systems — meaningful for a full-stack + AI engineer.

   Layers (back → front): CSS aurora + grid → orbiting particles → neural
   lines → globe dots → data nodes → crystal core.

   Progressive enhancement & guards: WebGL detect, prefers-reduced-motion,
   pause off-screen / when tab hidden, capped DPR, debounced resize, CSS-blob
   fallback.
--------------------------------------------------------------------------- */
import { prefersReducedMotion, lerp, debounce } from './utils.js';

/* Soft round sprite (white radial) — used for dots, nodes and particles. */
function makeDotTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(32, 32, 32, 0, Math.PI * 2); ctx.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* Shared fresnel glow shader (used by the crystal core). */
const FRESNEL_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const FRESNEL_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uPow;
varying vec3 vN; varying vec3 vV;
void main(){ float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), uPow); gl_FragColor = vec4(uColor * f, f); }`;

/** Evenly distribute N points on a sphere of radius R (Fibonacci sphere). */
function fibonacciSphere(N, R) {
  const pts = []; const gold = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = gold * i;
    pts.push([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R]);
  }
  return pts;
}

export async function initHeroWebGL() {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.getElementById('hero');
  if (!canvas || !hero || prefersReducedMotion()) return;

  try {
    const t = document.createElement('canvas');
    if (!(t.getContext('webgl2') || t.getContext('webgl'))) return;
  } catch { return; }

  let THREE;
  try { THREE = await import('three'); } catch { return; }

  const isMobile = matchMedia('(max-width: 720px)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4.4;

  const globe = new THREE.Group();
  globe.rotation.z = 0.32;                 // axial tilt, like a planet
  scene.add(globe);

  const dot = makeDotTexture(THREE);
  const COL_BLUE = new THREE.Color('#8b7bff');   // purple-leaning globe dots
  const COL_PURPLE = new THREE.Color('#7c5cff');
  const COL_CYAN = new THREE.Color('#5ea0ff');   // soft blue accent (calmer than cyan)

  const R = 1.5;
  const N = isMobile ? 340 : 720;
  const nodes = fibonacciSphere(N, R);

  /* —— globe surface dots —— */
  const dotPos = new Float32Array(N * 3);
  nodes.forEach((p, i) => { dotPos[i*3] = p[0]; dotPos[i*3+1] = p[1]; dotPos[i*3+2] = p[2]; });
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  const dots = new THREE.Points(dotGeo, new THREE.PointsMaterial({
    size: 0.05, map: dot, color: COL_BLUE, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  globe.add(dots);

  /* —— neural-network connections (lines between nearby dots) —— */
  const linePts = [];
  const threshold = R * 0.34;
  const maxConn = 3, maxLines = isMobile ? 600 : 1400;
  for (let i = 0; i < N && linePts.length / 6 < maxLines; i++) {
    let c = 0;
    for (let j = i + 1; j < N && c < maxConn; j++) {
      const dx = nodes[i][0]-nodes[j][0], dy = nodes[i][1]-nodes[j][1], dz = nodes[i][2]-nodes[j][2];
      if (dx*dx + dy*dy + dz*dz < threshold * threshold) {
        linePts.push(nodes[i][0],nodes[i][1],nodes[i][2], nodes[j][0],nodes[j][1],nodes[j][2]);
        c++;
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePts), 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    color: COL_PURPLE, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  globe.add(lines);

  /* —— pulsing data nodes (a handful of bright hubs) —— */
  const hubs = [];
  const HUB_COUNT = isMobile ? 6 : 10;
  for (let k = 0; k < HUB_COUNT; k++) {
    const p = nodes[Math.floor((k + 0.5) / HUB_COUNT * N)];
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dot, color: k % 3 === 0 ? COL_CYAN : COL_PURPLE, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95,
    }));
    s.position.set(p[0], p[1], p[2]);
    s.userData.phase = k * 0.7;
    globe.add(s); hubs.push(s);
  }

  /* —— reusable fresnel glow material —— */
  const makeFresnel = (color, side, pow = 2.6) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPow: { value: pow } },
    vertexShader: FRESNEL_VERT, fragmentShader: FRESNEL_FRAG,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side,
  });

  /* —— glowing crystal core at the centre of the globe —— */
  const core = new THREE.Group();
  globe.add(core);
  // soft energy glow
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: new THREE.Color('#b9a8ff'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 1.0 }));
  coreGlow.scale.setScalar(1.7); core.add(coreGlow);
  // bright hot centre
  const coreHot = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: new THREE.Color('#ffffff'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95 }));
  coreHot.scale.setScalar(0.7); core.add(coreHot);
  // translucent crystal facets (fresnel, front-lit) — brighter, softer falloff
  const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.58, 0), makeFresnel('#c7b8ff', THREE.FrontSide, 1.25));
  core.add(crystal);
  // sharp wireframe edges
  const crystalWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.6, 0),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#9a7bff'), wireframe: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  core.add(crystalWire);

  /* —— orbiting particle trails (outer shell) —— */
  const PCOUNT = isMobile ? 160 : 320;
  const ppos = new Float32Array(PCOUNT * 3);
  const pp = fibonacciSphere(PCOUNT, 1);
  for (let i = 0; i < PCOUNT; i++) {
    const r = 2.3 + (i % 7) * 0.18;
    ppos[i*3] = pp[i][0]*r; ppos[i*3+1] = pp[i][1]*r; ppos[i*3+2] = pp[i][2]*r;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.028, map: dot, color: new THREE.Color('#9b8cff'), transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(particles);

  /* —— sizing —— */
  const resize = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    globe.position.x = particles.position.x = w > 900 ? 1.7 : 0;
    const s = w > 900 ? 1 : 0.72;
    globe.scale.setScalar(s); particles.scale.setScalar(s);
  };
  resize();
  addEventListener('resize', debounce(resize, 150));

  /* —— pointer parallax —— */
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });
  hero.addEventListener('mouseleave', () => { target.x = 0; target.y = 0; });

  /* —— loop with visibility gating —— */
  const clock = new THREE.Clock();
  let raf = null, running = false;
  const frame = () => {
    const t = clock.getElapsedTime();
    // gentler easing → smoother, calmer parallax
    cur.x = lerp(cur.x, target.x, 0.035); cur.y = lerp(cur.y, target.y, 0.035);

    globe.rotation.y = t * 0.05 + cur.x * 0.45;     // slow, confident rotation
    globe.rotation.x = 0.1 + cur.y * 0.3;
    particles.rotation.y = -t * 0.018;
    particles.rotation.x = t * 0.01;

    // crystal core — slow counter-rotation + a steady, bright breathing glow
    core.rotation.y = -t * 0.12;
    core.rotation.x = t * 0.08;
    const cp = 0.5 + 0.5 * Math.sin(t * 0.9);
    coreGlow.scale.setScalar(1.5 + cp * 0.3);
    coreGlow.material.opacity = 0.78 + cp * 0.22;
    coreHot.material.opacity = 0.85 + cp * 0.15;
    crystal.scale.setScalar(1.0 + cp * 0.04);

    // pulse the data hubs (calm, no flicker)
    for (const s of hubs) {
      const k = 0.5 + 0.5 * Math.sin(t * 1.1 + s.userData.phase);
      s.scale.setScalar(0.16 + k * 0.1);
      s.material.opacity = 0.6 + k * 0.3;
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!running) { running = true; clock.start(); frame(); } };
  const stop  = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = null; };

  new IntersectionObserver((e) => { e[0].isIntersecting && !document.hidden ? start() : stop(); }, { threshold: 0.05 }).observe(hero);
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  hero.classList.add('webgl-on');
  start();
}
