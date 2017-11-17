module.exports = {
  parser: "babel-eslint",
  env: {
    es6: true,
    mocha: true,
    node: true,
    browser: true
  },
  parserOptions: {
    sourceType: "module"
  },
  plugins: [
    "flowtype"
  ],
  extends: [
    "plugin:flowtype/recommended",
    "eslint:recommended",
  ],
  rules: {
    "array-bracket-spacing": ["warn", "always"],
    "camelcase": ["warn"],
    "key-spacing": ["warn"],
    "no-unused-vars": ["warn"],
    "no-console": ["error"],
    "object-curly-spacing": ["warn", "always"],
    "quotes": ["warn", "single"],
    "semi": ["error", "always"],
  }
};
