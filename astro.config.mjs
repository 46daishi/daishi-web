// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
    site: 'https://daishi.github.io',
    integrations: [mdx(), sitemap(), svelte()],
    fonts: [
        {
            provider: fontProviders.local(),
            name: 'IBM Plex Mono',
            cssVariable: '--font-mono',
            fallbacks: [
                'ui-monospace',
                'SFMono-Regular',
                'Menlo',
                'Consolas',
                'Hiragino Sans',
                'Yu Gothic',
                'Noto Sans JP',
                'monospace',
            ],
            options: {
                variants: [
                    {
                        src: ['./src/assets/fonts/ibm-plex-mono-400-normal.woff2'],
                        weight: 400,
                        style: 'normal',
                        display: 'swap',
                    },
                    {
                        src: ['./src/assets/fonts/ibm-plex-mono-400-italic.woff2'],
                        weight: 400,
                        style: 'italic',
                        display: 'swap',
                    },
                    {
                        src: ['./src/assets/fonts/ibm-plex-mono-500-normal.woff2'],
                        weight: 500,
                        style: 'normal',
                        display: 'swap',
                    },
                    {
                        src: ['./src/assets/fonts/ibm-plex-mono-600-normal.woff2'],
                        weight: 600,
                        style: 'normal',
                        display: 'swap',
                    },
                    {
                        src: ['./src/assets/fonts/ibm-plex-mono-700-normal.woff2'],
                        weight: 700,
                        style: 'normal',
                        display: 'swap',
                    },
                ],
            },
        },
        {
            provider: fontProviders.local(),
            name: 'Symbols Nerd Font',
            cssVariable: '--font-symbols',
            fallbacks: ['monospace'],
            options: {
                variants: [
                    {
                        src: ['./src/assets/fonts/symbols-nerd-font-ui.woff2'],
                        weight: 400,
                        style: 'normal',
                        display: 'block',
                    },
                ],
            },
        },
    ],
});