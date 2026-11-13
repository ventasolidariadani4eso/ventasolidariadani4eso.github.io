/* Venta solidaria · utilidades compartidas (catálogo público, gestión y hoja A4).
   Sin dependencias: funciona en GitHub Pages o abriendo los archivos con un servidor local. */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n = v => Math.max(0, Number(v) || 0);
  const DROP = '<svg class="drop" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5s-6.5 7.4-6.5 12a6.5 6.5 0 0 0 13 0c0-4.6-6.5-12-6.5-12z" fill="currentColor"></path></svg>';

  function fecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) { const d = new Date(); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); }
    return m[3] + '/' + m[2] + '/' + m[1];
  }
  function hoyISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  async function cargarStock() {
    const r = await fetch('data/stock.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('No se pudo leer data/stock.json (' + r.status + ')');
    return r.json();
  }
  function ordenados(datos, cat) {
    return datos.productos.filter(p => p.cat === cat).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }
  function telLimpio(t) { return String(t || '').replace(/\D/g, ''); }

  /* ---------- Hoja A4 (mismo diseño que el catálogo original) ---------- */
  const CAT_CSS = `
.page{--c:#111;--acc:#111;--rule:#bbb;--brc:#555;width:794px;height:1123px;box-sizing:border-box;padding:34px 36px;display:flex;flex-direction:column;gap:16px;font-family:'Jost',system-ui,sans-serif;color:#111;background:#fff;position:relative;overflow:hidden;line-height:1.3}
.page.color{--acc:#a3142b;--rule:#d9d2c8;--brc:#5a5a5a;background:#fbf8f4;color:#1a1a1a}
.page.color .sm{--c:#1c1c1c}.page.color .sf{--c:#6b2d7b}.page.color .sn{--c:#1e5a3a}.page.color .sk{--c:#b4471f}
.page p{margin:0}
.page .hd{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;border-top:1px solid var(--acc);border-bottom:1px solid var(--acc);padding:16px 0 14px}
.page .ey{font-size:12px;letter-spacing:.22em;text-transform:uppercase;font-weight:500;color:var(--acc)}
.page .hd h1{margin:0;font-family:'Bodoni Moda',Georgia,serif;font-weight:500;font-size:54px;line-height:1.05;color:inherit}
.page .hd h1 span{font-style:italic;color:var(--acc)}
.page .fe{font-size:13px;color:var(--brc)}
.page .lg{display:flex;justify-content:center;align-items:center;gap:22px;font-size:13px;flex-wrap:wrap}
.page .lg>span{display:flex;align-items:center;gap:6px}
.page .mn{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:28px;flex-grow:1;min-height:0;position:relative;z-index:1}
.page .col{display:flex;flex-direction:column;gap:20px}
.page .sc{position:relative;isolation:isolate}
.page .sec{display:flex;align-items:baseline;justify-content:space-between;border-bottom:2px solid var(--c);padding-bottom:6px;margin-bottom:4px;color:var(--c)}
.page .sec h2{margin:0;font-family:'Bodoni Moda',Georgia,serif;font-weight:700;font-size:22px;letter-spacing:.01em}
.page .sub{font-size:12px;color:#444;margin-left:8px;font-weight:400;font-family:'Jost',sans-serif;letter-spacing:.06em;text-transform:uppercase}
.page .price{font-family:'Bodoni Moda',Georgia,serif;font-weight:700;font-size:26px}
.page .row{display:grid;grid-template-columns:34px minmax(0,1fr) 18px 90px;column-gap:8px;align-items:center;min-height:26px;padding:2px 0;border-bottom:1px solid var(--rule)}
.page.sin-stock .row{grid-template-columns:34px minmax(0,1fr) 20px}
.page.sin-stock .drop{width:18px;height:18px;justify-self:end}
.page .ref{font-weight:600;font-size:13px;font-variant-numeric:tabular-nums;color:var(--c)}
.page .nm{font-size:14px;line-height:1.25;color:inherit}
.page .br{color:var(--brc);font-size:12.5px}
.page .pill{display:inline-block;text-align:center;font-size:12px;font-weight:600;letter-spacing:.03em;border-radius:20px;padding:2px 0;width:90px;box-sizing:border-box}
.page .ya{background:var(--c);color:#fff;border:1.5px solid var(--c)}
.page .enc{background:#fff;color:var(--c);border:1.5px solid var(--c)}
.page .drop{width:16px;height:16px;display:block;color:var(--c)}
.page .wm{position:absolute;left:50%;transform:translateX(-50%);width:auto;z-index:-1}
.page .pic{display:block;margin:12px auto 0;width:auto}
.page.stock .row{min-height:34px;padding:3px 0;grid-template-columns:36px minmax(0,1fr) 18px 96px}
.page.stock .nm{font-size:15px}.page.stock .pill{width:96px;padding:3px 0}
.page.stock .sec h2{font-size:24px}.page.stock .col{gap:24px}
.page .ft{display:flex;justify-content:center;align-items:center;gap:10px;background:var(--acc);color:#fff;border-radius:6px;padding:6px 16px;flex-shrink:0;position:relative;z-index:1}
.page .ft .a{font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:500;opacity:.95}
.page .ft .b{font-size:14.5px;font-weight:600;letter-spacing:.02em}
.page .ft .qr{background:#fff;border-radius:6px;padding:8px;width:156px;height:156px;flex-shrink:0;box-sizing:border-box}
.page .ft .qr svg{display:block;width:100%;height:100%}
.page .ft.conqr{justify-content:space-between;gap:20px;padding:8px 8px 8px 24px}
.page .ft .txt{display:flex;flex-direction:column;gap:8px;min-width:0}
.page .ft .fila{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.page .ft .fila .b{font-size:20px}
.page .ft .nota{font-size:13px;opacity:.9;max-width:380px;line-height:1.35}
.page.qrg .pic{max-height:100px;margin-top:8px}
.page .ft.conqr{background:transparent;color:#111;border:2px solid var(--acc)}
.page.color .ft.conqr .a{color:var(--acc)}
.page .ft.conqr .qr{padding:2px}
.page *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
`;

  function seccionA4(datos, c, color, solo, sinStock) {
    let items = ordenados(datos, c.id);
    if (solo) items = items.filter(p => n(p.stock) > 0);
    if (!items.length) return '';
    const rows = items.map(p => {
      const s = n(p.stock);
      const pill = sinStock ? '' : (solo ? '<span class="pill ya">' + (s === 1 ? '1 unidad' : s + ' unidades') + '</span>'
        : (s > 0 ? '<span class="pill ya">En stock · ' + s + '</span>' : '<span class="pill enc">Encargo</span>'));
      return '<div class="row"><span class="ref">' + esc(p.ref) + '</span><span class="nm">' + esc(p.nombre)
        + (p.marca ? ' <span class="br">(' + esc(p.marca) + ')</span>' : '') + '</span>'
        + (p.muestra ? DROP : '<span></span>') + pill + '</div>';
    }).join('');
    const k = c.id, wmCat = (k === 'masc' || k === 'fem');
    let img = '';
    if (solo) {
      const src = { masc: 'g_masc', fem: 'g_fem', nicho: 'w_nicho', micado: 'w_micado' }[k];
      const h = { masc: 150, fem: 170, nicho: 150, micado: 190 }[k];
      if (src) img = '<img class="pic" alt="" src="img/' + src + '.webp" style="height:' + h + 'px">';
    } else if (wmCat) {
      img = '<img class="wm" alt="" src="img/' + (color ? 'c_' : 'w_') + k + '.webp" style="top:' + (k === 'masc' ? 48 : 70) + 'px;height:' + (k === 'masc' ? 250 : 340) + 'px' + (color ? ';opacity:.16' : '') + '">';
    } else if (k === 'nicho' || k === 'micado') {
      img = '<img class="pic" alt="" src="img/' + (color ? 'c_' : 'w_') + k + '.webp" style="height:' + (k === 'nicho' ? 120 : 170) + 'px">';
    }
    const usaWm = !solo && wmCat;
    return '<section class="sc ' + esc(c.cls || '') + '">' + (usaWm ? img : '')
      + '<div class="sec"><h2>' + esc(c.nombre) + '<span class="sub">' + esc(c.sub) + '</span></h2><span class="price">' + esc(c.precio) + ' €</span></div>'
      + rows + (usaWm ? '' : img) + '</section>';
  }

  function catalogoA4(datos, modo) {
    const color = modo === 'color', solo = modo === 'stock', conExistencias = modo === 'existencias';
    const sinStock = !solo && !conExistencias;
    const C = Object.fromEntries(datos.categorias.map(c => [c.id, c]));
    const sec = id => C[id] ? seccionA4(datos, C[id], color, solo, sinStock) : '';
    const leg = sinStock
      ? '<span>' + DROP + ' hay muestra para oler</span>'
      : (solo
        ? '<span><span class="pill ya">1 unidad</span> unidades que quedan</span><span>' + DROP + ' hay muestra para oler</span>'
        : '<span><span class="pill ya">En stock · 1</span> unidades que quedan</span><span><span class="pill enc">Encargo</span> se pide y se entrega después</span><span>' + DROP + ' hay muestra para oler</span>');
    const sub = sinStock
      ? 'Catálogo de productos'
      : ((solo ? 'Disponibles para entrega inmediata · existencias a ' : 'Existencias actualizadas a ') + fecha(datos.actualizado));
    const web = datos.web || (typeof location !== 'undefined' && location.hostname && !['localhost','127.0.0.1'].includes(location.hostname) ? (location.host + (location.pathname.startsWith('/venta-solidaria-4eso') ? '/venta-solidaria-4eso' : '')) : 'ventasolidariadani4eso.github.io');
    const qr = qrSVG('https://' + web.replace(/^https?:\/\//, '') + '/');
    return '<div class="page' + (color ? ' color' : '') + (solo ? ' stock' : '') + (sinStock ? ' sin-stock' : '') + (qr ? ' qrg' : '') + '">'
      + '<header class="hd"><p class="ey">' + esc(datos.titulo || '') + '</p><h1>Colonias <span>&amp;</span> Micados</h1><p class="fe">' + sub + '</p></header>'
      + '<div class="lg">' + leg + '</div>'
      + '<main class="mn"><div class="col">' + sec('masc') + sec('micado') + '</div><div class="col">' + sec('fem') + sec('nicho') + '</div></main>'
      + (qr
        ? '<footer class="ft conqr"><div class="txt"><div class="fila"><span class="a">Contacto y pedidos</span><span class="b">' + esc(datos.telefono || '') + '</span></div>'
          + '<div class="fila"><span class="a">Web</span><span class="b">' + esc(web) + '</span></div>'
          + '<p class="nota">Escanea el código para ver qué hay disponible ahora y pedir por WhatsApp.</p></div>'
          + '<span class="qr" role="img" aria-label="Código QR de ' + esc(web) + '">' + qr + '</span></footer></div>'
        : '<footer class="ft"><span class="a">Contacto y pedidos</span><span class="b">' + esc(datos.telefono || '') + '</span><span class="sep" style="opacity:.6;padding:0 4px">·</span><span class="a">Web</span><span class="b">' + esc(web) + '</span></footer></div>');
  }

  /* QR de la web (necesita assets/qrcode.js cargado; si no está, el pie se queda sin QR) */
  function qrSVG(texto) {
    if (typeof qrcode !== 'function') return '';
    try { const q = qrcode(0, 'M'); q.addData(texto); q.make(); return q.createSvgTag({ cellSize: 2, margin: 0, scalable: true }); }
    catch (e) { return ''; }
  }

  window.VS = { esc, n, DROP, fecha, hoyISO, cargarStock, ordenados, telLimpio, CAT_CSS, catalogoA4 };
})();
