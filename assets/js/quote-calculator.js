(function () {
  'use strict';

  var form = document.getElementById('qc-form');
  var resultEl = document.getElementById('qc-result');
  var i18nEl = document.getElementById('qc-i18n');

  if (!form || !resultEl || !i18nEl || !window.SPARKLING_PRICING) return;

  var i18n = JSON.parse(i18nEl.textContent);
  var pricing = window.SPARKLING_PRICING;

  function formatMoney(amount) {
    return '$' + String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function optionLabel(options, value) {
    for (var i = 0; i < options.length; i++) {
      if (options[i].value === value) return options[i].label;
    }
    return value;
  }

  function fillTemplate(template, values) {
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return key in values ? values[key] : match;
    });
  }

  function computeRange(service, size, area) {
    var base = pricing.ranges[service] && pricing.ranges[service][size];
    if (!base || base[0] == null || base[1] == null) return null;

    var pct = pricing.areaAdjustmentPercent[area] || 0;
    var factor = 1 + pct / 100;
    return [Math.round(base[0] * factor), Math.round(base[1] * factor)];
  }

  function buildWhatsappHref(template, service, size, area, rangeText) {
    var message = fillTemplate(template, {
      service: optionLabel(i18n.serviceOptions, service),
      size: optionLabel(i18n.sizeOptions, size),
      area: optionLabel(i18n.areaOptions, area),
      range: rangeText || ''
    });
    return i18n.whatsappNumber + '?text=' + encodeURIComponent(message);
  }

  function renderResult(service, size, area) {
    var range = computeRange(service, size, area);
    var html = '';

    if (range) {
      var rangeText = formatMoney(range[0]) + '–' + formatMoney(range[1]);
      var href = buildWhatsappHref(i18n.whatsappMessageEstimate, service, size, area, rangeText);

      html =
        '<h2>' + i18n.result.estimateHeading + '</h2>' +
        '<p class="calculator-range">' + rangeText + '</p>' +
        '<p>' + i18n.result.estimateDisclaimer + '</p>' +
        '<a class="btn btn-whatsapp" href="' + href + '" target="_blank" rel="noopener">' + i18n.result.whatsappCtaLabel + '</a>';
    } else {
      var customHref = buildWhatsappHref(i18n.whatsappMessageCustom, service, size, area, null);

      html =
        '<h2>' + i18n.result.fallbackHeading + '</h2>' +
        '<p>' + i18n.result.fallbackBody + '</p>' +
        '<a class="btn btn-whatsapp" href="' + customHref + '" target="_blank" rel="noopener">' + i18n.result.whatsappCtaLabel + '</a>';
    }

    html += '<button type="button" class="btn btn-secondary qc-reset">' + i18n.result.startOverLabel + '</button>';

    resultEl.innerHTML = html;
    resultEl.hidden = false;
    form.hidden = true;

    resultEl.querySelector('.qc-reset').addEventListener('click', function () {
      form.reset();
      form.hidden = false;
      resultEl.hidden = true;
      resultEl.innerHTML = '';
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var service = data.get('service');
    var size = data.get('size');
    var area = data.get('area');
    if (!service || !size || !area) return;
    renderResult(service, size, area);
  });
})();
