// GeoIAN · Visor BIM — materiales con texturas fotográficas reales (proyección triplanar)
// Los modelos IFC no traen coordenadas UV: la textura se proyecta en coordenadas del mundo,
// así 1 repetición = "escala" metros reales (un ladrillo mide lo que mide).
import * as THREE from 'three';

// Fuentes: ambientCG (CC0), Poly Haven (CC0), three.js (MIT). Ver créditos en el pie de página.
export const TEX = {
  ladrillo:   { file: 'ladrillo.jpg',            escala: 2.0, rough: .9,  label: 'Ladrillo' },
  piedra:     { file: 'albanileria_piedra.jpg',  escala: 1.8, rough: .9,  label: 'Albañilería de piedra / bloque' },
  madera:     { file: 'madera.jpg',              escala: 1.4, rough: .7,  label: 'Madera' },
  hormigon:   { file: 'hormigon.jpg',            escala: 3.0, rough: .95, label: 'Hormigón' },
  yeso:       { file: 'yeso.jpg',                escala: 2.0, rough: .95, label: 'Yeso / estuco' },
  techo:      { file: 'techo.jpg',               escala: 2.5, rough: .9,  label: 'Cubierta (tejuela asfáltica)' },
  asfalto:    { file: 'asfalto.jpg',             escala: 4.0, rough: .95, label: 'Asfalto' },
  balasto:    { file: 'balasto_grava.jpg',       escala: 2.5, rough: 1,   label: 'Grava / balasto' },
  pasto:      { file: 'pasto.jpg',               escala: 5.0, rough: 1,   label: 'Pasto' },
  tierra:     { file: 'tierra.jpg',              escala: 8.0, rough: 1,   label: 'Tierra / suelo' },
  terreno:    { file: 'terreno_aereo.jpg',       escala: 30,  rough: 1,   label: 'Terreno (foto aérea)' },
  roca:       { file: 'roca.jpg',                escala: 4.0, rough: 1,   label: 'Roca' },
  metal:      { color: 0x9AA4AD, metal: .75, rough: .35, label: 'Metal' },
  vegetal:    { color: 0x6F9A52, rough: 1, label: 'Vegetación' },
  agua:       { color: 0x4F8FB8, glass: true, rough: .1, label: 'Agua' },
  vidrio:     { color: 0x9CC9E0, glass: true, rough: .05, label: 'Vidrio' },
};

// Decide la textura según clase IFC + nombre + material (palabras clave en ES/EN)
export function texKind(p, file = '') {
  const c = p.c || '', s = `${p.n || ''} ${p.t || ''} ${p.m || ''} ${refOf(p)}`.toLowerCase();
  if (/IfcWindow|IfcCurtainWall/.test(c) || (/IfcPlate|IfcMember/.test(c) && /glass|glaz|vidrio/.test(s))) return /mullion|frame|marco/.test(s) ? 'metal' : 'vidrio';
  if (/glass|glaz|vidrio/.test(s)) return 'vidrio';
  if (/IfcFurni|IfcSystemFurniture|IfcFlowTerminal|IfcLightFixture|IfcSanitary|IfcSurfaceFeature|IfcSign|IfcElectric|IfcDuct|IfcPipe|IfcAirTerminal|IfcDistribution/.test(c)) return /steel|metal|acero|galvan/.test(s) && /IfcDuct|IfcPipe/.test(c) ? 'metal' : null;
  if (/tree|árbol|arbol|rpc|vegetation_generic|shrub|arbusto|plant/.test(s)) return 'vegetal';
  if (/water|agua/.test(s)) return 'agua';
  if (/brick|ladrillo/.test(s)) return 'ladrillo';
  if (/IfcRoof/.test(c) || (/IfcSlab|IfcCovering|IfcPlate/.test(c) && /roof|techo|cubierta/.test(s))) return 'techo';
  if (/terreno|\bmdt\b|\bdtm\b|\bdem\b|topograf/.test(s)) return 'terreno';
  if (/topsoil|soil|suelo|earth|tierra|underground/.test(s)) return /grass|pasto/.test(s) ? 'pasto' : 'tierra';
  if (/grass|pasto|lawn|turf/.test(s)) return 'pasto';
  if (/stone|piedra|granite|granito|masonry|sand-lime|block|bloque|cmu/.test(s)) return 'piedra';
  if (/IfcDoor/.test(c)) return 'madera';
  if (/wood|madera|timber|mdf|oak|pine|plywood|sleeper/.test(s)) return 'madera';
  if (/steel|metal|acero|alumin|copper|cobre|iron|hierro/.test(s)) return 'metal';
  if (/IfcRail\b|IfcRailing|IfcMember/.test(c)) return 'metal';
  if (/gypsum|plaster|yeso|drywall|partition|interior|ceiling|cielo/.test(s)) return 'yeso';
  if (/asphalt|asfalto|bitumen|dbm/.test(s)) return 'asfalto';
  if (/gravel|grava|ballast|balasto|crushed|chancado/.test(s)) return 'balasto';
  if (/concrete|hormig|cement|lod1|galp/.test(s)) return 'hormigon';
  if (/IfcCourse|IfcRoadPart|IfcPavement/.test(c)) return /rail/.test(file) ? 'balasto' : 'asfalto';
  if (/IfcEarthworks/.test(c)) return 'balasto';
  if (/IfcGeographicElement/.test(c)) return 'pasto';
  if (/IfcCovering/.test(c)) return /floor|piso/.test(s) ? 'madera' : 'yeso';
  if (/IfcWall/.test(c)) return 'yeso';
  if (/IfcSlab|IfcColumn|IfcBeam|IfcFooting|IfcPile|IfcStair|IfcRamp|IfcBearing|IfcChimney|IfcBuildingElementProxy/.test(c)) return 'hormigon';
  return null;
}
function refOf(p) {
  for (const [k, v] of Object.entries(p.p || {})) if (/Common$/.test(k) && v.Reference) return v.Reference;
  return '';
}

const loader = new THREE.TextureLoader();
const texCache = {};
function tex(file, renderer) {
  if (texCache[file]) return texCache[file];
  const t = loader.load('img/tex/' + file);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return (texCache[file] = t);
}

// MeshStandardMaterial con mapa triplanar en coordenadas de mundo
export function triplanar(kind, renderer, clip, extra = {}) {
  const d = TEX[kind];
  const m = new THREE.MeshStandardMaterial({ color: d.color ?? 0xffffff, roughness: d.rough ?? .9, metalness: d.metal ?? 0, side: THREE.DoubleSide, clippingPlanes: [clip], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...extra });
  if (d.glass) Object.assign(m, { transparent: true, opacity: extra.opacity ?? .38, depthWrite: false });
  if (!d.file) return m;
  const map = tex(d.file, renderer);
  m.onBeforeCompile = sh => {
    sh.uniforms.uTri = { value: map }; sh.uniforms.uEsc = { value: d.escala };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uTri; uniform float uEsc; varying vec3 vWP; varying vec3 vWN;')
      .replace('#include <map_fragment>', `
        vec3 bw = pow(abs(normalize(vWN)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z + 1e-5);
        vec3 tp = vWP / uEsc;
        vec4 tc = texture2D(uTri, tp.zy) * bw.x + texture2D(uTri, tp.xz) * bw.y + texture2D(uTri, tp.xy) * bw.z;
        diffuseColor *= tc;`);
  };
  m.customProgramCacheKey = () => 'tri';
  return m;
}
