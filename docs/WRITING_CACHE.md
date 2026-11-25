# Writing cache patch

Based on main 0423487 (2026-11-24). No dependency changes. No deployment performed.

## What changes

Public writing catalog and sanitized article blocks are stored in WRITING_CACHE (Cloudflare KV).
A bounded memory cache avoids repeated reads within a Worker. Values are fresh for five
minutes, usable for at most 30 minutes from the last successful fetch, and expire in KV.
Stale entries refresh through platform.ctx.waitUntil. Successful empty catalogs replace old
ones. Failed requests never overwrite good entries. Each isolate coalesces refreshes and backs
off failures for 30 seconds. This is not a distributed lock; separate locations can refresh
concurrently. KV is eventually consistent, so edits are not immediately visible everywhere.

The homepage AND shared marketing layout use nonblocking reads: at most 300ms waiting for
KV, never waiting for Notion. A cold homepage renders the profile and a writing loading notice,
then retries its data three times at four-second intervals. A fully empty/expired cache can
therefore briefly show a writing placeholder after inactivity. No JavaScript means that visitor
can follow the Writing link or reload to see the refreshed catalog. Other pages' search lists
may remain empty until their layout data reloads. Chat's optional writing context is nonblocking.

The writing archive and direct article links still wait for a bounded fetch on a true miss so
content can be server-rendered. Each Notion operation has an eight-second budget including body
reads and pagination; KV writes have a two-second budget. Catalog plus article retrieval can
require two operations. A Server-Timing writing metric is added to the homepage response.

Article access always checks catalog membership. Body keys include the last-edited timestamp.
Unpublishing takes effect after catalog refresh, NOT instantly: allow for the five-minute fresh
window and KV propagation; during outages an older publication decision can last up to 30 minutes
plus any existing HTTP cache lifetime. Old body objects expire physically after 30 minutes.
For urgent removal, remove access at the route/edge immediately; cache deletion alone does not
clear all live Worker memory or already downloaded copies. This cache is for public material.

Only data is cached: no contact responses, conversation responses, credentials, or HTML/CSP nonces.
Missing KV still allows a memory-only fallback, but cannot provide cross-instance persistence.

## Install in PowerShell, from the v6 repository

Save the patch in Downloads first. Commit or stash your existing edits before applying it.

```powershell
git status --short
git apply --check "$env:USERPROFILE\Downloads\stepweaver-writing-cache.patch"
git apply "$env:USERPROFILE\Downloads\stepweaver-writing-cache.patch"
pnpm check
pnpm test:unit
pnpm build
```

If the check reports a conflict, stop: do not force the patch or reset your working tree.

## One-time Cloudflare configuration

```powershell
pnpm exec wrangler kv namespace create WRITING_CACHE
```

Copy the real namespace ID from that command. Add a top-level `kv_namespaces` array to
wrangler.jsonc, beside `assets` and `vars` (with the required comma between properties):

```jsonc
"kv_namespaces": [
  { "binding": "WRITING_CACHE", "id": "PASTE_THE_RETURNED_NAMESPACE_ID_HERE" }
],
```

The displayed placeholder must be replaced with the real ID before deployment. Keep the binding
in wrangler.jsonc, not only in the dashboard. The namespace ID is configuration, not an API key.
Use a separate namespace if you operate a separately named staging Worker.

```powershell
pnpm deploy
```

Warm the catalog by visiting `/writing` on the deployed Worker, then open the articles you want
warmed. Visit Home again and confirm the cards appear. No secret or public refresh endpoint is
added. The cache is demand-refreshed, not scheduled. Do not expect pnpm dev (Vite) to persist in
production KV; wrangler dev uses local simulated bindings by default.

## Verify

- Hard reload Home and About in a new browser session. Compare document TTFB with the old build.
- Check the homepage Server-Timing header (`writing;dur=...`). This isolates the writing-loader
  time, not DNS, TLS, every parent loader, or image rendering.
- After five minutes, load Home: existing writing should remain visible during refresh.
- Publish/edit a test post and verify the catalog and body update after refresh/propagation.
- Unpublish it, let the catalog refresh, then confirm its direct URL returns 404.
- In a staging Worker only, simulate Notion failure: cached public content stays available within
  the stale window, the homepage stays usable, and logs contain no token or request payload.
- Confirm chat, contact and weather still work. Do not load-test the live email service.

Automated checks cover cold Workers, stale reads, outages, malformed KV, expired entries,
background completion, timeout/abort, redirect handling, unpublishing, database separation,
and the shared-layout/homepage nonblocking path. Live Cloudflare binding and performance checks
must be completed after installation; local tests cannot establish production latency.
