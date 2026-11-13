import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Next 16 removed the `next lint` command and `next build` no longer lints, so
 * ESLint is invoked directly (`npm run lint`). eslint-config-next@16 ships a
 * native flat config, so no FlatCompat bridge is needed.
 *
 * Before this file existed the repo had no ESLint config at all, which meant
 * `next lint` had never actually linted anything.
 */
const config = [
  ...nextCoreWebVitals,
  {
    // Build output and vendored code, not source. Without these ESLint lints the
    // compiled Worker bundle and Turbopack chunks and reports only generated-code
    // noise. `nexapay-node-sdk` is vendored and already excluded from tsconfig.
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "node_modules/**",
      "nexapay-node-sdk/**",
      "public/**",
    ],
  },
];

export default config;
