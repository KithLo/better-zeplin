module.exports = {
  extends: ["eslint:recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "solid", "prettier"],
  root: true,

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },

  ignorePatterns: ["dist"],

  rules: {
    "prettier/prettier": ["error"],
    eqeqeq: ["error", "smart"],
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },

  overrides: [
    {
      files: ["tests/**/*"],
      env: {
        node: true,
        jest: true,
      },
    },
    {
      files: [
        ".eslintrc.{js,cjs}",
        ".prettierrc.{js,cjs}",
        "vite.config.ts",
        "cli.mjs",
      ],
      env: {
        node: true,
      },
      parserOptions: {
        sourceType: "script",
      },
    },
    {
      files: ["web/**"],
      env: {
        browser: true,
      },
    },
    {
      files: ["extension/**"],
      env: {
        browser: true,
        webextensions: true,
      },
    },
    {
      files: ["**/*.worker.{js,cjs,ts}"],
      env: {
        worker: true,
      },
    },
    {
      files: ["**/*.{ts,tsx}"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:solid/typescript",
        "plugin:solid/recommended",
        "prettier",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
      },
    },
  ],
}
