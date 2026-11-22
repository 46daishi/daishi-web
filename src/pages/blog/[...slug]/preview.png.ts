import { getCollection } from 'astro:content';
import sharp from 'sharp';

type PreviewProps = {
	title: string;
	description: string;
	pubDate: string;
	tags: string[];
	project?: string;
};

const escapeXml = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const wrapText = (value: string, limit: number, maxLines: number) => {
	const lines: string[] = [];
	let line = '';

	for (const word of value.split(/\s+/)) {
		const next = line ? `${line} ${word}` : word;
		if (next.length > limit && line) {
			lines.push(line);
			line = word;
			if (lines.length === maxLines) break;
		} else {
			line = next;
		}
	}

	if (lines.length < maxLines && line) lines.push(line);
	if (lines.length === maxLines && lines.join(' ').length < value.length) {
		lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]?$/, '')}…`;
	}

	return lines;
};

export async function getStaticPaths() {
	const posts = await getCollection('blog');
	return posts
		.filter((post) => !post.data.heroImage)
		.map((post) => ({
			params: { slug: post.id },
			props: {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.pubDate.toISOString(),
				tags: post.data.tags,
				project: post.data.project,
			},
		}));
}

export async function GET({ props }: { props: PreviewProps }) {
	const date = new Date(props.pubDate);
	const dateLabel = `${date.getUTCFullYear()}年 ${String(date.getUTCMonth() + 1).padStart(2, '0')}月 ${String(date.getUTCDate()).padStart(2, '0')}日`;
	const titleLines = wrapText(props.title, 38, 2);
	const descriptionLines = wrapText(props.description, 76, 2);
	const titleStartY = 168;
	const tags = props.tags.map((tag) => `#${tag.trim().replace(/\s+/g, '-')}`);

	const titleSvg = titleLines
		.map(
			(line, index) =>
				`<text x="72" y="${titleStartY + index * 62}" fill="#d7e0ef" font-family="sans-serif" font-size="48" font-weight="700" letter-spacing="-1">${escapeXml(line)}</text>`,
		)
		.join('');
	const descriptionY = titleStartY + titleLines.length * 62 + 20;
	const tagsSvg =
		tags.length > 0
			? `<text x="72" y="${descriptionY + descriptionLines.length * 42 + 36}" fill="#d7e0ef" font-family="monospace" font-size="30" font-weight="600">${escapeXml(tags.join('  '))}</text>`
			: '';
	const descriptionSvg = descriptionLines
		.map(
			(line, index) =>
				`<text x="72" y="${descriptionY + index * 42}" fill="#b0bccc" font-family="sans-serif" font-size="36">${escapeXml(line)}</text>`,
		)
		.join('');
	const svg = Buffer.from(`
		<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
			<rect width="1200" height="630" fill="#101214" />
			<rect x="28" y="28" width="1144" height="574" rx="24" fill="none" stroke="#28364d" stroke-width="2" />
			<text x="72" y="92" fill="#aab4c5" font-family="monospace" font-size="30">${escapeXml(dateLabel)}</text>
			${titleSvg}
			${tagsSvg}
			${descriptionSvg}
		</svg>
	`);
	const image = await sharp(svg).png().toBuffer();

	return new Response(image, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
