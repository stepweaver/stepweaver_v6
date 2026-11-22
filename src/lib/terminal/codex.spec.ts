import { describe, expect, it } from 'vitest';
import { FIXTURE_DRAFT_TITLE, fixtureEntries } from '$lib/writing/fixtures';
import { runCodexCommand, type CodexPost } from './codex';

function libraryPosts(): CodexPost[] {
	return fixtureEntries().map((post) => ({
		title: post.title,
		slug: post.slug,
		date: post.date,
		updated: post.updated,
		excerpt: post.excerpt,
		tags: post.tags
	}));
}

describe('codex browsing', () => {
	it('lists published writing and hides drafts', () => {
		const posts = libraryPosts();
		expect(posts.map((post) => post.title)).not.toContain(FIXTURE_DRAFT_TITLE);
		const listed = runCodexCommand('ls', { status: 'ok', posts });
		const text = listed.lines.map((line) => line.content).join('\n');
		expect(text).toContain('Workflow handoffs');
		expect(text).not.toContain(FIXTURE_DRAFT_TITLE);
	});

	it('filters by tag and opens a post by number or slug', () => {
		const posts = libraryPosts();
		const filtered = runCodexCommand('grep systems', { status: 'ok', posts });
		expect(filtered.lines.some((line) => line.href === '/writing/workflow-handoffs')).toBe(true);
		expect(filtered.lines.map((line) => line.content).join('\n')).not.toContain(
			'Automation and review'
		);

		const opened = runCodexCommand('cat 1', { status: 'ok', posts });
		expect(opened.lines[0]?.content).toBe('Workflow handoffs');
		expect(opened.lines[1]?.href).toBe('/writing/workflow-handoffs');

		const bySlug = runCodexCommand('cat workflow-handoffs', { status: 'ok', posts });
		expect(bySlug.lines[0]?.content).toBe('Workflow handoffs');
	});

	it('leaves the shell on exit and explains a missing source', () => {
		const left = runCodexCommand('cancel', { status: 'ok', posts: [] });
		expect(left.exit).toBe(true);
		const missing = runCodexCommand('ls', { status: 'unconfigured', posts: [] });
		expect(missing.lines[0]?.content).toContain('not configured');
	});
});
