# Session Handoff — 2026-09-17

Notes for picking this project up in a new session (human or agent) without re-deriving context. Read this first, then `CLAUDE.md`, then `README.md`.

## ⚠️ Nothing in this session is committed yet

`git status` right now shows everything below as uncommitted (modified + untracked). No commits were made after `2087099`. If you're starting a new session, either commit this work first or be aware a `git reset`/`git clean` would destroy it.

## Mental model (this caused real confusion — read it)

- **You never open an HTML file directly.** The real site doesn't exist as files until built.
- **Source you edit:** `content/en/*.json` + `content/es/*.json` (text), `assets/css/main.css` (styling), `templates/*.html` (structure).
- **`npm run build`** → generates the real site into `dist/` (gitignored, links point at the real production `baseUrl`). This is what GitHub Actions runs on every push to `main`. You don't need to run it yourself.
- **`npm run preview`** → generates into `dist-preview/` (gitignored) with every link pointing at `http://localhost:5050/sparkling/` instead, and serves it. **This is the only command you use to look at the site locally.** Always the same command, same output folder, same URL — don't manually copy `dist/` anywhere.
- **`docs/design-reference.html`** is a frozen design mockup (icons/spacing/colors reference per `docs/superpowers/specs/2026-09-17-design-system.md`), not the live site. It used to be `index.html` at the project root, which looked like the real site and caused a round of confusion (edited by hand, plus 4 stray `.html` files created alongside it) — that's why it got moved and root is now file-free except config/docs.

## What changed this session

1. **Home page cross-links** (`scripts/build.js`, `content/*/home.json`): the 4 service cards and the "Where we work" area list on the home page had no real `href`s before — now they link to real pages.
2. **4 new service pages**, each with a discreet hero photo, a written description, and a before/after "evidence" photo block:
   - `services/cleaning`, `services/painting`, `services/management`, `services/gardening` — new routes in `site.config.js`, new content in `content/{en,es}/services/*.json`, new `heroImage`/`evidence` support added to `templates/page.html` + `scripts/build.js` (`renderHeroImage`, `renderEvidence`), new CSS in `assets/css/main.css` (`.interior-hero-wrap`, `.evidence-section`, etc.).
   - `scripts/validate.js` extended to warn on missing alt text for `heroImage`/`evidence` too.
   - `content/*/services/additional.json` now links out to these 4 pages instead of duplicating their content as the only description.
3. **`npm run preview`** (`scripts/preview.js`, `package.json`) — new command, see above. Fixes the "every preview jumps to a broken domain" and "lost track of which dist/ had my latest change" problems from earlier in the session.
4. **Moved `index.html` → `docs/design-reference.html`** (`git mv`, history preserved) plus fixed its now-one-level-deeper relative asset paths, and updated the 2 references in `docs/superpowers/specs/2026-09-17-design-system.md` and 1 in `scripts/build.js`.
5. Deleted 4 stray hand-written `.html` files at the project root (`cleaning.html`, `gardening.html`, `management.html`, `painting.html`) — they were manual duplicates of what the 4 new generated pages above already do correctly.
6. README updated: new "Where's the actual site?" section up top, `npm run preview` documented, mobile-check note updated from "not confirmed" to confirmed (checked at 375px on home/calculator/service/area pages, no horizontal scroll).

## Still open (business-side, not code)

Unchanged from before this session — tracked in `docs/superpowers/specs/2026-09-17-sparkling-website-design.md` §5:

- Real pricing values (`pricing.config.js` ships with `null` placeholders).
- Content Blueprint copy (titles/metas/body) for pages beyond what's already written.
- Logo/brand colors confirmation (current palette was extracted from the logo artwork already in `assets/img/`).
- Real business phone number and GitHub Pages `baseUrl` (`site.config.js` has both as `TODO`s) — update once there's a real GitHub repo + Pages URL.
- Google Business Profile (manual, outside this repo) — reviews section is a placeholder until then.
