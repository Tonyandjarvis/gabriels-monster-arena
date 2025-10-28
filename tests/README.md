# Gabriel's Monster Arena - Testing Framework

## Overview
This directory contains the comprehensive test suite for Gabriel's Monster Arena. The testing framework is designed to ensure code quality, system reliability, and performance optimization.

## Test Structure

### Directory Organization
```
tests/
├── unit/                    # Unit tests for individual systems and components
├── integration/             # Integration tests for system interactions
├── performance/             # Performance tests for optimization
├── utils/                   # Test utilities and mocks
├── fixtures/                # Test data and fixtures
└── README.md               # This file
```

## Test Types

### Unit Tests
Unit tests verify the functionality of individual systems and components in isolation. Each test focuses on a single unit of code and ensures it behaves correctly under various conditions.

**Coverage Target**: 80%+ code coverage for critical systems

**Test Files**:
- `PlacementSystem.test.js` - Monster placement logic
- `CombatSystem.test.js` - Combat mechanics and targeting
- `PathfindingSystem.test.js` - Path generation and enemy movement
- `WaveSystem.test.js` - Wave progression and enemy spawning
- `UISystem.test.js` - User interface and interactions
- `AudioSystem.test.js` - Audio playback and management
- `ParticleSystem.test.js` - Particle effects and rendering
- `TutorialSystem.test.js` - Tutorial progression and guidance
- `PerformanceMonitor.test.js` - Performance monitoring and metrics

### Integration Tests
Integration tests verify that multiple systems work together correctly. These tests ensure proper communication between systems and validate the overall game flow.

**Test Files**:
- `game-flow.test.js` - Complete gameplay loop testing
- `system-integration.test.js` - Cross-system communication
- `save-load.test.js` - Game state persistence
- `input-handling.test.js` - User input processing

### Performance Tests
Performance tests ensure the game maintains acceptable performance under various conditions. These tests measure frame rate, memory usage, and system responsiveness.

**Test Files**:
- `fps-stability.test.js` - Frame rate stability testing
- `memory-leaks.test.js` - Memory leak detection
- `mobile-simulation.test.js` - Mobile device simulation
- `load-testing.test.js` - High-load scenario testing

## Test Utilities

### Mock Objects
- `MockCanvas` - Canvas rendering mock
- `MockAudioContext` - Audio context mock
- `MockEntity` - Entity mock for testing
- `MockSystem` - System mock for testing

### Test Helpers
- `TestDataGenerator` - Generates test data for various scenarios
- `PerformanceProfiler` - Performance measurement utilities
- `AssertionHelpers` - Custom assertion functions
- `TestEnvironment` - Test environment setup and teardown

## Running Tests

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Modern web browser for integration tests

### Installation
```bash
npm install --save-dev jest @testing-library/jest-dom
```

### Running All Tests
```bash
npm test
```

### Running Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance
```

### Running Tests with Coverage
```bash
npm run test:coverage
```

## Test Configuration

### Jest Configuration
The test suite uses Jest as the primary testing framework. Configuration is managed through `jest.config.js`.

### Test Environment
Tests run in a simulated browser environment using jsdom for DOM manipulation and canvas rendering.

## Writing Tests

### Unit Test Example
```javascript
describe('PlacementSystem', () => {
    let placementSystem;
    let mockCanvas;

    beforeEach(() => {
        mockCanvas = new MockCanvas();
        placementSystem = new PlacementSystem(32);
        placementSystem.setCanvas(mockCanvas);
    });

    test('should place monster at valid grid position', () => {
        const monster = placementSystem.placeMonster(100, 100, 'GEM');
        expect(monster).toBeTruthy();
        expect(monster.type).toBe('GEM');
    });

    test('should reject placement on path', () => {
        placementSystem.setPath([{x: 100, y: 100}]);
        const monster = placementSystem.placeMonster(100, 100, 'GEM');
        expect(monster).toBeNull();
    });
});
```

### Integration Test Example
```javascript
describe('Game Flow Integration', () => {
    let gameEngine;

    beforeEach(() => {
        gameEngine = new GameEngine();
        gameEngine.initialize();
    });

    test('should complete full gameplay loop', async () => {
        // Place monster
        const monster = gameEngine.placementSystem.placeMonster(100, 100, 'GEM');
        expect(monster).toBeTruthy();

        // Start wave
        gameEngine.startWave();
        expect(gameEngine.waveSystem.waveActive).toBe(true);

        // Wait for wave completion
        await waitForWaveCompletion(gameEngine);
        expect(gameEngine.waveSystem.waveComplete).toBe(true);
    });
});
```

## Test Data Management

### Fixtures
Test fixtures are stored in the `fixtures/` directory and contain:
- Sample game states
- Test entity configurations
- Mock asset data
- Performance test scenarios

### Test Data Generation
The `TestDataGenerator` utility provides methods for generating:
- Random game states
- Test entities with various configurations
- Performance test scenarios
- Edge case data

## Performance Testing

### Metrics Tracked
- **Frame Rate**: Target 60 FPS on mid-range devices
- **Memory Usage**: Monitor for memory leaks
- **CPU Usage**: Ensure efficient CPU utilization
- **Load Time**: Measure game initialization time
- **Response Time**: Measure user interaction responsiveness

### Performance Baselines
- **Desktop**: 60 FPS, <100MB memory usage
- **Mobile**: 30+ FPS, <50MB memory usage
- **Load Time**: <3 seconds on 3G connection
- **Response Time**: <100ms for user interactions

## Continuous Integration

### Automated Testing
Tests run automatically on:
- Code commits
- Pull requests
- Release builds
- Nightly builds

### Test Reporting
Test results are reported through:
- Console output
- HTML coverage reports
- Performance metrics
- Test result artifacts

## Best Practices

### Test Writing
1. **Write descriptive test names** that clearly indicate what is being tested
2. **Use AAA pattern** (Arrange, Act, Assert) for test structure
3. **Test edge cases** and error conditions
4. **Keep tests independent** - each test should be able to run in isolation
5. **Use mocks and stubs** to isolate units under test

### Test Maintenance
1. **Update tests** when code changes
2. **Remove obsolete tests** that are no longer relevant
3. **Refactor tests** to improve readability and maintainability
4. **Monitor test performance** and optimize slow tests

### Coverage Goals
- **Critical Systems**: 90%+ coverage
- **Core Systems**: 80%+ coverage
- **Utility Functions**: 70%+ coverage
- **Overall Project**: 75%+ coverage

## Troubleshooting

### Common Issues
1. **Canvas Mock Issues**: Ensure MockCanvas is properly configured
2. **Audio Context Issues**: Use MockAudioContext for audio tests
3. **Async Test Issues**: Use proper async/await patterns
4. **Memory Leaks**: Monitor test cleanup and teardown

### Debug Tips
1. Use `console.log` for debugging test issues
2. Run tests in isolation to identify problems
3. Check test environment setup
4. Verify mock object configurations

## Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Follow existing test patterns and naming conventions
3. Add test to test suite configuration
4. Update documentation as needed

### Test Review Process
1. All new tests must pass before merging
2. Test coverage must meet minimum requirements
3. Tests must be reviewed for quality and completeness
4. Performance tests must meet baseline requirements

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [Performance Testing Guide](https://web.dev/performance-testing/)

### Tools
- [Jest](https://jestjs.io/) - Testing framework
- [Testing Library](https://testing-library.com/) - Testing utilities
- [jsdom](https://github.com/jsdom/jsdom) - DOM simulation
- [Performance Observer](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) - Performance monitoring





