'use strict';

// Single source of truth for site-wide config: locales, routes, and business
// data used to build hreflang pairs, sitemap URLs, and LocalBusiness schema.

module.exports = {
  // TODO: switch to the custom domain once one is bought. Until then this is
  // the GitHub Pages default subdomain for this repo.
  baseUrl: 'https://example.github.io/sparkling',

  defaultLocale: 'en',
  locales: ['en', 'es'],

  business: {
    name: "Rosa's Sparkling Cleaning",
    // TODO: fill in with the real business phone number.
    phone: null,
    whatsapp: 'https://wa.me/10000000000',
    areasServed: ['Ocala', 'Tampa', 'Spring Hill']
  },

  // Reviews section (home page + area pages): shows a clean placeholder
  // until a Google Business Profile exists. To activate it once you have
  // one:
  //   1. Set `profileUrl` to your Google Business Profile listing URL —
  //      the placeholder becomes a "See our reviews on Google" link.
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
    { id: 'services/pre-sale', slug: 'services/pre-sale' },
    { id: 'services/post-sale', slug: 'services/post-sale' },
    { id: 'services/additional', slug: 'services/additional' },
    { id: 'areas/ocala', slug: 'areas/ocala' },
    { id: 'areas/tampa', slug: 'areas/tampa' },
    { id: 'areas/spring-hill', slug: 'areas/spring-hill' }
  ]
};
