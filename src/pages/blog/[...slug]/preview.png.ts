import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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
	const titleLines = wrapText(props.title, 34, 3);
	const descriptionLines = wrapText(props.description, 76, 2);
	const titleStartY = 300 + (3 - titleLines.length) * 32;
	const tags = [...props.tags.map((tag) => `#${tag.trim().replace(/\s+/g, '-')}`)];
	if (props.project) tags.push(`#${props.project}`);

	const titleSvg = titleLines
		.map(
			(line, index) =>
				`<text x="600" y="${titleStartY + index * 66}" text-anchor="middle" fill="#171e2a" font-family="monospace" font-size="58" font-weight="600" letter-spacing="-2">${escapeXml(line)}</text>`,
		)
		.join('');
	const tagsSvg =
		tags.length > 0
			? `<text x="600" y="${titleStartY + titleLines.length * 66 + 12}" text-anchor="middle" fill="#008aff" font-family="monospace" font-size="24" font-weight="600">${escapeXml(tags.join('  '))}</text>`
			: '';
	const descriptionY = titleStartY + titleLines.length * 66 + (tags.length > 0 ? 58 : 40);
	const descriptionSvg = descriptionLines
		.map(
			(line, index) =>
				`<text x="600" y="${descriptionY + index * 36}" text-anchor="middle" fill="#596675" font-family="monospace" font-size="23">${escapeXml(line)}</text>`,
		)
		.join('');
	const svg = Buffer.from(`
		<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
			<rect width="1200" height="630" fill="#f7fafc" />
			<text x="142" y="94" fill="#171e2a" font-family="monospace" font-size="40" font-weight="600" letter-spacing="-2">daishi</text>
			<text x="282" y="94" fill="#008aff" font-family="monospace" font-size="40" font-weight="600" letter-spacing="-2">.moe</text>
			<path d="M0 128h1200" stroke="#d4dee8" />
			<text x="600" y="220" text-anchor="middle" fill="#657386" font-family="monospace" font-size="24" font-weight="600">${escapeXml(dateLabel)}</text>
			${titleSvg}
			${tagsSvg}
			${descriptionSvg}
		</svg>
	`);
	const logo = await sharp(await readFile(resolve(process.cwd(), 'src/assets/46hana.png')))
		.resize(44, 44)
		.png()
		.toBuffer();
	const image = await sharp(svg)
		.composite([{ input: logo, left: 80, top: 50 }])
		.png()
		.toBuffer();

	return new Response(image, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
