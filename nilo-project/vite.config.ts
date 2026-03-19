import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    hmr: true,
    proxy: {
      "/api/web": {
        target: "http://localhost:7071/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/web/, ''),
      },
      "/api/admin": {
        target: "http://localhost:7070/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/admin/, ''),
      }
    }
  },
})
