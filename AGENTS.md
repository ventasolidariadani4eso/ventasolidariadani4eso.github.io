# Contexto para asistentes de IA (y personas) que continúen este proyecto

Léelo entero antes de tocar nada. El proyecto debe seguir siendo **independiente de cualquier IA**:
HTML/CSS/JS estático en GitHub Pages, sin servidor, sin build y sin dependencias externas en tiempo de ejecución
(salvo Google Fonts, opcional, y el servicio de avisos ntfy.sh, opcional).

## Qué es

Venta solidaria de colonias de equivalencia y ambientadores micado (proveedor **Les Vents de Grasse**) que una familia
gestiona para pagar la excursión de **4.º ESO del IES Ribeira do Louro**. Vende puerta a puerta el alumno (Dani).
Precios de venta: perfumes 15 €, micados 12 €. Costes: perfume 8 €, micado 6,50 €.

- Web pública: **https://ventasolidariadani4eso.github.io/** (sin datos personales en la URL a propósito)
- Gestión: `https://ventasolidariadani4eso.github.io/admin.html` (enlace discreto «Acceso administradores» en la pública)
- Repo: `ventasolidariadani4eso/ventasolidariadani4eso.github.io` (organización de GitHub creada para anonimizar;
  público). Rama `main`, Pages desde la raíz. Antes estuvo en `guillermolareo-art/venta-solidaria-4eso` (ya no existe
  esa URL; los enlaces cortos de is.gd que apuntaban allí han dejado de funcionar).
- Copia local de trabajo del propietario: `C:\Users\guill\Documents\venta-solidaria-4eso` (Windows, PowerShell, `gh` con sesión).

## Archivos

| Ruta | Función |
|---|---|
| `index.html` | Catálogo público. Lee `data/stock.json`. Lista completa sin filtros ni etiquetas de disponibilidad (no muestra «última unidad» ni «por encargo»). Perfumes como «Inspirado en *nombre*» + marca en gris; micados sin «Inspirado en». Botón *Pedir* → WhatsApp con texto prellenado. Foto lateral fija en escritorio, banda superior en móvil. Enlace «Acceso administradores» → `admin.html?admin`. No enlaza a `catalogo.html`. |
| `catalogo.html` | Hoja A4 imprimible, solo enlazada desde la gestión (`noindex`). Modos `?modo=bn|color|existencias|stock`. Pie con teléfono, web y QR grande (sin fondo, solo marco, para ahorrar tinta). `window.print()`. |
| `admin.html` | Gestión completa, modo vendedor, acceso con contraseña y avisos push. Lee y escribe el repo vía API de GitHub (Contents API) desde el navegador. |
| `assets/comun.js` | `window.VS`: utilidades, carga de `stock.json`, generador de la hoja A4 (`CAT_CSS`, `catalogoA4`, `qrSVG`). |
| `assets/estilo.css` | Tokens y estilos de pantalla (claro/oscuro). |
| `assets/qrcode.js` | qrcode-generator 1.4.4 (MIT, Kazuhiko Arase), vendorizado. Lo usan `admin.html` (QR de alta de móviles) y `catalogo.html` (QR del pie). |
| `data/stock.json` | **Público.** Productos, categorías, precios, stock y muestras. |
| `data/ventas.enc.json` | **Cifrado.** Toda la gestión (ventas, encargos con clientes, pedidos, costes, avisos, historial). |
| `data/acceso.enc.json` | **Cifrado.** `{t: token, o: owner, r: repo}` cifrado con la clave de gestión, para entrar solo con contraseña. |
| `img/` | Recortes de producto (`w_*` gris claro, `g_*` gris, `c_*` color), fotos `foto_horizontal/vertical.webp`, iconos `icono.svg`, `icono-32/180/512.png`. |
| `privado/` | En `.gitignore`. Copias de seguridad descifradas, semilla inicial, imágenes para WhatsApp, tokens en txt. **Nunca subir.** |
| `.nojekyll` | Pages sirve los archivos tal cual. |

## Datos

### `data/stock.json` (público)
```json
{ "actualizado": "YYYY-MM-DD", "telefono": "…", "titulo": "…",
  "categorias": [{ "id": "masc|fem|nicho|micado", "nombre": "…", "sub": "…", "precio": 15, "cls": "sm|sf|sn|sk" }],
  "productos":  [{ "ref": "128", "nombre": "Sauvage", "marca": "Dior", "cat": "masc", "orden": 5, "stock": 1, "muestra": true }] }
```
Solo stock y muestras. **No** poner aquí costes, ventas ni clientes. `ref` es el número del proveedor (sin el prefijo VG).

### Archivos cifrados
Envoltorio común: `{ v:1, alg, iter:250000, salt, iv, data }` — AES-GCM-256 con clave derivada por PBKDF2-SHA256 de la
**clave de gestión** (frase que solo conoce la familia; es también la contraseña de «Acceso administradores»).
Sin la clave no se pueden leer; si se pierde, se pierde el registro (por eso existe *Exportar copia*).

Contenido descifrado de `ventas.enc.json` (gestión v2):
```js
{ v: 2,
  costes:   { masc: 8, fem: 8, nicho: 8, micado: 6.5 },
  pedidos:  [{ id, nombre, fecha, estado: 'pendiente'|'recibido', fechaRecibido?, lineas: [{ ref, cant, coste }] }],
  ventas:   [{ id, fecha, ref, cant, precio, coste, origen: 'stock'|'encargo', encargo?, cliente, nota }],
  encargos: [{ id, fecha, ref, cant, cliente, contacto, nota, pagado, estado: 'pendiente'|'entregado'|'cancelado', fechaEntrega?, venta? }],
  ajustes:  { [ref]: enteroAcumulado },   // correcciones manuales de stock
  avisos:   { canal, ventas: bool, encargos: bool },   // opcional, ntfy
  log:      [{ t: ISO, desc }] }          // máx. 300
```
Invariante: `stock(ref) = Σ recibido − Σ vendido + ajustes(ref)`. El panel marca con ≠ los descuadres.
Precio y coste se guardan en cada venta.

## Cómo funciona `admin.html`

- **Configuración por dispositivo** en `localStorage['vs4eso.cfg'] = { owner, repo, token, clave, modo }`.
  En `*.github.io` el owner/repo se deducen del dominio. `modo`: `'completo'` o `'vendedor'`.
- **Token**: *fine-grained PAT* con *Resource owner* = organización `ventasolidariadani4eso`, acceso al repo y
  permiso **Contents: Read and write**. Un token del usuario personal ya no sirve (da 403 al escribir).
  Al renovarlo: pegarlo en *Ajustes* de un dispositivo → *Guardar y conectar* → *Activar / actualizar acceso con contraseña*
  → regenerar los QR de los móviles en modo vendedor.
- **Tres formas de configurar un dispositivo**:
  1. *Ajustes* manual (token + clave).
  2. **Acceso administradores** (`admin.html?admin`): solo contraseña; descifra `data/acceso.enc.json`. El dispositivo
     se recuerda (casilla «Recordar», marcada por defecto). Si el dispositivo estaba en modo vendedor, con la contraseña
     pasa a gestión completa.
  3. **QR / enlace** `admin.html#cfg=<base64url(JSON {o,r,t,k,m})>` generado en *Ajustes → Configurar otro móvil*
     («solo vender» o «gestión completa»). Contiene secretos: solo en persona.
- **Modo vendedor** (móvil del alumno): solo productos con stock y botón *Vendido*; justo debajo, el bloque
  **«Vendido hoy»** (`#vendHoy`), **siempre visible** (sin ventas muestra un aviso), con un botón *Anular* por cada venta
  del día (`fecha === hoy()`); las de días anteriores solo se anulan desde *Ventas* en gestión completa. Después,
  formulario *Apuntar un pedido* con destinatario obligatorio y lista de pedidos pendientes; sin cifras económicas.
  No pide contraseña. Lo pinta `pintarVend()`.
- **Pestañas**: Panel · Stock · **Encargos y pedidos** · Ventas · Ajustes. Desde el 19/11/2026 ya **no existe la pestaña
  Pedidos**: está fusionada con Encargos en `#v-enc` para decidir los pedidos al proveedor viendo los encargos.
  Al abrir esa pestaña, `setTab('enc')` añade `body.ancho` (la columna central pasa de 940 a 1360 px).
- **Vista «Encargos y pedidos»** (`#v-enc`, rejilla `.encped`): dos columnas desde 1000 px (encargos ≈ 2/3 a la
  izquierda, `aside.colPed` ≈ 1/3 a la derecha); en pantallas estrechas, una debajo de otra (primero encargos).
  - Columna derecha **Pedidos al proveedor**, de arriba abajo: *Nuevo pedido* (plegado), pedidos por llegar (`#peds`),
    tabla de cobertura (`#faltan`), recibidos plegados (`#pedsRec`) y nota.
  - **Alineación horizontal** (`alinearTablas()` → `alinearAhora()`): con dos columnas (≥ 1000 px), vista *Por producto*
    y sin búsqueda, iguala la altura de cada fila de producto en la tabla de encargos (`#encPend .encT`) y en la de
    cobertura (`#faltan .cob`), emparejadas por `data-ref`; añade filas de relleno `tr.alfill` frente a la ficha abierta
    (`tr.edet`) y pone `margin-top` a la tabla que empieza más arriba para que las cabeceras coincidan. Se recalcula al
    pintar, al cambiar de pestaña, al redimensionar y al abrir o cerrar cualquier `<details>` de la vista. En móvil no
    se aplica. Ambas tablas usan el mismo orden (primero lo que falta, luego por ref).
    - `#faltan` = tabla **Cobertura de los encargos**: por cada producto con encargos pendientes, *Enc.* (uds encargadas),
      *Stock*, *Llega* (en pedidos sin recibir) y *Falta* = `encP − stock − pend` (✓ si está cubierto). Botón
      **Pedir lo que falta (N uds)** (`#pedirFalt`): rellena el formulario de pedido con esas líneas y lo abre.
    - Formulario *Nuevo pedido* plegado en `<details id="dPed">` (se pliega tras guardar). IDs de siempre
      (`fPed`, `pNom`, `pFec`, `pLineas`, `pAdd`, `pTot`).
    - `#peds` (`pintarPed()`, `cardPed()`): primero los pedidos **por llegar** (*Marcar recibido*, *Eliminar*);
      los recibidos plegados en «Recibidos (N)» con *Deshacer recepción*.
  - **Colores pedido ↔ encargo** (`cobertura()`, `chipPed()`, variable `COB`): cada pedido por llegar recibe un color
    (`COLORES_PED`, por orden de fecha) y su tarjeta lleva borde y ✓ de ese color y la línea «Cubre encargos de:
    clientes (uds)». `cobertura()` reparte por producto las unidades entre los encargos pendientes, del más antiguo al
    más reciente: primero el stock y luego cada pedido por llegar, del más antiguo al más nuevo. Cada encargo que
    recibe unidades de un pedido muestra un ✓ con el nombre y color de ese pedido (puede tener varios); lo que no
    cubren ni el stock ni los pedidos aparece como «falta N». Es solo visual: no se guarda nada en los datos.
- **Columna de encargos** (`pintarEnc()`, `filaEnc()`): mismo contenedor y estilo que la de pedidos (`.colEnc`, fondo
  `--chip`, caja blanca, tabla `.cob`). Selector **Por producto / Por cliente** (`data-emodo`, variable `encModo`,
  recordado en `localStorage['vs4eso.encModo']`; por defecto *Por producto*).
  - **Por producto** (`pintarEncProd()`, `chipEnc()`): tabla `.encT` con una fila por producto con encargos
    pendientes (mismo orden que la tabla de cobertura: primero lo que falta). Columnas: *Producto* (ref, nombre y
    «N encargadas · stock · llegan»), *Encargos* y *Falta*. En *Encargos* cada encargo es una etiqueta con el cliente
    y las unidades, según de dónde salen (reparto de `cobertura()`, que guarda `partes:[{id|null,u}]`):
    verde con ● = stock; relleno del color del pedido con ✓ = llega en ese pedido; discontinua naranja = falta pedir.
    «€» = pagado. Un encargo repartido entre varias fuentes sale en varias etiquetas. Encima, leyenda con los colores.
    Al pulsar una etiqueta (`data-encsel`, variable `encSel`) se abre debajo de esa fila una ficha con *Pagado*,
    *Entregar*, ✕ y «Ver su pedido completo» (`data-ecli`: pasa a *Por cliente* filtrando por ese cliente).
  - **Por cliente**: las tarjetas por cliente descritas a continuación (con *Entregar todo*), en cuadrícula
    `#encPend.porCli`.
  - Formulario *Nuevo encargo* en `<details id="dEnc">`: **desplegado de inicio en ordenador** (≥ 1000 px, ocupa el
    hueco frente a los pedidos por llegar) y plegado en móvil; se abre también al venir del botón *Encargo* de Stock.
  - Buscador `#encQ` (cliente, contacto, nota, ref, nombre, marca). Si coincide algún encargo de un cliente, se muestra
    **el pedido completo** de ese cliente. Al lado, resumen: clientes · uds · € · sin cobrar.
  - Pendientes **agrupados por cliente** con `claveCli()` (sin distinguir mayúsculas, tildes ni espacios: «María» =
    «maria »). Los encargos sin nombre van juntos al final («Sin nombre»). Grupos ordenados por su encargo más antiguo.
  - Cada grupo es una **tarjeta compacta** en cuadrícula CSS (`#encPend`, `repeat(auto-fill,minmax(270px,1fr))`:
    3 por fila en ordenador, 2 en tablet, 1 en móvil). Cabecera: nombre, contactos, uds · €, insignia
    *Pagado* / *Debe X €* / *Debe X € de Y €*. Cada línea: ref, producto, × cant, importe; debajo fecha (dd/mm), nota,
    «falta N» y botones *Sin pagar/Pagado*, *Entregar*, ✕ (cancelar, doble pulsación).
  - **Entregar todo** (cabecera, solo si el cliente tiene más de un encargo; `data-encg="entregar"`, `data-ids`):
    doble pulsación; entrega en un único `guardar()` todos los pendientes del cliente (una venta por línea, descuenta
    stock, marca pagado). Se deshabilita si el stock no alcanza para todo (suma por `ref`); nunca entrega a medias.
    El log/aviso usa el prefijo `Encargo entregado: ` para que `avisarSiToca()` lo notifique.
  - Historial (entregados y cancelados) en lista compacta con *Reabrir*.
- **Guardado**: `guardar(desc, fn)` → `fn(stockCopia, gestionCopia)` modifica copias y devuelve `true` si tocó el stock;
  se escribe `stock.json` (si procede) y luego `ventas.enc.json`; ante 409/422 recarga y reintenta una vez. Errores
  visibles con *toast* (401/403 → «este dispositivo no tiene permiso… QR nuevo»). Validaciones con `fallo('mensaje')`.
- **Avisos push**: tras guardar una venta o un encargo nuevo/entregado se hace `POST https://ntfy.sh/` con
  `{topic: canal, title, message, tags}`. El canal (aleatorio, `venta-solidaria-…`) se guarda cifrado en la gestión, así
  avisan todos los dispositivos. Los móviles se suscriben con la app **ntfy**. Fallos de ntfy se ignoran.
- Commits **genéricos** (`Actualiza stock`, `Actualiza registro`, `Actualiza acceso`) para no revelar ventas.
- Botones destructivos con doble pulsación (no hay `confirm()`).

## Reglas para quien modifique el código

1. No añadir servidor, build, frameworks ni servicios de pago. Mantener todo estático y en español.
2. Nunca escribir tokens, claves ni datos de clientes en el repo, en commits ni en archivos sin cifrar. `privado/` no se sube.
3. Los datos (`data/*.json`) los cambia la app. Antes de commitear código: `git pull --rebase origin main`
   (la web hace commits continuamente) y **no** sobrescribir `data/*.json` con copias locales antiguas.
4. **No ejecutar `git checkout`, `git restore`, `git stash` ni reescribir archivos del repo que no sean objeto de la
   tarea**: ya ha pasado que otro agente devolvía archivos a versiones antiguas y se perdían cambios. Trabajar PDFs u
   otros entregables fuera del repo o en `privado/`.
5. Si cambia la estructura de la gestión, subir `v` y migrar en `normalizar()` (ya migra desde v1).
6. Probar en local con `python -m http.server 8000`. Para `admin.html`, simular `https://api.github.com/**` y
   `https://ntfy.sh/**` (p. ej. Playwright con almacén en memoria) en vez de usar el repo real.
   Atajo para probar la interfaz sin conexión ni clave: tras cargar la página, en la consola (o `page.evaluate`):
   `G = {encargos:[…], ventas:[], pedidos:[], log:[], ajustes:{}, costes:{}}; conectado = true;
   escribir = async () => 'sha'; cifrar = async () => ({}); pintarTodo(); setTab('enc');`
   Así se pueden pulsar botones sin escribir nada en GitHub. Probar en anchos ~1400, ~1000, ~700 y ~390 px.
7. Despliegue (PowerShell):
   `cd "$HOME\Documents\venta-solidaria-4eso"; git pull --rebase origin main; git add <archivos>; git commit -m "…"; git push`
   Pages tarda 1–2 min. Comprobar en la web con recarga forzada.

## Estado a 14/11/2026

- Pedido inicial (23 uds, 167,50 €) recibido. Segundo pedido (19 uds, 134 €) **pendiente de recibir**: al llegar,
  *Encargos y pedidos → Marcar recibido*. Confirmar si 137 Sauvage Elixir y 246 My Way traen muestra.
- 8 unidades vendidas antes de la app (108 €), cargadas desde `privado/gestion-inicial-2026-11-13.json`.
- Token nuevo de la organización en uso; los tokens antiguos deben borrarse. El móvil del alumno debe tener el QR
  generado con el token nuevo.
- Avisos ntfy activos y probados.
- Cambios de interfaz 14–19/11/2026: modo vendedor con «Vendido hoy» siempre visible y *Anular*; Encargos agrupados
  por cliente en tarjetas compactas (3 por fila), buscador y *Entregar todo*; Encargos y Pedidos fusionados en una
  sola pestaña a dos columnas con tabla de cobertura (ver «Cómo funciona `admin.html`»).
- Pendiente/ideas: renovar el token antes de que caduque; exportar copia de seguridad semanal; al terminar la venta,
  exportar copia final y desactivar Pages o archivar el repo.
