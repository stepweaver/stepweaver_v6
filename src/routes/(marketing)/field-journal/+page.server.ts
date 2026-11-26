import { journalRequestFromPlatform } from '$lib/server/env';
import { loadPublicMileage } from '$lib/server/journal/load';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
	const journal = await loadPublicMileage(journalRequestFromPlatform(platform));
	const cacheable = journal.status === 'ok' || journal.status === 'empty';
	setHeaders({ 'cache-control': cacheable ? 'public, max-age=60' : 'no-store' });
	return { journal };
};
