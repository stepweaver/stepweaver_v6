import { error, redirect } from '@sveltejs/kit';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import { findByPageId } from '$lib/writing/entries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const catalog = await getWritingCatalog(writingRequestFromPlatform(platform));
	if (catalog.status === 'unconfigured') error(503, 'Writing is not configured.');
	if (catalog.status !== 'ok') error(503, 'Writing is temporarily unavailable.');
	const post = findByPageId(catalog.posts, params.pageId);
	if (!post) error(404, 'This note is not published.');
	redirect(301, `/writing/${post.slug}`);
};
