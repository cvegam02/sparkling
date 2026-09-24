(function () {
  'use strict';

  // ---- Pure pricing logic (no DOM) --------------------------------------

  function toCents(price) {
    return price == null ? null : Math.round(price * 100);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Returns every priced line for the current selection, the total in
  // cents (null when any selected item has no price yet), the estimated
  // minutes of work and the suggested number of cleaners.
  function computeQuote(state, pricing) {
    var type = pricing.cleaningTypes[state.type];
    var lines = [{ key: 'base', qty: 1, cents: toCents(type.basePrice) }];
    var workMinutes = 0;

    function addItems(rules) {
      Object.keys(rules).forEach(function (id) {
        var qty = state.counts[id] || 0;
        if (qty <= 0) return;
        var rule = rules[id];
        var unit = toCents(rule.price);
        lines.push({ key: id, qty: qty, cents: unit == null ? null : unit * qty });
        workMinutes += (rule.minutes || 0) * qty;
      });
    }

    addItems(pricing.rooms);
    addItems(pricing.extras);

    var travel = pricing.travelFee[state.area];
    if (travel == null || travel > 0) {
      lines.push({ key: 'travel', qty: 1, cents: toCents(travel) });
    }

    var totalCents = lines.reduce(function (sum, line) {
      return sum == null || line.cents == null ? null : sum + line.cents;
    }, 0);

    var minutes = Math.round((pricing.baseMinutes || 0) + workMinutes * (type.timeMultiplier || 1));
    var crew = pricing.crew;
    var cleaners = clamp(Math.ceil(minutes / crew.minutesPerCleaner), crew.min, crew.max);

    return { lines: lines, totalCents: totalCents, minutes: minutes, cleaners: cleaners };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { computeQuote: computeQuote };
    return;
  }

  // ---- Page wiring -------------------------------------------------------

  var form = document.getElementById('qc-form');
  var summaryBody = document.getElementById('qc-summary-body');
  var summary = document.getElementById('qc-summary');
  var mobileBar = document.getElementById('qc-mobile-bar');
  var mobileTotal = document.getElementById('qc-mobile-total');
  var i18nEl = document.getElementById('qc-i18n');

  if (!form || !summaryBody || !i18nEl || !window.SPARKLING_PRICING) return;

  var i18n = JSON.parse(i18nEl.textContent);
  var pricing = window.SPARKLING_PRICING;
  var t = i18n.result;

  function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return key in values ? values[key] : match;
    });
  }

  function formatMoney(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function formatDuration(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    var parts = [];
    if (h > 0) parts.push(fill(t.hours, { h: h }));
    if (m > 0 || h === 0) parts.push(fill(t.minutes, { m: m }));
    return parts.join(' ');
  }

  function labelFor(list, idKey, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i][idKey] === id) return list[i].label;
    }
    return id;
  }

  function readState() {
    var data = new FormData(form);
    var counts = {};
    var rules = Object.assign({}, pricing.rooms, pricing.extras);
    Object.keys(rules).forEach(function (id) {
      var raw = parseInt(data.get(id), 10);
      var max = rules[id].kind === 'toggle' ? 1 : rules[id].max == null ? 20 : rules[id].max;
      counts[id] = isNaN(raw) ? 0 : clamp(raw, 0, max);
    });
    return { type: data.get('type'), area: data.get('area'), counts: counts };
  }

  function lineLabel(line, state) {
    if (line.key === 'base') {
      return fill(t.basePriceLabel, { type: labelFor(i18n.cleaningTypes, 'value', state.type) });
    }
    if (line.key === 'travel') {
      return fill(t.travelLabel, { area: labelFor(i18n.areaOptions, 'value', state.area) });
    }
    if (pricing.rooms[line.key]) {
      return labelFor(i18n.rooms, 'id', line.key) + ' (' + line.qty + ')';
    }
    var extra = pricing.extras[line.key];
    var label = labelFor(i18n.extras, 'id', line.key);
    return extra.kind === 'toggle' ? label : label + ' (×' + line.qty + ')';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function metaRow(label, value) {
    var row = el('div', 'qc-meta-row');
    row.appendChild(el('dt', null, label));
    row.appendChild(el('dd', null, value));
    return row;
  }

  function whatsappHref(quote, state) {
    var items = quote.lines
      .filter(function (line) { return line.key !== 'base' && line.key !== 'travel'; })
      .map(function (line) { return '- ' + lineLabel(line, state); })
      .join('\n');
    var values = {
      type: labelFor(i18n.cleaningTypes, 'value', state.type).toLowerCase(),
      area: labelFor(i18n.areaOptions, 'value', state.area),
      items: items,
      total: quote.totalCents == null ? '' : formatMoney(quote.totalCents)
    };
    var template = quote.totalCents == null ? i18n.whatsappMessageCustom : i18n.whatsappMessageEstimate;
    return i18n.whatsappNumber + '?text=' + encodeURIComponent(fill(template, values));
  }

  function renderActions(container, quote, state) {
    var actions = el('div', 'qc-actions');
    var wa = el('a', 'btn btn-whatsapp qc-whatsapp', t.whatsappCtaLabel);
    wa.href = whatsappHref(quote, state);
    wa.target = '_blank';
    wa.rel = 'noopener';
    actions.appendChild(wa);

    if (quote.totalCents != null) {
      var print = el('button', 'btn btn-secondary qc-print', t.printLabel);
      print.type = 'button';
      print.addEventListener('click', function () { window.print(); });
      actions.appendChild(print);
    }
    container.appendChild(actions);
  }

  function render() {
    var state = readState();
    var quote = computeQuote(state, pricing);
    var frag = document.createDocumentFragment();

    var meta = el('dl', 'qc-meta');
    meta.appendChild(metaRow(t.estimatedTimeLabel, formatDuration(quote.minutes)));
    meta.appendChild(metaRow(t.suggestedCleanersLabel, String(quote.cleaners)));
    frag.appendChild(meta);

    if (quote.totalCents == null) {
      frag.appendChild(el('h3', 'qc-fallback-heading', t.fallbackHeading));
      frag.appendChild(el('p', 'qc-note', t.fallbackBody));
    } else {
      var list = el('dl', 'qc-lines');
      quote.lines.forEach(function (line) {
        var row = el('div', 'qc-line');
        row.appendChild(el('dt', null, lineLabel(line, state)));
        row.appendChild(el('dd', null, formatMoney(line.cents)));
        list.appendChild(row);
      });
      frag.appendChild(list);

      var total = el('div', 'qc-total');
      total.appendChild(el('span', 'qc-total-label', t.totalLabel));
      var amount = el('output', 'qc-total-amount', formatMoney(quote.totalCents));
      total.appendChild(amount);
      frag.appendChild(total);
      frag.appendChild(el('p', 'qc-note', t.disclaimer));
    }

    renderActions(frag, quote, state);

    summaryBody.textContent = '';
    summaryBody.appendChild(frag);

    if (mobileTotal) {
      mobileTotal.textContent = quote.totalCents == null ? '—' : formatMoney(quote.totalCents);
    }
  }

  function syncStepperButtons(input) {
    var value = parseInt(input.value, 10) || 0;
    var min = parseInt(input.min, 10) || 0;
    var max = parseInt(input.max, 10);
    form.querySelectorAll('[data-target="' + input.id + '"]').forEach(function (btn) {
      var step = parseInt(btn.getAttribute('data-step'), 10);
      btn.disabled = step < 0 ? value <= min : value >= max;
    });
  }

  function normalizeInput(input) {
    var min = parseInt(input.min, 10) || 0;
    var max = parseInt(input.max, 10);
    var value = parseInt(input.value, 10);
    input.value = clamp(isNaN(value) ? min : value, min, max);
    syncStepperButtons(input);
  }

  form.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-step]');
    if (!btn) return;
    var input = document.getElementById(btn.getAttribute('data-target'));
    input.value = (parseInt(input.value, 10) || 0) + parseInt(btn.getAttribute('data-step'), 10);
    normalizeInput(input);
    render();
  });

  form.addEventListener('input', render);
  form.addEventListener('change', function (event) {
    if (event.target.type === 'number') normalizeInput(event.target);
    render();
  });
  form.addEventListener('submit', function (event) { event.preventDefault(); });

  form.querySelectorAll('input[type="number"]').forEach(syncStepperButtons);
  render();

  // Mobile: a sticky total bar while the breakdown card is off-screen.
  if (mobileBar && summary && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      mobileBar.hidden = entries[0].isIntersecting;
    }).observe(summary);
  }
})();
