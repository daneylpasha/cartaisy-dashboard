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
 * What this does and does not guarantee — verified, not assumed:
 *   - a violation in a file with no recorded entry for that rule    -> FAILS
 *   - a file exceeding its recorded count for that rule             -> FAILS
 *   - fixing one violation and adding one in a DIFFERENT file       -> FAILS
 *   - fixing one and adding one in the SAME file, for the SAME rule -> PASSES
 *
 * That last case is the residual limit of count-based suppressions: entries
 * record how many violations a file has, not which ones. So the baseline
 * guarantees debt cannot GROW, not that individual violations are frozen — one
 * can be swapped for another inside a single file. Closing that fully needs
 * either per-violation tracking, which ESLint does not offer, or actually
 * fixing the 176. The alternative considered and rejected was 176 inline
 * `eslint-disable` comments, which is a worse trade at this size.
 *
 * Fixing a suppressed violation without adding one still passes; run
 * `eslint --prune-suppressions` afterwards to drop the stale entries, so the
 * recorded count keeps shrinking with the real one.
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
