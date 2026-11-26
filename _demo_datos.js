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
            fila({ plataforma: 'Google Analytics', categoria: 'web', canal: g[0], campana: g[1], sesiones: ses, usuarios: Math.round(ses * 0.82),
              conversiones: Math.round(ses * ruido(0.018, 0.9)), valor_conversiones: 0 });
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
