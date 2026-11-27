# Architecture

Current shape of λstepweaver. This describes the application in the repository. Items under "Intended improvements" are not guarantees.

## Application and routes

SvelteKit App Router-style file routes, grouped under `src/routes/(marketing)` so the shell layout does not appear in the URL. The Cloudflare adapter is configured in `vite.config.ts`.

| Route                      | Role                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                        | Short introduction, operator card, Matrix Link, signature background. Primary action is Open Terminal. Secondary is Résumé. Writing and About are linked. Contact is a supporting link. A writing section renders when the catalog is available. |
| `/about`                   | Professional narrative from canonical identity data                                                                                                                                                                                              |
| `/services`                | What I Do. In the primary nav. Absent from homepage actions and the default command palette                                                                                                                                                      |
| `/writing`                 | Published Notion index, tag filter, pagination. Links to the Field Journal                                                                                                                                                                       |
| `/field-journal`           | Public walking mileage. Its own loader. Not a second CMS                                                                                                                                                                                         |
| `/writing/[slug]`          | Article. Legacy title slugs redirect to the canonical slug                                                                                                                                                                                       |
| `/writing/p/[pageId]`      | Permanent redirect to the canonical article slug                                                                                                                                                                                                 |
| `/writing/rss.xml`         | First-party RSS feed                                                                                                                                                                                                                             |
| `/resume`                  | HTML résumé. Download is `static/weaver_resume.pdf`                                                                                                                                                                                              |
| `/resume/draft.pdf`        | Redirects to that same PDF                                                                                                                                                                                                                       |
| `/contact`                 | Consulting, hiring, and general. SvelteKit form action                                                                                                                                                                                           |
| `/terminal`                | Command console                                                                                                                                                                                                                                  |
| `/dice-roller`             | Standalone roller. Shares the dice engine with terminal `roll`                                                                                                                                                                                   |
| `/work`                    | Curation page. `noindex`. Lists only approved public cards                                                                                                                                                                                       |
| `/work/[slug]`             | Public case study or public record card. Anything else is a 404 with no record body                                                                                                                                                              |
| `/privacy`                 | On-site privacy page                                                                                                                                                                                                                             |
| `/lab` and paths under it  | 301 to `/terminal`                                                                                                                                                                                                                               |
| `/play` and paths under it | 301 to `/dice-roller`                                                                                                                                                                                                                            |
| `/carrier-journal`         | 301 to `/field-journal`, including old subpaths. The daybook, lab, and footwear apps are not restored                                                                                                                                            |
| `/field-journal/*`         | 301 to `/field-journal`                                                                                                                                                                                                                          |
| `/api/chat`                | λlambda                                                                                                                                                                                                                                          |
| `/api/weather`             | Terminal weather                                                                                                                                                                                                                                 |
| `/sitemap.xml`             | Public paths only                                                                                                                                                                                                                                |

Primary nav is About, What I Do, Writing, Resume, Contact. The wordmark goes home. Work stays in the footer. Field Journal is not in the primary nav. The command palette and terminal `cd` include it as a static destination. The default list in `src/lib/data/navigation.ts` matches that. Search can still resolve `/work` and `/services`.

The marketing layout (`src/routes/(marketing)/+layout.svelte`) mounts the navbar, footer, command palette, λlambda launcher, signature background, and a short page fade. The fade skips the terminal and `prefers-reduced-motion`.

## Client and server boundaries

Server-only modules live in `src/lib/server`. They read credentials through `readServerEnv`. Public pages receive already-selected data from `load` functions.

`src/lib/seo/origin.ts` exports only the public origin so client components can build canonical URLs without importing the project catalog. Sitemap and JSON-LD live in `src/lib/seo/site.server.ts`. `pnpm build` runs `scripts/check-client-publication.mjs`, which fails if registry source filenames appear in the client JavaScript.

`hooks.server.ts` sets `nosniff`, `DENY` framing, a strict referrer policy, a permissions policy that allows geolocation on this origin, and HSTS on non-dev HTTPS responses. Content Security Policy is the SvelteKit `csp` block in `vite.config.ts` (`mode: 'auto'`).

## Data loading

Marketing `+layout.server.ts` loads JSON-LD and the approved project cards for the command palette. It does not read the writing catalog, and it does not register `app:home-writing`. Static navigation lives in the client. Project cards stay on that server load so the private registry is not shipped to the browser.

The command palette requests `GET /api/palette/writing` the first time it opens. That route calls `getWritingCatalog` and returns `slug`, `title`, `excerpt`, and `tags` for published entries. The browser keeps a successful response for the visit and does not request it again when the palette opens again. A failed response is not kept, so the next open tries again. Pages, approved projects, and themes stay searchable while that request is in flight or unavailable.

The homepage reads the writing catalog on its own non-blocking path: at most 300ms for KV, and no wait for Notion. A cold homepage shows the profile plus a loading notice and retries the `app:home-writing` dependency three times, four seconds apart. That dependency is only on the homepage load.

`/writing`, article pages, RSS, and `/writing/p/[pageId]` wait for a bounded catalog fetch so the response can be server-rendered. A cached article body is loaded only when a fresh publication catalog includes the page. An uncached body waits for a published-set read in that request before Notion blocks are fetched.

Chat loads writing context with the same non-blocking option. Public project cards come from the in-memory allow-list.

## CSS and theme

Global CSS is `src/app.css`, layered as reset, tokens, theme, base, typography, components, utilities. Feature styling stays in component `<style>` blocks. There is no Tailwind configuration in this tree.

Themes are `data-theme` values from `src/lib/theme/themes.ts`: dark, light, and the novelty palettes copied into `src/lib/styles/themes.css`. `static/theme-init.js` applies the stored theme before paint. The signature background is two canvases (circuit traces and λ). It stops the animation loop when `prefers-reduced-motion` matches. The operator portrait uses `pixarMe-256.png`. The Skynet portrait is requested only while that theme is active.

## Identity and résumé

`src/lib/data/identity.ts` is the shared professional identity: name, λstepweaver, title **Business Systems Developer & Systems Integration Consultant**, location, email, and public links. Résumé chronology lives in `src/lib/data/resume-data.ts` and drives the HTML résumé and the λlambda brief.

The file visitors download is `static/weaver_resume.pdf`, linked as `/weaver_resume.pdf`. `/resume/draft.pdf` responds with a 308 to that file. `src/lib/resume/pdf.ts` can still build a text PDF for unit tests. It is not the download.

## Writing

Notion remains the CMS. `src/lib/server/writing/notion.ts` queries the 2025-09-03 data source when the database exposes one, and otherwise the 2022-06-28 database query. Only `Status = Published` is ingested. Each Notion operation has an eight-second budget, manual redirects, and pagination capped at 20 pages. A truncated or malformed success throws and does not replace a good cache entry. An actually empty Published catalog may replace the previous catalog.

Slug resolution for a published page:

1. Frozen page id in `src/lib/writing/slug-registry.ts` (ten URLs audited 2026-11-09)
2. A rich-text `Slug` property, when one exists and the page is not frozen
3. `slugify(title)`, matching the historical permalink rule

`/writing/p/{pageId}` redirects to the canonical slug. A title-derived slug that differs from the canonical slug redirects to it. New pages keep the title slug until their page id is added to the registry. Add that id before renaming the title.

Public catalog and sanitized article blocks are cached. See [OPERATIONS.md](OPERATIONS.md) for freshness. Hyperlinks in rich text are limited to safe protocols. Rendered text is escaped Svelte text.

## Field Journal

`/field-journal` reads the existing Notion database named by `NOTION_CARRIER_JOURNAL_DB_ID`. It does not create a database, write rows, or load on the homepage, writing archive, or sitemap fetch. The writing archive only links to the route. Reflections stay ordinary posts filtered with the existing `Field Journal` tag.

The public allowlist is `Date`, `Miles Walked`, `Publish Public`, and `Weight Lbs`. The query sends those property ids as `filter_properties`. `Publish Public` must be true in the Notion filter and again when each page is normalized. Page ids, titles, notes, individual weights, and every other property are dropped before caching. The cached value is `journal:v1:{databaseId}:public-mileage` in the same KV binding as writing. It stores mileage rows and the derived weight change, not each weigh-in and not mileage totals.

Weight change is the latest valid published weigh-in minus the earliest, after sorting by `Date`. A weigh-in counts when miles are blank. Blank, zero, negative, and invalid weights are skipped. Fewer than two valid published weigh-ins leaves the change unset, and the page omits the stat. The browser receives that one number only.

A snapshot is served only while it is younger than five minutes (`JOURNAL_PUBLICATION_WINDOW_MS`). If Notion then fails, the page says the record is unavailable. It does not keep an expired copy. Malformed or truncated responses fail the same way. An actually empty public query is an empty journal.

`JOURNAL_SOURCE=fixture` serves synthetic rows and a fixed clock of 2026-11-26. That source is ignored when the production build sets `dev` to false. Playwright sets `STEPWEAVER_E2E=1`, which in development makes service keys come from the process environment instead of platform bindings. It sets this fixture source, clears the Notion key and database id, and runs a second server with `JOURNAL_SOURCE=unavailable`. The owner reports that the existing database is shared with the integration and that `/field-journal` is working. The browser suite does not call that database.

Mileage math lives in `src/lib/journal/mileage.ts`. Weeks start on Monday. The current day is `America/Indiana/Indianapolis`. Stored `YYYY-MM-DD` values are calendar dates. Missing mileage is omitted. Zero is kept and is not a walking day. Duplicate dates or invalid mileage reject the total and name the dates.

## Metadata

The root layout resolves one page description through `resolvePageMetadata` and renders it with `src/lib/components/seo/PageMeta.svelte`. A client navigation replaces that head block. Open Graph and Twitter tags stay on that component: title, description, type, URL, site name, locale, image URL, width, height, type, and alt text, plus article dates and tags when the page is an article.

The sharing image for every current page is `static/images/lambda-share.jpg` (`/images/lambda-share.jpg`). `src/lib/seo/share-image.ts` records its URL path, 1200×630 dimensions, `image/jpeg` type, and alt text together. The alt text describes that mark: a green pixel lambda above a terminal. It does not say the picture contains an article or project title. Notion cover URLs are not used as social images. There is no per-article image renderer.

`src/lib/seo/metadata.spec.ts` checks the metadata object. `e2e/metadata.e2e.ts` checks the initial HTML, client navigation, and the served JPEG. Those tests do not call Facebook, X, LinkedIn, or Slack. Those products cache and crop previews on their own.

`SITE_ORIGIN` in `src/lib/seo/origin.ts` is `https://www.stepweaver.dev`. Canonical links, Open Graph URLs, sitemap locations, RSS item links, and JSON-LD `url` values use it. The origin is not taken from the request host. `stepweaver.dev` and `www.stepweaver.dev` are both same-site hosts for article links and Turnstile. This repository does not contain the apex-to-www redirect.

On 2026-11-25, `https://stepweaver.dev/` returned 307 with `Location: https://www.stepweaver.dev/`. The HTML, sitemap, and RSS then served from www still published `https://stepweaver.dev`. That is the deployed site. This branch publishes the www origin, which matches that redirect target. The check did not identify the Worker and did not call a social-preview crawler.

## Article publication

A listing catalog is not publication. `/`, `/writing`, RSS, the sitemap, the terminal, and `GET /api/palette/writing` may show a previously published title for five minutes, or for up to 30 minutes when Notion is down. That list never authorizes an article body.

`getPublicationCatalog()` returns a catalog only when `status` is `ok`: Notion succeeded less than five minutes ago (`FRESH_MS`), or the source is the fixture catalog. A stale catalog, including one kept because Notion failed, is not returned.

`/writing/[slug]` uses one request-scoped read (`loadArticleBySlug`):

- A body already stored for that page's `revisedAt` may be served from the fresh catalog with no further Notion read. `revisedAt` is the full Notion `last_edited_time`. The display field `updated` is only the calendar day, so two edits on the same day do not share a body cache key.
- A missing body does not treat that fresh catalog as permission to call the Notion blocks API. The request performs a published-set read and fetches blocks only when that read still includes the page. If the catalog read above already waited on Notion, it is not repeated.
- If that read fails, the response is 503. If it omits the page, the response is 404. Neither response includes the article title or article sharing metadata.
- If the read includes the page and the block fetch then fails, the page may still render the title and say the text is unavailable.

`/writing/p/[pageId]` and a legacy slug respond with 301 only when a fresh catalog maps them to a published slug. This app does not set a short cache lifetime on that redirect. Clients may store a 301 longer than five minutes. The destination article is checked on its own request.

A successful article response sends `cache-control: public, max-age=60`. A shared cache can replay that HTML for 60 seconds after the origin created it. Error responses send `no-store`. A cached body can therefore remain available until the fresh catalog window ends, plus up to 60 seconds of HTTP caching. Unpublishing is not instantaneous. After a failed Notion read, an isolate backs off for 30 seconds, so another uncached article attempt in that interval also fails closed instead of using the listing cache.

Body keys are `writing:v1:{databaseId}:blocks:{pageId}:rev:{encoded revisedAt}`. Keys from the previous schema, which ended in the calendar date, are not read. Catalog snapshots that omit `revisedAt` fail validation and are refetched. KV expires orphaned keys after 30 minutes. Deleting a key does not clear memory in an isolate that already holds the entry.

## Project publication

Two fields stay independent:

- **Publication** is `draft` or `public`. `APPROVED_PUBLIC_SLUGS` in `src/lib/projects/publication.ts` is the only permission. It is empty.
- **Registry status** (`live`, `demo`, `coming-soon`, `archived`) is stored on the private catalog and is ignored by public readers.

`getPublicWorkCards()` is the collection for `/work`, the sitemap, structured data, the command palette, and λlambda. `getPublicWorkPage()` returns null for missing and unpublished slugs, and the route turns that into one 404. The private catalog is `src/lib/projects/registry.json` (23 metadata rows). One case-study body, `stepweaver-dev`, exists in `src/lib/projects/data/stepweaver-dev.ts` and stays unpublished with the rest. Full legacy case-study bodies remain in `stepweaver_v5`.

Before a slug is added to `APPROVED_PUBLIC_SLUGS`, confirm all of the following:

- Live URL reachable, or an explicit decision that there is no demo
- Core user flow working
- Screenshots accurate
- Code or repo link valid
- Deployment owner known
- No secrets or sensitive data in the public write-up
- Status and outcomes match what can be shown
- Relevance to the consulting services

A retired project may become a historical case study with no demo button. That still requires this review. Candidate names from the rebuild are a queue, not an approval.

## Terminal

Domain logic is in `src/lib/terminal` (parser, commands, session, history, routes, Codex, contact wizard, blackjack, adventure). Presentation is `Console.svelte` and `TerminalPage.svelte`.

Shell commands: `help`, `clear`, `resume`, `cd`, `codex`, `roll`, `weather`, `contact`, `chat`, `blackjack`, `zork`, `cancel`. `cd` only resolves destinations in `src/lib/terminal/routes.ts`, plus `codex` → writing and `dice` → dice roller. Routes this app does not serve are rejected. Blackjack and the adventure keep their own modes, including adventure save and restore in `localStorage`. Dice history uses the same engine and storage key as `/dice-roller`.

The desktop prompt sits at the end of the transcript. Narrow viewports keep the input in a sticky console frame. Effects (weather, chat, contact send) run in the browser with a 20 second abort.

## λlambda

The site launcher and terminal `chat` both `POST /api/chat`. `src/lib/server/lambda/brief.ts` builds one public brief from identity, résumé fields, published writing, and `getPublicWorkCards()`. The prompt states that λlambda is an assistant and is not Stephen. With no `GROQ_API_KEY` and no `OPENAI_API_KEY`, the route returns that brief in plain language. With a key, Groq is tried first and OpenAI second. Provider calls are bounded, responses are `no-store`, and the route checks `Origin`.

Per-IP limiting is the `CHAT_RATE_LIMITER` binding (20 requests per 60 seconds). There is no application-wide token budget or provider circuit breaker. That is an intended improvement.

## Weather and contact

Weather is `GET /api/weather`. The handler checks `WEATHER_RATE_LIMITER` (30 per 60 seconds), then `lookupWeather`. Geocoding uses OpenWeather. Current conditions and the forecast are requested together. Forecast lines are one row per local calendar day, using that day's high, low, and the sample nearest local noon, for up to five days. Every row uses the single `timezone` offset from the current observation. The forecast does not change that offset when the window crosses a daylight-saving transition, and the app does not load a timezone database. Missing humidity, wind, and forecast temperatures are shown as unavailable. A real zero is kept. If the city offset is missing, the forecast is not labeled as local time. Ambiguous city names return a numbered choice. A denied geolocation lookup falls back to New York and tells the reader to type a city. Successful lookups are cached in Worker memory for 10 minutes. The cache is per isolate.

Contact is the default form action on `/contact`. The page form submits it with `enhance`. The terminal wizard posts that same action with `accept: application/json` and `x-sveltekit-action`, then reads the body with `deserialize` from `$app/forms`. There is no second contact endpoint. Shared field rules are in `src/lib/contact/fields.ts`. The server checks origin, body size and read time, the `CONTACT_RATE_LIMITER` binding (5 per 60 seconds), honeypot, minimum form age, Turnstile (hostname plus action `contact`), and then sends through the `CONTACT_EMAIL` binding. Production fails closed when the rate limiter, Turnstile secret, email binding, or sender and recipient addresses are missing. `CONTACT_EMAIL_ADAPTER=mock` works only in development.

The terminal shows the action's `message`. It clears the draft and returns to the shell only when the result type is `success` and the contact payload has `success: true`. An HTTP status or a success type without that flag is not treated as delivery. Validation failure, provider failure, an action error, a redirect, a body that cannot be deserialized, and a network failure keep the draft in contact mode. The visitor can send again, edit, or cancel. The terminal still sends `cf_turnstile_response`, and the server still checks it before mail is attempted.

## Verification

`.github/workflows/ci.yml` runs on push and pull request. It installs with `pnpm install --frozen-lockfile`, then `pnpm verify` (type check, unit tests, production build, and the client publication check inside that build), then `pnpm lint` (Prettier, then ESLint), then `pnpm exec playwright install --with-deps chromium` and `pnpm test:e2e`. A failed check fails the job. A failed browser run uploads the HTML report, traces, and screenshots for 14 days.

Playwright starts the two development servers in `playwright.config.ts`. Both set `STEPWEAVER_E2E=1`, fixture writing, `WEATHER_SOURCE=fixture`, mock contact mail, Turnstile test keys, and empty model keys. Port 4173 sets `JOURNAL_SOURCE=fixture`. Port 4174 sets `JOURNAL_SOURCE=unavailable`. No production credentials are provided. Passing those runs does not prove the production Worker, Notion, email, Turnstile, OpenWeather, or the model providers.

## Decisions and trade-offs

- Native CSS and a copied theme palette, instead of Tailwind.
- Notion stays the CMS. Stable URLs for the audited articles are a code registry because the database has no required Slug property.
- Writing cache favors a fast homepage over instant global consistency.
- Project metadata is in the repo so publication can be reviewed in Git. Case-study prose for the old catalog stays in v5 until an approval copies one on purpose.
- D1, Drizzle, and authentication are absent. Current features do not require them.
- Lab tools, Play, and the old project-led homepage are retired as public surfaces of this app. Their repositories and data stores are untouched.
- Cloudflare Email Service replaced SMTP. The Worker rate-limit bindings replaced the old KV counters for contact, chat, and weather.

## Intended improvements

These are recorded so they are not mistaken for current guarantees:

- Verify the production Worker, KV, email, Turnstile, and a live forecast. Repository tests do not attach those bindings.
- Add an application-wide model budget and alerting on top of the per-IP chat limit.
- Profile the signature-background frame loop on low-end phones and cap it if it dominates the main thread.
- Register new article page ids before title changes, or adopt a Notion Slug property as the source for pages that are not already frozen.
