/* hero-webgl.js — realistic physically-based glass orb hero (Three.js) -------
   Senior-grade WebGL background, progressively enhanced:
   • MeshPhysicalMaterial (clearcoat + iridescence) lit by a real generated
     studio environment (PMREM / RoomEnvironment) for believable reflections.
   • Custom GLSL injected via onBeforeCompile: 3D simplex-noise vertex
     displacement WITH recomputed normals, plus a neon fresnel rim glow.
   • Orbiting colored key lights, a soft backlight glow sprite, particle field.
   • Guards: WebGL detect, reduced-motion, off-screen / hidden pause,
     capped DPR, debounced resize, full disposal-safe loop.
--------------------------------------------------------------------------- */
import { prefersReducedMotion, lerp, debounce } from './utils.js';

/* —— Ashima 3D simplex noise (public domain) —— */
const NOISE_GLSL = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+2.0*C.xxx; vec3 x3=x0-1.0+3.0*C.xxx;
  i=mod(i,289.0);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p,float t){ return snoise(p+t*0.22) + 0.5*snoise(p*2.1 - t*0.3); }`;

/* Soft radial glow texture for the backlight sprite (canvas → texture). */
function makeGlowTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(150,120,255,0.9)');
  g.addColorStop(0.4, 'rgba(80,120,255,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

export async function initHeroWebGL() {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.getElementById('hero');
  if (!canvas || !hero || prefersReducedMotion()) return;

  try {
    const t = document.createElement('canvas');
    if (!(t.getContext('webgl2') || t.getContext('webgl'))) return;
  } catch { return; }

  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch { return; }

  const isMobile = matchMedia('(max-width: 720px)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4.4;

  // Realistic reflections from a generated studio room (no HDR file needed).
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const group = new THREE.Group();
  scene.add(group);

  /* —— shared shader uniforms for displacement + glow —— */
  const u = {
    uTime: { value: 0 }, uAmp: { value: 0.22 }, uFreq: { value: 0.85 },
    uGlowA: { value: new THREE.Color('#7c5cff') },
    uGlowB: { value: new THREE.Color('#21d4fd') },
    uGlowStrength: { value: 1.15 },
  };

  /* —— physically-based glass material with injected displacement + rim —— */
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#5b46c9'),
    metalness: 0.0, roughness: 0.16,
    clearcoat: 1.0, clearcoatRoughness: 0.18,
    iridescence: 1.0, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 420],
    envMapIntensity: 1.5,
    sheen: 0.6, sheenColor: new THREE.Color('#21d4fd'),
  });
  if (!isMobile) { mat.transmission = 0.35; mat.thickness = 1.2; mat.ior = 1.4; }

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    // Vertex: displace + recompute normals from the noise field.
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', `uniform float uTime; uniform float uAmp; uniform float uFreq;\n${NOISE_GLSL}\nvoid main() {`)
      .replace('#include <beginnormal_vertex>', `
        float d = fbm(position * uFreq, uTime);
        vec3 dispPos = position + normal * d * uAmp;
        vec3 ortho = abs(normal.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
        vec3 tang = normalize(cross(normal, ortho));
        vec3 bitang = normalize(cross(normal, tang));
        float e = 0.18;
        vec3 pa = position + tang * e;  pa += normal * fbm(pa * uFreq, uTime) * uAmp;
        vec3 pb = position + bitang * e; pb += normal * fbm(pb * uFreq, uTime) * uAmp;
        vec3 objectNormal = normalize(cross(pa - dispPos, pb - dispPos));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif
      `)
      .replace('#include <begin_vertex>', 'vec3 transformed = dispPos;');
    // Fragment: add neon fresnel rim to the lit result.
    shader.fragmentShader = 'uniform vec3 uGlowA; uniform vec3 uGlowB; uniform float uGlowStrength;\n' +
      shader.fragmentShader.replace('#include <opaque_fragment>', `
        float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.6);
        outgoingLight += mix(uGlowA, uGlowB, fres) * fres * uGlowStrength;
        #include <opaque_fragment>
      `);
  };

  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, isMobile ? 4 : 6), mat);
  group.add(orb);

  /* —— faint wireframe shell —— */
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.62, 1),
    new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.1 })
  );
  group.add(wire);

  /* —— orbiting colored key lights —— */
  const lights = [
    new THREE.PointLight(0x7c5cff, 18, 12),
    new THREE.PointLight(0x21d4fd, 16, 12),
    new THREE.PointLight(0xff5db1, 10, 12),
  ];
  lights.forEach((l) => group.add(l));
  scene.add(new THREE.AmbientLight(0x404060, 1.2));

  /* —— backlight glow sprite —— */
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(THREE), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 }));
  glow.scale.setScalar(6); glow.position.z = -1.5; group.add(glow);

  /* —— particle field —— */
  const COUNT = isMobile ? 260 : 560;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.5 + (i / COUNT) * 2.6, th = i * 2.399963, ph = Math.acos(1 - 2 * ((i + 0.5) / COUNT));
    pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.sin(ph)*Math.sin(th); pos[i*3+2] = r*Math.cos(ph);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.024, color: 0x9fd8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(points);

  /* —— sizing —— */
  const resize = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    group.position.x = w > 900 ? 1.7 : 0;
    group.scale.setScalar(w > 900 ? 1 : 0.72);
  };
  resize();
  addEventListener('resize', debounce(resize, 150));

  /* —— pointer reactivity —— */
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
    cur.x = lerp(cur.x, target.x, 0.05); cur.y = lerp(cur.y, target.y, 0.05);
    u.uTime.value = t; u.uAmp.value = 0.22 + Math.hypot(cur.x, cur.y) * 0.06;

    group.rotation.y = t * 0.1 + cur.x * 0.5;
    group.rotation.x = cur.y * 0.4;
    wire.rotation.y = -t * 0.07;
    points.rotation.y = t * 0.025;

    lights[0].position.set(Math.cos(t*0.7)*3, Math.sin(t*0.5)*3, 2.5);
    lights[1].position.set(Math.cos(t*0.5+2)*3, Math.sin(t*0.8+1)*3, 2.0);
    lights[2].position.set(Math.sin(t*0.6)*2.5, Math.cos(t*0.4)*2.5, -1.5);

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
