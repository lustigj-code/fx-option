const fs = require('fs');
const path = require('path');

function resolveTypeScriptParser() {
  const pnpmDir = path.join(__dirname, '..', 'node_modules', '.pnpm');
  if (!fs.existsSync(pnpmDir)) {
    const workspaceDir = path.join(__dirname, '..', '..', 'node_modules', '.pnpm');
    if (!fs.existsSync(workspaceDir)) {
      throw new Error('Unable to locate pnpm virtual store for @typescript-eslint/parser');
    }
    return locateParser(workspaceDir);
  }
  return locateParser(pnpmDir);
}

function locateParser(baseDir) {
  const entry = fs
    .readdirSync(baseDir)
    .filter((name) => name.startsWith('@typescript-eslint+parser@'))
    .sort()
    .pop();
  if (!entry) {
    throw new Error('Unable to resolve @typescript-eslint/parser from workspace.');
  }
  const parserDir = path.join(baseDir, entry, 'node_modules', '@typescript-eslint', 'parser');
  return require.resolve('@typescript-eslint/parser', { paths: [parserDir] });
}

const parserPath = resolveTypeScriptParser();

module.exports = {
  root: true,
  parser: parserPath,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react'],
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off'
  }
};
