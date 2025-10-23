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
            currency: 100,
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
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.canvas || !this.ctx) {
            throw new Error('Failed to get canvas or context');
        }
        
        this.setupCanvas();
        this.setupSystems();
        this.setupEventListeners();
        this.setupGame();
        
        this.performanceMonitor.enable();
        this.isRunning = true;
        
        console.log('Game Engine initialized successfully');
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
    }

    setupSystemRelationships() {
        // Generate path for pathfinding system
        const start = { x: 50, y: 200 };
        const end = { x: this.canvas.width - 50, y: 400 };
        this.pathfindingSystem.generatePath(start, end);
        
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
        
        // Start first wave
        this.startWave();
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
        if (this.placementSystem.placementMode && this.uiSystem.selectedMonster) {
            const monsterType = this.uiSystem.selectedMonster;
            const cost = MonsterComponent.TYPES[monsterType].stats.cost;
            
            if (this.uiSystem.canAffordMonster(monsterType)) {
                const monster = this.placementSystem.placeMonster(x, y, monsterType);
                if (monster) {
                    this.uiSystem.spendCurrency(cost);
                    this.entities.set(monster.id, monster);
                    this.audioSystem.playSound('monster_place');
                    this.placementSystem.exitPlacementMode();
                    this.uiSystem.exitPlacementMode();
                    this.tutorialSystem.completeAction('place_monster');
                }
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
        
        // Update performance monitor
        this.performanceMonitor.update(performance.now());
        this.performanceMonitor.updateEntityStats(this.entities);
        
        // Update systems
        this.systems.forEach(system => {
            if (system.enabled) {
                system.update(deltaTime);
            }
        });
        
        // Update entities
        this.updateEntities(deltaTime);
        
        // Process combat events
        this.processCombatEvents();
        
        // Check game state
        this.checkGameState();
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
        this.systems.forEach(system => {
            if (system.enabled) {
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
        
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game
        this.update(this.deltaTime);
        
        // Render game
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        this.gameState = 'GAMEPLAY';
        this.isRunning = true;
        this.lastTime = performance.now();
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
