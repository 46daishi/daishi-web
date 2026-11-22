import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { copyFile, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

// Blog posts without a hero image use a screenshot of the post page as their
// Open Graph image so the embed matches the preview shown on the blog index.
const execFileAsync = promisify(execFile);
const distDirectory = resolve('dist');
const fallbackImage = resolve('src/assets/og-default.png');
const embedFileName = 'embed.png';
const screenshotWidth = 1200;
const screenshotHeight = 630;

const contentTypes = {
	'.avif': 'image/avif',
	'.css': 'text/css; charset=utf-8',
	'.gif': 'image/gif',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.mp4': 'video/mp4',
	'.otf': 'font/otf',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ttf': 'font/ttf',
	'.txt': 'text/plain; charset=utf-8',
	'.webm': 'video/webm',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.xml': 'application/xml; charset=utf-8',
};

const findPostPages = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const pages = [];

	for (const entry of entries) {
		const path = join(directory, entry.name);

		if (entry.isDirectory()) {
			pages.push(...(await findPostPages(path)));
		} else if (entry.isFile() && entry.name === 'index.html') {
			pages.push(path);
		}
	}

	return pages;
};

const serveStatic = async () => {
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url ?? '/', 'http://127.0.0.1');
			let pathname = decodeURIComponent(url.pathname);

			if (pathname.endsWith('/')) pathname += 'index.html';

			const filePath = resolve(distDirectory, `.${pathname}`);

			if (filePath !== distDirectory && !filePath.startsWith(`${distDirectory}${sep}`)) {
				response.writeHead(403);
				response.end('Forbidden');
				return;
			}

			const file = await stat(filePath);
			if (!file.isFile()) {
				response.writeHead(404);
				response.end('Not found');
				return;
			}

			response.writeHead(200, {
				'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
			});
			createReadStream(filePath).pipe(response);
		} catch {
			response.writeHead(404);
			response.end('Not found');
		}
	});

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

	return server;
};

const findFirefox = async () => {
	const candidates = [process.env.FIREFOX_BIN, 'firefox', '/usr/bin/firefox'].filter(Boolean);

	for (const candidate of candidates) {
		try {
			await execFileAsync(candidate, ['--version']);
			return candidate;
		} catch {}
	}

	return null;
};

const main = async () => {
	const pages = await findPostPages(join(distDirectory, 'blog'));
	const imagelessPages = [];

	for (const page of pages) {
		const html = await readFile(page, 'utf8');
		const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/);

		if (ogImage?.[1].endsWith(`/${embedFileName}`)) imagelessPages.push(page);
	}

	if (imagelessPages.length === 0) return;

	const firefox = await findFirefox();

	if (!firefox) {
		console.warn('Firefox not found; using the default site image for embed previews.');
		await Promise.all(
			imagelessPages.map((page) => copyFile(fallbackImage, join(dirname(page), embedFileName))),
		);
		return;
	}

	const server = await serveStatic();
	const { port } = server.address();
	const origin = `http://127.0.0.1:${port}`;
	const profileDirectory = await mkdtemp(join(tmpdir(), 'daishi-embed-preview-'));
	await writeFile(
		join(profileDirectory, 'user.js'),
		[
			'user_pref("ui.systemUsesDarkTheme", 0);',
			'user_pref("layout.css.prefers-color-scheme.content-override", 1);',
			'',
		].join('\n'),
	);

	try {
		for (const page of imagelessPages) {
			const pageDirectory = dirname(page);
			const output = join(pageDirectory, embedFileName);
			const temporaryOutput = `${output}.tmp.png`;
			const slug = relative(join(distDirectory, 'blog'), pageDirectory).split(sep).join('/');
			const url = `${origin}/blog/${slug.split('/').map(encodeURIComponent).join('/')}/`;

			try {
				await execFileAsync(
					firefox,
					[
						'--headless',
						'--no-remote',
						'--profile',
						profileDirectory,
						`--window-size=${screenshotWidth},${screenshotHeight}`,
						'--screenshot',
						temporaryOutput,
						url,
					],
					{ timeout: 45_000 },
				);

				await sharp(temporaryOutput)
					.resize(screenshotWidth, screenshotHeight, { fit: 'cover' })
					.png({ compressionLevel: 9 })
					.toFile(`${temporaryOutput}.optimized.png`);

				await rename(`${temporaryOutput}.optimized.png`, output);
				console.log(`Generated embed preview for /blog/${slug}/`);
			} catch (error) {
				console.warn(`Could not generate embed preview for /blog/${slug}/: ${error.message}`);
				await copyFile(fallbackImage, output);
			} finally {
				await rm(temporaryOutput, { force: true });
				await rm(`${temporaryOutput}.optimized.png`, { force: true });
			}
		}
	} finally {
		await new Promise((resolve) => server.close(resolve));
		await rm(profileDirectory, { recursive: true, force: true });
	}
};

await main();
