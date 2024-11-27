// eslint.config.js
module.exports = [
  {
    languageOptions: {
      ecmaVersion: 12, // ECMAScript version
      sourceType: "module", // For module support
      globals: {
        window: "readonly", // For window object
        document: "readonly", // For document object
        console: "readonly", // For console usage
      },
    },
    rules: {
      // Manually add rules from eslint:recommended
      "no-console": "warn",
      "no-unused-vars": "warn",
      "eqeqeq": "error",
      "curly": "error",
      "no-eq-null": "off",  // Example of disabling a rule
      "no-alert": "warn",
      "no-console": "off",
      "eqeqeq": "off",
      "padding-line-between-statements": [
        "error",
        { "blankLine": "always", "prev": "function", "next": "function" }
      ]
    },
  },
];
