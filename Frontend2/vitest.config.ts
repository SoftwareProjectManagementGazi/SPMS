import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      // Default jsdom origin is "about:blank" (opaque) which makes
      // window.localStorage throw SecurityError. Use a real origin so
      // localStorage is available for providers that read it at mount.
      jsdom: { url: "http://localhost/" },
    },
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: false,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
