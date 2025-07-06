module.exports = {
  extends: ['../../packages/config-eslint'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Service-specific rules if needed
  },
};
