import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // convex/*.test.ts run pure logic (scoring) with no Convex runtime, so
    // the default node environment is enough. Convex-function tests, if added
    // later, need environment: "edge-runtime" per the Convex guidelines.
    include: ["convex/**/*.test.ts"],
  },
});
