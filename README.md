# Venta solidaria · Colonias & Micados (4.º ESO · IES Ribeira do Louro)

Catálogo digital e inventario de la venta solidaria para la excursión de 4.º ESO.
Es HTML estático, sin servidor ni IA: funciona en GitHub Pages y se mantiene solo con GitHub.

## Qué hay

| Archivo | Para qué |
|---|---|
| `index.html` | **Catálogo público** para vecinos y clientes: qué hay disponible, qué se puede encargar, precios y botón *Pedir* por WhatsApp. |
| `catalogo.html` | Hoja **A4 imprimible** (completo B/N, completo color o solo stock) generada con el stock del momento. Botón *Imprimir / guardar PDF*. |
| `admin.html` | **Gestión** (solo familia): vender, corregir stock, apuntar encargos, marcar muestras, historial y deshacer. |
| `data/stock.json` | Stock visible: productos, precios, unidades y muestras. Es lo que lee la página pública. |
| `data/ventas.enc.json` | Ventas, encargos e historial **cifrados** (AES-GCM). Se crea solo al apuntar la primera venta. |
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

## Uso diario

- **Vender 1**: resta una unidad del stock y suma una venta.
- **Stock − / +**: corrige unidades (reposición, error de recuento).
- **Encargos − / +**: pedidos de productos agotados o bajo pedido; cuentan en lo recaudado.
- **Muestra**: indica si hay probador para oler.
- **Historial → Deshacer**: anula el último movimiento.

Cada cambio es un commit (`Actualiza stock` / `Actualiza registro`). La página pública se actualiza en 1–2 minutos.

## Qué es público y qué no

El repositorio es público: cualquiera puede ver `data/stock.json` (lo mismo que muestra el catálogo).
Las ventas, encargos, importes e historial van en `data/ventas.enc.json`, cifrados con la clave de ventas:
sin la clave no se pueden leer. **Si se pierde la clave, ese registro no se puede recuperar** (el stock no se ve afectado).
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
