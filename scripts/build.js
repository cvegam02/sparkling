'use strict';

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const config = require('../site.config.js');
const pricingConfig = require('../pricing.config.js');
const { validateContent, collectAltTextWarnings } = require('./validate.js');

const ROOT = path.join(__dirname, '..');
// PREVIEW_OUT_DIR/PREVIEW_BASE_URL let `npm run preview` build a local copy
// that links to itself on localhost instead of the production baseUrl, so
// clicking a link while reviewing doesn't jump off to a domain that isn't
// live yet. Plain `npm run build` (no env vars set) is unaffected.
const DIST = path.join(ROOT, process.env.PREVIEW_OUT_DIR || 'dist');
const BASE_URL = process.env.PREVIEW_BASE_URL || config.baseUrl;

// GitHub Pages project sites are served under a subpath (e.g.
// https://user.github.io/repo/), so every asset reference must be prefixed
// with that subpath rather than assuming the site lives at the domain root.
const ASSET_BASE = new URL(BASE_URL).pathname.replace(/\/$/, '');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing content file: ${path.relative(ROOT, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function render(template, values) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (!(key in values)) {
      throw new Error(`Missing value for template token "${key}"`);
    }
    return values[key];
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// --- routing helpers ------------------------------------------------------

function routeSegments(route, locale) {
  const localePrefix = locale === config.defaultLocale ? [] : [locale];
  const slugSegments = route.slug ? route.slug.split('/').filter(Boolean) : [];
  return [...localePrefix, ...slugSegments];
}

function urlPathFromSegments(segments) {
  return segments.length ? `/${segments.join('/')}/` : '/';
}

function absoluteUrl(route, locale) {
  const base = BASE_URL.replace(/\/$/, '');
  return base + urlPathFromSegments(routeSegments(route, locale));
}

// --- content loading --------------------------------------------------------

function loadAllContent() {
  // contentByRoute[route.id][locale] = { content, file }
  const contentByRoute = {};
  const pagesForValidation = [];

  for (const route of config.routes) {
    contentByRoute[route.id] = {};
    for (const locale of config.locales) {
      const slugPath = route.slug ? route.slug : route.id;
      const filePath = path.join(ROOT, 'content', locale, `${slugPath}.json`);
      const content = readJson(filePath);
      const relFile = path.relative(ROOT, filePath);

      contentByRoute[route.id][locale] = { content, file: relFile };
      pagesForValidation.push({ locale, file: relFile, content });
    }
  }

  return { contentByRoute, pagesForValidation };
}

function loadCommonContent() {
  const commonByLocale = {};
  for (const locale of config.locales) {
    commonByLocale[locale] = readJson(path.join(ROOT, 'content', locale, 'common.json'));
  }
  return commonByLocale;
}

function getRoute(id) {
  return config.routes.find((r) => r.id === id);
}

// Site-wide nav is anchor-based on the home page itself, but on every other
// page those anchors don't exist, so they must point back to the home page
// (or to the dedicated vacant-home page once it exists).
function buildNavLinks(locale) {
  const homeUrl = absoluteUrl(getRoute('home'), locale);
  const vacantRoute = getRoute('vacant-home');

  return {
    homeUrl,
    servicesHref: `${homeUrl}#paths`,
    vacantHomeHref: vacantRoute ? absoluteUrl(vacantRoute, locale) : `${homeUrl}#vacant-home`,
    contactHref: `${homeUrl}#contact`
  };
}

// Route ids for the individual service pages, in the order the "Services"
// nav submenu lists them.
const SERVICE_NAV_ROUTE_IDS = [
  'services/pre-sale',
  'services/post-sale',
  'services/cleaning',
  'services/painting',
  'services/repairs',
  'services/gardening'
];

function renderNavSubmenuItems(routeIds, locale, contentByRoute) {
  return routeIds
    .map((id) => {
      const label = contentByRoute[id][locale].content.kicker;
      const href = absoluteUrl(getRoute(id), locale);
      return `              <li><a href="${href}">${label}</a></li>`;
    })
    .join('\n');
}

function renderAreaNavSubmenuItems(locale) {
  return config.business.areasServed
    .map((area) => {
      const slug = area.toLowerCase().replace(/\s+/g, '-');
      const route = getRoute(`areas/${slug}`);
      const href = route ? absoluteUrl(route, locale) : '#';
      return `              <li><a href="${href}">${area}</a></li>`;
    })
    .join('\n');
}

// Link to the same page in the other locale. Rendered both inside the site
// nav (desktop and the collapsed mobile menu list) and standalone next to
// the hamburger button (mobile only, always visible — see .mobile-header-actions
// in assets/css/main.css) so switching language on mobile doesn't require
// opening the menu first.
function renderLangSwitchLink(locale, common, route, extraClass) {
  const otherLocale = config.locales.find((l) => l !== locale);
  const href = absoluteUrl(route, otherLocale);
  const classes = ['nav-lang-switch', extraClass].filter(Boolean).join(' ');
  return `<a class="${classes}" href="${href}" hreflang="${otherLocale}" lang="${otherLocale}" aria-label="${common.nav.languageSwitchAriaLabel}">${common.nav.languageSwitchLabel}</a>`;
}

// The full primary nav, shared by every template. Rendered as one block
// (rather than per-template tokens) because "Services" and "Areas" expand
// into submenus listing every service/area page — see .nav-submenu-toggle
// in assets/js/main.js for how those submenus open on click/tap.
function renderSiteNav(locale, common, contentByRoute, route) {
  const nav = buildNavLinks(locale);
  const areasHubHref = absoluteUrl(getRoute('areas'), locale);
  const quoteHref = absoluteUrl(getRoute('quote-calculator'), locale);
  const quoteCurrent = route.id === 'quote-calculator' ? ' aria-current="page"' : '';

  return `      <ul class="site-nav" id="site-nav">
        <li class="nav-item nav-item--has-submenu">
          <a href="${nav.servicesHref}">${common.nav.services}</a>
          <button type="button" class="nav-submenu-toggle" aria-expanded="false" aria-controls="nav-submenu-services" aria-label="${common.nav.submenuToggle}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <ul class="nav-submenu" id="nav-submenu-services">
${renderNavSubmenuItems(SERVICE_NAV_ROUTE_IDS, locale, contentByRoute)}
          </ul>
        </li>
        <li><a href="${nav.vacantHomeHref}">${common.nav.vacantHome}</a></li>
        <li class="nav-item nav-item--has-submenu">
          <a href="${areasHubHref}">${common.nav.areas}</a>
          <button type="button" class="nav-submenu-toggle" aria-expanded="false" aria-controls="nav-submenu-areas" aria-label="${common.nav.submenuToggle}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <ul class="nav-submenu" id="nav-submenu-areas">
${renderAreaNavSubmenuItems(locale)}
          </ul>
        </li>
        <li><a href="${quoteHref}"${quoteCurrent}>${common.nav.quote}</a></li>
        <li><a href="${nav.contactHref}">${common.nav.contact}</a></li>
        <li>${renderLangSwitchLink(locale, common, route)}</li>
      </ul>`;
}

// --- design-system icons (copied verbatim from the locked docs/design-reference.html /
// docs/superpowers/specs/2026-09-17-design-system.md — never redraw these) --

const CHECK_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5"/></svg>';

const PATH_ICONS = {
  presale:
    '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9"/><path d="M14.5 20v-6h-5v6"/></svg>',
  movein:
    '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12 20 3"/><path d="M16 4l3 3"/><path d="M13 7l2.5 2.5"/></svg>'
};

// New additions (not part of the original locked set above) — built only
// from primitives (<polygon>, <rect>, <polyline>, <line>) with coordinates
// checked by hand against the 24x24 viewBox center, per the icon rules in
// docs/superpowers/specs/2026-09-17-design-system.md (freehand bezier paths
// inside a badge have rendered off-center before).
const SERVICE_ICONS = {
  clean: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10"/></svg>',
  paint: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="14" height="6" rx="2"/><line x1="10" y1="10" x2="10" y2="15"/><line x1="10" y1="15" x2="19" y2="20"/></svg>',
  repairs: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="18" height="10" rx="1"/><polyline points="8,10 8,6 16,6 16,10"/><line x1="3" y1="15" x2="21" y2="15"/></svg>',
  garden: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7,15 17,15 15,21 9,21"/><line x1="12" y1="15" x2="12" y2="6"/><polygon points="12,6 12,9 5,7"/><polygon points="12,6 12,9 19,7"/></svg>'
};

// Per-service visual theme for video-hero pages (content `theme` field):
// drives the icon badge in the hero and the `service-theme--<key>` class
// that sets the page's accent colors in main.css.
const THEME_ICONS = {
  presale: PATH_ICONS.presale,
  movein: PATH_ICONS.movein,
  clean: SERVICE_ICONS.clean,
  paint: SERVICE_ICONS.paint,
  repairs: SERVICE_ICONS.repairs,
  garden: SERVICE_ICONS.garden
};

const HERO_ALIGNS = ['left', 'center', 'right'];

const EXPAND_ICON =
  '<svg class="evidence-zoom-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="4,9 4,4 9,4"/><polyline points="15,4 20,4 20,9"/><polyline points="20,15 20,20 15,20"/><polyline points="9,20 4,20 4,15"/></svg>';

const BILL_ICONS = {
  insurance:
    '<svg class="bill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12,3 20,7 20,13 12,21 4,13 4,7"/></svg>',
  homestead:
    '<svg class="bill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4,11 12,4 20,11"/><rect x="6" y="11" width="12" height="9"/></svg>',
  wear:
    '<svg class="bill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12,4 21,20 3,20"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17.3" r="0.75" fill="currentColor" stroke="none"/></svg>'
};

// --- repeating-group renderers -----------------------------------------

function renderPaths(paths, locale) {
  return paths
    .map((p) => {
      const items = p.items.map((item) => `        <li>${CHECK_ICON}${item}</li>`).join('\n');
      const href = p.linkRouteId ? absoluteUrl(getRoute(p.linkRouteId), locale) : '#contact';
      return [
        `      <div class="path path-${p.slug}">`,
        `        <span class="path-icon" aria-hidden="true">${PATH_ICONS[p.slug]}</span>`,
        `        <h3>${p.title}</h3>`,
        `        <p class="path-highlight">${p.highlight}</p>`,
        `        <p>${p.body}</p>`,
        '        <ul>',
        items,
        '        </ul>',
        `        <a class="btn btn-secondary" href="${href}">${p.ctaLabel}</a>`,
        '      </div>'
      ].join('\n');
    })
    .join('\n');
}

function renderBillItems(items) {
  return items
    .map(
      (item) => `          <li>
            ${BILL_ICONS[item.icon]}
            <div>
              <b>${item.label}</b>
              <span>${item.body}</span>
            </div>
          </li>`
    )
    .join('\n');
}

function renderServiceCards(items, locale) {
  return items
    .map((item) => {
      const route = item.linkRouteId ? getRoute(item.linkRouteId) : null;
      if (!route) throw new Error(`home services card "${item.slug}" has no valid linkRouteId`);
      const href = absoluteUrl(route, locale);
      return `        <a class="service-card service-card--${item.slug}" href="${href}">
          <img class="service-photo" src="${ASSET_BASE}/assets/img/${item.image}" alt="${item.alt}" width="1536" height="1024" loading="lazy">
          <div class="service-card-body">
            <span class="service-icon" aria-hidden="true">${SERVICE_ICONS[item.slug]}</span>
            <h3>${item.title}</h3>
            <p>${item.body}</p>
          </div>
        </a>`;
    })
    .join('\n');
}

function renderHowSteps(steps) {
  return steps.map((step) => `        <li>${step}</li>`).join('\n');
}

const PIN_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';

function renderAreasList(locale) {
  return config.business.areasServed
    .map((area) => {
      const slug = area.toLowerCase().replace(/\s+/g, '-');
      const route = getRoute(`areas/${slug}`);
      const href = route ? absoluteUrl(route, locale) : '#areas';
      return `      <li><a href="${href}">${PIN_ICON}${area}</a></li>`;
    })
    .join('\n');
}

// The same "Where we work" list of area pages used on the home page,
// reused on the areas hub page. Renders nothing when the interior page's
// content has no `areasSection` (every other interior page).
function renderAreasSection(heading, locale) {
  return [
    '  <section class="areas" id="areas">',
    '    <div class="wrap">',
    `      <h2>${heading}</h2>`,
    '      <ul class="areas-list">',
    renderAreasList(locale),
    '      </ul>',
    '    </div>',
    '  </section>'
  ].join('\n');
}

function fillPlaceholders(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}

function formatUsd(amount) {
  const cents = Number.isInteger(amount) ? 0 : 2;
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents, maximumFractionDigits: cents });
}

// Every item the page offers must have a matching entry in
// pricing.config.js (a null price is fine; a missing key is a typo).
function assertPricingKeys(form) {
  const checks = [
    ['cleaningTypes', form.cleaningTypes.map((t) => t.value)],
    ['rooms', form.rooms.map((r) => r.id)],
    ['extras', form.extras.map((e) => e.id)],
    ['travelFee', form.areaOptions.map((a) => a.value)]
  ];
  for (const [section, ids] of checks) {
    for (const id of ids) {
      if (!pricingConfig[section] || !(id in pricingConfig[section])) {
        throw new Error(`quote-calculator content uses "${id}" but pricing.config.js has no ${section}.${id}`);
      }
    }
  }
}

function renderCleaningTypes(form) {
  return form.cleaningTypes
    .map((type, i) => {
      const price = pricingConfig.cleaningTypes[type.value].basePrice;
      const from = price == null ? '' : `<span class="qc-type-price">${fillPlaceholders(form.fromLabel, { price: formatUsd(price) })}</span>`;
      return [
        '            <label class="qc-type">',
        `              <input type="radio" name="type" value="${type.value}"${i === 0 ? ' checked' : ''}>`,
        '              <span class="qc-type-body">',
        `                <span class="qc-type-name">${type.label}</span>`,
        `                <span class="qc-type-desc">${type.description}</span>`,
        `                ${from}`,
        '              </span>',
        '            </label>'
      ].join('\n');
    })
    .join('\n');
}

function renderStepperRow(id, label, rule, form) {
  const each = rule.price == null ? '' : `<small>${fillPlaceholders(form.eachLabel, { price: formatUsd(rule.price) })}</small>`;
  const max = rule.max == null ? 20 : rule.max;
  return [
    '            <div class="qc-row">',
    `              <label class="qc-row-label" for="qc-${id}">${label} ${each}</label>`,
    '              <div class="qc-stepper">',
    `                <button type="button" data-step="-1" data-target="qc-${id}" aria-label="${fillPlaceholders(form.decreaseLabel, { item: label })}">&minus;</button>`,
    `                <input type="number" id="qc-${id}" name="${id}" min="0" max="${max}" value="${rule.default || 0}" inputmode="numeric">`,
    `                <button type="button" data-step="1" data-target="qc-${id}" aria-label="${fillPlaceholders(form.increaseLabel, { item: label })}">+</button>`,
    '              </div>',
    '            </div>'
  ].join('\n');
}

function renderToggleRow(id, label, rule) {
  const price = rule.price == null ? '' : `<small>+${formatUsd(rule.price)}</small>`;
  return [
    '            <label class="qc-row qc-toggle">',
    `              <span class="qc-row-label">${label} ${price}</span>`,
    `              <input type="checkbox" name="${id}" value="1">`,
    '            </label>'
  ].join('\n');
}

function renderRooms(form) {
  return form.rooms.map((room) => renderStepperRow(room.id, room.label, pricingConfig.rooms[room.id], form)).join('\n');
}

function renderExtras(form) {
  return form.extras
    .map((extra) => {
      const rule = pricingConfig.extras[extra.id];
      return rule.kind === 'toggle'
        ? renderToggleRow(extra.id, extra.label, rule)
        : renderStepperRow(extra.id, extra.label, rule, form);
    })
    .join('\n');
}

function renderAreaChips(form) {
  return form.areaOptions
    .map(
      (area, i) =>
        `            <label class="qc-chip"><input type="radio" name="area" value="${area.value}"${i === 0 ? ' checked' : ''}><span>${area.label}</span></label>`
    )
    .join('\n');
}

function buildCalculatorValues(locale, content, common, whatsappHref) {
  const nav = buildNavLinks(locale);
  const { form, result } = content;
  assertPricingKeys(form);

  const i18n = {
    cleaningTypes: form.cleaningTypes,
    rooms: form.rooms,
    extras: form.extras,
    areaOptions: form.areaOptions,
    result,
    whatsappMessageEstimate: content.whatsappMessageEstimate,
    whatsappMessageCustom: content.whatsappMessageCustom,
    whatsappNumber: config.business.whatsapp
  };

  return {
    assetBase: ASSET_BASE,
    homeUrl: nav.homeUrl,
    kicker: content.kicker || '',
    h1: content.h1,
    intro: content.intro,
    whatsappHref,

    typeLegend: form.typeLegend,
    cleaningTypesHtml: renderCleaningTypes(form),
    roomsLegend: form.roomsLegend,
    roomsHtml: renderRooms(form),
    extrasLegend: form.extrasLegend,
    extrasHtml: renderExtras(form),
    areaLegend: form.areaLegend,
    areaOptionsHtml: renderAreaChips(form),
    otherServicesNote: form.otherServicesNote,
    otherServicesLink: form.otherServicesLink,

    resultHeading: result.heading,
    mobileBarLabel: result.mobileBarLabel,
    mobileBarLink: result.mobileBarLink,
    noscriptText: result.noscript,

    calculatorI18nJson: JSON.stringify(i18n).replace(/</g, '\\u003c'),

    footerCopyright: common.footer.copyright,
    footerWhatsappLabel: common.footer.whatsappLabel
  };
}

function writePricingData() {
  const js = `window.SPARKLING_PRICING = ${JSON.stringify(pricingConfig)};\n`;
  const outDir = path.join(DIST, 'assets', 'js');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'pricing-data.js'), js);
}

// Generic content blocks used by interior pages (service/area/vacant-home).
// Each section is heading + body, with an optional checklist.
function renderSectionList(items) {
  if (!Array.isArray(items)) return '';
  return [
    '      <ul>',
    items.map((item) => `        <li>${CHECK_ICON}${item}</li>`).join('\n'),
    '      </ul>'
  ].join('\n');
}

// Pages with a full-bleed video hero show their sections as side-by-side
// cards in a single band, so short content doesn't read as a string of
// near-empty full-width stripes after the big hero.
function renderSectionCards(sections, style) {
  if (sections.length === 0) return '';
  const modifier = style === 'split' ? ' service-overview--split' : '';
  const cards = sections
    .map((section) =>
      [
        '      <article class="overview-card">',
        `        <h2>${section.heading}</h2>`,
        `        <p>${section.body}</p>`,
        renderSectionList(section.items).replace(/^/gm, '  '),
        '      </article>'
      ]
        .filter((line) => line.trim())
        .join('\n')
    )
    .join('\n');
  return [`  <section class="content-section service-overview${modifier}">`, '    <div class="wrap service-overview-grid">', cards, '    </div>', '  </section>'].join('\n');
}

// Closing call to action for video-hero pages. The page's own `cta`
// (heading, body, primary) overrides the shared copy in common.json.
// `primary: "quote"` leads with the cleaning calculator; "whatsapp" leads
// with WhatsApp (the calculator only prices cleaning), and "whatsapp+quote"
// keeps the calculator as a secondary option.
function renderServiceCta(content, common, whatsappHref, locale) {
  const cta = { ...common.serviceCta, ...(content.cta || {}) };
  const quoteHref = absoluteUrl(getRoute('quote-calculator'), locale);
  const quoteBtn = (cls) => `        <a class="btn ${cls}" href="${quoteHref}">${common.serviceCta.quoteLabel}</a>`;
  const whatsappBtn = `        <a class="btn btn-whatsapp" href="${whatsappHref}" target="_blank" rel="noopener">${content.whatsappLabel || common.footer.whatsappLabel}</a>`;
  const buttons = {
    quote: [quoteBtn('btn-primary'), whatsappBtn],
    whatsapp: [whatsappBtn],
    'whatsapp+quote': [whatsappBtn, quoteBtn('btn-secondary')]
  }[cta.primary || 'quote'];
  if (!buttons) throw new Error(`unknown cta.primary "${cta.primary}"`);
  return `  <section class="service-cta">
    <div class="wrap">
      <h2>${cta.heading}</h2>
      <p>${cta.body}</p>
      <div class="cta-row">
${buttons.join('\n')}
      </div>
    </div>
  </section>`;
}

function assertHeroTheme(content) {
  if (!content.heroVideo) return;
  if (!THEME_ICONS[content.theme]) {
    throw new Error(`page with heroVideo needs a "theme" (one of ${Object.keys(THEME_ICONS).join(', ')}), got "${content.theme}"`);
  }
  if (content.heroAlign && !HERO_ALIGNS.includes(content.heroAlign)) {
    throw new Error(`heroAlign must be one of ${HERO_ALIGNS.join(', ')}, got "${content.heroAlign}"`);
  }
}

function renderSections(sections) {
  return sections
    .map((section) => {
      const items = renderSectionList(section.items);

      return [
        '  <section class="content-section">',
        '    <div class="wrap">',
        `      <h2>${section.heading}</h2>`,
        `      <p>${section.body}</p>`,
        items,
        '    </div>',
        '  </section>'
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
}

// Full-bleed looping background video behind the interior hero copy, with
// a dark overlay (CSS) so the white text stays legible. Renders nothing when
// the page has no heroVideo.
function renderHeroBackground(content) {
  if (!content.heroVideo) return '';
  const videoSrc = `${ASSET_BASE}/assets/video/${content.heroVideo}`;
  const mimeType = VIDEO_MIME_TYPES[path.extname(content.heroVideo)] || 'video/mp4';
  return `    <div class="interior-hero-bg">
      <video width="1280" height="720"${content.heroImage ? ` poster="${ASSET_BASE}/assets/img/${content.heroImage}"` : ''} aria-label="${content.heroVideoAlt || ''}" autoplay muted loop playsinline preload="auto">
        <source src="${videoSrc}" type="${mimeType}">
      </video>
    </div>`;
}

// Discreet hero photo for an interior page (e.g. a service page). Renders
// nothing when the page has no heroImage (or uses a heroVideo background
// instead), so the hero falls back to its plain text-only layout.
function renderHeroImage(content) {
  if (content.heroVideo || !content.heroImage) return '';
  return `      <div class="interior-hero-media">
        <img src="${ASSET_BASE}/assets/img/${content.heroImage}" alt="${content.heroImageAlt || ''}" width="1536" height="1024" loading="lazy">
      </div>`;
}

const VIDEO_MIME_TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm' };

// Proof-of-work "evidence" block for a service page: a looping video when
// the content provides one (with `image` as its optional poster), otherwise
// a before/after photo. Renders nothing when the page has no evidence block. The photo variant opens in a native
// <dialog> lightbox on click (see assets/js/main.js) for a closer look at
// full size; the video variant plays inline and needs no lightbox since its
// own controls already give a bigger, pausable view.
// Intrinsic pixel size of a WebP in assets/img, read from its header, so
// width/height attributes match the real file (prevents layout shift and
// wrong aspect hints). Falls back to 1536x1024 for other formats.
function imageSize(file) {
  const buf = fs.readFileSync(path.join(ROOT, 'assets', 'img', file));
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  return { width: 1536, height: 1024 };
}

function renderEvidence(evidence, common) {
  if (!evidence || (!evidence.image && !evidence.video)) return '';
  const posterSrc = evidence.image ? `${ASSET_BASE}/assets/img/${evidence.image}` : '';
  const alt = evidence.alt || '';

  if (evidence.video) {
    const videoSrc = `${ASSET_BASE}/assets/video/${evidence.video}`;
    const mimeType = VIDEO_MIME_TYPES[path.extname(evidence.video)] || 'video/mp4';
    return [
      '  <section class="evidence-section">',
      '    <div class="wrap">',
      evidence.heading ? `      <h2>${evidence.heading}</h2>` : '',
      `      <video class="evidence-video" width="1536" height="1024"${posterSrc ? ` poster="${posterSrc}"` : ''} aria-label="${alt}" autoplay muted loop playsinline controls preload="metadata">`,
      `        <source src="${videoSrc}" type="${mimeType}">`,
      '      </video>',
      evidence.caption ? `      <p class="evidence-caption">${evidence.caption}</p>` : '',
      '    </div>',
      '  </section>'
    ]
      .filter(Boolean)
      .join('\n');
  }

  const size = imageSize(evidence.image);
  return [
    '  <section class="evidence-section">',
    '    <div class="wrap">',
    evidence.heading ? `      <h2>${evidence.heading}</h2>` : '',
    `      <button type="button" class="evidence-photo-trigger" data-lightbox-trigger aria-label="${common.evidence.expandLabel}">`,
    `        <img class="evidence-photo" src="${posterSrc}" alt="${alt}" width="${size.width}" height="${size.height}" loading="lazy">`,
    `        ${EXPAND_ICON}`,
    '      </button>',
    evidence.caption ? `      <p class="evidence-caption">${evidence.caption}</p>` : '',
    '    </div>',
    '  </section>',
    '  <dialog class="lightbox">',
    `    <button type="button" class="lightbox-close" data-lightbox-close aria-label="${common.evidence.closeLabel}">&times;</button>`,
    `    <img class="lightbox-photo" src="${posterSrc}" alt="${alt}">`,
    '  </dialog>'
  ]
    .filter(Boolean)
    .join('\n');
}

// --- partials ---------------------------------------------------------------

function renderHreflangLinks(route) {
  const lines = config.locales.map(
    (locale) => `  <link rel="alternate" hreflang="${locale}" href="${absoluteUrl(route, locale)}">`
  );
  lines.push(`  <link rel="alternate" hreflang="x-default" href="${absoluteUrl(route, config.defaultLocale)}">`);
  return lines.join('\n');
}

function renderLocalBusinessSchema(areasServed) {
  const template = fs.readFileSync(
    path.join(ROOT, 'templates', 'partials', 'local-business-schema.html'),
    'utf8'
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: config.business.name,
    ...(config.business.phone ? { telephone: config.business.phone } : {}),
    areaServed: areasServed.map((name) => ({ '@type': 'City', name }))
  };

  return render(template, { jsonLd: JSON.stringify(jsonLd, null, 2) });
}

function renderReviews(common) {
  const template = fs.readFileSync(path.join(ROOT, 'templates', 'partials', 'reviews.html'), 'utf8');
  const { profileUrl, widgetEmbedHtml } = config.googleReviews;

  let body;
  if (widgetEmbedHtml) {
    body = widgetEmbedHtml;
  } else if (profileUrl) {
    body = `    <p>${common.reviews.placeholderBody}</p>\n    <a class="btn btn-secondary" href="${profileUrl}" target="_blank" rel="noopener">${common.reviews.linkLabel}</a>`;
  } else {
    body = `    <p>${common.reviews.placeholderBody}</p>`;
  }

  return render(template, { heading: common.reviews.heading, body });
}

function renderRelatedLinks(content, contentByRoute, locale, common) {
  const relatedIds = Array.isArray(content.relatedPages) ? content.relatedPages : [];
  if (relatedIds.length === 0) return '';

  const template = fs.readFileSync(path.join(ROOT, 'templates', 'partials', 'related-links.html'), 'utf8');

  const items = relatedIds
    .map((id) => {
      const target = contentByRoute[id];
      if (!target) {
        throw new Error(`relatedPages references unknown route id "${id}"`);
      }
      const targetRoute = config.routes.find((r) => r.id === id);
      const href = absoluteUrl(targetRoute, locale);
      // Page titles carry a " | Rosa's Sparkling ..." suffix for SEO; the
      // link only needs the page's own name.
      const title = target[locale].content.title.split(' | ')[0];
      return `      <li><a href="${href}">${title}</a></li>`;
    })
    .join('\n');

  return render(template, { items, heading: common.relatedHeading });
}

// --- page rendering -----------------------------------------------------

function buildHomeValues(locale, content, common, whatsappHref) {
  const quoteCalculatorUrl = absoluteUrl(getRoute('quote-calculator'), locale);

  return {
    assetBase: ASSET_BASE,
    h1: content.h1,
    kicker: content.kicker,
    tagline: content.tagline,
    heroBody: content.heroBody,
    heroImage: content.heroImage,
    heroImageAlt: content.heroImageAlt,
    ctaPrimaryLabel: content.ctaPrimaryLabel,
    quoteCalculatorUrl,
    whatsappLabel: content.whatsappLabel,
    whatsappHref,

    vacantNoteHeading: content.vacantNote.heading,
    vacantNoteBody: content.vacantNote.body,

    pathsHtml: renderPaths(content.paths, locale),

    vacantKicker: content.vacantBand.kicker,
    vacantHeading: content.vacantBand.heading,
    vacantBody: content.vacantBand.body,
    billHeading: content.vacantBand.billHeading,
    billItemsHtml: renderBillItems(content.vacantBand.billItems),
    billCtaLabel: content.vacantBand.ctaLabel,
    billCtaHref: quoteCalculatorUrl,

    resultsHeading: content.results.heading,
    resultsBody: content.results.body,
    resultsBeforeLabel: content.results.beforeLabel,
    resultsBeforePrice: content.results.beforePrice,
    resultsAfterLabel: content.results.afterLabel,
    resultsAfterPrice: content.results.afterPrice,
    resultsAfterDelta: content.results.afterDelta,
    resultsNote: content.results.note,

    servicesHeading: content.services.heading,
    servicesBody: content.services.body,
    serviceCardsHtml: renderServiceCards(content.services.items, locale),
    servicesSecondaryNote: content.services.secondaryNote,

    howHeading: content.how.heading,
    howStepsHtml: renderHowSteps(content.how.steps),

    areasHeading: content.areasSection.heading,
    areasListHtml: renderAreasList(locale),

    reviewsHtml: renderReviews(common),

    footerCopyright: common.footer.copyright,
    footerWhatsappLabel: common.footer.whatsappLabel
  };
}

function buildInteriorValues(locale, content, common, whatsappHref) {
  const nav = buildNavLinks(locale);
  assertHeroTheme(content);

  return {
    assetBase: ASSET_BASE,
    homeUrl: nav.homeUrl,
    kicker: content.kicker || '',
    h1: content.h1,
    intro: content.intro,
    whatsappHref,
    whatsappLabel: content.whatsappLabel,
    heroImageHtml: renderHeroImage(content),
    heroBackgroundHtml: renderHeroBackground(content),
    heroModifierClass: content.heroVideo ? ` interior-hero--video interior-hero--align-${content.heroAlign || 'left'}` : '',
    mainClassAttr: content.heroVideo ? ` class="service-theme service-theme--${content.theme}"` : '',
    kickerIconHtml: content.heroVideo ? `<span class="kicker-icon" aria-hidden="true">${THEME_ICONS[content.theme]}</span>` : '',

    sectionsHtml: content.heroVideo
      ? renderSectionCards(content.sections || [], content.overviewStyle)
      : renderSections(content.sections || []),
    serviceCtaHtml: content.heroVideo ? renderServiceCta(content, common, whatsappHref, locale) : '',
    evidenceHtml: renderEvidence(content.evidence, common),
    areasListHtml: content.areasSection ? renderAreasSection(content.areasSection.heading, locale) : '',
    reviewsHtml: content.showReviews ? renderReviews(common) : '',

    footerCopyright: common.footer.copyright,
    footerWhatsappLabel: common.footer.whatsappLabel
  };
}

function buildPage(route, locale, contentByRoute, commonByLocale) {
  const { content } = contentByRoute[route.id][locale];
  const common = commonByLocale[locale];

  const templateName = route.template || 'page';
  const pageTemplate = fs.readFileSync(path.join(ROOT, 'templates', `${templateName}.html`), 'utf8');
  const layoutTemplate = fs.readFileSync(path.join(ROOT, 'templates', 'layout.html'), 'utf8');

  const whatsappHref = `${config.business.whatsapp}?text=${encodeURIComponent(content.whatsappMessage)}`;

  let pageValues;
  if (templateName === 'home') {
    pageValues = buildHomeValues(locale, content, common, whatsappHref);
  } else if (templateName === 'calculator') {
    pageValues = buildCalculatorValues(locale, content, common, whatsappHref);
  } else {
    pageValues = buildInteriorValues(locale, content, common, whatsappHref);
  }

  pageValues.relatedLinks = renderRelatedLinks(content, contentByRoute, locale, common);
  pageValues.siteNavHtml = renderSiteNav(locale, common, contentByRoute, route);
  pageValues.mobileLangSwitchHtml = renderLangSwitchLink(locale, common, route, 'mobile-lang-switch');

  const pageHtml = render(pageTemplate, pageValues);

  const areasServed = content.areaServed || config.business.areasServed;

  const finalHtml = render(layoutTemplate, {
    locale,
    title: content.title,
    metaDescription: content.metaDescription,
    canonicalUrl: absoluteUrl(route, locale),
    hreflangLinks: renderHreflangLinks(route),
    assetBase: ASSET_BASE,
    localBusinessSchema: renderLocalBusinessSchema(areasServed),
    content: pageHtml
  });

  const segments = routeSegments(route, locale);
  const outDir = path.join(DIST, ...segments);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), finalHtml);

  return absoluteUrl(route, locale);
}

// --- sitemap / robots -----------------------------------------------------

function writeSitemap(urls) {
  const body = urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
}

function writeRobots() {
  const sitemapUrl = `${BASE_URL.replace(/\/$/, '')}/sitemap.xml`;
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robots);
}

// --- main -------------------------------------------------------------------

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const { contentByRoute, pagesForValidation } = loadAllContent();
  const commonByLocale = loadCommonContent();
  validateContent(pagesForValidation);

  for (const warning of collectAltTextWarnings(pagesForValidation)) {
    console.warn(`Warning: ${warning}`);
  }

  const urls = [];
  for (const route of config.routes) {
    for (const locale of config.locales) {
      try {
        urls.push(buildPage(route, locale, contentByRoute, commonByLocale));
      } catch (err) {
        const { file } = contentByRoute[route.id][locale];
        throw new Error(`Error building route "${route.id}" [${locale}] (${file}): ${err.message}`);
      }
    }
  }

  writeSitemap(urls);
  writeRobots();

  const assetsDir = path.join(ROOT, 'assets');
  if (fs.existsSync(assetsDir)) {
    copyDir(assetsDir, path.join(DIST, 'assets'));
  }

  writePricingData();

  console.log(`Build complete: ${urls.length} page(s) across ${config.locales.length} locale(s).`);
}

try {
  build();
} catch (err) {
  console.error(`Build failed: ${err.message}`);
  process.exit(1);
}
