# λstepweaver

Personal site for Stephen Weaver: identity, résumé, writing, contact, and the signature terminal. The public site is a SvelteKit application deployed as a Cloudflare Worker.

The product centers on the person, the résumé, and the terminal. Case studies stay unpublished until each one is reviewed and explicitly approved. Lab and Play are retired public destinations. Legacy applications and their data remain in `stepweaver_v5`.

## Current scope

- Home, with the operator card, Matrix Link, and signature background
- About, What I Do (`/services`), résumé, privacy, and contact
- Notion-backed writing, article pages, and `/writing/rss.xml`
- Interactive terminal: résumé, navigation, Codex, dice, weather, contact, λlambda, blackjack, and the text adventure
- Standalone dice roller at `/dice-roller`
- Shared λlambda chat on the site and in the terminal
- Quiet `/work` index. Public case studies require an allow-list entry

`/lab` redirects to `/terminal`. `/play` redirects to `/dice-roller`.

Canonical links, the sitemap, RSS, and structured data use `https://www.stepweaver.dev`. The app does not take that origin from the request host. Sharing cards use the static file `/images/lambda-share.jpg`.

## Stack

- SvelteKit and Svelte 5, TypeScript, Vite
- Native CSS (custom properties, cascade layers, theme palettes)
- Cloudflare Workers via `@sveltejs/adapter-cloudflare` and Wrangler
- Cloudflare KV for the public writing cache
- Cloudflare Email Service and Turnstile for contact
- Notion for published writing
- OpenWeather for terminal weather
- Groq, with OpenAI as fallback, for λlambda
- Vitest and Playwright

## Prerequisites

- Node.js 22
- pnpm 10
- A Cloudflare account before a real Worker deploy

## Installation

```sh
pnpm install
cp .env.example .env
```

Leave secret values blank for a local UI pass. Writing then reports that it is not configured, weather says it is not configured, and λlambda answers from the public site brief. Contact mail needs the variables described in [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Local development

```sh
pnpm dev
```

The Vite server reads `.env`. `pnpm preview` builds the Worker and starts `wrangler dev`, which reads `.dev.vars` for secrets. Copy `.dev.vars.example` to `.dev.vars` before using that path.

## Scripts

| Script                                        | Command           |
| --------------------------------------------- | ----------------- |
| Dev server                                    | `pnpm dev`        |
| Type check                                    | `pnpm check`      |
| Lint                                          | `pnpm lint`       |
| Format                                        | `pnpm format`     |
| Unit tests                                    | `pnpm test:unit`  |
| Browser tests                                 | `pnpm test:e2e`   |
| Unit and browser tests                        | `pnpm test`       |
| Production build and client publication check | `pnpm build`      |
| Check, unit tests, and build                  | `pnpm verify`     |
| Preview the Worker locally                    | `pnpm preview`    |
| Deploy                                        | `pnpm deploy`     |
| Regenerate Worker types                       | `pnpm cf-typegen` |

`pnpm build` runs `vite build` and then `node scripts/check-client-publication.mjs`. That check fails if project-registry filenames appear in the client bundle.

## Environment

Variable names and purposes are in `.env.example` and [docs/OPERATIONS.md](docs/OPERATIONS.md). Production secrets belong in Wrangler secrets. Do not commit `.env` or `.dev.vars`.

## Testing and verification

```sh
pnpm verify
pnpm lint
pnpm test:e2e
```

CI runs `pnpm verify` on every push and pull request. Playwright is local. It uses fixture writing, a mock mail adapter, Turnstile test keys, and no weather or model keys. A physical phone and the production Worker are outside that suite.

## Deployment

`pnpm deploy` builds the app and runs `wrangler deploy` for the Worker named `stepweaver-v6`. Bindings, cache behavior, smoke checks, and rollback are in [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — routes, data, publication rules, and service boundaries
- [Operations](docs/OPERATIONS.md) — configuration, deployment, and troubleshooting
