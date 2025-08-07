// @ts-check

import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import globals from "globals";

import importPlugin from "eslint-plugin-import";

import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: nextPlugin.configs.recommended,
});

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      "node_modules/",
      ".turbo/",
      "dist/",
      "build/",
      "coverage/",
      "*.config.js",
      "*.config.ts",
      ".eslintrc.progressive.js.bak",
      "apps/web/.next/",
    ],
  },
  // Base Next.js configuration using compatibility layer
  ...compat.extends("next/core-web-vitals").map((config) => ({
    ...config,
    settings: {
      next: {
        rootDir: "apps/web",
      },
      react: {
        version: "detect",
      },
    },
  })),
  // Custom project-wide configurations for TS/TSX files
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Rules from .eslintrc.progressive.js
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "react/no-unescaped-entities": "error",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",

      // From Next.js config, ensure these are set if not default
      "@next/next/no-html-link-for-pages": "off", // Example of adjusting a rule
    },
  },
  // Stricter rules for new/refactored files
  {
    files: ["**/new-*.{ts,tsx}", "**/refactored-*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  // Relaxed rules for legacy files
  {
    files: ["src/scripts/**/*.ts", "src/lib/services/**/*.ts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
);
