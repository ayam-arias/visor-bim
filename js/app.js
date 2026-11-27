// GeoIAN · Visor BIM — núcleo del visor (three.js r160)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TEX, texKind, triplanar } from './materiales.js';
import { initAprende } from './aprende.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const bus = new EventTarget();
const emit = (t, d) => bus.dispatchEvent(new CustomEvent(t, { detail: d }));

// ---------- Catálogo de modelos de ejemplo ----------
const MODELS = [
  { id: 'duplex', name: 'Dúplex · Revit IFC2x3', files: ['duplex'], src: 'Duplex Apartment: modelo de referencia exportado desde Revit (colección IfcSampleFiles).' },
  { id: 'casa', name: 'Casa · IFC4', files: ['casa_ifc4'], src: 'Casa de muestra IFC4 (colección IfcSampleFiles).' },
  { id: 'fed', name: 'Proyecto federado · IFC 4.3', files: ['ss_building_architecture', 'ss_building_structural', 'ss_building_hvac', 'ss_building_landscaping', 'ss_infra_bridge', 'ss_infra_road', 'ss_infra_rail', 'ss_infra_plumbing', 'ss_infra_electrical'], src: 'buildingSMART International, IFC 4.3 "Simple Scene": casa, terreno, camino, puente, ferrocarril, alcantarillado y electricidad, cada disciplina en su archivo.' },
  { id: 'revit', name: 'Edificio Revit ARQ + EST', files: ['revit_arc', 'revit_str'], src: 'Modelo de muestra de Autodesk Revit exportado a IFC4: arquitectura y estructura (IfcSampleFiles). Es el más pesado.' },
  { id: 'aromos', name: 'Los Aromos · curso', files: ['losaromos'], src: 'Modelo propio del curso TPO204: nube LiDAR clasificada convertida en MDT y volúmenes LOD1.' },
];
const FILE_DISC = { ss_building_architecture: 'Arquitectura', ss_building_structural: 'Estructura', ss_building_hvac: 'Climatización (HVAC)', ss_building_landscaping: 'Paisajismo y terreno', ss_infra_bridge: 'Puente', ss_infra_road: 'Camino', ss_infra_rail: 'Ferrocarril', ss_infra_plumbing: 'Alcantarillado', ss_infra_electrical: 'Electricidad', revit_arc: 'Arquitectura', revit_str: 'Estructura' };
export const ES = { IfcWall: 'Muro', IfcWallStandardCase: 'Muro', IfcCurtainWall: 'Muro cortina', IfcSlab: 'Losa', IfcWindow: 'Ventana', IfcDoor: 'Puerta', IfcRoof: 'Techo', IfcBeam: 'Viga', IfcColumn: 'Columna', IfcFooting: 'Fundación', IfcMember: 'Perfil / montante', IfcPlate: 'Placa / panel', IfcCovering: 'Revestimiento', IfcRailing: 'Baranda', IfcStair: 'Escalera', IfcStairFlight: 'Tramo de escalera', IfcRamp: 'Rampa', IfcFurniture: 'Mobiliario', IfcFurnishingElement: 'Mobiliario', IfcSystemFurnitureElement: 'Mobiliario de sistema', IfcDuctSegment: 'Ducto', IfcAirTerminal: 'Difusor / terminal de aire', IfcPipeSegment: 'Tubería', IfcPipeFitting: 'Accesorio de tubería', IfcDistributionChamberElement: 'Cámara', IfcChimney: 'Chimenea', IfcEarthworksFill: 'Relleno de tierra', IfcGeographicElement: 'Terreno / elemento geográfico', IfcBuildingElementProxy: 'Elemento genérico', IfcCourse: 'Capa (pavimento / balasto)', IfcRoadPart: 'Parte de camino', IfcSurfaceFeature: 'Demarcación', IfcTrackElement: 'Elemento de vía (durmiente)', IfcRail: 'Riel', IfcSign: 'Señal', IfcElectricAppliance: 'Equipo eléctrico', IfcDiscreteAccessory: 'Accesorio', IfcFlowTerminal: 'Terminal (artefacto)', IfcFlowSegment: 'Segmento de flujo', IfcBearing: 'Apoyo', IfcPile: 'Pilote', IfcLightFixture: 'Luminaria', IfcSanitaryTerminal: 'Artefacto sanitario', IfcSpace: 'Recinto', IfcOpeningElement: 'Vano' };
const PAL = ['#21A9D8', '#E8772A', '#6A1B9A', '#1E88E5', '#C2185B', '#00897B', '#8D6E63', '#5C6BC0', '#D81B60', '#43A047', '#F4511E', '#546E7A', '#7CB342', '#3949AB', '#FB8C00', '#26A69A', '#AD1457', '#827717'];
const DISC_CAT = c => /IfcGeographic|IfcEarthworks|IfcCourse|IfcRoad|IfcPavement|IfcSurfaceFeature|IfcSign|IfcTrack|IfcRail\b/.test(c) ? 'Terreno e infraestructura'
  : /IfcColumn|IfcBeam|IfcFooting|IfcPile|IfcSlab|IfcBearing|IfcMember/.test(c) ? 'Estructura'
  : /IfcDuct|IfcPipe|IfcAirTerminal|IfcFlow|IfcElectric|IfcLight|IfcSanitary|IfcCable|IfcDistribution/.test(c) ? 'Instalaciones (MEP)'
  : /IfcFurni|IfcSystemFurniture/.test(c) ? 'Mobiliario' : 'Arquitectura';
export const PHASES = [
  ['Terreno y movimiento de tierras', /IfcGeographic|IfcEarthworks|IfcCourse|IfcRoadPart|IfcPavement/],
  ['Fundaciones', /IfcFooting|IfcPile|IfcBearing/],
  ['Estructura: columnas, vigas y losas', /IfcColumn|IfcBeam|IfcSlab|IfcStair|IfcRamp|IfcTrack|IfcRail\b/],
  ['Muros y cerramientos', /IfcWall|IfcCurtainWall|IfcChimney|IfcMember|IfcPlate/],
  ['Cubierta', /IfcRoof/],
  ['Puertas y ventanas', /IfcDoor|IfcWindow/],
  ['Instalaciones (MEP)', /IfcDuct|IfcPipe|IfcAirTerminal|IfcFlow|IfcElectric|IfcLight|IfcSanitary|IfcCable|IfcDistribution/],
  ['Terminaciones y equipamiento', /./],
];
const phaseOf = c => PHASES.findIndex(([, r]) => r.test(c));

// ---------- Escena ----------
const canvas = $('c'), stage = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.localClippingEnabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(45, 1, .1, 1e5);
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = .12;
scene.add(new THREE.HemisphereLight(0xEAF4FF, 0x8a7f6a, .9));
const sun = new THREE.DirectionalLight(0xFFF4E0, 2.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
scene.add(sun, sun.target);
const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6);
const ground = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: .18 }));
ground.receiveShadow = true; scene.add(ground);
const grid = new THREE.GridHelper(1, 20, 0x8899aa, 0xaab6c2); grid.material.transparent = true; grid.material.opacity = .35; scene.add(grid);

const S = { M: null, root: null, elems: [], props: {}, byClass: {}, classOn: {}, discOn: {}, storeyOnly: null, colorMode: 'tex', selected: null, box: null, xray: false, cad: false, lod: 300, phase: null, clash: new Set(), clashPair: null, disc: {}, colors: {}, user: null };
const selMat = new THREE.MeshStandardMaterial({ color: 0xE8772A, emissive: 0x7a3300, roughness: .5, side: THREE.DoubleSide, clippingPlanes: [clip] });
const clashMat = new THREE.MeshStandardMaterial({ color: 0xE53935, emissive: 0x5a0000, roughness: .5, side: THREE.DoubleSide, clippingPlanes: [clip], depthTest: true });
const phaseMat = new THREE.MeshStandardMaterial({ color: 0xFFB74D, emissive: 0x6a3a00, roughness: .6, side: THREE.DoubleSide, clippingPlanes: [clip] });
const cadMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const cadLine = new THREE.LineBasicMaterial({ color: 0x1B2A4A, clippingPlanes: [clip] });
const texMats = {}, clsMats = {}, xrMats = new Map();

function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage);

function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); }

// ---------- Carga ----------
const gl = new GLTFLoader();
$('models').innerHTML = MODELS.map(m => `<button data-id="${m.id}">${esc(m.name)}</button>`).join('');
$('models').addEventListener('click', e => { const b = e.target.closest('button'); if (b) load(b.dataset.id); });

async function fetchParts(M) {
  const out = [];
  for (const f of M.files) {
    const [g, j] = await Promise.all([
      fetch('data/' + f + '.gltf.json').then(r => { if (!r.ok) throw 0; return r.text(); }).then(t => gl.parseAsync(t, '')),
      fetch('data/' + f + '.json').then(r => r.json())]);
    out.push({ group: g.scene, props: j.el, meta: j.meta, file: f });
  }
  return out;
}

export async function load(id, parts = null) {
  const M = id === 'user' ? S.user.M : MODELS.find(m => m.id === id);
  document.querySelectorAll('#models button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  msg('Cargando ' + M.name + '…');
  clearScene();
  try { parts = parts || (id === 'user' ? S.user.parts : await fetchParts(M)); }
  catch (e) { msg('No se pudo cargar el modelo. Revisa tu conexión y recarga la página.'); return; }
  S.M = M; S.parts = parts;
  const root = S.root = new THREE.Group(); scene.add(root);
  const multi = parts.length > 1;
  for (const P of parts) {
    Object.assign(S.props, P.props);
    P.group.traverse(o => {
      if (!o.isMesh) return;
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      const guid = S.props[o.name] ? o.name : (S.props[o.parent?.name] ? o.parent.name : o.name);
      const p = S.props[guid] ||= { c: P.glb ? 'Elemento glTF' : 'Desconocido', n: o.name || '' };
      Object.assign(o.userData, { guid, cls: p.c, file: P.file, disc: multi && FILE_DISC[P.file] ? FILE_DISC[P.file] : (multi ? P.file : DISC_CAT(p.c)), storey: p.s || 'Sin nivel', tex: texKind(p, P.file) });
      const vc = !!o.geometry.attributes.color, a = o.userData.alpha ?? 1;
      const glass = a < .99 || /IfcWindow/.test(p.c) || (/IfcPlate/.test(p.c) && /glass|glaz/i.test(p.n + p.m));
      o.userData.mat = new THREE.MeshStandardMaterial({ vertexColors: vc, color: vc ? 0xffffff : 0xcfd8dc, roughness: .8, metalness: 0, side: THREE.DoubleSide, transparent: glass, opacity: glass ? Math.min(a, .45) : 1, depthWrite: !glass, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      o.castShadow = !glass; o.receiveShadow = true;
      S.elems.push(o); (S.byClass[p.c] ||= []).push(o);
    });
    root.add(P.group);
  }
  // centrar en el origen (la georreferencia se informa en el panel)
  let box = new THREE.Box3().setFromObject(root); const c = box.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -box.min.y, -c.z); root.updateMatrixWorld(true);
  S.box = new THREE.Box3().setFromObject(root);
  const size = S.box.getSize(new THREE.Vector3()), R = Math.max(size.x, size.z, 10);
  ground.scale.setScalar(R * 1.2); ground.position.y = -.01;
  grid.scale.setScalar(R * 2); grid.position.y = -.02;
  sun.position.set(R * .6, R * 1.1, R * .45); sun.target.position.set(0, 0, 0);
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: .1, far: R * 4 }); sun.shadow.camera.updateProjectionMatrix();
  renderer.shadowMap.enabled = S.elems.length < 4000;
  Object.keys(S.byClass).forEach(k => { S.classOn[k] = true; S.colors[k] ||= PAL[Object.keys(S.colors).length % PAL.length]; });
  [...new Set(S.elems.map(o => o.userData.disc))].forEach((d, i) => { S.discOn[d] = true; S.disc[d] = PAL[(i * 3 + 1) % PAL.length]; });
  setColor(M.color || 'tex', true);
  renderLeft(); fit(); setCut(); showProps(null); refresh();
  $('q5').innerHTML = ''; $('clRes').innerHTML = ''; buildPhaseList();
  writeMeta(parts);
  msg(null);
  if (id !== 'user') history.replaceState(null, '', '#' + id);
  emit('model', { id });
}

function clearScene() {
  if (S.root) {
    scene.remove(S.root);
    S.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.userData.mat) o.userData.mat.dispose(); });
  }
  if (S.proxy) { scene.remove(S.proxy); S.proxy = null; }
  clearMeasure();
  Object.assign(S, { root: null, elems: [], props: {}, byClass: {}, classOn: {}, discOn: {}, storeyOnly: null, selected: null, phase: null, clash: new Set(), clashPair: null, disc: {}, cad: false, lod: 300 });
  $('cadBtn').classList.remove('on'); $('lod').value = '300'; $('p4').value = 8;
}
function msg(t) { $('msg').hidden = !t; if (t) $('msg').textContent = t; }

function writeMeta(parts) {
  const total = S.elems.length, schemas = [...new Set(parts.map(p => p.meta?.schema).filter(Boolean))];
  let h = `<b>${total.toLocaleString('es-CL')}</b> elementos · ${Object.keys(S.byClass).length} clases · <b>${esc(schemas.join(', ') || '—')}</b>`;
  const pj = parts.map(p => p.meta?.proyecto).filter(Boolean)[0]; if (pj) h += `<br>Proyecto IFC: <b>${esc(pj)}</b>`;
  const sz = S.box.getSize(new THREE.Vector3());
  h += `<br>Extensión: ${sz.x.toFixed(1)} × ${sz.z.toFixed(1)} m · altura ${sz.y.toFixed(1)} m`;
  for (const p of parts) {
    if (p.meta?.georef) { const g = p.meta.georef; h += `<br><b>Georreferencia (IfcMapConversion)</b>: E ${(+g.E).toLocaleString('es-CL')} · N ${(+g.N).toLocaleString('es-CL')} · H ${g.H ?? '—'}${g.crs ? ' · ' + esc(g.crs) : ''}`; }
    if (p.meta?.offset) h += `<br>Coordenadas grandes trasladadas al origen para visualizar (${esc(p.meta.archivo || p.file)}): traslación X / Y / Z = ${p.meta.offset.map(v => v.toLocaleString('es-CL')).join(' / ')} m`;
  }
  h += `<br><span class="hint">${esc(S.M.src)}</span>`;
  $('meta').innerHTML = h;
}

// ---------- Panel izquierdo: clases / árbol / disciplinas ----------
let leftView = 'cls';
document.querySelector('.vt').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; leftView = b.dataset.v; document.querySelectorAll('.vt button').forEach(x => x.classList.toggle('on', x === b)); renderLeft(); });
function swatch(k) {
  if (S.colorMode === 'tex') { const o = S.byClass[k]?.[0]; const t = o && TEX[o.userData.tex]; return t?.file ? `background-image:url(img/tex/${t.file})` : `background:${t ? '#' + t.color.toString(16).padStart(6, '0') : '#cfd8dc'}`; }
  return `background:${S.colors[k]}`;
}
export function renderLeft() {
  if (!S.root) return;
  const el = $('classes');
  if (leftView === 'cls') {
    const ks = Object.keys(S.byClass).sort((a, b) => S.byClass[b].length - S.byClass[a].length);
    el.innerHTML = ks.map(k => `<label class="cls"><input type="checkbox" ${S.classOn[k] ? 'checked' : ''} data-c="${esc(k)}"><span class="sw" style="${swatch(k)}"></span><span class="lbl" title="${esc(k)}">${esc(ES[k] || k.replace(/^Ifc/, ''))}<br><span class="k" style="text-transform:none">${esc(k)}</span></span><span class="n">${S.byClass[k].length}</span></label>`).join('');
  } else if (leftView === 'disc') {
    const ds = Object.keys(S.disc);
    el.innerHTML = ds.map(d => `<label class="cls"><input type="checkbox" ${S.discOn[d] ? 'checked' : ''} data-d="${esc(d)}"><span class="sw" style="background:${S.disc[d]}"></span><span class="lbl">${esc(d)}</span><span class="n">${S.elems.filter(o => o.userData.disc === d).length}</span></label>`).join('') + `<p class="hint">Cada disciplina es dueña de su archivo. Juntas forman el <b>modelo federado</b>.</p>`;
  } else {
    const pj = S.parts.map(p => p.meta?.proyecto).filter(Boolean)[0] || S.M.name;
    const st = {}; for (const o of S.elems) { const s = o.userData.storey; (st[s] ||= {})[o.userData.cls] = ((st[s] ||= {})[o.userData.cls] || 0) + 1; }
    let h = `<div class="tree"><div class="nd">📁 <code>IfcProject</code> ${esc(pj)}</div><div style="padding-left:12px"><div class="nd">🌐 <code>IfcSite</code> Sitio</div><div style="padding-left:12px"><div class="nd">🏠 <code>IfcBuilding</code> ${esc(S.M.name)}</div><div style="padding-left:12px">`;
    for (const s of Object.keys(st).sort()) {
      h += `<div class="nd click ${S.storeyOnly === s ? 'on' : ''}" data-s="${esc(s)}" title="Clic: aislar este nivel">▤ <code>IfcBuildingStorey</code> ${esc(s)}</div><div style="padding-left:14px">`;
      h += Object.entries(st[s]).sort((a, b) => b[1] - a[1]).map(([c, n]) => `<div class="nd">· ${esc(ES[c] || c)} <span class="k" style="text-transform:none">${esc(c)}</span> <span class="n" style="margin-left:auto">${n}</span></div>`).join('') + '</div>';
    }
    h += `</div></div></div></div><p class="hint">Así ordena IFC la información: Proyecto → Sitio → Edificio → Nivel → Elementos. Haz clic en un nivel para aislarlo.</p>`;
    el.innerHTML = h;
  }
}
$('classes').addEventListener('change', e => {
  const c = e.target.dataset.c, d = e.target.dataset.d;
  if (c) S.classOn[c] = e.target.checked; if (d) S.discOn[d] = e.target.checked;
  refresh(); emit('classToggle', { c, d, on: e.target.checked });
});
$('classes').addEventListener('click', e => {
  const n = e.target.closest('[data-s]'); if (!n) return;
  S.storeyOnly = S.storeyOnly === n.dataset.s ? null : n.dataset.s; renderLeft(); refresh();
});
$('all').onclick = () => setAll(true); $('none').onclick = () => setAll(false);
export function setAll(v) { Object.keys(S.classOn).forEach(k => S.classOn[k] = v); Object.keys(S.discOn).forEach(k => S.discOn[k] = v); S.storeyOnly = null; renderLeft(); refresh(); }
export function isolateClasses(re) { Object.keys(S.classOn).forEach(k => S.classOn[k] = re.test(k)); renderLeft(); refresh(); }
export function isolateDisc(re) { Object.keys(S.discOn).forEach(k => S.discOn[k] = re.test(k)); renderLeft(); refresh(); }

// ---------- Visibilidad y materiales ----------
function visibleBase(o) {
  const u = o.userData;
  if (!S.classOn[u.cls] || !S.discOn[u.disc]) return false;
  if (S.storeyOnly && u.storey !== S.storeyOnly) return false;
  if (S.phase !== null && phaseOf(u.cls) > S.phase) return false;
  return true;
}
function baseMat(o) {
  const u = o.userData;
  if (S.colorMode === 'tex' && u.tex) return texMats[u.tex] ||= triplanar(u.tex, renderer, clip);
  if (S.colorMode === 'cls') return clsMats['c:' + u.cls] ||= new THREE.MeshStandardMaterial({ color: S.colors[u.cls], roughness: .75, side: THREE.DoubleSide, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  if (S.colorMode === 'disc') return clsMats['d:' + u.disc] ||= new THREE.MeshStandardMaterial({ color: S.disc[u.disc], roughness: .75, side: THREE.DoubleSide, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  return u.mat;
}
function xr(m) { if (!xrMats.has(m)) { const x = new THREE.MeshStandardMaterial({ color: m.color, vertexColors: m.vertexColors, roughness: .8, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [clip] }); xrMats.set(m, x); } return xrMats.get(m); }
export function refresh() {
  if (!S.root) return;
  for (const o of S.elems) {
    const v = visibleBase(o);
    o.visible = v && S.lod === 300;
    if (o.userData.edges) o.userData.edges.visible = S.cad && o.visible;
    let m;
    if (o === S.selected) m = selMat;
    else if (S.clash.has(o)) m = clashMat;
    else if (S.cad) m = cadMat;
    else if (S.phase !== null && phaseOf(o.userData.cls) === S.phase) m = phaseMat;
    else { m = baseMat(o); if (S.xray || (S.clash.size && !S.clash.has(o))) m = xr(m); }
    o.material = m;
  }
  if (S.proxy) S.proxy.children.forEach(p => p.visible = p.userData.of.some(visibleBase));
  legend();
}
export function setColor(mode, silent) {
  S.colorMode = mode;
  document.querySelectorAll('#colorSeg button').forEach(b => b.classList.toggle('on', b.dataset.c === mode));
  if (!silent) { refresh(); renderLeft(); emit('color', { mode }); }
}
$('colorSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setColor(b.dataset.c); });
function legend() {
  const L = $('legend');
  if (!S.root || !(S.colorMode === 'disc' || S.colorMode === 'tex') || S.cad) { L.hidden = true; return; }
  if (S.colorMode === 'disc') L.innerHTML = '<b>Disciplinas</b>' + Object.entries(S.disc).map(([d, c]) => `<div><span class="sw" style="background:${c}"></span>${esc(d)}</div>`).join('');
  else { const ks = [...new Set(S.elems.filter(o => o.visible).map(o => o.userData.tex).filter(Boolean))]; L.innerHTML = '<b>Materiales</b>' + ks.map(k => `<div><span class="sw" style="${TEX[k].file ? `background-image:url(img/tex/${TEX[k].file})` : 'background:#' + TEX[k].color.toString(16)}"></span>${esc(TEX[k].label)}</div>`).join(''); }
  L.hidden = false;
}

// ---------- Cámara ----------
export function fit(dir = new THREE.Vector3(1, .75, 1.25), box = S.box) {
  if (!box) return;
  const s = box.getSize(new THREE.Vector3()), r = Math.max(s.x, s.y, s.z) || 10, c = box.getCenter(new THREE.Vector3());
  camera.near = Math.max(r / 2000, .01); camera.far = r * 60; camera.updateProjectionMatrix();
  camera.position.copy(c).add(dir.clone().normalize().multiplyScalar(r * 1.35)); controls.target.copy(c); controls.update();
}
$('home').onclick = () => fit();
$('top').onclick = () => fit(new THREE.Vector3(.001, 1, .001));
controls.addEventListener('start', () => emit('orbit'));

// ---------- Corte ----------
$('cutBtn').onclick = () => { const on = $('cutBtn').classList.toggle('on'); $('cut').classList.toggle('show', on); if (!on) $('cutH').value = 1000; setCut(); emit('cut', { on }); };
$('cutH').oninput = () => { setCut(); emit('cut', { on: true, v: +$('cutH').value }); };
export function setCutFrac(f) { $('cutBtn').classList.add('on'); $('cut').classList.add('show'); $('cutH').value = Math.round(f * 1000); setCut(); }
function setCut() {
  if (!S.box) return; const t = $('cutH').value / 1000; const y = S.box.min.y + (S.box.max.y - S.box.min.y) * t;
  clip.constant = $('cutBtn').classList.contains('on') ? y : 1e6;
  $('cutV').textContent = (y - S.box.min.y).toFixed(2) + ' m';
}

// ---------- Rayos X / CAD / LOD ----------
$('xray').onclick = () => { S.xray = $('xray').classList.toggle('on'); refresh(); emit('xray', { on: S.xray }); };
export function setXray(v) { S.xray = v; $('xray').classList.toggle('on', v); refresh(); }
$('cadBtn').onclick = () => setCad(!S.cad);
export function setCad(v) {
  S.cad = v; $('cadBtn').classList.toggle('on', v);
  if (v) { msg('Generando líneas…'); requestAnimationFrame(() => { for (const o of S.elems) if (!o.userData.edges) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), cadLine); e.raycast = () => {}; o.add(e); o.userData.edges = e; } msg(null); refresh(); }); }
  else refresh();
  emit('cad', { on: v });
}
$('lod').onchange = () => setLod(+$('lod').value);
export function setLod(v) {
  S.lod = v; $('lod').value = String(v);
  if (S.proxy) { scene.remove(S.proxy); S.proxy.traverse(o => o.geometry?.dispose()); S.proxy = null; }
  if (v < 300) {
    const g = S.proxy = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: v === 100 ? 0xD9C9B0 : 0xC9D3DC, roughness: .9, transparent: v === 100, opacity: v === 100 ? .9 : 1, side: THREE.DoubleSide, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: 1 });
    const groups = {};
    for (const o of S.elems) {
      if (/IfcGeographic|IfcEarthworks|IfcSpace|IfcOpening/.test(o.userData.cls)) continue;
      const key = v === 100 ? (o.userData.file || '') + '|' + o.userData.storey : o.uuid;
      (groups[key] ||= []).push(o);
    }
    for (const list of Object.values(groups)) {
      const b = new THREE.Box3(); list.forEach(o => b.expandByObject(o)); if (b.isEmpty()) continue;
      const s = b.getSize(new THREE.Vector3()).max(new THREE.Vector3(.02, .02, .02));
      const m = new THREE.Mesh(new THREE.BoxGeometry(s.x, s.y, s.z), mat); m.position.copy(b.getCenter(new THREE.Vector3()));
      m.castShadow = m.receiveShadow = true; m.userData.of = list;
      const ed = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x5A6478, clippingPlanes: [clip] })); ed.raycast = () => {}; m.add(ed);
      g.add(m);
    }
    scene.add(g);
  }
  refresh(); emit('lod', { v });
}

// ---------- Selección, hover y medición ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null, measuring = false, mpts = [], mObjs = [];
function pick(e) {
  const r = canvas.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const targets = S.lod < 300 && S.proxy ? S.proxy.children : S.elems;
  return ray.intersectObjects(targets.filter(o => o.visible), false).find(h => h.point.y <= clip.constant + 1e-6);
}
$('measBtn').onclick = () => { measuring = $('measBtn').classList.toggle('on'); clearMeasure(); $('measCard').hidden = !measuring; $('measV').textContent = '—'; $('measD').textContent = measuring ? 'Haz clic en el primer punto.' : ''; if (measuring) rtab('r-ficha'); };
canvas.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5 || !S.root) return;
  const hit = pick(e);
  if (measuring) { if (hit) addMeasure(hit.point); return; }
  if (hit && hit.object.userData.of) { select(hit.object.userData.of[0]); return; }
  select(hit ? hit.object : null);
});
canvas.addEventListener('dblclick', e => { const h = pick(e); if (!h) return; const b = new THREE.Box3().setFromObject(h.object); controls.target.copy(b.getCenter(new THREE.Vector3())); const d = Math.max(...b.getSize(new THREE.Vector3()).toArray(), 2) * 2.2; camera.position.copy(controls.target).add(camera.position.clone().sub(controls.target).setLength(d)); controls.update(); });
let hovT = 0;
canvas.addEventListener('pointermove', e => {
  const H = $('hover'); if (e.buttons || !S.root || performance.now() - hovT < 70) return; hovT = performance.now();
  const h = pick(e); if (!h) { H.hidden = true; return; }
  const o = h.object.userData.of ? h.object.userData.of[0] : h.object, p = S.props[o.userData.guid] || {};
  const r = stage.getBoundingClientRect(); H.style.left = (e.clientX - r.left) + 'px'; H.style.top = (e.clientY - r.top) + 'px';
  H.textContent = (ES[p.c] || p.c) + ' · ' + (p.n || '').slice(0, 40); H.hidden = false;
});
canvas.addEventListener('pointerleave', () => $('hover').hidden = true);
function marker(p) { const s = Math.max(...S.box.getSize(new THREE.Vector3()).toArray()) / 160; const m = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 12), new THREE.MeshBasicMaterial({ color: 0xE8772A, depthTest: false })); m.position.copy(p); m.renderOrder = 9; scene.add(m); mObjs.push(m); }
function addMeasure(p) {
  if (mpts.length === 2) clearMeasure();
  mpts.push(p.clone()); marker(p);
  if (mpts.length === 2) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(mpts), new THREE.LineBasicMaterial({ color: 0xE8772A, depthTest: false })); l.renderOrder = 9; scene.add(l); mObjs.push(l);
    const d = mpts[0].distanceTo(mpts[1]), dz = Math.abs(mpts[1].y - mpts[0].y), dh = Math.hypot(mpts[1].x - mpts[0].x, mpts[1].z - mpts[0].z);
    $('measV').textContent = d.toFixed(3) + ' m'; $('measD').textContent = `Horizontal ${dh.toFixed(3)} m · Desnivel ${dz.toFixed(3)} m · Pendiente ${dh > 0 ? (dz / dh * 100).toFixed(1) + ' %' : '—'}`;
    emit('measure', { d });
  } else $('measD').textContent = 'Ahora el segundo punto.';
}
function clearMeasure() { mObjs.forEach(o => scene.remove(o)); mObjs = []; mpts = []; }

export async function select(o) {
  S.selected = o || null; refresh();
  const p = o ? S.props[o.userData.guid] : null;
  if (p && p._eid != null && !p.p) { $('props').innerHTML = '<p class="hint">Leyendo propiedades del IFC…</p>'; const { fillProps } = await import('./ifc.js'); await fillProps(p); o.userData.tex = o.userData.tex || texKind(p, o.userData.file); }
  showProps(p, o?.userData.guid, o);
  if (o) { rtab('r-ficha'); emit('select', { cls: p?.c, guid: o.userData.guid }); }
}
export function selectGuid(guid) { const o = S.elems.find(e => e.userData.guid === guid); if (o) { select(o); const b = new THREE.Box3().setFromObject(o); controls.target.copy(b.getCenter(new THREE.Vector3())); controls.update(); } return !!o; }
export function selectFirst(re, nameRe) { const o = S.elems.find(e => re.test(e.userData.cls) && (!nameRe || nameRe.test(S.props[e.userData.guid]?.n || ''))); if (o) select(o); return o; }
function showProps(p, guid, o) {
  if (!p) { $('props').innerHTML = '<div class="card"><p class="hint" style="margin:0">Haz clic sobre un objeto del modelo para ver su <b>ficha IFC</b>: clase, nivel, material y conjuntos de propiedades (Psets). Eso es lo que diferencia BIM de un dibujo CAD.</p></div>'; return; }
  const tk = o?.userData.tex;
  const matTxt = /^(Ifc|Material)/.test(p.m || '') ? 'Conjunto de capas o componentes (ver Psets)' : p.m;
  const base = [['Clase IFC', p.c], ['Tipo', p.t], ['Nivel', p.s], ['Material', matTxt], ['Textura en visor', tk ? TEX[tk].label : null], ['Disciplina', o?.userData.disc], ['GlobalId', guid]].filter(r => r[1]);
  const fmt = v => typeof v === 'number' ? `<td class="num">${esc(v.toLocaleString('es-CL', { maximumFractionDigits: 4 }))}</td>` : `<td>${esc(v === true ? 'Sí' : v === false ? 'No' : v)}</td>`;
  let h = `<div class="card"><div class="k">${esc(ES[p.c] || p.c)}</div><div class="big">${esc(p.n || '(sin nombre)')}</div><table>${base.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>`;
  if (o) { const b = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); h += `<div class="ps">Caja envolvente (medida en el visor)</div><table><tr><td>Largo × ancho × alto</td><td class="num">${b.x.toFixed(2)} × ${b.z.toFixed(2)} × ${b.y.toFixed(2)} m</td></tr></table>`; }
  for (const [ps, d] of Object.entries(p.p || {})) {
    const rows = Object.entries(d).filter(([k, v]) => v !== '' && v != null && v !== k); if (!rows.length) continue;
    h += `<div class="ps">${esc(ps)}</div><table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td>${fmt(v)}</tr>`).join('')}</table>`;
  }
  $('props').innerHTML = h + '</div>';
}

// ---------- Pestañas ----------
function tabs(sel) { document.querySelectorAll(sel + ' > .tabs').forEach(t => t.addEventListener('click', e => { const b = e.target.closest('button'); if (b) tabTo(sel, b.dataset.tab); })); }
function tabTo(sel, id) { const a = document.querySelector(sel); a.querySelectorAll(':scope>.tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === id)); a.querySelectorAll(':scope>.tab').forEach(x => x.classList.toggle('on', x.id === id)); }
tabs('aside.l'); tabs('aside.r');
export const ltab = id => tabTo('aside.l', id), rtab = id => tabTo('aside.r', id);

// ---------- 4D ----------
function buildPhaseList() {
  const used = new Set(S.elems.map(o => phaseOf(o.userData.cls)));
  $('p4list').innerHTML = PHASES.map(([n], i) => `<li data-i="${i}" class="${S.phase === null || i < S.phase ? 'done' : i === S.phase ? 'now' : ''}">${esc(n)}${used.has(i) ? '' : ' <span class="pill">sin elementos</span>'}</li>`).join('');
}
export function setPhase(i) {
  S.phase = i === null || i >= PHASES.length ? null : i; $('p4').value = S.phase ?? 8;
  $('p4lbl').textContent = S.phase === null ? 'Obra terminada' : `Fase ${S.phase + 1}: ${PHASES[S.phase][0]}`;
  buildPhaseList(); refresh(); emit('phase', { i: S.phase });
}
$('p4').oninput = () => setPhase(+$('p4').value);
$('p4off').onclick = () => { stop4d(); setPhase(null); };
let p4t = null; const stop4d = () => { clearInterval(p4t); p4t = null; $('p4play').textContent = '▶ Reproducir'; };
$('p4play').onclick = () => { if (p4t) return stop4d(); let i = 0; setPhase(0); $('p4play').textContent = '■ Detener'; p4t = setInterval(() => { i++; if (i > PHASES.length) { stop4d(); return; } setPhase(i >= PHASES.length ? null : i); }, 1300); };

// ---------- 5D ----------
const Q = {}; let q5rows = [];
function qty(p) {
  const out = { v: 0, a: 0, l: 0 }; let fv = 0, fa = 0, fl = 0;
  for (const d of Object.values(p.p || {})) for (const [k, v] of Object.entries(d)) {
    if (typeof v !== 'number' || v <= 0) continue; const kk = k.toLowerCase().replace(/[\s_-]/g, '');
    if (!fv && /^(netvolume|volume|volumen|grossvolume)$/.test(kk)) { out.v = v; fv = 1; }
    else if (!fa && /^(netsidearea|netarea|area|grossarea|grosssidearea|netsurfacearea|grosssurfacearea|área)$/.test(kk)) { out.a = v; fa = 1; }
    else if (!fl && /^(length|largo|longitud)$/.test(kk)) { out.l = v; fl = 1; }
  }
  return out;
}
$('q5calc').onclick = calc5d;
export async function calc5d() {
  if (!S.root) return;
  const lazy = S.elems.filter(o => { const p = S.props[o.userData.guid]; return p._eid != null && !p.p; });
  if (lazy.length) { const { fillProps } = await import('./ifc.js'); let i = 0; for (const o of lazy) { await fillProps(S.props[o.userData.guid]); if (++i % 50 === 0) $('q5').innerHTML = `<p class="hint">Leyendo cantidades ${i}/${lazy.length}…</p>`; } }
  const agg = {};
  for (const o of S.elems) { const p = S.props[o.userData.guid]; const q = qty(p); const r = agg[p.c] ||= { c: p.c, n: 0, v: 0, a: 0, l: 0 }; r.n++; r.v += q.v; r.a += q.a; r.l += q.l; }
  q5rows = Object.values(agg).map(r => ({ ...r, u: r.v > 0 ? 'm³' : r.a > 0 ? 'm²' : r.l > 0 ? 'm' : 'un', q: r.v > 0 ? r.v : r.a > 0 ? r.a : r.l > 0 ? r.l : r.n })).sort((a, b) => b.n - a.n);
  draw5d(); emit('5d');
}
function draw5d() {
  let tot = 0;
  const rows = q5rows.map((r, i) => { const pu = Q[r.c + r.u] || 0, sub = pu * r.q; tot += sub; return `<tr><td>${esc(ES[r.c] || r.c)}<br><span class="k" style="text-transform:none">${r.n} el.</span></td><td class="num">${r.q.toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${r.u}</td><td class="num"><input type="number" min="0" step="100" data-i="${i}" value="${pu || ''}" placeholder="$/${r.u}" aria-label="Precio unitario ${esc(r.c)}"></td><td class="num">${sub ? '$' + Math.round(sub).toLocaleString('es-CL') : '—'}</td></tr>`; }).join('');
  $('q5').innerHTML = `<table class="q5"><tr><th>Partida</th><th class="num">Cantidad</th><th class="num">P. unit.</th><th class="num">Subtotal</th></tr>${rows}</table><div class="tot">Total: $${Math.round(tot).toLocaleString('es-CL')}</div><p class="hint">Cubicación referencial a partir de las propiedades del IFC. Las cantidades dependen de cómo se modeló y exportó: verifícalas antes de presupuestar.</p>`;
}
$('q5').addEventListener('change', e => { const i = e.target.dataset.i; if (i == null) return; const r = q5rows[i]; Q[r.c + r.u] = +e.target.value || 0; draw5d(); });
$('q5demo').onclick = async () => {
  if (!q5rows.length) await calc5d();
  const ej = { 'm³': { IfcFooting: 180000, IfcSlab: 165000, IfcColumn: 210000, IfcBeam: 210000, _: 150000 }, 'm²': { IfcWall: 38000, IfcWallStandardCase: 38000, IfcRoof: 32000, IfcCovering: 15000, _: 25000 }, 'm': { _: 12000 }, 'un': { IfcDoor: 180000, IfcWindow: 120000, _: 45000 } };
  for (const r of q5rows) Q[r.c + r.u] = ej[r.u][r.c] ?? ej[r.u]._;
  draw5d(); toast('Precios ficticios solo para practicar: reemplázalos por precios reales.');
};
$('q5csv').onclick = () => {
  if (!q5rows.length) return toast('Primero calcula las cantidades.');
  const lines = [['Clase IFC', 'Partida', 'Elementos', 'Cantidad', 'Unidad', 'Precio unitario CLP', 'Subtotal CLP'].join(';')].concat(q5rows.map(r => { const pu = Q[r.c + r.u] || 0; return [r.c, ES[r.c] || r.c, r.n, r.q.toFixed(3).replace('.', ','), r.u, pu, Math.round(pu * r.q)].join(';'); }));
  download(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' }), `GeoIAN_5D_${S.M.id}.csv`);
};
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

// ---------- Detección de choques (cajas envolventes) ----------
const NOCLASH = /IfcGeographic|IfcEarthworks|IfcSpace|IfcOpening|IfcSite|IfcAnnotation|IfcSurfaceFeature|IfcCourse/;
$('clRun').onclick = () => runClash();
$('clClear').onclick = () => { S.clash.clear(); S.clashPair = null; $('clRes').innerHTML = ''; refresh(); };
export function runClash() {
  if (!S.root) return [];
  const tol = +$('clTol').value;
  const items = S.elems.filter(o => o.visible && !NOCLASH.test(o.userData.cls) && o.userData.tex !== 'vegetal').map(o => ({ o, b: new THREE.Box3().setFromObject(o), d: o.userData.disc }));
  const discs = [...new Set(items.map(i => i.d))];
  const res = [];
  if (discs.length < 2) { $('clRes').innerHTML = '<p class="hint">Este modelo tiene una sola disciplina visible. Prueba con el <b>Proyecto federado</b> o el <b>Edificio Revit ARQ + EST</b>.</p>'; return res; }
  items.sort((a, b) => a.b.min.x - b.b.min.x);
  const cand = [];
  for (let i = 0; i < items.length && cand.length < 4000; i++) {
    const A = items[i]; if (A.b.isEmpty()) continue;
    for (let j = i + 1; j < items.length; j++) {
      const B = items[j]; if (B.b.min.x > A.b.max.x) break;
      if (A.d === B.d || B.b.isEmpty() || !A.b.intersectsBox(B.b)) continue;
      cand.push([A, B]);
    }
  }
  // Refinamiento: muestreo de puntos dentro de la zona común, probando si caen DENTRO de ambos sólidos (paridad de rayos)
  S.clashCand = cand.length;
  const cap = cand.length > 800 ? 8 : 24, P = new THREE.Vector3();
  for (const [A, B] of cand) {
    if (res.length >= 300) break;
    const ib = A.b.clone().intersect(B.b), sz = ib.getSize(new THREE.Vector3()); let hit = 0;
    const step = Math.max(Math.min(sz.x, sz.y, sz.z) / 2, .03);
    const nx = Math.min(cap, Math.max(1, Math.ceil(sz.x / step))), ny = Math.min(cap, Math.max(1, Math.ceil(sz.y / step))), nz = Math.min(cap, Math.max(1, Math.ceil(sz.z / step)));
    for (let x = 0; x < nx && !hit; x++) for (let y = 0; y < ny && !hit; y++) for (let z = 0; z < nz; z++) {
      P.set(ib.min.x + sz.x * (x + .5) / nx, ib.min.y + sz.y * (y + .5) / ny, ib.min.z + sz.z * (z + .5) / nz);
      if (inside(A.o, P) && inside(B.o, P)) { hit++; break; }
    }
    if (!hit && (edgeCross(A.o, B.o, ib, tol) || edgeCross(B.o, A.o, ib, tol))) hit = 1;
    if (hit) res.push({ a: A.o, b: B.o, vol: sz.x * sz.y * sz.z });
  }
  res.sort((x, y) => y.vol - x.vol);
  S.clashRes = res;
  $('clRes').innerHTML = res.length ? `<p><b>${res.length}</b> posibles interferencias entre disciplinas${res.length >= 300 ? ' (se muestran las primeras 300)' : ''}. Clic para revisar:</p>` + res.slice(0, 80).map((r, i) => { const pa = S.props[r.a.userData.guid], pb = S.props[r.b.userData.guid]; return `<div class="clash" data-i="${i}"><b>${i + 1}.</b> ${esc(ES[pa.c] || pa.c)} <span class="pill">${esc(r.a.userData.disc)}</span> × ${esc(ES[pb.c] || pb.c)} <span class="pill">${esc(r.b.userData.disc)}</span><br><span class="hint">${esc((pa.n || '').slice(0, 38))} · ${esc((pb.n || '').slice(0, 38))}</span></div>`; }).join('') : '<p class="hint">No se encontraron interferencias con esta tolerancia. ¡Modelo coordinado!</p>';
  emit('clash', { n: res.length });
  return res;
}
$('clRes').addEventListener('click', e => { const d = e.target.closest('.clash'); if (d) showClash(+d.dataset.i); });
const _rc = new THREE.Raycaster(), DIRS = [new THREE.Vector3(1, .137, .071).normalize(), new THREE.Vector3(-.093, 1, .211).normalize()];
function inside(o, p) {
  for (const d of DIRS) {
    _rc.set(p, d); const hits = [];
    const m = o.material; o.material = cadMat; o.raycast(_rc, hits); o.material = m;
    let c = 0, last = -1; hits.sort((a, b) => a.distance - b.distance).forEach(h => { if (h.distance - last > 1e-5) { c++; last = h.distance; } });
    if (c % 2 === 0) return false;
  }
  return true;
}
// ¿Alguna arista de A atraviesa una cara de B dentro de la zona común? (choque "duro" de superficies)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
function edgeCross(A, B, box, tol) {
  const g = A.geometry, pos = g.attributes.position, idx = g.index, n = idx ? idx.count : pos.count, mw = A.matrixWorld;
  const zone = box.clone().expandByScalar(tol + .001); const m = B.material; B.material = cadMat;
  const hits = []; let tested = 0, found = false;
  const V3 = (k, t) => t.fromBufferAttribute(pos, idx ? idx.getX(k) : k).applyMatrix4(mw);
  for (let t = 0; t < n && !found && tested < 6000; t += 3) {
    V3(t, _a); V3(t + 1, _b); V3(t + 2, _c);
    if (!zone.containsPoint(_a) && !zone.containsPoint(_b) && !zone.containsPoint(_c)) continue;
    for (const [p, q] of [[_a, _b], [_b, _c], [_c, _a]]) {
      const len = _d.subVectors(q, p).length(); if (len < 2 * tol + 1e-4) continue;
      _rc.set(p, _d.normalize()); _rc.near = tol; _rc.far = len - tol; hits.length = 0; tested++;
      B.raycast(_rc, hits); if (hits.length) { found = true; break; }
    }
  }
  _rc.near = 0; _rc.far = Infinity; B.material = m;
  return found;
}
export function showClash(i) {
  const r = S.clashRes?.[i]; if (!r) return;
  document.querySelectorAll('.clash').forEach(x => x.classList.toggle('on', +x.dataset.i === i));
  S.clash = new Set([r.a, r.b]); S.selected = null; refresh();
  const b = new THREE.Box3().setFromObject(r.a).union(new THREE.Box3().setFromObject(r.b));
  fit(camera.position.clone().sub(controls.target), b);
  emit('clashShow', { i });
}

// ---------- Captura con marca ----------
$('shot').onclick = () => {
  renderer.render(scene, camera);
  const w = canvas.width, h = canvas.height, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#CFE2EE'); sky.addColorStop(.7, '#F4F7F9'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
  x.drawImage(canvas, 0, 0);
  const img = new Image(); img.onload = () => {
    const bh = Math.round(h * .07), bw = bh * 270 / 76, pad = bh * .35;
    x.fillStyle = 'rgba(27,42,74,.88)'; x.fillRect(0, h - bh - pad * 2, w, bh + pad * 2);
    x.drawImage(img, pad, h - bh - pad, bw, bh);
    x.fillStyle = '#fff'; x.font = `600 ${Math.round(bh * .38)}px Segoe UI, Arial`; x.textAlign = 'right';
    x.fillText(`Visor BIM · ${S.M?.name || ''}`, w - pad, h - pad - bh * .5); x.fillStyle = '#FFC48F'; x.font = `${Math.round(bh * .28)}px Segoe UI, Arial`; x.fillText('ayam-arias.github.io/visor-bim', w - pad, h - pad - bh * .05);
    c.toBlob(b => download(b, `GeoIAN_VisorBIM_${S.M?.id || 'modelo'}.png`));
  };
  img.src = 'img/geoian-logo-dark.svg';
};
$('fs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen?.();

// ---------- Importar IFC / GLB / glTF ----------
$('file').onchange = e => importFiles([...e.target.files]);
let dragN = 0;
window.addEventListener('dragenter', e => { if ([...e.dataTransfer.types].includes('Files')) { dragN++; $('dropzone').classList.add('show'); } });
window.addEventListener('dragleave', () => { if (--dragN <= 0) { dragN = 0; $('dropzone').classList.remove('show'); } });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => { e.preventDefault(); dragN = 0; $('dropzone').classList.remove('show'); const f = [...e.dataTransfer.files]; if (f.length) importFiles(f); });

export async function importFiles(files) {
  files = files.filter(f => /\.(ifc|glb|gltf)$/i.test(f.name));
  if (!files.length) return toast('Formatos aceptados: .ifc, .glb o .gltf');
  const parts = [];
  for (const f of files) {
    try {
      msg(`Abriendo ${f.name} (${(f.size / 1048576).toFixed(1)} MB)…`);
      const buf = await f.arrayBuffer(), base = f.name.replace(/\.\w+$/, '');
      if (/\.ifc$/i.test(f.name)) {
        const { loadIFC } = await import('./ifc.js');
        const r = await loadIFC(buf, f.name, t => msg(`${f.name}: ${t}`));
        if (!r.group.children.length) { toast(`${f.name}: no se encontró geometría.`); continue; }
        parts.push({ group: r.group, props: r.props, meta: r.meta, file: base });
      } else {
        const g = await gl.parseAsync(/\.gltf$/i.test(f.name) ? new TextDecoder().decode(buf) : buf, '');
        const props = {}; g.scene.traverse(o => { if (o.isMesh) { o.name ||= o.uuid; props[o.name] = { c: 'Elemento glTF', n: o.name }; } });
        parts.push({ group: g.scene, props, meta: { schema: 'glTF', archivo: f.name }, file: base, glb: true });
      }
    } catch (err) { console.error(err); toast(`No se pudo leer ${f.name}: ${err.message || err}`); }
  }
  if (!parts.length) { msg(S.root ? null : 'No se pudo abrir el archivo.'); return; }
  const name = parts.length === 1 ? parts[0].file : `Federado (${parts.length} archivos)`;
  S.user = { M: { id: 'user', name, src: 'Archivo(s) abierto(s) desde tu computador. Nada se sube a internet.' }, parts };
  let b = document.querySelector('#models [data-id=user]');
  if (!b) { b = document.createElement('button'); b.dataset.id = 'user'; $('models').prepend(b); }
  b.textContent = '📂 ' + name;
  await load('user');
  toast(`Listo: ${S.elems.length.toLocaleString('es-CL')} elementos cargados.`);
  emit('import', { n: parts.length });
}

// ---------- Tema ----------
(() => { let t = null; try { t = localStorage.getItem('geoian-theme'); } catch (e) {} document.documentElement.dataset.theme = t || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); })();
$('theme').onclick = () => { const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = n; try { localStorage.setItem('geoian-theme', n); } catch (e) {} };

// ---------- Bucle ----------
function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); }
resize(); loop();

// API para el módulo didáctico y pruebas
export const V = { _inside: (o, p) => inside(o, p), S, load, select, selectGuid, selectFirst, setColor, setXray, setCad, setLod, setPhase, setCutFrac, setAll, isolateClasses, isolateDisc, fit, runClash, showClash, calc5d, ltab, rtab, refresh, renderLeft, toast, bus, MODELS, ES, camera, controls };
window.GeoIAN = V;
initAprende(V);
const start = MODELS.find(m => '#' + m.id === location.hash) || MODELS[0];
load(start.id);
