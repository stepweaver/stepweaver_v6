# SITE_PLAN.md

Editorial specification for the λstepweaver SvelteKit rebuild. Visual language stays. Production behavior stays on `https://stepweaver.dev` until a later, explicit cutover.

This file replaces the hiring-first lobby in v5 `SITE_PLAN.md`. v5 is unchanged at `a8db9d46bb0579dca23937a455c4147c3b319366`.

## Positioning

The public site centers on Stephen Weaver, the résumé, and the terminal. It does not lead with a project catalog. The 2026-11-21 direction in `REBUILD_PLAN.md` controls the homepage and retired routes.

- **Name:** Stephen Weaver
- **Mark:** λstepweaver
- **Primary title:** Business Systems Developer & Systems Integration Consultant
- **Supporting line:** Business analysis · systems integration · automation · custom software · applied AI
- **Canonical data:** `src/lib/data/identity.ts`

Plain language carries the professional information. HUD labels, HMFIC-01, and the terminal aesthetic decorate it. They are not the pitch.

AI-assisted engineering is part of the delivery process. Generated code is read, tested, and shipped by a person. Do not claim otherwise, and do not invent metrics, testimonials, clients, or verified uptime.

The exact homepage headline is provisional. The current line is the title itself so the page does not invent a slogan. Change it after a styled review.

## What changed from the v5 plan

v5 optimized the lobby for a hiring manager: six featured systems, then experience, skills, and writing. This plan keeps the operator card and the career facts, and removes the featured-project block until individual case studies are approved. Hiring remains a contact intent and a résumé page. It is not the homepage headline.

An existing homepage testimonial on the production site (Hero Point Consulting / Griffin H.) is recorded in `docs/PARITY_MATRIX.md` and is not republished here. It was not re-verified.

## Navigation

Primary nav, in order:

| Label     | Route       |
| --------- | ----------- |
| About     | `/about`    |
| What I Do | `/services` |
| Writing   | `/writing`  |
| Resume    | `/resume`   |
| Contact   | `/contact`  |

The wordmark goes home. `/work` is omitted from the primary nav until the first approved case study. The route stays available as a curation page and from the footer. What I Do stays in the nav and at `/services`, and stays out of the homepage actions and the default palette.

Open Terminal is the homepage's primary action. Lab is not a public destination: `/lab` redirects to `/terminal`. `/play` redirects to `/dice-roller`.

## Routes

| Route          | Public role in this milestone                                                   |
| -------------- | ------------------------------------------------------------------------------- |
| `/`            | Brief personal introduction. Operator card, Matrix Link, Open Terminal, Résumé  |
| `/services`    | What I do. Direct URL. Not a homepage action or a default palette entry         |
| `/about`       | Narrative, chronology, stack. No case-study links                               |
| `/writing`     | Published Notion notes, tag filter, pagination, stable article URLs, RSS        |
| `/resume`      | Canonical chronology, current production PDF, and a labeled draft PDF           |
| `/contact`     | Consulting, hiring, and general. Server validation, Turnstile, rate limit, mail |
| `/work`        | Empty curation. Direct URL. Not a homepage action or a default palette entry    |
| `/work/[slug]` | Unavailable unless that slug is approved for publication                        |
| `/terminal`    | Working terminal. Receives `/lab` redirects                                     |
| `/dice-roller` | Standalone roller. Direct palette and terminal destination. Receives `/play`    |
| `/lab`         | Redirect to `/terminal`. Legacy tools and data are not deleted                  |
| `/play`        | Redirect to `/dice-roller`                                                      |
| `/privacy`     | Points at the production policy. Text not copied                                |

Keep historic production URLs alive on v5. In this app, redirect only `/lab` to `/terminal` and `/play` to `/dice-roller`.

## Homepage

1. **Hero.** Operator card (portrait, HMFIC-01, availability, chapter, Matrix Link) and the title, with the signature background behind the page. Primary action: Open Terminal. Secondary: Résumé. Writing and About stay visible. Contact is a supporting link.
2. No What I Do, How I Work, background essay, writing strip, Work, Lab, or Play actions on this page. Those narratives stay on their own URLs.

No featured-project carousel.

## Projects

Two independent fields:

- **Publication:** `draft | public | retired`. Every existing record starts as `draft`.
- **Registry status:** the v5 value (`live`, `demo`, `coming-soon`, `archived`). Preserved and never used as publication permission.
- **Verification:** `unknown` until tested.
- **Reality:** `needs-verification` until a review sets it.

`getPublicProjects()` is the only collection for public lists, sitemap entries, structured data, and any future λlambda knowledge. Direct slug requests that are not public return one unavailable response and do not render the write-up.

The inventory is `docs/PROJECT_REVIEW.md`. Full case-study bodies stay in v5 until a specific approval copies one on purpose.

## Writing

Notion stays the CMS. The app reads published pages through the 2025-09-03 data source when the database exposes one, and falls back to the 2022-06-28 database query. There is no Slug property. Existing public URLs are frozen in `src/lib/writing/slug-registry.ts`. A later title change redirects the new title slug to the frozen slug. New pages use an editable Slug property if one is added, otherwise `slugify(title)`, and `/writing/p/{pageId}` always redirects to the canonical slug. Add a new page id to the registry before renaming its title. The first-party feed is `/writing/rss.xml`. v5 `/api/rss` remains the Syntax.fm proxy and is not ported.

## Visual system

Preserve IBM 3270 and OCR A, the dark green terminal palette, the light appearance, and the novelty themes copied from v5 `styles/themes.css`. Preserve the operator-card geometry, corner ticks, portrait, and skynet portrait swap.

The circuit background in this milestone is a static grid, not the production canvas. The matrix-link phases are not ported. The command palette navigates between pages and does not run terminal commands. See `docs/PARITY_MATRIX.md`.

There is no Tailwind bridge in this working tree. Do not add one during parity work, and do not purge the copied theme CSS.

## Out of scope until a later milestone

Terminal commands, λlambda, Field Journal, lab tools, analytics, and production deploy or DNS. The contact form sends only when Resend and Turnstile are configured. The production résumé PDF stays in place until the draft is approved.
