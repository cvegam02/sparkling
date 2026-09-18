# Sparkling Website

Static marketing site for **Rosas's Sparkling Cleaning** (property cleaning/staging/prep business, Ocala/Tampa/Spring Hill, FL). Bilingual (EN/ES), deployed to GitHub Pages via GitHub Actions. No backend, no database, no server-rendered logic.

Full design/architecture: `docs/superpowers/specs/2026-09-17-sparkling-website-design.md`.

## Hard rules

- **No backend.** Everything ships as static HTML/CSS/JS served from `dist/` on GitHub Pages. No servers, no databases, no API routes.
- **No frontend framework.** Plain HTML/CSS/JS only (no React/Vue/Next/etc.). Keep dependencies minimal.
- **Code, folders, filenames, comments, and docs are always in English** — even though the site's own visitor-facing content is bilingual (Spanish + English) and this conversation happens in Spanish. Only the actual `content/es/**` copy is written in Spanish.
- **Deploy:** push to `main` → GitHub Actions builds the static generator output and publishes to GitHub Pages.
- **Pricing isn't final.** `pricing.config.js` ships with placeholder/`null` values; the quote calculator must degrade gracefully (show a "contact us" fallback) when values are missing, not crash or show `$null`.

## Service areas

Ocala, Tampa, Spring Hill — Florida. These three drive `LocalBusiness` schema.org data and the area-specific pages.

## SEO requirements (non-negotiable per page)

- Unique `<title>` and meta description per page (no duplicates within a locale).
- One `<h1>` per page, correct heading hierarchy.
- Clean URLs, no query params.
- `sitemap.xml` / `robots.txt` generated from the actual built routes.
- Correct `hreflang` pairing between the EN and ES version of every page (+ `x-default` → EN).
- `LocalBusiness` JSON-LD on every page.
- Descriptive `alt` text on all images.
- Responsive layout (mobile-first — most local search traffic is mobile).

## Contact / lead flow

WhatsApp is the primary contact channel. The quote calculator computes an estimate client-side and hands off the lead via a pre-filled `wa.me` link — no form submission to any backend.

## Still pending from the business side

- Real pricing values.
- Full page copy (Content Blueprint) — owner has it, not yet shared.
- Logo / brand colors — owner has them, not yet shared.
- Google Business Profile (manual setup, outside this repo) — reviews section is a placeholder until it exists.
- Custom domain — site currently targets the default GitHub Pages subdomain; base URL is a single config value for an easy switch later.
