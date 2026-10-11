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
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
});