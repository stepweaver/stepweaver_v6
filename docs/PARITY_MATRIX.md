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

Pending production screenshots: `/work`, `/writing`, `/about`, `/services`, `/contact`, `/resume`, `/terminal`, `/lab`, and novelty themes other than skynet (`monochrome`, `monochrome-inverted`, `vintage`, `apple`, `c64`, `amber`, `synthwave`, `dracula`, `solarized`, `nord`, `cobalt`). Production's main toggle is light/dark only. Novelty themes are in the CSS and were applied here by setting `data-theme`.

## Reconciled v6 screenshots

Captured 2026-11-08 from `http://127.0.0.1:5173/` on `feat/m1-reconciled`, with Playwright viewports. These are the reconciled app, not the separately initialized Milestone 1 starter.

| File                                     | Viewport      | Theme  |
| ---------------------------------------- | ------------- | ------ |
| `docs/parity/v6/home-desktop-dark.png`   | 1440×900      | dark   |
| `docs/parity/v6/home-desktop-light.png`  | 1440×900      | light  |
| `docs/parity/v6/home-tablet-dark.png`    | 768×1024      | dark   |
| `docs/parity/v6/home-mobile-dark.png`    | 390×844 at 2x | dark   |
| `docs/parity/v6/home-desktop-skynet.png` | 1440×900      | skynet |
| `docs/parity/v6/home-390-dark.png`       | 390×844       | dark   |
| `docs/parity/v6/home-390-card.png`       | 390×844       | dark   |
| `docs/parity/v6/home-390-menu.png`       | 390×844       | dark   |
| `docs/parity/v6/home-390-skynet.png`     | 390×844       | skynet |
| `docs/parity/v6/home-464-dark.png`       | 464×900       | dark   |
| `docs/parity/v6/home-768-dark.png`       | 768×1024      | dark   |
| `docs/parity/v6/home-1440-dark.png`      | 1440×900      | dark   |
| `docs/parity/v6/home-1440-light.png`     | 1440×900      | light  |

The `home-390` through `home-1440` files are the mobile-review pass. At 390, 464, and 768 the headline, introduction, and contact action come before the operator card, and the header stays one row. The 390 card and skynet shots are scrolled to the portrait. The menu shot shows the full appearance selector. At 1440 the operator card stays on the left.

Compared with the v5 captures: the IBM 3270 headline, green-on-near-black dark theme, light theme, skynet red portrait, HMFIC-01 card, `// λstepweaver` wordmark, and five-link nav are present. The operator card keeps a side-by-side portrait on wide screens. Below 640px the long role sits under the portrait so it is not squeezed beside the photograph. Still short of production: the card's denser corner brackets, the animated circuit canvas, scanlines, the matrix handshake sequence, the chat widget, and the featured-project strip. The v5 light and skynet files still show a doubled hero and are not a clean reference.

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
| Writing strip                   | At least "AI Resume Guide", dated 2026-02-11 on the homepage                              | Latest three published notes. AI Resume Guide remains published and is not always in those three           |
| Close                           | Resume, contact, work, quiet lab/terminal                                                 | Conversation CTA. Terminal and Lab go to status pages                                                       |
| Chat widget                     | "Open chat" button                                                                        | Absent. No fake chat                                                                                        |
| Command palette                 | Ctrl+K, present                                                                           | Page navigation only. Does not run commands                                                                 |
| Circuit background              | Animated canvas                                                                           | Flat canvas from the original main theme tokens. No circuit and no scanlines                                |
| Matrix link                     | Animated phases; header reads UNPLUGGED                                                   | Static dormant state. Phases not ported                                                                     |

## Routes

Production route tree includes marketing, terminal, embed, and log groups. Public pages seen in source: `/`, `/about`, `/services`, `/work`, `/work/archive`, `/work/[slug]`, `/writing`, `/writing/[slug]`, `/resume`, `/contact`, `/lab`, `/play`, `/terminal`, `/privacy`, Field Journal, footwear, meshtastic, dice, mail-sort academy, yankee samurai, theme audit, for-agents.

| Surface                                   | Production                                | v6 milestone 1                                           | Exercised                                                                     |
| ----------------------------------------- | ----------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `/`                                       | Full lobby                                | New narrative shell                                      | Code and unit gate. Browser check of the new app is listed in the pass report |
| `/about`                                  | Brief plus flagship links                 | Narrative, no project links                              | Not browser-verified                                                          |
| `/services`                               | Selective consulting, hiring-primary copy | What I do                                                | Not browser-verified                                                          |
| `/writing`                                | Notion published posts                    | Published index, articles, RSS                           | Fixture browser tests. A local read on 2026-11-09 returned the 10 published titles, 404 for the draft, and a 301 from the page id |
| `/work`                                   | Six proofs                                | Curation page, no cards                                  | Browser test                                                                 |
| `/work/[slug]`                            | Case study                                | 404 with no record body                                  | Browser test and unit gate                                                   |
| `/resume`                                 | HTML plus PDF                             | Full chronology, current PDF, labeled draft PDF          | Browser test read both PDF responses                                         |
| `/contact`                                | Turnstile, validation, mail               | Form action, Turnstile, rate limit, Resend or mock       | Browser test against the mock adapter and Turnstile test keys               |
| `/terminal`                               | Commands, chat, games                     | Status page                                              | Not exercised against production terminal                                    |
| `/lab`                                    | Lab index                                 | Status page                                              | Not exercised                                                                |
| Chat `/api/chat`                          | Shared λlambda                            | Absent                                                   | Not called                                                                   |
| Contact form action                       | Mail via Nodemailer                       | Resend HTTP. Nodemailer is not used                      | Mock delivery in tests. No real message sent                                 |
| Notion                                    | Published filter, 300s cache              | Data-source query, same filter and cache                 | Unit tests with a fake API. One local read-only pass returned the published titles |

## APIs left on v5

`/api/chat`, `/api/weather`, `/api/rss` (Syntax.fm proxy, not a first-party blog feed), `/api/codex`, `/api/notion-blocks`, `/api/notion-image`, `/api/terminal/codex`, `/api/book-shower`, carrier-journal, carrier-log, footwear. Writing is server-rendered, not those v5 APIs. The first-party feed is `/writing/rss.xml`. Contact is a SvelteKit form action, not `/api/contact`.

## Secrets

Names only. Values are not stored in this repo.

`NOTION_API_KEY`, `NOTION_BLOG_DB_ID`, `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`. `CONTACT_EMAIL_ADAPTER=mock` is development-only. The Worker rate limiter is `CONTACT_RATE_LIMITER` in `wrangler.jsonc` (5 requests per 60 seconds). Gmail SMTP from v5 is not used.

## Project visibility

| Reader               | Rule                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| Home                 | No project titles                                                         |
| `/work`              | No cards                                                                  |
| `/work/[slug]`       | Unavailable unless `APPROVED_PUBLIC_SLUGS` contains the slug              |
| Related writing      | Article pages do not link to project case studies                         |
| Terminal and λlambda | Not built. No project knowledge module                                    |
| Sitemap              | `publicSitemapPaths()` adds `/work/[slug]` only for `getPublicProjects()` |
| Structured data      | Person and WebSite only                                                   |
| Public API           | No project API                                                            |

Enforced in `src/lib/projects/index.ts` and `src/lib/projects/publication.spec.ts`.

## Visual tokens

`src/lib/styles/themes.css` is copied from v5 `styles/themes.css`. Fonts `IBM_3270.woff` and `OCRA.woff` are copied. Portraits `pixarMe-256.png` and `pixarMe_terminator.png`, plus `lambda_stepweaver.png`, are copied. The rest of `public/images` was not copied, because those files are project art and this milestone does not show project cards.
