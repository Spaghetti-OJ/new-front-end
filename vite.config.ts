import * as path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Pages from "vite-plugin-pages";
import Components from "unplugin-vue-components/vite";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Pages({
      onRoutesGenerated: (routes) =>
        routes.map((r) => {
          if (r.path.startsWith("/home")) {
            const p = r.path.replace(/^\/home/, "");
            r.path = p.length === 0 ? "/" : p;
          }
          return r;
        }),
    }),
    Components({
      dts: "./src/auto/components.d.ts",
      resolvers: [IconsResolver()],
    }),
    Icons(),
  ],
  server: {
    proxy: {
      "/api": {
        target: process.env.NODE_ENV === "test" ? "http://localhost:8000" : "https://api.noj.tw",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
