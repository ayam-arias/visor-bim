// GeoIAN · Visor BIM — módulo didáctico "Aprende BIM" y "Practica"
// Basado en la clase 16 de TPO204 (BIM: verlo, entenderlo y emprender con él). Cada lección tiene botones
// que mueven el visor para que el concepto se VEA en un modelo real.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SOFT = [
  ['autodeskrevit', '', 'Autodesk Revit', 'Edificios: arquitectura, estructura y MEP', 'Educativa gratis'],
  ['autodesk', 'C3D', 'Autodesk Civil 3D', 'Terreno, alineamientos, corredores y plataformas', 'Educativa gratis'],
  ['autodesk', 'IW', 'Autodesk InfraWorks', 'Infraestructura conceptual en su contexto', 'Educativa gratis'],
  ['autodesk', 'RC', 'Autodesk ReCap', 'Nubes de puntos de escáner y dron', 'Educativa gratis'],
  ['autodesk', 'NW', 'Autodesk Navisworks', 'Federar, coordinar, choques y 4D', 'Educativa gratis'],
  ['archicad', '', 'Graphisoft Archicad', 'Modelado BIM de edificios', 'Educativa gratis'],
  ['trimble', 'TS', 'Tekla Structures', 'Estructuras de acero y hormigón (detalle)', 'Comercial · campus'],
  ['bentley', 'OR', 'Bentley OpenRoads', 'Diseño vial y terreno', 'Comercial · educación'],
  ['blender', 'BIM', 'Bonsai (ex BlenderBIM)', 'Crea y edita IFC nativo sobre Blender', 'Libre y gratis'],
  ['freecad', 'BIM', 'FreeCAD · BIM', 'Modelado paramétrico e IFC', 'Libre y gratis'],
  ['qgis', '', 'QGIS', 'SIG: el contexto territorial del proyecto', 'Libre y gratis'],
  ['arcgis', '', 'ArcGIS (Esri)', 'SIG + BIM (GeoBIM) a escala ciudad', 'Comercial · educación'],
  ['sketchup', '', 'SketchUp', 'Modelos conceptuales rápidos', 'Comercial · web gratis'],
  ['threedotjs', 'web', 'three.js + web-ifc', 'Visores web como este (código abierto)', 'Libre y gratis'],
];
const swCard = ([lg, tag, n, d, l]) => `<div class="sw-card"><div class="lg"><img src="img/logos/${lg}.svg" alt="" loading="lazy">${tag ? `<i>${tag}</i>` : ''}</div><div><b>${esc(n)}</b><span>${esc(d)}</span><br><span class="pill">${esc(l)}</span></div></div>`;

const L = [
  { t: 'Recordar: de la nube al modelo', b: `<p>En Los Aromos clasificamos una nube LiDAR (LAS) y la convertimos en un modelo BIM (IFC): la clase <b>suelo (2)</b> pasó a ser el <b>MDT</b> y la clase <b>edificio (6)</b> pasó a volúmenes LOD1.</p><p><b>Piensa:</b> ¿qué guarda cada punto además de X, Y, Z? ¿Por qué entregamos en IFC y no en DWG?</p>`, a: [['Abrir Los Aromos', V => V.load('aromos')]] },
  { t: '¿Qué es BIM?', b: `<div class="bim3"><div><b>B</b>Building<br>Edificación o activo: casas, puentes, caminos, redes</div><div><b>I</b>Information<br>Cada objeto sabe qué es, de qué está hecho y cuánto mide</div><div><b>M</b>Modeling<br>Se modela en 3D con objetos, no con líneas</div></div><p><b>BIM no es un programa:</b> es una <b>metodología</b> para crear y compartir información confiable de una obra durante toda su vida (ISO 19650).</p>`, a: [['Ver la casa y su ficha', async V => { await V.load('casa'); V.selectFirst(/IfcWall/); }]] },
  { t: 'CAD vs BIM: líneas u objetos', b: `<table><tr><th></th><th>CAD</th><th>BIM</th></tr><tr><td>Unidad</td><td>Línea, arco, polilínea</td><td>Objeto: muro, losa, viga</td></tr><tr><td>Información</td><td>Geometría y capas</td><td>Geometría + material + cantidades + fase</td></tr><tr><td>Cambios</td><td>Vista por vista</td><td>Se corrige el modelo y todo se actualiza</td></tr><tr><td>Cubicación</td><td>Manual</td><td>Automática</td></tr></table><p>Activa la <b>Vista CAD</b>: verás solo líneas, como un plano. Vuelve a BIM y haz clic en cualquier objeto: <b>tiene datos</b>.</p>`, a: [['Vista CAD (líneas)', V => V.setCad(true)], ['Volver a BIM', V => V.setCad(false)]] },
  { t: 'Un muro BIM "sabe" quién es', b: `<p>Este muro del proyecto federado trae su clase (<code>IfcWall</code>), su nivel, su material (sílico-calcáreo), su espesor (200 mm), su largo (1.800 mm), su área y su volumen. Geometría + datos = información que sirve para cubicar, presupuestar, construir y mantener.</p>`, a: [['Abrir la ficha del muro', async V => { await V.load('fed'); if (!V.selectGuid('1AQAupaRP1txwK1AGiN61V')) V.selectFirst(/IfcWall/); }]] },
  { t: 'IFC: el idioma abierto de BIM', b: `<p><b>IFC</b> (Industry Foundation Classes) es un formato <b>abierto y neutro</b>, norma <b>ISO 16739</b> de buildingSMART. Lo leen Revit, Civil 3D, Archicad, Tekla y visores web como este, y es el formato que piden los proyectos públicos BIM en Chile.</p><p>IFC ordena todo en un árbol: <code>IfcProject</code> → <code>IfcSite</code> → <code>IfcBuilding</code> → <code>IfcBuildingStorey</code> → elementos.</p><table><tr><td>IFC 2x3</td><td>Edificación, la más compatible</td></tr><tr><td>IFC 4</td><td>Mejor geometría y propiedades</td></tr><tr><td>IFC 4.3</td><td>Infraestructura: caminos, puentes, ferrocarril, alineamientos</td></tr></table>`, a: [['Ver árbol espacial', V => { V.ltab('t-modelo'); document.querySelector('.vt [data-v=tree]').click(); }]] },
  { t: 'Dimensiones: 3D, 4D, 5D, 6D y 7D', b: `<div class="dims"><div><b style="background:#21A9D8">3D</b>Geometría: el modelo con objetos</div><div><b style="background:#1E88E5">4D</b>Tiempo: modelo + programación de obra</div><div><b style="background:#E8772A">5D</b>Costo: cubicación y presupuesto</div><div><b style="background:#43A047">6D</b>Sostenibilidad: energía, huella de carbono</div><div><b style="background:#6A1B9A">7D</b>Operación: mantención durante la vida útil</div></div><p><b>Ejemplo topográfico:</b> MDT (3D) + cronograma de movimiento de tierra (4D) + precio por m³ (5D) = cuánto cuesta y cuándo se excava cada sector.</p>`, a: [['Simular 4D', V => { V.rtab('r-4d'); document.getElementById('p4play').click(); }], ['Cubicar 5D', async V => { V.rtab('r-5d'); await V.calc5d(); }]] },
  { t: 'Nivel de desarrollo (LOD)', b: `<p>Del volumen al detalle (BIMForum, 2023):</p><table><tr><td>LOD 100</td><td>Volumen conceptual (masa)</td></tr><tr><td>LOD 200</td><td>Elementos genéricos, tamaño aproximado</td></tr><tr><td>LOD 300</td><td>Elementos precisos: forma, tamaño y ubicación</td></tr><tr><td>LOD 400</td><td>Detalle de fabricación y montaje</td></tr><tr><td>LOD 500</td><td><b>As-built</b>: lo construido, verificado en terreno. ¡Trabajo de topografía!</td></tr></table><p>Más detalle = más información = más tiempo de modelado y más memoria del PC.</p>`, a: [['LOD 100', V => V.setLod(100)], ['LOD 200', V => V.setLod(200)], ['LOD 300', V => V.setLod(300)]] },
  { t: 'Disciplinas y modelo federado', b: `<p>Arquitectura, estructura, instalaciones y terreno se modelan <b>por separado</b>, cada una en su archivo. Luego se <b>federan</b>: se superponen en un modelo de coordinación con coordenadas comunes. Nadie "dibuja encima" del otro.</p>`, a: [['Colorear por disciplina', async V => { if (V.S.M?.id !== 'fed') await V.load('fed'); V.setColor('disc'); V.ltab('t-modelo'); document.querySelector('.vt [data-v=disc]').click(); }], ['Solo la casa', V => V.isolateDisc(/Arquitectura|Estructura|Climatización/)], ['Todo', V => V.setAll(true)]] },
  { t: 'BIM también es infraestructura', b: `<p>Con IFC 4.3 se modelan puentes, caminos, ferrocarriles, terreno y redes. Mira las clases: <code>IfcCourse</code> (capas de pavimento o balasto), <code>IfcEarthworksFill</code> (rellenos), <code>IfcTrackElement</code> (durmientes), <code>IfcRail</code>.</p>`, a: [['Ver infraestructura', async V => { if (V.S.M?.id !== 'fed') await V.load('fed'); V.setColor('tex'); V.isolateDisc(/Puente|Camino|Ferrocarril|Alcantarillado|Electricidad|Paisajismo/); }], ['Todo', V => V.setAll(true)]] },
  { t: 'Coordinación 3D: choques', b: `<p>Una <b>interferencia</b> (clash) ocurre cuando objetos de distintas disciplinas ocupan el mismo espacio. Flujo: <b>1</b> federar, <b>2</b> detectar, <b>3</b> revisar y asignar responsable, <b>4</b> corregir en el modelo de origen, <b>5</b> volver a federar y verificar.</p>`, a: [['Detectar choques en el federado', async V => { if (V.S.M?.id !== 'fed') await V.load('fed'); V.rtab('r-clash'); const r = V.runClash(); if (r.length) V.showClash(0); }]] },
  { t: '¿Cómo se hace BIM?', b: `<ol class="flow"><li><span><b>Capturar:</b> topografía, LiDAR, dron, escáner</span></li><li><span><b>Terreno:</b> MDT / superficie en Civil 3D</span></li><li><span><b>Modelar:</b> cada disciplina con objetos BIM</span></li><li><span><b>Federar:</b> unir modelos en coordenadas comunes</span></li><li><span><b>Coordinar:</b> detectar choques y corregir</span></li><li><span><b>Entregar:</b> IFC + planos + cubicaciones + as-built</span></li></ol><p>El BIM empieza midiendo la realidad y termina verificándola: el topógrafo está en el paso 1 y en el 6.</p>` },
  { t: 'El topógrafo en BIM', b: `<ul><li><b>Sistema de referencia:</b> fijar coordenadas, datum y PR del proyecto (SIRGAS-Chile / UTM 19S) para que todo calce.</li><li><b>Condiciones existentes:</b> nube de puntos, MDT y construcciones existentes.</li><li><b>Scan-to-BIM:</b> de la nube del escáner o dron al modelo as-built.</li><li><b>Replanteo desde el modelo</b> con estación total o GNSS.</li><li><b>Control de avance:</b> nube vs. modelo.</li><li><b>As-built (LOD 500)</b> para la operación.</li></ul><p>Tu ventaja: entiendes de coordenadas, precisión y tolerancias. Cuando abras un IFC, el panel del modelo te dirá si trae <b>georreferencia</b> (IfcMapConversion).</p>`, a: [['Ver Los Aromos', V => V.load('aromos')]] },
  { t: 'Software BIM más usados', b: `<div class="sw-grid">${SOFT.map(swCard).join('')}</div><p class="hint">Licencias referenciales: revisa las condiciones vigentes en el sitio de cada fabricante. Las marcas pertenecen a sus dueños.</p>` },
  { t: '¿Qué computador necesito?', b: `<table class="pc"><tr><th></th><th>Aprender</th><th>Trabajar</th><th>Proyectos grandes</th></tr><tr><td>RAM</td><td>16 GB</td><td>32 GB</td><td>64 GB+</td></tr><tr><td>CPU</td><td>i5 / Ryzen 5</td><td>i7 / Ryzen 7, buen núcleo único</td><td>i9 / Ryzen 9 / Xeon</td></tr><tr><td>Video</td><td>DirectX 11, 4 GB</td><td>Dedicada 4–8 GB</td><td>Dedicada 8 GB+</td></tr><tr><td>Disco</td><td>30 GB libres</td><td>SSD NVMe</td><td>SSD NVMe 1 TB+</td></tr><tr><td>Sistema</td><td colspan="3">Windows 10/11 64 bits (Mac solo con virtualización)</td></tr></table><p>Lo que más importa: <b>RAM</b> (el modelo vive en memoria), <b>SSD</b>, <b>núcleo único rápido</b> (Revit) y <b>GPU dedicada</b>. Para visores web como este, sirve cualquier PC.</p><div id="mypc" class="card soft" hidden></div>`, a: [['Revisar mi equipo', () => myPC()]] },
  { t: 'BIM en Chile: Planbim', b: `<div class="tl"><div><b>2016</b> · Acuerdo público-privado: nace Planbim (Corfo)</div><div><b>2019</b> · Estándar BIM para Proyectos Públicos</div><div><b>2020</b> · Meta: exigencia BIM en proyectos públicos</div><div><b>2025</b> · Meta: adopción en proyectos privados</div><div><b>2026</b> · Municipios y organismos implementando BIM</div></div><p>Las licitaciones públicas ya piden modelos BIM e IFC. Quien sabe levantar, modelar terreno y entregar en IFC tiene una ventaja concreta.</p>` },
  { t: 'Emprender con BIM', b: `<ol class="flow"><li><span><b>Aprende gratis:</b> licencia educativa Autodesk + Bonsai libre + visores web</span></li><li><span><b>Domina tu base:</b> Civil 3D (puntos, superficies, alineamientos, plataformas) y exportar a IFC</span></li><li><span><b>Suma una herramienta:</b> ReCap (nubes), Revit (edificios) o Navisworks (coordinar)</span></li><li><span><b>Arma tu portafolio:</b> capturas, visor web, GitHub, LinkedIn. Usa el botón <b>Captura</b> de este visor</span></li><li><span><b>Ofrece un servicio:</b> levantamiento para BIM, MDT, scan-to-BIM, control de avance, as-built</span></li></ol>` },
  { t: 'Fuentes (APA 7)', b: `<div class="refs">
<p>BIMForum. (2023). <i>Level of development (LOD) specification</i>. https://bimforum.org/</p>
<p>buildingSMART International. (2024). <i>IFC 4.3 sample files: Simple Scene</i> [Conjunto de datos]. https://github.com/buildingSMART/Sample-Test-Files</p>
<p>Instituto Profesional AIEP. (2025). <i>Programa de módulo TPO204 Modelamiento Básico Digital</i>.</p>
<p>International Organization for Standardization. (2018). <i>ISO 19650-1: Organization and digitization of information about buildings and civil engineering works, including BIM</i>.</p>
<p>International Organization for Standardization. (2024). <i>ISO 16739-1: Industry Foundation Classes (IFC) for data sharing in the construction and facility management industries</i>.</p>
<p>Ministerio de Vivienda y Urbanismo. (2023). <i>Solicitud de información BIM (SDI), DS49</i>. https://www.minvu.gob.cl/wp-content/uploads/2023/07/minvu-bim-pro-ds49-sdi.pdf</p>
<p>Planbim. (2019). <i>Estándar BIM para proyectos públicos</i>. Corfo.</p>
<p>Portal Innova. (2026, abril). <i>BIM gana espacio en la modernización de la gestión pública en Chile</i>. https://portalinnova.cl/bim-gana-espacio-en-la-modernizacion-de-la-gestion-publica-en-chile/</p>
<p>Puget Systems. (s.f.). <i>Hardware recommendations for Autodesk Revit</i>. https://www.pugetsystems.com/solutions/cad-workstations/autodesk-revit/hardware-recommendations/</p>
<p>Autodesk. (s.f.). <i>Autodesk student and educator resources</i>. https://www.autodesk.com/education/home</p>
<p>That Open Company. (2026). <i>web-ifc</i> (Versión 0.0.81) [Software]. https://github.com/ThatOpen/engine_web-ifc</p></div>` },
];

const TOUR = [
  ['Abre el modelo <b>Dúplex</b> en la barra de modelos.', 'model', d => d.id === 'duplex', V => V.S.M?.id === 'duplex'],
  ['<b>Orbita</b>: clic izquierdo y arrastra sobre el modelo. Rueda = zoom, clic derecho = desplazar.', 'orbit', () => true],
  ['En el panel <b>Modelo</b>, desmarca una clase (por ejemplo <b>Muro</b>) para ocultarla.', 'classToggle', d => d.on === false],
  ['Haz clic sobre un <b>muro</b> y lee su ficha a la derecha: clase, nivel, material y Psets.', 'select', d => /IfcWall/.test(d.cls || '')],
  ['Activa <b>Corte</b> y baja la altura para ver la planta por dentro.', 'cut', d => d.on && d.v < 900],
  ['Activa <b>Medir</b> y haz dos clics: obtienes distancia, horizontal y desnivel.', 'measure', () => true],
  ['Abre el <b>Proyecto federado</b>: casa + camino + puente + ferrocarril.', 'model', d => d.id === 'fed'],
  ['Elige color <b>Por disciplina</b>: cada color es el archivo de una especialidad.', 'color', d => d.mode === 'disc'],
];

const QUIZ = [
  ['BIM es, ante todo…', ['Un programa de Autodesk', 'Una metodología para crear y compartir información confiable de una obra durante su vida', 'Un formato de archivo 3D'], 1, 'BIM es una metodología; Revit, Archicad o Civil 3D son herramientas para aplicarla.'],
  ['¿En qué formato entregas un modelo para que lo abra cualquier software?', ['DWG', 'RVT', 'IFC', 'PDF'], 2, 'IFC es abierto, neutro y normado (ISO 16739). RVT y DWG pertenecen a un fabricante.'],
  ['Federas el modelo del terreno con el del edificio y quedan a 1 km de distancia. Causa más probable:', ['El modelo tiene demasiados elementos', 'Distinto sistema de coordenadas (georreferencia) o distintas unidades', 'Falta de texturas', 'El computador es lento'], 1, 'Criterio 2.10: la causa es el sistema de referencia o las unidades. Por eso el topógrafo fija las coordenadas del proyecto.'],
  ['El LOD 500 corresponde a…', ['Un volumen conceptual', 'Detalle de fabricación', 'El as-built: lo construido, verificado en terreno', 'Un modelo con texturas'], 2, 'LOD 500 = as-built. Se verifica con escáner, dron, estación total o GNSS.'],
  ['La dimensión 5D del BIM agrega…', ['El tiempo', 'El costo', 'La sostenibilidad', 'La operación'], 1, '4D tiempo, 5D costo, 6D sostenibilidad, 7D operación.'],
  ['Una interferencia (clash) es…', ['Un error de exportación', 'Dos objetos de distintas disciplinas ocupando el mismo espacio', 'Un muro sin material', 'Un archivo dañado'], 1, 'Se detectan en el modelo federado antes de construir, y se corrigen en el modelo de origen.'],
  ['Para trabajar modelos BIM grandes, lo que más importa en el PC es…', ['El tamaño de la pantalla', 'La memoria RAM', 'El teclado', 'La cámara web'], 1, 'El modelo vive en memoria: 32 GB es lo recomendado para trabajar.'],
  ['¿Qué norma ISO define el formato IFC?', ['ISO 9001', 'ISO 19650', 'ISO 16739', 'ISO 14001'], 2, 'ISO 16739 define IFC. ISO 19650 define la gestión de la información con BIM.'],
];

export function initAprende(V) {
  // ---------- Aprende ----------
  const A = document.getElementById('t-aprende');
  A.innerHTML = `<p class="hint">Ruta de 16 pasos basada en la clase 16 de TPO204. Abre cada tema y usa los botones celestes para <b>verlo en el modelo</b>.</p>` +
    L.map((l, i) => `<details class="lesson" ${i === 1 ? 'open' : ''}><summary><span class="num">${i}</span>${esc(l.t)}</summary><div class="body">${l.b}${l.a ? `<div class="act">${l.a.map((a, j) => `<button data-l="${i}" data-a="${j}">${esc(a[0])}</button>`).join('')}</div>` : ''}</div></details>`).join('');
  A.addEventListener('click', e => { const b = e.target.closest('button[data-l]'); if (b) L[b.dataset.l].a[b.dataset.a][1](V); });

  // ---------- Practica ----------
  const P = document.getElementById('t-practica');
  P.innerHTML = `
  <h3>Primeros pasos guiados</h3>
  <p class="hint">8 misiones cortas. El visor detecta cuando cumples cada una y avanza solo.</p>
  <div class="row"><button id="tourGo">▶ Comenzar recorrido</button></div>
  <h3 style="margin-top:16px">Ejercicios</h3>
  <div class="ex"><b>Fácil · Ficha de un muro.</b> En el Proyecto federado, haz clic en el muro frontal derecho de la casa. Anota clase IFC, espesor, largo y material.
    <div class="row"><button class="alt" data-x="0">Ir al modelo</button></div><details><summary>Ver resultado</summary>IfcWall · 200 mm · 1.800 mm · sílico-calcáreo (stone_sand-lime).</details></div>
  <div class="ex m"><b>Medio · Inventario por clase.</b> Abre el Dúplex y completa una tabla Clase IFC / Cantidad con el panel Modelo. Luego calcula el 5D.
    <div class="row"><button class="alt" data-x="1">Ir al modelo</button></div><details><summary>Ver resultado</summary>57 muros (56 IfcWallStandardCase + 1 IfcWall), 24 ventanas, 21 losas, 14 puertas, 8 vigas, 61 muebles.</details></div>
  <div class="ex r"><b>Reto · Federa y coordina.</b> En el Proyecto federado usa Choques, Rayos X y Corte. Encuentra dónde se cruzan la losa del techo, los muros y la chimenea, mide la altura del cruce y propone quién lo corrige.
    <div class="row"><button class="alt" data-x="2">Ir al modelo</button></div><details><summary>Ver resultado</summary>El detector marca la losa del techo (Arquitectura) cruzando muros y chimenea (Estructura), y la chimenea cruzando su remate (Climatización). Para cada caso decide si es un choque real o una superposición tolerable de modelado; el responsable corrige en su modelo de origen y se vuelve a federar.</details></div>
  <p class="hint">DUA: entrega tu resultado como tabla, captura comentada (botón Captura) o audio breve.</p>
  <h3 style="margin-top:16px">Ticket de salida</h3>
  <div class="quiz" id="quiz"></div>
  <div class="row"><button id="qCheck">Revisar respuestas</button><button class="alt" id="qReset">Reiniciar</button></div>
  <div id="qScore" class="big"></div>
  <h3 style="margin-top:16px">Abre tu propio modelo</h3>
  <ol class="flow"><li><span>Exporta a IFC desde tu software: Revit (Archivo › Exportar › IFC), Archicad (Guardar como › IFC), Bonsai (IFC nativo) o Civil 3D (exportación IFC según tu versión) <span class="pill">[VERIFICAR en tu versión]</span>.</span></li><li><span>Pulsa <b>Abrir IFC</b> o arrastra el archivo al visor. Puedes soltar <b>varios</b> archivos a la vez: se federan.</span></li><li><span>Revisa en el panel Modelo el esquema, el proyecto y si trae georreferencia.</span></li><li><span>Haz clic en los objetos: las propiedades se leen al instante desde el IFC.</span></li></ol>
  <p class="hint">También acepta GLB/glTF. El archivo no se sube a internet: todo ocurre en tu navegador.</p>
  <p class="hint"><b>¿No tienes un IFC a mano?</b> Descarga uno de ejemplo y ábrelo con el botón Abrir IFC:<br>
  <a href="datos_IFC_originales/Ifc4_SampleHouse.ifc" download>Casa IFC4 (2,3 MB)</a> · <a href="datos_IFC_originales/Ifc2x3_Duplex_Architecture.ifc" download>Dúplex IFC2x3 (2,4 MB)</a> · <a href="datos_IFC_originales/Ifc4_Revit_STR.ifc" download>Estructura Revit IFC4 (11 MB)</a></p>`;
  const EX = [async () => { await V.load('fed'); if (!V.selectGuid('1AQAupaRP1txwK1AGiN61V')) V.selectFirst(/IfcWall/); },
    async () => { await V.load('duplex'); V.ltab('t-modelo'); },
    async () => { await V.load('fed'); V.rtab('r-clash'); }];
  P.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) EX[b.dataset.x](); });

  const Qz = document.getElementById('quiz');
  const drawQ = () => Qz.innerHTML = QUIZ.map(([q, ops], i) => `<div class="q"><p>${i + 1}. ${esc(q)}</p>${ops.map((o, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join('')}<div class="fb" id="fb${i}"></div></div>`).join('');
  drawQ();
  document.getElementById('qCheck').onclick = () => {
    let ok = 0;
    QUIZ.forEach(([, , c, why], i) => { const s = Qz.querySelector(`input[name=q${i}]:checked`), f = document.getElementById('fb' + i); if (!s) { f.className = 'fb no'; f.textContent = 'Sin responder.'; return; } const g = +s.value === c; ok += g; f.className = 'fb ' + (g ? 'ok' : 'no'); f.textContent = (g ? '✔ Correcto. ' : '✘ Revisa: ') + why; });
    const nota = 1 + 6 * ok / QUIZ.length;
    document.getElementById('qScore').textContent = `${ok}/${QUIZ.length} correctas · nota ${nota.toFixed(1).replace('.', ',')} ${nota >= 4 ? '· ¡Logrado!' : '· Repasa la ruta Aprende BIM'}`;
  };
  document.getElementById('qReset').onclick = () => { drawQ(); document.getElementById('qScore').textContent = ''; };

  // ---------- Recorrido guiado ----------
  const T = document.getElementById('tour'); let step = -1, handler = null;
  const show = () => {
    if (step >= TOUR.length) { T.innerHTML = `<div class="k">Primeros pasos</div><p class="ok">¡Completaste el recorrido! Ya sabes navegar, filtrar, consultar, cortar, medir y federar un modelo BIM.</p><div class="row"><button id="tClose">Cerrar</button></div>`; T.querySelector('#tClose').onclick = end; return; }
    T.innerHTML = `<div class="k">Primeros pasos · misión ${step + 1} de ${TOUR.length}</div><div class="bar"><i style="width:${step / TOUR.length * 100}%"></i></div><p style="margin:4px 0">${TOUR[step][0]}</p><div class="row"><button id="tSkip">Saltar</button><button id="tClose">Salir</button></div>`;
    T.querySelector('#tSkip').onclick = next; T.querySelector('#tClose').onclick = end;
    if (TOUR[step][3]?.(V)) setTimeout(next, 600);
  };
  const next = () => { step++; listen(); show(); };
  const listen = () => {
    if (handler) V.bus.removeEventListener(handler.t, handler.f);
    if (step >= TOUR.length) return;
    const [, t, ok] = TOUR[step];
    handler = { t, f: e => { if (ok(e.detail || {})) { T.querySelector('.bar i').style.width = ((step + 1) / TOUR.length * 100) + '%'; V.toast('✔ Misión cumplida'); setTimeout(next, 700); V.bus.removeEventListener(t, handler.f); } } };
    V.bus.addEventListener(t, handler.f);
  };
  const end = () => { if (handler) V.bus.removeEventListener(handler.t, handler.f); T.hidden = true; step = -1; };
  document.getElementById('tourGo').onclick = () => { T.hidden = false; step = -1; next(); };
}

function myPC() {
  const el = document.getElementById('mypc'); el.hidden = false;
  let gpu = '—'; try { const g = document.createElement('canvas').getContext('webgl'); const x = g.getExtension('WEBGL_debug_renderer_info'); gpu = x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); } catch (e) {}
  const ram = navigator.deviceMemory, cpu = navigator.hardwareConcurrency;
  const dedicated = /nvidia|geforce|rtx|gtx|quadro|radeon(?!.*vega 8)|arc a/i.test(gpu);
  el.innerHTML = `<div class="k">Tu equipo (lo que el navegador puede ver)</div><table><tr><td>Núcleos lógicos</td><td>${cpu ?? '—'}</td></tr><tr><td>RAM</td><td>${ram ? (ram >= 8 ? '8 GB o más' : ram + ' GB') : 'no informada'}</td></tr><tr><td>Tarjeta de video</td><td>${esc(gpu)}</td></tr></table><p class="hint">${dedicated ? 'Tienes GPU dedicada: buen punto de partida para BIM.' : 'Parece una GPU integrada: suficiente para aprender y para visores web; para Revit o nubes grandes conviene una dedicada.'} Por privacidad, el navegador informa la RAM solo hasta 8 GB: revisa el valor real en Configuración › Sistema › Información.</p>`;
}
