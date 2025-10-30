// Unit tests for PlacementSystem
describe('PlacementSystem', () => {
  let placementSystem;
  let mockCanvas;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = TestUtils.createMockCanvas();
    
    // Create placement system
    placementSystem = new PlacementSystem(32);
    placementSystem.setCanvas(mockCanvas);
    
    // Set up basic path for testing
    placementSystem.setPath([
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 }
    ]);
  });

  describe('Constructor', () => {
    test('should initialize with default grid size', () => {
      const system = new PlacementSystem();
      expect(system.gridSize).toBe(32);
    });

    test('should initialize with custom grid size', () => {
      const system = new PlacementSystem(64);
      expect(system.gridSize).toBe(64);
    });

    test('should initialize with empty grid', () => {
      expect(placementSystem.grid.size).toBe(0);
    });

    test('should initialize with placement mode disabled', () => {
      expect(placementSystem.placementMode).toBe(false);
    });
  });

  describe('Grid Operations', () => {
    test('should convert world coordinates to grid coordinates', () => {
      const gridPos = placementSystem.worldToGrid(100, 100);
      expect(gridPos.x).toBe(3); // 100 / 32 = 3.125, floor = 3
      expect(gridPos.y).toBe(3);
    });

    test('should convert grid coordinates to world coordinates', () => {
      const worldPos = placementSystem.gridToWorld(3, 3);
      expect(worldPos.x).toBe(96); // 3 * 32 = 96
      expect(worldPos.y).toBe(96);
    });

    test('should generate correct grid key', () => {
      const key = placementSystem.getGridKey(3, 3);
      expect(key).toBe('3,3');
    });
  });

  describe('Placement Validation', () => {
    test('should allow placement at valid grid position', () => {
      const isValid = placementSystem.isValidPlacement(5, 5);
      expect(isValid).toBe(true);
    });

    test('should reject placement on path', () => {
      // Test position that's on the path
      const gridPos = placementSystem.worldToGrid(100, 100);
      const isValid = placementSystem.isValidPlacement(gridPos.x, gridPos.y);
      expect(isValid).toBe(false);
    });

    test('should reject placement too close to existing monster', () => {
      // Place a monster first
      const monster = placementSystem.placeMonster(100, 100, 'GEM');
      expect(monster).toBeTruthy();

      // Try to place another monster too close
      const isValid = placementSystem.isValidPlacement(4, 4); // Close to existing monster
      expect(isValid).toBe(false);
    });

    test('should allow placement at sufficient distance from existing monster', () => {
      // Place a monster first
      const monster = placementSystem.placeMonster(100, 100, 'GEM');
      expect(monster).toBeTruthy();

      // Try to place another monster at sufficient distance
      const isValid = placementSystem.isValidPlacement(10, 10); // Far from existing monster
      expect(isValid).toBe(true);
    });
  });

  describe('Monster Placement', () => {
    test('should place monster at valid position', () => {
      const monster = placementSystem.placeMonster(200, 200, 'GEM');
      
      expect(monster).toBeTruthy();
      expect(monster.type).toBe('GEM');
      expect(placementSystem.grid.size).toBe(1);
    });

    test('should reject placement at invalid position', () => {
      const monster = placementSystem.placeMonster(100, 100, 'GEM'); // On path
      
      expect(monster).toBeNull();
      expect(placementSystem.grid.size).toBe(0);
    });

    test('should create monster with correct components', () => {
      const monster = placementSystem.placeMonster(200, 200, 'GEM');
      
      expect(monster).toBeTruthy();
      expect(monster.hasComponent('PositionComponent')).toBe(true);
      expect(monster.hasComponent('MonsterComponent')).toBe(true);
      expect(monster.hasComponent('SpriteRenderer')).toBe(true);
      expect(monster.hasTag('monster')).toBe(true);
    });

    test('should update grid when monster is placed', () => {
      const monster = placementSystem.placeMonster(200, 200, 'GEM');
      const gridPos = placementSystem.worldToGrid(200, 200);
      const key = placementSystem.getGridKey(gridPos.x, gridPos.y);
      
      expect(placementSystem.grid.has(key)).toBe(true);
      expect(placementSystem.grid.get(key)).toBe(monster);
    });
  });

  describe('Placement Mode', () => {
    test('should enter placement mode with selected monster', () => {
      placementSystem.enterPlacementMode('GEM');
      
      expect(placementSystem.placementMode).toBe(true);
      expect(placementSystem.selectedMonster).toBe('GEM');
    });

    test('should exit placement mode', () => {
      placementSystem.enterPlacementMode('GEM');
      placementSystem.exitPlacementMode();
      
      expect(placementSystem.placementMode).toBe(false);
      expect(placementSystem.selectedMonster).toBeNull();
    });

    test('should clear placement preview when exiting mode', () => {
      placementSystem.placementPreview = { x: 100, y: 100 };
      placementSystem.exitPlacementMode();
      
      expect(placementSystem.placementPreview).toBeNull();
    });
  });

  describe('Path Validation', () => {
    test('should detect position on path', () => {
      const isOnPath = placementSystem.isOnPathStrict(100, 100);
      expect(isOnPath).toBe(true);
    });

    test('should detect position not on path', () => {
      const isOnPath = placementSystem.isOnPathStrict(300, 300);
      expect(isOnPath).toBe(false);
    });

    test('should use tolerance for path detection', () => {
      // Test position slightly off path but within tolerance
      const isOnPath = placementSystem.isOnPathStrict(105, 105);
      expect(isOnPath).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle placement at canvas edges', () => {
      const monster = placementSystem.placeMonster(0, 0, 'GEM');
      expect(monster).toBeTruthy();
    });

    test('should handle placement at maximum canvas size', () => {
      const monster = placementSystem.placeMonster(800, 600, 'GEM');
      expect(monster).toBeTruthy();
    });

    test('should handle invalid monster type gracefully', () => {
      const monster = placementSystem.placeMonster(200, 200, 'INVALID');
      expect(monster).toBeNull();
    });

    test('should handle null path gracefully', () => {
      placementSystem.setPath(null);
      const isValid = placementSystem.isValidPlacement(100, 100);
      expect(isValid).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should handle large number of monsters efficiently', () => {
      const startTime = performance.now();
      
      // Place many monsters
      for (let i = 0; i < 100; i++) {
        const x = (i % 10) * 100 + 50;
        const y = Math.floor(i / 10) * 100 + 50;
        placementSystem.placeMonster(x, y, 'GEM');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
      expect(placementSystem.grid.size).toBe(100);
    });

    test('should validate placement efficiently', () => {
      const startTime = performance.now();
      
      // Validate many positions
      for (let i = 0; i < 1000; i++) {
        placementSystem.isValidPlacement(i % 20, Math.floor(i / 20));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Should complete in less than 50ms
    });
  });

  test('validatePlacement returns reason', () => {
    const result = placementSystem.validatePlacement(5, 5);
    expect(result.ok).toBe(true);
    expect(result.reason).toBe('valid');
  });
});





