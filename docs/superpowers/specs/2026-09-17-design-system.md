# Rosa's Sparkling Cleaning — Design System

**Date:** 2026-09-17
**Status:** Locked — this is the reference for building every other page on the site.
**Source of truth:** [assets/css/main.css](../../../assets/css/main.css) and [docs/design-reference.html](../../design-reference.html) &mdash; a frozen mockup, not the live site (the live site is generated into `dist/` by `npm run build`; see `templates/home.html` for the real, current markup). If this document and the code ever disagree, the code wins — update this file to match it.

This captures the visual language established on the home page so new pages (About, service detail pages, area pages, Spanish locale, etc.) look like they belong to the same site without having to reinvent decisions each time.

## 1. Design principles

- **The palette is the logo, nothing else.** Every color on the site traces back to the actual logo artwork (navy wordmark, pink "Rosa's" script, and the four colored door panels — pink/blue/gold/green for Cleaning/Painting/Management/Gardening). Don't introduce a new hue to solve a one-off problem; reach for an existing token or a `-deep` variant of one.
- **One primary action color.** Pink (`--color-pink-deep`) is the only color used for the main call-to-action button and focus rings. It stays consistent everywhere so "the pink button" always means the same thing.
- **WhatsApp is its own color.** Any link that opens WhatsApp uses WhatsApp's own brand green (`--color-whatsapp`), not a site color, so it reads as "this opens WhatsApp" at a glance. Never use that green for anything else.
- **Real photography for real services, illustration for brand moments.** The four service photos (cleaning/painting/management/gardening) are the only place real photography appears. The hero uses an abstract color-block-and-logo composition instead of a photo or video specifically so it doesn't repeat content the services section already shows.
- **Motion answers scrolling, not looping.** All animation on the page is either a one-time page-load sequence (hero) or tied to scroll position via CSS `animation-timeline: view()`/`scroll()` — nothing loops or plays on a timer. Every animation must also work with `prefers-reduced-motion: reduce` (see §7).
- **Never animate opacity to 0 on scroll-reveal.** Learned the hard way: scroll-linked reveals that fade from `opacity: 0` can get caught mid-transition in static screenshots/previews and look like a rendering bug ("why is this see-through?"). Scroll-reveal keyframes here only animate `transform` — elements are always fully opaque, just slide/settle into position.

## 2. Color tokens

All defined in `:root` in `main.css`. Never hardcode a hex value in a new component — add a token here first if one doesn't exist.

| Token | Hex | Source / use |
|---|---|---|
| `--color-cloud` | `#f2f4f9` | Page background, light section fills |
| `--color-cloud-deep` | `#e2e5ef` | Hairline borders, dividers on light backgrounds |
| `--color-white` | `#ffffff` | Cards, button text on colored backgrounds |
| `--color-ink` | `#14192f` | The logo's navy wordmark. Body text, headings, darkest section backgrounds (footer) |
| `--color-pink` | `#e23f8e` | "Rosa's" script / Cleaning door. Decorative only (icons, thin borders) — **not** safe as text/background with white text, see §3 |
| `--color-pink-deep` | `#b92c72` | Primary CTA background, focus ring, brand accent text-on-white |
| `--color-pink-darker` | `#8f2059` | Primary CTA hover |
| `--color-pink-light` | `#f6b3d6` | Text/accents on dark backgrounds (kickers, labels) |
| `--color-blue` | `#2589c7` | Painting door. Decorative accents, icons |
| `--color-blue-deep` | `#1d6f9c` | Backgrounds carrying white text (e.g. "Selling a property" card) |
| `--color-gold` | `#efa91c` | Management door. Decorative accents, icons, badges |
| `--color-gold-deep` | `#b9800f` | Reserved for backgrounds carrying white text (not yet used — add here when needed) |
| `--color-green` | `#4a9950` | Gardening door. Decorative accents, icons |
| `--color-green-deep` | `#357339` | Vacant-band section background |
| `--color-whatsapp` | `#25d366` | WhatsApp buttons only |
| `--color-whatsapp-deep` | `#1da851` | WhatsApp button hover |

### Contrast rule for the four brand colors

`pink`, `blue`, `gold`, `green` (the vivid, non-`-deep` tones) are **decorative-only**: icon strokes, thin card borders, small badges, large serif numerals on a dark background. None of them reach 4.5:1 with white text at normal body-text size. Whenever a brand color needs to carry white/light text as a solid background (a card, a button), use its `-deep` variant instead — that's the whole reason those variants exist. `gold-deep` and a hypothetical `green`-as-button case haven't come up yet; verify contrast before using them that way (target ≥ 4.5:1 for normal text, ≥ 3:1 for large text/icons — check with a contrast calculator, don't eyeball it).

## 3. Typography

```css
--font-display: "Fraunces", Georgia, serif;   /* headings, numerals, anything that should feel like the brand */
--font-body: "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; /* everything else */
```

Loaded via Google Fonts in `<head>` (weights 400/500/600 for Fraunces incl. italic via `opsz` axis; 400/500/600 for Work Sans). Adding a page? Copy the exact `<link>` tags from `docs/design-reference.html` — don't add a second font.

Fluid type scale (all `clamp()`, so no separate mobile font-size overrides are usually needed):

| Token | Range | Used for |
|---|---|---|
| `--step-0` | 1.0625rem → 1.125rem | Body text |
| `--step-1` | 1.25rem → 1.5rem | `h3`, areas list |
| `--step-2` | 1.75rem → 2.25rem | `h2` |
| `--step-3` | 2.5rem → 3.75rem | `h1` |

`h1`/`h2`/`h3` are always `--font-display`, weight 500, `line-height: 1.15`, color `--color-ink`. Body copy is `--font-body`, `line-height: 1.6`.

## 4. Spacing & layout

```css
--space-1: 0.5rem;   --space-2: 1rem;    --space-3: 1.75rem;
--space-4: 3rem;      --space-5: 5rem;
--content-max: 72rem; /* .wrap max-width */
--measure: 38rem;     /* paragraph max-width, ~70-78 char lines */
--radius: 4px;        /* the only border-radius in the system, aside from pills/circles */
```

Every section is `<section><div class="wrap">...</div></section>`; `.wrap` centers content and caps its width. Section vertical rhythm is `padding-block: var(--space-5)` (or `--space-4` for tighter strips like `.areas`).

**Mobile note:** at `≤860px`, `--space-5` and `--space-4` are *redefined* on `:root` inside the media query (3rem / 2rem instead of 5rem / 3rem) rather than overridden per-component. If you add a new section that uses `padding-block: var(--space-5)`, it gets the tighter mobile rhythm for free — don't hardcode a mobile override unless a component genuinely needs something different from that global tightening.

Breakpoints in use: `1100px` (services grid goes 2-col, photos shrink to square tiles), `860px` (main mobile breakpoint — nav becomes a hamburger, all two-column sections stack to one), `480px` (a couple of font-size trims only). Don't invent a fourth breakpoint without a real reason; fold new rules into one of these three.

## 5. Components

### Buttons
Three kinds, never mixed:
- `.btn.btn-primary` — the one pink CTA per view. Solid `--color-pink-deep`, white text.
- `.btn.btn-secondary` — outline, `--color-ink` border/text, inverts on hover. Used for lower-emphasis actions (`Ask about Pre-Sale`, `Ask about Move-In Ready`). On a dark card (e.g. `.path-presale`), override to white border/text — see the `.path-presale .btn-secondary` rule for the pattern.
- `.btn-whatsapp` (optionally `.btn` too, for full padding) — WhatsApp green, always paired with the WhatsApp glyph SVG (copy it verbatim from `docs/design-reference.html`, don't redraw it) and the phrase "…on WhatsApp" / "WhatsApp us". `.btn-whatsapp--small` is the compact footer variant.

### Cards
Three distinct card languages exist on purpose — don't collapse them into one "card" component:
1. **Path cards** (`.path`) — one dark (`--color-blue-deep`), one light, each with a circular icon badge, a bold one-line benefit (`.path-highlight`), a checklist, and a CTA. Used for "pick your scenario" framing.
2. **Service tiles** (`.service-card`) — photo-led, color-coded top border matching the door color, flex row on desktop that **grows on hover** (`flex-grow: 2.4` + a slow 6s photo pan) to reveal more of the photo. This hover interaction is the site's signature micro-interaction — reuse it (or explicitly reference it) if another page needs a similar "our services" grid, rather than inventing a different hover style.
3. **The "bill"** (`.bill`) — a literal receipt: white card, torn-paper top edge (`.bill::before`, a repeating diagonal-gradient trick), dashed line-item dividers, closing CTA. This is a one-off metaphor tied to the vacancy copy — don't reuse the torn-paper treatment for unrelated content, it'll stop meaning anything.

### Icons
Inline SVG only, no icon font/library dependency (keeps the "no external dependencies" rule from `CLAUDE.md`). Rules learned from real bugs:
- **Verify centering with coordinate math, not memory.** Hand-drawn/half-remembered bezier paths inside a circular badge have repeatedly rendered off-center. Prefer simple primitives (`<circle>`, `<polygon>`, `<polyline>`, `<line>`, `<rect>`) with coordinates you can check by hand (bounding box center should equal the viewBox center) over freehand `<path>` curves.
- 24×24 viewBox is the default; stroke-based (`fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`), so they can be recolored via `color`/`stroke`.
- The WhatsApp glyph is the one exception (a real, specific brand mark) — copy it exactly, don't simplify it.

### Header / nav
Logo mark (`logo-icon.png`, 40×40) + wordmark on the left, nav links on the right. Below `860px` the links collapse into a `<button class="nav-toggle">` (hamburger, plain SVG lines) that toggles a full-width dropdown (`#site-nav.is-open`) via `assets/js/main.js` — vanilla JS, no framework, closes on link click or `Escape`. If you add a page, copy the whole header block including the toggle button and script tag; don't ship a page with the links always-visible-and-wrapping like the very first version had (real bug: caused horizontal scroll on 320–375px screens).

## 6. Imagery

| Asset | Use |
|---|---|
| `assets/img/logo-icon.png` | Favicon, header brand mark, hero color-block composition. Transparent PNG, 1024×1024 — always constrain with `width`/`height`/`aspect-ratio`, never stretch. |
| `assets/img/logo-full.png` | **Not currently used on the page.** Has a baked-in typo ("PAIHTING") in the pixel art — do not use anywhere the text would be legible until a corrected version exists. |
| `assets/img/service-*.webp` | Real photography, one per service card, 1536×1024 source, `object-fit: cover` in a constrained box (4:3 desktop, square tile on mobile/tablet). |
| `assets/video/hero.mp4` | **Not currently used.** Kept in the repo in case a future page wants it, but the home hero moved to the color-block composition instead (real-user legibility issues came up with text over video — see §7). |

Always write a real, descriptive `alt` for content images (the four service photos). Purely decorative images/icons that sit next to visible text with the same meaning (nav icons, the header logo mark) use `alt=""` or are wrapped in an `aria-hidden="true"` parent instead.

## 7. Motion & accessibility

- Scroll-linked reveals use `@supports (animation-timeline: view())` as progressive enhancement — browsers without support just see static content, never broken content.
- Every scroll/load animation has a corresponding block inside `@media (prefers-reduced-motion: reduce)` that forces the *end state* (`opacity: 1`, `transform: none` or the specific resting transform) — reduced-motion users must never see a "stuck mid-animation" or invisible element.
- Global rule: focus rings are `2px solid var(--color-pink-deep)` via `:focus-visible` — don't remove them on custom interactive elements (buttons, the nav toggle).
- Minimum touch target is 44×44px (`.nav-toggle`, nav links have generous padding for this reason).
- Don't reintroduce opacity-based scroll reveals (see §1) — this was tried, caused visible bugs twice, and was deliberately removed.

## 8. Known issues / things to fix opportunistically

Not blocking, but worth cleaning up next time you're in the relevant file:
- `.services-secondary` (the "Also available: windows, doors and screening." line) references `var(--color-ink-soft, currentColor)` — `--color-ink-soft` was never defined as a token, so it's silently falling back to `currentColor`. Either add the token or simplify the rule to `color: currentColor` explicitly.
- `logo-full.png` has a typo baked into the artwork ("PAIHTING") — get a corrected export before using it anywhere (social sharing image, print, etc.).

## 9. Building a new page — checklist

1. Copy the `<head>` block (fonts, favicon) and the full header (including `.nav-toggle` + `#site-nav` + the script tag) verbatim.
2. Reuse `.wrap` for every section; don't introduce a second content-width system.
3. Pick colors only from §2. If a new section needs a background color, it should be one of the existing tokens (light: white/cloud; dark: ink, blue-deep, green-deep are the three in use — pink-deep and a gold-deep are the remaining reasonable options).
4. If the page needs a hero, decide deliberately whether it's a "brand moment" (color-block + logo, like home) or content-led (plain text on `--color-cloud`) — don't default to a stock photo.
5. Any WhatsApp link uses `.btn-whatsapp` + the exact glyph SVG, never the pink primary button.
6. Run through §7 before calling it done: reduced-motion fallback, focus rings intact, touch targets ≥44px, no opacity-based scroll reveal.
7. Check at 375px, 768px, 1024px, 1440px minimum before considering the page finished.
