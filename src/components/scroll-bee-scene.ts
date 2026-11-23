import {
  ACESFilmicToneMapping, Box3, CanvasTexture, Clock, DirectionalLight, DoubleSide, Group, HemisphereLight,
  MathUtils, Mesh, MeshBasicMaterial, NormalBlending, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene,
  SRGBColorSpace, Vector3, WebGLRenderer, type MeshStandardMaterial,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/*
 * A 3D honeybee that stays on screen for the whole visit. As the customer scrolls, it flies between
 * resting spots on alternating sides of the screen (away from the centre, where the products are),
 * dipping mid-flight and turning to face the shopper, then hovers until the next scroll.
 */

type Station = { x: number; y: number; yaw: number; pitch: number; roll: number };

// x/y are in viewport units (-1..1, y up). yaw: 0 = facing right, 180 = facing left, 90 = facing the viewer.
const DESKTOP: Station[] = [
  { x: -0.82, y: 0.42, yaw: 30, pitch: 6, roll: -4 },
  { x: 0.84, y: -0.05, yaw: 150, pitch: 10, roll: 6 },
  { x: -0.84, y: -0.4, yaw: 40, pitch: -6, roll: -8 },
  { x: 0.82, y: 0.36, yaw: 140, pitch: 8, roll: 4 },
];
const MOBILE: Station[] = [
  { x: 0.6, y: 0.3, yaw: 150, pitch: 6, roll: -4 },
  { x: -0.6, y: 0.02, yaw: 30, pitch: 10, roll: 6 },
  { x: 0.6, y: -0.42, yaw: 140, pitch: -6, roll: -8 },
  { x: -0.58, y: 0.45, yaw: 40, pitch: 8, roll: 4 },
];
// One flight per this many screen-heights of scrolling.
const LEG = 0.85;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpAngle = (a: number, b: number, t: number) => a + ((((b - a + 540) % 360) + 360) % 360 - 180) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The bee always settles on a resting spot (never mid-screen over the products): every LEG of scrolling
// picks the next spot, and the bee flies there on its own time, crossing the screen as the shopper scrolls.
function stationAt(scroll: number, mobile: boolean): Station {
  const K = mobile ? MOBILE : DESKTOP;
  let p = scroll / (innerHeight * LEG);
  if (!Number.isFinite(p) || p < 0) p = 0;
  return K[Math.round(p) % K.length];
}

function loadWingTexture(url: string) {
  return new Promise<CanvasTexture>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const d = data.data;
      // The wing is photographed on black: turn brightness into transparency, then lift it to a glassy shine.
      for (let i = 0; i < d.length; i += 4) {
        const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
        d[i + 3] = clamp((l - 0.035) * 4.2, 0, 1) * 255;
        d[i] = Math.min(255, d[i] * 1.5 + 34);
        d[i + 1] = Math.min(255, d[i + 1] * 1.5 + 30);
        d[i + 2] = Math.min(255, d[i + 2] * 1.4 + 22);
      }
      ctx.putImageData(data, 0, 0);
      const tex = new CanvasTexture(c);
      tex.colorSpace = SRGBColorSpace;
      resolve(tex);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function startScrollBee(canvas: HTMLCanvasElement, opts: { modelUrl: string; wingUrl: string; onReady: () => void; onMove?: (x: number, y: number, sizePx: number) => void }) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  // Warm honey-shop light instead of a neutral studio.
  scene.add(new HemisphereLight(0xfff3dc, 0x7a4f17, 1.3));
  const key = new DirectionalLight(0xffe7b8, 2.6); key.position.set(3, 5, 6); scene.add(key);
  const rim = new DirectionalLight(0xffc35c, 2.0); rim.position.set(-5, 2, -4); scene.add(rim);

  const flight = new Group();
  const beeRoot = new Group();
  flight.add(beeRoot);
  scene.add(flight);

  let mobile = innerWidth < 760;
  const resize = () => {
    mobile = innerWidth < 760;
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -((e.clientY / innerHeight) * 2 - 1);
  };
  addEventListener('pointermove', onPointer, { passive: true });

  const flaps: { g: Group; phase: number }[] = [];
  let loaded = false;
  let disposed = false;

  Promise.all([new GLTFLoader().loadAsync(opts.modelUrl), loadWingTexture(opts.wingUrl)]).then(([gltf, wingTex]) => {
    if (disposed) return;
    const model = gltf.scene;
    model.traverse(o => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      const mat = m.material as MeshStandardMaterial;
      mat.envMapIntensity = 0.75;
      // The source model bakes its colour into a full-strength emissive map, which flattens the lighting.
      mat.emissiveIntensity = 0.25;
    });
    const holder = new Group();
    holder.add(model);
    model.rotation.set(0, Math.PI / 2, 0); // head from +Z to +X
    let box = new Box3().setFromObject(holder);
    const size = box.getSize(new Vector3());
    model.scale.setScalar(1 / Math.max(size.x, size.y, size.z));
    box = new Box3().setFromObject(holder);
    model.position.sub(box.getCenter(new Vector3()));
    box = new Box3().setFromObject(holder);
    beeRoot.add(holder);

    const wingMat = (opacity: number) => new MeshBasicMaterial({ map: wingTex, transparent: true, opacity, side: DoubleSide, depthWrite: false, color: 0xffffff, blending: NormalBlending });
    const wingGeo = (span: number) => {
      const g = new PlaneGeometry(span, (span * 9) / 16);
      g.translate(span / 2 - span * 0.03, 0, 0);
      g.rotateX(-Math.PI / 2);
      g.rotateY(-Math.PI / 2);
      return g;
    };
    const anchor = new Vector3(box.min.x + (box.max.x - box.min.x) * 0.66, box.max.y * 0.86, (box.max.z - box.min.z) * 0.05);
    const wings = [
      { span: 0.72, sweep: -0.42, phase: 0, lift: 0.02 },
      { span: 0.52, sweep: -0.95, phase: -0.5, lift: -0.01 },
    ];
    for (const mirror of [1, -1]) {
      const side = new Group();
      side.position.copy(anchor);
      side.scale.z = mirror;
      for (const w of wings) {
        const sweep = new Group();
        sweep.rotation.y = w.sweep;
        sweep.position.y = w.lift;
        const geo = wingGeo(w.span);
        for (const [offset, opacity] of [[0, 0.95], [0.55, 0.28], [-0.55, 0.28]]) {
          const flap = new Group();
          flap.add(new Mesh(geo, wingMat(opacity)));
          sweep.add(flap);
          flaps.push({ g: flap, phase: w.phase + offset });
        }
        side.add(sweep);
      }
      beeRoot.add(side);
    }
    loaded = true;
    opts.onReady();
  }).catch(err => console.warn('Scroll bee could not load', err));

  const clock = new Clock();
  let from = stationAt(scrollY, mobile);
  let to = from;
  let legT = 1; // 0..1 progress of the current flight between two resting spots
  const cur = { x: from.x, y: from.y, s: 1, yaw: from.yaw, pitch: from.pitch, roll: from.roll, moving: 0 };
  let raf = 0;

  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!loaded) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    const next = stationAt(scrollY, mobile);
    if (next !== to) {
      // Start a new flight from wherever the bee is right now.
      from = { x: cur.x, y: cur.y, yaw: cur.yaw, pitch: cur.pitch, roll: cur.roll };
      to = next;
      legT = 0;
    }
    const legSeconds = mobile ? 1.5 : 1.8;
    legT = Math.min(1, legT + dt / legSeconds);
    const e = ease(legT);
    const arc = Math.sin(e * Math.PI);
    const tgt = {
      x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e) - arc * 0.22, s: 1 + arc * 0.12,
      yaw: lerpAngle(from.yaw, to.yaw, e), pitch: lerp(from.pitch, to.pitch, e), roll: lerp(from.roll, to.roll, e),
    };
    const k = 1 - Math.exp(-dt * 6);
    const px = cur.x, py = cur.y;
    cur.x = lerp(cur.x, tgt.x, k); cur.y = lerp(cur.y, tgt.y, k); cur.s = lerp(cur.s, tgt.s, k);
    cur.pitch = lerp(cur.pitch, tgt.pitch, k); cur.roll = lerp(cur.roll, tgt.roll, k);
    cur.yaw = lerpAngle(cur.yaw, tgt.yaw, 1 - Math.exp(-dt * 4));
    cur.moving = lerp(cur.moving, arc, k);
    const vx = dt > 0 ? (cur.x - px) / dt : 0, vy = dt > 0 ? (cur.y - py) / dt : 0;
    const km = 1 - Math.exp(-dt * 2);
    mouse.sx = lerp(mouse.sx, mouse.x, km); mouse.sy = lerp(mouse.sy, mouse.y, km);

    const halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * camera.aspect;
    const hover = Math.sin(t * 2.1) * 0.045 + Math.sin(t * 3.7) * 0.015;
    flight.position.set(cur.x * halfW + Math.sin(t * 1.3) * 0.04 + mouse.sx * 0.12, cur.y * halfH + hover * halfH * 0.5 + mouse.sy * 0.08, Math.sin(t * 0.9) * 0.15);
    // Small enough to stay out of the way: ~17% of the screen height on desktop, ~17% of the width on phones.
    const size = mobile ? (halfW * 2 * 0.17) : (halfH * 2 * 0.17);
    flight.scale.setScalar(size * cur.s);
    flight.rotation.set(0, -MathUtils.degToRad(cur.yaw + mouse.sx * 12), 0);
    const pitch = cur.pitch - clamp(vy * 22, -28, 28) + Math.sin(t * 2.1 + 1) * 3 + mouse.sy * 6;
    const roll = cur.roll + clamp(vx * 18, -30, 30) + Math.sin(t * 1.7) * 4;
    beeRoot.rotation.set(MathUtils.degToRad(roll), 0, MathUtils.degToRad(pitch), 'YZX');

    const freq = Math.PI * 2 * (17 + cur.moving * 5);
    for (const f of flaps) {
      const a = Math.sin(t * freq + f.phase);
      f.g.rotation.x = -0.25 + a * 0.95;
      f.g.rotation.y = a * 0.18;
    }
    renderer.render(scene, camera);
    if (opts.onMove) {
      // Screen position (CSS px) of the bee's centre, so the page can keep its close button beside it.
      screenPos.copy(flight.position).project(camera);
      opts.onMove((screenPos.x + 1) / 2 * innerWidth, (1 - screenPos.y) / 2 * innerHeight, (size * cur.s) / (halfH * 2) * innerHeight);
    }
  };
  const screenPos = new Vector3();
  raf = requestAnimationFrame(frame);

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onPointer);
    renderer.dispose();
  };
}
