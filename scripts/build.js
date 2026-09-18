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
    areasHref: `${homeUrl}#areas`,
    contactHref: `${homeUrl}#contact`
  };
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

function renderServiceCards(items, locale, fallbackHref) {
  return items
    .map((item) => {
      const route = item.linkRouteId ? getRoute(item.linkRouteId) : null;
      const href = route ? absoluteUrl(route, locale) : fallbackHref;
      return `        <a class="service-card service-card--${item.slug}" href="${href}">
          <img class="service-photo" src="${ASSET_BASE}/assets/img/${item.image}" alt="${item.alt}" width="1536" height="1024" loading="lazy">
          <div class="service-card-body">
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

function renderSelectOptions(options) {
  return options.map((opt) => `            <option value="${opt.value}">${opt.label}</option>`).join('\n');
}

function buildCalculatorValues(locale, content, common, whatsappHref) {
  const nav = buildNavLinks(locale);
  const { form, result } = content;

  const i18n = {
    serviceOptions: form.serviceOptions,
    sizeOptions: form.sizeOptions,
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

    navServices: common.nav.services,
    navServicesHref: nav.servicesHref,
    navVacantHome: common.nav.vacantHome,
    navVacantHomeHref: nav.vacantHomeHref,
    navAreas: common.nav.areas,
    navAreasHref: nav.areasHref,
    navContact: common.nav.contact,
    navContactHref: nav.contactHref,

    serviceLabel: form.serviceLabel,
    serviceOptionsHtml: renderSelectOptions(form.serviceOptions),
    sizeLabel: form.sizeLabel,
    sizeOptionsHtml: renderSelectOptions(form.sizeOptions),
    areaLabel: form.areaLabel,
    areaOptionsHtml: renderSelectOptions(form.areaOptions),
    submitLabel: form.submitLabel,

    calculatorI18nJson: JSON.stringify(i18n),

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
function renderSections(sections) {
  return sections
    .map((section) => {
      const items = Array.isArray(section.items)
        ? [
            '      <ul>',
            section.items.map((item) => `        <li>${CHECK_ICON}${item}</li>`).join('\n'),
            '      </ul>'
          ].join('\n')
        : '';

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

// Discreet hero photo for an interior page (e.g. a service page). Renders
// nothing when the page has no heroImage, so the hero falls back to its
// plain text-only layout.
function renderHeroImage(content) {
  if (!content.heroImage) return '';
  return `      <div class="interior-hero-media">
        <img src="${ASSET_BASE}/assets/img/${content.heroImage}" alt="${content.heroImageAlt || ''}" width="1536" height="1024" loading="lazy">
      </div>`;
}

// Before/after "evidence" photo block for a service page. Renders nothing
// when the page has no evidence block.
function renderEvidence(evidence) {
  if (!evidence || !evidence.image) return '';
  return [
    '  <section class="evidence-section">',
    '    <div class="wrap">',
    evidence.heading ? `      <h2>${evidence.heading}</h2>` : '',
    `      <img class="evidence-photo" src="${ASSET_BASE}/assets/img/${evidence.image}" alt="${evidence.alt || ''}" width="1536" height="1024" loading="lazy">`,
    evidence.caption ? `      <p class="evidence-caption">${evidence.caption}</p>` : '',
    '    </div>',
    '  </section>'
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

function renderRelatedLinks(content, contentByRoute, locale) {
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
      const title = target[locale].content.title;
      return `    <li><a href="${href}">${title}</a></li>`;
    })
    .join('\n');

  return render(template, { items });
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
    ctaPrimaryLabel: content.ctaPrimaryLabel,
    quoteCalculatorUrl,
    whatsappLabel: content.whatsappLabel,
    whatsappHref,

    navServices: common.nav.services,
    navVacantHome: common.nav.vacantHome,
    navAreas: common.nav.areas,
    navContact: common.nav.contact,

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
    serviceCardsHtml: renderServiceCards(content.services.items, locale, absoluteUrl(getRoute('services/additional'), locale)),
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

  return {
    assetBase: ASSET_BASE,
    homeUrl: nav.homeUrl,
    kicker: content.kicker || '',
    h1: content.h1,
    intro: content.intro,
    whatsappHref,
    whatsappLabel: content.whatsappLabel,
    heroImageHtml: renderHeroImage(content),

    navServices: common.nav.services,
    navServicesHref: nav.servicesHref,
    navVacantHome: common.nav.vacantHome,
    navVacantHomeHref: nav.vacantHomeHref,
    navAreas: common.nav.areas,
    navAreasHref: nav.areasHref,
    navContact: common.nav.contact,
    navContactHref: nav.contactHref,

    sectionsHtml: renderSections(content.sections || []),
    evidenceHtml: renderEvidence(content.evidence),
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

  pageValues.relatedLinks = renderRelatedLinks(content, contentByRoute, locale);

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
