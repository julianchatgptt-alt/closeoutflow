import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const config = tseslint.config(
  {
    ignores: [
      "**/.next/**",
      // Generated Next.js build output from the managed Playwright harness
      // (NEXT_DIST_DIR=.next-playwright); never lint generated .d.ts.
      "**/.next-playwright/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "docs/**"
    ]
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    settings: {
      react: { version: "detect" }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" }
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@closeoutflow/*/src/*"],
              message: "Import a package through its public export."
            },
            {
              group: ["**/features/*/../*", "**/features/*/*/../*"],
              message: "Feature modules may not import another feature's internals."
            }
          ]
        }
      ],
      "react/react-in-jsx-scope": "off"
    }
  },
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@closeoutflow/db",
                "@closeoutflow/db/*",
                "@closeoutflow/authz",
                "@closeoutflow/authz/*",
                "@supabase/*"
              ],
              message: "The UI package is presentation-only."
            }
          ]
        }
      ]
    }
  }
);

export default config;
