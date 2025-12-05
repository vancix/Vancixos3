import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are linked relatively, making the dist folder deployable anywhere
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    // Injects the API key into the build
    'process.env.API_KEY': JSON.stringify("AIzaSyBI_sliGxZoTbZl-JiYKaG4omVaXc6NKas")
  }
});