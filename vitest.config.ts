import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["dotenv/config", "./tests/setup.ts"],
    env: { NODE_ENV: "test" },
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": resolve(__dirname) },
  },
});
