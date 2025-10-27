// Integration tests for complete game flow
describe('Game Flow Integration', () => {
  let gameEngine;
  let mockCanvas;

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
  });

  afterEach(() => {
    if (gameEngine) {
      gameEngine.destroy();
    }
  });

  describe('Game Initialization', () => {
    test('should initialize all systems correctly', () => {
      expect(gameEngine.placementSystem).toBeTruthy();
      expect(gameEngine.combatSystem).toBeTruthy();
      expect(gameEngine.pathfindingSystem).toBeTruthy();
      expect(gameEngine.waveSystem).toBeTruthy();
      expect(gameEngine.renderSystem).toBeTruthy();
      expect(gameEngine.uiSystem).toBeTruthy();
      expect(gameEngine.audioSystem).toBeTruthy();
      expect(gameEngine.particleSystem).toBeTruthy();
      expect(gameEngine.tutorialSystem).toBeTruthy();
    });

    test('should set up game state correctly', () => {
      expect(gameEngine.gameStats.health).toBe(100);
      expect(gameEngine.gameStats.currency).toBe(200);
      expect(gameEngine.gameStats.wave).toBe(1);
    });

    test('should generate path correctly', () => {
      expect(gameEngine.pathfindingSystem.path.length).toBeGreaterThan(0);
    });
  });

  describe('Monster Placement Flow', () => {
    test('should complete monster placement flow', () => {
      // Select monster type
      gameEngine.uiSystem.selectMonster('GEM');
      expect(gameEngine.uiSystem.selectedMonster).toBe('GEM');
      expect(gameEngine.uiSystem.placementMode).toBe(true);

      // Place monster
      const monster = gameEngine.placementSystem.placeMonster(200, 200, 'GEM');
      expect(monster).toBeTruthy();
      expect(gameEngine.entities.has(monster.id)).toBe(true);

      // Verify monster is added to systems
      expect(gameEngine.renderSystem.entities.has(monster.id)).toBe(true);
      expect(gameEngine.combatSystem.entities.has(monster.id)).toBe(true);
    });

    test('should handle monster placement with insufficient currency', () => {
      // Set currency to 0
      gameEngine.gameStats.currency = 0;
      gameEngine.uiSystem.updateGameStats(gameEngine.gameStats);

      // Try to place monster
      const monster = gameEngine.placementSystem.placeMonster(200, 200, 'GEM');
      expect(monster).toBeNull();
    });

    test('should deduct currency when monster is placed', () => {
      const initialCurrency = gameEngine.gameStats.currency;
      const monsterCost = MonsterComponent.TYPES.GEM.stats.cost;

      // Place monster
      const monster = gameEngine.placementSystem.placeMonster(200, 200, 'GEM');
      expect(monster).toBeTruthy();

      // Verify currency was deducted
      expect(gameEngine.gameStats.currency).toBe(initialCurrency - monsterCost);
    });
  });

  describe('Wave System Integration', () => {
    test('should start wave correctly', () => {
      // Start wave
      gameEngine.startWave();
      
      expect(gameEngine.waveSystem.waveActive).toBe(true);
      expect(gameEngine.waveSystem.currentWave).toBe(1);
    });

    test('should spawn enemies during wave', async () => {
      // Start wave
      gameEngine.startWave();
      
      // Wait for enemies to spawn
      await TestUtils.waitFor(() => {
        return gameEngine.waveSystem.enemiesSpawned > 0;
      }, 5000);
      
      expect(gameEngine.waveSystem.enemiesSpawned).toBeGreaterThan(0);
    });

    test('should complete wave when all enemies are defeated', async () => {
      // Place a monster to defend
      const monster = gameEngine.placementSystem.placeMonster(200, 200, 'GEM');
      expect(monster).toBeTruthy();

      // Start wave
      gameEngine.startWave();
      
      // Wait for wave completion
      await TestUtils.waitFor(() => {
        return gameEngine.waveSystem.waveComplete;
      }, 10000);
      
      expect(gameEngine.waveSystem.waveComplete).toBe(true);
    });
  });

  describe('Combat System Integration', () => {
    test('should handle monster attacking enemy', async () => {
      // Place a monster
      const monster = gameEngine.placementSystem.placeMonster(200, 200, 'GEM');
      expect(monster).toBeTruthy();

      // Start wave to spawn enemies
      gameEngine.startWave();
      
      // Wait for enemies to spawn
      await TestUtils.waitFor(() => {
        return gameEngine.waveSystem.enemiesSpawned > 0;
      }, 5000);
      
      // Wait for combat to occur
      await TestUtils.waitFor(() => {
        return gameEngine.combatSystem.projectiles.length > 0;
      }, 5000);
      
      expect(gameEngine.combatSystem.projectiles.length).toBeGreaterThan(0);
    });

    test('should handle enemy death and rewards', async () => {
      // Place a monster
      const monster = gameEngine.placementSystem.placeMonster(200, 200, 'GEM');
      expect(monster).toBeTruthy();

      // Start wave
      gameEngine.startWave();
      
      // Wait for combat events
      await TestUtils.waitFor(() => {
        const events = gameEngine.combatSystem.getCombatEvents();
        return events.some(event => event.type === 'enemy_died');
      }, 10000);
      
      const events = gameEngine.combatSystem.getCombatEvents();
      const enemyDiedEvent = events.find(event => event.type === 'enemy_died');
      expect(enemyDiedEvent).toBeTruthy();
    });

    test('should handle monster leveling up', async () => {
      // Place a monster
      const monster = gameEngine.placementSystem.placeMonster(200, 200, 'GEM');
      expect(monster).toBeTruthy();

      // Start wave
      gameEngine.startWave();
      
      // Wait for monster to gain experience
      await TestUtils.waitFor(() => {
        const monsterComp = monster.getComponent('MonsterComponent');
        return monsterComp.experience > 0;
      }, 10000);
      
      const monsterComp = monster.getComponent('MonsterComponent');
      expect(monsterComp.experience).toBeGreaterThan(0);
    });
  });

  describe('UI System Integration', () => {
    test('should handle button interactions correctly', () => {
      // Test monster selection button
      const monsterButton = gameEngine.uiSystem.buttons.find(btn => btn.monsterType === 'GEM');
      expect(monsterButton).toBeTruthy();
      
      // Simulate button click
      monsterButton.onClick();
      expect(gameEngine.uiSystem.selectedMonster).toBe('GEM');
    });

    test('should handle start wave button', () => {
      // Test start wave button
      const startButton = gameEngine.uiSystem.buttons.find(btn => btn.text === 'START');
      expect(startButton).toBeTruthy();
      
      // Simulate button click
      startButton.onClick();
      expect(gameEngine.waveSystem.waveActive).toBe(true);
    });

    test('should update game stats correctly', () => {
      const initialCurrency = gameEngine.gameStats.currency;
      
      // Add currency
      gameEngine.uiSystem.addCurrency(50);
      expect(gameEngine.gameStats.currency).toBe(initialCurrency + 50);
      
      // Add score
      gameEngine.uiSystem.addScore(100);
      expect(gameEngine.gameStats.score).toBe(100);
    });
  });

  describe('Save/Load Integration', () => {
    test('should save and load game state correctly', () => {
      // Modify game state
      gameEngine.gameStats.currency = 500;
      gameEngine.gameStats.score = 1000;
      
      // Save game
      gameEngine.saveSystem.saveGame('test-save', gameEngine.gameStats);
      
      // Load game
      const loadedStats = gameEngine.saveSystem.loadGame('test-save');
      expect(loadedStats.currency).toBe(500);
      expect(loadedStats.score).toBe(1000);
    });

    test('should handle save/load with entities', () => {
      // Place a monster
      const monster = gameEngine.placementSystem.placeMonster(200, 200, 'GEM');
      expect(monster).toBeTruthy();
      
      // Save game with entities
      const gameState = {
        stats: gameEngine.gameStats,
        entities: Array.from(gameEngine.entities.values())
      };
      gameEngine.saveSystem.saveGame('test-save', gameState);
      
      // Load game
      const loadedState = gameEngine.saveSystem.loadGame('test-save');
      expect(loadedState.entities.length).toBe(1);
    });
  });

  describe('Performance Integration', () => {
    test('should maintain performance with many entities', () => {
      const startTime = performance.now();
      
      // Place many monsters
      for (let i = 0; i < 50; i++) {
        const x = (i % 10) * 100 + 50;
        const y = Math.floor(i / 10) * 100 + 50;
        gameEngine.placementSystem.placeMonster(x, y, 'GEM');
      }
      
      // Start wave to spawn enemies
      gameEngine.startWave();
      
      // Update game for several frames
      for (let i = 0; i < 60; i++) {
        gameEngine.update(16.67); // 60 FPS
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test('should handle rapid input correctly', () => {
      // Simulate rapid button clicks
      const monsterButton = gameEngine.uiSystem.buttons.find(btn => btn.monsterType === 'GEM');
      
      for (let i = 0; i < 10; i++) {
        monsterButton.onClick();
      }
      
      // Should only have one monster selected
      expect(gameEngine.uiSystem.selectedMonster).toBe('GEM');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid monster placement gracefully', () => {
      // Try to place monster at invalid position
      const monster = gameEngine.placementSystem.placeMonster(100, 100, 'GEM'); // On path
      expect(monster).toBeNull();
      
      // Game should continue to function
      expect(gameEngine.gameStats.currency).toBe(200);
    });

    test('should handle system errors gracefully', () => {
      // Simulate system error
      const originalUpdate = gameEngine.combatSystem.update;
      gameEngine.combatSystem.update = jest.fn(() => {
        throw new Error('Test error');
      });
      
      // Game should continue to function
      expect(() => gameEngine.update(16.67)).not.toThrow();
      
      // Restore original function
      gameEngine.combatSystem.update = originalUpdate;
    });
  });
});


