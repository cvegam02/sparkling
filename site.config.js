'use strict';

// Single source of truth for site-wide config: locales, routes, and business
// data used to build hreflang pairs, sitemap URLs, and LocalBusiness schema.

module.exports = {
  baseUrl: 'https://rosasparkling.com',

  defaultLocale: 'en',
  locales: ['en', 'es'],

  business: {
    name: "Rosa's Sparkling Clean & Management",
    // Registered legal entity name. Used in the footer copyright and as
    // schema.org `legalName`; the brand `name` above stays as-is in headers/titles.
    legalName: "Rosa's Sparkling Clean & Management LLC",
    // E.164-style for schema.org `telephone`; the same number is the
    // WhatsApp line (wa.me takes digits only, country code first).
    phone: '+1-813-834-1680',
    whatsapp: 'https://wa.me/18138341680',
    areasServed: ['Ocala', 'Tampa', 'Spring Hill']
  },

  // Reviews section (home page + area pages): shows a clean placeholder
  // until a Google Business Profile exists. To activate it once you have
  // one:
  //   1. Set `profileUrl` to your Google Business Profile listing URL —
  //      the placeholder becomes a "See our reviews on Google" link.
  //      It's also added to the LocalBusiness schema as `sameAs`, which
  //      helps Google link the site to the profile.
  //   2. Optionally also set `widgetEmbedHtml` to the exact embed snippet
  //      Google (or your review-widget provider) gives you — when set, it
  //      replaces the placeholder text entirely with the real widget.
  googleReviews: {
    profileUrl: null,
    widgetEmbedHtml: null
  },

  // Each route is rendered once per locale, at the same `slug` for every
  // locale. `slug: ''` means the route lives at the root of its locale
  // (dist/index.html for the default locale, dist/es/index.html for es).
  // `template` picks which templates/<name>.html to render into; routes
  // without one default to the generic interior page template.
  routes: [
    { id: 'home', slug: '', template: 'home' },
    { id: 'quote-calculator', slug: 'quote-calculator', template: 'calculator' },
    { id: 'vacant-home', slug: 'vacant-home' },
    { id: 'inherited-property', slug: 'inherited-property' },
    { id: 'snowbird-home-care', slug: 'snowbird-home-care' },
    { id: 'services/pre-sale', slug: 'services/pre-sale' },
    { id: 'services/post-sale', slug: 'services/post-sale' },
    { id: 'services/cleaning', slug: 'services/cleaning' },
    { id: 'services/painting', slug: 'services/painting' },
    { id: 'services/repairs', slug: 'services/repairs' },
    { id: 'services/gardening', slug: 'services/gardening' },
    { id: 'areas', slug: 'areas' },
    { id: 'areas/ocala', slug: 'areas/ocala' },
    { id: 'areas/tampa', slug: 'areas/tampa' },
    { id: 'areas/spring-hill', slug: 'areas/spring-hill' }
  ]
};
