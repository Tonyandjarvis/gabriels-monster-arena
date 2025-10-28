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
        this.eventQueue = [];
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
        
        // Input handling with debouncing
        this.input = {
            mouse: { x: 0, y: 0, pressed: false },
            touch: { x: 0, y: 0, pressed: false },
            lastInputTime: 0,
            inputCooldown: 150 // 150ms cooldown between inputs to prevent spam
        };

        // Operation safety flags
        this.operationInProgress = false;
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
        try {
            console.log('Setting up game systems...');
            
            // Create systems in dependency order
            this.renderSystem = new RenderSystem();
            this.placementSystem = new PlacementSystem(32);
            this.combatSystem = new CombatSystem();
            this.pathfindingSystem = new PathfindingSystem();
            this.waveSystem = new WaveSystem();
            this.uiSystem = new UISystem(this.canvas);
            this.audioSystem = new AudioSystem();
            this.particleSystem = new ParticleSystem();
            this.tutorialSystem = new TutorialSystem();
            
            // Set system priorities for proper update order
            this.renderSystem.priority = 100; // Render last
            this.uiSystem.priority = 90;
            this.particleSystem.priority = 80;
            this.combatSystem.priority = 70;
            this.waveSystem.priority = 60;
            this.pathfindingSystem.priority = 50;
            this.placementSystem.priority = 40;
            this.audioSystem.priority = 30;
            this.tutorialSystem.priority = 20;
            
            // Register systems in priority order
            const systemEntries = [
                ['tutorial', this.tutorialSystem],
                ['audio', this.audioSystem],
                ['placement', this.placementSystem],
                ['pathfinding', this.pathfindingSystem],
                ['wave', this.waveSystem],
                ['combat', this.combatSystem],
                ['particles', this.particleSystem],
                ['ui', this.uiSystem],
                ['render', this.renderSystem]
            ];
            
            systemEntries.forEach(([name, system]) => {
                this.systems.set(name, system);
                console.log(`Registered system: ${name} (priority: ${system.priority})`);
            });
            
            // Set game engine reference for UI system
            this.uiSystem.gameEngine = this;
            
            // Setup system dependencies
            this.setupSystemDependencies();
            
            // Setup system relationships
            this.setupSystemRelationships();
            
            console.log('All systems created successfully');
        } catch (error) {
            console.error('Failed to create systems:', error);
            throw new Error(`System initialization failed: ${error.message}`);
        }
    }

    setupSystemDependencies() {
        try {
            console.log('Setting up system dependencies...');
            
            // Set cross-system references
            this.renderSystem.pathfindingSystem = this.pathfindingSystem;
            this.renderSystem.placementSystem = this.placementSystem;
            this.renderSystem.gameEngine = this; // Add game engine reference for UI integration
            
            // Set combat system dependencies
            this.combatSystem.setDependencies({
                renderSystem: this.renderSystem,
                particleSystem: this.particleSystem,
                audioSystem: this.audioSystem,
                gameEngine: this // Pass game engine reference
            });
            
            // Set wave system dependencies
            this.waveSystem.setDependencies({
                pathfindingSystem: this.pathfindingSystem,
                renderSystem: this.renderSystem,
                combatSystem: this.combatSystem,
                gameEngine: this // Pass game engine reference
            });
            
            // Set placement system dependencies
            this.placementSystem.setDependencies({
                renderSystem: this.renderSystem,
                pathfindingSystem: this.pathfindingSystem
            });
            
            // Set dependencies for all other systems (even if they don't need external dependencies)
            this.renderSystem.setDependencies({});
            this.pathfindingSystem.setDependencies({});
            this.uiSystem.setDependencies({});
            this.audioSystem.setDependencies({});
            this.particleSystem.setDependencies({});
            this.tutorialSystem.setDependencies({});
            
            console.log('System dependencies configured successfully');
        } catch (error) {
            console.error('Failed to setup system dependencies:', error);
            throw new Error(`System dependency setup failed: ${error.message}`);
        }
    }

    setupSystemRelationships() {
        try {
            console.log('Setting up system relationships...');
            
            // Generate path for pathfinding system
            const start = { x: 50, y: 200 };
            const end = { x: this.canvas.width - 50, y: 400 };
            this.pathfindingSystem.generatePath(start, end);
            
            console.log(`Generated path with ${this.pathfindingSystem.path.length} points from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
            
            // Set path for placement system
            this.placementSystem.setPath(this.pathfindingSystem.getPath());
            
            // Set spawn position for wave system
            this.waveSystem.spawnPosition = start;
            
            console.log('System relationships configured successfully');
        } catch (error) {
            console.error('Failed to setup system relationships:', error);
            throw new Error(`System relationship setup failed: ${error.message}`);
        }
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
        
        // Don't auto-start wave - let user click START button
    }

    addEntity(entity) {
        try {
            if (!entity || !entity.id) {
                throw new Error('Invalid entity provided to addEntity');
            }
            
            if (this.entities.has(entity.id)) {
                console.warn(`Entity ${entity.id} already exists, skipping addition`);
                return false;
            }
            
            this.entities.set(entity.id, entity);
            this.syncEntityWithSystems(entity);
            console.log(`Entity ${entity.id} added successfully, total entities: ${this.entities.size}`);
            return true;
        } catch (error) {
            console.error(`Failed to add entity ${entity?.id || 'unknown'}:`, error);
            return false;
        }
    }

    addTestMonster() {
        try {
            console.log('Adding test monster...');
            
            // Add a test monster to verify rendering works
            const testMonster = new Entity();
            testMonster.addComponent(new PositionComponent(100, 100));
            testMonster.addComponent(new MonsterComponent('GEM', MonsterComponent.TYPES.GEM.stats));
            testMonster.addComponent(new SpriteRenderer(32, 32, '#9c27b0'));
            testMonster.addTag('monster');
            
            if (this.addEntity(testMonster)) {
                console.log('Test monster added at (100, 100), total entities:', this.entities.size);
            } else {
                console.error('Failed to add test monster');
            }
        } catch (error) {
            console.error('Failed to create test monster:', error);
        }
    }

    findMonsterAtPosition(x, y) {
        const tolerance = 20; // Click tolerance
        
        for (const [id, entity] of this.entities) {
            if (entity.hasTag('monster')) {
                const pos = entity.getComponent('PositionComponent');
                const sprite = entity.getComponent('SpriteRenderer');
                
                if (pos && sprite) {
                    const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                    if (distance <= tolerance) {
                        return entity;
                    }
                }
            }
        }
        
        return null;
    }

    removeMonster(monster) {
        // Refund 50% of the monster cost
        const monsterComp = monster.getComponent('MonsterComponent');
        if (monsterComp) {
            const refund = Math.floor(MonsterComponent.TYPES[monsterComp.type].stats.cost * 0.5);
            this.uiSystem.addCurrency(refund);
            console.log(`Monster removed, refunded ${refund} currency`);
        }
        
        // Remove from all systems
        this.systems.forEach(system => {
            system.removeEntity(monster);
        });
        
        // Remove from entities
        this.entities.delete(monster.id);
        
        // Play removal sound
        this.audioSystem.playSound('monster_place'); // Reuse placement sound for removal
        
        console.log('Monster removed, total entities:', this.entities.size);
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
                    console.log('🎯 ESC key pressed - canceling placement mode');
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

        // Prevent input during critical operations
        if (this.operationInProgress) {
            return;
        }

        // Input debouncing to prevent rapid clicking issues
        const currentTime = Date.now();
        if (currentTime - this.input.lastInputTime < this.input.inputCooldown) {
            return; // Ignore input if too soon after previous input
        }
        this.input.lastInputTime = currentTime;

        // Handle tutorial clicks first
        if (this.tutorialSystem.isActive() && this.tutorialSystem.handleClick(x, y)) {
            return;
        }
        
        // Handle UI interactions
        if (this.uiSystem.handleTouch(x, y)) {
            return;
        }
        
        // Handle right-click to cancel placement mode
        if (this.uiSystem.placementMode) {
            console.log('🎯 Right-click detected - canceling placement mode');
            this.uiSystem.exitPlacementMode();
            this.placementSystem.exitPlacementMode();
            return;
        }
        
        // Handle monster removal
        if (this.uiSystem.isRemovalMode()) {
            if (this.gameState !== 'GAMEPLAY') {
                console.log('Cannot remove monsters when game is not in gameplay state');
                return;
            }

            const monster = this.findMonsterAtPosition(x, y);
            if (monster) {
                try {
                    this.removeMonster(monster);
                } catch (error) {
                    console.error('Error during monster removal:', error);
                }
                return;
            }
        }
        
        // Handle monster placement
        if (this.uiSystem.placementMode && this.uiSystem.selectedMonster) {
            // Additional safety checks
            if (this.gameState !== 'GAMEPLAY') {
                console.log('Cannot place monsters when game is not in gameplay state');
                return;
            }

            const monsterType = this.uiSystem.selectedMonster;
            if (!MonsterComponent.TYPES[monsterType]) {
                console.error(`Invalid monster type: ${monsterType}`);
                return;
            }

            const cost = MonsterComponent.TYPES[monsterType].stats.cost;

            console.log(`Attempting to place monster at (${x}, ${y}), cost: ${cost}, can afford: ${this.uiSystem.canAffordMonster(monsterType)}`);

            try {
                const monster = this.placementSystem.placeMonster(x, y, monsterType);
                if (monster) {
                    // successful placement
                    console.log('Monster placed successfully!', monster);

                    // Spend currency and check if successful
                    if (this.uiSystem.spendCurrency(cost)) {
                        console.log(`Currency spent: ${cost}, remaining: ${this.uiSystem.getGameStats().currency}`);

                        if (this.addEntity(monster)) {
                            this.audioSystem.playSound('monster_place');
                            this.placementSystem.exitPlacementMode();
                            this.uiSystem.exitPlacementMode();
                            this.tutorialSystem.completeAction('place_monster');
                        } else {
                            console.error('Failed to add monster to game engine');
                            // Refund currency if entity addition failed
                            this.uiSystem.addCurrency(cost);
                        }
                    } else {
                        console.error('Failed to spend currency');
                    }
                } else {
                    // Placement failed (invalid spot) - treat as empty click and cancel
                    console.log('🎯 Invalid placement click - canceling placement mode');
                    this.uiSystem.exitPlacementMode();
                    this.placementSystem.exitPlacementMode();
                }
            } catch (error) {
                console.error('Error during monster placement:', error);
                // Refund currency on error
                this.uiSystem.addCurrency(cost);
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

            // Check if we should skip this update due to performance throttling
            if (this.performanceMonitor.shouldSkipUpdate()) {
                return; // Skip this update cycle to improve performance
            }

            // System health monitoring
            this.monitorSystemHealth(deltaTime);

            // Update systems in priority order with error handling
            const sortedSystems = Array.from(this.systems.values())
                .filter(system => system.enabled)
                .sort((a, b) => a.priority - b.priority);

            for (const system of sortedSystems) {
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

            // Update entities
            this.updateEntities(deltaTime);

            // Process events
            this.processEvents();

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
        try {
            if (!entity || !entity.id) {
                throw new Error('Invalid entity provided to syncEntityWithSystems');
            }
            
            console.log(`Syncing entity ${entity.id} with systems`);
            
            // Add entity to all relevant systems with error handling
            const systemsToSync = [
                { system: this.renderSystem, name: 'render' },
                { system: this.combatSystem, name: 'combat' },
                { system: this.waveSystem, name: 'wave' },
                { system: this.pathfindingSystem, name: 'pathfinding' }
            ];
            
            // Add to placement system if it's a monster
            if (entity.hasTag('monster')) {
                systemsToSync.push({ system: this.placementSystem, name: 'placement' });
            }
            
            for (const { system, name } of systemsToSync) {
                if (system && system.addEntity) {
                    system.addEntity(entity);
                    console.log(`Entity ${entity.id} added to ${name} system`);
                }
            }
            
            console.log(`Entity ${entity.id} synced successfully`);
        } catch (error) {
            console.error(`Failed to sync entity ${entity?.id || 'unknown'}:`, error);
            throw new Error(`Entity sync failed: ${error.message}`);
        }
    }

    syncNewWaveEntities() {
        try {
            this.operationInProgress = true; // Prevent input during sync
            let syncedCount = 0;

            // Sync newly spawned enemies from wave system
            this.waveSystem.entities.forEach(entity => {
                if (!this.entities.has(entity.id)) {
                    this.entities.set(entity.id, entity);
                    this.syncEntityWithSystems(entity);
                    syncedCount++;
                    console.log(`Synced new enemy entity: ${entity.id} to all systems`);
                }
            });

            if (syncedCount > 0) {
                console.log(`Synced ${syncedCount} new enemy entities to all systems`);
            }
        } catch (error) {
            console.error('Error syncing new wave entities:', error);
        } finally {
            this.operationInProgress = false; // Re-enable input
        }
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

    // Event System Methods
    emitEvent(eventType, eventData) {
        try {
            const event = {
                type: eventType,
                data: eventData,
                timestamp: Date.now()
            };
            
            this.eventQueue.push(event);
            console.log(`Event emitted: ${eventType}`, eventData);
        } catch (error) {
            console.error(`Failed to emit event ${eventType}:`, error);
        }
    }

    addEventListener(eventType, callback) {
        try {
            if (!this.eventListeners.has(eventType)) {
                this.eventListeners.set(eventType, []);
            }
            this.eventListeners.get(eventType).push(callback);
            console.log(`Event listener added for ${eventType}`);
        } catch (error) {
            console.error(`Failed to add event listener for ${eventType}:`, error);
        }
    }

    removeEventListener(eventType, callback) {
        try {
            if (this.eventListeners.has(eventType)) {
                const listeners = this.eventListeners.get(eventType);
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        } catch (error) {
            console.error(`Failed to remove event listener for ${eventType}:`, error);
        }
    }

    processEvents() {
        try {
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                
                // Process system events
                this.processSystemEvents(event);
                
                // Process custom event listeners
                if (this.eventListeners.has(event.type)) {
                    this.eventListeners.get(event.type).forEach(callback => {
                        try {
                            callback(event);
                        } catch (error) {
                            console.error(`Error in event listener for ${event.type}:`, error);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error processing events:', error);
        }
    }

    processSystemEvents(event) {
        try {
            switch (event.type) {
                case 'enemy_died':
                    this.handleEnemyDeath(event.data);
                    break;
                case 'wave_completed':
                    this.handleWaveCompleted(event.data);
                    break;
                case 'enemy_reached_end':
                    this.handleEnemyReachedEnd(event.data);
                    break;
                case 'monster_leveled_up':
                    this.handleMonsterLevelUp(event.data);
                    break;
                case 'system_error':
                    this.handleSystemError(event.data);
                    break;
            }
        } catch (error) {
            console.error(`Error processing system event ${event.type}:`, error);
        }
    }

    handleSystemError(errorData) {
        console.error('System error reported:', errorData);
        // Could implement system recovery logic here
    }

    handleMonsterLevelUp(data) {
        console.log(`Monster leveled up to level ${data.newLevel}`);
        const monsterPos = data.monster.getComponent('PositionComponent');
        if (monsterPos && this.particleSystem) {
            this.particleSystem.createLevelUpEffect(monsterPos.x + 16, monsterPos.y + 16);
        }
    }

    monitorSystemHealth(deltaTime) {
        try {
            // Initialize health monitoring timer
            if (this.healthMonitorTimer === undefined) {
                this.healthMonitorTimer = 0;
            }
            
            this.healthMonitorTimer += deltaTime;
            
            // Report system health every 10 seconds
            if (this.healthMonitorTimer >= 10000) {
                const systemHealth = this.getSystemHealthReport();
                console.log('=== SYSTEM HEALTH REPORT ===');
                console.log(`Total Entities: ${this.entities.size}`);
                console.log(`Active Systems: ${systemHealth.activeSystems}/${systemHealth.totalSystems}`);
                console.log(`System Status:`, systemHealth.systemStatus);
                console.log(`Entity Distribution:`, systemHealth.entityDistribution);
                console.log('============================');
                
                this.healthMonitorTimer = 0;
            }
        } catch (error) {
            console.error('Error in system health monitoring:', error);
        }
    }

    getSystemHealthReport() {
        const systemStatus = {};
        const entityDistribution = {
            monsters: 0,
            enemies: 0,
            projectiles: 0,
            other: 0
        };
        
        // Count entities by type
        this.entities.forEach(entity => {
            if (entity.hasTag('monster')) entityDistribution.monsters++;
            else if (entity.hasTag('enemy')) entityDistribution.enemies++;
            else if (entity.hasTag('projectile')) entityDistribution.projectiles++;
            else entityDistribution.other++;
        });
        
        // Check system status
        this.systems.forEach((system, name) => {
            systemStatus[name] = {
                enabled: system.enabled,
                entityCount: system.entities ? system.entities.size : 0,
                priority: system.priority
            };
        });
        
        const activeSystems = Object.values(systemStatus).filter(s => s.enabled).length;
        const totalSystems = Object.keys(systemStatus).length;
        
        return {
            activeSystems,
            totalSystems,
            systemStatus,
            entityDistribution
        };
    }

    processCombatEvents() {
        // Process events from all systems with combat events
        const waveEvents = this.waveSystem.getCombatEvents();
        const pathfindingEvents = this.pathfindingSystem.getCombatEvents();
        const combatEvents = this.combatSystem.getCombatEvents();

        const allEvents = [...waveEvents, ...pathfindingEvents, ...combatEvents];

        if (allEvents.length > 0) {
            console.log(`Processing ${allEvents.length} combat events:`, allEvents.map(e => e.type));
        }

        allEvents.forEach(event => {
            // Process combat events directly instead of going through event system
            this.processCombatEvent(event);
        });
    }
    
    processCombatEvent(event) {
        try {
            switch (event.type) {
                case 'enemy_died':
                    this.handleEnemyDeath(event);
                    break;
                case 'enemy_reached_end':
                    this.handleEnemyReachedEnd(event);
                    break;
                case 'hit':
                    // Handle hit events if needed
                    break;
                case 'enemy_spawned':
                    // Handle spawn events if needed
                    break;
                default:
                    console.log(`Unhandled combat event: ${event.type}`);
            }
        } catch (error) {
            console.error(`Error processing combat event ${event.type}:`, error);
        }
    }

    handleEnemyDeath(event) {
        console.log(`Enemy ${event.enemy.id} died, awarding ${event.reward} currency`);
        const oldCurrency = this.uiSystem.getGameStats().currency;
        this.uiSystem.addCurrency(event.reward);
        const newCurrency = this.uiSystem.getGameStats().currency;
        console.log(`Currency updated: ${oldCurrency} -> ${newCurrency}`);

        this.uiSystem.addScore(event.reward * 10);
        this.audioSystem.playSound('enemy_die');
        this.tutorialSystem.completeAction('earn_currency');

        // Create death particle effect
        const enemyPos = event.enemy.getComponent('PositionComponent');
        this.particleSystem.createExplosion(enemyPos.x + 16, enemyPos.y + 16, '#ff6b6b', 6);

        this.waveSystem.onEnemyDied(event.enemy);

        // Destroy the enemy entity
        event.enemy.destroy();
        this.entities.delete(event.enemy.id);
        console.log(`Enemy ${event.enemy.id} destroyed and removed from game`);
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
        console.log(`Enemy reached end, dealing ${event.damage} damage`);
        const oldHealth = this.uiSystem.getGameStats().health;
        this.uiSystem.takeDamage(event.damage);
        const newHealth = this.uiSystem.getGameStats().health;
        console.log(`Health updated: ${oldHealth} -> ${newHealth}`);

        if (this.uiSystem.getGameStats().health <= 0) {
            console.log('Game over triggered by enemy reaching end');
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
        
        // Render systems in priority order (render system handles canvas clearing)
        const sortedSystems = Array.from(this.systems.values())
            .filter(system => system.enabled && system.render)
            .sort((a, b) => a.priority - b.priority);
        
        // Only log rendering info occasionally to avoid spam
        if (this.frameCount % 300 === 0) { // Every 5 seconds at 60 FPS
            console.log(`Rendering with ${this.entities.size} entities in GameEngine`);
        }

        for (const system of sortedSystems) {
            try {
                system.render(this.ctx);
            } catch (error) {
                console.error(`❌ Error rendering system ${system.constructor.name}:`, error);
                console.error('Stack trace:', error.stack);
                
                // Don't disable system on first error - try to recover
                if (!system.renderErrorCount) {
                    system.renderErrorCount = 0;
                }
                system.renderErrorCount++;
                
                // Only disable after multiple consecutive errors
                if (system.renderErrorCount > 10) {
                    console.error(`❌ Disabling ${system.constructor.name} after ${system.renderErrorCount} errors`);
                    system.enabled = false;
                }
            }
        }
        
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

// For production: Enable HTTPS on AWS EC2 with Let's Encrypt
// sudo apt install certbot python3-certbot-apache
// sudo certbot --apache
