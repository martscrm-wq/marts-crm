module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFiles: ['<rootDir>/tests/setup.js'],
      coverageDirectory: 'coverage',
      collectCoverageFrom: [
        'tests/**/*.js',
        '!tests/setup.js',
        '!tests/**/*.test.js'
      ],
      coverageThreshold: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50
        }
      }
    }
  ]
};
