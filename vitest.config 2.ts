import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["dotenv/config", "./tests/setup.ts"],
    globalSetup: ["./tests/global-teardown.ts"],
    env: { NODE_ENV: "test" },
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": resolve(__dirname) },
  },
});
