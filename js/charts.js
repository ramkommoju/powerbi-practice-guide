/* ============================================
   Power BI Practice Guide — Chart Engine
   Renders live SVG charts with interactive slicers
   ============================================ */

window.Charts = (function () {
  'use strict';

  // ── Color Palette ──
  var COLORS = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'];

  // ── Formatting Utilities ──
  function fmt(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }
  function fmtPct(n) { return (n * 100).toFixed(1) + '%'; }
  function fmtNum(n) { return n.toLocaleString(); }
  function escSvg(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function truncate(s, max) { return s.length > max ? s.slice(0, max - 1) + '\u2026' : s; }

  // ── Data Helpers ──
  function groupBy(arr, keyFn, valueFn) {
    var map = {};
    arr.forEach(function (item) {
      var k = keyFn(item);
      if (!map[k]) map[k] = 0;
      map[k] += valueFn(item);
    });
    return Object.keys(map).map(function (k) { return { key: k, value: map[k] }; });
  }
  function sortBy(arr, prop, desc) {
    return arr.slice().sort(function (a, b) { return desc ? b[prop] - a[prop] : a[prop] - b[prop]; });
  }
  function distinctCount(arr, keyFn) {
    var set = {};
    arr.forEach(function (item) { set[keyFn(item)] = true; });
    return Object.keys(set).length;
  }

  // ── Data Loading & Enrichment (cached) ──
  var _cache = null;
  function getAggregated() {
    if (_cache) return _cache;
    var s = window.Scenarios && window.Scenarios['retail-sales'];
    if (!s) return null;
    var d = {
      transactions: s.sourceData.tables.transactions.generateRows(),
      items: s.sourceData.tables.transaction_items.generateRows(),
      products: s.sourceData.tables.products.generateRows(),
      categories: s.sourceData.tables.categories.generateRows(),
      subcategories: s.sourceData.tables.subcategories.generateRows(),
      stores: s.sourceData.tables.stores.generateRows(),
      customers: s.sourceData.tables.customers.generateRows()
    };

    var prodMap = {};
    d.products.forEach(function (p) { prodMap[p.product_id] = p; });
    var catMap = {};
    d.categories.forEach(function (c) { catMap[c.category_id] = c.category_name; });
    var subcatMap = {};
    d.subcategories.forEach(function (sc) { subcatMap[sc.subcategory_id] = sc; });
    var storeMap = {};
    d.stores.forEach(function (s) { storeMap[s.store_id] = s; });
    var txMap = {};
    d.transactions.forEach(function (t) {
      if (!t.transaction_id.startsWith('TEST')) txMap[t.transaction_id] = t;
    });
    var custMap = {};
    d.customers.forEach(function (c) { custMap[c.customer_id] = c; });

    var enriched = [];
    d.items.forEach(function (item) {
      var tx = txMap[item.transaction_id];
      if (!tx) return;
      var prod = prodMap[item.product_id] || {};
      var subcat = subcatMap[prod.subcategory_id] || {};
      var catName = catMap[subcat.category_id] || 'Unknown';
      var disc = item.discount_percent || 0;
      var lineTotal = item.quantity * item.unit_price * (1 - disc / 100);
      var cust = custMap[tx.customer_id];

      enriched.push({
        date: tx.transaction_date,
        month: tx.transaction_date.slice(0, 7),
        year: tx.transaction_date.slice(0, 4),
        store_id: tx.store_id,
        store_name: (storeMap[tx.store_id] || {}).store_name || 'Unknown',
        region: (storeMap[tx.store_id] || {}).region || 'Unknown',
        customer_id: tx.customer_id,
        payment_method: tx.payment_method,
        product_name: (prod.product_name || 'Unknown').trim(),
        category: catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase(),
        subcategory: subcat.subcategory_name || 'Unknown',
        brand: prod.brand || 'Unknown',
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: prod.cost_price || 0,
        revenue: lineTotal,
        cost: item.quantity * (prod.cost_price || 0),
        profit: lineTotal - item.quantity * (prod.cost_price || 0),
        is_return: item.quantity < 0,
        membership: cust ? cust.membership_tier : 'Walk-In',
        transaction_id: tx.transaction_id
      });
    });

    // Base clean data (no future, no returns)
    var clean = enriched.filter(function (r) { return r.date <= '2024-12-31' && !r.is_return; });

    // Compute unique values for slicers
    var years = []; var regions = []; var stores = []; var categories = []; var tiers = [];
    var ySet = {}, rSet = {}, sSet = {}, cSet = {}, tSet = {};
    clean.forEach(function (r) {
      if (!ySet[r.year]) { ySet[r.year] = 1; years.push(r.year); }
      if (!rSet[r.region]) { rSet[r.region] = 1; regions.push(r.region); }
      if (!sSet[r.store_name]) { sSet[r.store_name] = 1; stores.push(r.store_name); }
      if (!cSet[r.category]) { cSet[r.category] = 1; categories.push(r.category); }
      if (!tSet[r.membership]) { tSet[r.membership] = 1; tiers.push(r.membership); }
    });
    years.sort(); regions.sort(); stores.sort(); categories.sort(); tiers.sort();

    _cache = {
      enriched: enriched,
      clean: clean,
      storeList: d.stores,
      customerList: d.customers,
      slicerOptions: { years: years, regions: regions, stores: stores, categories: categories, tiers: tiers }
    };
    return _cache;
  }

  // ══════════════════════════════════════════
  // SLICER COMPONENT
  // ══════════════════════════════════════════

  var slicerStyle = 'display:inline-flex;flex-direction:column;gap:2px;';
  var selectStyle = 'padding:6px 28px 6px 10px;border:1px solid #CBD5E1;border-radius:6px;font-size:0.82rem;font-family:inherit;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%2364748B\'/%3E%3C/svg%3E") no-repeat right 10px center;-webkit-appearance:none;appearance:none;cursor:pointer;min-width:110px;color:#1E293B;';
  var labelStyle = 'font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:#64748B;font-weight:600;';

  function renderSlicer(id, label, options, dashboardId) {
    var html = '<div style="' + slicerStyle + '">';
    html += '<label style="' + labelStyle + '" for="' + id + '">' + escSvg(label) + '</label>';
    html += '<select id="' + id + '" style="' + selectStyle + '" onchange="Charts.refresh(\'' + dashboardId + '\')">';
    html += '<option value="">All</option>';
    options.forEach(function (opt) {
      html += '<option value="' + escSvg(opt) + '">' + escSvg(opt) + '</option>';
    });
    html += '</select></div>';
    return html;
  }

  function getSlicerValue(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function renderSlicerBar(slicers, dashboardId) {
    var html = '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;padding:14px 16px;background:#fff;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:16px">';
    html += '<div style="' + labelStyle + 'align-self:center;margin-right:4px;font-size:0.75rem;color:#2563EB">\u25c9 SLICERS</div>';
    slicers.forEach(function (s) {
      html += renderSlicer(s.id, s.label, s.options, dashboardId);
    });
    html += '<button onclick="Charts.resetSlicers(\'' + dashboardId + '\')" style="padding:6px 14px;border:1px solid #CBD5E1;border-radius:6px;background:#F8FAFC;color:#64748B;font-size:0.78rem;cursor:pointer;align-self:flex-end;font-family:inherit">Reset All</button>';
    html += '</div>';
    return html;
  }

  function resetSlicers(dashboardId) {
    var container = document.getElementById('dashboard-' + dashboardId);
    if (!container) return;
    var selects = container.querySelectorAll('select');
    selects.forEach(function (s) { s.value = ''; });
    refresh(dashboardId);
  }

  // ══════════════════════════════════════════
  // CHART RENDERERS (pure SVG string functions)
  // ══════════════════════════════════════════

  function kpiCard(label, value, subtext, color) {
    color = color || '#2563EB';
    return '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:16px 20px;text-align:center;border-top:3px solid ' + color + '">' +
      '<div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;color:#64748B;font-weight:600">' + escSvg(label) + '</div>' +
      '<div style="font-size:1.5rem;font-weight:800;color:#1E293B;margin:4px 0">' + escSvg(value) + '</div>' +
      (subtext ? '<div style="font-size:0.78rem;color:#64748B">' + escSvg(subtext) + '</div>' : '') +
      '</div>';
  }

  function barChartH(data, opts) {
    opts = opts || {};
    var w = opts.width || 500, h = Math.max(200, data.length * 36 + 40);
    var maxVal = Math.max.apply(null, data.map(function (d) { return d.value; }));
    if (maxVal <= 0) maxVal = 1;
    var labelW = opts.labelWidth || 140;
    var barArea = w - labelW - 80;

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + w + 'px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">';
    if (opts.title) svg += '<text x="' + (w / 2) + '" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="#1E293B">' + escSvg(opts.title) + '</text>';

    data.forEach(function (d, i) {
      var y = 32 + i * 36;
      var barW = (d.value / maxVal) * barArea;
      var color = COLORS[i % COLORS.length];
      svg += '<text x="' + (labelW - 8) + '" y="' + (y + 16) + '" text-anchor="end" font-size="11" fill="#334155">' + escSvg(truncate(d.key, 18)) + '</text>';
      svg += '<rect x="' + labelW + '" y="' + (y + 2) + '" width="' + barArea + '" height="22" rx="4" fill="#F1F5F9"/>';
      svg += '<rect x="' + labelW + '" y="' + (y + 2) + '" width="' + Math.max(barW, 2) + '" height="22" rx="4" fill="' + color + '" opacity="0.85"/>';
      svg += '<text x="' + (labelW + barW + 6) + '" y="' + (y + 17) + '" font-size="11" font-weight="600" fill="#334155">' + escSvg(opts.formatValue ? opts.formatValue(d.value) : fmt(d.value)) + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function barChartV(data, opts) {
    opts = opts || {};
    var w = opts.width || 600, h = opts.height || 280;
    var padding = { top: 30, right: 20, bottom: 60, left: 60 };
    var plotW = w - padding.left - padding.right;
    var plotH = h - padding.top - padding.bottom;
    var maxVal = Math.max.apply(null, data.map(function (d) { return d.value; }));
    if (maxVal <= 0) maxVal = 1;
    var barW = Math.min(plotW / data.length * 0.65, 40);
    var gap = plotW / data.length;

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + w + 'px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">';
    if (opts.title) svg += '<text x="' + (w / 2) + '" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="#1E293B">' + escSvg(opts.title) + '</text>';

    for (var g = 0; g <= 4; g++) {
      var gy = padding.top + plotH - (g / 4) * plotH;
      svg += '<line x1="' + padding.left + '" y1="' + gy + '" x2="' + (w - padding.right) + '" y2="' + gy + '" stroke="#E2E8F0" stroke-width="1"/>';
      svg += '<text x="' + (padding.left - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="10" fill="#94A3B8">' + escSvg(opts.formatValue ? opts.formatValue(maxVal * g / 4) : fmt(maxVal * g / 4)) + '</text>';
    }

    data.forEach(function (d, i) {
      var x = padding.left + i * gap + (gap - barW) / 2;
      var barH = (d.value / maxVal) * plotH;
      var y = padding.top + plotH - barH;
      var color = opts.singleColor || COLORS[i % COLORS.length];
      svg += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + barH + '" rx="3" fill="' + color + '" opacity="0.85"/>';
      if (opts.showValues !== false) svg += '<text x="' + (x + barW / 2) + '" y="' + (y - 5) + '" text-anchor="middle" font-size="9" font-weight="600" fill="#334155">' + escSvg(opts.formatValue ? opts.formatValue(d.value) : fmt(d.value)) + '</text>';
      svg += '<text x="' + (x + barW / 2) + '" y="' + (padding.top + plotH + 16) + '" text-anchor="middle" font-size="9" fill="#64748B" transform="rotate(-30,' + (x + barW / 2) + ',' + (padding.top + plotH + 16) + ')">' + escSvg(truncate(d.key, 12)) + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function lineChart(series, opts) {
    opts = opts || {};
    var w = opts.width || 600, h = opts.height || 260;
    var padding = { top: 30, right: 20, bottom: 50, left: 60 };
    var plotW = w - padding.left - padding.right;
    var plotH = h - padding.top - padding.bottom;

    var allVals = [];
    series.forEach(function (s) { s.data.forEach(function (d) { allVals.push(d.value); }); });
    var maxVal = Math.max.apply(null, allVals);
    var minVal = Math.min(0, Math.min.apply(null, allVals));
    var range = maxVal - minVal || 1;
    var labels = series[0].data.map(function (d) { return d.key; });
    var xStep = labels.length > 1 ? plotW / (labels.length - 1) : plotW;

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + w + 'px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">';
    if (opts.title) svg += '<text x="' + (w / 2) + '" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="#1E293B">' + escSvg(opts.title) + '</text>';

    for (var g = 0; g <= 4; g++) {
      var gy = padding.top + plotH - (g / 4) * plotH;
      svg += '<line x1="' + padding.left + '" y1="' + gy + '" x2="' + (w - padding.right) + '" y2="' + gy + '" stroke="#E2E8F0" stroke-width="1"/>';
      svg += '<text x="' + (padding.left - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="10" fill="#94A3B8">' + escSvg(fmt(minVal + range * g / 4)) + '</text>';
    }
    labels.forEach(function (lbl, i) {
      var x = padding.left + i * xStep;
      var display = lbl.length > 7 ? lbl.slice(5) : lbl;
      svg += '<text x="' + x + '" y="' + (padding.top + plotH + 20) + '" text-anchor="middle" font-size="9" fill="#64748B">' + escSvg(display) + '</text>';
    });

    series.forEach(function (s, si) {
      var color = s.color || COLORS[si % COLORS.length];
      var points = s.data.map(function (d, i) {
        return { x: padding.left + i * xStep, y: padding.top + plotH - ((d.value - minVal) / range) * plotH };
      });
      svg += '<path d="' + points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x + ',' + p.y; }).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      points.forEach(function (p) { svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="' + color + '" stroke="#fff" stroke-width="1.5"/>'; });
      if (series.length > 1) {
        var lx = padding.left + si * 120;
        svg += '<rect x="' + lx + '" y="' + (h - 10) + '" width="10" height="3" rx="1" fill="' + color + '"/>';
        svg += '<text x="' + (lx + 14) + '" y="' + (h - 6) + '" font-size="9" fill="#64748B">' + escSvg(s.name) + '</text>';
      }
    });
    svg += '</svg>';
    return svg;
  }

  function donutChart(data, opts) {
    opts = opts || {};
    var w = opts.width || 320, h = opts.height || 260;
    var cx = w * 0.42, cy = h / 2 + 5;
    var r = Math.min(cx, cy) - 30;
    var inner = r * 0.55;
    var total = data.reduce(function (s, d) { return s + d.value; }, 0);

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + w + 'px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">';
    if (opts.title) svg += '<text x="' + (w / 2) + '" y="16" text-anchor="middle" font-size="13" font-weight="700" fill="#1E293B">' + escSvg(opts.title) + '</text>';

    var angle = -Math.PI / 2;
    data.forEach(function (d, i) {
      var pct = total > 0 ? d.value / total : 0;
      var sweep = pct * 2 * Math.PI;
      if (sweep < 0.01) { angle += sweep; return; }
      var x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      var x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep);
      var ix1 = cx + inner * Math.cos(angle), iy1 = cy + inner * Math.sin(angle);
      var ix2 = cx + inner * Math.cos(angle + sweep), iy2 = cy + inner * Math.sin(angle + sweep);
      var large = sweep > Math.PI ? 1 : 0;
      svg += '<path d="M' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + large + ',1 ' + x2 + ',' + y2 + ' L' + ix2 + ',' + iy2 + ' A' + inner + ',' + inner + ' 0 ' + large + ',0 ' + ix1 + ',' + iy1 + ' Z" fill="' + COLORS[i % COLORS.length] + '" opacity="0.85"/>';
      angle += sweep;
    });

    if (opts.centerLabel) {
      svg += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="9" fill="#94A3B8">' + escSvg(opts.centerLabel) + '</text>';
      svg += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="16" font-weight="800" fill="#1E293B">' + escSvg(opts.centerValue || '') + '</text>';
    }
    var legendX = w * 0.72;
    data.forEach(function (d, i) {
      var ly = 35 + i * 22;
      var pct = total > 0 ? (d.value / total * 100).toFixed(1) : '0';
      svg += '<rect x="' + legendX + '" y="' + ly + '" width="10" height="10" rx="2" fill="' + COLORS[i % COLORS.length] + '"/>';
      svg += '<text x="' + (legendX + 15) + '" y="' + (ly + 9) + '" font-size="10" fill="#334155">' + escSvg(truncate(d.key, 14)) + ' (' + pct + '%)</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function scatterPlot(data, opts) {
    opts = opts || {};
    var w = opts.width || 500, h = opts.height || 300;
    var padding = { top: 30, right: 20, bottom: 45, left: 65 };
    var plotW = w - padding.left - padding.right;
    var plotH = h - padding.top - padding.bottom;
    var maxX = Math.max.apply(null, data.map(function (d) { return d.x; })) || 1;
    var maxY = Math.max.apply(null, data.map(function (d) { return d.y; })) || 1;

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + w + 'px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">';
    if (opts.title) svg += '<text x="' + (w / 2) + '" y="16" text-anchor="middle" font-size="13" font-weight="700" fill="#1E293B">' + escSvg(opts.title) + '</text>';
    for (var g = 0; g <= 4; g++) {
      var gy = padding.top + plotH - (g / 4) * plotH;
      svg += '<line x1="' + padding.left + '" y1="' + gy + '" x2="' + (w - padding.right) + '" y2="' + gy + '" stroke="#F1F5F9" stroke-width="1"/>';
      svg += '<text x="' + (padding.left - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="9" fill="#94A3B8">' + escSvg(opts.yFormat ? opts.yFormat(maxY * g / 4) : (maxY * g / 4).toFixed(0)) + '</text>';
    }
    svg += '<text x="' + (padding.left + plotW / 2) + '" y="' + (h - 5) + '" text-anchor="middle" font-size="10" fill="#64748B">' + escSvg(opts.xLabel || '') + '</text>';
    svg += '<text x="15" y="' + (padding.top + plotH / 2) + '" text-anchor="middle" font-size="10" fill="#64748B" transform="rotate(-90,15,' + (padding.top + plotH / 2) + ')">' + escSvg(opts.yLabel || '') + '</text>';

    data.forEach(function (d, i) {
      var px = padding.left + (d.x / maxX) * plotW;
      var py = padding.top + plotH - (d.y / maxY) * plotH;
      svg += '<circle cx="' + px + '" cy="' + py + '" r="' + (d.size || 5) + '" fill="' + (d.color || COLORS[i % COLORS.length]) + '" opacity="0.7" stroke="#fff" stroke-width="1"/>';
      if (opts.showLabels && d.label) svg += '<text x="' + (px + (d.size || 5) + 3) + '" y="' + (py + 3) + '" font-size="8" fill="#64748B">' + escSvg(truncate(d.label, 12)) + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function treemap(data, opts) {
    opts = opts || {};
    var w = opts.width || 600, h = opts.height || 250;
    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    if (total <= 0) return '';

    var svg = '<svg viewBox="0 0 ' + w + ' ' + (h + 20) + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + w + 'px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">';
    if (opts.title) svg += '<text x="' + (w / 2) + '" y="16" text-anchor="middle" font-size="13" font-weight="700" fill="#1E293B">' + escSvg(opts.title) + '</text>';

    var x = 0, topY = 24;
    sortBy(data, 'value', true).forEach(function (d, i) {
      var boxW = (d.value / total) * w;
      if (boxW < 2) return;
      svg += '<rect x="' + x + '" y="' + topY + '" width="' + boxW + '" height="' + h + '" fill="' + COLORS[i % COLORS.length] + '" opacity="0.8" stroke="#fff" stroke-width="2"/>';
      if (boxW > 45) {
        svg += '<text x="' + (x + boxW / 2) + '" y="' + (topY + h / 2 - 6) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">' + escSvg(truncate(d.key, Math.floor(boxW / 7))) + '</text>';
        svg += '<text x="' + (x + boxW / 2) + '" y="' + (topY + h / 2 + 10) + '" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.85)">' + escSvg(fmt(d.value)) + '</text>';
        svg += '<text x="' + (x + boxW / 2) + '" y="' + (topY + h / 2 + 24) + '" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.7)">' + (d.value / total * 100).toFixed(1) + '%</text>';
      }
      x += boxW;
    });
    svg += '</svg>';
    return svg;
  }

  function usMapChart(storeData, opts) {
    opts = opts || {};
    var w = opts.width || 700, h = opts.height || 420;
    var sizeField = opts.sizeField || 'revenue';

    // Simple Mercator-like projection for continental US
    function projX(lng) { return (lng + 130) * (w / 65); }
    function projY(lat) { return (52 - lat) * (h / 30); }

    // Determine size scale from data
    var maxSize = 0;
    storeData.forEach(function (d) { if (d[sizeField] > maxSize) maxSize = d[sizeField]; });
    if (maxSize <= 0) maxSize = 1;

    // Build region -> color map
    var regionSet = {};
    var regionIndex = 0;
    storeData.forEach(function (d) {
      if (!regionSet[d.region]) { regionSet[d.region] = COLORS[regionIndex % COLORS.length]; regionIndex++; }
    });

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + w + 'px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">';
    if (opts.title) svg += '<text x="' + (w / 2) + '" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="#1E293B">' + escSvg(opts.title) + '</text>';

    // Simplified continental US outline
    svg += '<path d="' +
      'M' + projX(-124.7) + ',' + projY(48.4) +
      ' L' + projX(-123.0) + ',' + projY(48.4) +
      ' L' + projX(-122.4) + ',' + projY(47.5) +
      ' L' + projX(-124.5) + ',' + projY(42.0) +
      ' L' + projX(-124.2) + ',' + projY(40.0) +
      ' L' + projX(-122.5) + ',' + projY(37.8) +
      ' L' + projX(-120.5) + ',' + projY(34.5) +
      ' L' + projX(-118.5) + ',' + projY(34.0) +
      ' L' + projX(-117.2) + ',' + projY(32.5) +
      ' L' + projX(-114.7) + ',' + projY(32.7) +
      ' L' + projX(-111.0) + ',' + projY(31.3) +
      ' L' + projX(-108.2) + ',' + projY(31.8) +
      ' L' + projX(-106.5) + ',' + projY(31.8) +
      ' L' + projX(-104.0) + ',' + projY(30.0) +
      ' L' + projX(-103.0) + ',' + projY(29.0) +
      ' L' + projX(-100.0) + ',' + projY(26.5) +
      ' L' + projX(-97.5) + ',' + projY(25.9) +
      ' L' + projX(-97.2) + ',' + projY(27.8) +
      ' L' + projX(-94.0) + ',' + projY(29.4) +
      ' L' + projX(-90.0) + ',' + projY(29.0) +
      ' L' + projX(-89.0) + ',' + projY(29.2) +
      ' L' + projX(-88.8) + ',' + projY(30.2) +
      ' L' + projX(-86.5) + ',' + projY(30.3) +
      ' L' + projX(-85.0) + ',' + projY(29.7) +
      ' L' + projX(-83.0) + ',' + projY(29.0) +
      ' L' + projX(-81.0) + ',' + projY(25.2) +
      ' L' + projX(-80.0) + ',' + projY(25.8) +
      ' L' + projX(-80.5) + ',' + projY(28.5) +
      ' L' + projX(-81.2) + ',' + projY(31.0) +
      ' L' + projX(-80.8) + ',' + projY(32.1) +
      ' L' + projX(-78.5) + ',' + projY(33.9) +
      ' L' + projX(-75.5) + ',' + projY(35.5) +
      ' L' + projX(-75.5) + ',' + projY(37.0) +
      ' L' + projX(-76.0) + ',' + projY(38.0) +
      ' L' + projX(-75.0) + ',' + projY(38.8) +
      ' L' + projX(-74.0) + ',' + projY(39.5) +
      ' L' + projX(-73.8) + ',' + projY(40.6) +
      ' L' + projX(-72.0) + ',' + projY(41.0) +
      ' L' + projX(-71.0) + ',' + projY(41.5) +
      ' L' + projX(-70.0) + ',' + projY(41.8) +
      ' L' + projX(-70.0) + ',' + projY(43.0) +
      ' L' + projX(-67.0) + ',' + projY(44.8) +
      ' L' + projX(-67.0) + ',' + projY(47.0) +
      ' L' + projX(-69.0) + ',' + projY(47.4) +
      ' L' + projX(-70.0) + ',' + projY(46.0) +
      ' L' + projX(-75.0) + ',' + projY(45.0) +
      ' L' + projX(-79.0) + ',' + projY(43.5) +
      ' L' + projX(-82.5) + ',' + projY(42.0) +
      ' L' + projX(-83.5) + ',' + projY(42.3) +
      ' L' + projX(-84.5) + ',' + projY(46.5) +
      ' L' + projX(-88.0) + ',' + projY(48.0) +
      ' L' + projX(-89.5) + ',' + projY(48.0) +
      ' L' + projX(-95.0) + ',' + projY(49.0) +
      ' L' + projX(-104.0) + ',' + projY(49.0) +
      ' L' + projX(-116.0) + ',' + projY(49.0) +
      ' L' + projX(-124.7) + ',' + projY(48.4) +
      ' Z" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>';

    // Plot store bubbles
    storeData.forEach(function (d) {
      var cx = projX(d.longitude);
      var cy = projY(d.latitude);
      var radius = Math.max(6, Math.min(28, Math.sqrt(d[sizeField] / maxSize) * 28));
      var color = regionSet[d.region] || COLORS[0];
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="' + color + '" opacity="0.7" stroke="#fff" stroke-width="1.5"/>';
      svg += '<text x="' + (cx + radius + 4) + '" y="' + (cy + 3) + '" font-size="9" fill="#334155" font-weight="600">' + escSvg(d.city) + '</text>';
    });

    // Legend
    var regionKeys = Object.keys(regionSet);
    var legendX = w - 130;
    var legendY = 30;
    svg += '<rect x="' + (legendX - 8) + '" y="' + (legendY - 12) + '" width="130" height="' + (regionKeys.length * 20 + 20) + '" rx="6" fill="#fff" stroke="#E2E8F0" stroke-width="1"/>';
    svg += '<text x="' + legendX + '" y="' + (legendY + 2) + '" font-size="10" font-weight="700" fill="#1E293B">Regions</text>';
    regionKeys.forEach(function (region, i) {
      var ly = legendY + 18 + i * 20;
      svg += '<rect x="' + legendX + '" y="' + (ly - 8) + '" width="10" height="10" rx="2" fill="' + regionSet[region] + '"/>';
      svg += '<text x="' + (legendX + 16) + '" y="' + (ly + 1) + '" font-size="9" fill="#334155">' + escSvg(region) + '</text>';
    });

    svg += '</svg>';
    return svg;
  }

  function dataTable(headers, rows) {
    var html = '<div class="table-wrapper" style="margin:0"><table class="data-table"><thead><tr>';
    headers.forEach(function (h) { html += '<th>' + escSvg(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (row) { html += '<tr>'; row.forEach(function (cell) { html += '<td>' + cell + '</td>'; }); html += '</tr>'; });
    html += '</tbody></table></div>';
    return html;
  }

  // ══════════════════════════════════════════
  // FILTER ENGINE
  // ══════════════════════════════════════════

  function applyFilters(data, filters) {
    return data.filter(function (r) {
      for (var key in filters) {
        if (filters[key] && r[key] !== filters[key]) return false;
      }
      return true;
    });
  }

  function readFilters(dashboardId) {
    var prefix = 'slicer-' + dashboardId + '-';
    var filters = {};
    var selects = document.querySelectorAll('[id^="' + prefix + '"]');
    selects.forEach(function (el) {
      var field = el.id.replace(prefix, '');
      if (el.value) filters[field] = el.value;
    });
    return filters;
  }

  function activeFilterSummary(filters) {
    var parts = [];
    for (var k in filters) {
      if (filters[k]) parts.push('<span style="background:#DBEAFE;color:#2563EB;padding:2px 8px;border-radius:99px;font-size:0.72rem;font-weight:600">' + escSvg(k) + ': ' + escSvg(filters[k]) + '</span>');
    }
    if (parts.length === 0) return '<span style="font-size:0.78rem;color:#94A3B8">No filters applied — showing all data</span>';
    return '<span style="font-size:0.78rem;color:#64748B;margin-right:6px">Active filters:</span>' + parts.join(' ');
  }

  // ══════════════════════════════════════════
  // DASHBOARD BUILDERS (return shell + charts)
  // ══════════════════════════════════════════

  // Each builder returns shell HTML with slicers and a chart container.
  // The `renderCharts_*` functions fill just the chart area on refresh.

  function buildExecutiveOverview() {
    var agg = getAggregated();
    if (!agg) return '<p>Data not available.</p>';
    var opts = agg.slicerOptions;
    var id = 'exec';

    var html = '<div id="dashboard-' + id + '">';
    html += renderSlicerBar([
      { id: 'slicer-' + id + '-year', label: 'Year', options: opts.years },
      { id: 'slicer-' + id + '-region', label: 'Region', options: opts.regions },
      { id: 'slicer-' + id + '-store_name', label: 'Store', options: opts.stores },
      { id: 'slicer-' + id + '-category', label: 'Category', options: opts.categories }
    ], id);
    html += '<div id="filter-summary-' + id + '" style="margin-bottom:12px">' + activeFilterSummary({}) + '</div>';
    html += '<div id="charts-' + id + '">' + renderExecCharts(agg.clean) + '</div>';
    html += '</div>';

    return html;
  }

  function renderExecCharts(data) {
    var totalRev = data.reduce(function (s, r) { return s + r.revenue; }, 0);
    var totalCost = data.reduce(function (s, r) { return s + r.cost; }, 0);
    var profit = totalRev - totalCost;
    var margin = totalRev > 0 ? profit / totalRev : 0;
    var txCount = distinctCount(data, function (r) { return r.transaction_id; });
    var custCount = distinctCount(data, function (r) { return r.customer_id || 'walk-in'; });

    var html = '';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
    html += kpiCard('Total Revenue', fmt(totalRev), fmtNum(data.length) + ' line items', '#2563EB');
    html += kpiCard('Gross Profit', fmt(profit), 'Revenue - COGS', '#10B981');
    html += kpiCard('Profit Margin', fmtPct(margin), 'Profit / Revenue', '#8B5CF6');
    html += kpiCard('Transactions', fmtNum(txCount), 'Unique transactions', '#F59E0B');
    html += kpiCard('Avg Basket', fmt(txCount > 0 ? totalRev / txCount : 0), 'Revenue / Transaction', '#EC4899');
    html += kpiCard('Customers', fmtNum(custCount), 'Unique buyers', '#06B6D4');
    html += '</div>';

    var monthly = sortBy(groupBy(data, function (r) { return r.month; }, function (r) { return r.revenue; }), 'key', false);
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += lineChart([{ name: 'Revenue', data: monthly, color: '#2563EB' }], { title: 'Monthly Revenue Trend', width: 520, height: 220 });
    html += '</div>';

    var byStore = sortBy(groupBy(data, function (r) { return r.store_name.replace('FreshMart ', ''); }, function (r) { return r.revenue; }), 'value', true);
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += barChartH(byStore, { title: 'Revenue by Store', width: 440, labelWidth: 110 });
    html += '</div></div>';

    var byCat = sortBy(groupBy(data, function (r) { return r.category; }, function (r) { return r.revenue; }), 'value', true);
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += donutChart(byCat, { title: 'Revenue by Category', centerLabel: 'Total', centerValue: fmt(totalRev), width: 380 });
    html += '</div>';

    var byProd = sortBy(groupBy(data, function (r) { return r.product_name; }, function (r) { return r.revenue; }), 'value', true).slice(0, 10);
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += '<div style="font-size:13px;font-weight:700;color:#1E293B;margin-bottom:8px;text-align:center">Top 10 Products by Revenue</div>';
    html += dataTable(['#', 'Product', 'Revenue'], byProd.map(function (p, i) {
      return ['<strong>' + (i + 1) + '</strong>', escSvg(p.key), '<strong>' + fmt(p.value) + '</strong>'];
    }));
    html += '</div></div>';
    return html;
  }

  function buildStorePerformance() {
    var agg = getAggregated();
    if (!agg) return '<p>Data not available.</p>';
    var opts = agg.slicerOptions;
    var id = 'store';

    var html = '<div id="dashboard-' + id + '">';
    html += renderSlicerBar([
      { id: 'slicer-' + id + '-year', label: 'Year', options: opts.years },
      { id: 'slicer-' + id + '-region', label: 'Region', options: opts.regions },
      { id: 'slicer-' + id + '-category', label: 'Category', options: opts.categories }
    ], id);
    html += '<div id="filter-summary-' + id + '" style="margin-bottom:12px">' + activeFilterSummary({}) + '</div>';
    html += '<div id="charts-' + id + '">' + renderStoreCharts(agg.clean, agg.storeList) + '</div>';
    html += '</div>';
    return html;
  }

  function renderStoreCharts(data, storeList) {
    var html = '';

    var byStore = sortBy(groupBy(data, function (r) { return r.store_name.replace('FreshMart ', ''); }, function (r) { return r.revenue; }), 'value', true);
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px;margin-bottom:16px">';
    html += barChartV(byStore, { title: 'Revenue by Store', width: 600, height: 260, singleColor: '#2563EB' });
    html += '</div>';

    var storeNames = ['Downtown', 'Westside', 'Lakeside', 'Central', 'Plaza'];
    var allMonths = sortBy(groupBy(data, function (r) { return r.month; }, function () { return 0; }), 'key', false).map(function (m) { return m.key; });
    if (allMonths.length > 0) {
      var storeSeries = storeNames.map(function (sn, si) {
        var sd = data.filter(function (r) { return r.store_name.indexOf(sn) >= 0; });
        var monthly = groupBy(sd, function (r) { return r.month; }, function (r) { return r.revenue; });
        var mMap = {}; monthly.forEach(function (m) { mMap[m.key] = m.value; });
        return { name: sn, color: COLORS[si], data: allMonths.map(function (m) { return { key: m, value: mMap[m] || 0 }; }) };
      }).filter(function (s) { return s.data.some(function (d) { return d.value > 0; }); });

      if (storeSeries.length > 0) {
        html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px;margin-bottom:16px">';
        html += lineChart(storeSeries, { title: 'Monthly Revenue Trend by Store', width: 700, height: 280 });
        html += '</div>';
      }
    }

    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += '<div style="font-size:13px;font-weight:700;color:#1E293B;margin-bottom:8px;text-align:center">Store Performance Matrix</div>';
    var storeRows = storeList.map(function (store) {
      var sd = data.filter(function (r) { return r.store_id === store.store_id; });
      var rev = sd.reduce(function (s, r) { return s + r.revenue; }, 0);
      var cost = sd.reduce(function (s, r) { return s + r.cost; }, 0);
      var txn = distinctCount(sd, function (r) { return r.transaction_id; });
      var cust = distinctCount(sd, function (r) { return r.customer_id || 'w'; });
      return [escSvg(store.store_name.replace('FreshMart ', '')), store.region, fmt(rev), fmtPct(rev > 0 ? (rev - cost) / rev : 0), fmtNum(txn), fmt(txn > 0 ? rev / txn : 0), fmtNum(cust)];
    });
    html += dataTable(['Store', 'Region', 'Revenue', 'Margin', 'Txns', 'Avg Basket', 'Customers'], storeRows);
    html += '</div>';
    return html;
  }

  function buildProductAnalysis() {
    var agg = getAggregated();
    if (!agg) return '<p>Data not available.</p>';
    var opts = agg.slicerOptions;
    var id = 'product';

    var html = '<div id="dashboard-' + id + '">';
    html += renderSlicerBar([
      { id: 'slicer-' + id + '-year', label: 'Year', options: opts.years },
      { id: 'slicer-' + id + '-store_name', label: 'Store', options: opts.stores },
      { id: 'slicer-' + id + '-category', label: 'Category', options: opts.categories },
      { id: 'slicer-' + id + '-brand', label: 'Brand', options: (function () { var b = {}; agg.clean.forEach(function (r) { b[r.brand] = 1; }); return Object.keys(b).sort(); })() }
    ], id);
    html += '<div id="filter-summary-' + id + '" style="margin-bottom:12px">' + activeFilterSummary({}) + '</div>';
    html += '<div id="charts-' + id + '">' + renderProductCharts(agg.clean) + '</div>';
    html += '</div>';
    return html;
  }

  function renderProductCharts(data) {
    var html = '';
    var totalRev = data.reduce(function (s, r) { return s + r.revenue; }, 0);

    var byCat = sortBy(groupBy(data, function (r) { return r.category; }, function (r) { return r.revenue; }), 'value', true);
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px;margin-bottom:16px">';
    html += treemap(byCat, { title: 'Revenue by Category', width: 700, height: 200 });
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
    var byProd = sortBy(groupBy(data, function (r) { return r.product_name; }, function (r) { return r.revenue; }), 'value', true).slice(0, 10);
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += barChartH(byProd, { title: 'Top 10 Products by Revenue', width: 420, labelWidth: 140 });
    html += '</div>';

    var prodAgg = {};
    data.forEach(function (r) {
      if (!prodAgg[r.product_name]) prodAgg[r.product_name] = { rev: 0, cost: 0 };
      prodAgg[r.product_name].rev += r.revenue;
      prodAgg[r.product_name].cost += r.cost;
    });
    var scatterData = Object.keys(prodAgg).map(function (name, i) {
      var p = prodAgg[name];
      return { x: p.rev, y: p.rev > 0 ? (p.rev - p.cost) / p.rev * 100 : 0, label: name, size: Math.max(3, Math.min(8, p.rev / 2000)), color: COLORS[i % COLORS.length] };
    });
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += scatterPlot(scatterData, { title: 'Revenue vs Margin % by Product', width: 420, height: 260, xLabel: 'Revenue ($)', yLabel: 'Margin %', yFormat: function (v) { return v.toFixed(0) + '%'; }, showLabels: true });
    html += '</div></div>';

    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += '<div style="font-size:13px;font-weight:700;color:#1E293B;margin-bottom:8px;text-align:center">Category Profitability Breakdown</div>';
    var catRows = byCat.map(function (cat) {
      var cd = data.filter(function (r) { return r.category === cat.key; });
      var rev = cat.value, cost = cd.reduce(function (s, r) { return s + r.cost; }, 0), profit = rev - cost;
      return ['<strong>' + escSvg(cat.key) + '</strong>', fmt(rev), fmtPct(totalRev > 0 ? rev / totalRev : 0), fmt(cost), fmt(profit), fmtPct(rev > 0 ? profit / rev : 0), fmtNum(cd.length)];
    });
    html += dataTable(['Category', 'Revenue', '% of Total', 'Cost', 'Profit', 'Margin', 'Items'], catRows);
    html += '</div>';
    return html;
  }

  function buildCustomerInsights() {
    var agg = getAggregated();
    if (!agg) return '<p>Data not available.</p>';
    var opts = agg.slicerOptions;
    var id = 'customer';

    var html = '<div id="dashboard-' + id + '">';
    html += renderSlicerBar([
      { id: 'slicer-' + id + '-year', label: 'Year', options: opts.years },
      { id: 'slicer-' + id + '-membership', label: 'Membership Tier', options: opts.tiers },
      { id: 'slicer-' + id + '-store_name', label: 'Store', options: opts.stores },
      { id: 'slicer-' + id + '-region', label: 'Region', options: opts.regions }
    ], id);
    html += '<div id="filter-summary-' + id + '" style="margin-bottom:12px">' + activeFilterSummary({}) + '</div>';
    html += '<div id="charts-' + id + '">' + renderCustomerCharts(agg.clean, agg.customerList) + '</div>';
    html += '</div>';
    return html;
  }

  function renderCustomerCharts(data, customerList) {
    var html = '';
    var custCount = distinctCount(data, function (r) { return r.customer_id || 'walk-in'; });
    var totalRev = data.reduce(function (s, r) { return s + r.revenue; }, 0);
    var goldCount = distinctCount(data.filter(function (r) { return r.membership === 'Gold'; }), function (r) { return r.customer_id; });

    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px">';
    html += kpiCard('Total Customers', fmtNum(custCount), 'Unique buyers', '#06B6D4');
    html += kpiCard('Revenue / Customer', fmt(custCount > 0 ? totalRev / custCount : 0), 'Average spend', '#8B5CF6');
    html += kpiCard('Gold Members', fmtNum(goldCount), 'Premium tier', '#F59E0B');
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
    var byTier = sortBy(groupBy(data, function (r) { return r.membership; }, function (r) { return r.revenue; }), 'value', true);
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += donutChart(byTier, { title: 'Revenue by Membership Tier', centerLabel: 'Revenue', centerValue: fmt(totalRev), width: 380 });
    html += '</div>';

    var tierCounts = sortBy(groupBy(data, function (r) { return r.membership; }, function () { return 1; }), 'value', true)
      .map(function (t) { return { key: t.key, value: distinctCount(data.filter(function (r) { return r.membership === t.key; }), function (r) { return r.customer_id || 'w'; }) }; });
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += barChartV(tierCounts, { title: 'Customer Count by Tier', width: 400, height: 240, formatValue: fmtNum });
    html += '</div></div>';

    var monthlyCustomers = {};
    data.forEach(function (r) { if (!r.customer_id) return; if (!monthlyCustomers[r.month]) monthlyCustomers[r.month] = {}; monthlyCustomers[r.month][r.customer_id] = true; });
    var custMonthly = Object.keys(monthlyCustomers).sort().map(function (m) { return { key: m, value: Object.keys(monthlyCustomers[m]).length }; });
    if (custMonthly.length > 0) {
      html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px;margin-bottom:16px">';
      html += lineChart([{ name: 'Active Customers', data: custMonthly, color: '#06B6D4' }], { title: 'Active Customers per Month', width: 700, height: 220 });
      html += '</div>';
    }

    var custRev = {};
    data.forEach(function (r) { if (!r.customer_id) return; if (!custRev[r.customer_id]) custRev[r.customer_id] = { rev: 0, txn: {} }; custRev[r.customer_id].rev += r.revenue; custRev[r.customer_id].txn[r.transaction_id] = true; });
    var custMap = {};
    customerList.forEach(function (c) { custMap[c.customer_id] = c; });
    var topCust = Object.keys(custRev).map(function (id) {
      var c = custMap[id] || {};
      return { name: (c.first_name || '') + ' ' + (c.last_name || ''), tier: c.membership_tier || 'N/A', rev: custRev[id].rev, txn: Object.keys(custRev[id].txn).length };
    });
    topCust.sort(function (a, b) { return b.rev - a.rev; });
    topCust = topCust.slice(0, 10);

    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += '<div style="font-size:13px;font-weight:700;color:#1E293B;margin-bottom:8px;text-align:center">Top 10 Customers by Revenue</div>';
    html += dataTable(['#', 'Customer', 'Tier', 'Revenue', 'Transactions', 'Avg / Txn'],
      topCust.map(function (c, i) {
        return ['<strong>' + (i + 1) + '</strong>', escSvg(c.name), '<span class="tag">' + escSvg(c.tier) + '</span>', '<strong>' + fmt(c.rev) + '</strong>', fmtNum(c.txn), fmt(c.txn > 0 ? c.rev / c.txn : 0)];
      })
    );
    html += '</div>';
    return html;
  }

  function buildGeographicAnalysis() {
    var agg = getAggregated();
    if (!agg) return '<p>Data not available.</p>';
    var opts = agg.slicerOptions;
    var id = 'geo';

    var html = '<div id="dashboard-' + id + '">';
    html += renderSlicerBar([
      { id: 'slicer-' + id + '-year', label: 'Year', options: opts.years },
      { id: 'slicer-' + id + '-region', label: 'Region', options: opts.regions }
    ], id);
    html += '<div id="filter-summary-' + id + '" style="margin-bottom:12px">' + activeFilterSummary({}) + '</div>';
    html += '<div id="charts-' + id + '">' + renderGeoCharts(agg.clean, agg.storeList) + '</div>';
    html += '</div>';
    return html;
  }

  function renderGeoCharts(data, storeList) {
    var html = '';

    // Build per-store aggregations from the enriched/filtered data
    var storeAgg = {};
    data.forEach(function (r) {
      if (!storeAgg[r.store_id]) storeAgg[r.store_id] = { revenue: 0, count: 0 };
      storeAgg[r.store_id].revenue += r.revenue;
      storeAgg[r.store_id].count++;
    });

    // Merge store metadata with aggregated revenue
    var mapData = [];
    storeList.forEach(function (store) {
      var agg = storeAgg[store.store_id];
      if (!agg) return;
      mapData.push({
        store_id: store.store_id,
        store_name: store.store_name,
        city: store.city,
        state: store.state,
        region: store.region,
        latitude: store.latitude,
        longitude: store.longitude,
        sqft: store.sqft,
        revenue: agg.revenue,
        num_stores: 1
      });
    });

    var totalStores = mapData.length;
    var totalRev = mapData.reduce(function (s, d) { return s + d.revenue; }, 0);
    var avgRev = totalStores > 0 ? totalRev / totalStores : 0;

    // KPI cards
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
    html += kpiCard('Total Stores', fmtNum(totalStores), 'Active locations', '#2563EB');
    html += kpiCard('Total Revenue', fmt(totalRev), fmtNum(totalStores) + ' stores', '#10B981');
    html += kpiCard('Avg Revenue / Store', fmt(avgRev), 'Mean per location', '#8B5CF6');
    html += '</div>';

    // US map with store bubbles
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px;margin-bottom:16px">';
    html += usMapChart(mapData, { title: 'Store Locations — Bubble Size = Revenue', width: 700, height: 420, sizeField: 'revenue' });
    html += '</div>';

    // Revenue by Region horizontal bar chart
    var byRegion = sortBy(groupBy(data, function (r) { return r.region; }, function (r) { return r.revenue; }), 'value', true);
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += barChartH(byRegion, { title: 'Revenue by Region', width: 440, labelWidth: 110 });
    html += '</div>';

    // Store detail table
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:12px">';
    html += '<div style="font-size:13px;font-weight:700;color:#1E293B;margin-bottom:8px;text-align:center">Store Geographic Details</div>';
    var tableRows = sortBy(mapData.map(function (d) { return { key: d.city, value: d.revenue, d: d }; }), 'value', true).map(function (item) {
      var d = item.d;
      return [escSvg(d.city), escSvg(d.state), d.latitude.toFixed(2), d.longitude.toFixed(2), '<strong>' + fmt(d.revenue) + '</strong>', fmtNum(d.num_stores)];
    });
    html += dataTable(['City', 'State', 'Lat', 'Lng', 'Revenue', 'Stores'], tableRows);
    html += '</div></div>';

    return html;
  }

  // ══════════════════════════════════════════
  // REFRESH — called when slicers change
  // ══════════════════════════════════════════

  function refresh(dashboardId) {
    var agg = getAggregated();
    if (!agg) return;

    var filters = readFilters(dashboardId);
    var filtered = applyFilters(agg.clean, filters);

    // Update filter summary
    var summaryEl = document.getElementById('filter-summary-' + dashboardId);
    if (summaryEl) summaryEl.innerHTML = activeFilterSummary(filters);

    // Re-render charts area
    var chartsEl = document.getElementById('charts-' + dashboardId);
    if (!chartsEl) return;

    var renderers = {
      'exec': function () { return renderExecCharts(filtered); },
      'store': function () { return renderStoreCharts(filtered, agg.storeList); },
      'product': function () { return renderProductCharts(filtered); },
      'customer': function () { return renderCustomerCharts(filtered, agg.customerList); },
      'geo': function () { return renderGeoCharts(filtered, agg.storeList); }
    };

    var renderer = renderers[dashboardId];
    if (renderer) chartsEl.innerHTML = renderer();
  }

  // ── Public API ──
  return {
    buildExecutiveOverview: buildExecutiveOverview,
    buildStorePerformance: buildStorePerformance,
    buildProductAnalysis: buildProductAnalysis,
    buildCustomerInsights: buildCustomerInsights,
    buildGeographicAnalysis: buildGeographicAnalysis,
    refresh: refresh,
    resetSlicers: resetSlicers
  };

})();
