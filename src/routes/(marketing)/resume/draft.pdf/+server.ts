import { redirect } from '@sveltejs/kit';
import { identity } from '$lib/data/identity';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => redirect(308, identity.links.resumePdf);
