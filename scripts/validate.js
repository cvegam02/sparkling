'use strict';

const REQUIRED_FIELDS = ['title', 'metaDescription', 'h1'];

/**
 * Validates every page's content against the SEO rules that must never
 * regress: no missing required fields, no duplicate title/metaDescription
 * within a locale. Throws with a message naming the offending file(s).
 *
 * @param {Array<{ locale: string, file: string, content: object }>} pages
 */
function validateContent(pages) {
  for (const page of pages) {
    for (const field of REQUIRED_FIELDS) {
      const value = page.content[field];
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${page.file}: missing required field "${field}"`);
      }
    }
  }

  for (const field of ['title', 'metaDescription']) {
    const seenByLocale = new Map();

    for (const page of pages) {
      if (!seenByLocale.has(page.locale)) seenByLocale.set(page.locale, new Map());
      const seen = seenByLocale.get(page.locale);
      const value = page.content[field];

      if (seen.has(value)) {
        const otherFile = seen.get(value);
        throw new Error(
          `Duplicate "${field}" within locale "${page.locale}": ${otherFile} and ${page.file}`
        );
      }
      seen.set(value, page.file);
    }
  }
}

/**
 * Warns (never fails the build) about any image entry missing descriptive
 * alt text. Content images live in `services.items[]` today; extend this
 * list if another content shape starts carrying images.
 *
 * @param {Array<{ locale: string, file: string, content: object }>} pages
 * @returns {string[]} warning messages, empty if everything has alt text
 */
function collectAltTextWarnings(pages) {
  const warnings = [];

  for (const page of pages) {
    const items = page.content.services && page.content.services.items;
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item.image) continue;
      if (typeof item.alt !== 'string' || item.alt.trim() === '') {
        warnings.push(`${page.file}: image "${item.image}" is missing alt text`);
      }
    }
  }

  return warnings;
}

module.exports = { validateContent, collectAltTextWarnings };
