# Sparkling Website

Static marketing site for **Rosa's Sparkling Clean & Management** (property cleaning/staging/prep business, Ocala/Tampa/Spring Hill, FL). Bilingual (EN/ES), deployed to GitHub Pages via GitHub Actions. No backend, no database, no server-rendered logic.

Full design/architecture: `docs/superpowers/specs/2026-09-17-sparkling-website-design.md`.

## Hard rules

- **No backend.** Everything ships as static HTML/CSS/JS served from `dist/` on GitHub Pages. No servers, no databases, no API routes.
- **No frontend framework.** Plain HTML/CSS/JS only (no React/Vue/Next/etc.). Keep dependencies minimal.
- **Code, folders, filenames, comments, and docs are always in English** — even though the site's own visitor-facing content is bilingual (Spanish + English) and this conversation happens in Spanish. Only the actual `content/es/**` copy is written in Spanish.
- **Deploy:** push to `main` → GitHub Actions builds the static generator output and publishes to GitHub Pages.
- **Pricing isn't final.** `pricing.config.js` ships with placeholder/`null` values; the quote calculator must degrade gracefully (show a "contact us" fallback) when values are missing, not crash or show `$null`.

## Local development workflow (read before touching anything)

- **There is no live HTML file anywhere in the repo to open directly.** The site doesn't exist as files until built. Never create or edit a loose `.html` file at the project root or anywhere outside `templates/` — if you're tempted to, you're about to recreate a confusion that already happened once.
- **`docs/design-reference.html` is a frozen design mockup, not the live site.** It used to live at the project root as `index.html`, got mistaken for the real homepage, and got hand-edited — that's why it was moved. Don't move it back, don't treat it as a page to update with real content/links.
- **Two build outputs exist, both gitignored, never edit either by hand:**
  - `dist/` — from `npm run build`. Production output, internal links point at the real production `baseUrl`. This is what CI deploys. You don't need to look at it locally.
  - `dist-preview/` — from `npm run preview`. Local-only output, internal links point at `http://localhost:5050/sparkling/` instead, so clicking around doesn't jump to a domain that isn't live. **This is the only thing to use for local review.**
- **`npm run preview` does not auto-rebuild on file changes.** It's a one-shot build + static server. After editing `content/`, `templates/`, or `assets/css/main.css`, the already-running preview server keeps serving stale files until you rebuild. If a preview server is already running, run `node scripts/preview.js` alone to refresh `dist-preview/` in place (no need to kill/restart the server — it just serves whatever is on disk, so a browser refresh picks up the new files). Don't manually copy `dist/` into a temp folder to "preview" it — that's how changes got lost once already.
- **Never use Chrome/browser automation to validate a change, period — not even for JS runtime behavior.** The user does all visual/browser review themselves. Confirm changes by reading the CSS/HTML, running `curl`, or checking `dist-preview/` output directly; then tell the user it's ready for them to review. Only touch the browser tools if the user explicitly asks you to.
- **CSS gotcha — `<img>` + `aspect-ratio` inside a flex/grid container:** if an `<img>` has HTML `width`/`height` attributes (all content images do, for layout-shift prevention) and its CSS sets `aspect-ratio` without also setting `height: auto`, Chrome can ignore the `aspect-ratio` and render the image at its raw intrinsic height instead of scaling with `width`. Always pair `aspect-ratio` with `height: auto` on any image rule (see `.service-photo`, `.interior-hero-media img` in `assets/css/main.css`).

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
