# Contexto para asistentes de IA (y personas) que continúen este proyecto

Léelo entero antes de tocar nada. El proyecto debe seguir siendo **independiente de cualquier IA**:
HTML/CSS/JS estático en GitHub Pages, sin servidor, sin build, sin dependencias externas en tiempo de ejecución
(salvo Google Fonts, opcional).

## Qué es

Venta solidaria de colonias de equivalencia y ambientadores micado (proveedor **Les Vents de Grasse**) que una familia
gestiona para pagar la excursión de **4.º ESO del IES Ribeira do Louro**. Vende puerta a puerta el alumno (Dani).
Precios de venta: perfumes 15 €, micados 12 €. Costes: perfume 8 €, micado 6,50 €.

- Web pública: `https://guillermolareo-art.github.io/venta-solidaria-4eso/` (enlace corto: `is.gd/VentaSolidariaDani4ESO`)
- Gestión: `…/admin.html` (requiere token + clave; ver más abajo)
- Repo: `guillermolareo-art/venta-solidaria-4eso` (público). Rama `main`, Pages desde la raíz.

## Archivos

| Ruta | Función |
|---|---|
| `index.html` | Catálogo público. Lee `data/stock.json`. Lista completa (sin filtros), estado Disponible / Por encargo, muestra, botón *Pedir* → WhatsApp con texto prellenado. Foto lateral fija en escritorio, banda superior en móvil. |
| `catalogo.html` | Hoja A4 imprimible (`?modo=bn|color|stock`), mismo diseño que el catálogo en papel original. `window.print()`. |
| `admin.html` | Gestión completa y modo vendedor. Lee y escribe el repo vía API de GitHub (Contents API) desde el navegador. |
| `assets/comun.js` | `window.VS`: utilidades, carga de `stock.json`, generador de la hoja A4 (`CAT_CSS`, `catalogoA4`). |
| `assets/estilo.css` | Tokens y estilos de pantalla (claro/oscuro). |
| `assets/qrcode.js` | qrcode-generator 1.4.4 (MIT, Kazuhiko Arase), vendorizado. |
| `data/stock.json` | **Público.** Productos, categorías, precios, stock y muestras. |
| `data/ventas.enc.json` | **Cifrado.** Toda la gestión (ventas, encargos con clientes, pedidos, costes, historial). |
| `img/` | Recortes de producto (`w_*` gris claro, `g_*` gris, `c_*` color) y fotos `foto_horizontal/vertical.webp`. |
| `privado/` | En `.gitignore`. Copias de seguridad descifradas y semilla inicial. **Nunca subir.** |
| `.nojekyll` | Pages sirve los archivos tal cual. |

## Datos

### `data/stock.json` (público)
```json
{ "actualizado": "YYYY-MM-DD", "telefono": "…", "titulo": "…",
  "categorias": [{ "id": "masc|fem|nicho|micado", "nombre": "…", "sub": "…", "precio": 15, "cls": "sm|sf|sn|sk" }],
  "productos":  [{ "ref": "128", "nombre": "Sauvage", "marca": "Dior", "cat": "masc", "orden": 5, "stock": 1, "muestra": true }] }
```
Solo stock y muestras. **No** poner aquí costes, ventas ni clientes. `ref` es el número del proveedor (sin el prefijo VG).

### `data/ventas.enc.json` (cifrado)
Envoltorio: `{ v:1, alg, iter:250000, salt, iv, data }` — AES-GCM-256, clave derivada con PBKDF2-SHA256 de la
"clave de gestión" (frase que solo conoce la familia). Sin la clave no se puede leer; si se pierde, se pierde el registro.

Contenido descifrado (gestión v2):
```js
{ v: 2,
  costes:   { masc: 8, fem: 8, nicho: 8, micado: 6.5 },
  pedidos:  [{ id, nombre, fecha, estado: 'pendiente'|'recibido', fechaRecibido?, lineas: [{ ref, cant, coste }] }],
  ventas:   [{ id, fecha, ref, cant, precio, coste, origen: 'stock'|'encargo', encargo?, cliente, nota }],
  encargos: [{ id, fecha, ref, cant, cliente, contacto, nota, pagado, estado: 'pendiente'|'entregado'|'cancelado', fechaEntrega?, venta? }],
  ajustes:  { [ref]: enteroAcumulado },   // correcciones manuales de stock
  log:      [{ t: ISO, desc }] }          // máx. 300
```
Invariante: `stock(ref) = Σ recibido − Σ vendido + ajustes(ref)`. El panel marca con ≠ los descuadres.
Precio y coste se guardan en cada venta (si cambian después, las ventas antiguas no varían).

## Cómo funciona `admin.html`

- Configuración por dispositivo en `localStorage['vs4eso.cfg'] = { owner, repo, token, clave, modo }`.
  `modo`: `'completo'` (familia) o `'vendedor'` (pantalla con solo *Vendido* y *Pedir*).
- Alta de otro móvil por QR / enlace `admin.html#cfg=<base64url(JSON {o,r,t,k,m})>`: se guarda y se borra el hash.
  El fragmento `#` no llega a ningún servidor, pero el enlace contiene secretos: solo en persona.
- Token: *fine-grained PAT* del propietario, solo este repo, permiso **Contents: Read and write**.
- Cada acción pasa por `guardar(desc, fn)`: `fn(stockCopia, gestionCopia)` modifica copias y devuelve `true` si tocó el
  stock; se escribe `stock.json` (si procede) y después `ventas.enc.json`. Ante 409/422 recarga y reintenta una vez.
  Las validaciones de negocio lanzan `fallo('mensaje')`.
- Mensajes de commit **genéricos** (`Actualiza stock`, `Actualiza registro`) para no revelar ventas en el repo público.
- Acciones: vender, corrección de stock ±1, muestra, encargo (crear, entregar → venta + descuenta stock, pagado,
  cancelar, reabrir), pedidos (crear, recibir → suma stock, deshacer recepción, eliminar), anular venta, costes,
  exportar/importar copia (JSON v2 descifrado), QR para otro dispositivo.
- Los botones destructivos piden doble pulsación (no hay `confirm()`).

## Reglas para quien modifique el código

1. No añadir servidor, build, frameworks ni servicios de pago. Mantener todo estático y en español.
2. No escribir nunca tokens, claves ni datos de clientes en el repo, en commits ni en archivos no cifrados.
   `privado/` no se sube.
3. Los datos (`data/*.json`) los cambia la app. Antes de commitear código: `git pull --rebase --autostash origin main`
   y **no** sobrescribir `data/stock.json` ni `data/ventas.enc.json` con copias locales antiguas.
4. Si se cambia la estructura de la gestión, subir `v` y añadir migración en `normalizar()` (ya migra desde v1).
5. Probar en local con `python -m http.server 8000`. Para `admin.html`, simular la API de GitHub
   (p. ej. Playwright interceptando `https://api.github.com/**` con un almacén en memoria) en vez de usar el repo real.
6. Despliegue: commit + push a `main`; Pages tarda 1–2 min. En Windows (PowerShell):
   `cd "$HOME\Documents\venta-solidaria-4eso"; git pull --rebase --autostash origin main; git add <archivos>; git commit -m "…"; git push`

## Estado a 13/11/2026

- Pedido inicial (23 uds, 167,50 €) **recibido**. Segundo pedido (19 uds, 134 €) **pendiente de recibir**:
  al llegar, *Pedidos → Marcar recibido* (stock pasa de 15 a 34).
- 8 unidades vendidas antes de la app (108 €, beneficio 50 €), cargadas desde `privado/gestion-inicial-2026-11-13.json`.
- Productos nuevos del segundo pedido: 137 Sauvage Elixir y 246 My Way (confirmar si traen muestra).
- Ideas descartadas o pendientes: anonimizar la URL con una organización de GitHub (`venta-solidaria-4eso.github.io`)
  o Netlify; ahora se usa el enlace corto de is.gd.
