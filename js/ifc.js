// GeoIAN · Visor BIM — importación de IFC (2x3, 4, 4.3) en el navegador con web-ifc (MPL-2.0)
// El archivo se lee localmente: nunca sale del computador del usuario.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let W = null, api = null;
async function init() {
  if (api) return api;
  W = await import('../lib/web-ifc/web-ifc-api.js');
  api = new W.IfcAPI();
  api.SetWasmPath(new URL('../lib/web-ifc/', import.meta.url).href, true);
  await api.Init(undefined, true);
  return api;
}

const CASE = {};
export function ifcCase(up) {
  if (!CASE._init && W) { for (const ns of [W.IFC2X3, W.IFC4, W.IFC4X3]) for (const k of Object.keys(ns || {})) if (/^Ifc/.test(k)) CASE[k.toUpperCase()] = k; CASE._init = 1; }
  const U = String(up).toUpperCase();
  return CASE[U] ||= (/^Ifc[A-Z]/.test(up) ? up : 'Ifc' + U.slice(3).charAt(0) + U.slice(4).toLowerCase());
}
const val = v => (v && typeof v === 'object' && 'value' in v) ? v.value : v;

// Devuelve { group, props, meta, modelID }
export async function loadIFC(buffer, fileName, onProgress = () => {}) {
  await init();
  onProgress('Leyendo IFC…');
  const id = api.OpenModel(new Uint8Array(buffer), { COORDINATE_TO_ORIGIN: true });
  const schema = api.GetModelSchema(id);
  const props = {}, byElem = new Map();
  const mtx = new THREE.Matrix4();
  let n = 0;
  api.StreamAllMeshes(id, mesh => {
    const eid = mesh.expressID, geos = mesh.geometries, parts = [];
    let alpha = 1;
    for (let i = 0; i < geos.size(); i++) {
      const pg = geos.get(i), g = api.GetGeometry(id, pg.geometryExpressID);
      const v = api.GetVertexArray(g.GetVertexData(), g.GetVertexDataSize());
      const ix = api.GetIndexArray(g.GetIndexData(), g.GetIndexDataSize());
      const nv = v.length / 6, pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
      for (let k = 0; k < nv; k++) {
        pos[k*3] = v[k*6]; pos[k*3+1] = v[k*6+1]; pos[k*3+2] = v[k*6+2];
        nor[k*3] = v[k*6+3]; nor[k*3+1] = v[k*6+4]; nor[k*3+2] = v[k*6+5];
        col[k*3] = pg.color.x; col[k*3+1] = pg.color.y; col[k*3+2] = pg.color.z;
      }
      alpha = Math.min(alpha, pg.color.w);
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      bg.setIndex(new THREE.BufferAttribute(new Uint32Array(ix), 1));
      bg.applyMatrix4(mtx.fromArray(pg.flatTransformation));
      parts.push(bg); g.delete();
    }
    if (!parts.length) return;
    const prev = byElem.get(eid);
    byElem.set(eid, { parts: prev ? prev.parts.concat(parts) : parts, alpha: Math.min(alpha, prev?.alpha ?? 1) });
    if (++n % 200 === 0) onProgress(`Geometría: ${n} elementos…`);
  });

  onProgress('Leyendo niveles y propiedades…');
  // Niveles (IfcBuildingStorey) por elemento
  const storey = new Map();
  const rels = api.GetLineIDsWithType(id, W.IFCRELCONTAINEDINSPATIALSTRUCTURE);
  for (let i = 0; i < rels.size(); i++) {
    const r = api.GetLine(id, rels.get(i));
    const st = api.GetLine(id, r.RelatingStructure.value);
    const nm = val(st.Name) || val(st.LongName) || ifcCase(api.GetNameFromTypeCode(api.GetLineType(id, st.expressID)));
    for (const e of [].concat(r.RelatedElements || [])) storey.set(e.value, nm);
  }
  const agg = api.GetLineIDsWithType(id, W.IFCRELAGGREGATES);
  for (let i = 0; i < agg.size(); i++) {
    const r = api.GetLine(id, agg.get(i)); const parent = r.RelatingObject.value;
    if (storey.has(parent)) for (const e of [].concat(r.RelatedObjects || [])) if (!storey.has(e.value)) storey.set(e.value, storey.get(parent));
  }

  const group = new THREE.Group(); group.name = fileName;
  for (const [eid, { parts, alpha }] of byElem) {
    let line = null; try { line = api.GetLine(id, eid); } catch (e) {}
    const guid = val(line?.GlobalId) || ('#' + eid);
    const cls = ifcCase(api.GetNameFromTypeCode(api.GetLineType(id, eid)));
    props[guid] = { c: cls, n: val(line?.Name) || '', t: val(line?.ObjectType) || null, s: storey.get(eid) || null, m: null, p: null, _eid: eid, _mid: id };
    const geo = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
    parts.forEach(p => p !== geo && p.dispose());
    const mesh = new THREE.Mesh(geo); mesh.name = guid; mesh.userData.alpha = alpha;
    group.add(mesh);
  }

  // Georreferencia (IFC4+: IfcMapConversion / IfcProjectedCRS) y desplazamiento aplicado
  const meta = { schema, proyecto: '', conteo: {}, archivo: fileName };
  try { const pj = api.GetLineIDsWithType(id, W.IFCPROJECT); if (pj.size()) meta.proyecto = val(api.GetLine(id, pj.get(0)).Name) || ''; } catch (e) {}
  try {
    const cm = api.GetCoordinationMatrix(id);
    if (cm && Math.hypot(cm[12], cm[13], cm[14]) > 100) meta.offset = [cm[12], cm[13], cm[14]].map(x => +(-x).toFixed(3));
  } catch (e) {}
  try {
    if (W.IFCMAPCONVERSION) {
      const mc = api.GetLineIDsWithType(id, W.IFCMAPCONVERSION);
      if (mc.size()) {
        const l = api.GetLine(id, mc.get(0));
        meta.georef = { E: val(l.Eastings), N: val(l.Northings), H: val(l.OrthogonalHeight) };
        const crs = l.TargetCRS ? api.GetLine(id, l.TargetCRS.value) : null;
        if (crs) meta.georef.crs = val(crs.Name) + (val(crs.Description) ? ' · ' + val(crs.Description) : '');
      }
    }
  } catch (e) {}
  for (const p of Object.values(props)) meta.conteo[p.c] = (meta.conteo[p.c] || 0) + 1;
  onProgress('Listo');
  return { group, props, meta, modelID: id };
}

// Propiedades completas bajo demanda (al hacer clic): Psets, cantidades, material y tipo
export async function fillProps(p) {
  if (p.p || p._mid == null) return p;
  const out = {};
  try {
    const sets = await api.properties.getPropertySets(p._mid, p._eid, true, true);
    for (const s of sets) {
      const name = val(s.Name) || 'Pset'; const d = out[name] ||= {};
      for (const pr of s.HasProperties || []) if (pr) d[val(pr.Name)] = fmtV(val(pr.NominalValue));
      for (const q of s.Quantities || []) if (q) d[val(q.Name)] = fmtV(val(q.LengthValue ?? q.AreaValue ?? q.VolumeValue ?? q.CountValue ?? q.WeightValue ?? q.TimeValue));
    }
  } catch (e) {}
  try {
    const mats = await api.properties.getMaterialsProperties(p._mid, p._eid, true, true);
    const names = []; const walk = o => { if (!o || typeof o !== 'object') return; if (o.Name && val(o.Name) && /MATERIAL\b|IFCMATERIAL$/i.test(api.GetNameFromTypeCode(o.type) || '')) names.push(val(o.Name)); for (const v of Object.values(o)) if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object' && v.type) walk(v); };
    mats.forEach(walk);
    if (names.length) p.m = [...new Set(names)].join(' · ');
  } catch (e) {}
  p.p = out;
  return p;
}
const fmtV = v => typeof v === 'number' ? +v.toFixed(4) : v;
