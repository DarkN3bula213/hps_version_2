module.exports = {
  // Lint and format TypeScript/JavaScript files
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  // Format JSON, Markdown, and YAML files
  "*.{json,md,yml,yaml}": ["prettier --write"],
};
