/**
 * ShipLog — Embeddable Changelog Widget
 * Usage: <div id="shiplog-widget" data-slug="your-project"></div>
 *        <script src="https://shiplog.dev/widget.js"></script>
 */
(function () {
  'use strict';

  var WIDGET_VERSION = '1.0.0';
  var DEFAULT_LIMIT = 10;
  var BASE_URL = (function () {
    var scripts = document.querySelectorAll('script[src*="widget.js"]');
    var src = scripts[scripts.length - 1]?.src || '';
    try {
      var u = new URL(src);
      return u.origin;
    } catch (e) {
      return '';
    }
  })();

  // Category colors and labels
  var CATEGORIES = {
    feature: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'Feature' },
    fix: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Fix' },
    improvement: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', label: 'Improvement' },
    breaking: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'Breaking' },
  };

  function createStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.sl-widget { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 100%; color: #e4e4e7; }',
      '.sl-widget * { box-sizing: border-box; margin: 0; padding: 0; }',
      '.sl-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }',
      '.sl-title { font-size: 18px; font-weight: 600; }',
      '.sl-powered { font-size: 11px; color: #71717a; text-decoration: none; }',
      '.sl-powered:hover { color: #a1a1aa; }',
      '.sl-entry { display: flex; gap: 12px; padding: 12px; border-radius: 8px; margin-bottom: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); transition: background 0.15s; }',
      '.sl-entry:hover { background: rgba(255,255,255,0.06); }',
      '.sl-emoji { font-size: 18px; line-height: 1.4; flex-shrink: 0; }',
      '.sl-content { flex: 1; min-width: 0; }',
      '.sl-summary { font-size: 14px; line-height: 1.5; color: #d4d4d8; }',
      '.sl-meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }',
      '.sl-badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid; }',
      '.sl-pr { font-size: 11px; color: #71717a; font-family: monospace; text-decoration: none; }',
      '.sl-pr:hover { color: #a1a1aa; }',
      '.sl-date { font-size: 11px; color: #52525b; }',
      '.sl-empty { text-align: center; padding: 32px 16px; color: #71717a; font-size: 14px; }',
      '.sl-error { text-align: center; padding: 24px 16px; color: #ef4444; font-size: 13px; }',
      '.sl-loading { text-align: center; padding: 32px 16px; color: #71717a; font-size: 13px; }',
      // Light theme
      '.sl-widget.sl-light { color: #18181b; }',
      '.sl-light .sl-entry { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.08); }',
      '.sl-light .sl-entry:hover { background: rgba(0,0,0,0.04); }',
      '.sl-light .sl-summary { color: #3f3f46; }',
      '.sl-light .sl-powered, .sl-light .sl-pr, .sl-light .sl-date { color: #a1a1aa; }',
    ].join('\n');
    return style;
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function renderEntry(entry) {
    var cat = CATEGORIES[entry.category] || CATEGORIES.improvement;
    var div = document.createElement('div');
    div.className = 'sl-entry';
    div.innerHTML =
      '<span class="sl-emoji">' + escapeHtml(entry.emoji) + '</span>' +
      '<div class="sl-content">' +
      '<p class="sl-summary">' + escapeHtml(entry.summary) + '</p>' +
      '<div class="sl-meta">' +
      '<span class="sl-badge" style="color:' + cat.color + ';background:' + cat.bg + ';border-color:' + cat.border + '">' + cat.label + '</span>' +
      (entry.pr_url ? '<a class="sl-pr" href="' + escapeHtml(entry.pr_url) + '" target="_blank" rel="noopener">#' + entry.pr_number + '</a>' : '') +
      '<span class="sl-date">' + formatDate(entry.merged_at) + '</span>' +
      '</div></div>';
    return div;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function renderWidget(container, data, opts) {
    container.innerHTML = '';
    var wrapper = document.createElement('div');
    wrapper.className = 'sl-widget' + (opts.theme === 'light' ? ' sl-light' : '');

    // Header
    var header = document.createElement('div');
    header.className = 'sl-header';
    header.innerHTML =
      '<span class="sl-title">' + escapeHtml(opts.title || 'Changelog') + '</span>' +
      '<a class="sl-powered" href="' + BASE_URL + '" target="_blank" rel="noopener">Powered by ShipLog</a>';
    wrapper.appendChild(header);

    if (!data.entries || data.entries.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'sl-empty';
      empty.textContent = 'No changelog entries yet.';
      wrapper.appendChild(empty);
    } else {
      data.entries.forEach(function (entry) {
        wrapper.appendChild(renderEntry(entry));
      });
    }

    container.appendChild(createStyles());
    container.appendChild(wrapper);
  }

  function init() {
    var containers = document.querySelectorAll('[data-shiplog], #shiplog-widget');
    containers.forEach(function (el) {
      var slug = el.dataset.slug || el.dataset.shiplog;
      if (!slug) return;

      var opts = {
        theme: el.dataset.theme || 'dark',
        limit: parseInt(el.dataset.limit) || DEFAULT_LIMIT,
        category: el.dataset.category || null,
        title: el.dataset.title || 'Changelog',
        baseUrl: el.dataset.url || BASE_URL,
      };

      // Loading state
      el.innerHTML = '<div class="sl-loading">Loading changelog...</div>';

      var apiUrl = opts.baseUrl + '/api/embed/' + encodeURIComponent(slug) +
        '?limit=' + opts.limit +
        (opts.category ? '&category=' + opts.category : '');

      fetch(apiUrl)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          renderWidget(el, data, opts);
        })
        .catch(function (err) {
          el.innerHTML = '<div class="sl-error">Failed to load changelog</div>';
          console.error('[ShipLog Widget]', err);
        });
    });
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual initialization
  window.ShipLog = { init: init, version: WIDGET_VERSION };
})();
