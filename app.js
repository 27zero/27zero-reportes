/* 27zero Reportes — aplicación (v2: cliente, fechas, tipos de gráfica y análisis escrito) */
(function () {
  'use strict';

  var C = window.APP_CONFIG || {};
  var DEMO = !!C.DEMO;
  var TZ = 'America/Bogota';
  var INVERSAS = ['cpc', 'cpm', 'cpa', 'cpl', 'costo_por_negocio', 'tasa_rebote']; // subir es malo
  var DIMS_TIEMPO = ['fecha', 'semana', 'mes'];
  var TODOS = '__todos';
  var COLORES = ['#3E128C', '#E8772A', '#6A2BD9', '#AC8AE3', '#C25A12', '#1C063F', '#CDB8EF', '#F2A36B', '#8E879F'];
  var PLANTILLAS = {
    resumen:  { dim: ['mes', 'plataforma'], met: ['impresiones', 'clics', 'inversion', 'conversiones', 'leads', 'sesiones', 'ctr', 'cpl'], periodo: 'este_anio', pla: [] },
    campanas: { dim: ['plataforma', 'campana'], met: ['impresiones', 'clics', 'ctr', 'inversion', 'cpc', 'conversiones', 'cpa', 'leads', 'cpl'], periodo: 'ultimos_30', pla: ['Google Ads', 'LinkedIn Ads'], comparar: 'anterior' },
    embudo:   { dim: ['semana'], met: ['sesiones', 'conversiones', 'leads', 'negocios_creados', 'negocios_ganados', 'valor_negocios'], periodo: 'ultimos_90', pla: ['Google Analytics', 'HubSpot'] },
    organico: { dim: ['semana'], met: ['impresiones', 'clics', 'interacciones', 'tasa_interaccion', 'seguidores_nuevos'], periodo: 'ultimos_90', pla: ['LinkedIn'] },
    sitio:    { dim: ['semana'], met: ['usuarios_activos', 'sesiones', 'vistas', 'tasa_rebote', 'tiempo_prom_sesion', 'vistas_por_sesion'], periodo: 'mes_pasado', pla: ['Google Analytics'], comparar: 'ninguno' },
    paginas:  { dim: ['pagina'], met: ['vistas', 'usuarios_activos', 'tiempo_prom_usuario'], periodo: 'mes_pasado', pla: ['Google Analytics · Páginas'], comparar: 'anterior' },
    blog:     { dim: ['pagina'], met: ['vistas', 'usuarios_activos', 'tiempo_prom_usuario'], periodo: 'mes_pasado', pla: ['Google Analytics · Páginas'], comparar: 'anterior', filtro: '/blog/' },
    referencias: { dim: ['canal', 'fuente_medio'], met: ['sesiones', 'usuarios_activos', 'tasa_rebote', 'tiempo_prom_sesion'], periodo: 'mes_pasado', pla: ['Google Analytics'], comparar: 'anterior' }
  };
  var SECCIONES = {
    resumen: { vacio: 'Escribe el análisis de este periodo', titulo: 'Análisis del periodo' },
    grafico: { vacio: 'Agregar una nota sobre el gráfico', titulo: 'Nota del gráfico' },
    tabla:   { vacio: 'Agregar una nota sobre la tabla', titulo: 'Nota de la tabla' }
  };

  var OP = null, token = null, usuario = null, ultimo = null, grafico = null;
  var orden = { col: null, asc: true };
  var sel = { pla: [], dim: [], met: [] };
  var editando = {};

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function iconos() { if (window.lucide) window.lucide.createIcons(); }
  function toast(t) { var el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { el.classList.remove('show'); }, 2800); }
  function cargando(on) { $('loading').classList.toggle('hidden', !on); }
  function guardarLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  function leerLocal(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }

  /* ================= API ================= */

  function api(accion, cfg, extra) {
    if (DEMO) return window.DEMO_API(accion, cfg, extra);
    var body = { token: token, accion: accion, cfg: cfg };
    Object.keys(extra || {}).forEach(function (k) { body[k] = extra[k]; });
    return fetch(C.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS con Apps Script
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) { var e = new Error(j.error || 'Error del servidor.'); e.codigo = j.codigo; throw e; }
      return j.datos;
    });
  }

  /* ================= Sesión ================= */

  function payloadJwt(t) {
    try {
      var b = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      return JSON.parse(decodeURIComponent(escape(atob(b))));
    } catch (e) { return null; }
  }
  function tokenVigente(t) { var p = t && payloadJwt(t); return !!(p && p.exp * 1000 > Date.now() + 60000); }

  function mostrarLogin(msg) {
    $('app').classList.add('hidden');
    $('login').classList.remove('hidden');
    $('loginMsg').textContent = msg || '';
    if (!C.GOOGLE_CLIENT_ID) { $('loginMsg').textContent = 'Falta GOOGLE_CLIENT_ID en config.js.'; return; }
    (function esperar() {
      if (!(window.google && google.accounts && google.accounts.id)) return setTimeout(esperar, 150);
      google.accounts.id.initialize({
        client_id: C.GOOGLE_CLIENT_ID,
        auto_select: true,
        callback: function (r) {
          token = r.credential;
          try { sessionStorage.setItem('z27_token', token); } catch (e) { /* sin almacenamiento */ }
          arrancar();
        }
      });
      google.accounts.id.renderButton($('gbtn'), { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: 'es' });
      google.accounts.id.prompt();
    })();
  }

  function salir() {
    token = null;
    try { sessionStorage.removeItem('z27_token'); } catch (e) { /* nada */ }
    if (DEMO) { toast('En modo demo no hay sesión que cerrar.'); return; }
    if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
    mostrarLogin('Cerraste sesión.');
  }

  function arrancar() {
    cargando(true);
    api('opciones').then(function (op) {
      OP = op; usuario = op.usuario;
      $('login').classList.add('hidden');
      $('app').classList.remove('hidden');
      construirUI();
      var desdeEnlace = leerHash();
      if (desdeEnlace) { aplicarCfg(desdeEnlace); consultar(); }
    }).catch(function (e) {
      token = null;
      try { sessionStorage.removeItem('z27_token'); } catch (x) { /* nada */ }
      mostrarLogin(e.codigo === 'auth' ? e.message : 'No se pudo conectar con el servidor: ' + e.message);
    }).then(function () { cargando(false); });
  }

  /* ================= Fechas ================= */

  function hoyBogota() { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  var DIA = 86400000;

  /** Mismo cálculo que el servidor (resolverPeriodo_), para mostrar las fechas al elegir un periodo. */
  function resolverPeriodo(p) {
    var h = hoyBogota().split('-').map(Number), y = h[0], m = h[1] - 1, d = h[2];
    var ayer = Date.UTC(y, m, d) - DIA, ini, fin = ayer;
    switch (p) {
      case 'ayer': ini = ayer; break;
      case 'ultimos_7': ini = ayer - 6 * DIA; break;
      case 'ultimos_90': ini = ayer - 89 * DIA; break;
      case 'este_mes': ini = Date.UTC(y, m, 1); break;
      case 'mes_pasado': ini = Date.UTC(y, m - 1, 1); fin = Date.UTC(y, m, 1) - DIA; break;
      case 'este_anio': ini = Date.UTC(y, 0, 1); break;
      default: ini = ayer - 29 * DIA;
    }
    if (ini > fin) ini = fin;
    return { desde: iso(ini), hasta: iso(fin) };
  }

  function alCambiarPeriodo() {
    var p = $('periodo').value;
    if (p !== 'personalizado') { var r = resolverPeriodo(p); $('desde').value = r.desde; $('hasta').value = r.hasta; }
    refrescarSiHayResultado();
  }
  function alCambiarFecha() {
    $('periodo').value = 'personalizado';
    if ($('desde').value && $('hasta').value && $('desde').value <= $('hasta').value) refrescarSiHayResultado();
  }
  var tRefresco = null;
  function refrescarSiHayResultado() {
    if (!ultimo) return;
    clearTimeout(tRefresco);
    tRefresco = setTimeout(consultar, 350);
  }

  /* ================= Constructor ================= */

  function construirUI() {
    $('userName').textContent = usuario.nombre || usuario.email;
    $('userRol').textContent = usuario.rol === 'admin' ? 'Equipo 27zero' : 'Cliente';
    $('demoBadge').classList.toggle('hidden', !DEMO);

    // Cliente: un solo cliente por defecto; "todos" hay que elegirlo a propósito.
    var opts = OP.clientes.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.nombre) + '</option>'; });
    if (OP.clientes.length > 1) opts.push('<option value="' + TODOS + '">Todos los clientes (lado a lado)</option>');
    $('cliente').innerHTML = opts.join('');
    $('secCliente').classList.toggle('hidden', OP.clientes.length <= 1);

    chips('pla', OP.plataformas.map(function (p) { return { id: p, nombre: p }; }), 'pla');
    chips('dim', OP.dimensiones, 'dim', true);
    chips('metB', OP.metricasBase, 'met');
    chips('metC', OP.metricasCalc, 'met');

    $('periodo').innerHTML = OP.periodos.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + '</option>'; }).join('');
    $('periodo').value = 'ultimos_30';
    alCambiarPeriodo();
    $('hasta').max = hoyBogota(); $('desde').max = hoyBogota();
    $('rangoDatos').textContent = OP.rangoDatos.min ? 'Hay datos del ' + OP.rangoDatos.min + ' al ' + OP.rangoDatos.max : 'Aún no hay datos cargados.';

    sel.dim = ['plataforma'];
    sel.met = ['impresiones', 'clics', 'inversion', 'conversiones'];
    pintarChips();
    pintarGuardados();
    iconos();
  }

  function chips(cont, items, grupo, ordenado) {
    var el = $(cont); el.innerHTML = '';
    items.forEach(function (it) {
      var c = document.createElement('span');
      c.className = 'chip';
      c.dataset.id = it.id; c.dataset.grupo = grupo; c.dataset.nombre = it.nombre;
      if (ordenado) c.dataset.ord = '1';
      c.addEventListener('click', function () {
        var arr = sel[grupo], i = arr.indexOf(it.id);
        if (i === -1) arr.push(it.id); else arr.splice(i, 1);
        pintarChips();
      });
      el.appendChild(c);
    });
  }

  function pintarChips() {
    document.querySelectorAll('.chip').forEach(function (c) {
      var arr = sel[c.dataset.grupo], i = arr.indexOf(c.dataset.id);
      c.classList.toggle('on', i !== -1);
      c.innerHTML = (i !== -1 && c.dataset.ord ? '<span class="n">' + (i + 1) + '</span>' : '') + esc(c.dataset.nombre);
    });
    var tiempo = sel.dim.some(function (d) { return DIMS_TIEMPO.indexOf(d) !== -1; });
    $('comparar').disabled = tiempo;
    $('comparar').title = tiempo ? 'Para comparar, quita Fecha, Semana o Mes de "Dividir por".' : '';
    if (tiempo) $('comparar').value = 'ninguno';
  }

  function alCambiarCliente() {
    // Con "todos los clientes" se agrega la dimensión Cliente para verlos lado a lado y no sumados.
    if ($('cliente').value === TODOS && sel.dim.indexOf('cliente') === -1) {
      var pos = sel.dim.length && DIMS_TIEMPO.indexOf(sel.dim[0]) !== -1 ? 1 : 0;
      sel.dim.splice(pos, 0, 'cliente');
      pintarChips();
      toast('Se agregó "Cliente" a Dividir por, para ver cada cliente por separado.');
    }
    refrescarSiHayResultado();
  }

  function clientesSeleccionados() {
    var v = $('cliente').value;
    if (v === TODOS || !v) return [];
    return [v];
  }

  function cfgActual() {
    var colM = $('chartMetric').selectedOptions[0];
    return {
      clientes: clientesSeleccionados(), plataformas: sel.pla.slice(),
      periodo: $('periodo').value, desde: $('desde').value, hasta: $('hasta').value,
      comparar: $('comparar').value, dimensiones: sel.dim.slice(), metricas: sel.met.slice(),
      filtroCampana: $('filtro').value.trim(),
      grafico: { tipo: $('chartTipo').value, metrica: colM ? colM.dataset.metrica : '' }
    };
  }

  function aplicarCfg(c) {
    var validos = function (arr, lista) { return (arr || []).filter(function (x) { return lista.indexOf(x) !== -1; }); };
    var ids = OP.clientes.map(function (x) { return x.id; });
    var cli = validos(c.clientes, ids);
    $('cliente').value = cli.length === 1 ? cli[0] : (OP.clientes.length > 1 ? TODOS : ids[0]);
    sel.pla = validos(c.plataformas, OP.plataformas);
    sel.dim = validos(c.dimensiones, OP.dimensiones.map(function (x) { return x.id; }));
    sel.met = validos(c.metricas, OP.metricasBase.concat(OP.metricasCalc).map(function (x) { return x.id; }));
    $('periodo').value = c.periodo || 'ultimos_30';
    if ($('periodo').value === 'personalizado') { $('desde').value = c.desde || ''; $('hasta').value = c.hasta || ''; }
    else { var r = resolverPeriodo($('periodo').value); $('desde').value = r.desde; $('hasta').value = r.hasta; }
    $('comparar').value = c.comparar || 'ninguno';
    $('filtro').value = c.filtroCampana || '';
    $('chartTipo').value = (c.grafico && c.grafico.tipo) || 'auto';
    aplicarCfg.metricaGrafico = c.grafico && c.grafico.metrica;
    pintarChips();
  }

  /* ================= Consulta ================= */

  function consultar() {
    var cfg = cfgActual();
    if (!cfg.metricas.length) { toast('Elige al menos una métrica.'); return; }
    if (cfg.periodo === 'personalizado' && (!cfg.desde || !cfg.hasta || cfg.desde > cfg.hasta)) { toast('Revisa las fechas: "desde" debe ser anterior a "hasta".'); return; }
    $('btnConsultar').disabled = true; cargando(true);
    api('consultar', cfg).then(function (res) {
      ultimo = { cfg: cfg, res: res };
      orden = { col: null, asc: true };
      editando = {};
      escribirHash(cfg);
      pintarResultado();
    }).catch(function (e) {
      if (e.codigo === 'auth') { mostrarLogin(e.message); return; }
      $('avisos').innerHTML = '<div class="aviso error">' + esc(e.message) + '</div>';
    }).then(function () { $('btnConsultar').disabled = false; cargando(false); });
  }

  /** Describe cada columna del resultado: dimensión o métrica (actual / anterior / variación). */
  function columnas(res, cfg) {
    var nd = res.nDimensiones, comp = !!res.comparacion, cols = [];
    for (var i = 0; i < res.encabezado.length; i++) {
      if (i < nd) { cols.push({ i: i, tipo: 't', nombre: res.encabezado[i] }); continue; }
      var k = i - nd, paso = comp ? 3 : 1, m = cfg.metricas[Math.floor(k / paso)], rol = comp ? ['act', 'prev', 'delta'][k % 3] : 'act';
      cols.push({ i: i, tipo: res.tipos[i], nombre: res.encabezado[i], metrica: m, rol: rol });
    }
    return cols;
  }

  var NF = {
    n: new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }),
    d: new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    r: new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }),
    p: new Intl.NumberFormat('es-CO', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  };
  function fmt(v, tipo) {
    if (v === '' || v === null || v === undefined) return tipo === 't' ? '' : '–';
    if (tipo === 't' || typeof v !== 'number') return esc(v);
    return NF[tipo] ? NF[tipo].format(v) : String(v);
  }
  function fmtTxt(v, tipo) { // sin HTML, para los borradores de texto
    if (v === '' || v === null || v === undefined) return '–';
    if (typeof v !== 'number') return String(v);
    return NF[tipo] ? NF[tipo].format(v) : String(v);
  }
  function delta(v, metrica) {
    if (v === '' || v === null || v === undefined) return '<span class="flat">–</span>';
    var bueno = INVERSAS.indexOf(metrica) !== -1 ? v < 0 : v > 0;
    var cls = Math.abs(v) < 0.0005 ? 'flat' : (bueno ? 'up' : 'down');
    return '<span class="' + cls + '">' + (v > 0 ? '▲ ' : v < 0 ? '▼ ' : '') + NF.p.format(Math.abs(v)) + '</span>';
  }

  function nombreOp(lista, id) { var x = lista.filter(function (o) { return o.id === id; })[0]; return x ? x.nombre : id; }
  function nombresClientes(cfg) {
    var ids = cfg.clientes.length ? cfg.clientes : OP.clientes.map(function (c) { return c.id; });
    return ids.map(function (id) { return nombreOp(OP.clientes, id); });
  }

  function pintarResultado() {
    var cfg = ultimo.cfg, res = ultimo.res, cols = columnas(res, cfg);
    var clientes = nombresClientes(cfg);
    $('resEyebrow').textContent = clientes.length > 3 ? clientes.length + ' clientes' : clientes.join(' · ');
    $('resTitulo').textContent = (cfg.plataformas.length ? cfg.plataformas.join(', ') : 'Todas las fuentes') + '.';
    $('resSub').textContent = nombreOp(OP.periodos, cfg.periodo) + ': ' + res.periodo.inicio + ' al ' + res.periodo.fin +
      (res.comparacion ? ' · comparado con ' + res.comparacion.inicio + ' al ' + res.comparacion.fin : '');
    $('avisos').innerHTML = res.avisos.map(function (a) { return '<div class="aviso">' + esc(a) + '</div>'; }).join('');

    var hayDatos = res.filas.length > 0;
    $('vacio').classList.toggle('hidden', hayDatos);
    ['btnGuardar', 'btnLink', 'btnCsv', 'btnPdf'].forEach(function (b) { $(b).disabled = !hayDatos; });

    pintarKpis(cols, res);
    pintarGrafico(cols, res, cfg);
    pintarTabla(cols, res);
    pintarNarrativas();
  }

  function filaTotales(res) { return res.nDimensiones ? res.total : res.filas[0]; }

  function pintarKpis(cols, res) {
    var fila = filaTotales(res);
    if (!fila || !fila.length) { $('kpis').innerHTML = ''; return; }
    $('kpis').innerHTML = cols.filter(function (c) { return c.rol === 'act'; }).slice(0, 8).map(function (c) {
      var vacio = fila[c.i] === '' || fila[c.i] === null || fila[c.i] === undefined;
      var extra = vacio ? '<div class="k-delta k-prev">No se suma entre plataformas o monedas: mira la tabla.</div>'
        : (res.comparacion ? '<div class="k-delta">' + delta(fila[c.i + 2], c.metrica) + ' <span class="k-prev">vs ' + fmt(fila[c.i + 1], c.tipo) + '</span></div>' : '');
      return '<div class="kpi"><div class="k-lbl">' + esc(c.nombre) + '</div><div class="k-val">' + fmt(fila[c.i], c.tipo) + '</div>' + extra + '</div>';
    }).join('');
  }

  /* ================= Gráfico ================= */

  var CALCULADAS = function () { return OP.metricasCalc.map(function (m) { return m.id; }); };

  function pintarGrafico(cols, res, cfg) {
    var nd = res.nDimensiones;
    var mets = cols.filter(function (c) { return c.rol === 'act'; });
    if (!nd || !res.filas.length || !window.Chart) { $('chartCard').classList.add('hidden'); return; }
    $('chartCard').classList.remove('hidden');

    var selM = $('chartMetric');
    var previo = aplicarCfg.metricaGrafico || (selM.selectedOptions[0] && selM.selectedOptions[0].dataset.metrica);
    aplicarCfg.metricaGrafico = null;
    selM.innerHTML = mets.map(function (c) { return '<option value="' + c.i + '" data-metrica="' + esc(c.metrica) + '">' + esc(c.nombre) + '</option>'; }).join('');
    var elegida = mets.filter(function (c) { return c.metrica === previo; })[0];
    if (elegida) selM.value = String(elegida.i);
    var col = cols[Number(selM.value)];

    var esTiempo = DIMS_TIEMPO.indexOf(cfg.dimensiones[0]) !== -1;
    var tipo = $('chartTipo').value;
    var noSumable = CALCULADAS().indexOf(col.metrica) !== -1;
    var nota = '';
    if ((tipo === 'dona' || tipo === 'apiladas') && noSumable) {
      nota = 'Las métricas calculadas (CTR, CPC, costos…) no se pueden sumar, así que "' + ($('chartTipo').selectedOptions[0].text) + '" no aplica: se muestra en barras.';
      tipo = 'barras';
    }
    $('chartNote').textContent = nota;

    // Modelo de datos: etiquetas (eje) y series
    var etiquetas, series = [];
    if (esTiempo) {
      etiquetas = Array.from(new Set(res.filas.map(function (f) { return String(f[0]); }))).sort();
      var porSerie = {};
      res.filas.forEach(function (f) {
        var s = nd > 1 ? String(f[1]) : col.nombre;
        if (!porSerie[s]) porSerie[s] = {};
        if (typeof f[col.i] === 'number') porSerie[s][String(f[0])] = (porSerie[s][String(f[0])] || 0) + f[col.i];
      });
      var suma = function (o) { return Object.keys(o).reduce(function (a, k) { return a + o[k]; }, 0); };
      Object.keys(porSerie).filter(function (n) { return Object.keys(porSerie[n]).some(function (k) { return porSerie[n][k]; }); })
        .sort(function (a, b) { return suma(porSerie[b]) - suma(porSerie[a]); }).slice(0, 8)
        .forEach(function (n) { series.push({ nombre: n, datos: etiquetas.map(function (x) { return porSerie[n][x] !== undefined ? porSerie[n][x] : null; }) }); });
    } else {
      var top = res.filas.filter(function (f) { return typeof f[col.i] === 'number'; })
        .sort(function (a, b) { return b[col.i] - a[col.i]; }).slice(0, tipo === 'dona' ? 8 : 12);
      etiquetas = top.map(function (f) { return f.slice(0, nd).join(' · '); });
      series.push({ nombre: col.nombre, datos: top.map(function (f) { return f[col.i]; }) });
    }

    if (tipo === 'auto') tipo = esTiempo ? 'linea' : (etiquetas.length > 6 ? 'barrash' : 'barras');

    var chartType, datasets, opciones = { indexAxis: 'x', apilado: false, relleno: false };
    if (tipo === 'dona') {
      chartType = 'doughnut';
      var valores, labels;
      if (esTiempo) { // en el tiempo: la dona reparte el total de cada serie
        labels = series.map(function (s) { return s.nombre; });
        valores = series.map(function (s) { return s.datos.reduce(function (a, v) { return a + (v || 0); }, 0); });
        if (series.length === 1) { labels = etiquetas; valores = series[0].datos.map(function (v) { return v || 0; }); }
      } else { labels = etiquetas; valores = series[0].datos; }
      etiquetas = labels;
      datasets = [{ label: col.nombre, data: valores, backgroundColor: labels.map(function (_, k) { return COLORES[k % COLORES.length]; }), borderColor: '#fff', borderWidth: 2 }];
    } else {
      var esLinea = tipo === 'linea' || tipo === 'area';
      chartType = esLinea ? 'line' : 'bar';
      opciones.indexAxis = tipo === 'barrash' ? 'y' : 'x';
      opciones.apilado = tipo === 'apiladas';
      opciones.relleno = tipo === 'area';
      datasets = series.map(function (s, k) {
        var color = series.length === 1 && !esLinea ? '#3E128C' : COLORES[k % COLORES.length];
        return {
          label: s.nombre, data: s.datos, borderColor: color,
          backgroundColor: opciones.relleno ? color + '33' : color,
          fill: opciones.relleno ? 'origin' : false,
          tension: .3, pointRadius: esLinea ? (etiquetas.length > 40 ? 0 : 3) : 0, borderWidth: esLinea ? 2.5 : 0,
          borderRadius: esLinea ? 0 : 6, maxBarThickness: 38, spanGaps: true
        };
      });
    }

    $('chartTitle').textContent = col.nombre + (esTiempo ? ' en el tiempo' : ' · top ' + etiquetas.length);
    if (grafico) grafico.destroy();
    var ejeValor = opciones.indexAxis === 'y' ? 'x' : 'y';
    var formato = function (v) { return typeof v === 'number' ? (NF[col.tipo] || NF.r).format(v) : v; };
    var escalas = chartType === 'doughnut' ? {} : {
      x: { stacked: opciones.apilado, grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#645C7C', maxRotation: 0, autoSkip: true } },
      y: { stacked: opciones.apilado, grid: { color: '#F0EEF5' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#645C7C' } }
    };
    if (escalas[ejeValor]) escalas[ejeValor].ticks.callback = function (v) { return formato(v); };
    if (opciones.indexAxis === 'y' && escalas.y) escalas.y.ticks.callback = function (v) { var l = this.getLabelForValue(v); return l.length > 34 ? l.slice(0, 33) + '…' : l; };

    grafico = new Chart($('chart'), {
      type: chartType, data: { labels: etiquetas, datasets: datasets },
      options: {
        maintainAspectRatio: false, indexAxis: opciones.indexAxis, cutout: chartType === 'doughnut' ? '58%' : undefined,
        interaction: { mode: chartType === 'doughnut' ? 'nearest' : 'index', intersect: chartType === 'doughnut' },
        plugins: {
          legend: { display: chartType === 'doughnut' || datasets.length > 1, position: chartType === 'doughnut' ? 'right' : 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 14, font: { family: 'Inter', size: 12 } } },
          tooltip: { callbacks: { label: function (ctx) {
            var v = chartType === 'doughnut' ? ctx.parsed : ctx.parsed[ejeValor];
            var extra = '';
            if (chartType === 'doughnut') { var t = ctx.dataset.data.reduce(function (a, b) { return a + (b || 0); }, 0); if (t) extra = ' (' + NF.p.format(v / t) + ')'; }
            return ' ' + (chartType === 'doughnut' ? ctx.label : ctx.dataset.label) + ': ' + (v === null ? '–' : formato(v)) + extra;
          } } }
        },
        scales: escalas
      }
    });
  }

  /* ================= Tabla ================= */

  function pintarTabla(cols, res) {
    if (!res.filas.length) { $('tableCard').classList.add('hidden'); return; }
    $('tableCard').classList.remove('hidden');
    var filas = res.filas.slice();
    if (orden.col !== null) {
      var c = orden.col;
      filas.sort(function (a, b) {
        var x = a[c], y = b[c];
        if (x === '' || x === null) return 1; if (y === '' || y === null) return -1;
        var r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es');
        return orden.asc ? r : -r;
      });
    }
    var th = cols.map(function (c) {
      var s = orden.col === c.i ? (orden.asc ? '▲' : '▼') : '';
      return '<th data-col="' + c.i + '" class="' + (c.tipo === 't' ? '' : 'num') + '">' + esc(c.nombre) + '<span class="s">' + s + '</span></th>';
    }).join('');
    var celda = function (f, c) {
      return '<td class="' + (c.tipo === 't' ? '' : 'num') + '">' + (c.rol === 'delta' ? delta(f[c.i], c.metrica) : fmt(f[c.i], c.tipo)) + '</td>';
    };
    var cuerpo = filas.map(function (f) { return '<tr>' + cols.map(function (c) { return celda(f, c); }).join('') + '</tr>'; }).join('');
    var total = res.total && res.total.length ? '<tr class="total">' + cols.map(function (c) { return celda(res.total, c); }).join('') + '</tr>' : '';
    $('tabla').innerHTML = '<thead><tr>' + th + '</tr></thead><tbody>' + cuerpo + total + '</tbody>';
    $('nFilas').textContent = filas.length + (filas.length === 1 ? ' fila' : ' filas');
    $('tabla').querySelectorAll('th').forEach(function (h) {
      h.addEventListener('click', function () {
        var c = Number(h.dataset.col);
        orden = { col: c, asc: orden.col === c ? !orden.asc : cols[c].tipo === 't' };
        pintarTabla(cols, res);
      });
    });
  }

  /* ================= Narrativa (análisis escrito) ================= */

  function puedeEditar() { return !!(ultimo && ultimo.res.puedeEditarNarrativa); }

  function pintarNarrativas() {
    var hayDatos = ultimo && ultimo.res.filas.length > 0;
    var nars = (ultimo && ultimo.res.narrativas) || {};
    $('narResumenCard').classList.toggle('hidden', !hayDatos || (!nars.resumen && !puedeEditar()));
    document.querySelectorAll('.nar').forEach(function (el) { pintarNarrativa(el, el.dataset.sec); });
  }

  function pintarNarrativa(el, sec) {
    var n = (ultimo.res.narrativas || {})[sec];
    if (editando[sec] !== undefined) {
      el.innerHTML = '<textarea maxlength="5000" placeholder="Escribe aquí el análisis: qué pasó, por qué y qué recomiendas hacer."></textarea>' +
        '<div class="nar-actions">' +
        '<button class="btn-sm primary" data-a="guardar"><i data-lucide="check"></i>Guardar</button>' +
        '<button class="btn-sm orange" data-a="borrador"><i data-lucide="sparkles"></i>Sugerir borrador con los datos</button>' +
        '<button class="btn-sm" data-a="cancelar">Cancelar</button></div>';
      var ta = el.querySelector('textarea');
      ta.value = editando[sec];
      ta.addEventListener('input', function () { editando[sec] = ta.value; });
      el.querySelector('[data-a=guardar]').addEventListener('click', function () { guardarNarrativa(sec, ta.value); });
      el.querySelector('[data-a=cancelar]').addEventListener('click', function () { delete editando[sec]; pintarNarrativa(el, sec); });
      el.querySelector('[data-a=borrador]').addEventListener('click', function () {
        var b = borrador(sec);
        ta.value = ta.value.trim() ? ta.value.trim() + '\n\n' + b : b;
        editando[sec] = ta.value; ta.focus();
      });
      iconos(); ta.focus();
      return;
    }
    if (n && n.texto) {
      el.innerHTML = '<div class="nar-text"></div><div class="nar-meta"><span></span>' +
        (puedeEditar() ? '<button class="btn-link">Editar</button>' : '') + '</div>';
      el.querySelector('.nar-text').textContent = n.texto; // texto plano: nunca se interpreta como HTML
      el.querySelector('.nar-meta span').textContent = 'Por ' + n.autor + ' · ' + n.actualizado;
      var b = el.querySelector('.btn-link');
      if (b) b.addEventListener('click', function () { editando[sec] = n.texto; pintarNarrativa(el, sec); });
      return;
    }
    if (puedeEditar() && ultimo.res.filas.length) {
      el.innerHTML = '<button class="nar-empty"><i data-lucide="pen-line"></i>' + esc(SECCIONES[sec].vacio) + '</button>';
      el.querySelector('button').addEventListener('click', function () { editando[sec] = ''; pintarNarrativa(el, sec); });
      iconos();
      return;
    }
    el.innerHTML = '';
  }

  function guardarNarrativa(sec, texto) {
    cargando(true);
    api('narrativa_guardar', ultimo.cfg, { seccion: sec, texto: texto }).then(function (r) {
      ultimo.res.narrativas = ultimo.res.narrativas || {};
      if (r.narrativa) ultimo.res.narrativas[sec] = r.narrativa; else delete ultimo.res.narrativas[sec];
      delete editando[sec];
      pintarNarrativas();
      toast(r.narrativa ? 'Análisis guardado. Lo verá cualquiera que abra este cliente y estas fechas.' : 'Análisis borrado.');
    }).catch(function (e) {
      if (e.codigo === 'auth') { mostrarLogin(e.message); return; }
      toast(e.message);
    }).then(function () { cargando(false); });
  }

  /** Borrador automático a partir de los números en pantalla. Es un punto de partida: el equipo lo edita. */
  function borrador(sec) {
    var cfg = ultimo.cfg, res = ultimo.res, cols = columnas(res, cfg), nd = res.nDimensiones;
    var mets = cols.filter(function (c) { return c.rol === 'act'; });
    var tot = filaTotales(res) || [];
    var clientes = nombresClientes(cfg).join(', ');
    var fuentes = cfg.plataformas.length ? cfg.plataformas.join(', ') : 'todas las fuentes';
    var lineas = [];

    if (sec === 'resumen') {
      lineas.push('Resumen de ' + clientes + ' (' + fuentes + ') del ' + res.periodo.inicio + ' al ' + res.periodo.fin + ':');
      var cambios = [];
      mets.forEach(function (c) {
        var v = tot[c.i];
        if (v === '' || v === undefined) return;
        var t = '• ' + c.nombre + ': ' + fmtTxt(v, c.tipo);
        if (res.comparacion) {
          var d = tot[c.i + 2];
          if (typeof d === 'number') {
            t += ' (' + (d >= 0 ? '+' : '−') + NF.p.format(Math.abs(d)) + ' frente al periodo anterior)';
            cambios.push({ nombre: c.nombre, d: d, inversa: INVERSAS.indexOf(c.metrica) !== -1 });
          }
        }
        lineas.push(t);
      });
      if (cambios.length) {
        cambios.sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
        var m = cambios[0];
        var bueno = m.inversa ? m.d < 0 : m.d > 0;
        lineas.push('');
        lineas.push('El cambio más fuerte fue en ' + m.nombre.toLowerCase() + ' (' + (m.d >= 0 ? 'subió ' : 'bajó ') + NF.p.format(Math.abs(m.d)) + '), lo cual es ' + (bueno ? 'una buena señal' : 'un punto de atención') + '.');
      }
      lineas.push('');
      lineas.push('Interpretación: [por qué crees que pasó esto]');
      lineas.push('Próximos pasos: [qué recomiendas hacer]');
    }

    if (sec === 'grafico') {
      var opt = $('chartMetric').selectedOptions[0];
      var col = opt ? cols[Number(opt.value)] : mets[0];
      var conValor = res.filas.filter(function (f) { return typeof f[col.i] === 'number'; });
      if (!conValor.length) return 'Sin datos para ' + col.nombre + '.';
      var max = conValor.reduce(function (a, f) { return f[col.i] > a[col.i] ? f : a; });
      var min = conValor.reduce(function (a, f) { return f[col.i] < a[col.i] ? f : a; });
      var etq = function (f) { return f.slice(0, nd).join(' · '); };
      lineas.push(col.nombre + ': el valor más alto fue ' + fmtTxt(max[col.i], col.tipo) + ' (' + etq(max) + ') y el más bajo ' + fmtTxt(min[col.i], col.tipo) + ' (' + etq(min) + ').');
      if (DIMS_TIEMPO.indexOf(cfg.dimensiones[0]) !== -1 && conValor.length > 3 && CALCULADAS().indexOf(col.metrica) === -1) {
        var mitad = Math.floor(conValor.length / 2);
        var s1 = conValor.slice(0, mitad).reduce(function (a, f) { return a + f[col.i]; }, 0);
        var s2 = conValor.slice(mitad).reduce(function (a, f) { return a + f[col.i]; }, 0);
        if (s1) lineas.push('Comparando la primera mitad del periodo con la segunda, ' + col.nombre.toLowerCase() + ' ' + (s2 >= s1 ? 'creció ' : 'cayó ') + NF.p.format(Math.abs(s2 - s1) / s1) + '.');
      }
      lineas.push('Lectura: [qué explica este comportamiento]');
    }

    if (sec === 'tabla') {
      var c0 = mets[0];
      var tops = res.filas.filter(function (f) { return typeof f[c0.i] === 'number'; }).sort(function (a, b) { return b[c0.i] - a[c0.i]; }).slice(0, 3);
      if (!tops.length) return 'Sin datos para ' + c0.nombre + '.';
      lineas.push('Las filas con más ' + c0.nombre.toLowerCase() + ':');
      tops.forEach(function (f, k) { lineas.push((k + 1) + '. ' + f.slice(0, nd).join(' · ') + ': ' + fmtTxt(f[c0.i], c0.tipo)); });
      lineas.push('Observación: [qué hacer con estas campañas o canales]');
    }
    return lineas.join('\n');
  }


  /* ================= PDF ================= */

  var LIBS_PDF = [
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js'
  ];
  function cargarScript(src) {
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok;
      s.onerror = function () { mal(new Error('No se pudo cargar el generador de PDF. Revisa tu conexión a internet.')); };
      document.head.appendChild(s);
    });
  }
  /** Las librerías de PDF se cargan solo la primera vez que alguien descarga un PDF. */
  function cargarLibsPdf() {
    var listo = function () { return window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable; };
    if (listo()) return Promise.resolve();
    var p = window.jspdf ? Promise.resolve() : cargarScript(LIBS_PDF[0]);
    return p.then(function () { return listo() ? null : cargarScript(LIBS_PDF[1]); });
  }

  function pdf() {
    if (!ultimo || !ultimo.res.filas.length) return;
    $('btnPdf').disabled = true; cargando(true);
    var sinGuardar = Object.keys(editando).some(function (k) { return String(editando[k] || '').trim(); });
    cargarLibsPdf().then(function () {
      construirPdf();
      toast(sinGuardar ? 'PDF descargado. Incluye el análisis que estás escribiendo, pero todavía no está guardado: dale a "Guardar".' : 'PDF descargado.');
    }).catch(function (e) { toast(e.message); })
      .then(function () { $('btnPdf').disabled = false; cargando(false); });
  }

  /** Las fuentes estándar del PDF solo tienen caracteres latinos: se reemplazan los demás. */
  function txtPdf(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/Δ\s?/g, 'Var. ').replace(/▲/g, '+').replace(/▼/g, '-').replace(/[−–—]/g, '-')
      .replace(/→/g, 'a').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, '...')
      .replace(/[  ]/g, ' ').replace(/[\u2022\u25CF]/g, '-').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
  }
  function deltaTxt(v) {
    if (v === '' || v === null || v === undefined) return '-';
    return (v > 0 ? '+' : v < 0 ? '-' : '') + NF.p.format(Math.abs(v));
  }
  function colorDelta(v, metrica) {
    if (typeof v !== 'number' || Math.abs(v) < 0.0005) return [142, 135, 159];
    var bueno = INVERSAS.indexOf(metrica) !== -1 ? v < 0 : v > 0;
    return bueno ? [31, 122, 77] : [179, 38, 30];
  }

  function construirPdf() {
    var jsPDF = window.jspdf.jsPDF;
    var cfg = ultimo.cfg, res = ultimo.res, cols = columnas(res, cfg), nd = res.nDimensiones;
    // En el PDF no se repite la columna "anterior": se deja el valor actual y su variación.
    var colsDim = cols.filter(function (c) { return c.tipo === 't'; });
    var colsMet = cols.filter(function (c) { return c.tipo !== 't' && c.rol !== 'prev'; });
    var apaisado = colsDim.length + colsMet.length > 7;
    var doc = new jsPDF({ orientation: apaisado ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 40, ANCHO = W - 2 * M;
    var C = { v900: [28, 6, 63], v700: [62, 18, 140], v300: [172, 138, 227], v50: [244, 240, 252], o500: [232, 119, 42], o700: [194, 90, 18],
      ink: [21, 16, 31], ink7: [47, 40, 67], ink5: [100, 92, 124], ink4: [142, 135, 159], ink2: [225, 222, 233] };
    var y;
    var clientes = nombresClientes(cfg).join(', ');
    var fuentes = cfg.plataformas.length ? cfg.plataformas.join(', ') : 'Todas las fuentes';
    var ahora = new Intl.DateTimeFormat('es-CO', { timeZone: TZ, dateStyle: 'long', timeStyle: 'short' }).format(new Date());

    function color(fn, c) { doc[fn](c[0], c[1], c[2]); }
    function fuente(f, est, tam, col) { doc.setFont(f, est); doc.setFontSize(tam); color('setTextColor', col); }
    function espacio(alto) { if (y + alto > H - 50) { doc.addPage(); y = M; } }
    function eyebrow(texto, x, yy, col) { fuente('courier', 'bold', 8.5, col || C.v700); doc.text(txtPdf(texto).toUpperCase(), x, yy, { charSpace: 1.2 }); }

    // ---- Encabezado de marca
    color('setFillColor', C.v900); doc.rect(0, 0, W, 62, 'F');
    fuente('times', 'bold', 21, [255, 255, 255]); doc.text('27zero', M, 39);
    var wl = doc.getTextWidth('27zero');
    color('setTextColor', C.o500); doc.text('.', M + wl, 39);
    eyebrow('Reportes', M + wl + 16, 38, C.v300);
    fuente('helvetica', 'normal', 8.5, [217, 210, 234]);
    doc.text(txtPdf('Generado el ' + ahora + (usuario ? ' por ' + (usuario.nombre || usuario.email) : '')), W - M, 38, { align: 'right' });

    // ---- Título
    y = 96;
    eyebrow(clientes, M, y); y += 24;
    fuente('times', 'bold', 22, C.ink);
    var titulo = doc.splitTextToSize(txtPdf(fuentes + '.'), ANCHO);
    doc.text(titulo, M, y); y += titulo.length * 24;
    fuente('helvetica', 'normal', 10, C.ink5);
    doc.text(txtPdf(nombreOp(OP.periodos, cfg.periodo) + ': ' + res.periodo.inicio + ' al ' + res.periodo.fin +
      (res.comparacion ? '  ·  comparado con ' + res.comparacion.inicio + ' al ' + res.comparacion.fin : '')), M, y);
    y += 20;

    // ---- Avisos
    res.avisos.forEach(function (a) {
      var l = doc.splitTextToSize(txtPdf(a), ANCHO - 16);
      espacio(l.length * 12 + 10);
      color('setFillColor', [255, 244, 236]); doc.roundedRect(M, y - 10, ANCHO, l.length * 12 + 8, 4, 4, 'F');
      fuente('helvetica', 'normal', 8.5, C.o700); doc.text(l, M + 8, y); y += l.length * 12 + 6;
    });
    y += 6;

    // ---- KPIs
    var fila = filaTotales(res) || [];
    var kpis = cols.filter(function (c) { return c.rol === 'act'; }).slice(0, apaisado ? 12 : 8);
    var porFila = apaisado ? 6 : 4, gap = 10, kw = (ANCHO - gap * (porFila - 1)) / porFila, kh = 60;
    kpis.forEach(function (c, k) {
      var col = k % porFila;
      if (col === 0) { if (k) y += kh + gap; espacio(kh + 4); }
      var x = M + col * (kw + gap);
      color('setDrawColor', C.ink2); doc.setLineWidth(0.8); doc.roundedRect(x, y, kw, kh, 8, 8, 'S');
      fuente('courier', 'bold', 7, C.ink5);
      doc.text(doc.splitTextToSize(txtPdf(c.nombre).toUpperCase(), kw - 20)[0], x + 10, y + 16);
      var v = fila[c.i], vacio = v === '' || v === null || v === undefined;
      fuente('times', 'bold', 16, C.ink); doc.text(txtPdf(vacio ? '-' : fmtTxt(v, c.tipo)), x + 10, y + 36);
      if (vacio) { fuente('helvetica', 'normal', 6.5, C.ink4); doc.text('No se suma: ver la tabla', x + 10, y + 50); }
      else if (res.comparacion) {
        var d = fila[c.i + 2];
        fuente('helvetica', 'bold', 7.5, colorDelta(d, c.metrica)); doc.text(txtPdf(deltaTxt(d)), x + 10, y + 50);
        var wd = doc.getTextWidth(txtPdf(deltaTxt(d)));
        fuente('helvetica', 'normal', 7.5, C.ink4); doc.text(txtPdf(' vs ' + fmtTxt(fila[c.i + 1], c.tipo)), x + 10 + wd, y + 50);
      }
    });
    if (kpis.length) y += kh + 22;

    // ---- Bloques de texto (narrativa)
    function bloqueTexto(titulo, texto, autor) {
      if (!texto) return;
      var lineas = doc.splitTextToSize(txtPdf(texto), ANCHO - 18);
      espacio(40);
      eyebrow(titulo, M, y); y += 16;
      fuente('helvetica', 'normal', 10, C.ink7);
      lineas.forEach(function (l) {
        if (y + 14 > H - 50) { doc.addPage(); y = M; fuente('helvetica', 'normal', 10, C.ink7); }
        color('setFillColor', C.o500); doc.rect(M, y - 9, 2.5, 13, 'F');
        doc.text(l, M + 12, y); y += 14;
      });
      if (autor) { fuente('helvetica', 'italic', 8, C.ink4); doc.text(txtPdf(autor), M + 12, y + 2); y += 12; }
      y += 12;
    }
    // Lo guardado, más lo que se esté escribiendo en ese momento (aunque todavía no se haya guardado).
    var nars = {};
    Object.keys(res.narrativas || {}).forEach(function (k) { nars[k] = res.narrativas[k]; });
    Object.keys(editando).forEach(function (k) {
      if (String(editando[k] || '').trim()) nars[k] = { texto: editando[k].trim(), autor: 'Borrador sin guardar', actualizado: '' };
    });
    var firma = function (n) { return !n ? '' : (n.actualizado ? 'Por ' + n.autor + ' · ' + n.actualizado : n.autor); };
    if (nars.resumen) bloqueTexto('Análisis del periodo', nars.resumen.texto, firma(nars.resumen));

    // ---- Gráfico (la misma imagen que se ve en pantalla)
    var canvas = $('chart');
    if (!$('chartCard').classList.contains('hidden') && canvas && canvas.width) {
      var fondo = document.createElement('canvas');
      fondo.width = canvas.width; fondo.height = canvas.height;
      var ctx = fondo.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, fondo.width, fondo.height); ctx.drawImage(canvas, 0, 0);
      var gw = ANCHO, gh = gw * canvas.height / canvas.width, maxH = apaisado ? 230 : 260;
      if (gh > maxH) { gw = gw * maxH / gh; gh = maxH; }
      var libre = H - 50 - y - 30; // si queda bastante espacio en la hoja, se achica para no dejarla vacía
      if (gh > libre && libre >= 150) { gw = gw * libre / gh; gh = libre; }
      espacio(gh + 30);
      eyebrow($('chartTitle').textContent, M, y); y += 10;
      doc.addImage(fondo.toDataURL('image/png'), 'PNG', M + (ANCHO - gw) / 2, y, gw, gh);
      y += gh + 18;
      if (nars.grafico) bloqueTexto('Nota del gráfico', nars.grafico.texto, firma(nars.grafico));
    }

    // ---- Tabla
    var cuerpoRaw = res.filas.slice();
    if (orden.col !== null) { // respeta el orden que se eligió en pantalla
      var oc = orden.col;
      cuerpoRaw.sort(function (a, b) {
        var p = a[oc], q = b[oc];
        if (p === '' || p === null) return 1; if (q === '' || q === null) return -1;
        var r = typeof p === 'number' && typeof q === 'number' ? p - q : String(p).localeCompare(String(q), 'es');
        return orden.asc ? r : -r;
      });
    }
    var hayTotal = res.total && res.total.length;
    if (hayTotal) cuerpoRaw.push(res.total);
    var celdaTxt = function (f, c) {
      var v = f[c.i];
      if (c.rol === 'delta') return txtPdf(deltaTxt(v));
      if (v === '' || v === null || v === undefined) return c.tipo === 't' ? '' : '-';
      return txtPdf(fmtTxt(v, c.tipo));
    };
    // Si hay muchas métricas, la tabla se parte en bloques que repiten las dimensiones.
    var porBloque = Math.max(3, (apaisado ? 11 : 7) - colsDim.length);
    var bloques = [];
    for (var b0 = 0; b0 < colsMet.length; b0 += porBloque) bloques.push(colsMet.slice(b0, b0 + porBloque));
    if (!bloques.length) bloques.push([]);
    bloques.forEach(function (bloque, nb) {
      var colsT = colsDim.concat(bloque);
      espacio(70);
      eyebrow('Tabla · ' + res.filas.length + (res.filas.length === 1 ? ' fila' : ' filas') +
        (bloques.length > 1 ? ' · parte ' + (nb + 1) + ' de ' + bloques.length : ''), M, y);
      y += 8;
      var estilosCol = {};
      colsT.forEach(function (c, k) { if (c.tipo !== 't') estilosCol[k] = { halign: 'right' }; });
      doc.autoTable({
        startY: y,
        margin: { left: M, right: M, bottom: 50 },
        head: [colsT.map(function (c) { return txtPdf(c.nombre); })],
        body: cuerpoRaw.map(function (f) { return colsT.map(function (c) { return celdaTxt(f, c); }); }),
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, textColor: C.ink, lineColor: C.ink2, lineWidth: 0.4, overflow: 'linebreak' },
        headStyles: { fillColor: C.v700, textColor: [255, 255, 255], fontStyle: 'bold', valign: 'bottom' },
        columnStyles: estilosCol,
        rowPageBreak: 'avoid',
        didParseCell: function (data) {
          if (data.section !== 'body') return;
          var esTotal = hayTotal && data.row.index === cuerpoRaw.length - 1;
          if (esTotal) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fillColor = C.v50; }
          var c = colsT[data.column.index];
          if (c && c.rol === 'delta') data.cell.styles.textColor = colorDelta(cuerpoRaw[data.row.index][c.i], c.metrica);
        }
      });
      y = doc.lastAutoTable.finalY + 20;
    });
    if (nars.tabla) bloqueTexto('Nota de la tabla', nars.tabla.texto, firma(nars.tabla));

    // ---- Pie de página en todas las hojas
    var total = doc.internal.getNumberOfPages();
    for (var pg = 1; pg <= total; pg++) {
      doc.setPage(pg);
      color('setDrawColor', C.ink2); doc.setLineWidth(0.6); doc.line(M, H - 32, W - M, H - 32);
      fuente('helvetica', 'normal', 7.5, C.ink4);
      doc.text(txtPdf('27zero · Reportes  ·  ' + clientes + '  ·  ' + res.periodo.inicio + ' al ' + res.periodo.fin), M, H - 20);
      doc.text('Página ' + pg + ' de ' + total, W - M, H - 20, { align: 'right' });
    }

    var slug = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase(); };
    doc.save('27zero_' + slug(clientes) + '_' + res.periodo.inicio + '_' + res.periodo.fin + '.pdf');
  }

  /* ================= Exportar, enlace, guardados ================= */

  function csv() {
    var res = ultimo.res;
    var filas = [res.encabezado].concat(res.filas);
    if (res.total && res.total.length) filas.push(res.total);
    var txt = filas.map(function (f) {
      return f.map(function (v) {
        var s = v === null || v === undefined ? '' : (typeof v === 'number' ? String(Math.round(v * 10000) / 10000) : String(v));
        return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\n');
    var blob = new Blob(['﻿' + txt], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '27zero_' + res.periodo.inicio + '_' + res.periodo.fin + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function codificar(cfg) { return btoa(unescape(encodeURIComponent(JSON.stringify(cfg)))); }
  function escribirHash(cfg) { history.replaceState(null, '', '#q=' + codificar(cfg)); }
  function leerHash() {
    var m = location.hash.match(/#q=([^&]+)/);
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch (e) { return null; }
  }

  function copiarEnlace() {
    var url = location.href.split('#')[0] + '#q=' + codificar(cfgActual());
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
      toast('Enlace copiado. Quien lo abra necesita acceso a estos datos.');
    }).catch(function () { window.prompt('Copia este enlace:', url); });
  }

  function claveGuardados() { return 'z27_reportes_' + (usuario ? usuario.email : 'anon'); }

  function guardar() {
    var nombre = window.prompt('Nombre del reporte:');
    if (!nombre) return;
    var lista = leerLocal(claveGuardados(), []).filter(function (r) { return r.nombre !== nombre; });
    lista.unshift({ nombre: nombre.slice(0, 60), cfg: cfgActual() });
    guardarLocal(claveGuardados(), lista.slice(0, 30));
    pintarGuardados();
    toast('Reporte guardado en este navegador.');
  }

  function pintarGuardados() {
    var lista = leerLocal(claveGuardados(), []);
    var el = $('guardados');
    if (!lista.length) { el.innerHTML = '<div class="hint">Guarda una consulta para volver a ella con un clic.</div>'; return; }
    el.innerHTML = '';
    lista.forEach(function (r, i) {
      var d = document.createElement('div'); d.className = 'guardado';
      d.innerHTML = '<span></span><button title="Eliminar"><i data-lucide="x"></i></button>';
      d.querySelector('span').textContent = r.nombre;
      d.querySelector('span').addEventListener('click', function () { aplicarCfg(r.cfg); consultar(); });
      d.querySelector('button').addEventListener('click', function () {
        lista.splice(i, 1); guardarLocal(claveGuardados(), lista); pintarGuardados();
      });
      el.appendChild(d);
    });
    iconos();
  }

  /* ================= Eventos ================= */

  function eventos() {
    $('btnConsultar').addEventListener('click', consultar);
    $('btnSalir').addEventListener('click', salir);
    $('btnCsv').addEventListener('click', csv);
    $('btnPdf').addEventListener('click', pdf);
    $('btnLink').addEventListener('click', copiarEnlace);
    $('btnGuardar').addEventListener('click', guardar);
    $('cliente').addEventListener('change', alCambiarCliente);
    $('periodo').addEventListener('change', alCambiarPeriodo);
    $('desde').addEventListener('change', alCambiarFecha);
    $('hasta').addEventListener('change', alCambiarFecha);
    $('comparar').addEventListener('change', refrescarSiHayResultado);
    var repintarGrafico = function () {
      if (!ultimo) return;
      pintarGrafico(columnas(ultimo.res, ultimo.cfg), ultimo.res, ultimo.cfg);
      ultimo.cfg = Object.assign({}, ultimo.cfg, { grafico: cfgActual().grafico });
      escribirHash(ultimo.cfg);
    };
    $('chartMetric').addEventListener('change', repintarGrafico);
    $('chartTipo').addEventListener('change', repintarGrafico);
    document.querySelectorAll('[data-plantilla]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = PLANTILLAS[b.dataset.plantilla];
        var dims = p.dim.slice();
        if ($('cliente').value === TODOS && dims.indexOf('cliente') === -1) dims.splice(DIMS_TIEMPO.indexOf(dims[0]) !== -1 ? 1 : 0, 0, 'cliente');
        aplicarCfg({ clientes: clientesSeleccionados(), plataformas: p.pla, periodo: p.periodo, comparar: p.comparar || 'ninguno', dimensiones: dims, metricas: p.met, filtroCampana: p.filtro || '', grafico: { tipo: $('chartTipo').value } });
        consultar();
      });
    });
    document.querySelectorAll('[data-todos]').forEach(function (a) {
      a.addEventListener('click', function () {
        sel.pla = sel.pla.length === OP.plataformas.length ? [] : OP.plataformas.slice();
        pintarChips();
      });
    });
    document.querySelectorAll('[data-limpiar]').forEach(function (a) {
      a.addEventListener('click', function () { sel[a.dataset.limpiar] = []; pintarChips(); });
    });
  }

  /* ================= Inicio ================= */

  document.addEventListener('DOMContentLoaded', function () {
    eventos(); iconos();
    if (DEMO) { arrancar(); return; }
    try { token = sessionStorage.getItem('z27_token'); } catch (e) { token = null; }
    if (tokenVigente(token)) arrancar(); else mostrarLogin();
  });
})();
