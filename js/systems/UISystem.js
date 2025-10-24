class UISystem extends System {
    constructor(canvas) {
        super();
        console.log('🎨 UISystem constructor starting...');
        console.log('Canvas:', canvas);
        console.log('Canvas dimensions:', canvas ? `${canvas.width}x${canvas.height}` : 'NULL');
        console.log('MonsterComponent available:', typeof MonsterComponent !== 'undefined');
        console.log('MonsterComponent.TYPES:', typeof MonsterComponent !== 'undefined' ? MonsterComponent.TYPES : 'UNDEFINED');
        
        this.canvas = canvas;
        this.elements = [];
        this.touchAreas = new Map();
        this.buttons = [];
        this.selectedMonster = null;
        this.placementMode = false;
        this.removalMode = false;
        this.gameStats = {
            health: 100,
            maxHealth: 100,
            currency: 100,
            score: 0,
            wave: 1
        };
        
        // DON'T call setupUI here - use lazy initialization instead
        // this.setupUI();  ❌ REMOVED
        this.initialized = false;
        console.log('🎨 UISystem constructor complete. Will initialize on first render.');
    }

    setupUI() {
        console.log('🎨 setupUI called');
        try {
            this.createMonsterSelectionButtons();
            console.log('✅ Monster buttons created:', this.buttons.length);
        } catch (error) {
            console.error('❌ Failed to create monster buttons:', error);
        }
        
        try {
            this.createGameHUD();
            console.log('✅ Game HUD created');
        } catch (error) {
            console.error('❌ Failed to create game HUD:', error);
        }
        
        try {
            this.setupResponsiveDesign();
            console.log('✅ Responsive design setup');
        } catch (error) {
            console.error('❌ Failed to setup responsive design:', error);
        }
    }

    createMonsterSelectionButtons() {
        console.log('🎨 createMonsterSelectionButtons called');
        console.log('MonsterComponent:', typeof MonsterComponent);
        console.log('MonsterComponent.TYPES:', MonsterComponent.TYPES);
        
        // Defensive check
        if (typeof MonsterComponent === 'undefined') {
            console.error('❌ CRITICAL: MonsterComponent is not defined!');
            console.error('This means the script load order is wrong.');
            return;  // Exit early, don't crash
        }
        
        if (!MonsterComponent.TYPES) {
            console.error('❌ CRITICAL: MonsterComponent.TYPES is not defined!');
            return;
        }
        
        // Check canvas dimensions
        if (!this.canvas) {
            console.error('❌ CRITICAL: Canvas is null!');
            return;
        }
        
        if (this.canvas.height === 0 || this.canvas.width === 0) {
            console.error('❌ CRITICAL: Canvas has zero dimensions!');
            console.error('Canvas:', this.canvas.width, 'x', this.canvas.height);
            return;
        }
        
        try {
            const monsterTypes = Object.keys(MonsterComponent.TYPES);
            console.log('Monster types found:', monsterTypes);
            
            const buttonWidth = 80;
            const buttonHeight = 80;
            const spacing = 20;
            const startX = 20;
            const startY = this.canvas.height - buttonHeight - 20;
            console.log('Button positioning:', { startX, startY, canvasHeight: this.canvas.height });
            
            monsterTypes.forEach((monsterType, index) => {
                try {
                    const x = startX + (buttonWidth + spacing) * index;
                    const y = startY;
                    const monsterData = MonsterComponent.TYPES[monsterType];
                    
                    if (!monsterData) {
                        console.error(`❌ No data for monster type: ${monsterType}`);
                        return;
                    }
                    
                    console.log(`Creating button ${index}: ${monsterType} at (${x}, ${y})`);
                    
                    const button = new MonsterButton(
                        x, y, buttonWidth, buttonHeight,
                        monsterType, monsterData,
                        () => this.selectMonster(monsterType)
                    );
                    
                    if (!button) {
                        console.error(`❌ Button creation failed for: ${monsterType}`);
                        return;
                    }
                    
                    this.buttons.push(button);
                    console.log(`✅ Button created: ${monsterType}`);
                    
                } catch (error) {
                    console.error(`❌ Failed to create button ${index}:`, error);
                    // Continue to next button instead of crashing
                }
            });
            
            console.log('✅ All monster buttons created. Total:', this.buttons.length);
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in createMonsterSelectionButtons:', error);
            console.error('Stack trace:', error.stack);
            throw error;  // Re-throw to see if it's being caught silently
        }
        
        // Add upgrade button
        const upgradeButton = new UpgradeButton(
            this.canvas.width - 100, this.canvas.height - 100,
            80, 80,
            () => this.enterUpgradeMode()
        );
        this.buttons.push(upgradeButton);
        
        // Add tutorial button
        const tutorialButton = new TutorialButton(
            this.canvas.width - 100, this.canvas.height - 200,
            80, 80,
            () => this.startTutorial()
        );
        this.buttons.push(tutorialButton);
        
        // Add start wave button
        const startWaveButton = new StartWaveButton(
            this.canvas.width - 100, this.canvas.height - 300,
            80, 80,
            () => this.startWave()
        );
        this.buttons.push(startWaveButton);

        // Add remove monster button
        const removeMonsterButton = new RemoveMonsterButton(
            this.canvas.width - 200, this.canvas.height - 300,
            80, 80,
            () => this.toggleRemovalMode()
        );
        this.buttons.push(removeMonsterButton);
    }

    createGameHUD() {
        // Health bar
        this.healthBar = {
            x: 20,
            y: 20,
            width: 200,
            height: 20
        };
        
        // Currency display
        this.currencyDisplay = {
            x: 20,
            y: 50,
            fontSize: 18
        };
        
        // Score display
        this.scoreDisplay = {
            x: 20,
            y: 80,
            fontSize: 16
        };
    }

    setupResponsiveDesign() {
        this.updateCanvasSize();
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
        
        // Recreate UI elements for new size
        this.buttons = [];
        this.createMonsterSelectionButtons();
    }

    selectMonster(monsterType) {
        this.selectedMonster = monsterType;
        this.placementMode = true;
        
        // Update button states
        this.buttons.forEach(button => {
            button.selected = button.monsterType === monsterType;
        });
        
        // Notify tutorial system
        if (this.gameEngine && this.gameEngine.tutorialSystem) {
            this.gameEngine.tutorialSystem.completeAction('click_monster');
        }
    }

    exitPlacementMode() {
        this.placementMode = false;
        this.selectedMonster = null;
        
        // Update button states
        this.buttons.forEach(button => {
            button.selected = false;
        });
    }

    enterUpgradeMode() {
        this.upgradeMode = true;
        this.selectedMonster = null;
        
        // Update button states
        this.buttons.forEach(button => {
            if (button instanceof MonsterButton) {
                button.selected = false;
            }
        });
    }

    exitUpgradeMode() {
        this.upgradeMode = false;
    }

    upgradeMonster(monster) {
        const monsterComp = monster.getComponent('MonsterComponent');
        if (monsterComp && this.canAffordUpgrade(monsterComp)) {
            const cost = monsterComp.getUpgradeCost();
            if (this.spendCurrency(cost)) {
                monsterComp.upgrade();
                return true;
            }
        }
        return false;
    }

    canAffordUpgrade(monsterComp) {
        return this.gameStats.currency >= monsterComp.getUpgradeCost();
    }

    startTutorial() {
        if (this.gameEngine && this.gameEngine.tutorialSystem) {
            this.gameEngine.tutorialSystem.startTutorial();
        }
    }

    startWave() {
        if (this.gameEngine) {
            this.gameEngine.startWave();
            if (this.gameEngine.tutorialSystem) {
                this.gameEngine.tutorialSystem.completeAction('start_wave');
            }
        }
    }

    toggleRemovalMode() {
        this.removalMode = !this.removalMode;
        this.placementMode = false; // Exit placement mode when entering removal mode
        console.log('Removal mode:', this.removalMode ? 'ON' : 'OFF');
    }

    isRemovalMode() {
        return this.removalMode;
    }

    update(deltaTime) {
        // Update UI animations and effects
        this.buttons.forEach(button => {
            button.update(deltaTime);
        });
    }

    render(ctx) {
        // Lazy initialization on first render
        if (!this.initialized) {
            console.log('🎨 Initializing UISystem on first render...');
            this.initializeUI();
        }
        
        console.log('🎨 UISystem.render() called');
        console.log('Buttons to render:', this.buttons.length);
        console.log('UISystem enabled:', this.enabled);
        console.log('Context:', ctx);
        
        // CRITICAL TEST: Draw a big red rectangle to test if UISystem is rendering
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 200, 100);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('UISystem is rendering!', 20, 50);
        ctx.restore();
        
        try {
            // Render HUD
            this.renderHUD(ctx);
            console.log('✅ HUD rendered');
            
            // Render monster selection buttons
            this.renderMonsterButtons(ctx);
            console.log('✅ Buttons rendered');
            
            // Render placement mode indicator
            if (this.placementMode) {
                this.renderPlacementModeIndicator(ctx);
            }
            
            // Render upgrade mode indicator
            if (this.upgradeMode) {
                this.renderUpgradeModeIndicator(ctx);
            }
        } catch (error) {
            console.error('❌ ERROR in UISystem.render():', error);
            console.error('Stack trace:', error.stack);
        }
    }
    
    initializeUI() {
        if (this.initialized) return;
        console.log('🎨 Initializing UISystem...');
        this.setupUI();
        this.initialized = true;
        console.log('🎨 UISystem initialization complete. Buttons created:', this.buttons.length);
    }

    renderHUD(ctx) {
        ctx.save();
        
        // Health bar
        this.renderHealthBar(ctx);
        
        // Currency display
        this.renderCurrency(ctx);
        
        // Score display
        this.renderScore(ctx);
        
        ctx.restore();
    }

    renderHealthBar(ctx) {
        const bar = this.healthBar;
        const healthPercentage = this.gameStats.health / this.gameStats.maxHealth;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
        
        // Health
        ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : 
                       healthPercentage > 0.25 ? '#FF9800' : '#f44336';
        ctx.fillRect(bar.x, bar.y, bar.width * healthPercentage, bar.height);
        
        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);
        
        // Health text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.floor(this.gameStats.health)}/${this.gameStats.maxHealth}`,
            bar.x + bar.width / 2, bar.y + bar.height / 2 + 5
        );
    }

    renderCurrency(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${this.currencyDisplay.fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(`💰 ${this.gameStats.currency}`, this.currencyDisplay.x, this.currencyDisplay.y);
    }

    renderScore(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${this.scoreDisplay.fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${this.gameStats.score}`, this.scoreDisplay.x, this.scoreDisplay.y);
    }

    renderMonsterButtons(ctx) {
        this.buttons.forEach(button => {
            button.render(ctx);
        });
    }

    renderPlacementModeIndicator(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `Click to place ${MonsterComponent.TYPES[this.selectedMonster].name}`,
            this.canvas.width / 2, this.canvas.height / 2
        );
        
        ctx.font = '16px Arial';
        ctx.fillText(
            `Cost: ${MonsterComponent.TYPES[this.selectedMonster].stats.cost}`,
            this.canvas.width / 2, this.canvas.height / 2 + 30
        );
        
        ctx.restore();
    }

    renderUpgradeModeIndicator(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            'Click on a monster to upgrade it',
            this.canvas.width / 2, this.canvas.height / 2
        );
        
        ctx.font = '16px Arial';
        ctx.fillText(
            'Upgrades increase damage, health, and range',
            this.canvas.width / 2, this.canvas.height / 2 + 30
        );
        
        ctx.restore();
    }

    handleTouch(x, y) {
        // Check monster selection buttons
        for (let button of this.buttons) {
            if (button.isPointInside(x, y)) {
                button.onClick();
                return true;
            }
        }
        
        return false;
    }

    updateGameStats(stats) {
        this.gameStats = { ...this.gameStats, ...stats };
    }

    getGameStats() {
        return this.gameStats;
    }

    canAffordMonster(monsterType) {
        const cost = MonsterComponent.TYPES[monsterType].stats.cost;
        return this.gameStats.currency >= cost;
    }

    spendCurrency(amount) {
        if (this.gameStats.currency >= amount) {
            this.gameStats.currency -= amount;
            return true;
        }
        return false;
    }

    addCurrency(amount) {
        this.gameStats.currency += amount;
        this.updateGameStats(this.gameStats);
    }

    takeDamage(damage) {
        this.gameStats.health -= damage;
        if (this.gameStats.health < 0) {
            this.gameStats.health = 0;
        }
    }

    addScore(points) {
        this.gameStats.score += points;
        this.updateGameStats(this.gameStats);
    }
}

class MonsterButton {
    constructor(x, y, width, height, monsterType, monsterData, onClick) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.monsterType = monsterType;
        this.monsterData = monsterData;
        this.onClick = onClick;
        this.selected = false;
        this.pressed = false;
        this.minTouchSize = 44; // iOS recommended minimum touch target
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    update(deltaTime) {
        // Update button animations if needed
    }

    render(ctx) {
        ctx.save();
        
        // Button background
        if (this.selected) {
            ctx.fillStyle = '#4CAF50';
        } else if (this.pressed) {
            ctx.fillStyle = '#45a049';
        } else {
            ctx.fillStyle = '#2196F3';
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Button border
        ctx.strokeStyle = this.selected ? '#fff' : '#000';
        ctx.lineWidth = this.selected ? 3 : 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Monster icon (colored circle)
        ctx.fillStyle = this.monsterData.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2 - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Monster name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.monsterData.name, this.x + this.width / 2, this.y + this.height - 5);
        
        // Cost
        ctx.font = '10px Arial';
        ctx.fillText(`$${this.monsterData.stats.cost}`, this.x + this.width / 2, this.y + this.height - 20);
        
        ctx.restore();
    }
}

class UpgradeButton {
    constructor(x, y, width, height, onClick) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.onClick = onClick;
        this.selected = false;
        this.pressed = false;
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    update(deltaTime) {
        // Update button animations if needed
    }

    render(ctx) {
        ctx.save();
        
        // Button background
        if (this.selected) {
            ctx.fillStyle = '#FF9800';
        } else if (this.pressed) {
            ctx.fillStyle = '#F57C00';
        } else {
            ctx.fillStyle = '#FFC107';
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Button border
        ctx.strokeStyle = this.selected ? '#fff' : '#000';
        ctx.lineWidth = this.selected ? 3 : 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Upgrade icon (arrow up)
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬆', this.x + this.width / 2, this.y + this.height / 2 + 8);
        
        // Upgrade text
        ctx.font = 'bold 10px Arial';
        ctx.fillText('UPGRADE', this.x + this.width / 2, this.y + this.height - 5);
        
        ctx.restore();
    }
}

class TutorialButton {
    constructor(x, y, width, height, onClick) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.onClick = onClick;
        this.selected = false;
        this.pressed = false;
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    update(deltaTime) {
        // Update button animations if needed
    }

    render(ctx) {
        ctx.save();
        
        // Button background
        if (this.selected) {
            ctx.fillStyle = '#3498db';
        } else if (this.pressed) {
            ctx.fillStyle = '#2980b9';
        } else {
            ctx.fillStyle = '#3498db';
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Button border
        ctx.strokeStyle = this.selected ? '#fff' : '#000';
        ctx.lineWidth = this.selected ? 3 : 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Tutorial icon (question mark)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', this.x + this.width / 2, this.y + this.height / 2 + 8);
        
        // Tutorial text
        ctx.font = 'bold 10px Arial';
        ctx.fillText('TUTORIAL', this.x + this.width / 2, this.y + this.height - 5);
        
        ctx.restore();
    }
}

class StartWaveButton {
    constructor(x, y, width, height, onClick) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.onClick = onClick;
        this.selected = false;
        this.pressed = false;
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    update(deltaTime) {
        // Update button animations if needed
    }

    render(ctx) {
        ctx.save();
        
        // Button background
        if (this.selected) {
            ctx.fillStyle = '#e74c3c';
        } else if (this.pressed) {
            ctx.fillStyle = '#c0392b';
        } else {
            ctx.fillStyle = '#e74c3c';
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Button border
        ctx.strokeStyle = this.selected ? '#fff' : '#000';
        ctx.lineWidth = this.selected ? 3 : 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Start wave icon (play button)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('▶', this.x + this.width / 2, this.y + this.height / 2 + 8);
        
        // Start wave text
        ctx.font = 'bold 10px Arial';
        ctx.fillText('START', this.x + this.width / 2, this.y + this.height - 5);
        
        ctx.restore();
    }
}

class RemoveMonsterButton {
    constructor(x, y, width, height, onClick) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.onClick = onClick;
        this.selected = false;
        this.pressed = false;
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    update(deltaTime) {
        // Update button animations if needed
    }

    render(ctx) {
        ctx.save();
        
        // Button background
        if (this.selected) {
            ctx.fillStyle = '#c0392b';
        } else if (this.pressed) {
            ctx.fillStyle = '#a93226';
        } else {
            ctx.fillStyle = '#e74c3c';
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Button border
        ctx.strokeStyle = this.selected ? '#fff' : '#000';
        ctx.lineWidth = this.selected ? 3 : 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Remove icon (X symbol)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✕', this.x + this.width / 2, this.y + this.height / 2 + 8);
        
        // Remove text
        ctx.font = 'bold 10px Arial';
        ctx.fillText('REMOVE', this.x + this.width / 2, this.y + this.height - 5);
        
        ctx.restore();
    }
}
