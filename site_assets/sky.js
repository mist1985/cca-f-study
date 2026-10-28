// The knowledge map on the home page: every page is a star, grouped by area,
// lines are the "Connects to" links between cards. Finished pages are lit.
import * as THREE from "three";

const SITE = window.SITE || { pages: [], areas: {} };
const wrap = document.getElementById("sky");
const section = wrap && wrap.closest(".sky");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

function load(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { section.classList.add("nogl"); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  wrap.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const world = new THREE.Group();
  scene.add(world);

  // ---------- layout ----------
  const pages = SITE.pages;
  const byArea = {};
  pages.forEach((p) => (byArea[p.area] = byArea[p.area] || []).push(p));
  const ring = ["D1", "D2", "D3", "D4", "D5"];
  const centers = { L1: new THREE.Vector3(0, 1.1, 0), L4: new THREE.Vector3(0, -2.4, 0) };
  ring.forEach((a, i) => {
    const ang = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
    centers[a] = new THREE.Vector3(Math.cos(ang) * 6.2, (i % 2 ? 0.5 : -0.4), Math.sin(ang) * 6.2);
  });
  const pos = {};
  Object.keys(byArea).forEach((a) => {
    const c = centers[a];
    byArea[a].forEach((p, k) => {
      if (k === 0 && a !== "L4") { pos[p.id] = c.clone(); return; }        // first page sits at the cluster's heart
      const n = a === "L4" ? k + 1 : k;
      const ang = n * 2.399 + (ring.indexOf(a) + 1);                       // golden-angle spiral
      const r = (a === "L1" ? 1.0 : 0.9) + 0.42 * Math.sqrt(n);
      pos[p.id] = new THREE.Vector3(c.x + Math.cos(ang) * r, c.y + Math.sin(n * 1.7) * 0.55, c.z + Math.sin(ang) * r);
    });
  });
  const byNum = {};
  pages.forEach((p) => p.num && (byNum[p.num] = p));

  // ---------- stars (one Points object, custom shader: lit = disc, to-do = ring) ----------
  const N = pages.length;
  const geo = new THREE.BufferGeometry();
  const P = new Float32Array(N * 3), C = new Float32Array(N * 3), SZ = new Float32Array(N), LIT = new Float32Array(N),
    NEXT = new Float32Array(N), BORN = new Float32Array(N), IDX = new Float32Array(N);
  pages.forEach((p, i) => {
    pos[p.id].toArray(P, i * 3);
    new THREE.Color((SITE.areas[p.area] || {}).color || "#ebe6dc").toArray(C, i * 3);
    SZ[i] = p.kind === "card" ? 1.0 : 1.55;
    BORN[i] = i * 0.025; IDX[i] = i;
  });
  geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(C, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(SZ, 1));
  geo.setAttribute("lit", new THREE.BufferAttribute(LIT, 1));
  geo.setAttribute("next", new THREE.BufferAttribute(NEXT, 1));
  geo.setAttribute("born", new THREE.BufferAttribute(BORN, 1));
  geo.setAttribute("idx", new THREE.BufferAttribute(IDX, 1));
  const uniforms = { uTime: { value: 0 }, uScale: { value: 1 }, uHover: { value: -1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `
      attribute float size; attribute float lit; attribute float next; attribute float born; attribute float idx;
      uniform float uTime; uniform float uScale; uniform float uHover;
      varying vec3 vColor; varying float vLit; varying float vNext; varying float vHover; varying float vIn;
      void main(){
        vColor = color; vLit = lit; vNext = next;
        vHover = abs(idx - uHover) < 0.5 ? 1.0 : 0.0;
        vIn = clamp((uTime - born) * 2.5, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float pulse = next > 0.5 ? 1.0 + 0.25 * sin(uTime * 3.0) : 1.0;
        gl_PointSize = size * pulse * (1.0 + vHover * 0.45) * uScale * (230.0 / -mv.z) * vIn;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vLit; varying float vNext; varying float vHover; varying float vIn;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float disc = 1.0 - smoothstep(0.44, 0.5, d);
        float ring = disc * smoothstep(0.30, 0.36, d);
        float a = mix(ring * 0.75 + disc * 0.08, disc, vLit);
        vec3 col = vNext > 0.5 ? vec3(0.95, 0.93, 0.88) : vColor;
        col = mix(col, vec3(1.0), vHover * 0.25);
        if (a < 0.01) discard;
        gl_FragColor = vec4(col, a * vIn);
      }`,
    vertexColors: true,
  });
  const stars = new THREE.Points(geo, mat);
  world.add(stars);

  // ---------- lines: faint structure + "connects to" links ----------
  const idx = {}; pages.forEach((p, i) => (idx[p.id] = i));
  const structure = [], links = [];
  Object.keys(byArea).forEach((a) => {
    const heart = byArea[a][0];
    byArea[a].forEach((p, k) => k && structure.push([heart.id, p.id]));
    if (a !== "L1") structure.push([byArea.L1[0].id, heart.id]);
  });
  const seen = new Set();
  pages.forEach((p) => (p.links || []).forEach((n) => {
    const q = byNum[n];
    const key = [p.id, q && q.id].sort().join("|");
    if (q && !seen.has(key)) { seen.add(key); links.push([p.id, q.id]); }
  }));
  function lineSet(pairs, opacity) {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(pairs.length * 6), col = new Float32Array(pairs.length * 6);
    pairs.forEach(([a, b], i) => { pos[a].toArray(arr, i * 6); pos[b].toArray(arr, i * 6 + 3); });
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity, depthWrite: false });
    const l = new THREE.LineSegments(g, m); world.add(l); return { g, pairs };
  }
  const structLines = lineSet(structure, 0.5);
  const linkLines = lineSet(links, 0.85);

  // ---------- labels ----------
  const labelBox = wrap.querySelector(".sky-labels");
  const labels = Object.keys(centers).map((a) => {
    const s = document.createElement("span");
    const info = SITE.areas[a] || {};
    s.textContent = a === "L1" ? "Big picture" : info.name;
    s.style.setProperty("--c", info.color || "#ebe6dc");
    labelBox.appendChild(s);
    return { el: s, at: centers[a].clone().add(new THREE.Vector3(0, a === "L4" ? -1.5 : 1.55, 0)) };
  });

  // ---------- progress → colours ----------
  const dim = new THREE.Color("#1f2228");
  function paint() {
    const done = load("cca-done", {});
    let next = -1;
    pages.forEach((p, i) => { LIT[i] = done[p.id] ? 1 : 0; NEXT[i] = 0; if (next < 0 && !done[p.id]) next = i; });
    if (next >= 0) NEXT[next] = 1;
    geo.attributes.lit.needsUpdate = true; geo.attributes.next.needsUpdate = true;
    [[structLines, 0.35], [linkLines, 1]].forEach(([set, k]) => {
      const col = set.g.attributes.color.array;
      set.pairs.forEach(([a, b], i) => {
        const both = done[a] && done[b];
        [a, b].forEach((id, j) => {
          const c = both ? new THREE.Color().fromArray(C, idx[id] * 3).multiplyScalar(k)
            : set === linkLines ? dim.clone().multiplyScalar(0.8) : new THREE.Color().fromArray(C, idx[id] * 3).multiplyScalar(0.22);
          c.toArray(col, i * 6 + j * 3);
        });
      });
      set.g.attributes.color.needsUpdate = true;
    });
  }
  paint();
  addEventListener("storage", paint);
  addEventListener("cca-progress", paint);

  // ---------- camera, resize ----------
  let W = 1, H = 1;
  function resize() {
    W = wrap.clientWidth; H = wrap.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const far = W < 600 ? 27 : 15.5;
    camera.position.set(0, far * 0.78, far * 0.82);
    camera.lookAt(0, -0.9, 0);
    camera.updateProjectionMatrix();
    uniforms.uScale.value = renderer.getPixelRatio() * (W < 600 ? 0.85 : 1);
  }
  new ResizeObserver(resize).observe(wrap); resize();

  // ---------- interaction: drag to turn, hover/tap for details, click to open ----------
  let rotY = 0.35, rotX = 0, velY = 0, dragging = false, moved = 0, lastX = 0, lastY = 0, idleT = 0;
  const ray = new THREE.Raycaster(); ray.params.Points.threshold = 0.42;
  const mouse = new THREE.Vector2();
  const tip = wrap.querySelector(".sky-tip");
  let hover = -1, armed = -1;
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObject(stars)[0];
    return hit ? hit.index : -1;
  }
  function showTip(i) {
    hover = i; uniforms.uHover.value = i;
    renderer.domElement.style.cursor = i >= 0 ? "pointer" : "";
    if (i < 0) { tip.hidden = true; return; }
    const p = pages[i], a = SITE.areas[p.area] || {}, done = load("cca-done", {})[p.id];
    tip.innerHTML = `<b>${p.num ? p.num + " · " : ""}${p.short}</b><small>${a.name} · ${done ? "done" : p.min + " min"}${armed === i ? " · tap again to open" : ""}</small>`;
    tip.hidden = false; placeTip();
  }
  function placeTip() {
    if (hover < 0) return;
    const v = new THREE.Vector3().fromArray(P, hover * 3).applyMatrix4(world.matrixWorld).project(camera);
    tip.style.left = ((v.x + 1) / 2) * W + "px"; tip.style.top = ((1 - v.y) / 2) * H + "px";
  }
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (e) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; el.setPointerCapture(e.pointerId); });
  el.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY; moved += Math.abs(dx) + Math.abs(dy);
      velY = dx * 0.006; rotY += velY; rotX = Math.max(-0.35, Math.min(0.45, rotX + dy * 0.004));
      lastX = e.clientX; lastY = e.clientY; idleT = 0;
    } else if (e.pointerType === "mouse") showTip(pick(e));
  });
  el.addEventListener("pointerup", (e) => {
    dragging = false;
    if (moved > 6) return;
    const i = pick(e);
    if (i < 0) { armed = -1; showTip(-1); return; }
    if (e.pointerType === "mouse" || armed === i) { location.href = pages[i].href; return; }
    armed = i; showTip(i);                                                 // touch: first tap shows, second opens
  });
  el.addEventListener("pointerleave", () => { if (!dragging) showTip(-1); });

  // ---------- loop (paused when off-screen) ----------
  let visible = true, t0 = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(wrap);
  const tmp = new THREE.Vector3();
  function frame(now) {
    if (!visible) return;
    uniforms.uTime.value = reduced ? 99 : (now - t0) / 1000;
    if (!dragging) {
      idleT++;
      velY *= 0.94; rotY += velY;
      if (!reduced && idleT > 90 && hover < 0) rotY += 0.0012;
    }
    world.rotation.set(rotX, rotY, 0);
    world.updateMatrixWorld();
    labels.forEach((l) => {
      tmp.copy(l.at).applyMatrix4(world.matrixWorld);
      const depth = tmp.clone().sub(camera.position).length();
      tmp.project(camera);
      l.el.style.left = ((tmp.x + 1) / 2) * W + "px"; l.el.style.top = ((1 - tmp.y) / 2) * H + "px";
      l.el.style.opacity = Math.max(0.25, Math.min(0.95, 1.6 - depth / 20)).toFixed(2);
    });
    placeTip();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (wrap) {
  try { start(); } catch (e) { console.error(e); section && section.classList.add("nogl"); }
}
