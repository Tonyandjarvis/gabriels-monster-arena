// Performance tests for FPS stability
describe('FPS Stability Performance Tests', () => {
  let gameEngine;
  let mockCanvas;
  let performanceData;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = TestUtils.createMockCanvas();
    
    // Create game engine
    gameEngine = new GameEngine();
    gameEngine.canvas = mockCanvas;
    gameEngine.ctx = mockCanvas.getContext('2d');
    
    // Initialize systems
    gameEngine.setupSystems();
    gameEngine.setupGame();
    
    // Reset performance data
    performanceData = {
      frameTimes: [],
      fps: [],
      memoryUsage: [],
      entityCounts: []
    };
  });

  afterEach(() => {
    if (gameEngine) {
      gameEngine.destroy();
    }
  });

  describe('Basic FPS Stability', () => {
    test('should maintain 60 FPS with minimal entities', () => {
      const targetFPS = 60;
      const targetFrameTime = 1000 / targetFPS; // 16.67ms
      const testDuration = 1000; // 1 second
      const startTime = performance.now();
      
      // Run game loop for 1 second
      while (performance.now() - startTime < testDuration) {
        const frameStart = performance.now();
        gameEngine.update(16.67);
        gameEngine.render(gameEngine.ctx);
        const frameEnd = performance.now();
        
        const frameTime = frameEnd - frameStart;
        performanceData.frameTimes.push(frameTime);
      }
      
      // Calculate average FPS
      const averageFrameTime = performanceData.frameTimes.reduce((a, b) => a + b, 0) / performanceData.frameTimes.length;
      const averageFPS = 1000 / averageFrameTime;
      
      expect(averageFPS).toBeGreaterThanOrEqual(55); // Allow 5 FPS tolerance
      expect(averageFrameTime).toBeLessThanOrEqual(targetFrameTime * 1.1); // 10% tolerance
    });

    test('should maintain stable FPS with moderate entity count', () => {
      // Add moderate number of entities
      for (let i = 0; i < 20; i++) {
        const x = (i % 5) * 100 + 50;
        const y = Math.floor(i / 5) * 100 + 50;
        gameEngine.placementSystem.placeMonster(x, y, 'GEM');
      }
      
      const targetFPS = 60;
      const testDuration = 1000; // 1 second
      const startTime = performance.now();
      
      // Run game loop
      while (performance.now() - startTime < testDuration) {
        const frameStart = performance.now();
        gameEngine.update(16.67);
        gameEngine.render(gameEngine.ctx);
        const frameEnd = performance.now();
        
        const frameTime = frameEnd - frameStart;
        performanceData.frameTimes.push(frameTime);
      }
      
      // Calculate performance metrics
      const averageFrameTime = performanceData.frameTimes.reduce((a, b) => a + b, 0) / performanceData.frameTimes.length;
      const averageFPS = 1000 / averageFrameTime;
      
      expect(averageFPS).toBeGreaterThanOrEqual(50); // Allow 10 FPS tolerance
      expect(averageFrameTime).toBeLessThanOrEqual(20); // 20ms max frame time
    });
  });

  describe('High Load Performance', () => {
    test('should handle high entity count without significant FPS drop', () => {
      // Add high number of entities
      for (let i = 0; i < 100; i++) {
        const x = (i % 10) * 80 + 40;
        const y = Math.floor(i / 10) * 80 + 40;
        gameEngine.placementSystem.placeMonster(x, y, 'GEM');
      }
      
      // Start wave to add enemies
      gameEngine.startWave();
      
      const testDuration = 2000; // 2 seconds
      const startTime = performance.now();
      
      // Run game loop
      while (performance.now() - startTime < testDuration) {
        const frameStart = performance.now();
        gameEngine.update(16.67);
        gameEngine.render(gameEngine.ctx);
        const frameEnd = performance.now();
        
        const frameTime = frameEnd - frameStart;
        performanceData.frameTimes.push(frameTime);
      }
      
      // Calculate performance metrics
      const averageFrameTime = performanceData.frameTimes.reduce((a, b) => a + b, 0) / performanceData.frameTimes.length;
      const averageFPS = 1000 / averageFrameTime;
      
      expect(averageFPS).toBeGreaterThanOrEqual(30); // Should maintain at least 30 FPS
      expect(averageFrameTime).toBeLessThanOrEqual(33.33); // 30 FPS = 33.33ms frame time
    });

    test('should handle rapid entity creation and destruction', () => {
      const testDuration = 1000; // 1 second
      const startTime = performance.now();
      let entityCount = 0;
      
      // Run game loop with rapid entity changes
      while (performance.now() - startTime < testDuration) {
        const frameStart = performance.now();
        
        // Create new entities every 10 frames
        if (entityCount % 10 === 0) {
          for (let i = 0; i < 5; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 600;
            gameEngine.placementSystem.placeMonster(x, y, 'GEM');
          }
        }
        
        // Destroy old entities every 20 frames
        if (entityCount % 20 === 0 && gameEngine.entities.size > 50) {
          const entitiesToRemove = Array.from(gameEngine.entities.values()).slice(0, 10);
          entitiesToRemove.forEach(entity => {
            gameEngine.entities.delete(entity.id);
          });
        }
        
        gameEngine.update(16.67);
        gameEngine.render(gameEngine.ctx);
        
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        performanceData.frameTimes.push(frameTime);
        performanceData.entityCounts.push(gameEngine.entities.size);
        
        entityCount++;
      }
      
      // Calculate performance metrics
      const averageFrameTime = performanceData.frameTimes.reduce((a, b) => a + b, 0) / performanceData.frameTimes.length;
      const averageFPS = 1000 / averageFrameTime;
      
      expect(averageFPS).toBeGreaterThanOrEqual(40); // Should maintain at least 40 FPS
      expect(averageFrameTime).toBeLessThanOrEqual(25); // 25ms max frame time
    });
  });

  describe('Memory Performance', () => {
    test('should not have memory leaks during extended play', () => {
      const testDuration = 5000; // 5 seconds
      const startTime = performance.now();
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Run game loop with entity creation and destruction
      while (performance.now() - startTime < testDuration) {
        // Create entities
        if (Math.random() < 0.1) {
          const x = Math.random() * 800;
          const y = Math.random() * 600;
          gameEngine.placementSystem.placeMonster(x, y, 'GEM');
        }
        
        // Destroy entities
        if (gameEngine.entities.size > 20 && Math.random() < 0.05) {
          const entitiesToRemove = Array.from(gameEngine.entities.values()).slice(0, 5);
          entitiesToRemove.forEach(entity => {
            gameEngine.entities.delete(entity.id);
          });
        }
        
        gameEngine.update(16.67);
        gameEngine.render(gameEngine.ctx);
        
        // Record memory usage
        if (performance.memory) {
          performanceData.memoryUsage.push(performance.memory.usedJSHeapSize);
        }
      }
      
      // Check for memory leaks
      if (performance.memory) {
        const finalMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test('should handle garbage collection efficiently', () => {
      const testDuration = 3000; // 3 seconds
      const startTime = performance.now();
      
      // Run game loop with frequent object creation
      while (performance.now() - startTime < testDuration) {
        // Create temporary objects
        const tempObjects = [];
        for (let i = 0; i < 100; i++) {
          tempObjects.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            data: new Array(100).fill(0)
          });
        }
        
        gameEngine.update(16.67);
        gameEngine.render(gameEngine.ctx);
        
        // Objects should be garbage collected
        // No explicit cleanup needed
      }
      
      // Game should continue to run smoothly
      expect(gameEngine.isRunning).toBe(true);
    });
  });

  describe('System Performance', () => {
    test('should maintain performance across all systems', () => {
      // Add entities to all systems
      for (let i = 0; i < 30; i++) {
        const x = (i % 6) * 100 + 50;
        const y = Math.floor(i / 6) * 100 + 50;
        gameEngine.placementSystem.placeMonster(x, y, 'GEM');
      }
      
      // Start wave to activate all systems
      gameEngine.startWave();
      
      const testDuration = 1000; // 1 second
      const startTime = performance.now();
      
      // Run game loop
      while (performance.now() - startTime < testDuration) {
        const frameStart = performance.now();
        
        // Update all systems
        gameEngine.update(16.67);
        gameEngine.render(gameEngine.ctx);
        
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        performanceData.frameTimes.push(frameTime);
      }
      
      // Calculate performance metrics
      const averageFrameTime = performanceData.frameTimes.reduce((a, b) => a + b, 0) / performanceData.frameTimes.length;
      const averageFPS = 1000 / averageFrameTime;
      
      expect(averageFPS).toBeGreaterThanOrEqual(45); // Should maintain at least 45 FPS
      expect(averageFrameTime).toBeLessThanOrEqual(22.22); // 45 FPS = 22.22ms frame time
    });

    test('should handle system errors without performance impact', () => {
      // Simulate system errors
      const originalUpdate = gameEngine.combatSystem.update;
      gameEngine.combatSystem.update = jest.fn(() => {
        if (Math.random() < 0.01) { // 1% chance of error
          throw new Error('Simulated system error');
        }
        originalUpdate.call(gameEngine.combatSystem, 16.67);
      });
      
      const testDuration = 1000; // 1 second
      const startTime = performance.now();
      
      // Run game loop
      while (performance.now() - startTime < testDuration) {
        const frameStart = performance.now();
        
        try {
          gameEngine.update(16.67);
          gameEngine.render(gameEngine.ctx);
        } catch (error) {
          // Errors should be handled gracefully
        }
        
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        performanceData.frameTimes.push(frameTime);
      }
      
      // Restore original function
      gameEngine.combatSystem.update = originalUpdate;
      
      // Calculate performance metrics
      const averageFrameTime = performanceData.frameTimes.reduce((a, b) => a + b, 0) / performanceData.frameTimes.length;
      const averageFPS = 1000 / averageFrameTime;
      
      expect(averageFPS).toBeGreaterThanOrEqual(50); // Should maintain good performance
    });
  });

  describe('Performance Reporting', () => {
    test('should generate performance report', () => {
      const testDuration = 1000; // 1 second
      const startTime = performance.now();
      
      // Run game loop
      while (performance.now() - startTime < testDuration) {
        const frameStart = performance.now();
        gameEngine.update(16.67);
        gameEngine.render(gameEngine.ctx);
        const frameEnd = performance.now();
        
        const frameTime = frameEnd - frameStart;
        performanceData.frameTimes.push(frameTime);
      }
      
      // Generate performance report
      const report = generatePerformanceReport(performanceData);
      
      expect(report.averageFPS).toBeGreaterThan(0);
      expect(report.averageFrameTime).toBeGreaterThan(0);
      expect(report.minFPS).toBeGreaterThan(0);
      expect(report.maxFPS).toBeGreaterThan(0);
      expect(report.frameCount).toBe(performanceData.frameTimes.length);
    });
  });
});

// Helper function to generate performance report
function generatePerformanceReport(data) {
  const frameTimes = data.frameTimes;
  const fps = frameTimes.map(time => 1000 / time);
  
  return {
    averageFPS: fps.reduce((a, b) => a + b, 0) / fps.length,
    averageFrameTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
    minFPS: Math.min(...fps),
    maxFPS: Math.max(...fps),
    frameCount: frameTimes.length,
    totalTime: frameTimes.reduce((a, b) => a + b, 0)
  };
}


