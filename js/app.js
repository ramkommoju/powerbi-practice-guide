/* ============================================
   Power BI Practice Guide — Application Core
   Router + Page Renderers + Initialization
   ============================================ */

(function () {
  'use strict';

  var C = window.Components;
  var registry = window.ScenarioRegistry || [];
  var scenarios = window.Scenarios || {};

  // ── DOM References ──
  var $sidebar = document.getElementById('sidebar');
  var $sidebarNav = document.getElementById('sidebar-nav');
  var $breadcrumb = document.getElementById('breadcrumb');
  var $sectionNav = document.getElementById('section-nav');
  var $pageContent = document.getElementById('page-content');
  var $menuToggle = document.getElementById('menu-toggle');
  var $sidebarClose = document.getElementById('sidebar-close');
  var $drawerOverlay = document.getElementById('drawer-overlay');
  var $drawerClose = document.getElementById('drawer-close');

  // ══════════════════════════════════════════
  // ROUTER
  // ══════════════════════════════════════════

  function getRoute() {
    var hash = window.location.hash.slice(1) || 'home';
    var parts = hash.split('/');
    return { page: parts[0], scenarioId: parts[1] || null, section: parts[2] || null };
  }

  function handleRoute() {
    var route = getRoute();

    // Close mobile sidebar on navigation
    $sidebar.classList.remove('open');

    if (route.page === 'scenario' && route.scenarioId) {
      var meta = registry.find(function (s) { return s.id === route.scenarioId; });
      if (!meta) { renderHomePage(); return; }
      var section = route.section || meta.sectionDefs[0].id;
      renderScenarioPage(meta, section);
    } else {
      renderHomePage();
    }

    // Scroll to top
    $pageContent.scrollTop = 0;
  }

  // ══════════════════════════════════════════
  // HOME PAGE
  // ══════════════════════════════════════════

  function renderHomePage() {
    $sectionNav.classList.remove('visible');
    $sectionNav.innerHTML = '';
    $breadcrumb.innerHTML = C.breadcrumb([{ label: 'Power BI Practice Guide', hash: 'home' }]);

    // Sidebar
    $sidebarNav.innerHTML = '<div class="sidebar-section-label">Projects</div>' +
      registry.map(function (s) {
        return '<a class="sidebar-item" href="#scenario/' + s.id + '"><span class="item-icon">' + (s.icon || '\ud83d\udcca') + '</span> ' + s.title + '</a>';
      }).join('');

    // Main content
    var html = '<div class="home-hero">' +
      '<h1>Power BI <span class="highlight">Practice Guide</span></h1>' +
      '<p>Learn Power BI through hands-on, real-world projects. Each scenario includes sample data, step-by-step transformation guides, data modelling, DAX measures with detailed explanations, and practice problems.</p>' +
      '</div>';

    html += '<div class="scenarios-grid">';
    registry.forEach(function (meta) {
      html += C.scenarioCard(meta);
    });
    html += '</div>';

    $pageContent.innerHTML = html;
  }

  // ══════════════════════════════════════════
  // SCENARIO PAGE
  // ══════════════════════════════════════════

  function renderScenarioPage(meta, sectionId) {
    var scenario = scenarios[meta.id];
    if (!scenario) { renderHomePage(); return; }

    // Track progress
    C.trackSection(meta.id, sectionId);

    // Breadcrumb
    var sectionDef = meta.sectionDefs.find(function (s) { return s.id === sectionId; });
    $breadcrumb.innerHTML = C.breadcrumb([
      { label: 'Home', hash: 'home' },
      { label: meta.title, hash: 'scenario/' + meta.id },
      { label: sectionDef ? sectionDef.label : sectionId }
    ]);

    // Section Nav
    $sectionNav.classList.add('visible');
    $sectionNav.innerHTML = C.sectionNav(meta.sectionDefs, sectionId, meta.id);

    // Sidebar
    $sidebarNav.innerHTML = C.sidebarNav(registry, meta.id, sectionId);

    // Render section
    var renderers = {
      'requirements': renderRequirementsSection,
      'data': renderDataSection,
      'transformation': renderTransformationSection,
      'data-model': renderDataModelSection,
      'reports': renderReportsSection,
      'dax': renderDaxSection,
      'practice': renderPracticeSection,
      'sql-load': renderSqlLoadSection,
      'sql-practice': renderSqlPracticeSection
    };

    var renderer = renderers[sectionId];
    if (renderer) {
      $pageContent.innerHTML = renderer(scenario, meta);
    } else {
      $pageContent.innerHTML = '<p>Section not found.</p>';
    }
  }

  // ── Section: Business Requirements ──
  function renderRequirementsSection(scenario) {
    var req = scenario.businessRequirements;
    var html = '';

    html += '<div class="section-header"><h2>\ud83c\udfaf Business Requirements</h2>' +
      '<p>Understand what the business needs before touching any data.</p></div>';

    // Overview
    html += '<div class="section-intro">' + req.overview + '</div>';

    // Stakeholders
    html += C.accordion('stakeholders', 'Stakeholders & Their Needs', (function () {
      var inner = '<p>Each stakeholder has different needs. Your dashboard should serve all of them:</p>';
      inner += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Role</th><th>What They Need</th></tr></thead><tbody>';
      req.stakeholders.forEach(function (s) {
        inner += '<tr><td><strong>' + s.role + '</strong></td><td>' + s.needs + '</td></tr>';
      });
      inner += '</tbody></table></div>';
      return inner;
    })(), { open: true, icon: '\ud83d\udc65' });

    // KPIs
    html += '<h3 class="mt-xl mb-md" style="font-size:1.1rem;font-weight:700">Key Performance Indicators (KPIs)</h3>';
    html += '<div class="kpi-grid">';
    req.kpis.forEach(function (k) {
      html += '<div class="kpi-card"><div class="kpi-icon">' + k.icon + '</div>' +
        '<div class="kpi-label">' + k.name + '</div>' +
        '<div class="kpi-value" style="font-size:0.85rem;font-weight:400;color:var(--color-text-muted)">' + k.definition + '</div></div>';
    });
    html += '</div>';

    // Business Questions
    html += C.accordion('biz-questions', 'Business Questions to Answer', (function () {
      var inner = '<p>Your dashboard should help answer these questions:</p><ol>';
      req.businessQuestions.forEach(function (q) {
        inner += '<li style="margin-bottom:8px">' + q + '</li>';
      });
      inner += '</ol>';
      return inner;
    })(), { open: true, icon: '\u2753' });

    return html;
  }

  // ── Section: Source Data ──
  function renderDataSection(scenario) {
    var src = scenario.sourceData;
    var html = '';

    html += '<div class="section-header"><h2>\ud83d\uddc4 Source Data (OLTP)</h2>' +
      '<p>Download the sample data files and import them into Power BI Desktop.</p></div>';

    html += '<div class="section-intro">' + src.description + '</div>';

    // Download All button
    html += '<div class="btn-group mb-xl">';
    Object.keys(src.tables).forEach(function (tableName) {
      var t = src.tables[tableName];
      html += C.downloadButton(tableName, tableName + '.csv', t.generateRows);
    });
    html += '</div>';

    // Data Quality Issues
    html += C.accordion('quality-issues', 'Data Quality Issues (Intentional!)', (function () {
      var inner = '<p>These are <strong>intentional</strong> data quality issues for you to find and fix during the transformation step:</p>';
      inner += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Table</th><th>Issue</th><th>Type</th></tr></thead><tbody>';
      src.qualityIssues.forEach(function (q) {
        inner += '<tr><td><strong>' + q.table + '</strong></td><td>' + q.issue + '</td><td><span class="tag tag--intermediate">' + q.type + '</span></td></tr>';
      });
      inner += '</tbody></table></div>';
      return inner;
    })(), { icon: '\u26a0\ufe0f', badge: src.qualityIssues.length + ' issues', badgeBg: 'var(--color-warning-light)', badgeColor: 'var(--color-warning)' });

    // Each table schema + preview
    Object.keys(src.tables).forEach(function (tableName) {
      var t = src.tables[tableName];
      var rows = t.generateRows();

      html += C.accordion('table-' + tableName, tableName, (function () {
        var inner = '<p>' + t.description + '</p>';

        // Schema
        inner += '<h4 style="font-size:0.88rem;margin:12px 0 8px">Schema</h4>';
        inner += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Column</th><th>Type</th><th>Description</th></tr></thead><tbody>';
        t.columns.forEach(function (c) {
          inner += '<tr><td><code>' + c.name + '</code></td><td><span class="col-type">' + c.type + '</span></td><td>' + c.description + '</td></tr>';
        });
        inner += '</tbody></table></div>';

        // Preview
        inner += '<h4 style="font-size:0.88rem;margin:16px 0 8px">Data Preview</h4>';
        inner += C.dataTablePreview(t.columns, rows, 5);

        // Download
        inner += '<div class="mt-md">' + C.downloadButton(tableName, 'Download ' + tableName + '.csv (' + rows.length + ' rows)', t.generateRows) + '</div>';

        return inner;
      })(), { icon: '\ud83d\udcbe', badge: rows.length + ' rows', badgeBg: 'var(--color-info-light)', badgeColor: 'var(--color-info)' });
    });

    return html;
  }

  // ── Section: Data Transformation ──
  function renderTransformationSection(scenario) {
    var steps = scenario.transformationSteps;
    var html = '';

    html += '<div class="section-header"><h2>\ud83d\udd27 Data Transformation</h2>' +
      '<p>Clean and shape the data using Power Query Editor. Follow these steps in order.</p></div>';

    html += '<div class="section-intro">Data transformation happens in <strong>Power Query Editor</strong> (click "Transform Data" on the Home ribbon). Every step you apply is recorded and replayed automatically when data refreshes. Think of it as a recipe for cleaning data.</div>';

    steps.forEach(function (step, i) {
      html += C.accordion('step-' + i, '<span class="step-number">' + (i + 1) + '</span> ' + step.title, (function () {
        var inner = '<p>' + step.description + '</p>';

        // Instructions
        inner += '<h4 style="font-size:0.88rem;margin:12px 0 8px">Steps</h4><ol>';
        step.instructions.forEach(function (inst) {
          inner += '<li style="margin-bottom:8px">' + inst + '</li>';
        });
        inner += '</ol>';

        // Power Query code
        if (step.powerQueryCode) {
          inner += C.codeBlock(step.powerQueryCode, 'Power Query M');
        }

        // Tip
        if (step.tip) {
          inner += '<div style="margin-top:12px;padding:10px 14px;background:var(--color-info-light);border-left:3px solid var(--color-info);border-radius:4px;font-size:0.85rem">' +
            '<strong>\ud83d\udca1 Tip:</strong> ' + step.tip + '</div>';
        }

        return inner;
      })(), { icon: '' });
    });

    return html;
  }

  // ── Section: Data Model ──
  function renderDataModelSection(scenario) {
    var model = scenario.dataModel;
    var html = '';

    html += '<div class="section-header"><h2>\ud83d\uddc2 Data Model (Star Schema)</h2>' +
      '<p>Transform the normalized OLTP structure into an analytics-optimized star schema.</p></div>';

    html += '<div class="section-intro">' + model.description + '</div>';

    // Why Star Schema
    html += C.accordion('why-star', 'Why Use a Star Schema?', (function () {
      var inner = '<ul>';
      model.whyStarSchema.forEach(function (reason) {
        inner += '<li style="margin-bottom:8px">' + reason + '</li>';
      });
      inner += '</ul>';
      return inner;
    })(), { open: true, icon: '\u2b50' });

    // Star Schema Diagram
    html += '<h3 class="mt-xl mb-md" style="font-size:1.1rem;font-weight:700">Star Schema Diagram</h3>';
    html += C.starSchemaSVG(model);

    // Relationships Table
    html += C.accordion('relationships', 'Relationships', (function () {
      var inner = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>From (Fact)</th><th>To (Dimension)</th><th>Cardinality</th><th>Direction</th></tr></thead><tbody>';
      model.relationships.forEach(function (r) {
        inner += '<tr><td><code>' + r.from + '</code></td><td><code>' + r.to + '</code></td><td>' + r.cardinality + '</td><td>' + r.direction + '</td></tr>';
      });
      inner += '</tbody></table></div>';
      inner += '<p class="mt-md" style="font-size:0.85rem;color:var(--color-text-muted)">In Power BI Model view, drag from the Fact table key to the Dimension table key to create each relationship. Ensure cardinality is set to Many to One (many fact rows → one dimension row).</p>';
      return inner;
    })(), { open: true, icon: '\ud83d\udd17' });

    // Fact Table
    html += C.accordion('fact-table', model.facts.name + ' (Fact Table)', (function () {
      var inner = '<p>' + model.facts.description + '</p>';
      inner += '<p style="font-size:0.85rem;color:var(--color-text-muted)"><strong>Grain:</strong> ' + model.facts.grain + '</p>';
      inner += '<p style="font-size:0.85rem;color:var(--color-text-muted)"><strong>Source:</strong> ' + model.facts.sourceMapping + '</p>';
      inner += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Column</th><th>Key?</th></tr></thead><tbody>';
      model.facts.columns.forEach(function (c) {
        inner += '<tr><td><code>' + c.name + '</code></td><td>' + (c.isKey ? '\ud83d\udd11 Yes' : '') + '</td></tr>';
      });
      inner += '</tbody></table></div>';
      return inner;
    })(), { icon: '\ud83d\udcca' });

    // Dimension Tables
    Object.keys(model.dimensions).forEach(function (dimName) {
      var dim = model.dimensions[dimName];
      html += C.accordion('dim-' + dimName, dimName + ' (Dimension)', (function () {
        var inner = '<p>' + dim.description + '</p>';
        inner += '<p style="font-size:0.85rem;color:var(--color-text-muted)"><strong>Source:</strong> ' + dim.sourceMapping + '</p>';
        inner += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Column</th><th>Key?</th></tr></thead><tbody>';
        dim.columns.forEach(function (c) {
          inner += '<tr><td><code>' + c.name + '</code></td><td>' + (c.isKey ? '\ud83d\udd11 Yes' : '') + '</td></tr>';
        });
        inner += '</tbody></table></div>';
        return inner;
      })(), { icon: '\ud83d\udcc1' });
    });

    return html;
  }

  // ── Section: Reports ──
  function renderReportsSection(scenario) {
    var reps = scenario.reports;
    var html = '';

    html += '<div class="section-header"><h2>\ud83d\udcca Report Requirements</h2>' +
      '<p>Create these report pages in Power BI. Each wireframe shows the suggested layout. Expand the <strong>Live Preview</strong> to see what the dashboard should look like with actual data.</p></div>';

    html += '<div class="section-intro">Reports are categorized by difficulty. <span class="difficulty-badge easy">Easy</span> reports use basic visuals (cards, bar charts, tables). <span class="difficulty-badge medium">Medium</span> reports add multi-series charts, matrices, and cross-filtering. <span class="difficulty-badge hard">Hard</span> reports use advanced visuals (scatter plots, treemaps) and complex DAX measures.</div>';

    // Map report IDs to chart builders
    var chartBuilders = {
      'executive-overview': window.Charts.buildExecutiveOverview,
      'store-performance': window.Charts.buildStorePerformance,
      'product-analysis': window.Charts.buildProductAnalysis,
      'customer-insights': window.Charts.buildCustomerInsights,
      'geographic-analysis': window.Charts.buildGeographicAnalysis
    };

    reps.forEach(function (report) {
      var diffClass = (report.difficulty || 'medium').toLowerCase();
      var diffLabel = report.difficulty || 'Medium';

      html += C.accordion('report-' + report.id, '<span class="difficulty-badge ' + diffClass + '" style="margin-right:8px">' + diffLabel + '</span> ' + report.title, (function () {
        var inner = '<p>' + report.description + '</p>';
        inner += '<p style="font-size:0.85rem;color:var(--color-text-muted)"><strong>Audience:</strong> ' + report.audience + '</p>';

        // Wireframe template
        inner += C.accordion('wireframe-' + report.id, '\ud83d\udccb Wireframe Template (Layout Guide)', (function () {
          var wfInner = '<p style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:8px">This wireframe shows the suggested placement and type of each visual. Use it as a guide when building your report in Power BI.</p>';
          wfInner += C.wireframeSVG(report);
          return wfInner;
        })(), { open: false, icon: '\ud83d\udccc' });

        // Live preview
        var builder = chartBuilders[report.id];
        if (builder) {
          inner += C.accordion('live-' + report.id, '\ud83d\ude80 Live Preview (Using Sample Data)', (function () {
            var lpInner = '<p style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:12px">This is a live visualization built from the same sample data you downloaded. Use it to <strong>validate your Power BI report</strong> — your numbers should match these. The layout may differ, but the values should be the same.</p>';
            lpInner += '<div style="background:#F8FAFC;border-radius:8px;padding:16px">';
            lpInner += builder();
            lpInner += '</div>';
            return lpInner;
          })(), { open: false, icon: '\ud83d\udcca', badge: 'Interactive', badgeBg: 'var(--color-success-light)', badgeColor: 'var(--color-success)' });
        }

        // Visual list
        inner += C.accordion('visuals-' + report.id, '\ud83d\udcdd Visuals Checklist', (function () {
          var vlInner = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Visual Type</th><th>Title / Content</th></tr></thead><tbody>';
          report.visuals.forEach(function (v) {
            vlInner += '<tr><td><span class="tag">' + v.type + '</span></td><td>' + C.escapeHtml(v.title) + '</td></tr>';
          });
          vlInner += '</tbody></table></div>';
          return vlInner;
        })(), { open: false, icon: '\u2611' });

        return inner;
      })(), { icon: '\ud83d\udcca' });
    });

    return html;
  }

  // ── Section: DAX Measures ──
  function renderDaxSection(scenario) {
    var measures = scenario.daxMeasures;
    var html = '';

    html += '<div class="section-header"><h2>\ud83e\uddee DAX Measures</h2>' +
      '<p>Create these measures in your Power BI model. Click each measure to expand, then click function pills to learn about each DAX function.</p></div>';

    html += '<div class="section-intro">DAX (Data Analysis Expressions) is the formula language for Power BI. Measures are dynamic calculations that respond to filter context — they recalculate based on what the user selects in slicers, filters, and row/column positions. <strong>Click the blue function pills</strong> to open a detailed explanation of each function in a side panel. Use the <strong>"Why does this need to be a Measure?"</strong> button to understand when and why a measure is required vs. alternatives.</div>';

    var groups = [
      {
        label: 'Core Measures',
        description: 'Fundamental aggregations that every report needs.',
        ids: ['total-revenue', 'total-cost', 'gross-profit', 'profit-margin', 'total-transactions', 'avg-basket-value', 'customer-count', 'revenue-per-customer']
      },
      {
        label: 'Ranking & Comparison Measures',
        description: 'Measures that compare values across dimensions — percentages of total, rankings, and rates.',
        ids: ['store-pct-of-total', 'category-pct', 'product-rank', 'return-rate']
      },
      {
        label: 'Time Intelligence Measures',
        description: 'Measures that compare values across time periods. These all require a proper Date table.',
        ids: ['revenue-prev-month', 'mom-growth', 'ytd-revenue', 'yoy-growth', 'qtd-revenue']
      },
      {
        label: 'Conditional & Segmentation Measures',
        description: 'Measures that filter to specific segments or apply conditions to isolate subsets of data.',
        ids: ['weekend-revenue', 'gold-member-revenue', 'high-value-txn-count', 'avg-revenue-per-store', 'new-customers']
      }
    ];

    groups.forEach(function (group) {
      var groupMeasures = measures.filter(function (m) {
        return group.ids.indexOf(m.id) >= 0;
      });
      if (groupMeasures.length === 0) return;

      html += '<h3 class="mt-xl mb-sm" style="font-size:1.05rem;font-weight:700;color:var(--color-text)">' + group.label + '</h3>';
      html += '<p class="mb-md text-muted" style="font-size:0.85rem">' + group.description + '</p>';
      groupMeasures.forEach(function (m) { html += C.daxMeasureCard(m); });
    });

    return html;
  }

  // ── Section: Practice Problems ──
  function renderPracticeSection(scenario) {
    var problems = scenario.practiceProblems;
    var html = '';

    var completed = (C.getProgress('retail-sales').problems || {});
    var completedCount = Object.keys(completed).length;

    html += '<div class="section-header"><h2>\ud83e\udde9 Practice Problems</h2>' +
      '<p>Test your knowledge by writing these DAX measures on your own. Use hints if stuck, and reveal the solution when ready.</p></div>';

    html += '<div class="section-intro">Try to solve each problem <strong>without looking at the solution first</strong>. Use the hints progressively — each hint gets more specific. After solving (or attempting), check the solution to compare approaches. There\'s often more than one correct way!</div>';

    problems.forEach(function (p) {
      var diffClass = p.difficulty.toLowerCase();

      html += '<div class="problem-card" id="problem-' + p.id + '">';
      html += '<div class="problem-card-header">';
      html += '<span class="problem-card-title">Problem ' + p.id + ': ' + p.title + '</span>';
      html += '<span class="difficulty-badge ' + diffClass + '">' + p.difficulty + '</span>';
      html += '</div>';

      html += '<div class="problem-prompt">' + p.prompt + '</div>';

      // Hints
      if (p.hints && p.hints.length) {
        html += C.hints(p.hints, 'p' + p.id);
      }

      // Solution
      if (p.solution) {
        var solHtml = C.codeBlock(p.solution.formula, 'DAX Solution');
        solHtml += '<p style="margin-top:12px;line-height:1.7">' + p.solution.explanation + '</p>';
        html += C.solutionReveal('p' + p.id, solHtml);
      }

      html += '</div>';
    });

    return html;
  }

  // ── Section: SQL Load ──
  function renderSqlLoadSection(scenario) {
    var src = scenario.sourceData;
    var html = '';

    html += '<div class="section-header"><h2>\ud83d\uddc3 Load Data into PostgreSQL</h2>' +
      '<p>Generate SQL scripts to create tables and insert sample data into a PostgreSQL database.</p></div>';

    html += '<div class="section-intro">You can load the same sample data into a <strong>PostgreSQL</strong> database to practice SQL queries. The generated SQL includes CREATE TABLE statements with proper data types and INSERT statements with all the sample data. Download the all-in-one script or individual table scripts.</div>';

    // Download all-in-one
    html += '<div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:20px;margin-bottom:20px">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">';
    html += '<div><h3 style="font-size:1rem;margin-bottom:4px">Download Complete SQL Script</h3>';
    html += '<p style="font-size:0.85rem;color:var(--color-text-muted)">All tables with CREATE + INSERT statements, wrapped in a transaction.</p></div>';
    html += '<button class="btn btn--primary" onclick="Components.downloadSQL(window.Scenarios[\'retail-sales\'].sourceData)">\u2b07 Download freshmart_postgres.sql</button>';
    html += '</div></div>';

    // How to load
    html += C.accordion('sql-howto', 'How to Load in PostgreSQL', (function () {
      var inner = '<p>Follow these steps to create the database and load the data:</p>';
      inner += C.sqlCodeBlock('-- 1. Create the database\nCREATE DATABASE freshmart;\n\n-- 2. Connect to it\n\\c freshmart\n\n-- 3. Run the SQL script\n\\i /path/to/freshmart_postgres.sql\n\n-- Or from the command line:\npsql -U your_username -d freshmart -f freshmart_postgres.sql');
      inner += '<p class="mt-md">If using <strong>pgAdmin</strong>: Create a new database called "freshmart", then open the Query Tool and paste the SQL script, then click Execute.</p>';
      return inner;
    })(), { open: true, icon: '\ud83d\udcbb' });

    // Individual table downloads
    html += '<h3 class="mt-xl mb-md" style="font-size:1rem;font-weight:700">Individual Table Scripts</h3>';

    var tableOrder = ['categories', 'subcategories', 'products', 'stores', 'customers', 'suppliers', 'transactions', 'transaction_items'];
    tableOrder.forEach(function (tableName) {
      var t = src.tables[tableName];
      if (!t) return;
      var rows = t.generateRows();

      html += C.accordion('sql-' + tableName, tableName + '.sql', (function () {
        var inner = '<p>' + t.description + ' \u2014 <strong>' + rows.length + ' rows</strong></p>';
        inner += '<div class="btn-group mt-sm mb-md">';
        inner += '<button class="btn btn--download btn--small" onclick="Components.downloadSingleTableSQL(\'' + tableName + '\',' + JSON.stringify(t.columns) + ', window.Scenarios[\'retail-sales\'].sourceData.tables.' + tableName + '.generateRows())">\u2b07 Download ' + tableName + '.sql</button>';
        inner += '</div>';

        // Preview the SQL
        var previewCols = t.columns.map(function (c) {
          var pgType = { 'INT': 'INTEGER', 'VARCHAR': 'VARCHAR(255)', 'DECIMAL': 'NUMERIC(10,4)', 'DATE': 'DATE' }[c.type] || 'VARCHAR(255)';
          return '    ' + c.name + ' ' + pgType;
        }).join(',\n');
        inner += C.sqlCodeBlock('CREATE TABLE ' + tableName + ' (\n' + previewCols + '\n);');
        return inner;
      })(), { icon: '\ud83d\udcbe', badge: rows.length + ' rows', badgeBg: 'var(--color-info-light)', badgeColor: 'var(--color-info)' });
    });

    // Future databases teaser
    html += '<div style="margin-top:24px;padding:16px;background:var(--color-warning-light);border:1px solid #FDE68A;border-radius:8px;font-size:0.85rem">';
    html += '<strong>\ud83d\udea7 Coming Soon:</strong> SQL scripts for MySQL, SQL Server, and SQLite. The PostgreSQL format works as a starting point for most databases with minor syntax adjustments.';
    html += '</div>';

    return html;
  }

  // ── Section: SQL Practice ──
  function renderSqlPracticeSection(scenario) {
    var problems = scenario.sqlPracticeProblems;
    if (!problems) return '<p>SQL practice problems not available for this scenario.</p>';
    var html = '';

    html += '<div class="section-header"><h2>\ud83d\udee0 SQL Practice (PostgreSQL)</h2>' +
      '<p>Practice writing SQL queries against the FreshMart database. Load the data into PostgreSQL first (see SQL Load section), then try these challenges.</p></div>';

    html += '<div class="section-intro">These questions use the <strong>OLTP tables</strong> (the original normalized data you loaded into PostgreSQL). Try to solve each query on your own before revealing the solution. The queries progress from simple SELECTs to advanced window functions and CTEs.</div>';

    // Group by difficulty
    var groups = [
      { label: 'Easy', cls: 'easy', desc: 'Basic SELECT, WHERE, JOIN, GROUP BY, ORDER BY' },
      { label: 'Medium', cls: 'medium', desc: 'Multi-table JOINs, aggregations, subqueries, conditional logic' },
      { label: 'Hard', cls: 'hard', desc: 'Window functions (LAG, RANK, SUM OVER), CTEs, complex analytics' }
    ];

    groups.forEach(function (group) {
      var groupProblems = problems.filter(function (p) { return p.difficulty === group.label; });
      if (groupProblems.length === 0) return;

      html += '<h3 class="mt-xl mb-sm" style="font-size:1.05rem;font-weight:700;color:var(--color-text)">';
      html += '<span class="difficulty-badge ' + group.cls + '" style="margin-right:8px">' + group.label + '</span> ' + group.desc;
      html += '</h3>';

      groupProblems.forEach(function (p) {
        html += '<div class="problem-card" id="sql-problem-' + p.id + '">';
        html += '<div class="problem-card-header">';
        html += '<span class="problem-card-title">Q' + p.id + ': ' + p.title + '</span>';
        html += '<span class="difficulty-badge ' + p.difficulty.toLowerCase() + '">' + p.difficulty + '</span>';
        html += '</div>';

        html += '<div class="problem-prompt">' + p.prompt + '</div>';

        if (p.hints && p.hints.length) {
          html += C.hints(p.hints, 'sql' + p.id);
        }

        if (p.solution) {
          var solHtml = C.sqlCodeBlock(p.solution.code);
          solHtml += '<p style="margin-top:12px;line-height:1.7">' + p.solution.explanation + '</p>';
          html += C.solutionReveal('sql' + p.id, solHtml);
        }

        html += '</div>';
      });
    });

    return html;
  }

  // ══════════════════════════════════════════
  // EVENT LISTENERS
  // ══════════════════════════════════════════

  // Router
  window.addEventListener('hashchange', handleRoute);

  // Mobile sidebar toggle
  $menuToggle.addEventListener('click', function () {
    $sidebar.classList.toggle('open');
  });

  $sidebarClose.addEventListener('click', function () {
    $sidebar.classList.remove('open');
  });

  // Drawer close
  $drawerOverlay.addEventListener('click', function () { C.closeDrawer(); });
  $drawerClose.addEventListener('click', function () { C.closeDrawer(); });

  // Close drawer on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { C.closeDrawer(); }
  });

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════

  handleRoute();

})();
