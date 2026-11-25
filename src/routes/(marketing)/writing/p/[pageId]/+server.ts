import { error, redirect } from '@sveltejs/kit';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getPublicationCatalog } from '$lib/server/writing/catalog';
import { findByPageId } from '$lib/writing/entries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, setHeaders }) => {
	const catalog = await getPublicationCatalog(writingRequestFromPlatform(platform));
	if (catalog.status === 'unconfigured') {
		setHeaders({ 'cache-control': 'no-store' });
		error(503, 'Writing is not configured.');
	}
	if (catalog.status !== 'ok') {
		setHeaders({ 'cache-control': 'no-store' });
		error(503, 'Writing is temporarily unavailable.');
	}
	const post = findByPageId(catalog.posts, params.pageId);
	if (!post) {
		setHeaders({ 'cache-control': 'no-store' });
		error(404, 'This note is not published.');
	}
	redirect(301, `/writing/${post.slug}`);
};
