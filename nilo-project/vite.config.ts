import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'src': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/scss/variables.scss" as *;'
      }
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
      // 用户端评论微服务（/comment/**、/user/commentAction/**）
      "/api/comment": {
        target: "http://localhost:7075/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/comment/, ''),
      },
    }
  },
})
