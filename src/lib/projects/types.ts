export type ProjectStatus = 'live' | 'demo' | 'coming-soon' | 'archived';

export interface ProjectSectionItem {
	label: string;
	description?: string;
}

export interface ProjectTechStackItem {
	name: string;
	category?: string;
	icon?: string;
}

export interface ProjectEvidenceItem {
	label: string;
	value: string;
}

interface ProjectSectionBase {
	id: string;
	title: string;
}

type NarrativeSectionType =
	| 'overview'
	| 'problem'
	| 'solution'
	| 'architecture'
	| 'features'
	| 'engineering'
	| 'outcome'
	| 'key-features'
	| 'keyboard-shortcuts';

type NarrativeContent =
	| {
			content: string;
			bullets?: readonly string[];
	  }
	| {
			content?: string;
			bullets: readonly string[];
	  };

export type NarrativeProjectSection = ProjectSectionBase & {
	type: NarrativeSectionType;
} & NarrativeContent;

export type TechStackProjectSection = ProjectSectionBase & {
	type: 'tech-stack';
	techStack: readonly ProjectTechStackItem[];
};

export type EvidenceProjectSection = ProjectSectionBase & {
	type: 'evidence-bar';
	evidence: readonly ProjectEvidenceItem[];
};

export type DataFlowProjectSection = ProjectSectionBase & {
	type: 'data-flow';
	content: string;
};

type ItemListSectionType = 'project-structure' | 'terminal-integration';

export type ItemListProjectSection = ProjectSectionBase & {
	type: ItemListSectionType;
	items: readonly ProjectSectionItem[];
};

type TradeoffsContent =
	| {
			bullets: readonly string[];
			items?: readonly ProjectSectionItem[];
	  }
	| {
			bullets?: readonly string[];
			items: readonly ProjectSectionItem[];
	  };

export type TradeoffsProjectSection = ProjectSectionBase & {
	type: 'tradeoffs';
} & TradeoffsContent;

export type ProjectSection =
	| NarrativeProjectSection
	| TechStackProjectSection
	| EvidenceProjectSection
	| DataFlowProjectSection
	| ItemListProjectSection
	| TradeoffsProjectSection;

export type ProjectSectionType = ProjectSection['type'];

export interface ProjectGalleryItem {
	src: string;
	alt: string;
}

export interface Project {
	slug: string;
	title: string;
	description: string;
	status: ProjectStatus;
	tags: readonly string[];

	keywords?: readonly string[];
	imageUrl?: string;
	link?: string;
	githubRepo?: string;

	cardDescription?: string;
	cardBuiltFor?: string;
	cardSolved?: string;
	cardDelivered?: readonly string[];

	builtFor?: string;
	solved?: string;
	delivered?: readonly string[];

	sections: readonly ProjectSection[];
	caseStudyGallery?: readonly ProjectGalleryItem[];

	demoUrl?: string;
	liveUrl?: string;
	repoUrl?: string;
}
