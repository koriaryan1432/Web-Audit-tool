/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "prettier",
  ],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  parserOptions: { project: true },
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "prefer-const": "error",
    "no-console": ["warn", { allow: ["warn", "error", "info"] }],
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.js", "*.config.ts"],
};
