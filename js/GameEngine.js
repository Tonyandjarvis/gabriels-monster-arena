class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        this.gameState = 'MENU'; // MENU, GAMEPLAY, PAUSE, GAME_OVER
        this.entities = new Map();
        this.systems = new Map();
        this.eventListeners = new Map();
        this.performanceMonitor = new PerformanceMonitor();
        this.saveSystem = new SaveSystem();
        this.settings = this.saveSystem.loadSettings();
        
        // Game systems
        this.placementSystem = null;
        this.combatSystem = null;
        this.pathfindingSystem = null;
        this.waveSystem = null;
        this.renderSystem = null;
        this.uiSystem = null;
        this.audioSystem = null;
        this.particleSystem = null;
        this.tutorialSystem = null;
        
        // Game state
        this.gameStats = {
            health: 100,
            maxHealth: 100,
            currency: 200, // Increased starting currency for better testing
            score: 0,
            wave: 1
        };
        
        // Input handling
        this.input = {
            mouse: { x: 0, y: 0, pressed: false },
            touch: { x: 0, y: 0, pressed: false }
        };
    }

    initialize() {
        try {
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Failed to get canvas context');
            }
            
            this.setupCanvas();
            this.setupSystems();
            this.setupEventListeners();
            this.setupGame();
            
            this.performanceMonitor.enable();
            this.isRunning = true;
            
            console.log('Game Engine initialized successfully');
        } catch (error) {
            console.error('Game Engine initialization failed:', error);
            this.handleInitializationError(error);
            throw error;
        }
    }

    handleInitializationError(error) {
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h2>Game Loading Error</h2>
            <p>Failed to initialize Gabriel's Monster Arena.</p>
            <p>Please refresh the page to try again.</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ff4444;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
    }

    setupCanvas() {
        // Set canvas size
        this.updateCanvasSize();
        
        // Set canvas style
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        
        // Handle window resize
        window.addEventListener('resize', () => this.updateCanvasSize());
        window.addEventListener('orientationchange', () => this.updateCanvasSize());
    }

    updateCanvasSize() {
        const isMobile = window.innerWidth <= 768;
        const targetWidth = isMobile ? window.innerWidth : 800;
        const targetHeight = isMobile ? window.innerHeight : 600;
        
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        this.canvas.style.width = targetWidth + 'px';
        this.canvas.style.height = targetHeight + 'px';
        
        // Update UI system if it exists
        if (this.uiSystem) {
            this.uiSystem.updateCanvasSize();
        }
    }

    setupSystems() {
        // Create systems
        this.placementSystem = new PlacementSystem(32);
        this.combatSystem = new CombatSystem();
        this.pathfindingSystem = new PathfindingSystem();
        this.waveSystem = new WaveSystem();
        this.renderSystem = new RenderSystem();
        this.uiSystem = new UISystem(this.canvas);
        this.uiSystem.gameEngine = this; // Set reference to game engine
        this.audioSystem = new AudioSystem();
        this.particleSystem = new ParticleSystem();
        this.tutorialSystem = new TutorialSystem();
        
        // Register systems
        this.systems.set('placement', this.placementSystem);
        this.systems.set('combat', this.combatSystem);
        this.systems.set('pathfinding', this.pathfindingSystem);
        this.systems.set('wave', this.waveSystem);
        this.systems.set('render', this.renderSystem);
        this.systems.set('ui', this.uiSystem);
        this.systems.set('audio', this.audioSystem);
        this.systems.set('particles', this.particleSystem);
        this.systems.set('tutorial', this.tutorialSystem);
        
        // Setup system relationships
        this.setupSystemRelationships();
        
        // Set cross-system references
        this.renderSystem.pathfindingSystem = this.pathfindingSystem;
    }

    setupSystemRelationships() {
        // Generate path for pathfinding system
        const start = { x: 50, y: 200 };
        const end = { x: this.canvas.width - 50, y: 400 };
        this.pathfindingSystem.generatePath(start, end);
        
        console.log(`Generated path with ${this.pathfindingSystem.path.length} points from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        
        // Set path for placement system
        this.placementSystem.setPath(this.pathfindingSystem.getPath());
        
        // Set spawn position for wave system
        this.waveSystem.spawnPosition = start;
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupGame() {
        // Load saved game if available
        const saveData = this.saveSystem.loadGame();
        if (saveData) {
            this.gameStats = { ...this.gameStats, ...saveData };
        }
        
        // Update UI with current stats
        this.uiSystem.updateGameStats(this.gameStats);
        
        // Add a test monster for debugging
        this.addTestMonster();
        
        // Start first wave
        this.startWave();
    }

    addTestMonster() {
        // Add a test monster to verify rendering works
        const testMonster = new Entity();
        testMonster.addComponent(new PositionComponent(100, 100));
        testMonster.addComponent(new MonsterComponent('GEM', MonsterComponent.TYPES.GEM.stats));
        testMonster.addComponent(new SpriteRenderer(32, 32, '#9c27b0'));
        testMonster.addTag('monster');
        
        this.entities.set(testMonster.id, testMonster);
        this.syncEntityWithSystems(testMonster);
        console.log('Test monster added at (100, 100), total entities:', this.entities.size);
    }

    startWave() {
        if (this.waveSystem.startWave()) {
            this.gameStats.wave = this.waveSystem.currentWave + 1;
            this.uiSystem.updateGameStats(this.gameStats);
        }
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mouse.x = e.clientX - rect.left;
        this.input.mouse.y = e.clientY - rect.top;
        this.input.mouse.pressed = true;
        
        this.handleInput(this.input.mouse.x, this.input.mouse.y, true);
    }

    handleMouseUp(e) {
        this.input.mouse.pressed = false;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mouse.x = e.clientX - rect.left;
        this.input.mouse.y = e.clientY - rect.top;
        
        if (this.placementSystem.placementMode) {
            this.placementSystem.updatePlacementPreview(this.input.mouse.x, this.input.mouse.y);
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.input.touch.x = e.touches[0].clientX - rect.left;
        this.input.touch.y = e.touches[0].clientY - rect.top;
        this.input.touch.pressed = true;
        
        this.handleInput(this.input.touch.x, this.input.touch.y, true);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.input.touch.pressed = false;
    }

    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.input.touch.x = e.touches[0].clientX - rect.left;
        this.input.touch.y = e.touches[0].clientY - rect.top;
        
        if (this.placementSystem.placementMode) {
            this.placementSystem.updatePlacementPreview(this.input.touch.x, this.input.touch.y);
        }
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'Escape':
                if (this.placementSystem.placementMode) {
                    this.placementSystem.exitPlacementMode();
                    this.uiSystem.exitPlacementMode();
                }
                break;
            case 'Space':
                e.preventDefault();
                if (this.gameState === 'GAMEPLAY') {
                    this.pauseGame();
                } else if (this.gameState === 'PAUSE') {
                    this.resumeGame();
                }
                break;
        }
    }

    handleKeyUp(e) {
        // Handle key up events if needed
    }

    handleInput(x, y, pressed) {
        if (!pressed) return;
        
        // Handle UI interactions first
        if (this.uiSystem.handleTouch(x, y)) {
            return;
        }
        
        // Handle monster placement
        if (this.uiSystem.placementMode && this.uiSystem.selectedMonster) {
            const monsterType = this.uiSystem.selectedMonster;
            const cost = MonsterComponent.TYPES[monsterType].stats.cost;
            
            console.log(`Attempting to place monster at (${x}, ${y}), cost: ${cost}, can afford: ${this.uiSystem.canAffordMonster(monsterType)}`);
            
            if (this.uiSystem.canAffordMonster(monsterType)) {
                const monster = this.placementSystem.placeMonster(x, y, monsterType);
                if (monster) {
                    console.log('Monster placed successfully!', monster);
                    this.uiSystem.spendCurrency(cost);
                    this.entities.set(monster.id, monster);
                    this.syncEntityWithSystems(monster);
                    console.log('Monster added to entities, total entities:', this.entities.size);
                    this.audioSystem.playSound('monster_place');
                    this.placementSystem.exitPlacementMode();
                    this.uiSystem.exitPlacementMode();
                    this.tutorialSystem.completeAction('place_monster');
                } else {
                    console.log('Monster placement failed - invalid position');
                }
            } else {
                console.log('Cannot afford monster');
            }
        }
        
        // Handle monster upgrades
        if (this.uiSystem.upgradeMode) {
            const gridPos = this.placementSystem.worldToGrid(x, y);
            const monster = this.placementSystem.getMonsterAt(gridPos.x, gridPos.y);
            
                if (monster) {
                    if (this.uiSystem.upgradeMonster(monster)) {
                        const monsterPos = monster.getComponent('PositionComponent');
                        this.particleSystem.createUpgradeEffect(monsterPos.x + 16, monsterPos.y + 16);
                        this.audioSystem.playSound('monster_upgrade');
                        this.uiSystem.exitUpgradeMode();
                        this.tutorialSystem.completeAction('upgrade_monster');
                    }
                } else {
                    this.uiSystem.exitUpgradeMode();
                }
        }
    }

    update(deltaTime) {
        if (!this.isRunning) return;
        
        try {
            // Cap deltaTime to prevent spiral of death
            const maxDeltaTime = 100; // 10 FPS minimum
            deltaTime = Math.min(deltaTime, maxDeltaTime);
            
            // Update performance monitor
            this.performanceMonitor.update(performance.now());
            this.performanceMonitor.updateEntityStats(this.entities);
            
            // Update systems with error handling
            this.systems.forEach(system => {
                if (system.enabled) {
                    try {
                        system.update(deltaTime);
                        
                        // Sync newly spawned entities from wave system
                        if (system === this.waveSystem) {
                            this.syncNewWaveEntities();
                        }
                    } catch (error) {
                        console.error(`Error updating system ${system.constructor.name}:`, error);
                        // Disable problematic system but continue game
                        system.enabled = false;
                    }
                }
            });
            
            // Update entities
            this.updateEntities(deltaTime);
            
            // Process combat events
            this.processCombatEvents();
            
            // Check game state
            this.checkGameState();
        } catch (error) {
            console.error('Critical error in game update loop:', error);
            // Try to recover by pausing the game
            this.pauseGame();
            this.showError('Game encountered an error and has been paused. Please refresh to continue.');
        }
    }

    showError(message) {
        console.error(message);
        // Could show error overlay to user
        if (this.ctx) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Error - Please Refresh', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    updateEntities(deltaTime) {
        // Update all entities
        this.entities.forEach(entity => {
            if (entity.active) {
                // Update entity components
                const monster = entity.getComponent('MonsterComponent');
                if (monster) {
                    monster.update(deltaTime);
                }
                
                const enemy = entity.getComponent('EnemyComponent');
                if (enemy) {
                    enemy.update(deltaTime);
                }
                
                const sprite = entity.getComponent('SpriteRenderer');
                if (sprite) {
                    sprite.update(deltaTime);
                }
            }
        });
        
        // Remove dead entities
        this.cleanupDeadEntities();
    }

    syncEntityWithSystems(entity) {
        // Add entity to all relevant systems
        this.renderSystem.addEntity(entity);
        this.combatSystem.addEntity(entity);
        this.waveSystem.addEntity(entity);
        
        // Add to placement system if it's a monster
        if (entity.hasTag('monster')) {
            this.placementSystem.addEntity(entity);
        }
    }

    syncNewWaveEntities() {
        // Sync newly spawned enemies from wave system
        this.waveSystem.entities.forEach(entity => {
            if (!this.entities.has(entity.id)) {
                this.entities.set(entity.id, entity);
                this.renderSystem.addEntity(entity);
                this.combatSystem.addEntity(entity);
                console.log('Synced new enemy entity:', entity.id);
            }
        });
    }

    cleanupDeadEntities() {
        const toRemove = [];
        
        this.entities.forEach(entity => {
            if (!entity.active) {
                toRemove.push(entity.id);
            } else {
                const enemy = entity.getComponent('EnemyComponent');
                if (enemy && enemy.isDead()) {
                    toRemove.push(entity.id);
                }
            }
        });
        
        toRemove.forEach(id => {
            const entity = this.entities.get(id);
            if (entity) {
                // Remove from all systems
                this.systems.forEach(system => {
                    system.removeEntity(entity);
                });
                entity.destroy();
                this.entities.delete(id);
            }
        });
    }

    processCombatEvents() {
        const events = this.waveSystem.getCombatEvents();
        
        events.forEach(event => {
            switch (event.type) {
                case 'enemy_died':
                    this.handleEnemyDeath(event);
                    break;
                case 'wave_completed':
                    this.handleWaveCompleted(event);
                    break;
                case 'enemy_reached_end':
                    this.handleEnemyReachedEnd(event);
                    break;
                case 'monster_leveled_up':
                    console.log(`Monster leveled up to level ${event.newLevel}`);
                    const monsterPos = event.monster.getComponent('PositionComponent');
                    this.particleSystem.createLevelUpEffect(monsterPos.x + 16, monsterPos.y + 16);
                    break;
            }
        });
    }

    handleEnemyDeath(event) {
        this.uiSystem.addCurrency(event.reward);
        this.uiSystem.addScore(event.reward * 10);
        this.audioSystem.playSound('enemy_die');
        this.tutorialSystem.completeAction('earn_currency');
        
        // Create death particle effect
        const enemyPos = event.enemy.getComponent('PositionComponent');
        this.particleSystem.createExplosion(enemyPos.x + 16, enemyPos.y + 16, '#ff6b6b', 6);
        
        this.waveSystem.onEnemyDied(event.enemy);
    }

    handleWaveCompleted(event) {
        this.uiSystem.addCurrency(event.reward);
        this.uiSystem.addScore(event.reward * 5);
        this.audioSystem.playSound('wave_complete');
        
        // Start next wave after a delay
        setTimeout(() => {
            this.startWave();
        }, 2000);
    }

    handleEnemyReachedEnd(event) {
        this.uiSystem.takeDamage(event.damage);
        
        if (this.uiSystem.getGameStats().health <= 0) {
            this.gameOver();
        }
    }

    checkGameState() {
        if (this.uiSystem.getGameStats().health <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameState = 'GAME_OVER';
        this.isRunning = false;
        this.audioSystem.playSound('game_over');
        
        // Save high score
        const currentScore = this.uiSystem.getGameStats().score;
        const saveData = this.saveSystem.loadGame();
        if (!saveData || currentScore > saveData.highScore) {
            this.saveSystem.saveGame({
                ...this.uiSystem.getGameStats(),
                highScore: currentScore
            });
        }
        
        console.log('Game Over! Final Score:', currentScore);
    }

    pauseGame() {
        this.gameState = 'PAUSE';
        this.isRunning = false;
        this.audioSystem.stopMusic();
    }

    resumeGame() {
        this.gameState = 'GAMEPLAY';
        this.isRunning = true;
        this.audioSystem.playMusic();
    }

    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render systems
        console.log(`Rendering with ${this.entities.size} entities in GameEngine`);
        this.systems.forEach(system => {
            if (system.enabled) {
                if (system === this.renderSystem) {
                    console.log(`RenderSystem has ${system.entities.size} entities`);
                }
                system.render(this.ctx);
            }
        });
        
        // Render pause menu if paused
        if (this.gameState === 'PAUSE') {
            this.renderPauseMenu(this.ctx);
        }
        
        // Render game over screen if game over
        if (this.gameState === 'GAME_OVER') {
            this.renderGameOverScreen(this.ctx);
        }
        
        // Render tutorial overlay if active
        if (this.tutorialSystem.isActive()) {
            this.tutorialSystem.render(this.ctx);
        }
        
        // Render performance monitor if enabled
        if (this.settings.showFPS) {
            this.performanceMonitor.render(this.ctx);
        }
    }

    gameLoop(currentTime) {
        if (!this.isRunning) {
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        // Calculate deltaTime and cap it
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Frame rate stabilization
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
        
        // Only update if enough time has passed (target 60 FPS)
        if (this.deltaTime >= this.frameTime) {
            // Update game
            this.update(this.deltaTime);
            
            // Render game
            this.render();
        }
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        this.gameState = 'GAMEPLAY';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.lastFPSUpdate = this.lastTime;
        this.gameLoop(this.lastTime);
    }

    stop() {
        this.isRunning = false;
    }

    destroy() {
        this.stop();
        
        // Clean up entities
        this.entities.forEach(entity => entity.destroy());
        this.entities.clear();
        
        // Clean up systems
        this.systems.forEach(system => system.destroy());
        this.systems.clear();
        
        // Remove event listeners
        // (In a real implementation, you'd want to properly remove all event listeners)
        
        console.log('Game Engine destroyed');
    }

    renderPauseMenu(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        ctx.font = '18px Arial';
        ctx.fillText('Press SPACE to resume', this.canvas.width / 2, this.canvas.height / 2 + 20);
        ctx.fillText('Press ESC to exit upgrade mode', this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        ctx.restore();
    }

    renderGameOverScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${this.uiSystem.getGameStats().score}`, this.canvas.width / 2, this.canvas.height / 2 - 40);
        
        ctx.font = '18px Arial';
        ctx.fillText('Refresh the page to play again', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        ctx.restore();
    }
}
