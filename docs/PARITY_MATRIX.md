# Parity matrix

Compared with production `https://stepweaver.dev` (redirects to `https://www.stepweaver.dev`) and `stepweaver_v5` at `a8db9d46bb0579dca23937a455c4147c3b319366`.

Screenshots are captures of the live site. They are not mockups. Routes and themes without a file are pending. Nothing here was drawn to fill a gap.

## Screenshots

Captured 2026-11-08 with the Cursor browser. Layout viewport was set with device emulation. The in-app screenshot tool did not match that viewport, so the files below are CDP `Page.captureScreenshot` of the emulated page. The first desktop file is a full-page capture. The others are one viewport.

| File                                        | Viewport                          | Theme                                      | Notes                                                                                                                                                          |
| ------------------------------------------- | --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/parity/v5/home-desktop-dark-full.png` | 1440×900 layout, image 1430×4682  | Dark (no `data-theme`; production default) | Full homepage. Also stored in the local baseline commit.                                                                                                       |
| `docs/parity/v5/home-desktop-light.png`     | 1440×900                          | `data-theme=light`                         | Viewport only.                                                                                                                                                 |
| `docs/parity/v5/home-tablet-dark.png`       | 768×1024                          | Dark                                       | Viewport only.                                                                                                                                                 |
| `docs/parity/v5/home-mobile-dark.png`       | 390×844 CSS, image 780×1688 at 2x | Dark                                       | Viewport only.                                                                                                                                                 |
| `docs/parity/v5/home-desktop-skynet.png`    | 1440×900                          | `data-theme=skynet`                        | Portrait swaps to the red visor. The capture shows the hero twice side by side. Treat that doubling as a capture artifact and re-shoot before visual sign-off. |

Pending screenshots: `/work`, `/writing`, `/about`, `/services`, `/contact`, `/resume`, `/terminal`, `/lab`, and novelty themes other than skynet (`monochrome`, `monochrome-inverted`, `vintage`, `apple`, `c64`, `amber`, `synthwave`, `dracula`, `solarized`, `nord`, `cobalt`). Production's main toggle is light/dark only. Novelty themes are in the CSS and were applied here by setting `data-theme`.

## Homepage, observed

| Piece                           | Production                                                                                | This milestone                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Wordmark                        | `// λstepweaver`                                                                          | Kept                                                                                                        |
| Primary nav                     | Work, About, Writing, Resume, Contact, Lab                                                | About, What I Do, Writing, Resume, Contact. Work and Lab removed from the primary nav on purpose            |
| Headline                        | "Product-minded systems for operations-heavy teams"                                       | Title: Business Systems Developer & Systems Integration Consultant. Provisional                             |
| Operator card                   | Profile, HMFIC-01, portrait, role, open-to-work, chapter, four buttons, tags, matrix link | Geometry and copy kept. Buttons are Let's talk, Writing, About, Resume                                      |
| Role line                       | Business Systems Developer                                                                | Full new title                                                                                              |
| Featured six                    | Present                                                                                   | Removed until review                                                                                        |
| How I work                      | Three steps                                                                               | Four steps from the rebuild brief, using the existing analysis/design/build language plus validate/maintain |
| Experience                      | λstepweaver, Notre Dame, field-operations note                                            | Kept                                                                                                        |
| Skills grid and "8+ years" line | Present                                                                                   | Not carried. Not re-verified as a claim to repeat                                                           |
| Testimonial                     | Hero Point Consulting, Griffin H., visible on the homepage                                | Not republished. Text was not copied into the app                                                           |
| Writing strip                   | At least "AI Resume Guide", dated 2026-02-11 on the homepage                              | Empty placeholder. Post was not imported                                                                    |
| Close                           | Resume, contact, work, quiet lab/terminal                                                 | Conversation CTA. Terminal and Lab go to status pages                                                       |
| Chat widget                     | "Open chat" button                                                                        | Absent. No fake chat                                                                                        |
| Command palette                 | Ctrl+K, present                                                                           | Page navigation only. Does not run commands                                                                 |
| Circuit background              | Animated canvas                                                                           | Static grid approximation                                                                                   |
| Matrix link                     | Animated phases; header reads UNPLUGGED                                                   | Static dormant state. Phases not ported                                                                     |

## Routes

Production route tree includes marketing, terminal, embed, and log groups. Public pages seen in source: `/`, `/about`, `/services`, `/work`, `/work/archive`, `/work/[slug]`, `/writing`, `/writing/[slug]`, `/resume`, `/contact`, `/lab`, `/play`, `/terminal`, `/privacy`, Field Journal, footwear, meshtastic, dice, mail-sort academy, yankee samurai, theme audit, for-agents.

| Surface                                   | Production                                | v6 milestone 1                         | Exercised                                                                     |
| ----------------------------------------- | ----------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| `/`                                       | Full lobby                                | New narrative shell                    | Code and unit gate. Browser check of the new app is listed in the pass report |
| `/about`                                  | Brief plus flagship links                 | Narrative, no project links            | Not browser-verified                                                          |
| `/services`                               | Selective consulting, hiring-primary copy | What I do                              | Not browser-verified                                                          |
| `/writing`                                | Notion published posts                    | Status page, noindex                   | Not browser-verified                                                          |
| `/work`                                   | Six proofs                                | Curation page, no cards                | Not browser-verified                                                          |
| `/work/[slug]`                            | Case study                                | 404 with no record body                | Unit-tested gate only                                                         |
| `/resume`                                 | HTML plus PDF                             | Chronology plus link to production PDF | PDF URL returned HTTP 200. Page content of the PDF was not read               |
| `/contact`                                | Turnstile, validation, mail               | Email only, no submit                  | Not submitted                                                                 |
| `/terminal`                               | Commands, chat, games                     | Status page                            | Not exercised against production terminal                                     |
| `/lab`                                    | Lab index                                 | Status page                            | Not exercised                                                                 |
| Chat `/api/chat`                          | Shared λlambda                            | Absent                                 | Not called                                                                    |
| Contact `/api/contact`                    | Mail                                      | Absent                                 | Not called                                                                    |
| Notion `/api/codex`, `/api/notion-blocks` | Writing                                   | Absent                                 | Not called                                                                    |

## APIs left on v5

`/api/chat`, `/api/contact`, `/api/weather`, `/api/rss` (Syntax.fm proxy, not a first-party blog feed), `/api/codex`, `/api/notion-blocks`, `/api/notion-image`, `/api/terminal/codex`, `/api/book-shower`, carrier-journal, carrier-log, footwear. None were ported. None were called.

## Secrets

Names only, from reading v5 integration points. Values were not opened.

Likely names used by production: Notion token, chat provider keys, email SMTP or API credentials, Turnstile secret, Vercel KV or equivalent rate-limit store. This app has no `.env` and no bindings for them in `wrangler.jsonc`.

## Project visibility

| Reader               | Rule                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| Home                 | No project titles                                                         |
| `/work`              | No cards                                                                  |
| `/work/[slug]`       | Unavailable unless `APPROVED_PUBLIC_SLUGS` contains the slug              |
| Related writing      | No writing records yet, so no related-project links                       |
| Terminal and λlambda | Not built. No project knowledge module                                    |
| Sitemap              | `publicSitemapPaths()` adds `/work/[slug]` only for `getPublicProjects()` |
| Structured data      | Person and WebSite only                                                   |
| Public API           | No project API                                                            |

Enforced in `src/lib/projects/index.ts` and `src/lib/projects/publication.spec.ts`.

## Visual tokens

`src/lib/styles/themes.css` is copied from v5 `styles/themes.css`. Fonts `IBM_3270.woff` and `OCRA.woff` are copied. Portraits `pixarMe-256.png` and `pixarMe_terminator.png`, plus `lambda_stepweaver.png`, are copied. The rest of `public/images` was not copied, because those files are project art and this milestone does not show project cards.
