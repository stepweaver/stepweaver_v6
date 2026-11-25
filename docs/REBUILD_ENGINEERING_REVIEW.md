# λstepweaver engineering review — 2026-11-24

Reviewed main 0423487 plus the accompanying cache and publication-boundary patches.
This is a source/build review, not a production penetration test or a certification of safety.
No production changes, email sends, DNS changes, or load tests were performed.

The design has useful safeguards, but the release process and several failure paths need work.
A rewrite is not justified by these findings. Fix the confirmed boundaries and make regression
checks enforce them. Passing feature tests alone did not catch the draft registry in browser code.

## Highest-priority findings

| Priority  | Finding and evidence                                                                                                                                                                                              | Impact                                                                                                                                                                      | Status / next action                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1        | `src/lib/seo/site.ts` imported the project publication registry; Writing Svelte components imported SITE_ORIGIN from that module. A production client chunk contained registry filenames, descriptions and links. | Draft records were downloadable despite the UI allow-list. This is a publication-boundary failure, not evidence of leaked API credentials.                                  | Fixed by patch 2: isolated public URL constant, `.server.ts` SEO module, production bundle check wired into build.                                                                               |
| P1        | Shared marketing `+layout.server.ts` awaited the writing catalog for search; Home also awaited it. Original catalog cache was only a process Map and expired entries refreshed synchronously.                     | Optional Notion content delayed unrelated pages. The source confirms the dependency; exact contribution to the observed black screen still needs live timing.               | Fixed by patch 1: persistent KV, nonblocking layout/Home/chat context, background refresh, bounded upstream operations.                                                                          |
| P1 triage | Full `pnpm audit --json` reported 50 findings: 17 high, 25 moderate, 8 low; no critical. Framework, serializer and tooling packages appear.                                                                       | Known affected versions need applicability review. These are not 50 demonstrated production exploits.                                                                       | Controlled dependency update and regression run next. See bundled advisory inventory. Do not use a forced major upgrade blindly.                                                                 |
| P2        | Contact and terminal Turnstile integrations retain a token but do not reset after a send attempt or handle expired/error callbacks. Contact mounts another script on each mount without cleanup.                  | A token consumed by Siteverify cannot be reused; retries after mail failure, subsequent submissions, or long form sessions can fail.                                        | Extract one shared widget loader; track widget ID, reset after each attempted validation, clear expired tokens, remove widget on unmount. Test retry, expiry and route navigation.               |
| P2        | `contact/turnstile.ts` checks only `success`; no expected hostname/action check.                                                                                                                                  | Token purpose and deployment are not verified by app code. This is a defense-in-depth gap; an actual bypass was not demonstrated.                                           | Pass an expected hostname and set/check a `contact` action; keep preview/local test configuration explicit.                                                                                      |
| P2        | `public-api.ts` limits by IP, but no app-wide model request/token budget is visible.                                                                                                                              | Distributed requests can consume a shared provider quota. An Origin header does not authenticate a direct HTTP client.                                                      | Keep per-IP controls, add provider budget limits/alerts and a circuit breaker; add challenge escalation if abuse warrants it. Cloudflare rate-limit bindings are approximate and location-local. |
| P2        | No tracked `.github/workflows` checks were found. Existing browser tests run fixture/Vite mode.                                                                                                                   | Build, type checks and tests may not gate deployment, and tests do not exercise real Worker bindings. External Cloudflare build rules/branch protection were not inspected. | Add mandatory CI and staging Worker smoke checks, then require them before deployment.                                                                                                           |

## Dependency triage details

All 302 audited dependencies are classified under devDependencies in this project. Therefore
`pnpm audit --prod` checked zero dependencies and is NOT a meaningful clean bill of health.
SvelteKit and adapter code participate in building the deployed application despite this label.

Examples returned by the full audit:

- `@sveltejs/kit` 2.70.2: several advisories; some patched in 2.70.4, others list 3.x fixes.
- `@sveltejs/adapter-cloudflare` 7.2.9: prerendered-redirect injection advisory lists 7.2.10 as fixed.
- `devalue` 5.9.0: several serialization/deserialization advisories, with fixes through 5.9.3.
- Tooling also flags undici, sharp, Vitest/Vite, source-map and glob/parser dependencies.

Applicability matters: GHSA-3r8g-jcqq-3p5j explicitly requires experimental remote functions.
No remote-functions source files or enabled experimental flag were found here. Likewise,
an adapter-node-specific advisory is not automatically reachable in a Cloudflare deployment.
Do not ignore the whole audit because some entries are inapplicable. Prioritize deployed
framework/serialization paths, update compatible patch versions, then plan any major migration.

Primary sources:

- https://github.com/advisories/GHSA-3r8g-jcqq-3p5j
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

## Performance and correctness findings

1. **Hidden image download:** OperatorCard includes `pixarMe_terminator.png` unconditionally,
   hiding it with opacity. The file is 1,776,732 bytes. A browser still fetches an invisible image.
   Resize/compress it and mount it on demand for the Skynet theme. This can compete for bandwidth;
   it is not proof that this image causes the pre-HTML delay.
2. **Weather:** geocoding, current conditions and forecast are sequential, each with a five-second
   timeout; a full path can approach 15 seconds. No shared weather cache exists. Fetch current and
   forecast concurrently after coordinates are known, cache bounded normalized queries/coordinates,
   and retain partial-success behavior.
3. **Forecast semantics:** `firstLocalDays` selects the first sample each day and displays that
   sample's min/max, rather than daily aggregated highs/lows. This explains the repeated overnight
   timestamps. Aggregate local calendar days or explicitly label the output as time samples.
4. **Client deadlines:** chat and terminal fetches lack client timeouts/cancellation. A broken network
   can leave the widget or terminal waiting even though server providers have deadlines. Add bounded
   client requests and preserve drafts on interruption; abort on unmount where appropriate.
5. **Body-read deadline:** bounded-body enforces byte limits but not a read deadline. Contact parses
   the body before rate limiting; chat limits first. Move contact throttling earlier and cap body-read
   time. Infrastructure protection may mitigate slow uploads, but was not inspected.
6. **Notion completeness:** pagination stops after 20 pages without explicitly rejecting an incomplete
   result, and missing `results` becomes an empty list. A malformed success/oversized catalog could
   replace a good cache with partial/empty data. Validate response structure and fail a capped query
   when `has_more` remains true. An actual valid empty Published catalog must remain supported.
7. **Rendering:** fonts already use font-display: swap. The tiny external theme initializer deliberately
   blocks parsing to avoid a theme flash; measure before changing it. Canvas animation runs continuously
   on visible pages; profile low-end phones and consider a lower frame rate/adaptive motion budget.
8. **Canonical origin:** code still sets SITE_ORIGIN to the bare domain, despite the requested www
   canonical direction. Confirm the current redirect/canonical policy and align metadata, sitemap and
   RSS in one change. The patch preserves existing URLs rather than guessing live routing.
9. **Terminal contact response:** it reads SvelteKit action `data` as an object, rather than using
   `$app/forms` deserialize. Validate against actual serialized action responses; this can lose the
   specific success/error message. The normal form uses enhance and is not the same path.

## Safeguards already present

- Credentials are read in server modules; no credential environment variable names were found in
  the inspected built client JS. This is not a full secret-history scan or proof no secret was ever committed.
- Contact, chat and weather fail closed in production when their rate-limit bindings are absent.
- Chat/contact body byte limits, origin checks, field lengths and contact header cleanup exist.
- Notion hyperlinks restrict protocols; rich text and model output use escaped Svelte text rendering.
- Email HTML escapes input; model brief uses public fields and has no secret-bearing tools.
- CSP, framing restrictions, nosniff, referrer policy and HSTS are present in source.
- Weather/model/Turnstile calls already have deadlines and manual redirect handling.
- Public project allow-lists exist. Their intent was good; the browser import boundary was incomplete.

## What the patches do not guarantee

KV is eventually consistent. Local refresh coalescing is not a global lock. Content can remain stale
for five minutes plus propagation, or up to the 30-minute limit during outage. After 30 minutes with
no successful refresh, the homepage can show a temporary writing placeholder while the cache warms.
There is no scheduled warmer or instant emergency takedown mechanism. The direct archive/article path
still waits on bounded cold fetches. See WRITING_CACHE.md for setup and verification.

## Validation and release order

Completed locally: 113 unit tests, type checks (zero errors; two existing dice CSS warnings),
production build, targeted lint on new cache and boundary code. The client-publication check
reproduced the old leak and passes after patch 2 across 37 client files.

Existing chat endpoint lint reports no-control-regex for its intentional control-character filter;
this pre-existing lint issue was not silently changed. A full clean lint gate needs that resolved.
Browser suite attempted: browser-launch cases could not run because Chromium is absent; the installer
was denied by the environment's download access. The HTTP-only case passed. Live Worker KV,
Turnstile, email and actual first-load timings remain unverified by these local checks.

Recommended order:

1. Apply both included patches and configure KV; review/deploy with a rollback commit.
2. Test deployed Home/About/Writing, warm the cache, and verify client registry markers are absent.
3. Triage dependency advisories and upgrade with regression checks before adding new features.
4. Fix Turnstile token lifecycle and hostname/action verification together.
5. Add CI, Worker integration tests and latency/error monitoring.
6. Optimize image/weather work and correct forecast output; then revisit animation polish.
