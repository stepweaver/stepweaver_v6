# λstepweaver: Preservation-First SvelteKit Rebuild Blueprint

**Prepared:** 2026-11-08  
**Status:** Proposed delivery plan; no source repositories have been modified.

## Decision

Build the next λstepweaver in the existing `stepweaver/stepweaver_v6` SvelteKit repository. Treat `stepweaver/stepweaver_v5` as the source of truth for live application behavior, user-visible features, visual identity, and existing content. Keep `https://stepweaver.dev` running until full acceptance testing and controlled cutover.

The new site should communicate **who I am, what I do, how I work, and what I'm thinking about**, rather than lead with an ever-expanding project catalog. Identity: **Business Systems Developer & Systems Integration Consultant**. Business analysis, software integration, automation, custom software, and applied AI are capabilities used to solve real business problems. AI-assisted engineering is part of the delivery process, not a claim that generated code needs no verification.

## Sources inspected

- `stepweaver_v5` repo, including route tree (644 tracked tree entries), project data registry and 23 project records, SITE_PLAN, identity, homepage, services, resume/contact architecture, terminal command/runtime modules, shared chat integration, Notion writing adapter, project knowledge assembly, themes, and sitemap.
- `stepweaver_v6` repo, including route tree (89 entries), SvelteKit configuration, Cloudflare config, CSS/tokens, navigation, homepage, services, resume, contact, and project registry.
- Public site surfaces: home, `/work`, `/writing`, `/contact`, `/resume`, `/terminal`, `/lab`. Browser extraction cannot verify interactive behavior. Several external demo URLs could not be fetched with browsing tools; **this does not prove they are broken**.
- Earlier SvelteKit rebuild plan and positioning audit.

## Current-state findings

| Subsystem | v5 | v6 | Action |
|---|---|---|---|
| Brand shell | CRT/HUD styling, color modes, nav effects, command palette | Partial simpler shell | Visual parity before cutover |
| Homepage | Operator card, themed portrait, effects, featured systems, writing strip | Simple hero and featured listing | Keep operator card; replace project-first narrative |
| Projects | 23 records, featured six, archive, detail renderer | Only `stepweaver-dev` in registry | Default unpublish all; retain data privately |
| Writing | Notion Published filter, tags, post detail, homepage preview | No writing route | Rebuild and prioritize |
| Terminal | Commands, history, résumé, chat, Codex, weather, contact, dice, blackjack, Zork | No terminal route | Feature-parity migration |
| λlambda | Shared website/terminal/project API, protected routes, provider fallback | No AI chat | Migrate backend + UX + knowledge governance |
| Contact | Intent routes, Turnstile, server validation, email, rate limit | `preventDefault()` placeholder, no send | Production-ready SvelteKit action |
| Résumé | Canonical identity and resume models, downloadable PDF | Data-driven page and static PDF | Align with new identity and keep PDF current |
| Deployment | Vercel Node runtime, Notion, Vercel KV, Nodemailer | Cloudflare Worker configured | Validate runtime compatibility and migrate selectively |
| Styling | Tailwind + CSS variables and multiple appearance modes | Native CSS layers **plus a temporary Tailwind bridge** | Preserve look; phase out bridge only after parity |

### Important code-level dependency map

**v5 projects:** `lib/data/projects/index.ts`, `lib/data/projects.schema.ts`, `lib/data/projects/*.ts`, `components/home/featured-systems.tsx`, `components/projects/*`, `app/(marketing)/work/*`, `app/sitemap.ts`, `lib/home/recent-intel.ts`, `lib/chat/project-knowledge.ts`, `lib/chat/resolve-case-study.ts`, `lib/structured-data.ts`, `lib/data/resume-data.ts` and terminal navigation. Unpublishing must apply consistently across all public readers.

**v5 terminal:** `components/terminal/terminal.tsx`, `components/terminal/commands/index.ts`, `lib/terminal/resume-content.ts`, `lib/terminal/codex-terminal.ts`, `lib/terminal/blackjack-engine.ts`, `lib/terminal/zork-terminal.ts` and `lib/terminal/zork/*`, `lib/roller.ts`, and `/api/weather`, `/api/contact`, `/api/chat`.

**v5 AI:** `app/api/chat/route.ts`, `components/chat/chat-widget.tsx`, `hooks/use-chat.ts`, `lib/chat/system-prompt.ts`, `lib/chat/project-knowledge.ts`, `lib/chat/request-builder.ts`, `lib/chat/citations.ts`, `lib/chat/openai-responses.ts`, `lib/security/*`, and `lib/validation/chat.schema.ts`.

**v5 writing:** `lib/notion/blog.repo.ts`, `lib/notion/client.ts`, `lib/blog.ts`, `lib/codex/selectors.ts`, `lib/notion-blocks.ts`, `components/codex/*`, `app/(marketing)/writing/*`, `lib/home/recent-intel.ts`. The adapter filters Notion `Status = Published` and uses a 300-second Next.js cache. It derives slugs from the title, so renames can change permalinks. Build a stable authored slug field and legacy redirects before expanding writing.

**v6 foundation:** `src/lib/data/identity.ts`, `src/lib/styles/*`, `src/lib/components/site/*`, `src/lib/components/home/Hero.svelte`, `src/routes/(marketing)/*`, `src/lib/projects/*`, `vite.config.ts`, `wrangler.jsonc`. `src/app.css` currently imports Tailwind and offers a temporary token bridge; do not confuse that with the earlier no-Tailwind target.

## Publication model: remove projects from public view without destroying work

Introduce two **independent** dimensions:

1. **Publication:** `draft | public | retired` (or an equivalent explicit type). Set **all 23 existing project records to `draft` initially**. Only deliberate approval can promote a project to `public`.
2. **Reality/status:** `active | demo | historical | experimental | needs-verification` (calibrated individually). Never use `live` merely because a case-study route exists.

`getPublicProjects()` must be the only collection used for public project lists, site search, homepage, sitemap, structured metadata, and λlambda's public knowledge. Direct `/work/[slug]` requests for unpublished projects should not expose a public case study; use a consistent unavailable response and manage old inbound links intentionally. Existing content/files/repositories remain intact. Keep `/work` as a tasteful empty/curation page until projects are approved; it should not imply broken products.

Before republishing any item, run a documented review: live URL reachable; core user flow working; screenshots accurate; code/repo link valid; deployment maintenance owner known; no secrets or sensitive data; truthful status and outcomes; relevance to proposed consulting services. A retired real project may become a **historical case study** without a demo button.

**Initial candidate queue, not an approved public shortlist:** Silent Auction Platform (real workflow), λledger (cash-flow product), Parcel Sweep (field-ops logic), λsigil (qualification), Shower Booking (small operational tool), I AM [RESIST] (editorial systems), and Terminal/λlambda (signature interface). Do not republish these merely because they are in the queue.

## New website information architecture

| Route | Public role |
|---|---|
| `/` | Who I am; what I do; concise proof of approach; latest writing; contact |
| `/services` | “What I Do”: systems discovery, automation/integration, custom software, applied AI |
| `/about` | Professional narrative, career timeline, how I solve problems, principles |
| `/writing` | Primary ongoing publishing home; editorial index, category/tag filters, recent entries |
| `/writing/[slug]` | Stable permalink, metadata, rich Notion blocks, shareable article |
| `/resume` | Full professional history, accessible PDF, optional hiring contact path |
| `/contact` | Client inquiry first, hiring/general still possible; reliable form |
| `/terminal` | Signature terminal, fully functional and accessible from quiet persistent affordance |
| `/lab` | Field Journal, utilities, experiments, demos; preserved but no longer dominating home |
| `/work` | Hidden/curation landing until selective approvals; eventually approved case studies only |
| `/work/[slug]` | Public only for individually approved case studies |

Preserve historic routes, adding redirects only where appropriate; avoid casual URL churn. Keep legal/privacy pages and active utility routes even when not in the primary navigation. Keep Lab and terminal from becoming unintended public portals to unpublished projects.

### Homepage editorial structure

1. **Hero:** “Business Systems Developer & Systems Integration Consultant” with plain-language description and the original portrait/operator-card geometry. Primary CTA: “Let's talk about your system” or equivalent, secondary: Writing/About. Terminal as a distinctive invitation, not a competing hero.
2. **What I Do:** business analysis and systems discovery; APIs and integration; automation; custom applications; applied AI.
3. **How I Work:** understand the workflow → design practical architecture → build/integrate → validate/maintain. Explain human ownership of agent-generated code without hype.
4. **My Background:** concise evidence from business analysis, operations, and shipped software. Professional chronology remains accurate; no invented outcomes.
5. **Latest Writing:** three to five recent published posts, fetched robustly with graceful fallback.
6. **Contact:** direct project conversation invitation. Quiet résumé/Lab/terminal paths remain available.

Remove the homepage featured-project section at first. Reintroduce only if a specific case study has been reviewed and adds meaningful proof.

## Visual and interaction parity lock

Before rewriting a visual component, capture baseline screenshots of the production site at desktop, tablet, and mobile sizes and in each supported theme. Preserve:

- IBM 3270 and OCR A typography and spacing character;
- dark green/blue terminal palette, relevant light appearance, and lab novelty appearances;
- λ branding, operator profile card, HMFIC-01 display, border ticks, status elements, HUD panels;
- portrait/image layer and theme-dependent glitch/Matrix Sync behavior;
- background circuit/scanline effects where present, navigation transitions, global command palette;
- terminal keyboard behavior, scroll/history, mobile keyboard handling, visible focus;
- chat widget minimization/fullscreen/resizing and responsive viewport handling.

No generic SaaS template redesign, no rounded-card drift, no unnecessary animation redesign. Honor reduced-motion preferences. Similar appearance means pixel/interaction review, not simply importing a color palette.

## AI knowledge and safety requirements

- Maintain the shared public `λlambda` persona and clear statement that it is an assistant, not Stephen personally.
- Preserve website widget and terminal `chat` using one server-side orchestration layer.
- Use canonical public profile, current résumé, newly reviewed case studies, and approved writing; exclude unpublished projects from public retrieval and citations.
- Review stale old position/learning-lab descriptions in `system-prompt.ts` and project appendix; regenerate knowledge after publication changes.
- Keep input validation, secret management, origin controls, abuse limits, prompt-injection protections, no-store responses, provider error handling, and fallback.
- Use Cloudflare-compatible persistence for limits and a Workers-compatible outbound mail delivery approach; do not blindly port Nodemailer SMTP or Vercel KV assumptions.
- Test provider error/timeout/fallback and guard against disclosure of unpublished case-study details.

## Writing-first publishing requirements

Retain Notion for the initial version; there is no value in migrating the CMS as part of the framework rewrite. Design a durable editorial schema with **Status**, **Title**, **Stable Slug**, **Excerpt**, **Published Date**, **Tags**, optional **Series/Category**, optional **Featured**, and **Cover Image**. Existing published articles must retain their URLs via stored slugs and redirects. Prevent draft leakage and duplicate slugs. Render images/blocks safely and cache appropriately. Keep on-site writing distinct from I AM [RESIST] editorial content unless intentionally cross-linked.

Improve the reading experience: readable width, clear headline/excerpt/date, appropriate typography, tag/filter navigation, article share metadata, related posts, and a first-party RSS/Atom feed. Note that v5 `/api/rss` is a **Syntax.fm feed proxy**, not an existing first-party blog feed. Use an explicit new feed route.

## Delivery sequence and acceptance gates

### Milestone 0: Baseline and content inventory

- Work on a feature branch of `stepweaver_v6`. Record source SHAs for v5 and v6.
- Create parity inventory: URLs, interactive flows, screenshots by theme/breakpoint, APIs, data stores, secrets names (never values), external dependencies.
- Create a 23-project review sheet with exposure default off and health unverified.
- Capture production snapshots and establish Playwright smoke scenarios; record v5 behavior rather than guess.
- Write `docs/PARITY_MATRIX.md`, `docs/PROJECT_REVIEW.md`, `docs/MIGRATION.md` and new `SITE_PLAN.md`.

**Gate:** Nothing destructive; owner can see what will and will not migrate.

### Milestone 1: Brand, new narrative, and public shell

- Consolidate v6 canonical identity, navigation, route hierarchy, homepage, About, What I Do/Services.
- Hide all public project cards/archives and remove public knowledge references; keep underlying project records intact.
- Rebuild the genuine v5 visual shell and operator card, including theme switching/animation affordances.
- Preserve intentional links to Terminal and Lab but do not publicly expose missing routes as working.

**Gate:** Site looks like λstepweaver, says what the user now does, and no retired project is accidentally exposed.

### Milestone 2: Writing, résumé, contact

- Port Notion published-post ingestion and rich article rendering. Add stable slug architecture, redirect map, SEO/RSS, failure and cache states.
- Complete v6 contact server action with real delivery, spam verification and rate limits; retain consult/hire/general intent and accessible success/error states.
- Align résumé HTML and PDF with canonical identity. No invented clients, outcomes, or seniority.

**Gate:** Publish a Notion post, see it on home and `/writing`, open a stable article, send a test contact message, download current résumé PDF.

### Milestone 3: Terminal and λlambda parity

- Port headless terminal domain logic before presentation: parser, modes, history, navigation, résumé, Codex, weather, dice, blackjack, Zork and contact wizard.
- Integrate client terminal with one shared chat backend. Preserve full website chat UX, project-context behavior only for approved public case studies.
- Port security controls and integration tests; verify Cloudflare Worker compatibility under staging credentials.

**Gate:** Automated scripted interactive tests pass on desktop/mobile; chat works on both surfaces, errors fail gracefully, and unpublished project knowledge does not leak.

### Milestone 4: Lab preservation, deployment, and cutover

- Maintain legacy apps at current URLs or add controlled redirects/proxy links rather than hastily reimplementing everything. Migrate complex Field Journal/private routes only after privacy/session/data flows are audited.
- Verify sitemap, internal links, metadata, structured data, indexability, analytics, performance, accessibility, secrets and production bindings.
- Deploy to Cloudflare staging, run comparison tests, confirm domain/DNS cutover plan and rollback to v5.
- Obtain explicit approval before changing production DNS or deployment.

**Gate:** Critical acceptance flows tested on the actual Cloudflare runtime, rollback documented, and no silent feature loss.

## Quality standard

For every milestone, run configured `pnpm check`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, and `pnpm test:e2e`, reporting failures precisely. Some tests will need to be created. Add test evidence for project visibility, Notion publication, contact submit, terminal flows, AI policies and visuals. Avoid screenshot snapshot overfitting; review meaningful changes manually. Never claim functional parity from static code inspection alone.

## Cursor assignment #1 (paste into Cursor)

```text
You are the lead implementation agent for λstepweaver's preservation-first SvelteKit rebuild.

REPOSITORIES:
- Target, writable: stepweaver/stepweaver_v6
- Behavior/content/design reference, read-only: stepweaver/stepweaver_v5
- Live reference: https://stepweaver.dev

OBJECTIVE:
Make the site primarily say "this is who I am and what I do," with writing as a central publishing surface. Professional identity is "Business Systems Developer & Systems Integration Consultant." Preserve v5's terminal-forward visual identity and all valuable functionality. Remove the sprawling project catalog from public exposure; do NOT delete its data or source code. Reintroduce projects only after deliberate approval and verification.

NON-NEGOTIABLE:
1. Preserve visual fidelity (theme system, IBM 3270/OCR A, HUD/operator card, portrait, effects, navigation experience), not just colors.
2. Preserve/restore functional parity for terminal commands, shared λlambda AI chat, résumé/PDF, and contact form before any production cutover.
3. Prioritize Notion-backed writing and stable public post URLs. Keep Notion as CMS for now.
4. All project records begin unpublished. Ensure visibility is enforced across home, /work, /work/[slug], related-post links, terminal, AI knowledge, sitemap, structured data and any public API. Never treat "status: live" as publication permission.
5. Keep v5 production running. No production deploy, database mutation, or DNS change without explicit approval.
6. Do not mechanically translate React line-by-line. Preserve observable behavior and use SvelteKit-native architecture.
7. Do not invent metrics, testimonials, client work, deployments, or verified project availability.
8. Respect repo naming exactly: λstepweaver.

FIRST PASS:
A. Read full route trees and critical code paths in both repos, including v5 SITE_PLAN.md, identity, project registry, visual/theme components, terminal, chat, Notion/blog, contact and security.
B. Create a feature branch in v6. Record the analyzed commit SHAs. Do not modify v5.
C. Capture baseline screenshots of the v5 site (desktop, tablet, mobile; relevant themes) and write docs/PARITY_MATRIX.md. If browser access is unavailable, mark screenshots as pending, do not fabricate them.
D. Create docs/PROJECT_REVIEW.md for all 23 v5 registry entries, with status, demo/repo URL, verification state UNKNOWN until tested, and public visibility OFF by default.
E. Rewrite SITE_PLAN.md for positioning, navigation, homepage information architecture, writing, and preservation-first migration. Write docs/MIGRATION.md for milestone dependencies and risk/rollback.
F. Implement only Milestone 1: canonical identity, primary nav, home, About and Services/What I Do, new project-publication gating, and as much visual shell parity as can be demonstrated. Do not invent placeholder backends for contact, terminal or chat; clearly record missing features.
G. Run checks/lint/build/tests. State exactly what was run and which behaviors remain unverified. Provide files changed, screenshots, parity gaps and recommended next prompt.

Homepage sections: preserved operator/HUD hero with revised identity, What I Do, How I Work, Background, Recent Writing preview or clearly tracked placeholder until Notion integration, conversation CTA, quiet terminal/lab link. No featured-project carousel until projects are reviewed and selected.

The v6 repo currently has a temporary Tailwind bridge alongside native CSS. Do not perform an unrelated styling purge during parity work. Protect the actual appearance first, consolidate later.

STOP RULE: if a critical detail is uncertain, document the assumption and use the least destructive implementation. Never remove v5 production capabilities on the theory that they can be rebuilt later. Do not claim a feature works without exercising its user path.
```

## Decisions intentionally left to the owner

- Exact homepage headline and tone after reviewing a styled preview.
- Whether `/work` remains a quiet curation landing page or is omitted from primary navigation entirely until first approval (recommended: omit from nav initially, keep route functional).
- Which projects, if any, receive `public` status first after link/function tests.
- Whether writing categories are visible to readers immediately or introduced after article volume grows.
- Whether legacy Field Journal and specialist utilities remain separately hosted during SvelteKit cutover (recommended initially to minimize risk).

**Next action:** In Cursor, open `stepweaver_v6` and run Cursor assignment #1. Review the parity matrix and new homepage before beginning the backend feature migrations.
