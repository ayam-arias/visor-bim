# Visor BIM · GeoIAN

Visor y aula BIM en el navegador: abre modelos **IFC 2x3, IFC 4 e IFC 4.3**, explóralos con texturas fotográficas reales y aprende BIM paso a paso. Sin instalar nada y sin subir tus archivos a ningún servidor.

**Abrir:** https://ayam-arias.github.io/visor-bim/

## Qué hace

| Función | Detalle |
|---|---|
| Modelos de ejemplo | Dúplex (Revit, IFC2x3), Casa (IFC4), Proyecto federado buildingSMART (IFC 4.3: casa, terreno, camino, puente, ferrocarril, alcantarillado, electricidad), Edificio Revit ARQ + EST (IFC4) y Los Aromos (modelo propio del curso). |
| Importar | Botón **Abrir IFC** o arrastrar y soltar `.ifc`, `.glb` o `.gltf`. Varios archivos a la vez se **federan** (una disciplina por archivo). Lectura con web-ifc; propiedades (Psets, cantidades, material) bajo demanda al hacer clic. Informa georreferencia (IfcMapConversion) y traslación de coordenadas grandes. |
| Color | Texturas reales según material (ladrillo, piedra, hormigón, madera, yeso, cubierta, asfalto, balasto, pasto, tierra, terreno aéreo), color IFC, por clase o por disciplina. |
| Navegación | Clases IFC, árbol espacial (Proyecto → Sitio → Edificio → Nivel), disciplinas, aislar nivel, ficha IFC completa, corte horizontal, medición (distancia, horizontal, desnivel, pendiente), rayos X, vista CAD (solo líneas), LOD 100 / 200 / 300, captura PNG con marca. |
| 4D | Simulación de obra por fases constructivas. |
| 5D | Cubicación desde Psets/Qto, precios unitarios editables y exportación CSV. |
| Coordinación | Detección de interferencias entre disciplinas: filtro por cajas envolventes y confirmación geométrica (aristas que atraviesan caras o puntos dentro de ambos sólidos). |
| Aprende BIM | 16 lecciones de la clase 16 de TPO204 con botones que mueven el visor: qué es BIM, CAD vs BIM, IFC, 3D–7D, LOD, federado, infraestructura, choques, flujo, rol del topógrafo, software (con logos), computador, Planbim, emprender y fuentes. |
| Practica | Recorrido guiado de 8 misiones que se validan solas, ejercicios fácil/medio/reto con resultado, ticket de salida autocorregible (nota 1,0–7,0) y guía para abrir tu propio IFC. |

## Estructura

```
visor-bim/
├── index.html
├── css/app.css            estilo GeoIAN
├── js/app.js              visor (three.js), herramientas, 4D, 5D, choques
├── js/materiales.js       texturas reales con proyección triplanar (escala en metros)
├── js/ifc.js              importación IFC con web-ifc
├── js/aprende.js          módulo didáctico, recorrido y quiz
├── img/tex/               texturas fotográficas
├── img/logos/             logos de software (Simple Icons)
├── data/                  modelos de ejemplo convertidos (glTF + propiedades JSON)
├── datos_IFC_originales/  IFC originales descargables
└── lib/                   three.js r160 (MIT) y web-ifc 0.0.81 (MPL-2.0)
```

Necesita abrirse desde un servidor web (GitHub Pages o `python -m http.server`), no con doble clic.

## Créditos y licencias

- Modelos: buildingSMART International, IFC 4.3 "Simple Scene"; colección IfcSampleFiles; Los Aromos (Ian Arias Carrasco).
- Texturas: ambientCG (CC0): Bricks076A; Poly Haven (CC0): asphalt_02, rocky_trail, sparse_grass, dirt_aerial_02, rock_face_03, aerial_grass_rock; three.js (MIT): brick_diffuse, hardwood2. Hormigón, yeso y cubierta son derivados de asphalt_02.
- Logos: Simple Icons (CC0). Las marcas pertenecen a sus dueños y se usan solo para identificar cada software.
- Motor: three.js (MIT), web-ifc de That Open Company (MPL-2.0).

## Referencias

BIMForum. (2023). *Level of development (LOD) specification*. https://bimforum.org/

buildingSMART International. (2024). *IFC 4.3 sample files: Simple Scene* [Conjunto de datos]. https://github.com/buildingSMART/Sample-Test-Files

International Organization for Standardization. (2018). *ISO 19650-1: Organization and digitization of information about buildings and civil engineering works, including BIM*.

International Organization for Standardization. (2024). *ISO 16739-1: Industry Foundation Classes (IFC) for data sharing in the construction and facility management industries*.

Planbim. (2019). *Estándar BIM para proyectos públicos*. Corfo.

---
© 2026 Ian Arias Carrasco · **GeoIAN** · Licencia MIT ·
[Sitio](https://ayam-arias.github.io) · [LinkedIn](https://www.linkedin.com/in/ian-arias) · [Instagram @_geoia.n](https://www.instagram.com/_geoia.n) · [GitHub](https://github.com/ayam-arias) · [Correo](mailto:ian.arias.carrasco@gmail.com)
