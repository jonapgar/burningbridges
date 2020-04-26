module.exports = {
  env: {
    browser: true,
    es6: true,
  },

  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  root: true,

  extends: ["airbnb-base"],

  rules: {
    "import/extensions":["error","always"],
    "max-len": "off",
    "no-restricted-properties": "off",
    "no-continue": "off",
    "no-bitwise": "off",
    "no-plusplus": "off",
    "no-await-in-loop": "off",
    "no-shadow": "warn",
    "no-multi-assign": "off",
    "no-process-env": "error",
    "class-methods-use-this": "off",
    "no-useless-constructor": "off",
    "no-empty-function": "off",
    "guard-for-in": "off",
    "no-restricted-syntax": "off",
    "arrow-parens": ["warn", "as-needed"],
    "spaced-comment": [
      "error",
      "always",
      {
        markers: ["/"],
      },
    ],
    semi: ["error", "never"],
    "no-use-before-define": ["error", { functions: false, classes: false }],
    camelcase: "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-param-reassign": [
      "warn",
      {
        props: false,
      },
    ],
    "no-underscore-dangle": [
      "error",
      {
        allowAfterThis: true,
      },
    ],
  },
};
