# Rosa's Sparkling Cleaning — Website

Static marketing site, bilingual (English/Spanish), deployed to GitHub Pages. No backend, no database — everything you edit is a plain text file. See `CLAUDE.md` and `docs/superpowers/specs/` for the full design and architecture if you're a developer picking this up.

## Where's the actual site?

There is no `index.html` (or any page) sitting in the project root to open directly — that's on purpose. The real pages don't exist as files until you build them:

1. **You edit:** page text in `content/en/*.json` + `content/es/*.json`, styling in `assets/css/main.css`, HTML structure in `templates/*.html`.
2. **The build reads those and writes real HTML into `dist/`** (via `npm run build`, or automatically on every push to `main`). `dist/` is gitignored — it's output, not something you edit by hand.
3. **To look at the site, always run `npm run preview`** (see below) and open the URL it prints. Never open an HTML file directly with your browser or a file explorer — nothing at the project root is the live site.

`docs/design-reference.html` is a separate, frozen mockup used only as a design reference for spacing/colors/icons (see `docs/superpowers/specs/2026-09-17-design-system.md`) — it is not the live site either.

## Build

```
npm run build
```

Generates the site into `dist/` (gitignored). Every push to `main` also triggers this automatically via GitHub Actions and publishes the result — you don't need to run this yourself before deploying, only when you want to preview a change locally.

## Preview locally

```
npm run preview
```

Builds the site into `dist-preview/` and serves it at `http://localhost:5050/sparkling/`. Unlike a plain `npm run build`, every link in this preview points back at `localhost` instead of the real `baseUrl` from `site.config.js` — so clicking around (services, areas, the calculator) stays on your machine instead of jumping to a domain that isn't live yet. Stop the server with Ctrl+C; `dist-preview/` is gitignored.

## Editing page content

Every page's text lives in a JSON file under `content/<language>/`, e.g.:

- `content/en/home.json` / `content/es/home.json` — the home page.
- `content/en/services/pre-sale.json` / `content/es/services/pre-sale.json` — the Pre-Sale service page (same pattern for `post-sale.json`, `additional.json`).
- `content/en/areas/ocala.json` / `content/es/areas/ocala.json` — the Ocala area page (same pattern for `tampa.json`, `spring-hill.json`).
- `content/en/vacant-home.json` / `content/es/vacant-home.json` — the vacant/unsold property page.
- `content/en/quote-calculator.json` / `content/es/quote-calculator.json` — the estimate calculator page.
- `content/en/common.json` / `content/es/common.json` — navigation labels, footer text, and the reviews section text, shared across every page.

To change any text: open the matching pair of English/Spanish files, edit the value, save, and run `npm run build`. Each language always has its own file — a page is never generated if its Spanish or English counterpart is missing, so the site can't accidentally go out of sync between languages.

The build will refuse to publish (and tell you exactly why) if:
- A page is missing its `title`, `metaDescription`, or `h1`.
- Two pages in the same language share the same `title` or `metaDescription`.
- A content image is missing descriptive `alt` text (this one only warns, it won't block the build).

## Editing pricing

`pricing.config.js` in the project root controls the quote calculator's estimated ranges. It ships with `null` placeholders everywhere, which is why the calculator currently always shows "we'll confirm your price by chat" instead of a number. To turn on real pricing:

1. Open `pricing.config.js`.
2. Replace the `null, null` pairs under `ranges` with real `[low, high]` dollar amounts for whichever service/size combinations you're ready to quote automatically. You don't have to fill in every combination at once — any combination left as `null` just keeps showing the "confirm by chat" message.
3. Optionally adjust `areaAdjustmentPercent` if one area should cost more or less than the others (e.g. `10` for +10%).
4. Run `npm run build` and redeploy.

No code changes needed.

## Activating Google reviews

The reviews section on the home page and area pages shows a clean placeholder until a Google Business Profile exists. To activate it:

1. Open `site.config.js` and find the `googleReviews` block.
2. Set `profileUrl` to your Google Business Profile listing URL. The placeholder text gets a "See our reviews on Google" link.
3. Optional: if you get a review-widget embed snippet (from Google or a third-party widget provider), paste it into `widgetEmbedHtml`. When set, it replaces the placeholder text entirely with the real widget.
4. Run `npm run build` and redeploy.

No code changes needed for either step.

## Adding a custom domain

`site.config.js` has one `baseUrl` value at the top of the file. It currently points at the default GitHub Pages address. Once you buy a domain:

1. Point the domain's DNS at GitHub Pages (GitHub's docs walk through this — search "GitHub Pages custom domain").
2. Add the domain in the repository's Settings → Pages.
3. Update `baseUrl` in `site.config.js` to the new domain.
4. Run `npm run build` and redeploy.

Every internal link, the sitemap, and the `hreflang` tags all derive from this one value, so nothing else needs to change.

## Setting up Google Business Profile

This is a manual step outside this repository: create your business listing at [business.google.com](https://business.google.com). Once it's live, come back and follow "Activating Google reviews" above.

## Images and performance

- Service photos live in `assets/img/` as `.webp` files, which are already a compressed, modern format — keep new photos in `.webp` at similar dimensions (around 1536×1024) rather than adding large unoptimized JPEGs/PNGs.
- `assets/img/logo-full.png` has a known typo baked into the artwork ("PAIHTING") — don't use it anywhere the text would be legible until a corrected export exists.
- The site loads no JavaScript frameworks and no analytics/tracking scripts. The only page-specific script is the quote calculator's, which loads only on the estimate page — every other page ships just the small nav-toggle script.

## Mobile check

Home, a service page, an area page, the vacant-home page, and the quote calculator form were all confirmed at 375px width with no horizontal scroll and a fully usable calculator (nav collapses, dropdowns and the submit button render correctly). Still worth a spot-check on a real device before launch, but no known issues.
