// Flat ESLint config (ESLint 10 + typescript-eslint 8).
// Type-aware linting is scoped to src/*.ts only; tooling/tests are plain ESM JS.
// Prettier owns formatting — eslint-config-prettier disables stylistic rules.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },

  // Base JS rules for everything.
  js.configs.recommended,

  // Type-aware TS rules — scoped to source files so the type-checked rules
  // never load against config/tooling files (which aren't in the TS project).
  {
    files: ["src/**/*.ts"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // This server parses untrusted JSON from the network (globalping, TLS
      // certs, HTTP headers). `any` at that boundary is deliberate — surface it
      // as a warning so it stays visible, but it must not fail the build.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      // Real bugs — keep these as errors.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Tooling and tests: plain ESM JS, Node globals, no type-aware rules.
  {
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      // Smoke/test harnesses use empty catch blocks as deliberate best-effort
      // cleanup (kill a child that may already be dead). That's intentional.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  prettier,
);
