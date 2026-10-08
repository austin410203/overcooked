import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  resolve: process.env.INLINE_MODELS ? { alias: [{ find: /^\.\/modelSource$/, replacement: new URL('./src/scene/modelSource.inline.ts', import.meta.url).pathname }] } : {},
  build: { chunkSizeWarningLimit: 1500 },
  test: { environment: 'node' },
} as any);
