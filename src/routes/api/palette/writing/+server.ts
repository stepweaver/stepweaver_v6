import { json } from '@sveltejs/kit';
import { writingRequestFromPlatform } from '$lib/server/env';
import { getWritingCatalog } from '$lib/server/writing/catalog';
import { paletteWritingBody } from '$lib/server/writing/palette-search';
import type { RequestHandler } from './$types';

const HEADERS = { 'cache-control': 'no-store' };

/** Published writing fields for the command palette. Uses the listing catalog. */
export const GET: RequestHandler = async ({ platform }) => {
	const body = paletteWritingBody(await getWritingCatalog(writingRequestFromPlatform(platform)));
	return json({ posts: body.posts }, { status: body.status, headers: HEADERS });
};
