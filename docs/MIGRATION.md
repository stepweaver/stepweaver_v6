# Migration

Preservation-first move from the Next.js production site (`stepweaver_v5`) to this SvelteKit app. Production stays on Vercel at `https://stepweaver.dev` until an explicit cutover approval.

## Reconciled ancestry

`feat/m1-identity-shell` (`b4dba123e56276fefcc6066901ca3716a1be45e4`) and `origin/main` (`9171a78d5442ba72921266686ed7d3d390a225ff`) have no common ancestor. Milestone 1 was built on a separately initialized SvelteKit starter (`278e80a`). This branch, `feat/m1-reconciled`, starts at `origin/main` and ports the approved Milestone 1 work onto that history. `main` and `feat/m1-identity-shell` were not rewritten.

Kept from `origin/main`: the marketing route group, Tailwind token bridge, typed case-study model (`src/lib/projects/types.ts`, `registry.ts`, `data/stepweaver-dev.ts`), résumé data and `static/weaver_resume.pdf`, contact form fields, play and privacy pages, navbar/footer responsive patterns, and the existing design tokens. The GitHub profile on this tree is `https://github.com/stepweaver`.

Ported from Milestone 1: consulting-first identity, five-link navigation, HMFIC-01 operator card, v5 theme palettes mapped onto the existing color tokens, about/services/home copy, the 23-record registry, an empty `APPROVED_PUBLIC_SLUGS` gate, sitemap and structured data that omit project slugs, status pages for writing/terminal/lab, and the docs and v5 screenshots. Unpublished flagship and résumé project links were moved to `src/lib/server/unpublished-references.ts` so public pages do not render them. The case-study body for `stepweaver-dev` still exists and stays unpublished.

## Source commits

| Repo                     | SHA                                        | Note                                                                                                                                                                                |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stepweaver_v5`          | `a8db9d46bb0579dca23937a455c4147c3b319366` | Read-only. `main`, 2026-10-19. Not modified.                                                                                                                                        |
| `stepweaver_v6` baseline | `278e80a222b8581deb7f7c16805bd2dcdebd1469` | Local only. The folder had no `.git` before this pass. The baseline commit also contains `docs/parity/v5/home-desktop-dark-full.png` because that capture landed before the commit. |

Feature branch: `feat/m1-identity-shell`.

## Assumption that changed the plan

`REBUILD_PLAN.md` describes a v6 tree that already had identity modules, marketing routes, a project registry, and a temporary Tailwind bridge. The folder on disk was a SvelteKit + Cloudflare starter: `src/routes/+page.svelte`, no Tailwind, no `src/app.css`. Milestone 1 was built on that starter. Theme CSS was copied from v5. Tailwind was not added and not removed.

## Milestone dependencies

```text
M0 inventory ──► M1 identity and shell ──► M2 writing, résumé PDF, contact
                                      └──► M3 terminal and λlambda
                                                └──► M4 lab preservation, staging, cutover
```

Milestone 2 and Milestone 3 can be prepared in parallel after Milestone 1, but cutover waits for both. Lab utilities in Milestone 4 should keep their production URLs until their privacy and data flows are audited. Do not block the public site on Field Journal.

| Milestone                  | Depends on                                                                     | Rollback                                    |
| -------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| 0 Inventory                | v5 SHA above                                                                   | Delete docs. v5 untouched.                  |
| 1 Shell                    | Inventory                                                                      | Stay on this branch. Do not deploy.         |
| 2 Writing, contact, résumé | Notion schema decision, mail provider that runs on Workers, current PDF source | Keep v5 form and Notion pages live.         |
| 3 Terminal and λlambda     | Unpublished-project filter from M1, Workers-compatible rate limits             | Keep v5 `/terminal` and `/api/chat`.        |
| 4 Cutover                  | Staging on Cloudflare, acceptance against v5                                   | DNS stays pointed at v5. Revert the record. |

## Milestone 1 status

Done in this branch, with the gaps below.

- Canonical identity, primary nav, home, About, What I Do
- Project gate: 23 records, all `draft`, sitemap and structured data exclude them
- Visual shell: fonts, copied theme tokens, operator card, light/dark and novelty theme control
- Missing on purpose: contact send, terminal, chat, Notion, new PDF

## Risks

| Risk                                            | Why it matters                                                                                                                               | Current guard                                                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A `live` registry status gets treated as public | Old data says live for routes that merely exist                                                                                              | Publication is a separate allow-list, empty                                                                                                              |
| Case-study prose leaks through a slug URL       | Old URLs are indexed on the production domain                                                                                                | Unpublished and unknown slugs share one 404 and render no record                                                                                         |
| Placeholder routes look like working tools      | Terminal and chat are signature features                                                                                                     | Status pages say they are not rebuilt and link to production                                                                                             |
| Stale PDF presented as the new title            | Title changed; PDF did not                                                                                                                   | Resume page says the production file is not regenerated                                                                                                  |
| Cutover before parity                           | Contact, writing, terminal, and chat would disappear                                                                                         | No deploy, no DNS, no database change in this pass                                                                                                       |
| Theme CSS drift                                 | `themes.css` is a copy                                                                                                                       | Provenance comment names the v5 SHA. Re-copy rather than improvising palettes                                                                            |
| Workers runtime mismatch                        | v5 uses Nodemailer and Vercel KV                                                                                                             | Do not port those clients blindly in Milestone 2 or 3                                                                                                    |
| `wrangler types --check` after a build          | With `.svelte-kit/cloudflare` present, generated types add a `mainModule` import. A failed check then crashes wrangler on this Windows build | Keep the types file generated with that folder absent. Do not format `worker-configuration.d.ts`. Delete the folder and regenerate before the next check |

## Rollback

This app is not deployed. Rollback of Milestone 1 is discarding `feat/m1-identity-shell` or not merging it. v5 production is the rollback target for the public site and was not changed.

Before any later deploy:

- Confirm the Cloudflare worker name `stepweaver-v6` in `wrangler.jsonc` is not attached to `stepweaver.dev`
- Keep a written DNS rollback to the current Vercel project
- Re-check `getPublicProjects()` is still empty unless `docs/PROJECT_REVIEW.md` says otherwise

## Not migrated

Terminal command runtime, λlambda, contact mail, Turnstile, Notion blog, RSS proxy, Field Journal and footwear APIs, chat widget, command execution, canvas circuit, matrix-sync phases, page transitions, analytics, PWA manifest, and the production privacy copy.
