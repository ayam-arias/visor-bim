# Visor BIM GeoIAN · TPO204 (AIEP)

Visor web liviano de modelos BIM reales para el laboratorio. Funciona en el navegador (Chrome o Edge), sin instalar programas.

## Modelos incluidos (datos reales, convertidos de IFC a glTF (.gltf.json) + JSON de propiedades)
| Modelo | Origen | Esquema |
|---|---|---|
| Dúplex | Duplex Apartment, modelo de referencia exportado desde Revit (colección IfcSampleFiles, GitHub) | IFC2x3 |
| Casa | Ifc4_SampleHouse (colección IfcSampleFiles, GitHub) | IFC4 |
| Proyecto federado | buildingSMART International, IFC 4.3 Sample "Simple Scene" (github.com/buildingSMART/Sample-Test-Files) | IFC4X3 |
| Edificio Revit ARQ + EST | Modelo de muestra de Revit exportado a IFC4 (IfcSampleFiles). Se omitieron las 3.680 barras de refuerzo para alivianarlo. | IFC4 |
| Los Aromos | Modelo propio del curso TPO204 (clase 10) | IFC4 |

## Cómo publicarlo en GitHub Pages
1. Crea un repositorio público en github.com (por ejemplo `visor-bim`).
2. "Add file > Upload files" y arrastra TODO el contenido de esta carpeta (index.html, data/, lib/).
3. Settings > Pages > Branch: main / root > Save. En 1–2 minutos queda en `https://<usuario>.github.io/visor-bim/`.

## Herramientas
Clases IFC (mostrar/ocultar, color por clase), ficha de propiedades IFC al hacer clic, corte horizontal, medición de distancias (total, horizontal y desnivel), vista en planta y rayos X.

Conversión: IfcOpenShell 0.8 + trimesh. Visualización: three.js r160 (licencia MIT, incluida en lib/three).
