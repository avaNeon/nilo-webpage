import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      src: fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/scss/variables.scss" as *;',
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3001,
    hmr: true,
    proxy: {
      "/api/admin": {
        target: "http://localhost:7070/",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/admin/, ""),
      },
    },
  },
});
