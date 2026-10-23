import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PROJECT_STATUSES, PROJECT_TYPES } from './consts';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			icon: image(),
			color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex colour'),
			type: z.enum(PROJECT_TYPES),
			status: z.enum(PROJECT_STATUSES).default('active'),
			featured: z.boolean().default(false),
			featuredOrder: z.number().default(0),
			links: z
				.array(
					z.object({
						label: z.string(),
						href: z.string(),
					}),
				)
				.max(3)
				.default([]),
		}),
});

export const collections = { blog, projects };
