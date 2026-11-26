# Operations

How to run, configure, and deploy λstepweaver. Behavior below is what the repository implements. The last section lists checks this repository cannot perform.

## Local development

```sh
pnpm install
cp .env.example .env
pnpm dev
```

`pnpm dev` is `vite dev`. It reads `.env`. Public variables must use the `PUBLIC_` prefix so the client bundle can see them.

```sh
cp .dev.vars.example .dev.vars
pnpm preview
```

`pnpm preview` builds and runs `wrangler dev`. Wrangler reads `.dev.vars` for local secrets and simulates bindings. `pnpm dev` does not write to production KV. Do not commit `.env` or `.dev.vars`.

`WRITING_SOURCE=fixture` serves the in-repo writing fixtures. `WRITING_SOURCE=unavailable` forces the failure state. `JOURNAL_SOURCE=fixture` serves synthetic mileage in development only. `WEATHER_SOURCE=fixture` serves the terminal weather fixture. Playwright sets `STEPWEAVER_E2E=1`. In development, `readServerEnv` then uses the process environment for service keys and ignores platform bindings copied from `.env`. The suite sets writing, journal, and weather fixtures, `CONTACT_EMAIL_ADAPTER=mock`, Turnstile test keys, and empty model keys. A second Playwright server sets `JOURNAL_SOURCE=unavailable`. A production build compiles `dev` to false, so `STEPWEAVER_E2E` and `JOURNAL_SOURCE=fixture` do not apply.

Install Chromium before the browser suite:

```sh
pnpm exec playwright install chromium
```

GitHub Actions uses `pnpm exec playwright install --with-deps chromium` so the Ubuntu runner also gets the operating-system libraries.

## Environment variables

| Name                           | Purpose                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `NOTION_API_KEY`               | Notion integration token. Server only. Writing and Field Journal share it                                                              |
| `NOTION_BLOG_DB_ID`            | Writing database id                                                                                                                    |
| `NOTION_CARRIER_JOURNAL_DB_ID` | Existing Field Journal database id. Do not create a replacement                                                                        |
| `WRITING_SOURCE`               | `fixture` or `unavailable`. Omit to use Notion when the key and writing database id are set                                            |
| `JOURNAL_SOURCE`               | `fixture` or `unavailable`. Omit to use Notion when the key and journal database id are set. Production ignores `fixture`              |
| `STEPWEAVER_E2E`               | `1` during Playwright. Development then reads service keys from the process and ignores platform bindings. Production cannot enable it |
| `WEATHER_SOURCE`               | `fixture` for the terminal weather fixture. Omit to use OpenWeather when the key is set                                                |
| `PUBLIC_TURNSTILE_SITE_KEY`    | Site key rendered by the contact and terminal widgets                                                                                  |
| `TURNSTILE_SECRET_KEY`         | Siteverify secret. Production contact fails closed when it is missing                                                                  |
| `CONTACT_FROM_EMAIL`           | Sender address. Also set as a Worker var in `wrangler.jsonc`                                                                           |
| `CONTACT_TO_EMAIL`             | Destination address. Also a Worker var                                                                                                 |
| `CONTACT_EMAIL_ADAPTER`        | `mock` only for local development. Production ignores it and fails closed                                                              |
| `OPENWEATHER_API_KEY`          | Terminal weather. Blank responses say weather is not configured                                                                        |
| `GROQ_API_KEY`                 | Preferred λlambda provider                                                                                                             |
| `OPENAI_API_KEY`               | Fallback provider                                                                                                                      |
| `GROQ_MODEL`                   | Optional. Default `llama-3.3-70b-versatile`                                                                                            |
| `OPENAI_MODEL`                 | Optional. Default `gpt-4o-mini`                                                                                                        |

Production secrets (`NOTION_API_KEY`, `NOTION_BLOG_DB_ID`, `NOTION_CARRIER_JOURNAL_DB_ID`, `TURNSTILE_SECRET_KEY`, `OPENWEATHER_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`) belong in `wrangler secret put`, not in Git. The Turnstile site key is public. Sender and recipient addresses are Worker vars, not secrets.

## Worker bindings

`wrangler.jsonc` names the Worker `stepweaver-v6`. The entry is the SvelteKit Cloudflare worker. Compatibility date is `2026-08-16` with the `nodejs_als` flag. Observability is enabled and source maps are uploaded.

| Binding                | Kind       | Behavior                                                                |
| ---------------------- | ---------- | ----------------------------------------------------------------------- |
| `ASSETS`               | assets     | Built client and static files                                           |
| `CONTACT_EMAIL`        | send_email | Outbound contact mail. No `destination_address` is set on the binding   |
| `CONTACT_RATE_LIMITER` | ratelimit  | 5 requests / 60 seconds, namespace `1001`                               |
| `CHAT_RATE_LIMITER`    | ratelimit  | 20 / 60 seconds, namespace `1002`                                       |
| `WEATHER_RATE_LIMITER` | ratelimit  | 30 / 60 seconds, namespace `1003`                                       |
| `WRITING_CACHE`        | KV         | Public writing catalog, article blocks, and the public mileage snapshot |

`src/app.d.ts` adds `WRITING_CACHE`, `CHAT_RATE_LIMITER`, and `WEATHER_RATE_LIMITER` onto the platform env. `src/worker-configuration.d.ts` is generated and can lag `wrangler.jsonc`. Regenerate with `pnpm cf-typegen` after binding changes, and keep `.svelte-kit/cloudflare` out of the way if the generator starts importing the built worker.

Cloudflare rate-limit bindings are approximate and counted per location. A missing binding, or a binding that throws, fails closed in production (HTTP 503). Development falls back to an in-memory window for contact, chat, and weather.

## Email

The contact action sends with `platform.env.CONTACT_EMAIL.send`. The message is a short HTML and text body. Visitor HTML is escaped. The visitor address is `replyTo`.

On the Cloudflare account, onboard the sender domain to Email Service and verify the destination inbox. The configured addresses are the `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL` vars. A send failure is logged with the provider code and error name. The visitor sees `The message was not sent. Nothing was delivered.`

The page form and the terminal both post this action. The terminal reads the response with `deserialize` from `$app/forms` and shows that action message. It clears the draft and returns to the shell only when the payload has `success: true`. A failure leaves the draft so the visitor can send again, edit, or cancel. Tests use the mock adapter and do not send mail.

This repository does not prove that a production message has been delivered.

## Turnstile

The contact page and the terminal contact wizard share `src/lib/contact/turnstile-widget.ts`. It loads the explicit Turnstile script once, sets action `contact`, clears the token on expiry or error, and can reset or remove the widget.

Server verification calls Siteverify and requires `success`, a hostname in the expected set, and action `contact`. Production hostnames accepted for this check are `stepweaver.dev` and `www.stepweaver.dev`. Local development also accepts `localhost` and `127.0.0.1`. A missing secret or a failed check refuses the message.

Cloudflare's test keys are documented at https://developers.cloudflare.com/turnstile/troubleshooting/testing/. Playwright uses those keys. A real hostname still needs its own widget.

## AI providers

`/api/chat` tries Groq, then OpenAI. Each provider attempt has a short timeout inside a 20 second overall deadline. `max_tokens` is 300. The client widget aborts at 25 seconds. The terminal aborts at 20 seconds. Responses use `cache-control: no-store`.

With neither key set, the handler returns a grounded summary of the public brief and does not call a provider. The brief includes published writing and approved case studies only. Unpublished registry rows are not passed in.

Per-IP limiting is the chat binding above. There is no shared token budget, spend alert, or circuit breaker across visitors.

## Weather

`OPENWEATHER_API_KEY` is sent to OpenWeather geocoding, current weather, and the 5-day/3-hour forecast. Current conditions and the forecast run concurrently. Each upstream call has a 5 second timeout and manual redirect handling. Forecast failure still returns current conditions. Daily lines aggregate min and max on the city-local calendar day.

The memory cache holds 64 successful lookups for 10 minutes. It does not survive a new isolate and is not KV. Daily lines use the one timezone offset on the current observation for every forecast sample. A daylight-saving change during the five-day window does not move that offset. Missing humidity, wind, and forecast temperatures stay unavailable. A measured zero stays zero.

## Notion

The server sends `Authorization: Bearer` and `Notion-Version` `2025-09-03` or `2022-06-28`. Logs record operation name and HTTP status. They do not record the token or the request body. Cover and inline images must pass the safe-URL check before they are rendered.

Share the writing database with the integration that owns `NOTION_API_KEY`. A 401 or 403 fails the refresh and keeps the previous good cache entry when one exists.

The existing Field Journal database is shared with that integration. The owner reports that `/field-journal` is working. Do not create a replacement database. Do not change `Publish Public` on existing rows, and do not delete properties. If a later request logs `object_not_found` or 403, the integration has lost access to that same database.

The server reads only `Date`, `Miles Walked`, and `Publish Public`. A Notion view for data entry can show those three columns. Leave mileage blank when it was not recorded. Type `0` only for a real zero. A date with two public rows blocks the total until one is unpublished or removed.

The mileage cache key is `journal:v1:{databaseId}:public-mileage`. It is fresh for five minutes. A failed refresh does not serve an older snapshot. Totals are calculated on read and are not stored.

## Cache freshness

`src/lib/server/writing/cache.ts`:

- Fresh for 5 minutes
- Usable for 30 minutes after the last successful fetch
- KV expiration TTL is 30 minutes
- Stale entries refresh with `platform.ctx.waitUntil`
- A failed refresh does not overwrite a good entry
- Each isolate coalesces its own refreshes and backs off for 30 seconds after a failure
- KV reads on the non-blocking path time out at 300ms. KV writes time out at 2 seconds
- Memory holds at most 128 entries and is not a lock across isolates

KV is eventually consistent. Separate locations can refresh at the same time. After five minutes a homepage can keep showing the previous catalog while a refresh runs. After 30 minutes with no successful refresh, the homepage can show a loading notice and retry. Visitors without JavaScript can open `/writing` or reload. The archive still uses that performance cache.

Direct article routes do not use the listing cache as permission to publish. `/writing/[slug]` and `/writing/p/[pageId]` accept a catalog only while it is fresh (younger than five minutes). After that they wait for one Notion read. If Notion is down they return 503 and do not serve the cached article or fetch its blocks. If Notion answers and the page is gone they return 404. Those errors are `no-store` and do not include the article title or article sharing metadata.

A body already stored for the page's full Notion `last_edited_time` (`revisedAt`) may be served during that fresh window with no further Notion read. The calendar field `updated` is display-only. Two edits on the same day use different body keys: `writing:v1:{databaseId}:blocks:{pageId}:rev:{encoded revisedAt}`. A key from the previous schema, ending in the calendar date, is not read. A catalog snapshot that omits `revisedAt` fails validation and is refetched. Orphaned KV entries expire after 30 minutes.

Fetching a body that is not already stored requires a published-set read in the current request. A fresh catalog from an earlier request is not enough. If this request's catalog read already waited on Notion, the catalog is not fetched again. If the current read fails, the route returns 503 and does not call the blocks API. If the page is absent, it returns 404. An isolate also backs off for 30 seconds after a failed refresh, so a second uncached attempt in that interval fails closed.

A successful article response may still be HTTP-cached for 60 seconds (`public, max-age=60`). Legacy slugs and `/writing/p/[pageId]` answer with 301 when a fresh catalog maps them to a published slug. This app does not set a short lifetime on that redirect, so a client may store it longer than the fresh window. The canonical article URL is checked again when it is requested. Unpublishing is visible to a new origin request after the fresh window once Notion answers. It is not instantaneous inside that window, and a shared cache can replay a successful response for up to 60 seconds after that.

Homepage responses include `Server-Timing: writing;dur=...` for the catalog wait only. Fresh catalog responses may also send `cache-control: public, max-age=60`. Stale or failed catalog responses send `no-store`. Article 404 and 503 responses send `no-store`.

Ordinary marketing pages do not read the catalog. `GET /api/palette/writing` reads the same listing catalog when the command palette opens. That response is `no-store`. The browser keeps one successful payload until the next full page load and requests a failed response again the next time the palette opens.

There is no scheduled warmer and no public purge route. Listing pages, and a palette that has already loaded writing, can keep a previously published title for up to 30 minutes during an outage. That list is not authorization for the article. Deleting a KV key does not clear memory in isolates that already hold the entry, or a palette payload the browser already downloaded. For an urgent removal, block the route or the edge before relying on cache expiry.

Only public writing data is cached. Contact responses, chat responses, credentials, and HTML are not.

## Rate limiting

| Surface | Production                                                      | Development without the binding |
| ------- | --------------------------------------------------------------- | ------------------------------- |
| Contact | 5 / 60s, then 429. Missing binding: 503                         | In-memory 5 / 60s               |
| Chat    | 20 / 60s, then 429 with `retry-after: 60`. Missing binding: 503 | In-memory 20 / 60s              |
| Weather | 30 / 60s, then 429. Missing binding: 503                        | In-memory 30 / 60s              |

Contact is limited before the body is parsed. Chat and weather are limited before their upstream calls. The key is `event.getClientAddress()`.

## Deploy

```sh
pnpm deploy
```

That is `pnpm build` followed by `wrangler deploy`. The build includes the client publication check. Deploy from a clean `pnpm verify` run. This document does not authorize a DNS cutover. Confirm the Worker name `stepweaver-v6` is the intended production script before the first attach to a public hostname.

After a deploy that should serve writing:

1. Open `/writing` on the deployed hostname and confirm published titles.
2. Open the articles that should be warm.
3. Reload `/` and confirm the writing section, and that `Server-Timing` shows a short `writing` duration on a warm KV read.
4. Confirm the client bundle check already passed in the build log.

## Continuous integration

`.github/workflows/ci.yml` runs on push and pull request, on Ubuntu, with Node 22 and pnpm 10. The job has a 20 minute limit. It does not receive production secrets.

1. `pnpm install --frozen-lockfile`
2. `pnpm verify` — `pnpm check`, `pnpm test:unit`, and `pnpm build`. The build runs the client publication check, so CI does not run that script again.
3. `pnpm lint` — `prettier --check .`, then `eslint .`
4. `pnpm exec playwright install --with-deps chromium`
5. `pnpm test:e2e`

A failed step fails the job. Later steps do not run after that, and none of the checks are allowed to pass on error. Playwright starts both development servers from `playwright.config.ts` (ports 4173 and 4174). On failure, the HTML report, traces, and screenshots are uploaded as `playwright-report` and kept for 14 days. CI sets `CI=true`, which selects the dot and HTML reporters and keeps traces only after a failure.

Those browser servers use the fixture settings above: `STEPWEAVER_E2E=1`, `WEATHER_SOURCE=fixture`, `JOURNAL_SOURCE=fixture` on port 4173, and `JOURNAL_SOURCE=unavailable` on port 4174. Contact mail is the development mock. Turnstile uses Cloudflare's published test keys. Model and weather provider keys are empty. This is fixture verification. It does not prove that production Notion, email, Turnstile, OpenWeather, or the model providers are configured or delivering.

The terminal contact browser test posts the real `/contact` action through that mock. It does not send mail.

## Smoke testing

Local:

```sh
pnpm verify
pnpm lint
pnpm test:e2e
```

`pnpm verify` is `pnpm check`, `pnpm test:unit`, and `pnpm build`. CI runs that command, then formatting, lint, and the browser suite.

On a deployed Worker, with real secrets and no load test against email:

- Home, About, Writing, one article, RSS, résumé PDF, and the terminal shell
- View source on the homepage and one article: one title, one `og:image`, and the static card alt text. This does not check Facebook, X, or LinkedIn preview tools
- Contact with Turnstile, then the message in the destination inbox and Reply set to the visitor
- `chat` with a configured model, and once with the keys absent so the public brief is the reply
- `weather <city> --forecast` showing a daily high and low
- `/work` with an empty public list, and a direct unpublished slug returning 404
- `/lab` and `/play` redirects

## Troubleshooting

| Symptom                                      | What to check                                                                                                                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writing says it is not configured            | `NOTION_API_KEY` and `NOTION_BLOG_DB_ID` on the Worker. `WRITING_SOURCE` should be unset in production                                                                                         |
| Writing stays on the loading notice          | KV binding id, then a request to `/writing` to fill the cache. A Notion failure keeps the last good copy for up to 30 minutes                                                                  |
| A renamed article 404s                       | Add the page id to `src/lib/writing/slug-registry.ts` before the title change, or rely on the title redirect only after the new slug is canonical                                              |
| Contact returns 503                          | Rate-limit binding, Turnstile secret, `CONTACT_EMAIL`, and both address vars                                                                                                                   |
| Contact returns 403                          | Origin, Turnstile hostname, or action. The widget action is `contact`                                                                                                                          |
| Contact returns 502                          | Email Service domain and verified destination. Worker logs contain the provider code                                                                                                           |
| Terminal contact keeps the draft             | The action was not a delivered success. The server message is shown when `deserialize` can read it. Send, edit, and cancel still work. The page form posts the same action                     |
| Terminal contact claims the message sent     | The result type was `success` and the payload `success` flag was true. Confirm the inbox. The automated suite does not prove production delivery                                               |
| Field Journal says it is not configured      | `NOTION_API_KEY` and `NOTION_CARRIER_JOURNAL_DB_ID` on the Worker. `JOURNAL_SOURCE` should be unset in production                                                                              |
| Field Journal says the record is unavailable | Notion status in the Worker logs. `object_not_found` or 403 means the integration cannot read the existing database. Do not create a new one. A failed refresh does not show an older snapshot |
| Weather says it is not configured            | `OPENWEATHER_API_KEY`                                                                                                                                                                          |
| λlambda answers from the brief only          | Both model keys are absent. That is the configured fallback                                                                                                                                    |
| Chat or weather returns 503 in production    | The matching rate-limit binding is missing or threw                                                                                                                                            |
| Client publication check fails               | A client module imported the project registry. Public pages must receive cards from server load                                                                                                |

## Rollback and recovery

`wrangler rollback` restores the previous Worker version of `stepweaver-v6` when that script has an earlier deployment. Source recovery is a normal Git revert of the application commit. Do not rewrite history to roll back.

KV entries expire on their own. Rolling back application code does not delete the namespace. A bad catalog entry ages out within 30 minutes, or sooner if a successful refresh replaces it.

DNS for the public hostname is outside this repository. If the hostname was pointed at this Worker, the rollback of that record is the previous origin. This repo cannot see the live DNS target.

`stepweaver_v5` is a separate repository and is the rollback host only when the public DNS still serves it. Do not delete v5, its databases, or its Notion data as part of operating v6.

## Not verifiable from the repository

Passing `pnpm verify`, `pnpm lint`, and `pnpm test:e2e` is fixture verification. It does not attach production bindings and does not send mail. A production check is a request to the deployed Worker with its real secrets.

- Whether `stepweaver-v6` is the Worker currently serving `stepweaver.dev` or `www.stepweaver.dev`. A public request on 2026-11-25 saw the apex return 307 to www, while the deployed sitemap, RSS, and JSON-LD still used the apex. This branch's copies of those documents use www. That request does not identify the Worker.
- Whether the KV namespace id in `wrangler.jsonc` is bound on the deployed script and has been warmed
- Whether Email Service, Turnstile, Notion, OpenWeather, Groq, and OpenAI secrets are present in production and working
- Live TTFB, the homepage black-screen report, and low-end phone frame time
- A physical mobile keyboard pass
- A fresh `pnpm audit` after this checkout. CI does not run the audit, and the audit does not upgrade packages or prove a production service
- Dependency advisory applicability beyond the versions pinned in `package.json` and `pnpm-lock.yaml`
