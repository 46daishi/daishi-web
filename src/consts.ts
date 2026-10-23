// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'daishi.moe';
export const SITE_DESCRIPTION = 'Welcome to my website!';

export const PROJECT_TYPES = ['visual-novel', 'light-novel', 'software'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
	'visual-novel': 'Visual Novel',
	'light-novel': 'Light Novel',
	software: 'Software',
};

export const PROJECT_TYPE_PLURALS: Record<ProjectType, string> = {
	'visual-novel': 'Visual Novels',
	'light-novel': 'Light Novels',
	software: 'Software',
};

export const PROJECT_STATUSES = ['active', 'planned', 'paused', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
	active: 'Active',
	planned: 'Planned',
	paused: 'Paused',
	completed: 'Completed',
	archived: 'Archived',
};

export const PROJECT_STATUS_RANK: Record<ProjectStatus, number> = {
	active: 0,
	planned: 1,
	paused: 2,
	completed: 3,
	archived: 4,
};
