import path from 'path';
import { defineConfig } from 'vite';

/**
 * Bundles map generator scripts into self-contained Node-compatible CJS files
 * at bootstrap/ so they can run with `node` in production without vite-node
 * or the full dev toolchain.
 *
 * - bootstrap/generate-map-data.cjs  — procedural random map generator
 * - bootstrap/generate-geo-map.cjs   — real-world geography map generator
 */
export default defineConfig({
    publicDir: false,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        lib: {
            entry: {
                'generate-map-data': path.resolve(__dirname, 'scripts/generate-map-data.mts'),
                'generate-geo-map': path.resolve(__dirname, 'scripts/generate-geo-map.mts'),
            },
            formats: ['cjs'],
        },
        outDir: path.resolve(__dirname, 'bootstrap'),
        emptyOutDir: false,
        ssr: true,
        rollupOptions: {
            external: [],
        },
    },
});
