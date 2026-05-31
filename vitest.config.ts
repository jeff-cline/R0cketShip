import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["dotenv/config", "./tests/setup.ts"],
    globalSetup: ["./tests/global-teardown.ts"],
    env: { NODE_ENV: "test" },
    fileParallelism: false,
    // Integration tests hit the dev DB over an SSH tunnel; multi-round-trip tests
    // need more than Vitest's 5s default under full-suite latency.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: { "@": resolve(__dirname) },
  },
});
