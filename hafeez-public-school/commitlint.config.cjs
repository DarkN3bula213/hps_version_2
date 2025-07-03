module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Code style
        'refactor', // Code refactoring
        'test',     // Tests
        'chore',    // Maintenance
        'perf',     // Performance
        'ci',       // CI/CD
        'revert',   // Revert changes
        'build'     // Build system
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'root',
        'auth',
        'user',
        'payment',
        'academic',
        'notification',
        'web',
        'ui',
        'api',
        'db',
        'deps',
        'config',
        'docs',
        'docker',
        'scripts'
      ]
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 72]
  }
};