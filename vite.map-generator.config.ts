import path from 'path';
import { defineConfig } from 'vite';

/**
 * Bundles scripts/generate-map-data.mts into a self-contained Node-compatible
 * CJS file at bootstrap/generate-map-data.cjs so it can run with `node` in
 * production without vite-node or the full dev toolchain.
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
            entry: path.resolve(__dirname, 'scripts/generate-map-data.mts'),
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
