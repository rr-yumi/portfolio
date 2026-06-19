// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
  site: 'https://portfolio-nine-ecru-vjgzzeqg7s.vercel.app',
  vite: {
    resolve: {
      preserveSymlinks: true,
      alias: {
        'astro/entrypoints/prerender': fileURLToPath(
          new URL('./node_modules/astro/dist/entrypoints/prerender.js', import.meta.url)
        ),
      }
    }
  }
});
