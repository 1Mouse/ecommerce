import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globals: false,
    include: ["test/**/*.test.ts"],
    pool: "forks",
    testTimeout: 30_000,
  },
});
