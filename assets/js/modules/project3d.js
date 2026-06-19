/* project3d.js — interactive 3D project card for the case-study modal --------
   A reusable Three.js viewer: the project screenshot is mapped onto a thin,
   physically-lit card you can drag to rotate (idle auto-rotation otherwise),
   set in a generated studio environment for real reflections on the frame.
   One renderer, created lazily on first open, paused when the modal closes.
--------------------------------------------------------------------------- */
import { lerp, prefersReducedMotion } from './utils.js';

export function createProjectViewer(container) {
  if (!container) return null;
  let S = null;          // scene state, built on first show()
  let building = false;

  async function build() {
    if (S || building) return;
    building = true;
    try {
      const THREE = await import('three');
      const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.classList.add('viewer__canvas');
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 4.6);

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      scene.add(new THREE.AmbientLight(0x8088aa, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2, 3, 4); scene.add(key);
      const rim = new THREE.PointLight(0x7c5cff, 14, 14); rim.position.set(-3, -1, 2); scene.add(rim);
      const rim2 = new THREE.PointLight(0x21d4fd, 12, 14); rim2.position.set(3, 2, -2); scene.add(rim2);

      // Thin card: front face = screen (textured), other faces = dark frame.
      const frame = new THREE.MeshPhysicalMaterial({ color: 0x0c0c14, metalness: 0.4, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2, envMapIntensity: 1.2 });
      const screen = new THREE.MeshBasicMaterial({ color: 0x111118 }); // map set on show()
      const geo = new THREE.BoxGeometry(1.6, 1.0, 0.06, 1, 1, 1);
      // BoxGeometry material order: px,nx,py,ny,pz,nz → pz (index 4) faces camera.
      const card = new THREE.Mesh(geo, [frame, frame, frame, frame, screen, frame]);
      const group = new THREE.Group(); group.add(card); scene.add(group);

      // soft contact shadow / glow plate behind the card
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 1.8),
        new THREE.MeshBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      glow.position.z = -0.6; scene.add(glow);

      const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
      let dragging = false, lastX = 0, lastY = 0, idle = 0;

      const onDown = (e) => { dragging = true; idle = 0; const p = e.touches ? e.touches[0] : e; lastX = p.clientX; lastY = p.clientY; };
      const onMove = (e) => {
        if (!dragging) return;
        const p = e.touches ? e.touches[0] : e;
        target.y += (p.clientX - lastX) * 0.008;
        target.x += (p.clientY - lastY) * 0.008;
        target.x = Math.max(-0.8, Math.min(0.8, target.x));
        lastX = p.clientX; lastY = p.clientY;
      };
      const onUp = () => { dragging = false; };
      container.addEventListener('mousedown', onDown);
      addEventListener('mousemove', onMove, { passive: true });
      addEventListener('mouseup', onUp);
      container.addEventListener('touchstart', onDown, { passive: true });
      container.addEventListener('touchmove', onMove, { passive: true });
      addEventListener('touchend', onUp);

      const resize = () => {
        const w = container.clientWidth || 1, h = container.clientHeight || 1;
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize); ro.observe(container); resize();

      let raf = null;
      const reduce = prefersReducedMotion();
      const loop = () => {
        idle += 0.016;
        if (!dragging && !reduce) target.y += 0.0016;          // gentle auto-spin
        const breathe = reduce ? 0 : Math.sin(idle * 0.8) * 0.04;
        cur.x = lerp(cur.x, target.x + breathe, 0.08);
        cur.y = lerp(cur.y, target.y, 0.08);
        group.rotation.x = cur.x; group.rotation.y = cur.y;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };

      S = {
        THREE, renderer, card, screen, group, target, cur,
        start() { if (!raf) loop(); },
        stop() { if (raf) cancelAnimationFrame(raf); raf = null; },
        setTexture(url) {
          new THREE.TextureLoader().load(url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            screen.map = tex; screen.color.set(0xffffff); screen.needsUpdate = true;
            const ar = (tex.image?.width || 16) / (tex.image?.height || 10);
            card.scale.y = 1.6 / ar;                            // keep screenshot aspect
          });
          target.x = 0; target.y = 0; cur.x = 0; cur.y = 0;
        },
      };
    } catch { /* WebGL/CDN failed → caller keeps the <img> fallback */ }
    building = false;
  }

  return {
    async show(url) {
      await build();
      if (!S) { container.dataset.failed = '1'; return false; }
      S.setTexture(url); S.start(); container.classList.add('is-ready');
      return true;
    },
    hide() { if (S) S.stop(); container.classList.remove('is-ready'); },
  };
}
