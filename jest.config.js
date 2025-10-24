module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Module paths
  moduleDirectories: ['node_modules', 'js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/js/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Test results processor
  testResultsProcessor: '<rootDir>/tests/utils/test-results-processor.js',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/utils/global-setup.js',
  globalTeardown: '<rootDir>/tests/utils/global-teardown.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:8000'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/'
  ],
  
  // Coverage ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/build/',
    '/coverage/',
    '/jest.config.js',
    '/package.json'
  ]
};
