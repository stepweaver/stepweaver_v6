# SITE_PLAN.md

Editorial specification for the λstepweaver SvelteKit rebuild. Visual language stays. Production behavior stays on `https://stepweaver.dev` until a later, explicit cutover.

This file replaces the hiring-first lobby in v5 `SITE_PLAN.md`. v5 is unchanged at `a8db9d46bb0579dca23937a455c4147c3b319366`.

## Positioning

The site says who Stephen Weaver is, what he does, how he works, and what he is writing. It does not lead with a project catalog.

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

The wordmark goes home. `/work` is omitted from the primary nav until the first approved case study. The route stays available as a curation page and from the footer.

Terminal and Lab are quiet status links. They are not in the primary nav, and the local routes must not look like working tools.

## Routes

| Route               | Public role in this milestone                                                    |
| ------------------- | -------------------------------------------------------------------------------- |
| `/`                 | Identity, what I do, how I work, background, writing placeholder, conversation   |
| `/services`         | What I do                                                                        |
| `/about`            | Narrative, chronology, stack. No case-study links                                |
| `/writing`          | Status page until Notion is connected. `noindex`                                 |
| `/resume`           | Canonical chronology plus the current production PDF, labeled as not regenerated |
| `/contact`          | Email and intent. No form submission                                             |
| `/work`             | Empty curation. `noindex`. Not a catalog                                         |
| `/work/[slug]`      | Unavailable for every current slug. Same response for unknown and unpublished    |
| `/terminal`, `/lab` | Status pages that point at production. `noindex`                                 |
| `/privacy`          | Points at the production policy. Text not copied                                 |

Keep historic production URLs alive on v5. Do not add casual redirects in this app yet.

## Homepage

1. **Hero.** Operator card (portrait, HMFIC-01, availability, chapter, matrix-link chrome) and the title. Primary action: talk about a system. Secondary: Writing and About.
2. **What I do.** Discovery, integration, automation, custom software, applied AI.
3. **How I work.** Understand the workflow, design the architecture, build and integrate, validate and maintain. Include the human-ownership note for agent-written code.
4. **Background.** λstepweaver and Notre Dame dates from the résumé, plus the field-operations chapter as context.
5. **Recent writing.** Empty, with an explicit note that Notion is not connected. Do not hard-code production posts.
6. **Conversation.** Contact path that does not pretend to send mail. Quiet terminal and lab status links.

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

Notion stays the CMS. Milestone 2 adds published-post ingestion, a stable slug field, legacy redirects, and a first-party feed. v5 `/api/rss` is a Syntax.fm proxy and is not a blog feed. Do not recreate it as the writing feed.

## Visual system

Preserve IBM 3270 and OCR A, the dark green terminal palette, the light appearance, and the novelty themes copied from v5 `styles/themes.css`. Preserve the operator-card geometry, corner ticks, portrait, and skynet portrait swap.

The circuit background in this milestone is a static grid, not the production canvas. The matrix-link phases are not ported. The command palette navigates between pages and does not run terminal commands. See `docs/PARITY_MATRIX.md`.

There is no Tailwind bridge in this working tree. Do not add one during parity work, and do not purge the copied theme CSS.

## Out of scope until a later milestone

Contact delivery, résumé PDF regeneration, Notion writing, terminal commands, λlambda, Field Journal, lab tools, analytics, and production deploy or DNS.
