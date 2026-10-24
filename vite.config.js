import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  optimizeDeps: { noDiscovery: true, include: [] },
  oxc: {
    jsx: {
      runtime: "classic",
      pragma: "React.createElement",
      pragmaFrag: "React.Fragment",
    },
  },
  server: {
    host: "127.0.0.1",
    watch: {
      usePolling: false,
      ignored: [
        "**/android/**",
        "**/recovery/**",
        "**/verification/**",
        "**/dist/**",
        "**/tests/**",
      ],
    },
  },
});
