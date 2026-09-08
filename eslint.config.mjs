import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // `public/**` is shipped byte-for-byte and is never application source — it
  // currently holds a vendored design-reference runtime whose lint findings
  // are not ours to fix. Same rationale as the other reference paths here.
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "next-env.d.ts",
    ".aura-work/**",
    "public/**",
    "design/references/**",
    "design/figma-import/**",
  ]),

  // `core-web-vitals` bundles the React, React Hooks, Next.js and jsx-a11y
  // rule sets. The a11y rules are the reason this dependency earns its place:
  // accessibility regressions get caught by `npm run lint`, not in review.
  // (Next 16 removed `next lint`, so linting is its own step.)
  ...nextCoreWebVitals,

  {
    rules: {
      // Push interaction toward real semantic elements rather than div
      // handlers, which is what keeps keyboard support working by default.
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
]);
