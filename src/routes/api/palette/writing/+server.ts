import { json } from '@sveltejs/kit';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import { paletteWritingBody } from '$lib/server/writing/palette-search';
import type { RequestHandler } from './$types';

const HEADERS = { 'cache-control': 'no-store' };

/** Published listing for the command palette and the terminal codex. */
export const GET: RequestHandler = async ({ platform }) => {
	const body = paletteWritingBody(await getWritingCatalog(writingRequestFromPlatform(platform)));
	return json(
		{ status: body.status, posts: body.posts },
		{ status: body.httpStatus, headers: HEADERS }
	);
};
