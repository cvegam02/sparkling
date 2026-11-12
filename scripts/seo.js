'use strict';

// Pure helpers for the SEO-facing parts of <head>: social share tags and the
// LocalBusiness JSON-LD object. Kept out of build.js so they can be read (and
// changed) without wading through page-rendering code.

// Open Graph wants a territory-qualified locale; the site only serves the US.
const OG_LOCALES = { en: 'en_US', es: 'es_US' };

// Content strings are already HTML-safe (they carry entities like &mdash;),
// so only a stray double quote could break out of an attribute value.
function attr(value) {
  return String(value).replace(/"/g, '&quot;');
}

/**
 * Open Graph + Twitter card tags so links shared on WhatsApp, Facebook, etc.
 * render a preview card instead of a bare URL.
 */
function renderSocialMeta({ locale, otherLocales, siteName, title, description, url, imageUrl, imageAlt }) {
  const lines = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${attr(siteName)}">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    `<meta property="og:url" content="${attr(url)}">`,
    `<meta property="og:locale" content="${OG_LOCALES[locale]}">`,
    ...otherLocales.map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALES[l]}">`),
    `<meta property="og:image" content="${attr(imageUrl)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${attr(imageAlt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`
  ];
  return lines.map((line) => `  ${line}`).join('\n');
}

/**
 * schema.org LocalBusiness object. Optional fields (phone, Google profile)
 * are omitted entirely while their config value is still null.
 */
function buildLocalBusinessJsonLd({ business, siteUrl, logoUrl, imageUrl, areasServed, googleProfileUrl }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}#business`,
    name: business.name,
    ...(business.legalName ? { legalName: business.legalName } : {}),
    url: siteUrl,
    logo: logoUrl,
    image: imageUrl,
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(googleProfileUrl ? { sameAs: [googleProfileUrl] } : {}),
    areaServed: areasServed.map((name) => ({ '@type': 'City', name }))
  };
}

module.exports = { renderSocialMeta, buildLocalBusinessJsonLd };
