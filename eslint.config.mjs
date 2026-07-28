import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * ESLint flat config (ESLint 9+).
 *
 * `eslint-config-next` 16.x exports ready-made flat config arrays, so no
 * `FlatCompat` / `@eslint/eslintrc` bridge is needed.
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      // Orval output — regenerate with `npm run generate:api`, don't hand-edit.
      "lib/api/generated/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // Pre-existing baseline debt.
    //
    // This repo had no linting at all before this config was added, so turning
    // these on as errors surfaced ~176 pre-existing violations across ~63
    // files. Rather than churn every one of them in the PR that introduces CI
    // (or bury the codebase in inline eslint-disable comments), they are
    // demoted to warnings: CI stays green, the violations stay visible in the
    // log, and new code is still held to every other rule at error level.
    //
    // Demoting them does NOT make them free: the `lint` script runs with
    // `--max-warnings 333`, pinning the total to today's count, so a new
    // violation of any of these rules pushes the count to 334 and fails CI.
    // The baseline can only go down. Lower the cap as the counts are burned
    // down, and promote each rule back to "error" once it reaches zero.
    //
    // Counts at the time this baseline was set:
    //   @typescript-eslint/no-explicit-any     136
    //   react/no-unescaped-entities             34
    //   @typescript-eslint/no-empty-object-type  6
    //   (total warnings across all rules: 333)
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
