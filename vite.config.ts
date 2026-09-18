import { defineConfig } from 'vite';

// BASE_PATH is set when publishing under a sub-path (a GitHub Pages project site).
// Development, preview and the test suite run at the root unless it is exported.
export default defineConfig({ base: process.env.BASE_PATH || '/' });
