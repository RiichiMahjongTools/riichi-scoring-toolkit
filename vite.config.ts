import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  test: {
    exclude: ['node_modules/**', 'dist/**', '.tmp/**'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
