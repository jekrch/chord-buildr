import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path"

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});