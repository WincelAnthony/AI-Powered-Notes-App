import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api to Express, so the browser only ever talks to one origin.
// (Same origin = the httpOnly auth cookie "just works" and no secrets are needed in the client.)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
