# Sparkling Website — Design Spec

**Date:** 2026-09-17
**Status:** Draft — pending user review

## 1. Business Context

Rosas's Sparkling Cleaning is a property cleaning/prep business serving **Ocala, Tampa, and Spring Hill, Florida**. Core services: Pre-Sale prep (deep cleaning, staging, minor improvements), Post-Sale/Move-In Ready (cleaning, organizing, decorating), and additional recurring/one-time services (regular cleaning, painting, gardening, minor repairs). Differentiator: one integrated provider instead of hiring cleaning, painting, and gardening separately.

The strongest business angle is **absentee owners with a long-vacant, unsold property** (higher insurance costs, risk of losing Florida homestead exemption, accumulated deterioration). The real competition for this segment is **cash-home-buyer companies** — messaging must differentiate ("we help you sell better, we don't buy your house").

Target customers: homeowners and real estate agents/agencies, mid to upper-mid income, not exclusive.

## 2. Goals / Non-Goals

**Goals:**
- Bilingual (ES/EN) static marketing site with clean per-page URLs, deployed to GitHub Pages via GitHub Actions, no backend/server.
- A client-side quote calculator that outputs an estimated range and hands off the lead via WhatsApp.
- SEO built in from day one (unique titles/metas, single H1, hreflang, sitemap/robots, LocalBusiness schema.org, internal linking, alt text), so no rework pass is needed later.
- Content organized so the owner (non-developer) can eventually edit copy/pricing via plain JSON/config files.

**Non-goals (for this spec):**
- No backend, database, or server-rendered logic of any kind.
- No real pricing yet — `pricing.config.js` ships with placeholder/`null` values.
- No Google Business Profile setup (manual step outside the codebase — documented as a README reminder).
- No CMS or admin UI — content is edited by committing JSON files.

## 3. Architecture Overview

- **Stack:** plain HTML/CSS/JS. No frontend framework.
- **Static generator:** a small Node.js script (`scripts/build.js`, no external framework) reads `content/<locale>/*.json` + `templates/*.html` + `site.config.js`, and writes fully-built pages to `dist/`.
- **Bilingual routing:** every page exists in both `en` and `es` locales as sibling content files; `site.config.js` maps each page to its sibling for hreflang.
- **Quote calculator:** client-side JS (`assets/js/quote-calculator.js`) driven by `pricing.config.js` (editable placeholder rules); computes an estimate and opens a pre-filled `wa.me` WhatsApp link.
- **SEO:** enforced by `build.js` at build time (unique title/meta/H1, hreflang pairs, sitemap.xml, robots.txt, LocalBusiness JSON-LD, alt-text warnings).
- **Deploy:** GitHub Actions workflow builds `dist/` on every push to `main` and publishes to GitHub Pages.
- **Domain:** GitHub Pages default subdomain for now; base URL is a single config value in `site.config.js` so a custom domain can be added later without touching page code.
- **Reviews:** placeholder section wired for a Google Business Profile review widget, to be activated once that profile exists.

Full project structure:

```
Sparkling/
├── content/
│   ├── en/
│   │   ├── home.json
│   │   ├── services/{pre-sale,post-sale,additional}.json
│   │   ├── areas/{ocala,tampa,spring-hill}.json
│   │   ├── vacant-home.json
│   │   └── quote-calculator.json
│   └── es/                    # same structure, Spanish copy
├── templates/
│   ├── layout.html
│   ├── page.html
│   └── partials/ (hero, cta, local-business-schema, related-links, reviews)
├── site.config.js
├── pricing.config.js
├── assets/{css,js,img}/
├── scripts/{build.js, validate.js}
├── dist/                       # generated, gitignored
└── .github/workflows/deploy.yml
```

## 4. Phases & User Stories

### Phase 0 — Project Scaffolding & Deploy Pipeline

Goal: prove the full pipeline (build → GitHub Pages) works end-to-end before any real content exists.

**US-0.1: Repository and tooling scaffold**
- **Description:** As a developer, I need the base repo structure, `package.json`, and folder layout in place so later work has somewhere to live.
- **Acceptance Criteria:**
  - Repo initialized with `.gitignore` (excludes `dist/`, `node_modules/`).
  - `package.json` with a `build` script wired to `scripts/build.js`.
  - Folder structure matches Section 3 (empty placeholders where needed).
- **Tasks:**
  - `git init`, add `.gitignore`, `package.json`.
  - Create `content/`, `templates/`, `assets/`, `scripts/` directories.
- **Scenarios to cover:** N/A (structural setup, no behavior yet).

**US-0.2: Minimal static generator producing one page**
- **Description:** As a developer, I need `build.js` to render a single hardcoded page from a template + content JSON, so the generation mechanism is proven.
- **Acceptance Criteria:**
  - `node scripts/build.js` produces `dist/index.html` from `templates/layout.html` + `templates/page.html` + `content/en/home.json`.
  - Output includes the content JSON's title, meta description, and H1.
- **Tasks:**
  - Write `layout.html` and `page.html` with placeholder tokens.
  - Write minimal `build.js` template-substitution logic.
  - Write a stub `content/en/home.json`.
- **Scenarios to cover:**
  - Build succeeds and `dist/index.html` contains the expected title/meta/H1.
  - Missing `content/en/home.json` → build fails with a clear error.

**US-0.3: GitHub Actions deploy pipeline**
- **Description:** As the owner, I need every push to `main` to automatically publish the built site to GitHub Pages.
- **Acceptance Criteria:**
  - `.github/workflows/deploy.yml` runs on push to `main`.
  - Workflow: checkout → setup Node → `npm run build` → upload `dist/` as Pages artifact → deploy.
  - A failed build (non-zero exit) blocks deployment.
- **Tasks:**
  - Write the workflow file using `actions/upload-pages-artifact` + `actions/deploy-pages`.
  - Enable GitHub Pages (Actions source) in repo settings.
- **Scenarios to cover:**
  - Push with valid content → site is live at the GitHub Pages URL.
  - Push with a build-breaking change (e.g. missing required field) → workflow fails, nothing is deployed, previous version stays live.

### Phase 1 — Content System & Bilingual Templates

Goal: generalize the generator to handle every page, both locales, with SEO metadata and hreflang wired in.

**US-1.1: Multi-page, multi-locale build**
- **Description:** As a developer, I need `build.js` to iterate over every page defined in `site.config.js` for both locales, not just one hardcoded page.
- **Acceptance Criteria:**
  - `site.config.js` lists all routes with their `en`/`es` sibling slugs.
  - `build.js` generates `dist/<slug>/index.html` for every route × locale.
  - Each generated page links to its sibling via `hreflang` (`en`, `es`, and `x-default` → `en`).
- **Tasks:**
  - Define route map in `site.config.js`.
  - Extend `build.js` to loop routes × locales.
  - Add hreflang `<link>` generation to `layout.html`.
- **Scenarios to cover:**
  - Every route produces both an `en` and `es` output file, each pointing to the other via hreflang.
  - A route missing its `es` (or `en`) counterpart fails the build with a named error (broken hreflang pair).

**US-1.2: SEO metadata validation**
- **Description:** As the business owner, I need the build to refuse to publish pages with duplicate or missing SEO metadata, so search ranking isn't hurt by a mistake.
- **Acceptance Criteria:**
  - Every content JSON must have non-empty `title`, `metaDescription`, `h1`.
  - `title`/`metaDescription` must be unique within a locale across all pages.
  - Build fails with a clear message naming the offending file if any check fails.
- **Tasks:**
  - Implement `scripts/validate.js` (or inline in `build.js`) running these checks before writing output.
  - Wire validation into the `build` npm script so it always runs.
- **Scenarios to cover:**
  - Two pages in the same locale with an identical `title` → build fails, names both files.
  - A page missing `metaDescription` → build fails, names the file and missing field.
  - All pages valid → build succeeds silently.

**US-1.3: Sitemap and robots.txt generation**
- **Description:** As the business owner, I need Google to be able to discover and crawl every page automatically.
- **Acceptance Criteria:**
  - `dist/sitemap.xml` lists every generated URL (both locales) with absolute URLs from `site.config.js`'s base URL.
  - `dist/robots.txt` references the sitemap and allows crawling.
- **Tasks:**
  - Generate `sitemap.xml` from the final route list after all pages are built.
  - Generate a static `robots.txt` template with the sitemap URL injected.
- **Scenarios to cover:**
  - Sitemap contains exactly the same set of URLs as files written to `dist/`.
  - `robots.txt` correctly references the sitemap at the configured base URL.

**US-1.4: LocalBusiness structured data**
- **Description:** As the business owner, I need Google to understand this is a local business serving Ocala, Tampa, and Spring Hill, so search results can show enriched info.
- **Acceptance Criteria:**
  - Every page includes a `LocalBusiness` JSON-LD block (name, phone, the three service areas).
  - Home page and each of the three area pages include an extended block with that page's specific `areaServed`.
- **Tasks:**
  - Build `templates/partials/local-business-schema.html` populated from `site.config.js`.
  - Inject the partial into `layout.html`; extend per-area override for area pages.
- **Scenarios to cover:**
  - Home page JSON-LD lists all three service areas.
  - `/areas/tampa` JSON-LD specifically names Tampa as `areaServed` (and similarly for Ocala/Spring Hill).

**US-1.5: Internal linking between related pages**
- **Description:** As the business owner, I need related pages (e.g. the vacant-home page and Pre-Sale) to link to each other, so Google understands page relationships and users find relevant services.
- **Acceptance Criteria:**
  - Content JSON supports a `relatedPages` array of slugs.
  - `templates/partials/related-links.html` renders those as links, localized to the current page's locale.
- **Tasks:**
  - Add `relatedPages` field handling to `build.js`.
  - Build the related-links partial.
- **Scenarios to cover:**
  - A page listing `relatedPages: ["services/pre-sale"]` renders a working localized link to that page.
  - An empty/absent `relatedPages` renders no related-links block (no broken empty section).

### Phase 2 — Core Page Content

Goal: populate real pages once the Content Blueprint is provided. Each story below is generic per page and gets filled in with the owner's actual copy.

**US-2.1: Home page**
- **Description:** As a visitor, I land on a home page that explains the integrated service and points me toward the right service/area page.
- **Acceptance Criteria:** unique title/meta/H1; links to all three main services and the vacant-home angle; quote-calculator CTA above the fold.
- **Tasks:** author `content/{en,es}/home.json` from the Content Blueprint; wire hero + CTA partials.
- **Scenarios to cover:** page builds in both locales; all nav links resolve to real generated pages (no 404s).

**US-2.2: Service pages (Pre-Sale, Post-Sale, Additional Services)**
- **Description:** As a visitor, I can read what each service includes and how it applies to my situation.
- **Acceptance Criteria:** each service is its own page, unique title/meta/H1, cross-links to the quote calculator and to the vacant-home page where relevant.
- **Tasks:** author 3 content JSONs × 2 locales from the Content Blueprint.
- **Scenarios to cover:** each service page builds and validates in both locales.

**US-2.3: Vacant/unsold-home landing page**
- **Description:** As a visitor who owns a long-vacant, unsold property, I land on a page that speaks directly to my situation (rising insurance costs, homestead exemption risk, deterioration) and differentiates from cash-buyer companies.
- **Acceptance Criteria:** dedicated page with this specific messaging, linking to Pre-Sale as the primary CTA.
- **Tasks:** author content JSON × 2 locales from the Content Blueprint; ensure `relatedPages` links to Pre-Sale.
- **Scenarios to cover:** page builds in both locales; related-links renders the Pre-Sale link.

**US-2.4: Area pages (Ocala, Tampa, Spring Hill)**
- **Description:** As a visitor searching for a local provider, I find a page specific to my city.
- **Acceptance Criteria:** 3 pages × 2 locales, each with area-specific LocalBusiness schema (per US-1.4) and locally-relevant copy.
- **Tasks:** author 3 content JSONs × 2 locales.
- **Scenarios to cover:** each area page builds, validates, and carries the correct `areaServed` in its schema block.

### Phase 3 — Quote Calculator

**US-3.1: Pricing config with placeholder rules**
- **Description:** As the business owner, I need a single editable file where I can later plug in real prices without touching any logic.
- **Acceptance Criteria:** `pricing.config.js` defines the shape (service types, size brackets, area adjustments) with `null`/placeholder values; well-commented for a non-developer to edit later.
- **Tasks:** define the config shape; document each field.
- **Scenarios to cover:** config loads without errors even with all values `null`.

**US-3.2: Calculator form and estimate output**
- **Description:** As a visitor, I answer a few questions and get an estimated price range for my job.
- **Acceptance Criteria:** form covers service type, property size, service area, relevant add-ons; submitting computes and displays a `low`–`high` estimate client-side, no network call; all labels localized.
- **Tasks:** build the form markup + `quote-calculator.js` logic; author `content/{en,es}/quote-calculator.json` for labels.
- **Scenarios to cover:**
  - Valid selections with real pricing values → correct range is displayed.
  - Selections where the matching pricing entry is still `null`/placeholder → friendly "contact us for a custom quote" fallback is shown instead of a broken range.

**US-3.3: WhatsApp handoff**
- **Description:** As a visitor with an estimate, I can send my request straight to the business via WhatsApp with my selections already filled in.
- **Acceptance Criteria:** a button builds a `wa.me/<number>?text=...` link summarizing service/size/area/estimate (or "custom quote" if placeholder) in the visitor's locale, and opens it.
- **Tasks:** implement message-building + `wa.me` link construction in `quote-calculator.js`; add the business WhatsApp number to `site.config.js`.
- **Scenarios to cover:**
  - Completed form with a real estimate → WhatsApp link text includes service, size, area, and the estimated range.
  - Completed form with placeholder pricing → WhatsApp link text includes selections and a "custom quote requested" note instead of a numeric range.

### Phase 4 — Reviews Placeholder

**US-4.1: Reviews section wired for Google widget**
- **Description:** As the business owner, I want a reviews section ready to show real Google reviews as soon as the Business Profile exists, without a future redesign.
- **Acceptance Criteria:** a `templates/partials/reviews.html` section exists on relevant pages (home, area pages) with a clearly marked placeholder state (no fake reviews) and a single config point (`site.config.js`) to drop in the real Google widget embed/link later.
- **Tasks:** build the partial and its placeholder state; document activation steps in the README.
- **Scenarios to cover:** with no widget configured, the section renders a clean placeholder (not an error or empty gap); documented steps exist for swapping in the real widget.

### Phase 5 — Polish, Accessibility & Launch Readiness

**US-5.1: Alt text enforcement**
- **Description:** As the business owner, I want every image to have descriptive alt text for SEO and accessibility.
- **Acceptance Criteria:** `build.js` warns (does not fail) on any image content field missing `alt`.
- **Tasks:** add the check to `validate.js`.
- **Scenarios to cover:** an image entry without `alt` produces a build-time warning listing the file; a build with all `alt` present produces no warnings.

**US-5.2: Responsive layout check**
- **Description:** As a mobile visitor (majority of local search traffic), I need the site to work well on small screens.
- **Acceptance Criteria:** all pages, including the calculator form, are usable at mobile widths (~360–400px) with no horizontal scroll.
- **Tasks:** responsive CSS pass across templates and the calculator form.
- **Scenarios to cover:** manual check of home, one service page, one area page, and the calculator at mobile width.

**US-5.3: Performance pass**
- **Description:** As a visitor on a slow connection, I need pages to load quickly, especially once real property photos are added.
- **Acceptance Criteria:** images use modern compressed formats/reasonable dimensions; no render-blocking or unnecessary scripts.
- **Tasks:** add image-optimization guidance/tooling note to README; audit `layout.html` for unnecessary scripts.
- **Scenarios to cover:** N/A (audit task); revisit once real photos exist.

**US-5.4: Launch documentation**
- **Description:** As the business owner, I need a README explaining how to edit content, update pricing, and the manual steps I still need to do (Google Business Profile, custom domain).
- **Acceptance Criteria:** README covers: editing content JSON, editing `pricing.config.js`, adding a custom domain later, setting up Google Business Profile and activating the reviews widget.
- **Tasks:** write `README.md`.
- **Scenarios to cover:** N/A (documentation task).

## 5. Open Items (tracked, not blocking)

- Real pricing values for `pricing.config.js` — owner to provide when ready.
- Content Blueprint text (titles, metas, body copy, internal linking map) — owner to provide; Phase 2 stories are placeholders until then.
- Logo/brand colors — owner to provide; will be applied to `assets/css` once received.
- Google Business Profile — manual setup by the owner, outside this codebase.
- Custom domain — not yet owned; `site.config.js` base URL is the single switch-over point.
