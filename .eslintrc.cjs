module.exports = {
  env: { browser: true, es2021: true, node: true },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['react'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    // Demo UI kit — prop-types add noise without value; contracts land with TS later.
    'react/prop-types': 'off',
    // Apostrophes in copy are fine in JSX text.
    'react/no-unescaped-entities': 'off',
    // Named-import cleanups are tracked as warnings, not build-breakers.
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  settings: { react: { version: 'detect' } },
};
