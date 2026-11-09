import { buildResumePdf } from '$lib/resume/pdf';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return new Response(buildResumePdf(), {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': 'attachment; filename="weaver_resume_draft.pdf"',
			'cache-control': 'no-store'
		}
	});
};
