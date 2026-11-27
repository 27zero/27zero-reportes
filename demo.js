/* 27zero Reportes — modo demo. ARCHIVO GENERADO por build_demo.py: no editar a mano. */
(function () {
  'use strict';
  if (!(window.APP_CONFIG && window.APP_CONFIG.DEMO)) return;

  /* ---------- Equivalentes mínimos de los servicios de Apps Script ---------- */
  var OFFSET_BOGOTA_ = -5 * 3600000; // Colombia no tiene horario de verano
  var Utilities = {
    formatDate: function (d, tz, f) {
      var o = new Date(d.getTime() + (tz === 'UTC' ? 0 : OFFSET_BOGOTA_));
      var p = function (n) { return (n < 10 ? '0' : '') + n; };
      var s = o.getUTCFullYear() + '-' + p(o.getUTCMonth() + 1) + '-' + p(o.getUTCDate());
      if (f.indexOf('HH') !== -1) s += ' ' + p(o.getUTCHours()) + ':' + p(o.getUTCMinutes());
      return s;
    }
  };
  var SpreadsheetApp = { getActive: function () { return { getSpreadsheetTimeZone: function () { return 'America/Bogota'; }, getSheetByName: function () { return null; } }; } };
  function log_() {}

  /* ===== 00_Config.gs ===== */
/**
 * ============================================================
 *  27zero · Piloto de datos de marketing en Google Sheets
 *  00_Config.gs — nombres de hojas, columnas, menú y credenciales
 * ============================================================
 *
 *  Fuentes: GA4, Google Ads (script aparte en Google Ads),
 *           LinkedIn Ads, LinkedIn página (orgánico), HubSpot.
 *
 *  Las credenciales NUNCA se escriben en la hoja: se guardan en
 *  las Propiedades del script (menú 27zero Datos › Credenciales).
 */

var HOJAS = {
  CLIENTES: 'config_clientes',
  GENERAL: 'config_general',
  GA4: 'raw_ga4',
  GA4_PAGINAS: 'raw_ga4_paginas',
  GADS: 'raw_google_ads',
  LI_ADS: 'raw_linkedin_ads',
  LI_ORG: 'raw_linkedin_org',
  HUBSPOT: 'raw_hubspot',
  UNIFICADO: 'datos_unificados',
  LOG: 'log'
};

var ENCABEZADOS = {
  config_clientes: ['cliente_id', 'cliente_nombre', 'activo', 'ga4_property_id', 'gads_customer_id',
    'li_ad_account_id', 'li_org_id', 'hubspot_activo', 'notas'],
  config_general: ['parametro', 'valor', 'descripcion'],
  raw_ga4: ['fecha', 'cliente_id', 'canal', 'fuente_medio', 'campana', 'sesiones', 'usuarios',
    'usuarios_nuevos', 'sesiones_comprometidas', 'eventos_clave', 'ingresos', 'actualizado',
    'usuarios_activos', 'vistas', 'tiempo_interaccion_seg'],
  raw_ga4_paginas: ['fecha', 'cliente_id', 'pagina', 'vistas', 'usuarios_activos', 'tiempo_interaccion_seg', 'actualizado'],
  raw_google_ads: ['fecha', 'cliente_id', 'cuenta_id', 'campana_id', 'campana', 'tipo_campana', 'moneda',
    'impresiones', 'clics', 'inversion', 'conversiones', 'valor_conversiones', 'actualizado'],
  raw_linkedin_ads: ['fecha', 'cliente_id', 'cuenta_id', 'campana_id', 'campana', 'moneda', 'impresiones',
    'clics', 'clics_landing', 'inversion', 'conversiones', 'leads', 'interacciones', 'actualizado'],
  raw_linkedin_org: ['fecha', 'cliente_id', 'org_id', 'impresiones', 'impresiones_unicas', 'clics',
    'reacciones', 'comentarios', 'compartidos', 'tasa_interaccion', 'seguidores_organicos_nuevos',
    'seguidores_pagados_nuevos', 'actualizado'],
  raw_hubspot: ['fecha', 'cliente_id', 'metrica', 'fuente', 'cantidad', 'valor', 'actualizado'],
  datos_unificados: ['fecha', 'cliente_id', 'cliente', 'plataforma', 'categoria', 'canal', 'campana', 'moneda',
    'impresiones', 'clics', 'inversion', 'conversiones', 'valor_conversiones', 'sesiones', 'usuarios',
    'leads', 'negocios_creados', 'negocios_ganados', 'valor_negocios', 'seguidores_nuevos', 'interacciones',
    'fuente_medio', 'pagina', 'usuarios_activos', 'vistas', 'sesiones_comprometidas', 'tiempo_interaccion_seg'],
  log: ['momento', 'fuente', 'cliente_id', 'estado', 'filas', 'mensaje'],
  usuarios: ['email', 'nombre', 'rol', 'clientes', 'activo'],
  narrativas: ['clave', 'seccion', 'clientes', 'desde', 'hasta', 'texto', 'autor', 'actualizado']
};

var PARAMETROS_DEFECTO = [
  ['dias_ventana', 7, 'Días hacia atrás que se re-descargan en cada actualización diaria (corrige conversiones tardías).'],
  ['dias_historico', 90, 'Días hacia atrás para la carga histórica (una sola vez). LinkedIn guarda datos diarios solo ~6 meses.'],
  ['linkedin_version', '202611', 'Versión de la API de LinkedIn (formato AAAAMM). Actualizar cuando LinkedIn retire la versión.'],
  ['hubspot_version', '2026-03', 'Versión de la API de HubSpot (formato AAAA-MM).'],
  ['hubspot_propiedad_fuente', 'hs_analytics_source', 'Propiedad de HubSpot que define la fuente del contacto/negocio.'],
  ['web_client_id', '', 'ID de cliente OAuth (Google Cloud) del portal web 27zero Reportes. Termina en .apps.googleusercontent.com'],
  ['narrativa_clientes_editan', 'NO', 'SI = los usuarios con rol cliente también pueden escribir el análisis en el portal. NO = solo lo leen.']
];

/* ---------------- Menú ---------------- */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('27zero Datos')
    .addItem('Abrir consultas', 'abrirConsultas')
    .addSeparator()
    .addItem('Preparar hojas (primera vez)', 'prepararHojas')
    .addSeparator()
    .addItem('Actualizar GA4', 'actualizarGA4')
    .addItem('Actualizar LinkedIn Ads', 'actualizarLinkedInAds')
    .addItem('Actualizar LinkedIn página', 'actualizarLinkedInOrganico')
    .addItem('Actualizar HubSpot', 'actualizarHubSpot')
    .addItem('Reconstruir datos_unificados', 'construirUnificado')
    .addSeparator()
    .addSubMenu(ui.createMenu('Carga histórica')
      .addItem('GA4', 'historicoGA4')
      .addItem('LinkedIn Ads', 'historicoLinkedInAds')
      .addItem('LinkedIn página', 'historicoLinkedInOrganico')
      .addItem('HubSpot', 'historicoHubSpot'))
    .addSubMenu(ui.createMenu('Credenciales')
      .addItem('LinkedIn Ads', 'credencialesLinkedInAds')
      .addItem('LinkedIn página', 'credencialesLinkedInOrganico')
      .addItem('HubSpot (por cliente)', 'credencialHubSpot')
      .addItem('Ver estado', 'verEstadoCredenciales'))
    .addSubMenu(ui.createMenu('Programación')
      .addItem('Activar actualización diaria', 'instalarProgramacion')
      .addItem('Desactivar actualización diaria', 'quitarProgramacion'))
    .addToUi();
}

/* ---------------- Preparación de hojas ---------------- */

function prepararHojas() {
  Object.keys(ENCABEZADOS).forEach(function (nombre) { hoja_(nombre); });
  var sh = hoja_(HOJAS.GENERAL);
  var existentes = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
  PARAMETROS_DEFECTO.forEach(function (p) {
    if (existentes.indexOf(p[0]) === -1) sh.appendRow(p);
  });
  SpreadsheetApp.getActive().toast('Hojas listas. Completa config_clientes y las credenciales.', '27zero Datos', 8);
}

/* ---------------- Parámetros y clientes ---------------- */

var CACHE_PARAMS_ = null;

function getParam_(nombre) {
  if (!CACHE_PARAMS_) {
    CACHE_PARAMS_ = {};
    PARAMETROS_DEFECTO.forEach(function (p) { CACHE_PARAMS_[p[0]] = p[1]; });
    var sh = SpreadsheetApp.getActive().getSheetByName(HOJAS.GENERAL);
    if (sh && sh.getLastRow() > 1) {
      sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
        if (r[0] !== '' && r[1] !== '') CACHE_PARAMS_[String(r[0]).trim()] = r[1];
      });
    }
  }
  return CACHE_PARAMS_[nombre];
}

function esSi_(v) {
  if (v === true) return true;
  return ['SI', 'SÍ', 'YES', 'TRUE', '1', 'X'].indexOf(String(v).trim().toUpperCase()) !== -1;
}

function getClientes_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJAS.CLIENTES);
  if (!sh || sh.getLastRow() < 2) return [];
  var datos = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  var enc = datos.shift().map(function (h) { return String(h).trim(); });
  return datos.map(function (fila) {
    var o = {};
    enc.forEach(function (h, i) { o[h] = (fila[i] === null || fila[i] === undefined) ? '' : String(fila[i]).trim(); });
    return o;
  }).filter(function (c) { return c.cliente_id && esSi_(c.activo); });
}

/* ---------------- Credenciales ---------------- */

function credencialesLinkedInAds() { pedirCredencialesLinkedIn_('LI_ADS', 'LinkedIn Ads'); }
function credencialesLinkedInOrganico() { pedirCredencialesLinkedIn_('LI_ORG', 'LinkedIn página'); }

function pedirCredencialesLinkedIn_(prefijo, nombre) {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var campos = [
    ['ACCESS_TOKEN', 'Access token (obligatorio).'],
    ['REFRESH_TOKEN', 'Refresh token (opcional; solo si tu app de LinkedIn los tiene habilitados).'],
    ['CLIENT_ID', 'Client ID de la app (opcional; necesario para renovar el token solo).'],
    ['CLIENT_SECRET', 'Client Secret de la app (opcional; necesario para renovar el token solo).']
  ];
  for (var i = 0; i < campos.length; i++) {
    var r = ui.prompt(nombre + ' · ' + campos[i][0], campos[i][1] + '\n\nDeja vacío para conservar el valor actual.', ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) return;
    var v = r.getResponseText().trim();
    if (v) {
      props.setProperty(prefijo + '_' + campos[i][0], v);
      if (campos[i][0] === 'ACCESS_TOKEN') props.setProperty(prefijo + '_TOKEN_FECHA', String(Date.now()));
    }
  }
  ui.alert('Credenciales de ' + nombre + ' guardadas.');
}

function credencialHubSpot() {
  var ui = SpreadsheetApp.getUi();
  var r1 = ui.prompt('HubSpot', 'Escribe el cliente_id (tal como está en config_clientes):', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var cid = r1.getResponseText().trim();
  if (!cid) return;
  var r2 = ui.prompt('HubSpot · ' + cid, 'Pega la Service Key del portal de HubSpot de este cliente\n(permisos de lectura: contactos y negocios).', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  var key = r2.getResponseText().trim();
  if (!key) return;
  PropertiesService.getScriptProperties().setProperty('HUBSPOT_KEY_' + cid, key);
  ui.alert('Service Key de HubSpot guardada para ' + cid + '.');
}

function verEstadoCredenciales() {
  var p = PropertiesService.getScriptProperties().getProperties();
  var lineas = [];
  [['LI_ADS', 'LinkedIn Ads'], ['LI_ORG', 'LinkedIn página']].forEach(function (x) {
    if (!p[x[0] + '_ACCESS_TOKEN']) { lineas.push(x[1] + ': SIN TOKEN'); return; }
    var edad = p[x[0] + '_TOKEN_FECHA'] ? Math.floor((Date.now() - Number(p[x[0] + '_TOKEN_FECHA'])) / 86400000) : '?';
    var auto = (p[x[0] + '_REFRESH_TOKEN'] && p[x[0] + '_CLIENT_ID'] && p[x[0] + '_CLIENT_SECRET']) ? 'se renueva solo' : 'renovación manual (vence a los 60 días)';
    lineas.push(x[1] + ': token cargado hace ' + edad + ' días · ' + auto);
  });
  var hs = Object.keys(p).filter(function (k) { return k.indexOf('HUBSPOT_KEY_') === 0; })
    .map(function (k) { return k.replace('HUBSPOT_KEY_', ''); });
  lineas.push('HubSpot: ' + (hs.length ? 'clientes con llave → ' + hs.join(', ') : 'ninguna llave cargada'));
  SpreadsheetApp.getUi().alert('Estado de credenciales\n\n' + lineas.join('\n'));
}

/* ---------------- Programación diaria ---------------- */

var TAREAS_DIARIAS_ = [
  ['actualizarGA4', 5],
  ['actualizarLinkedInAds', 6],
  ['actualizarLinkedInOrganico', 7],
  ['actualizarHubSpot', 8],
  ['construirUnificado', 9]
];

function instalarProgramacion() {
  quitarProgramacion(true);
  TAREAS_DIARIAS_.forEach(function (t) {
    ScriptApp.newTrigger(t[0]).timeBased().everyDays(1).atHour(t[1]).create();
  });
  SpreadsheetApp.getActive().toast('Actualización diaria activada (5:00–9:00 a. m., zona horaria de la hoja).', '27zero Datos', 8);
}

function quitarProgramacion(silencioso) {
  var nombres = TAREAS_DIARIAS_.map(function (t) { return t[0]; });
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (nombres.indexOf(tr.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(tr);
  });
  if (silencioso !== true) SpreadsheetApp.getActive().toast('Actualización diaria desactivada.', '27zero Datos', 5);
}

  /* ===== 01_Utilidades.gs ===== */
/**
 * 01_Utilidades.gs — fechas, escritura en hojas, log y llamadas HTTP
 */

var DIA_MS_ = 86400000;
var LIMITE_TIEMPO_MS_ = 4.5 * 60 * 1000; // Apps Script corta a los 6 min; dejamos margen

function tz_() { return SpreadsheetApp.getActive().getSpreadsheetTimeZone(); }

/** Devuelve la hoja; si no existe la crea con sus encabezados. */
function hoja_(nombre) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(nombre);
  if (!sh) sh = ss.insertSheet(nombre);
  var enc = ENCABEZADOS[nombre];
  if (enc && sh.getLastRow() > 0) {
    // Hojas que ya existían: si se agregaron columnas nuevas, se amplía la hoja y se actualiza el encabezado.
    if (sh.getMaxColumns() < enc.length) sh.insertColumnsAfter(sh.getMaxColumns(), enc.length - sh.getMaxColumns());
    var actual = sh.getRange(1, 1, 1, enc.length).getValues()[0];
    if (actual.join('|') !== enc.join('|')) sh.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold').setBackground('#EDEDED');
  }
  if (enc && sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold').setBackground('#EDEDED');
    sh.setFrozenRows(1);
    if (enc[0] === 'fecha') sh.getRange('A:A').setNumberFormat('yyyy-mm-dd');
  }
  return sh;
}

/* ---------------- Fechas ---------------- */

function isoUTC_(ms) { return Utilities.formatDate(new Date(ms), 'UTC', 'yyyy-MM-dd'); }

function construirRango_(iniUTC, finUTC) {
  var a = new Date(iniUTC), b = new Date(finUTC);
  return {
    inicio: isoUTC_(iniUTC), fin: isoUTC_(finUTC),
    inicioMs: iniUTC, finMs: finUTC,
    inicioPartes: { y: a.getUTCFullYear(), m: a.getUTCMonth() + 1, d: a.getUTCDate() },
    finPartes: { y: b.getUTCFullYear(), m: b.getUTCMonth() + 1, d: b.getUTCDate() }
  };
}

/** Rango que termina AYER (zona horaria de la hoja) y cubre `dias` días. */
function rangoFechas_(dias) {
  dias = Math.max(1, Number(dias) || 7);
  var hoy = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd').split('-').map(Number);
  var finUTC = Date.UTC(hoy[0], hoy[1] - 1, hoy[2]) - DIA_MS_;
  var iniUTC = finUTC - (dias - 1) * DIA_MS_;
  return construirRango_(iniUTC, finUTC);
}

/** Parte un rango en tramos de `tam` días. */
function partirRango_(r, tam) {
  var tramos = [];
  for (var ini = r.inicioMs; ini <= r.finMs; ini += tam * DIA_MS_) {
    tramos.push(construirRango_(ini, Math.min(ini + (tam - 1) * DIA_MS_, r.finMs)));
  }
  return tramos;
}

/** Medianoche local (zona de la hoja) de una fecha 'yyyy-MM-dd', en ms. */
function msLocal_(fecha) {
  return Utilities.parseDate(fecha + ' 00:00:00', tz_(), 'yyyy-MM-dd HH:mm:ss').getTime();
}

/** Normaliza una celda de fecha (Date o texto) a 'yyyy-MM-dd'. */
function fechaClave_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  return String(v).slice(0, 10);
}

function num_(v) {
  if (v === null || v === undefined || v === '') return 0;
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function pad2_(n) { return (n < 10 ? '0' : '') + n; }

/* ---------------- Escritura ---------------- */

/**
 * Reemplaza en `nombreHoja` las filas de un cliente dentro de [inicio, fin]
 * por `filas` nuevas. Así re-descargar una ventana nunca duplica datos.
 * Columnas fijas: A = fecha, B = cliente_id.
 */
function escribirVentana_(nombreHoja, clienteId, inicio, fin, filas) {
  var lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    var sh = hoja_(nombreHoja);
    var n = ENCABEZADOS[nombreHoja].length;
    var ultima = sh.getLastRow();
    var existentes = ultima > 1 ? sh.getRange(2, 1, ultima - 1, n).getValues() : [];
    var cid = String(clienteId);
    var conservar = existentes.filter(function (r) {
      var f = fechaClave_(r[0]);
      return !(String(r[1]) === cid && f >= inicio && f <= fin);
    });
    // Evita que un texto como "=algo" o "+marca" se interprete como fórmula o número.
    filas = filas.map(function (r) {
      return r.map(function (v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; });
    });
    var todas = conservar.concat(filas);
    todas.sort(function (a, b) {
      var fa = fechaClave_(a[0]), fb = fechaClave_(b[0]);
      if (fa !== fb) return fa < fb ? -1 : 1;
      return String(a[1]).localeCompare(String(b[1]));
    });
    if (ultima > 1) sh.getRange(2, 1, ultima - 1, n).clearContent();
    if (todas.length) sh.getRange(2, 1, todas.length, n).setValues(todas);
    SpreadsheetApp.flush();
    return filas.length;
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- Log ---------------- */

function log_(fuente, clienteId, estado, filas, mensaje) {
  var sh = hoja_(HOJAS.LOG);
  sh.appendRow([new Date(), fuente, clienteId || '', estado, filas || 0, String(mensaje || '').slice(0, 500)]);
  if (sh.getLastRow() > 3000) sh.deleteRows(2, 1000);
}

/* ---------------- Ejecución por cliente ---------------- */

/**
 * Recorre los clientes activos que cumplen `filtro` y ejecuta `fn(cliente)`.
 * Un error en un cliente no detiene a los demás; todo queda en la hoja log.
 */
function ejecutarPorCliente_(fuente, filtro, fn) {
  var t0 = Date.now();
  var clientes;
  try {
    clientes = getClientes_().filter(filtro);
  } catch (e) {
    log_(fuente, '', 'ERROR', 0, e.message);
    return;
  }
  if (!clientes.length) { log_(fuente, '', 'SIN CLIENTES', 0, 'Ningún cliente activo tiene configurada esta fuente.'); return; }
  for (var i = 0; i < clientes.length; i++) {
    var c = clientes[i];
    if (Date.now() - t0 > LIMITE_TIEMPO_MS_) {
      log_(fuente, c.cliente_id, 'PENDIENTE', 0, 'Se acabó el tiempo de ejecución; quedaron clientes sin procesar. Vuelve a ejecutar.');
      break;
    }
    try {
      var filas = fn(c);
      log_(fuente, c.cliente_id, 'OK', filas, '');
    } catch (e) {
      log_(fuente, c.cliente_id, 'ERROR', 0, e.message);
    }
  }
}

function tieneValor_(campo) {
  return function (c) { return c[campo] && String(c[campo]).trim() !== ''; };
}

/* ---------------- HTTP ---------------- */

/** GET/POST con reintentos para 429 y errores 5xx. Devuelve JSON. */
function fetchJson_(url, opciones) {
  opciones = opciones || {};
  opciones.muteHttpExceptions = true;
  var intentos = 0;
  while (true) {
    var resp = UrlFetchApp.fetch(url, opciones);
    var code = resp.getResponseCode();
    if (code >= 200 && code < 300) {
      var txt = resp.getContentText();
      return txt ? JSON.parse(txt) : {};
    }
    if ((code === 429 || code >= 500) && intentos < 3) {
      intentos++;
      Utilities.sleep(2000 * intentos);
      continue;
    }
    throw new Error('HTTP ' + code + ' en ' + url.split('?')[0] + ': ' + resp.getContentText().slice(0, 300));
  }
}

  /* ===== 07_Consultas.gs ===== */
/**
 * 07_Consultas.gs — Constructor de consultas tipo Supermetrics
 *
 * Panel lateral (Consultas.html) donde se elige cliente, plataformas, fechas,
 * dimensiones y métricas. El resultado se escribe en una pestaña nueva.
 * Las consultas guardadas se vuelven a calcular solas cada día
 * (al final de construirUnificado), con las fechas relativas actualizadas.
 */

var HOJA_CONSULTAS_ = '_consultas';
var PLATAFORMA_PAGINAS_ = 'Google Analytics · Páginas';

var DIMENSIONES_ = {
  fecha:      { nombre: 'Fecha',          fn: function (r) { return r.fecha; } },
  semana:     { nombre: 'Semana (lunes)', fn: function (r) { return lunes_(r.fecha); } },
  mes:        { nombre: 'Mes',            fn: function (r) { return r.fecha.slice(0, 7); } },
  cliente:    { nombre: 'Cliente',        fn: function (r) { return r.cliente; } },
  plataforma: { nombre: 'Plataforma',     fn: function (r) { return r.plataforma; } },
  categoria:  { nombre: 'Categoría',      fn: function (r) { return r.categoria; } },
  canal:      { nombre: 'Canal',          fn: function (r) { return r.canal || '(sin canal)'; } },
  campana:    { nombre: 'Campaña',        fn: function (r) { return r.campana || '(sin campaña)'; } },
  fuente_medio: { nombre: 'Fuente / medio', fn: function (r) { return r.fuente_medio || '(sin dato)'; } },
  pagina:     { nombre: 'Página',         fn: function (r) { return r.pagina || '(sin página)'; } },
  moneda:     { nombre: 'Moneda',         fn: function (r) { return r.moneda || '—'; } }
};
var DIMS_TIEMPO_ = ['fecha', 'semana', 'mes'];

// tipo: n = número entero, d = dinero, p = porcentaje, r = razón
var METRICAS_BASE_ = {
  impresiones:        { nombre: 'Impresiones',       tipo: 'n' },
  clics:              { nombre: 'Clics',             tipo: 'n' },
  inversion:          { nombre: 'Inversión',         tipo: 'd' },
  conversiones:       { nombre: 'Conversiones',      tipo: 'r' },
  valor_conversiones: { nombre: 'Valor conversiones', tipo: 'd' },
  sesiones:           { nombre: 'Sesiones',          tipo: 'n' },
  usuarios:           { nombre: 'Usuarios',          tipo: 'n' },
  leads:              { nombre: 'Leads',             tipo: 'n' },
  negocios_creados:   { nombre: 'Negocios creados',  tipo: 'n' },
  negocios_ganados:   { nombre: 'Negocios ganados',  tipo: 'n' },
  valor_negocios:     { nombre: 'Valor negocios',    tipo: 'd' },
  seguidores_nuevos:  { nombre: 'Seguidores nuevos', tipo: 'n' },
  interacciones:      { nombre: 'Interacciones',     tipo: 'n' },
  usuarios_activos:   { nombre: 'Usuarios activos',  tipo: 'n' },
  vistas:             { nombre: 'Vistas',            tipo: 'n' },
  sesiones_comprometidas: { nombre: 'Sesiones con interacción', tipo: 'n' },
  tiempo_interaccion_seg: { nombre: 'Tiempo de interacción total (seg)', tipo: 'n' }
};

var METRICAS_CALC_ = {
  ctr:              { nombre: 'CTR',               tipo: 'p', fn: function (s) { return div_(s.clics, s.impresiones); } },
  cpc:              { nombre: 'CPC',               tipo: 'd', fn: function (s) { return costo_(s.inversion, s.clics); } },
  cpm:              { nombre: 'CPM',               tipo: 'd', fn: function (s) { var v = costo_(s.inversion, s.impresiones); return v === '' ? '' : v * 1000; } },
  tasa_conversion:  { nombre: 'Tasa de conversión', tipo: 'p', fn: function (s) { return div_(s.conversiones, s.clics); } },
  cpa:              { nombre: 'Costo por conversión', tipo: 'd', fn: function (s) { return costo_(s.inversion, s.conversiones); } },
  cpl:              { nombre: 'Costo por lead',    tipo: 'd', fn: function (s) { return costo_(s.inversion, s.leads); } },
  roas:             { nombre: 'ROAS',              tipo: 'r', fn: function (s) { return div_(s.valor_conversiones, s.inversion); } },
  costo_por_negocio:{ nombre: 'Costo por negocio ganado', tipo: 'd', fn: function (s) { return costo_(s.inversion, s.negocios_ganados); } },
  tasa_interaccion: { nombre: 'Tasa de interacción', tipo: 'p', fn: function (s) { return div_(s.interacciones, s.impresiones); } },
  tasa_rebote:      { nombre: 'Tasa de rebote',     tipo: 'p', fn: function (s) { var v = div_(s.sesiones_comprometidas, s.sesiones); return v === '' ? '' : 1 - v; } },
  tasa_participacion: { nombre: 'Tasa de participación (web)', tipo: 'p', fn: function (s) { return div_(s.sesiones_comprometidas, s.sesiones); } },
  tiempo_prom_sesion: { nombre: 'Tiempo prom. por sesión (seg)', tipo: 'r', fn: function (s) { return div_(s.tiempo_interaccion_seg, s.sesiones); } },
  tiempo_prom_usuario: { nombre: 'Tiempo prom. por usuario activo (seg)', tipo: 'r', fn: function (s) { return div_(s.tiempo_interaccion_seg, s.usuarios_activos); } },
  vistas_por_sesion: { nombre: 'Vistas por sesión', tipo: 'r', fn: function (s) { return div_(s.vistas, s.sesiones); } }
};

var PERIODOS_ = {
  ayer: 'Ayer', ultimos_7: 'Últimos 7 días', ultimos_30: 'Últimos 30 días', ultimos_90: 'Últimos 90 días',
  este_mes: 'Este mes', mes_pasado: 'Mes pasado', este_anio: 'Este año', personalizado: 'Personalizado'
};

function div_(a, b) { return b ? a / b : ''; }
/** Costos: vacío si no hubo inversión (p. ej. filas de HubSpot o GA4), para no mostrar un costo de 0. */
function costo_(inv, b) { return inv ? div_(inv, b) : ''; }

/* ================== Panel ================== */

function abrirConsultas() {
  var html = HtmlService.createHtmlOutputFromFile('Consultas').setTitle('27zero · Consultas');
  SpreadsheetApp.getUi().showSidebar(html);
}

/** Opciones para llenar el panel. */
function getOpcionesConsulta() {
  var clientes = [];
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJAS.CLIENTES);
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
      if (r[0] !== '') clientes.push({ id: String(r[0]), nombre: String(r[1] || r[0]) });
    });
  }
  var rango = { min: '', max: '' };
  var su = SpreadsheetApp.getActive().getSheetByName(HOJAS.UNIFICADO);
  if (su && su.getLastRow() > 1) {
    var fechas = su.getRange(2, 1, su.getLastRow() - 1, 1).getValues().map(function (r) { return fechaClave_(r[0]); }).filter(String).sort();
    rango = { min: fechas[0], max: fechas[fechas.length - 1] };
  }
  var dims = Object.keys(DIMENSIONES_).map(function (k) { return { id: k, nombre: DIMENSIONES_[k].nombre }; });
  var base = Object.keys(METRICAS_BASE_).map(function (k) { return { id: k, nombre: METRICAS_BASE_[k].nombre }; });
  var calc = Object.keys(METRICAS_CALC_).map(function (k) { return { id: k, nombre: METRICAS_CALC_[k].nombre }; });
  var periodos = Object.keys(PERIODOS_).map(function (k) { return { id: k, nombre: PERIODOS_[k] }; });
  return {
    clientes: clientes,
    plataformas: ['Google Analytics', PLATAFORMA_PAGINAS_, 'Google Ads', 'LinkedIn Ads', 'LinkedIn', 'HubSpot'],
    dimensiones: dims, metricasBase: base, metricasCalc: calc, periodos: periodos,
    rangoDatos: rango, guardadas: listarConsultas_()
  };
}

/* ================== Ejecución ================== */

/** Ejecuta una consulta desde el panel. Devuelve un resumen para mostrar. */
function ejecutarConsulta(cfg) {
  validarCfg_(cfg);
  var res = calcularConsulta_(cfg);
  var nombreHoja = escribirConsulta_(cfg, res);
  guardarConsulta_(cfg);
  SpreadsheetApp.getActive().getSheetByName(nombreHoja).activate();
  return { hoja: nombreHoja, filas: res.filas.length, periodo: res.periodo.inicio + ' a ' + res.periodo.fin, avisos: res.avisos };
}

function refrescarConsulta(nombre) {
  var cfg = leerConsultas_()[nombre];
  if (!cfg) throw new Error('No existe la consulta "' + nombre + '".');
  var res = calcularConsulta_(cfg);
  escribirConsulta_(cfg, res);
  guardarConsulta_(cfg);
  return { hoja: cfg.nombre, filas: res.filas.length, periodo: res.periodo.inicio + ' a ' + res.periodo.fin, avisos: res.avisos };
}

function eliminarConsulta(nombre, borrarPestana) {
  var todas = leerConsultas_();
  delete todas[nombre];
  escribirConsultas_(todas);
  if (borrarPestana) {
    var sh = SpreadsheetApp.getActive().getSheetByName(nombre);
    if (sh) SpreadsheetApp.getActive().deleteSheet(sh);
  }
  return listarConsultas_();
}

/** Se llama al final de construirUnificado: refresca las consultas con autoactualizar. */
function refrescarConsultasGuardadas_() {
  var todas = leerConsultas_();
  Object.keys(todas).forEach(function (n) {
    if (!todas[n].autoActualizar) return;
    try {
      var res = calcularConsulta_(todas[n]);
      escribirConsulta_(todas[n], res);
      log_('Consulta', n, 'OK', res.filas.length, '');
    } catch (e) {
      log_('Consulta', n, 'ERROR', 0, e.message);
    }
  });
}

function validarCfg_(cfg) {
  if (!cfg || !cfg.nombre) throw new Error('Ponle un nombre a la consulta.');
  cfg.nombre = String(cfg.nombre).replace(/[\[\]\*\?\/\\:]/g, ' ').trim().slice(0, 90);
  var reservadas = Object.keys(HOJAS).map(function (k) { return HOJAS[k]; }).concat(['LEEME', 'diccionario', HOJA_CONSULTAS_]);
  if (reservadas.indexOf(cfg.nombre) !== -1) throw new Error('Ese nombre es de una pestaña del sistema. Usa otro.');
  if (!cfg.metricas || !cfg.metricas.length) throw new Error('Elige al menos una métrica.');
  if (cfg.periodo === 'personalizado' && (!cfg.desde || !cfg.hasta || cfg.desde > cfg.hasta)) throw new Error('Revisa las fechas personalizadas.');
}

/* ---------- Periodos ---------- */

function resolverPeriodo_(cfg) {
  var hoy = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd').split('-').map(Number);
  var y = hoy[0], m = hoy[1] - 1, d = hoy[2];
  var ayer = Date.UTC(y, m, d) - DIA_MS_;
  var ini, fin = ayer;
  switch (cfg.periodo) {
    case 'ayer': ini = ayer; break;
    case 'ultimos_7': ini = ayer - 6 * DIA_MS_; break;
    case 'ultimos_90': ini = ayer - 89 * DIA_MS_; break;
    case 'este_mes': ini = Date.UTC(y, m, 1); break;
    case 'mes_pasado': ini = Date.UTC(y, m - 1, 1); fin = Date.UTC(y, m, 1) - DIA_MS_; break;
    case 'este_anio': ini = Date.UTC(y, 0, 1); break;
    case 'personalizado':
      var a = cfg.desde.split('-').map(Number), b = cfg.hasta.split('-').map(Number);
      ini = Date.UTC(a[0], a[1] - 1, a[2]); fin = Date.UTC(b[0], b[1] - 1, b[2]); break;
    default: ini = ayer - 29 * DIA_MS_; // ultimos_30
  }
  if (ini > fin) ini = fin;
  return { inicio: isoUTC_(ini), fin: isoUTC_(fin), iniMs: ini, finMs: fin };
}

function periodoComparacion_(p, modo) {
  if (modo === 'anterior') {
    var largo = p.finMs - p.iniMs + DIA_MS_;
    return { inicio: isoUTC_(p.iniMs - largo), fin: isoUTC_(p.finMs - largo) };
  }
  if (modo === 'anio') {
    var menosAnio = function (ms) { var x = new Date(ms); return Date.UTC(x.getUTCFullYear() - 1, x.getUTCMonth(), x.getUTCDate()); };
    return { inicio: isoUTC_(menosAnio(p.iniMs)), fin: isoUTC_(menosAnio(p.finMs)) };
  }
  return null;
}

function lunes_(fecha) {
  var p = fecha.split('-').map(Number);
  var ms = Date.UTC(p[0], p[1] - 1, p[2]);
  var dia = new Date(ms).getUTCDay(); // 0 = domingo
  return isoUTC_(ms - ((dia + 6) % 7) * DIA_MS_);
}

/* ---------- Cálculo ---------- */

function leerUnificado_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJAS.UNIFICADO);
  if (!sh || sh.getLastRow() < 2) return [];
  var enc = ENCABEZADOS[HOJAS.UNIFICADO];
  return sh.getRange(2, 1, sh.getLastRow() - 1, enc.length).getValues().map(function (r) {
    var o = {};
    enc.forEach(function (h, i) { o[h] = r[i]; });
    o.fecha = fechaClave_(o.fecha);
    o.cliente_id = String(o.cliente_id);
    return o;
  });
}

function sumasVacias_() {
  var s = {};
  Object.keys(METRICAS_BASE_).forEach(function (k) { s[k] = 0; });
  return s;
}

function agregar_(filas, dims) {
  var grupos = {}, orden = [];
  filas.forEach(function (r) {
    var claves = dims.map(function (d) { return String(DIMENSIONES_[d].fn(r)); });
    var k = claves.join('\u0001');
    if (!grupos[k]) { grupos[k] = { claves: claves, s: sumasVacias_() }; orden.push(k); }
    Object.keys(METRICAS_BASE_).forEach(function (m) { grupos[k].s[m] += num_(r[m]); });
  });
  return { grupos: grupos, orden: orden };
}

function valorMetrica_(m, s) {
  if (METRICAS_BASE_[m]) return s[m];
  return METRICAS_CALC_[m].fn(s);
}

function calcularConsulta_(cfg) {
  var avisos = [];
  var periodo = resolverPeriodo_(cfg);
  var comp = periodoComparacion_(periodo, cfg.comparar);
  var dims = (cfg.dimensiones || []).filter(function (d) { return DIMENSIONES_[d]; });
  var metricas = cfg.metricas.filter(function (m) { return METRICAS_BASE_[m] || METRICAS_CALC_[m]; });

  if (comp && dims.some(function (d) { return DIMS_TIEMPO_.indexOf(d) !== -1; })) {
    avisos.push('La comparación solo se aplica sin dimensiones de tiempo; se mostró sin comparar.');
    comp = null;
  }

  var clientes = cfg.clientes || [], plataformas = cfg.plataformas || [];
  var filtro = String(cfg.filtroCampana || '').toLowerCase().trim();
  var todas = leerUnificado_().filter(function (r) {
    if (clientes.length && clientes.indexOf(r.cliente_id) === -1) return false;
    if (plataformas.length && plataformas.indexOf(r.plataforma) === -1) return false;
    // Las páginas son una vista distinta del mismo tráfico: solo entran si se eligen a propósito.
    if (!plataformas.length && r.plataforma === PLATAFORMA_PAGINAS_) return false;
    if (filtro && (String(r.campana) + ' ' + String(r.pagina)).toLowerCase().indexOf(filtro) === -1) return false;
    return true;
  });
  var actual = todas.filter(function (r) { return r.fecha >= periodo.inicio && r.fecha <= periodo.fin; });
  var previo = comp ? todas.filter(function (r) { return r.fecha >= comp.inicio && r.fecha <= comp.fin; }) : [];

  // Si hay métricas de dinero y más de una moneda, se separa por moneda para no sumar peras con manzanas.
  var usaDinero = metricas.some(function (m) { return (METRICAS_BASE_[m] || METRICAS_CALC_[m]).tipo === 'd'; });
  var monedas = {};
  actual.forEach(function (r) { if (r.moneda && num_(r.inversion)) monedas[r.moneda] = true; });
  if (usaDinero && Object.keys(monedas).length > 1 && dims.indexOf('moneda') === -1) {
    dims.push('moneda');
    avisos.push('Hay inversión en varias monedas (' + Object.keys(monedas).join(', ') + '): se agregó la dimensión Moneda.');
  }

  // Conversiones: cada plataforma usa su propia atribución, así que no se suman entre plataformas.
  var METRICAS_CONV = ['conversiones', 'valor_conversiones', 'cpa', 'tasa_conversion', 'roas'];
  var usaConv = metricas.some(function (m) { return METRICAS_CONV.indexOf(m) !== -1; });
  var platConv = {};
  actual.forEach(function (r) { if (num_(r.conversiones)) platConv[r.plataforma] = true; });
  var variasPlatConv = usaConv && Object.keys(platConv).length > 1;
  if (variasPlatConv && dims.indexOf('plataforma') === -1) {
    dims.push('plataforma');
    avisos.push('Las conversiones vienen de varias plataformas (' + Object.keys(platConv).join(', ') + '), cada una con su propia atribución: se separó por Plataforma.');
  }
  if (variasPlatConv) avisos.push('El total de conversiones no suma plataformas distintas; compáralas fila por fila.');

  if (plataformas.indexOf('Google Analytics') !== -1 && plataformas.indexOf(PLATAFORMA_PAGINAS_) !== -1 &&
      metricas.some(function (m) { return ['vistas', 'usuarios_activos', 'tiempo_interaccion_seg'].indexOf(m) !== -1; })) {
    avisos.push('Elegiste Google Analytics y Google Analytics · Páginas juntas: las vistas y el tiempo se cuentan en las dos. Usa una sola.');
  }

  var aggA = agregar_(actual, dims);
  var aggP = comp ? agregar_(previo, dims) : null;

  // Usuarios: el total del periodo se pide exacto a GA4 (no se puede sumar día a día).
  var METRICAS_USUARIOS = ['usuarios', 'usuarios_activos', 'tiempo_prom_usuario'];
  var exA = null, exP = null;
  var incluyeGA4 = !plataformas.length || plataformas.indexOf('Google Analytics') !== -1 || plataformas.indexOf(PLATAFORMA_PAGINAS_) !== -1;
  if (incluyeGA4 && !filtro && typeof usuariosExactosGA4_ === 'function' &&
      metricas.some(function (m) { return METRICAS_USUARIOS.indexOf(m) !== -1; })) {
    exA = usuariosExactosGA4_(clientes, periodo.inicio, periodo.fin);
    if (comp) exP = usuariosExactosGA4_(clientes, comp.inicio, comp.fin);
  }
  function aplicarExactos(g, ex) { if (g && ex) { g.s.usuarios = ex.usuarios; g.s.usuarios_activos = ex.usuarios_activos; } }
  if (!dims.length) { aplicarExactos(aggA.grupos[''], exA); if (aggP) aplicarExactos(aggP.grupos[''], exP); }

  var filas = aggA.orden.map(function (k) {
    var g = aggA.grupos[k];
    var fila = g.claves.slice();
    metricas.forEach(function (m) {
      var v = valorMetrica_(m, g.s);
      fila.push(v);
      if (comp) {
        var gp = aggP.grupos[k];
        var vp = gp ? valorMetrica_(m, gp.s) : '';
        fila.push(vp);
        fila.push(vp === '' || vp === 0 || v === '' ? '' : (v - vp) / Math.abs(vp));
      }
    });
    return fila;
  });

  var esTiempo = dims.length && DIMS_TIEMPO_.indexOf(dims[0]) !== -1;
  var nd = dims.length;
  filas.sort(function (a, b) {
    if (esTiempo) return String(a[0]).localeCompare(String(b[0]));
    return num_(b[nd]) - num_(a[nd]);
  });

  // Fila de totales (las razones se recalculan sobre las sumas, no se promedian)
  var totA = agregar_(actual, []).grupos[''];
  var totP = comp ? agregar_(previo, []).grupos[''] : null;
  aplicarExactos(totA, exA); aplicarExactos(totP, exP);
  if (exA && dims.length) avisos.push('Usuarios: el total es el valor exacto de GA4 para el periodo. Las filas suman días o canales, así que pueden dar más que el total.');
  var total = ['Total'].concat(dims.slice(1).map(function () { return ''; }));
  // Sin dimensiones, la única fila ya es el total.
  var variasMonedas = Object.keys(monedas).length > 1;
  if (nd) metricas.forEach(function (m) {
    var v = totA ? valorMetrica_(m, totA.s) : 0;
    var esConv = variasPlatConv && METRICAS_CONV.indexOf(m) !== -1;
    if (esConv || (variasMonedas && (METRICAS_BASE_[m] || METRICAS_CALC_[m]).tipo === 'd')) {
      total.push(''); if (comp) { total.push(''); total.push(''); }
      return; // no se suman monedas distintas
    }
    total.push(v);
    if (comp) {
      var vp = totP ? valorMetrica_(m, totP.s) : '';
      total.push(vp);
      total.push(vp === '' || vp === 0 || v === '' ? '' : (v - vp) / Math.abs(vp));
    }
  });
  if (!nd) total = [];

  var encabezado = dims.map(function (d) { return DIMENSIONES_[d].nombre; });
  var tipos = dims.map(function () { return 't'; });
  metricas.forEach(function (m) {
    var def = METRICAS_BASE_[m] || METRICAS_CALC_[m];
    encabezado.push(def.nombre); tipos.push(def.tipo);
    if (comp) { encabezado.push(def.nombre + ' (anterior)'); tipos.push(def.tipo); encabezado.push('Δ ' + def.nombre); tipos.push('p'); }
  });

  if (!actual.length) avisos.push('No hay datos para esos filtros en el periodo ' + periodo.inicio + ' a ' + periodo.fin + '.');
  return { encabezado: encabezado, tipos: tipos, filas: filas, total: total, periodo: periodo, comp: comp, avisos: avisos };
}

/* ---------- Escritura ---------- */

function escribirConsulta_(cfg, res) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(cfg.nombre) || ss.insertSheet(cfg.nombre);
  sh.clear();
  var n = res.encabezado.length;
  var datos = [res.encabezado].concat(res.filas.map(function (f) {
    return f.map(function (v) { return (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v; });
  }));
  if (res.total.length) datos.push(res.total);
  sh.getRange(1, 1, datos.length, n).setValues(datos);

  sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#3E128C').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  if (res.total.length) sh.getRange(datos.length, 1, 1, n).setFontWeight('bold').setBackground('#F4F0FC');
  var formatos = { n: '#,##0', d: '#,##0.00', p: '0.0%', r: '#,##0.00', t: '@' };
  res.tipos.forEach(function (t, i) {
    if (datos.length > 1 && t !== 't') sh.getRange(2, i + 1, datos.length - 1, 1).setNumberFormat(formatos[t]);
  });
  sh.autoResizeColumns(1, n);

  var nota = 'Consulta: ' + cfg.nombre +
    '\nPeriodo: ' + (PERIODOS_[cfg.periodo] || cfg.periodo) + ' (' + res.periodo.inicio + ' a ' + res.periodo.fin + ')' +
    (res.comp ? '\nComparado con: ' + res.comp.inicio + ' a ' + res.comp.fin : '') +
    '\nClientes: ' + ((cfg.clientes || []).join(', ') || 'todos') +
    '\nPlataformas: ' + ((cfg.plataformas || []).join(', ') || 'todas') +
    (cfg.filtroCampana ? '\nCampaña contiene: ' + cfg.filtroCampana : '') +
    '\nActualizada: ' + Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm') +
    (cfg.autoActualizar ? ' · se actualiza sola cada día' : '') +
    (res.avisos.length ? '\n\n' + res.avisos.join('\n') : '');
  sh.getRange(1, 1).setNote(nota);
  return cfg.nombre;
}

/* ---------- Consultas guardadas ---------- */

function hojaConsultas_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(HOJA_CONSULTAS_);
  if (!sh) {
    sh = ss.insertSheet(HOJA_CONSULTAS_);
    sh.getRange(1, 1, 1, 3).setValues([['nombre', 'configuracion', 'actualizada']]).setFontWeight('bold');
    sh.hideSheet();
  }
  return sh;
}

function leerConsultas_() {
  var sh = hojaConsultas_();
  var o = {};
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
      if (r[0]) { try { o[r[0]] = JSON.parse(r[1]); } catch (e) { /* fila dañada: se ignora */ } }
    });
  }
  return o;
}

function escribirConsultas_(todas) {
  var sh = hojaConsultas_();
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).clearContent();
  var filas = Object.keys(todas).map(function (k) { return [k, JSON.stringify(todas[k]), todas[k]._actualizada || '']; });
  if (filas.length) sh.getRange(2, 1, filas.length, 3).setValues(filas);
}

function guardarConsulta_(cfg) {
  var todas = leerConsultas_();
  cfg._actualizada = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm');
  todas[cfg.nombre] = cfg;
  escribirConsultas_(todas);
}

function listarConsultas_() {
  var todas = leerConsultas_();
  return Object.keys(todas).map(function (k) {
    var c = todas[k];
    return { nombre: k, periodo: PERIODOS_[c.periodo] || c.periodo, auto: !!c.autoActualizar, actualizada: c._actualizada || '', cfg: c };
  });
}

  /* ===== 08_API.gs ===== */
/**
 * 08_API.gs — API para el portal web estático (27zero Reportes)
 *
 * Se publica como "Aplicación web": Implementar › Nueva implementación › Aplicación web
 *   - Ejecutar como: Yo (dueño de la hoja)
 *   - Quién tiene acceso: Cualquier usuario
 * La seguridad NO depende de la URL: cada petición trae un token de Google (login)
 * que se verifica aquí, y el email debe estar en la pestaña "usuarios".
 *
 * Roles (pestaña usuarios):
 *   admin   → ve todos los clientes
 *   cliente → ve solo los cliente_id de su columna "clientes" (separados por coma)
 * El filtro por cliente se aplica SIEMPRE en el servidor.
 */

var HOJA_USUARIOS_ = 'usuarios';
var ENC_USUARIOS_ = ['email', 'nombre', 'rol', 'clientes', 'activo'];

function doGet() {
  return json_({ ok: true, servicio: '27zero Reportes API', hora: new Date().toISOString() });
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var usuario = autenticar_(body.token);
    switch (body.accion) {
      case 'opciones':  return json_({ ok: true, datos: opcionesWeb_(usuario) });
      case 'consultar': return json_({ ok: true, datos: consultarWeb_(usuario, body.cfg || {}) });
      case 'narrativa_guardar':
        return json_({ ok: true, datos: guardarNarrativaWeb_(usuario, body.cfg || {}, body.seccion, body.texto) });
      default:          return json_({ ok: false, error: 'Acción no válida.' });
    }
  } catch (err) {
    var codigo = err.codigo || 'error';
    if (codigo === 'error') console.error(err.stack || err);
    return json_({ ok: false, codigo: codigo, error: err.message });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function errorAuth_(msg) { var e = new Error(msg); e.codigo = 'auth'; return e; }

/* ---------- Autenticación ---------- */

function autenticar_(token) {
  if (!token) throw errorAuth_('Inicia sesión con Google.');
  var clientId = String(getParam_('web_client_id') || '').trim();
  if (!clientId) throw new Error('Falta web_client_id en config_general.');

  var cache = CacheService.getScriptCache();
  var claveCache = 'tok_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token)).slice(0, 40);
  var email = cache.get(claveCache);

  if (!email) {
    var resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) throw errorAuth_('La sesión no es válida o venció. Vuelve a iniciar sesión.');
    var info = JSON.parse(resp.getContentText());
    var emisorOk = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
    if (info.aud !== clientId || !emisorOk) throw errorAuth_('El token no corresponde a esta aplicación.');
    if (String(info.email_verified) !== 'true') throw errorAuth_('El correo de Google no está verificado.');
    if (Number(info.exp) * 1000 < Date.now()) throw errorAuth_('La sesión venció. Vuelve a iniciar sesión.');
    email = String(info.email).toLowerCase();
    var restante = Math.max(60, Math.min(600, Math.floor(Number(info.exp) - Date.now() / 1000)));
    cache.put(claveCache, email, restante);
  }

  var u = leerUsuarios_()[email];
  if (!u || !esSi_(u.activo)) throw errorAuth_('Tu cuenta (' + email + ') no tiene acceso. Pide acceso a 27zero.');
  var rol = String(u.rol).trim().toLowerCase() === 'admin' ? 'admin' : 'cliente';
  var clientes = String(u.clientes || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  if (rol === 'cliente' && !clientes.length) throw errorAuth_('Tu cuenta no tiene clientes asignados.');
  return { email: email, nombre: u.nombre || email, rol: rol, clientes: clientes };
}

function leerUsuarios_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJA_USUARIOS_);
  var o = {};
  if (!sh || sh.getLastRow() < 2) return o;
  var datos = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  var enc = datos.shift().map(function (h) { return String(h).trim().toLowerCase(); });
  datos.forEach(function (r) {
    var u = {};
    enc.forEach(function (h, i) { u[h] = r[i]; });
    if (u.email) o[String(u.email).trim().toLowerCase()] = u;
  });
  return o;
}

/** Clientes que el usuario puede ver: [{id, nombre}] */
function clientesPermitidos_(usuario) {
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJAS.CLIENTES);
  var todos = [];
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
      if (r[0] !== '') todos.push({ id: String(r[0]).trim(), nombre: String(r[1] || r[0]).trim() });
    });
  }
  if (usuario.rol === 'admin') return todos;
  return todos.filter(function (c) { return usuario.clientes.indexOf(c.id) !== -1; });
}

/* ---------- Acciones ---------- */

function opcionesWeb_(usuario) {
  var op = getOpcionesConsulta();
  var permitidos = clientesPermitidos_(usuario);
  return {
    usuario: { email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
    clientes: permitidos,
    plataformas: op.plataformas,
    dimensiones: op.dimensiones,
    metricasBase: op.metricasBase,
    metricasCalc: op.metricasCalc,
    periodos: op.periodos,
    rangoDatos: op.rangoDatos,
    tipos: tiposMetricas_(),
    puedeEditarNarrativa: puedeEditarNarrativa_(usuario)
  };
}

function tiposMetricas_() {
  var t = {};
  Object.keys(METRICAS_BASE_).forEach(function (k) { t[k] = METRICAS_BASE_[k].tipo; });
  Object.keys(METRICAS_CALC_).forEach(function (k) { t[k] = METRICAS_CALC_[k].tipo; });
  return t;
}

/** Normaliza y recorta la configuración que llega del navegador a lo que el usuario puede ver. */
function limpiarCfgWeb_(usuario, cfg) {
  var permitidos = clientesPermitidos_(usuario).map(function (c) { return c.id; });
  var pedidos = (cfg.clientes || []).map(String);
  // Nunca se confía en el navegador: se recorta a lo permitido.
  var clientes = pedidos.length ? pedidos.filter(function (id) { return permitidos.indexOf(id) !== -1; }) : permitidos;
  if (!clientes.length) throw new Error('No tienes acceso a esos clientes.');

  var limpio = {
    nombre: 'web',
    clientes: clientes,
    plataformas: (cfg.plataformas || []).map(String),
    periodo: PERIODOS_[cfg.periodo] ? cfg.periodo : 'ultimos_30',
    desde: String(cfg.desde || ''), hasta: String(cfg.hasta || ''),
    comparar: ['anterior', 'anio'].indexOf(cfg.comparar) !== -1 ? cfg.comparar : 'ninguno',
    dimensiones: (cfg.dimensiones || []).filter(function (d) { return DIMENSIONES_[d]; }).slice(0, 4),
    metricas: (cfg.metricas || []).filter(function (m) { return METRICAS_BASE_[m] || METRICAS_CALC_[m]; }).slice(0, 15),
    filtroCampana: String(cfg.filtroCampana || '').slice(0, 100)
  };
  if (limpio.periodo === 'personalizado' && (!/^\d{4}-\d{2}-\d{2}$/.test(limpio.desde) || !/^\d{4}-\d{2}-\d{2}$/.test(limpio.hasta) || limpio.desde > limpio.hasta)) {
    throw new Error('Revisa las fechas personalizadas.');
  }
  return limpio;
}

function consultarWeb_(usuario, cfg) {
  var limpio = limpiarCfgWeb_(usuario, cfg);
  if (!limpio.metricas.length) throw new Error('Elige al menos una métrica.');

  var res = calcularConsulta_(limpio);
  var clave = claveNarrativa_(limpio, res.periodo);
  return {
    encabezado: res.encabezado,
    tipos: res.tipos,
    filas: res.filas,
    total: res.total,
    periodo: { inicio: res.periodo.inicio, fin: res.periodo.fin },
    comparacion: res.comp,
    avisos: res.avisos,
    nDimensiones: res.encabezado.length - res.tipos.filter(function (t) { return t !== 't'; }).length,
    narrativas: leerNarrativas_(clave),
    puedeEditarNarrativa: puedeEditarNarrativa_(usuario)
  };
}

/* ---------- Narrativas (análisis escrito por el equipo) ---------- */

var HOJA_NARRATIVAS_ = 'narrativas';
var SECCIONES_NARRATIVA_ = ['resumen', 'grafico', 'tabla'];

/**
 * Una narrativa pertenece a: clientes + fuentes + fechas exactas.
 * Así, "Doctums, Google Ads, octubre" tiene su propio análisis, que se ve
 * sin importar qué métricas o dimensiones se elijan.
 */
function claveNarrativa_(limpio, periodo) {
  return [
    limpio.clientes.slice().sort().join(','),
    limpio.plataformas.length ? limpio.plataformas.slice().sort().join(',') : '*',
    periodo.inicio, periodo.fin
  ].join('|');
}

function puedeEditarNarrativa_(usuario) {
  if (usuario.rol === 'admin') return true;
  return esSi_(getParam_('narrativa_clientes_editan'));
}

function hojaNarrativas_() {
  return hoja_(HOJA_NARRATIVAS_); // la crea con encabezados si no existe
}

function leerNarrativas_(clave) {
  var sh = SpreadsheetApp.getActive().getSheetByName(HOJA_NARRATIVAS_);
  var o = {};
  if (!sh || sh.getLastRow() < 2) return o;
  sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues().forEach(function (r) {
    if (String(r[0]) === clave && r[5] !== '') {
      o[String(r[1])] = { texto: String(r[5]), autor: String(r[6]), actualizado: r[7] instanceof Date ? Utilities.formatDate(r[7], tz_(), 'yyyy-MM-dd HH:mm') : String(r[7]) };
    }
  });
  return o;
}

/** Inserta, actualiza o (con texto vacío) borra la narrativa de una sección. */
function upsertNarrativa_(clave, seccion, clientes, desde, hasta, texto, autor) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = hojaNarrativas_();
    var n = sh.getLastRow();
    var filas = n > 1 ? sh.getRange(2, 1, n - 1, 2).getValues() : [];
    var idx = -1;
    for (var i = 0; i < filas.length; i++) {
      if (String(filas[i][0]) === clave && String(filas[i][1]) === seccion) { idx = i + 2; break; }
    }
    var ahora = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm');
    if (!texto) {
      if (idx > 0) sh.deleteRow(idx);
      return null;
    }
    // El apóstrofo inicial obliga a Sheets a guardarlo como texto (nunca como fórmula).
    var fila = [clave, seccion, clientes, desde, hasta, "'" + texto, autor, "'" + ahora];
    if (idx > 0) sh.getRange(idx, 1, 1, 8).setValues([fila]);
    else sh.appendRow(fila);
    return { texto: texto, autor: autor, actualizado: ahora };
  } finally {
    lock.releaseLock();
  }
}

function guardarNarrativaWeb_(usuario, cfg, seccion, texto) {
  if (!puedeEditarNarrativa_(usuario)) throw new Error('Tu usuario puede leer el análisis, pero no editarlo.');
  if (SECCIONES_NARRATIVA_.indexOf(seccion) === -1) throw new Error('Sección no válida.');
  texto = String(texto || '').replace(/\r\n/g, '\n').trim().slice(0, 5000);
  var limpio = limpiarCfgWeb_(usuario, cfg);
  var periodo = resolverPeriodo_(limpio);
  var clave = claveNarrativa_(limpio, periodo);
  var guardada = upsertNarrativa_(clave, seccion, limpio.clientes.join(','), periodo.inicio, periodo.fin, texto, usuario.nombre || usuario.email);
  return { seccion: seccion, narrativa: guardada };
}

  /* ---------- Datos de ejemplo (inventados) ---------- */
  var semilla = 27;
  function azar() { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; }
  function ruido(base, var_) { return Math.max(0, base * (1 + (azar() - 0.5) * var_)); }

  var CLIENTES_DEMO = [
    { id: '27zero', nombre: '27zero', escala: 1 },
    { id: 'edtech_demo', nombre: 'EdTech Demo', escala: 2.4 }
  ];

  function generarFilas() {
    var filas = [];
    var hoy = Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd').split('-').map(Number);
    var hoyMs = Date.UTC(hoy[0], hoy[1] - 1, hoy[2]);
    for (var i = 1; i <= 430; i++) {
      var ms = hoyMs - i * DIA_MS_;
      var fecha = isoUTC_(ms);
      var dow = new Date(ms).getUTCDay();
      var finde = (dow === 0 || dow === 6) ? 0.55 : 1;
      var tendencia = 1 + (430 - i) / 430 * 0.35;
      CLIENTES_DEMO.forEach(function (c) {
        var k = c.escala * finde * tendencia;
        var base = { fecha: fecha, cliente_id: c.id, cliente: c.nombre };
        function fila(extra) { var o = {}; Object.keys(base).forEach(function (x) { o[x] = base[x]; }); Object.keys(extra).forEach(function (x) { o[x] = extra[x]; }); filas.push(o); }

        [['Search · Marca', 'SEARCH', 900, 0.11, 0.55, 0.09], ['Search · Genérica', 'SEARCH', 2600, 0.045, 1.9, 0.04], ['Performance Max', 'PERFORMANCE_MAX', 7000, 0.012, 0.6, 0.03]]
          .forEach(function (g) {
            var imp = Math.round(ruido(g[2] * k, 0.4)), cl = Math.round(imp * ruido(g[3], 0.3)), conv = Math.round(cl * ruido(g[5], 0.8) * 10) / 10;
            fila({ plataforma: 'Google Ads', categoria: 'pago', canal: g[1], campana: g[0], moneda: 'USD', impresiones: imp, clics: cl,
              inversion: Math.round(cl * ruido(g[4], 0.3) * 100) / 100, conversiones: conv, valor_conversiones: Math.round(conv * 120) });
          });

        [['ABM · Decisores', 3200, 0.006, 9.5, 0.004], ['Lead Gen · Webinar', 4200, 0.008, 6.2, 0.012]].forEach(function (g) {
          var imp = Math.round(ruido(g[1] * k, 0.4)), cl = Math.round(imp * ruido(g[2], 0.4));
          fila({ plataforma: 'LinkedIn Ads', categoria: 'pago', canal: 'Paid Social', campana: g[0], moneda: 'USD', impresiones: imp, clics: cl,
            inversion: Math.round(cl * ruido(g[3], 0.3) * 100) / 100, conversiones: Math.round(cl * ruido(0.03, 1)), leads: Math.round(imp * ruido(g[4], 1) / 10),
            interacciones: Math.round(cl * ruido(1.6, 0.4)) });
        });

        [['Organic Search', '(organic)', 520], ['Paid Search', 'Search · Genérica', 210], ['Direct', '(direct)', 260], ['Paid Social', 'Lead Gen · Webinar', 90], ['Referral', '(referral)', 70], ['Email', 'Newsletter EdTech Mentor', 60]]
          .forEach(function (g) {
            var ses = Math.round(ruido(g[2] * k, 0.35));
            var fm = { 'Organic Search': 'google / organic', 'Paid Search': 'google / cpc', 'Direct': '(direct) / (none)', 'Paid Social': 'linkedin / paid', 'Referral': 'educause.edu / referral', 'Email': 'hs_email / email' }[g[0]];
            var comp = Math.round(ses * ruido(0.55, 0.2));
            fila({ plataforma: 'Google Analytics', categoria: 'web', canal: g[0], campana: g[1], fuente_medio: fm, sesiones: ses, usuarios: Math.round(ses * 0.82),
              usuarios_activos: Math.round(ses * 0.8), vistas: Math.round(ses * ruido(2.3, 0.3)), sesiones_comprometidas: comp,
              tiempo_interaccion_seg: Math.round(comp * ruido(95, 0.4)),
              conversiones: Math.round(ses * ruido(0.018, 0.9)), valor_conversiones: 0 });
          });
        [['/', 900], ['/servicios/', 260], ['/blog/ia-en-educacion/', 180], ['/blog/estrategia-edtech-2026/', 140], ['/casos-de-exito/', 120], ['/contacto/', 80], ['/blog/guia-de-marca/', 60]]
          .forEach(function (g) {
            var v = Math.round(ruido(g[1] * k, 0.4)), u = Math.round(v * 0.7);
            fila({ plataforma: 'Google Analytics · Páginas', categoria: 'web', canal: '', campana: '', pagina: g[0], vistas: v, usuarios_activos: u, tiempo_interaccion_seg: Math.round(u * ruido(55, 0.5)) });
          });

        var impOrg = Math.round(ruido(1800 * k, 0.6));
        fila({ plataforma: 'LinkedIn', categoria: 'organico', canal: 'Organic Social', campana: '', impresiones: impOrg, clics: Math.round(impOrg * ruido(0.02, 0.5)),
          interacciones: Math.round(impOrg * ruido(0.045, 0.5)), seguidores_nuevos: Math.round(ruido(6 * k, 0.9)) });

        [['PAID_SEARCH', 2.2], ['ORGANIC_SEARCH', 1.8], ['PAID_SOCIAL', 1.4], ['DIRECT_TRAFFIC', 0.8]].forEach(function (g) {
          var leads = Math.round(ruido(g[1] * k, 1));
          var gan = azar() < 0.05 * c.escala ? 1 : 0;
          fila({ plataforma: 'HubSpot', categoria: 'crm', canal: g[0], campana: '', leads: leads,
            negocios_creados: azar() < 0.18 * c.escala ? 1 : 0, negocios_ganados: gan, valor_negocios: gan ? Math.round(ruido(8500, 0.6)) : 0 });
        });
      });
    }
    return filas;
  }

  log_ = function () {};
  // Narrativas en memoria (en el portal real viven en la pestaña "narrativas" de la hoja)
  var NARRATIVAS_DEMO = {};
  leerNarrativas_ = function (clave) {
    var o = {};
    Object.keys(NARRATIVAS_DEMO).forEach(function (k) { var p = k.split('#'); if (p[0] === clave) o[p[1]] = NARRATIVAS_DEMO[k]; });
    return o;
  };
  upsertNarrativa_ = function (clave, seccion, clientes, desde, hasta, texto, autor) {
    var k = clave + '#' + seccion;
    if (!texto) { delete NARRATIVAS_DEMO[k]; return null; }
    NARRATIVAS_DEMO[k] = { texto: texto, autor: autor, actualizado: Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm') };
    return NARRATIVAS_DEMO[k];
  };
  listarConsultas_ = function () { return []; };
  var FILAS_DEMO = null;
  leerUnificado_ = function () { if (!FILAS_DEMO) FILAS_DEMO = generarFilas(); return FILAS_DEMO; };
  clientesPermitidos_ = function () { return CLIENTES_DEMO.map(function (c) { return { id: c.id, nombre: c.nombre }; }); };

  var USUARIO_DEMO = { email: 'demo@27zero.co', nombre: 'Equipo 27zero (demo)', rol: 'admin', clientes: [] };

  window.DEMO_API = function (accion, cfg, extra) {
    return new Promise(function (ok, mal) {
      setTimeout(function () {
        try {
          if (accion === 'opciones') {
            var op = opcionesWeb_(USUARIO_DEMO);
            var f = leerUnificado_().map(function (r) { return r.fecha; }).sort();
            op.rangoDatos = { min: f[0], max: f[f.length - 1] };
            ok(op);
          } else if (accion === 'consultar') {
            ok(consultarWeb_(USUARIO_DEMO, cfg || {}));
          } else if (accion === 'narrativa_guardar') {
            ok(guardarNarrativaWeb_(USUARIO_DEMO, cfg || {}, extra && extra.seccion, extra && extra.texto));
          } else { mal(new Error('Acción no válida.')); }
        } catch (e) { mal(e); }
      }, 250);
    });
  };

})();