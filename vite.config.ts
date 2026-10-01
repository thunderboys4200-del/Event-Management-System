import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // data/ (file-backed database) and uploads/ change at runtime on every registration,
      // check-in or upload; ignoring them stops Vite from full-reloading the page each time.
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: ['**/data/**', '**/uploads/**'] },
    },
    // The QR scanner is only loaded on the staff check-in page; pre-bundle it so the
    // dev server does not discover it late and reload the page on first visit.
    optimizeDeps: {
      include: ['html5-qrcode'],
    },
  };
});
