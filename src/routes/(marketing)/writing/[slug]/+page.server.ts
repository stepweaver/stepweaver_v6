import { error, redirect } from '@sveltejs/kit';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getArticleBlocks, getPublicationCatalog } from '$lib/server/writing/catalog';
import { findBySlug } from '$lib/writing/entries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, setHeaders }) => {
	const request = writingRequestFromPlatform(platform);
	const catalog = await getPublicationCatalog(request);
	if (catalog.status === 'unconfigured') {
		setHeaders({ 'cache-control': 'no-store' });
		error(503, 'Writing is not configured.');
	}
	if (catalog.status !== 'ok') {
		setHeaders({ 'cache-control': 'no-store' });
		error(503, 'Writing is temporarily unavailable.');
	}

	const match = findBySlug(catalog.posts, params.slug);
	if (match.kind === 'redirect') redirect(301, `/writing/${match.slug}`);
	if (match.kind === 'missing') {
		setHeaders({ 'cache-control': 'no-store' });
		error(404, 'This note is not published.');
	}

	const article = await getArticleBlocks(request, match.post.id);
	setHeaders({
		'cache-control': article.stale || article.status !== 'ok' ? 'no-store' : 'public, max-age=60'
	});
	return {
		post: match.post,
		blocks: article.blocks,
		blocksUnavailable: article.status !== 'ok'
	};
};
