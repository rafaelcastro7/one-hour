import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // convex/*.test.ts run pure logic (scoring) with no Convex runtime, so
    // the default node environment is enough. Convex-function tests, if added
    // later, need environment: "edge-runtime" per the Convex guidelines.
    // Contract tests for external APIs need MSW setup.
    include: ["convex/**/*.test.ts", "tests/contract/**/*.test.ts"],
    setupFiles: ["tests/mocks/testUtils.ts"],
  },
});
