class PlacementSystem extends System {
    constructor(gridSize = 32) {
        super();
        this.gridSize = gridSize;
        this.grid = new Map();
        this.selectedMonster = null;
        this.placementMode = false;
        this.validPlacementColor = '#4CAF50';
        this.invalidPlacementColor = '#f44336';
        this.placementPreview = null;
        this.path = [];
        this.obstacles = [];
        
        // System dependencies
        this.renderSystem = null;
        this.pathfindingSystem = null;
    }

    setDependencies(dependencies) {
        try {
            console.log('Setting PlacementSystem dependencies...');
            this.renderSystem = dependencies.renderSystem;
            this.pathfindingSystem = dependencies.pathfindingSystem;
            console.log('PlacementSystem dependencies set successfully');
        } catch (error) {
            console.error('Failed to set PlacementSystem dependencies:', error);
            throw new Error(`PlacementSystem dependency setup failed: ${error.message}`);
        }
    }

    setPath(path) {
        this.path = path;
    }

    setObstacles(obstacles) {
        this.obstacles = obstacles;
    }

    updateCanvasSize() {
        // Clear any cached grid calculations if canvas size changes
        // This ensures placement validation works correctly with dynamic canvas sizes
        console.log('PlacementSystem: Canvas size updated');
    }

    enterPlacementMode(monsterType) {
        this.placementMode = true;
        this.selectedMonster = monsterType;
    }

    exitPlacementMode() {
        this.placementMode = false;
        this.selectedMonster = null;
        this.placementPreview = null;
    }

    placeMonster(x, y, monsterType) {
        const gridPos = this.worldToGrid(x, y);
        const key = `${gridPos.x},${gridPos.y}`;
        console.log(`🎯 Attempting to place monster at world (${x}, ${y}) -> grid (${gridPos.x}, ${gridPos.y})`);

        // Check bounds first
        if (!this.isInBounds(gridPos.x, gridPos.y)) {
            console.log(`❌ Placement failed: out of bounds (${gridPos.x}, ${gridPos.y})`);
            return null;
        }

        // Check if occupied
        if (this.isOccupied(gridPos.x, gridPos.y)) {
            console.log(`❌ Placement failed: position occupied (${gridPos.x}, ${gridPos.y})`);
            return null;
        }

        // Check path with relaxed tolerance
        if (this.isOnPathStrict(gridPos.x, gridPos.y)) {
            console.log(`❌ Placement failed: too close to path (${gridPos.x}, ${gridPos.y})`);
            return null;
        }

        // Check obstacles
        if (this.isObstacle(gridPos.x, gridPos.y)) {
            console.log(`❌ Placement failed: obstacle at (${gridPos.x}, ${gridPos.y})`);
            return null;
        }

        console.log(`✅ Placement valid at grid (${gridPos.x}, ${gridPos.y}) - creating monster`);
        const monster = this.createMonster(gridPos.x, gridPos.y, monsterType);
        this.grid.set(key, monster);
        console.log(`🎉 Monster placed successfully at grid (${gridPos.x}, ${gridPos.y})`);
        return monster;
    }

    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.gridSize),
            y: Math.floor(y / this.gridSize)
        };
    }

    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }

    isValidPlacement(gridX, gridY) {
        // Check if position is within bounds
        if (!this.isInBounds(gridX, gridY)) {
            console.log(`Placement invalid: out of bounds (${gridX}, ${gridY})`);
            return false;
        }
        
        // Check if position is not occupied
        if (this.isOccupied(gridX, gridY)) {
            console.log(`Placement invalid: position occupied (${gridX}, ${gridY})`);
            return false;
        }
        
        // Check if position is not on the path (with tolerance)
        if (this.isOnPathStrict(gridX, gridY)) {
            console.log(`Placement invalid: too close to path (${gridX}, ${gridY})`);
            return false;
        }
        
        // Check if position is not an obstacle
        if (this.isObstacle(gridX, gridY)) {
            console.log(`Placement invalid: obstacle (${gridX}, ${gridY})`);
            return false;
        }
        
        console.log(`Placement valid at (${gridX}, ${gridY})`);
        return true;
    }

    validatePlacement(gridX, gridY) {
        if (!this.isInBounds(gridX, gridY)) return {ok: false, reason: 'out of bounds'};
        if (this.isOccupied(gridX, gridY)) return {ok: false, reason: 'occupied'};
        if (this.isOnPathStrict(gridX, gridY)) return {ok: false, reason: 'too close to path'};
        if (this.isObstacle(gridX, gridY)) return {ok: false, reason: 'obstacle'};
        return {ok: true, reason: 'valid'};
    }

    isInBounds(gridX, gridY) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.warn('Canvas not found for bounds checking');
            return false;
        }

        const maxGridX = Math.floor(canvas.width / this.gridSize);
        const maxGridY = Math.floor(canvas.height / this.gridSize);

        return gridX >= 0 && gridX < maxGridX && gridY >= 0 && gridY < maxGridY;
    }

    isOccupied(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        return this.grid.has(key);
    }

    isOnPathStrict(gridX, gridY) {
        const worldPos = this.gridToWorld(gridX, gridY);
        const tolerance = this.gridSize * 0.8; // Relaxed

        // Get path from pathfinding system if available
        const path = this.pathfindingSystem ? this.pathfindingSystem.getPath() : this.path;
        console.log(`Path check: path=${path ? path.length : 'null'} points, tolerance=${tolerance}`);

        if (!path || path.length < 2) {
            console.log('No path to check against - allowing placement');
            return false; // No path to check against
        }

        for (let i = 0; i < path.length - 1; i++) {
            const segment = {
                start: path[i],
                end: path[i + 1]
            };

            if (this.pointOnSegment(worldPos, segment, tolerance)) {
                return true;
            }
        }
        return false;
    }

    isObstacle(gridX, gridY) {
        const worldPos = this.gridToWorld(gridX, gridY);
        
        return this.obstacles.some(obstacle => {
            const dx = worldPos.x - obstacle.x;
            const dy = worldPos.y - obstacle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < obstacle.radius;
        });
    }

    pointOnSegment(point, segment, tolerance) {
        const dx = segment.end.x - segment.start.x;
        const dy = segment.end.y - segment.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return false;
        
        const t = ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / (length * length);
        
        if (t < 0 || t > 1) return false;
        
        const closestPoint = {
            x: segment.start.x + t * dx,
            y: segment.start.y + t * dy
        };
        
        const distance = Math.sqrt(
            (point.x - closestPoint.x) ** 2 + (point.y - closestPoint.y) ** 2
        );
        
        return distance <= tolerance;
    }

    createMonster(gridX, gridY, monsterType) {
        const worldPos = this.gridToWorld(gridX, gridY);
        
        const entity = new Entity();
        entity.addComponent(new PositionComponent(worldPos.x, worldPos.y));
        
        // Create monster component (will load from config if available)
        const monster = new MonsterComponent(monsterType);
        entity.addComponent(monster);
        
        // Get monster data for sprite rendering
        const monsterData = this.getMonsterData(monsterType);
        const sprite = new SpriteRenderer(32, 32, monsterData.color);
        entity.addComponent(sprite);
        
        entity.addTag('monster');
        
        return entity;
    }
    
    getMonsterData(monsterType) {
        // Try to get from configuration first
        if (window.configLoader && window.configLoader.configs.monsters) {
            const monsterConfig = window.configLoader.configs.monsters.find(m => m.id === monsterType.toLowerCase());
            if (monsterConfig) {
                return {
                    color: monsterConfig.color || '#9c27b0',
                    name: monsterConfig.name || monsterType
                };
            }
        }
        
        // Fallback to hardcoded types
        const hardcodedTypes = {
            'GEM': { color: '#9c27b0', name: 'Crystal Guardian' },
            'SLIME': { color: '#4caf50', name: 'Slime Defender' },
            'BEAST': { color: '#ff9800', name: 'Beast Warrior' }
        };
        
        return hardcodedTypes[monsterType] || { color: '#9c27b0', name: monsterType };
    }

    getMonsterAt(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        return this.grid.get(key) || null;
    }

    removeMonster(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        const monster = this.grid.get(key);
        if (monster) {
            monster.destroy();
            this.grid.delete(key);
            return true;
        }
        return false;
    }

    updatePlacementPreview(x, y) {
        if (!this.placementMode || !this.selectedMonster) return;
        
        const gridPos = this.worldToGrid(x, y);
        const isValid = this.isValidPlacement(gridPos.x, gridPos.y);
        
        this.placementPreview = {
            x: gridPos.x,
            y: gridPos.y,
            isValid: isValid
        };
    }

    render(ctx) {
        // Render grid
        this.renderGrid(ctx);
        
        // Render placement preview
        if (this.placementPreview) {
            this.renderPlacementPreview(ctx);
        }
        
        // Render monster range indicators
        this.renderMonsterRanges(ctx);
    }

    renderGrid(ctx) {
        const canvas = ctx.canvas;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x < canvas.width; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    renderPlacementPreview(ctx) {
        const worldPos = this.gridToWorld(this.placementPreview.x, this.placementPreview.y);
        
        ctx.save();
        ctx.fillStyle = this.placementPreview.isValid ? 
            this.validPlacementColor : this.invalidPlacementColor;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(
            worldPos.x - this.gridSize / 2, 
            worldPos.y - this.gridSize / 2,
            this.gridSize, 
            this.gridSize
        );
        ctx.restore();
    }

    renderMonsterRanges(ctx) {
        this.grid.forEach(monster => {
            const pos = monster.getComponent('PositionComponent');
            const monsterComp = monster.getComponent('MonsterComponent');
            
            if (pos && monsterComp) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, monsterComp.stats.range, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    updateEntity(entity, deltaTime) {
        // Update monster components
        const monster = entity.getComponent('MonsterComponent');
        if (monster) {
            monster.update(deltaTime);
        }
    }

    getAllMonsters() {
        return Array.from(this.grid.values());
    }

    getMonsterCount() {
        return this.grid.size;
    }
}
