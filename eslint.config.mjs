import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * ESLint flat config (ESLint 9+).
 *
 * `eslint-config-next` 16.x exports ready-made flat config arrays, so no
 * `FlatCompat` / `@eslint/eslintrc` bridge is needed.
 *
 * Pre-existing baseline debt is handled by `eslint-suppressions.json`, not by
 * demoting rules here. This repo had never been linted, so turning ESLint on
 * surfaced 176 pre-existing violations — 136 `@typescript-eslint/no-explicit-any`,
 * 34 `react/no-unescaped-entities`, 6 `@typescript-eslint/no-empty-object-type`.
 * Rather than lower those three rules to warnings repo-wide, they keep their
 * real `error` severity and the existing violations are recorded, per file and
 * per rule, in the suppressions file (generated with `eslint --suppress-all`).
 *
 * The practical difference: an aggregate `--max-warnings` cap would still pass
 * if someone fixed two old violations and introduced two new ones. Suppressions
 * are counted per file per rule, so any NEW violation fails regardless of what
 * was fixed elsewhere. Fixing a suppressed violation without adding one still
 * passes; run `eslint --prune-suppressions` to drop the stale entries.
 *
 * Do not add entries to the suppressions file by hand, and do not regenerate it
 * wholesale with `--suppress-all` to make a red build green — that silently
 * absorbs new debt, which is the exact thing this file exists to prevent.
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
];

export default eslintConfig;
