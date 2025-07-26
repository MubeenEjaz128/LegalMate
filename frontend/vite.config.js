import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['util'], // Polyfill Node.js `util` module for simple-peer
    }),
  ],
  define: {
    global: 'globalThis', // Already good for browser compatibility
  },
  server: {
    port: 3000,
    https: false, // Set to `true` for local HTTPS testing with Stripe
  },
  resolve: {
    alias: {
      // Optional: Add manual shim for `util` if needed
      // util: '/path/to/util-shim.js',
    },
  },
});