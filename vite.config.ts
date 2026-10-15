import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { onnxProgressPlugin } from './scripts/onnx-progress-plugin.ts';

export default defineConfig(() => {
  return {
    plugins: [onnxProgressPlugin(), react(), tailwindcss()],
    worker: { plugins: () => [onnxProgressPlugin()] },
    optimizeDeps: { exclude: ['@huggingface/transformers'] },
    build: {
      rollupOptions: {
        input: {
          app: path.resolve('index.html'),
          voiceVerification: path.resolve('tests/voice-browser.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
