# Venta solidaria · Colonias & Micados (4.º ESO · IES Ribeira do Louro)

Catálogo digital e inventario de la venta solidaria para la excursión de 4.º ESO.
Es HTML estático, sin servidor ni IA: funciona en GitHub Pages y se mantiene solo con GitHub.

## Qué hay

| Archivo | Para qué |
|---|---|
| `index.html` | **Catálogo público** para vecinos y clientes: qué hay disponible, qué se puede encargar, precios y botón *Pedir* por WhatsApp. |
| `catalogo.html` | Hoja **A4 imprimible** (completo B/N, completo color o solo stock) generada con el stock del momento. Botón *Imprimir / guardar PDF*. |
| `admin.html` | **Gestión** (solo familia): panel económico, stock, ventas, encargos con cliente, pedidos al proveedor, costes y copias de seguridad. |
| `data/stock.json` | Stock visible: productos, precios, unidades y muestras. Es lo que lee la página pública. |
| `data/ventas.enc.json` | Gestión **cifrada** (AES-GCM): ventas, encargos, pedidos, costes e historial. Se crea al guardar por primera vez. |
| `privado/` | No se sube a GitHub (`.gitignore`). Contiene `gestion-inicial-2026-11-13.json` para importar los datos de partida. |
| `assets/`, `img/` | Estilos, lógica compartida e imágenes de producto. |

## Puesta en marcha (una sola vez)

1. **Crear el repositorio** en GitHub (público) con el nombre `venta-solidaria-4eso` y subir esta carpeta (push).
2. **Activar Pages**: *Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save*.
   En 1–2 minutos estará en `https://guillermolareo-art.github.io/venta-solidaria-4eso/`.
3. **Crear un token** para apuntar ventas desde la web:
   *GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*
   - Repository access: **Only select repositories** → `venta-solidaria-4eso`
   - Permissions → Repository permissions → **Contents: Read and write**
   - Caducidad: hasta que acabe la venta.
4. Abrir `…/venta-solidaria-4eso/admin.html` → pestaña **Ajustes** → pegar usuario, repo, token y una **clave de ventas**
   (una frase que solo sepa la familia; la misma en todos los dispositivos). Repetir en cada móvil u ordenador.

5. **Cargar los datos de partida** (una vez): en `admin.html` → Ajustes → *Importar copia…* → elegir
   `privado/gestion-inicial-2026-11-13.json` → *Confirmar*. Incluye el pedido inicial (recibido), el segundo
   pedido (pendiente), las 8 ventas hasta el 13/11 y los costes (8 € perfume, 6,50 € micado).

6. **Otros móviles** (familia o vendedor): en tu `admin.html` → Ajustes → *Configurar otro móvil* →
   **QR solo vender** (pantalla sencilla con *Vendido* y *Pedir*) o **QR gestión completa**. Se escanea con la cámara
   y el móvil queda configurado sin escribir nada ni tener cuenta de GitHub. El QR lleva el token y la clave: enséñalo
   solo en persona.

> Si vas a continuar el proyecto con otra IA o persona, lee primero [`AGENTS.md`](AGENTS.md).

## Uso diario (admin.html)

- **Panel**: ingresos, beneficio obtenido, invertido y % recuperado, saldo de caja, stock, encargos, pedidos por llegar
  y beneficio previsto; tablas por categoría y por producto (avisa con ≠ si el stock no cuadra).
- **Stock**: *Vender 1* (descuenta y apunta la venta), *Encargo* (abre el formulario con el producto),
  *Stock − / +* solo para corregir recuentos, *Muestra*.
- **Encargos**: cliente, contacto, nota y si está pagado. *Entregar* lo convierte en venta y descuenta stock;
  *Cancelar* / *Reabrir*. Indica qué hay que pedir para cubrir los encargos y prepara el pedido.
- **Pedidos**: pedidos al proveedor con su coste. *Marcar recibido* suma las unidades al stock (y a la web pública).
- **Ventas**: lista con importe y beneficio; *Anular* devuelve las unidades al stock.
- **Ajustes**: conexión, costes por unidad, exportar / importar copia y actividad reciente.

Los botones que borran o deshacen piden una segunda pulsación para confirmar.

Cada cambio es un commit (`Actualiza stock` / `Actualiza registro`). La página pública se actualiza en 1–2 minutos.

## Qué es público y qué no

El repositorio es público: cualquiera puede ver `data/stock.json` (lo mismo que muestra el catálogo).
Ventas, encargos (con nombres de clientes), pedidos, costes e historial van en `data/ventas.enc.json`, cifrados con la
clave de gestión: sin la clave no se pueden leer. **Si se pierde la clave, ese registro no se puede recuperar**:
exporta una copia de vez en cuando (Ajustes → Exportar) y guárdala en `privado/` o en tu Drive.
El token y la clave se guardan solo en el navegador de cada dispositivo, nunca en el repositorio.

## Cambiar productos o precios

Editar `data/stock.json` directamente en GitHub (icono del lápiz): añadir o quitar productos, cambiar `precio` de una
categoría, el `telefono` o el `titulo`. Cada producto: `ref`, `nombre`, `marca`, `cat` (`masc`, `fem`, `nicho`, `micado`),
`orden`, `stock`, `muestra`.

## Probar en local

```
python -m http.server 8000
```
y abrir `http://localhost:8000/` (abrir el HTML con doble clic no funciona porque el navegador bloquea la lectura del JSON).
