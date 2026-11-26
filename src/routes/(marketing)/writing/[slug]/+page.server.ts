import { error, redirect } from '@sveltejs/kit';
import { writingRequestFromPlatform } from '$lib/server/env';
import { loadArticleBySlug } from '$lib/server/writing/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, setHeaders }) => {
	const article = await loadArticleBySlug(writingRequestFromPlatform(platform), params.slug);
	if (article.kind === 'unconfigured') {
		setHeaders({ 'cache-control': 'no-store' });
		error(503, 'Writing is not configured.');
	}
	if (article.kind === 'unavailable') {
		setHeaders({ 'cache-control': 'no-store' });
		error(503, 'Writing is temporarily unavailable.');
	}
	if (article.kind === 'redirect') redirect(301, `/writing/${article.slug}`);
	if (article.kind === 'missing') {
		setHeaders({ 'cache-control': 'no-store' });
		error(404, 'This note is not published.');
	}

	setHeaders({
		'cache-control': article.stale || article.blocksUnavailable ? 'no-store' : 'public, max-age=60'
	});
	return {
		post: article.post,
		blocks: article.blocks,
		blocksUnavailable: article.blocksUnavailable
	};
};
