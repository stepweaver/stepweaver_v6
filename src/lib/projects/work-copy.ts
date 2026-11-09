export type WorkPageCopy = {
	title: string;
	explanation: string;
	description: string;
};

/** Explains the public work index for an empty list or any approved count. */
export function workPageCopy(publishedCount: number): WorkPageCopy {
	if (publishedCount === 0) {
		return {
			title: 'No case studies are public.',
			explanation:
				'The project records are kept, and every one of them is unpublished. A status of "live" in the old registry is not permission to show the work. This page lists a case study only after that record is reviewed and explicitly approved.',
			description:
				'Case studies stay unpublished until each record is reviewed and explicitly approved.'
		};
	}

	if (publishedCount === 1) {
		return {
			title: 'Selected work',
			explanation:
				'One case study has been reviewed and explicitly approved. Every other project record stays unpublished. A status of "live" in the old registry is not permission to show the work.',
			description:
				'One case study is public. The rest stay unpublished until each record is reviewed and explicitly approved.'
		};
	}

	return {
		title: 'Selected work',
		explanation: `${publishedCount} case studies have been reviewed and explicitly approved. Project records that are not listed stay unpublished. A status of "live" in the old registry is not permission to show the work.`,
		description: `${publishedCount} case studies are public. The rest stay unpublished until each record is reviewed and explicitly approved.`
	};
}
