import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Environment variable prefix for Vite
const defineOptions = {
  'process.env': {}
};

// Add all env vars that start with VITE_ or are in a allowed list
// Vite only exposes VITE_* vars to client code by default
const allowedEnvVars = [
  'NVIDIA_NIM_BASE_URL',
  'NVIDIA_NIM_MODEL'
];

allowedEnvVars.forEach(key => {
  if (process.env[key]) {
    defineOptions['process.env'][key] = JSON.stringify(process.env[key]);
  }
});

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  server: {
    port: 5173,
    host: true,
  },
  define: defineOptions,
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
