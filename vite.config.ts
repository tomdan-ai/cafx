import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/binance-api': {
        target: 'https://api.binance.com/api/v3',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/binance-api/, ''),
      },
    },
  },
});
