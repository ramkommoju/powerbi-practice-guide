/* ============================================
   Power BI Practice Guide — UI Components
   ============================================ */

window.Components = (function () {

  // ---------- Scenario Card ----------
  function scenarioCard(meta) {
    const progress = getProgress(meta.id);
    const totalSections = meta.sections.length;
    const visited = Object.keys(progress.sections).length;
    const pct = totalSections ? Math.round((visited / totalSections) * 100) : 0;
    const diffClass = (meta.difficulty || '').toLowerCase().replace(/[^a-z]/g, '');

    return `
      <div class="scenario-card" onclick="window.location.hash='scenario/${meta.id}'">
        <div class="scenario-card-icon" style="background:${meta.iconBg || 'var(--color-primary-lighter)'}">
          ${meta.icon || '\ud83d\udcca'}
        </div>
        <h3>${meta.title}</h3>
        <div class="card-subtitle">${meta.subtitle}</div>
        <p class="card-desc">${meta.description}</p>
        <div class="card-meta">
          <span class="card-meta-item">\u23f1 ${meta.estimatedTime}</span>
          <span class="card-meta-item"><span class="difficulty-badge ${diffClass}">${meta.difficulty}</span></span>
        </div>
        <div class="card-tags">
          ${(meta.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="card-progress"><div class="card-progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }

  // ---------- Breadcrumb ----------
  function breadcrumb(items) {
    // items: [{ label, hash }, ...]  last item is current (no link)
    return items.map((item, i) => {
      if (i === items.length - 1) {
        return `<span class="breadcrumb-current">${item.label}</span>`;
      }
      return `<a href="#${item.hash}">${item.label}</a><span class="breadcrumb-sep">/</span>`;
    }).join('');
  }

  // ---------- Section Nav ----------
  function sectionNav(sections, activeSection, scenarioId) {
    const progress = getProgress(scenarioId);
    return sections.map(s => {
      const isActive = s.id === activeSection;
      const visited = progress.sections[s.id];
      return `<a class="section-tab ${isActive ? 'active' : ''}" href="#scenario/${scenarioId}/${s.id}">
        ${visited ? '<span class="tab-check">\u2713</span>' : ''}${s.label}
      </a>`;
    }).join('');
  }

  // ---------- Sidebar Nav ----------
  function sidebarNav(scenarios, activeId, activeSection) {
    let html = '<div class="sidebar-section-label">Projects</div>';
    scenarios.forEach(s => {
      const isActive = s.id === activeId;
      html += `<a class="sidebar-item ${isActive ? 'active' : ''}" href="#scenario/${s.id}">
        <span class="item-icon">${s.icon || '\ud83d\udcca'}</span> ${s.title}
      </a>`;

      if (isActive && s.sectionDefs) {
        s.sectionDefs.forEach(sec => {
          const secActive = sec.id === activeSection;
          html += `<a class="sidebar-item ${secActive ? 'active' : ''}" href="#scenario/${s.id}/${sec.id}" style="padding-left:2.8rem;font-size:0.8rem">
            <span class="item-icon">${sec.icon || '\u2022'}</span> ${sec.label}
          </a>`;
        });
      }
    });
    return html;
  }

  // ---------- Accordion ----------
  function accordion(id, title, contentHtml, opts = {}) {
    const openClass = opts.open ? ' open' : '';
    const icon = opts.icon || '';
    const badge = opts.badge ? `<span class="acc-badge" style="background:${opts.badgeBg || 'var(--color-primary-lighter)'};color:${opts.badgeColor || 'var(--color-primary)'}">${opts.badge}</span>` : '';

    return `
      <div class="accordion${openClass}" id="acc-${id}">
        <button class="accordion-header" onclick="Components.toggleAccordion('acc-${id}')">
          <span class="accordion-chevron">\u25b6</span>
          ${icon ? `<span class="acc-icon">${icon}</span>` : ''}
          <span class="acc-title">${title}</span>
          ${badge}
        </button>
        <div class="accordion-body">
          <div class="accordion-body-inner">${contentHtml}</div>
        </div>
      </div>`;
  }

  function toggleAccordion(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
  }

  // ---------- Code Block ----------
  function codeBlock(code, label = 'DAX', id) {
    const blockId = id || 'cb-' + Math.random().toString(36).slice(2, 8);
    return `
      <div class="code-block" id="${blockId}">
        <div class="code-block-header">
          <span class="code-block-label">${label}</span>
          <button class="code-block-copy" onclick="Components.copyCode('${blockId}')">Copy</button>
        </div>
        <pre>${highlightDAX(escapeHtml(code))}</pre>
      </div>`;
  }

  function copyCode(blockId) {
    const pre = document.querySelector(`#${blockId} pre`);
    if (!pre) return;
    const text = pre.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.querySelector(`#${blockId} .code-block-copy`);
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1500); }
    });
  }

  // ---------- DAX Syntax Highlighter ----------
  function highlightDAX(code) {
    const keywords = ['VAR', 'RETURN', 'TRUE', 'FALSE', 'BLANK', 'IN', 'NOT', 'OR', 'AND', 'IF', 'SWITCH'];
    const functions = Object.keys(window.DAXReference || {});

    // Highlight measure references [Measure Name]
    code = code.replace(/\[([^\]]+)\]/g, '<span class="dax-measure">[$1]</span>');

    // Highlight strings
    code = code.replace(/"([^"]*)"/g, '<span class="dax-string">"$1"</span>');

    // Highlight numbers (standalone)
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="dax-number">$1</span>');

    // Highlight functions
    functions.forEach(fn => {
      const regex = new RegExp(`\\b(${fn})\\s*\\(`, 'g');
      code = code.replace(regex, '<span class="dax-function">$1</span>(');
    });

    // Highlight keywords
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g');
      code = code.replace(regex, '<span class="dax-keyword">$1</span>');
    });

    // Highlight comments
    code = code.replace(/(\/\/.*)$/gm, '<span class="dax-comment">$1</span>');

    return code;
  }

  // ---------- DAX Measure Card ----------
  function daxMeasureCard(measure) {
    const pills = (measure.functionsUsed || []).map(fn =>
      `<span class="dax-pill" onclick="Components.openDaxDrawer('${fn}')">${fn}</span>`
    ).join('');

    const usedIn = (measure.usedInReports || []).map(r => r).join(', ');

    // Build "Why a Measure?" section
    let whyHtml = '';
    if (measure.whyMeasure) {
      const wm = measure.whyMeasure;
      const wmId = 'wm-' + measure.id;

      // Verdict badge
      let verdictClass = 'verdict-measure-only';
      let verdictLabel = 'Measure Required \u2014 No Alternative';
      if (wm.canBeCalculatedColumn && wm.alternative) {
        verdictClass = 'verdict-has-alternative';
        verdictLabel = 'Alternative Exists \u2014 But Measure is Better';
      } else if (wm.canBeVisualLevel) {
        verdictClass = 'verdict-has-alternative';
        verdictLabel = 'Alternative Exists \u2014 Visual-Level Option';
      } else if (wm.canBeCalculatedColumn && !wm.alternative) {
        verdictClass = 'verdict-measure-preferred';
        verdictLabel = 'Could Be a Calculated Column';
      }
      if (wm.verdict) { verdictLabel = wm.verdict; }

      whyHtml = `
        <div class="why-measure">
          <button class="why-measure-toggle" onclick="Components.toggleWhyMeasure('${wmId}')">
            \u2753 Why does this need to be a Measure?
          </button>
          <div class="why-measure-content" id="${wmId}">
            <span class="why-measure-verdict ${verdictClass}">${verdictLabel}</span>
            <div class="why-measure-reason">${wm.reason}</div>
            ${wm.alternative ? renderAlternative(wm) : ''}
            ${wm.comparison ? renderComparison(wm.comparison) : ''}
          </div>
        </div>`;
    }

    return `
      <div class="dax-card" id="dax-${measure.id}">
        <div class="dax-card-header" onclick="Components.toggleDaxCard('dax-${measure.id}')">
          <span class="dax-card-name">${measure.name}</span>
          ${usedIn ? `<span class="dax-card-used-in">Used in: ${usedIn}</span>` : ''}
        </div>
        <div class="dax-card-body">
          <div class="dax-card-body-inner">
            ${codeBlock(measure.formula, 'DAX')}
            <div class="dax-card-explanation">${measure.explanation}</div>
            ${pills ? `<div><strong style="font-size:0.82rem;color:var(--color-text-muted)">Functions used (click to learn):</strong><div class="dax-functions-used mt-sm">${pills}</div></div>` : ''}
            ${whyHtml}
          </div>
        </div>
      </div>`;
  }

  function toggleDaxCard(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
  }

  // ---------- Drawer ----------
  function openDrawer(title, contentHtml) {
    document.getElementById('drawer-title').textContent = title;
    document.getElementById('drawer-body').innerHTML = contentHtml;
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('visible');
    document.body.style.overflow = '';
  }

  function openDaxDrawer(funcName) {
    const ref = (window.DAXReference || {})[funcName];
    if (!ref) { openDrawer(funcName, '<p>Documentation not available.</p>'); return; }

    let html = `<div class="drawer-syntax">${escapeHtml(ref.syntax)}</div>`;
    html += `<p>${ref.description}</p>`;

    if (ref.returnType) {
      html += `<p style="font-size:0.82rem;color:var(--color-text-muted)"><strong>Returns:</strong> ${ref.returnType}</p>`;
    }

    if (ref.parameters && ref.parameters.length) {
      html += `<h4>Parameters</h4>
        <table class="drawer-param-table">
          <tr><th>Parameter</th><th>Description</th></tr>
          ${ref.parameters.map(p => `<tr><td><code>${p.name}</code></td><td>${p.description}</td></tr>`).join('')}
        </table>`;
    }

    if (ref.examples && ref.examples.length) {
      html += `<h4>Examples</h4>`;
      ref.examples.forEach(ex => {
        html += `<div class="drawer-example">
          <div class="drawer-example-label">${ex.context || 'Example'}</div>
          <code>${escapeHtml(ex.formula)}</code>
          ${ex.result ? `<div style="margin-top:4px;font-size:0.82rem;color:var(--color-text-muted)">\u2192 ${ex.result}</div>` : ''}
        </div>`;
      });
    }

    if (ref.notes) {
      html += `<h4>Tips</h4><p>${ref.notes}</p>`;
    }

    if (ref.relatedFunctions && ref.relatedFunctions.length) {
      html += `<h4>Related Functions</h4><div class="drawer-related">
        ${ref.relatedFunctions.map(fn => `<span class="drawer-related-pill" onclick="Components.openDaxDrawer('${fn}')">${fn}</span>`).join('')}
      </div>`;
    }

    openDrawer(funcName, html);
  }

  // ---------- Solution Reveal ----------
  function solutionReveal(id, solutionHtml) {
    return `
      <div class="solution-reveal" id="sol-${id}">
        <button class="solution-toggle" onclick="Components.toggleSolution('sol-${id}')">
          \ud83d\udd12 Show Solution
        </button>
        <div class="solution-content">${solutionHtml}</div>
      </div>`;
  }

  function toggleSolution(id) {
    const container = document.getElementById(id);
    if (!container) return;
    const content = container.querySelector('.solution-content');
    const btn = container.querySelector('.solution-toggle');
    const visible = content.classList.toggle('visible');
    btn.innerHTML = visible ? '\ud83d\udd13 Hide Solution' : '\ud83d\udd12 Show Solution';
  }

  // ---------- Hints ----------
  function hints(hintList, idPrefix) {
    return hintList.map((h, i) => {
      const hid = `${idPrefix}-hint-${i}`;
      return `<div class="hint-container">
        <button class="hint-toggle" onclick="Components.toggleHint('${hid}')">
          \ud83d\udca1 Hint ${i + 1}
        </button>
        <div class="hint-text" id="${hid}">${h}</div>
      </div>`;
    }).join('');
  }

  function toggleHint(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('visible');
  }

  // ---------- Download Button ----------
  function downloadButton(tableName, label, generateFn) {
    const fnId = 'dl_' + tableName.replace(/[^a-zA-Z0-9]/g, '_');
    window[fnId] = generateFn;
    return `<button class="btn btn--download btn--small" onclick="Components.downloadCSV('${tableName}', window.${fnId}())">
      \u2b07 ${label || tableName + '.csv'}
    </button>`;
  }

  function downloadCSV(tableName, rows) {
    if (!rows || !rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];
    rows.forEach(row => {
      csvLines.push(headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(','));
    });
    const csv = csvLines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freshmart_${tableName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- Data Table Preview ----------
  function dataTablePreview(columns, rows, maxRows = 5) {
    const display = rows.slice(0, maxRows);
    return `
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr>${columns.map(c => `<th>${c.name} <span class="col-type">${c.type}</span></th>`).join('')}</tr></thead>
          <tbody>
            ${display.map(row => `<tr>${columns.map(c => `<td>${row[c.name] !== null && row[c.name] !== undefined ? escapeHtml(String(row[c.name])) : '<em style="color:var(--color-text-light)">NULL</em>'}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${rows.length > maxRows ? `<p class="text-muted" style="font-size:0.78rem;margin-top:4px">Showing ${maxRows} of ${rows.length} rows. Download CSV for full data.</p>` : ''}`;
  }

  // ---------- Star Schema SVG ----------
  function starSchemaSVG(model) {
    const factTable = model.facts;
    const dims = model.dimensions;
    const dimKeys = Object.keys(dims);

    const boxW = 180, boxPad = 12, rowH = 18, headerH = 30;
    const centerX = 400, centerY = 280;

    // Calculate fact box height
    const factCols = factTable.columns || [];
    const factH = headerH + factCols.length * rowH + boxPad;

    // Dimension positions in a circle around the fact
    const radius = 220;
    const dimPositions = dimKeys.map((k, i) => {
      const angle = (i / dimKeys.length) * 2 * Math.PI - Math.PI / 2;
      return {
        key: k,
        x: centerX + radius * Math.cos(angle) - boxW / 2,
        y: centerY + radius * Math.sin(angle) - 50
      };
    });

    let svg = `<svg viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:800px">`;

    // Draw relationship lines first (behind boxes)
    dimPositions.forEach(dp => {
      const dim = dims[dp.key];
      const dimCenterX = dp.x + boxW / 2;
      const dimCenterY = dp.y + 20;
      svg += `<line x1="${centerX}" y1="${centerY}" x2="${dimCenterX}" y2="${dimCenterY}" class="rel-line" stroke-dasharray="6,3"/>`;
      // Cardinality labels
      const midX = (centerX + dimCenterX) / 2;
      const midY = (centerY + dimCenterY) / 2;
      svg += `<text x="${midX}" y="${midY - 6}" class="rel-label" text-anchor="middle">1 : *</text>`;
    });

    // Draw fact table (center)
    const factX = centerX - boxW / 2;
    const factY = centerY - factH / 2;
    svg += drawSchemaBox(factX, factY, boxW, factH, factTable.name || 'Fact_Sales', factCols, true);

    // Draw dimension tables
    dimPositions.forEach(dp => {
      const dim = dims[dp.key];
      const cols = dim.columns || [];
      const h = headerH + cols.length * rowH + boxPad;
      svg += drawSchemaBox(dp.x, dp.y, boxW, h, dp.key, cols, false);
    });

    svg += '</svg>';
    return `<div class="diagram-container">${svg}</div>`;
  }

  function drawSchemaBox(x, y, w, h, title, columns, isFact) {
    const cls = isFact ? 'schema-box schema-box-fact' : 'schema-box';
    let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
    svg += `<text x="${x + w/2}" y="${y + 20}" class="schema-box-header" text-anchor="middle" fill="${isFact ? 'var(--color-primary-dark)' : 'var(--color-text)'}">${title}</text>`;
    svg += `<line x1="${x + 8}" y1="${y + 28}" x2="${x + w - 8}" y2="${y + 28}" stroke="var(--color-border)" stroke-width="1"/>`;

    columns.forEach((col, i) => {
      const cy = y + 28 + 4 + (i + 1) * 18 - 5;
      const isKey = col.isKey || (col.name && (col.name.endsWith('Key') || col.name.endsWith('ID') || col.name.endsWith('Id')));
      svg += `<text x="${x + 14}" y="${cy}" class="${isKey ? 'schema-box-key' : 'schema-box-col'}">${isKey ? '\ud83d\udd11 ' : '   '}${col.name}</text>`;
    });

    return svg;
  }

  // ---------- Dashboard Wireframe SVG ----------
  function wireframeSVG(report) {
    const visuals = report.visuals || [];
    let svg = `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:800px">`;

    // Page background
    svg += `<rect x="0" y="0" width="800" height="450" fill="#F8FAFC" rx="8" stroke="#E2E8F0" stroke-width="1"/>`;

    // Title bar
    svg += `<rect x="0" y="0" width="800" height="40" fill="#1E293B" rx="8"/>`;
    svg += `<rect x="0" y="20" width="800" height="20" fill="#1E293B"/>`; // Cover bottom radius
    svg += `<text x="20" y="26" fill="#fff" font-size="13" font-weight="700">${escapeHtml(report.title)}</text>`;

    // Render each visual
    visuals.forEach(v => {
      const isSlicer = v.type === 'slicer';
      const cls = isSlicer ? 'wireframe-slicer' : 'visual-placeholder';
      svg += `<rect x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" class="${cls}"/>`;

      // Icon/type at top
      svg += `<text x="${v.x + v.w/2}" y="${v.y + 16}" class="visual-type-label">${v.type}</text>`;

      // Label in center
      svg += `<text x="${v.x + v.w/2}" y="${v.y + v.h/2 + 4}" class="visual-label">${escapeHtml(v.title || '')}</text>`;
    });

    svg += '</svg>';
    return `<div class="wireframe-container">${svg}<div class="wireframe-label">${escapeHtml(report.title)} \u2014 Dashboard Wireframe</div></div>`;
  }

  // ---------- Progress Tracking ----------
  function getProgress(scenarioId) {
    try {
      return JSON.parse(localStorage.getItem('pbi-progress-' + scenarioId)) || { sections: {}, problems: {} };
    } catch (e) {
      return { sections: {}, problems: {} };
    }
  }

  function trackSection(scenarioId, sectionId) {
    const progress = getProgress(scenarioId);
    progress.sections[sectionId] = true;
    localStorage.setItem('pbi-progress-' + scenarioId, JSON.stringify(progress));
  }

  // ---------- Why Measure Helpers ----------
  function renderAlternative(wm) {
    let html = `<div class="why-measure-alternative">
      <div class="why-measure-alt-header">${wm.canBeCalculatedColumn ? '\ud83d\udcdd Alternative: Calculated Column' : wm.canBeVisualLevel ? '\ud83d\udcca Alternative: Visual-Level Setting' : '\ud83d\udd04 Alternative Approach'}</div>
      <div class="why-measure-alt-body">
        ${wm.alternative}
        ${wm.alternativeCode ? codeBlock(wm.alternativeCode, wm.canBeCalculatedColumn ? 'Calculated Column (DAX)' : 'Alternative') : ''}
        ${wm.whyMeasureBetter ? '<p style="margin-top:12px"><strong style="color:var(--color-primary)">\u2192 Why the Measure is better:</strong> ' + wm.whyMeasureBetter + '</p>' : ''}
      </div>
    </div>`;
    return html;
  }

  function renderComparison(comp) {
    return `<div class="why-measure-comparison">
      <div class="comparison-col">
        <div class="comparison-col-header measure-header">\u2705 Measure Approach</div>
        <div class="comparison-col-body">${comp.measure}</div>
      </div>
      <div class="comparison-col">
        <div class="comparison-col-header alt-header">\u26a0\ufe0f ${comp.altLabel || 'Alternative Approach'}</div>
        <div class="comparison-col-body">${comp.alt}</div>
      </div>
    </div>`;
  }

  function toggleWhyMeasure(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const visible = el.classList.toggle('visible');
    const btn = el.previousElementSibling;
    if (btn) btn.classList.toggle('active', visible);
  }

  // ---------- PostgreSQL SQL Generator ----------
  function generatePostgresSQL(tableName, columns, rows) {
    const typeMap = {
      'INT': 'INTEGER', 'VARCHAR': 'VARCHAR(255)', 'DECIMAL': 'NUMERIC(10,4)',
      'DATE': 'DATE', 'BOOLEAN': 'BOOLEAN', 'TEXT': 'TEXT'
    };

    // CREATE TABLE
    let sql = `-- Table: ${tableName}\nDROP TABLE IF EXISTS ${tableName} CASCADE;\nCREATE TABLE ${tableName} (\n`;
    sql += columns.map((c, i) => {
      const pgType = typeMap[c.type] || 'VARCHAR(255)';
      const pk = i === 0 ? ' PRIMARY KEY' : '';
      return `    ${c.name} ${pgType}${pk}`;
    }).join(',\n');
    sql += '\n);\n\n';

    // INSERT statements (batched)
    if (rows.length > 0) {
      const colNames = columns.map(c => c.name).join(', ');
      sql += `INSERT INTO ${tableName} (${colNames}) VALUES\n`;
      const valueRows = rows.map((row, ri) => {
        const vals = columns.map(c => {
          const v = row[c.name];
          if (v === null || v === undefined) return 'NULL';
          if (c.type === 'INT') return String(v);
          if (c.type === 'DECIMAL') return String(v);
          if (c.type === 'BOOLEAN') return v ? 'TRUE' : 'FALSE';
          // String/Date — escape single quotes
          return "'" + String(v).replace(/'/g, "''") + "'";
        }).join(', ');
        return `    (${vals})`;
      });
      // Batch in groups of 100 for readability
      for (let i = 0; i < valueRows.length; i += 100) {
        const batch = valueRows.slice(i, i + 100);
        if (i > 0) sql += `INSERT INTO ${tableName} (${colNames}) VALUES\n`;
        sql += batch.join(',\n');
        sql += ';\n\n';
      }
    }
    return sql;
  }

  function generateAllSQL(sourceData) {
    let sql = '-- ============================================\n';
    sql += '-- FreshMart Grocery — PostgreSQL Database Setup\n';
    sql += '-- Generated by Power BI Practice Guide\n';
    sql += '-- ============================================\n\n';
    sql += 'BEGIN;\n\n';

    const tables = sourceData.tables;
    const order = ['categories', 'subcategories', 'products', 'stores', 'customers', 'suppliers', 'transactions', 'transaction_items'];
    order.forEach(tableName => {
      const t = tables[tableName];
      if (!t) return;
      sql += generatePostgresSQL(tableName, t.columns, t.generateRows());
    });

    sql += 'COMMIT;\n';
    sql += '\n-- Verify row counts\n';
    order.forEach(tableName => {
      if (tables[tableName]) sql += `SELECT '${tableName}' AS table_name, COUNT(*) AS row_count FROM ${tableName};\n`;
    });
    return sql;
  }

  function downloadSQL(sourceData, filename) {
    const sql = generateAllSQL(sourceData);
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'freshmart_postgres.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadSingleTableSQL(tableName, columns, rows) {
    const sql = generatePostgresSQL(tableName, columns, rows);
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freshmart_${tableName}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function sqlCodeBlock(code) {
    // Highlight SQL keywords
    const keywords = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','ON','GROUP BY','ORDER BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','CREATE TABLE','DROP TABLE','ALTER TABLE','UPDATE','DELETE','SET','AS','AND','OR','NOT','IN','EXISTS','BETWEEN','LIKE','ILIKE','IS NULL','IS NOT NULL','DISTINCT','COUNT','SUM','AVG','MAX','MIN','ROUND','COALESCE','CASE','WHEN','THEN','ELSE','END','WITH','OVER','PARTITION BY','EXTRACT','YEAR','MONTH','LOWER','UPPER','INITCAP','TRIM','TO_CHAR','LAG','LEAD','ROW_NUMBER','DENSE_RANK','RANK','CASCADE','IF EXISTS','BEGIN','COMMIT','UNION','ALL','DESC','ASC','TRUE','FALSE','NULL','PRIMARY KEY','FOREIGN KEY','REFERENCES','INTEGER','VARCHAR','NUMERIC','DATE','BOOLEAN','TEXT'];

    let highlighted = escapeHtml(code);
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="dax-keyword">$1</span>');
    });
    // Highlight strings
    highlighted = highlighted.replace(/'([^']*)'/g, '<span class="dax-string">\'$1\'</span>');
    // Highlight comments
    highlighted = highlighted.replace(/(--.*?)$/gm, '<span class="dax-comment">$1</span>');

    const blockId = 'sql-' + Math.random().toString(36).slice(2, 8);
    return `<div class="code-block" id="${blockId}">
      <div class="code-block-header">
        <span class="code-block-label">PostgreSQL</span>
        <button class="code-block-copy" onclick="Components.copyCode('${blockId}')">Copy</button>
      </div>
      <pre>${highlighted}</pre>
    </div>`;
  }

  // ---------- Utilities ----------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Public API ----------
  return {
    scenarioCard,
    breadcrumb,
    sectionNav,
    sidebarNav,
    accordion,
    toggleAccordion,
    codeBlock,
    daxMeasureCard,
    toggleDaxCard,
    openDrawer,
    closeDrawer,
    openDaxDrawer,
    solutionReveal,
    toggleSolution,
    hints,
    toggleHint,
    downloadButton,
    downloadCSV,
    dataTablePreview,
    starSchemaSVG,
    wireframeSVG,
    getProgress,
    trackSection,
    toggleWhyMeasure,
    generateAllSQL,
    downloadSQL,
    downloadSingleTableSQL,
    sqlCodeBlock,
    escapeHtml,
    highlightDAX
  };

})();
