# λstepweaver SvelteKit Rebuild Plan

## Purpose

Rebuild the existing λstepweaver site in SvelteKit without redesigning the site.

The current production site remains the visual, behavioral, and content reference. The goal is to preserve what already works while rebuilding the application architecture in a cleaner, more modern stack that teaches the current web platform.

This is **not** a React-to-Svelte component translation project.

The guiding question is:

> What is this feature responsible for, and what is the best SvelteKit-native way to build it?

---

# 1. Chosen Stack

## Core Application

- **SvelteKit**
- **Svelte 5**
- **TypeScript**
- **Vite**
- **pnpm**

## Styling

- **Modern native CSS**
- **Svelte scoped `<style>` blocks**
- **CSS custom properties**
- **Native CSS nesting**
- **Container queries**
- **`:has()`**
- **Cascade layers**
- **Logical properties**
- **Fluid typography with `clamp()`**
- **OKLCH and modern color functions**
- **Native web-platform primitives where practical**

### Explicitly not included by default

- No Tailwind CSS
- No Sass
- No CSS-in-JS
- No component framework
- No PostCSS unless a concrete need appears
- No utility framework unless the project later proves it needs one

## Hosting / Platform

- **Cloudflare Workers**
- **Cloudflare adapter for SvelteKit**
- **Wrangler**

## Data / Persistence

Add only when needed:

- **Cloudflare D1**
- **Drizzle ORM**

Do not install database tooling during initial setup.

## Content / External Services

Preserve useful existing services where appropriate:

- **Notion API** for writing/content
- **Cloudflare Turnstile** for bot protection
- Existing AI provider architecture where still appropriate

## Testing

- **Vitest**
- **Playwright**

## Quality

- **ESLint**
- **Prettier**

---

# 2. Architectural Principles

## Preserve the site, rebuild the implementation

The current λstepweaver site already has:

- a clear identity
- a strong visual language
- established content
- useful case studies
- a portfolio/resume narrative
- specialized lab applications
- reusable data models

Do not redesign those things simply because the framework changes.

---

## Do not port React components line-for-line

Bad migration question:

> How do I convert this `.tsx` component into Svelte?

Better questions:

- What responsibility does this component have?
- What data does it consume?
- Is the data static or loaded?
- Does the logic belong on the client or server?
- Is this genuinely reusable?
- Does it need state?
- Does it need JavaScript at all?
- Can native HTML/CSS handle this behavior?

Then build the feature in SvelteKit.

---

## Prefer the web platform

Use browser and CSS capabilities before adding abstractions.

Examples:

- `<dialog>` before a modal library
- Popover API before custom dropdown infrastructure
- CSS container queries before JavaScript resize logic
- CSS transitions before animation libraries
- forms and SvelteKit actions before client-side API plumbing
- custom properties before theme libraries

Libraries should solve actual application problems, not hypothetical future ones.

---

# 3. Project Strategy

Keep the existing production site online during the entire rebuild.

Create a new repository for the SvelteKit version.

Suggested working repository name:

```text
stepweaver-svelte
```

The production site remains:

1. the visual reference
2. the behavior reference
3. the content source
4. the fallback production application

There is no need to rush the SvelteKit version into production.

---

# 4. Initial Environment Setup

Verify the development environment:

```bash
node --version
pnpm --version
git --version
```

Create the project:

```bash
pnpm dlx sv create stepweaver-svelte
cd stepweaver-svelte
pnpm install
pnpm dev
```

Choose approximately:

```text
Minimal SvelteKit project
TypeScript
ESLint
Prettier
Vitest
Playwright
pnpm
```

Open:

```text
http://localhost:5173
```

Before adding anything else, understand the generated project.

Focus on:

```text
src/
├── app.html
├── app.d.ts
├── lib/
└── routes/
    └── +page.svelte
```

Also understand:

```text
+page.svelte
+layout.svelte
+page.ts
+page.server.ts
+server.ts
```

Do not add D1, Drizzle, authentication, UI frameworks, or content APIs yet.

---

# 5. CSS Architecture

The new build should treat CSS as a first-class part of the application.

## Global CSS

Create:

```text
src/
├── app.css
└── lib/
    └── styles/
        ├── reset.css
        ├── tokens.css
        ├── base.css
        ├── typography.css
        ├── themes.css
        └── utilities.css
```

Most feature-specific styling should live inside the Svelte component that owns it.

Example:

```svelte
<script lang="ts">
	let { title, description } = $props<{
		title: string;
		description: string;
	}>();
</script>

<article class="project-card">
	<h2>{title}</h2>
	<p>{description}</p>
</article>

<style>
	.project-card {
		display: grid;
		gap: var(--space-md);
		padding: var(--space-lg);
		border: 1px solid var(--border);
		background: var(--surface);
	}
</style>
```

---

## Design tokens

Use custom properties for the visual system.

Example:

```css
:root {
	--canvas: oklch(12% 0.02 240);
	--panel: oklch(15% 0.025 240);
	--surface: oklch(18% 0.025 240);

	--text: oklch(94% 0.01 240);
	--text-secondary: oklch(76% 0.02 240);
	--text-muted: oklch(62% 0.02 240);

	--accent: oklch(82% 0.18 145);
	--border: color-mix(in oklch, var(--text) 14%, transparent);

	--space-xs: 0.375rem;
	--space-sm: 0.75rem;
	--space-md: 1rem;
	--space-lg: 2rem;
	--space-xl: 4rem;

	--content-width: 72rem;
}
```

Use meaningful design vocabulary rather than recreating utility-class CSS.

Useful λstepweaver primitives may eventually include concepts such as:

```text
instrument-panel
operator-label
readout
data-grid
stack
cluster
content-grid
system-card
telemetry-strip
```

These should emerge from repeated patterns in the actual site.

---

# 6. Fonts

Copy the existing λstepweaver fonts into:

```text
static/fonts/
```

Load them through global CSS.

Example:

```css
@font-face {
	font-family: 'IBM 3270';
	src: url('/fonts/ibm-3270.woff2') format('woff2');
	font-display: swap;
}

@font-face {
	font-family: 'OCR A';
	src: url('/fonts/ocr-a.woff2') format('woff2');
	font-display: swap;
}
```

Do not spend time redesigning typography during this stage.

The objective is to make a blank Svelte page feel like λstepweaver before rebuilding the actual pages.

---

# 7. Root Application Shell

Build the shared application structure first.

Suggested structure:

```text
src/lib/components/layout/
├── Navbar.svelte
├── Footer.svelte
└── AppChrome.svelte
```

Then create:

```text
src/routes/+layout.svelte
```

The first working shell should be simple:

```text
Navbar
Page content
Footer
```

Do not add λlambda, terminal behavior, animations, or complicated visual effects yet.

---

# 8. Canonical Identity Data

Create:

```text
src/lib/data/identity.ts
```

This file should contain the canonical professional identity used across the site.

Examples:

- name
- title
- supporting line
- summary
- major strengths
- working philosophy
- current learning/building statement
- contact links
- shared résumé statements

Pages should consume this data rather than duplicating it.

The goal is to prevent drift between:

```text
Homepage
About
Résumé
PDF résumé
case studies
agents
λlambda
```

---

# 9. Rebuild the Homepage Incrementally

Do not rebuild the entire homepage at once.

## Step 1 — Hero

Build:

```text
src/lib/components/home/Hero.svelte
```

Reproduce only:

- eyebrow/operator label
- primary headline
- supporting text
- primary CTA
- secondary CTA

Do not begin with animation or decorative complexity.

Once the hierarchy matches the production site, add the visual details.

---

## Step 2 — Homepage sections

Rebuild one section at a time.

Recommended order:

```text
01 Hero
02 Featured Systems
03 How I Work
04 Experience
05 Skills
06 Writing Preview
07 Closing CTA
```

Every section should be implemented independently and committed before moving on.

---

# 10. Establish the Project Domain

Before building the Work pages, model project data properly.

Suggested structure:

```text
src/lib/projects/
├── types.ts
├── registry.ts
└── data/
    ├── parcel-sweep.ts
    ├── silent-auction.ts
    ├── lsigil.ts
    ├── lambda-ledger.ts
    ├── shower-booking.ts
    └── portfolio-terminal.ts
```

Prefer TypeScript domain modeling over a giant validation schema for static trusted content.

Example:

```ts
export type ProjectStatus = 'live' | 'demo' | 'archived';

export type ProjectSection =
	| {
			type: 'overview';
			title: string;
			content: string;
	  }
	| {
			type: 'problem';
			title: string;
			content: string;
	  }
	| {
			type: 'features';
			title: string;
			items: Array<{
				label: string;
				description: string;
			}>;
	  }
	| {
			type: 'tech-stack';
			title: string;
			technologies: string[];
	  };

export interface Project {
	slug: string;
	title: string;
	description: string;
	status: ProjectStatus;
	tags: string[];
	sections: ProjectSection[];
	liveUrl?: string;
	repoUrl?: string;
}
```

Use discriminated unions where they improve clarity.

---

# 11. Build `/work`

Create:

```text
src/routes/work/
├── +page.ts
└── +page.svelte
```

Use this stage to learn the core SvelteKit data flow:

```text
+page.ts
    ↓
load()
    ↓
page data
    ↓
+page.svelte
```

Do not fetch local project data through an API route.

Import it directly on the server/client module boundary appropriate to the route.

---

# 12. Build Dynamic Case Studies

Create:

```text
src/routes/work/[slug]/
├── +page.ts
└── +page.svelte
```

Learn:

- route parameters
- typed route data
- `load()`
- `error(404)`
- dynamic routing
- typed rendering

Create a renderer:

```text
src/lib/components/projects/ProjectSectionRenderer.svelte
```

Render each discriminated section type explicitly.

Bring over one case study first.

Recommended first case:

```text
Parcel Sweep
```

Once the architecture works end-to-end, migrate the remaining case studies.

---

# 13. Build About

Create:

```text
src/routes/about/+page.svelte
```

This page should mostly compose:

- canonical identity data
- existing typography
- existing layout primitives
- existing project references

Do not invent a new component system for About.

---

# 14. Build Resume

Create:

```text
src/lib/resume/
├── types.ts
└── data.ts
```

Then:

```text
src/routes/resume/+page.svelte
```

The goal is one canonical résumé data source that can eventually feed:

- web résumé
- PDF résumé
- structured metadata
- agent context
- λlambda context

---

# 15. Build Contact Using SvelteKit Form Actions

Use Contact as the introduction to server-side form handling.

Suggested route:

```text
src/routes/contact/
├── +page.svelte
└── +page.server.ts
```

Learn:

- actions
- request validation
- progressive enhancement
- form state
- server-side errors
- success responses

Prefer SvelteKit form actions over immediately rebuilding the old client-fetch/API-route architecture.

Add Turnstile after the basic form works.

---

# 16. Build Writing

Rebuild:

```text
/writing
/writing/[slug]
```

Use this stage to introduce:

- server-only modules
- environment variables
- Notion API access
- async loading
- caching strategy
- external API failures
- error pages

Keep Notion initially.

Do not migrate content storage simply because the framework changed.

---

# 17. First Cloudflare Deployment

Deploy before rebuilding the complicated Lab applications.

Install:

```bash
pnpm add -D @sveltejs/adapter-cloudflare wrangler
```

Configure the SvelteKit Cloudflare adapter.

At this milestone, the following routes should work:

```text
/
work
work/[slug]
about
resume
contact
writing
writing/[slug]
```

This is the first major release target:

> The professional λstepweaver site runs entirely on SvelteKit and Cloudflare.

Do not wait for the Lab to be complete.

---

# 18. Build the Lab Shell

Create:

```text
src/routes/lab/+page.svelte
```

The Lab is the containment boundary for the experimental and application-like systems.

Migrate features from simplest to most complex.

Recommended order:

```text
01 Dice Roller
02 Mail Sort Academy
03 Meshtastic
04 Terminal
05 λlambda
06 Field Journal
07 Footwear Lab
```

The ordering intentionally progresses from:

```text
local logic
↓
interactive state
↓
external APIs
↓
complex application state
↓
AI/server integrations
↓
private data
↓
database-backed systems
```

---

# 19. Rebuild the Terminal

Treat the terminal as a real Svelte application.

Separate:

```text
command parsing
command definitions
terminal history
terminal state
terminal modes
presentation
```

Suggested structure:

```text
src/lib/terminal/
├── commands/
├── parser.ts
├── types.ts
└── state.svelte.ts
```

UI components:

```text
src/lib/components/terminal/
├── Terminal.svelte
├── TerminalInput.svelte
├── TerminalHistory.svelte
└── TerminalOutput.svelte
```

Use this stage to learn Svelte 5 state deeply.

Do not translate the existing React hooks line-by-line.

---

# 20. Rebuild λlambda

Rebuild the chat system after the terminal.

Suggested route:

```text
src/routes/api/chat/+server.ts
```

Keep provider logic separate from route handlers.

Suggested structure:

```text
src/lib/server/ai/
├── providers/
│   ├── groq.ts
│   └── openai.ts
├── context.ts
├── prompts.ts
└── chat.ts
```

The route handler should primarily:

1. receive the request
2. validate it
3. call application logic
4. return the response

Avoid embedding the entire AI system inside `+server.ts`.

---

# 21. Add D1 and Drizzle

Only add database infrastructure once a migrated feature actually requires persistence.

Install:

```bash
pnpm add drizzle-orm
pnpm add -D drizzle-kit
```

Suggested structure:

```text
src/lib/server/db/
├── index.ts
└── schema.ts

drizzle/
drizzle.config.ts
```

Cloudflare D1 uses SQLite semantics.

Do not mechanically port PostgreSQL-specific schema definitions from the old application.

Treat this as a real database migration.

---

# 22. Field Journal

Migrate Field Journal late.

It combines many concerns:

- private data
- authentication/session boundaries
- telemetry
- derived calculations
- weather
- Notion integration
- footwear data
- database operations
- media
- public/private data separation

By this stage, the required SvelteKit concepts should already be familiar:

```text
+page.svelte
+page.ts
+page.server.ts
+server.ts
hooks.server.ts
$lib/server
cookies
forms
Cloudflare bindings
D1
Drizzle
```

Field Journal should demonstrate mastery of the stack rather than introduce the stack.

---

# 23. Footwear Lab

Migrate Footwear Lab after the Field Journal data foundation exists.

Focus on:

- reusable domain models
- historical records
- relational data
- derived values
- media/storage
- public/private boundaries

Avoid duplicating shared Field Journal logic.

---

# 24. Infrastructure Migration

Only after the application reaches feature parity should infrastructure replacements be finalized.

Potential migrations:

```text
Vercel                → Cloudflare Workers
Vercel KV             → Cloudflare KV or another appropriate primitive
Vercel Blob           → Cloudflare R2
Neon/PostgreSQL       → D1 where appropriate
Next.js API routes    → SvelteKit server routes
Jest                   → Vitest
React-specific tests   → Svelte tests
```

Do not migrate a service merely for architectural purity.

For example:

- Notion may remain Notion
- external APIs may remain external APIs
- AI providers may remain unchanged

Cloudflare should become the deployment platform, not a reason to replace every useful external service.

---

# 25. Native CSS Learning Goals

The rebuild should deliberately use modern CSS features when they genuinely improve the code.

Learn and apply:

## Custom properties

```css
--surface
--text
--accent
--space-md
```

## Native nesting

```css
.card {
	border: 1px solid var(--border);

	&:hover {
		border-color: var(--accent);
	}
}
```

## Fluid values

```css
.hero-title {
	font-size: clamp(3rem, 8vw, 7rem);
}
```

## Container queries

```css
.card-grid {
	container-type: inline-size;
}

@container (width > 42rem) {
	.card {
		grid-template-columns: 1fr 2fr;
	}
}
```

## `:has()`

```css
.project:has([data-status='live']) {
	border-color: var(--accent);
}
```

## Cascade layers

```css
@layer reset, tokens, base, utilities;
```

## Logical properties

Prefer:

```css
padding-inline
padding-block
margin-inline
inset-inline
```

where appropriate.

## Modern color

Use:

```text
oklch()
color-mix()
relative color syntax
light-dark()
```

where useful and sufficiently supported for the production browser target.

---

# 26. Testing Strategy

Do not wait until the end to begin testing.

## Vitest

Use for:

- pure functions
- project registry logic
- parsers
- derived telemetry
- validation
- business logic
- terminal commands
- server utilities

## Playwright

Use for:

- navigation
- contact form behavior
- work/project routes
- writing routes
- terminal interactions
- λlambda flows
- protected/private flows

Focus tests on behaviors that would actually hurt if broken.

---

# 27. Suggested Commit Sequence

Keep commits small and instructional.

## Lesson 1

```text
Create SvelteKit application
Run project
Understand generated files
Configure formatting/linting
```

Commit:

```text
chore: initialize SvelteKit application
```

---

## Lesson 2

```text
Add fonts
Create tokens
Create global CSS foundation
Build root layout
```

Commit:

```text
feat: establish λstepweaver visual foundation
```

---

## Lesson 3

```text
Navbar
Footer
Application shell
```

Commit:

```text
feat: build λstepweaver application shell
```

---

## Lesson 4

```text
identity.ts
Hero
```

Commit:

```text
feat: rebuild homepage hero
```

---

## Lesson 5+

Continue with one meaningful concept or feature per commit.

Avoid commits such as:

```text
migrate entire site
```

---

# 28. Recommended Build Order

Use this as the working checklist.

```text
01  Create SvelteKit project
02  Understand generated project
03  Configure TypeScript, ESLint, Prettier, Vitest, Playwright
04  Add λstepweaver fonts
05  Create CSS reset
06  Create design tokens
07  Create typography system
08  Create theme/global base styles
09  Build root layout
10  Build Navbar
11  Build Footer
12  Create identity.ts
13  Build Hero
14  Finish homepage sections
15  Create project TypeScript domain
16  Build /work
17  Build /work/[slug]
18  Migrate one flagship case study
19  Migrate remaining case studies
20  Build About
21  Build Resume
22  Build Contact
23  Add Turnstile
24  Build Writing
25  Connect Notion
26  Configure Cloudflare adapter
27  Deploy professional site
28  Build Lab shell
29  Rebuild Dice Roller
30  Rebuild Mail Sort Academy
31  Rebuild Meshtastic
32  Rebuild Terminal
33  Rebuild λlambda
34  Add D1
35  Add Drizzle
36  Rebuild Field Journal
37  Rebuild Footwear Lab
38  Migrate remaining APIs/utilities
39  Add production security/rate limiting
40  Complete SEO and structured data
41  Expand Vitest coverage
42  Expand Playwright coverage
43  Audit accessibility
44  Audit performance
45  Final infrastructure migration
46  Production cutover
```

---

# 29. Rules for the Rebuild

## Rule 1

Do not redesign a feature while migrating it unless the existing implementation has a real problem.

## Rule 2

Do not add a dependency until the application demonstrates a need for it.

## Rule 3

Prefer semantic HTML before creating component abstractions.

## Rule 4

Prefer CSS before JavaScript for presentation behavior.

## Rule 5

Prefer SvelteKit-native patterns over recreating Next.js patterns.

## Rule 6

Keep application logic outside route handlers and UI components when practical.

## Rule 7

Keep server-only code inside `$lib/server`.

## Rule 8

Keep shared professional identity and résumé content centralized.

## Rule 9

Do not introduce D1 until persistence is actually required.

## Rule 10

Every phase should teach one or two concepts rather than ten concepts at once.

---

# 30. First Immediate Milestone

Do not think about the entire migration yet.

Start with only this:

```text
Create project
↓
Run it
↓
Understand +page.svelte
↓
Understand +layout.svelte
↓
Add fonts
↓
Create CSS tokens
↓
Create base styles
↓
Commit
```

The first checkpoint is successful when:

- SvelteKit runs locally
- there is no Tailwind
- the λstepweaver fonts load
- the background/text/colors feel like λstepweaver
- the root layout works
- the codebase is clean
- the project is committed to Git

Then build the application shell.

---

# 31. Definition of Success

The rebuild is complete when:

- the current λstepweaver professional site is fully reproduced in SvelteKit
- the visual identity is preserved
- the site uses modern native CSS instead of Tailwind
- shared data is modeled cleanly in TypeScript
- routes use SvelteKit-native data loading and server patterns
- the application runs on Cloudflare
- persistent systems use D1/Drizzle where appropriate
- Notion and other useful external services remain integrated
- the Lab applications are migrated
- tests cover important application behavior
- the old Next.js/Vercel application can be retired
- the new codebase is understandable enough to explain in a technical interview

The end result should feel like the same λstepweaver site on the surface, but underneath it should be a deliberately built modern web application based on:

```text
Svelte 5
SvelteKit
TypeScript
Modern CSS
Cloudflare
D1
Drizzle
Web-platform primitives
```

The site itself becomes the learning project.
