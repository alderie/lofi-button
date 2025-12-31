module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: '18.3'
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',  // Not needed in React 18
    'react/prop-types': 'off',
    'import/no-extraneous-dependencies': 'off',
  },
};
