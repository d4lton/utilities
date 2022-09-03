module.exports = {
  root: true,
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true // Allows for the parsing of JSX
    }
  },
  settings: {},
  extends: [],
  plugins: [
    "@typescript-eslint"
  ],
  rules: {
    "ident": "off",
    "@typescript-eslint/indent": ["warn", 2, {"SwitchCase": 1, "ignoredNodes": ["PropertyDefinition"]}],
    "semi": ["warn"],
    "@typescript-eslint/semi": ["warn"],
    "quotes": ["warn", "double"],
    "no-multiple-empty-lines": ["warn", {"max": 1, "maxEOF": 0}],
    "no-whitespace-before-property": ["warn"],
    "space-before-blocks": ["warn"],
    "space-before-function-paren": ["warn", {"anonymous": "never", "named": "never", "asyncArrow": "always"}],
    "space-in-parens": ["warn", "never"],
    "space-infix-ops": ["warn"],
    "space-unary-ops": ["warn"],
    "semi-spacing": ["warn"],
    "keyword-spacing": ["warn"],
    "comma-dangle": ["warn"],
    "object-curly-spacing": ["warn"],
    "arrow-spacing": ["warn"],
    "no-unused-vars": "off",
    "no-unused-funcs": "off"
  }
};
