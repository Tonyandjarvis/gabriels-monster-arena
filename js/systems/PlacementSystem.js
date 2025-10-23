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
    }

    setPath(path) {
        this.path = path;
    }

    setObstacles(obstacles) {
        this.obstacles = obstacles;
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
        
        if (this.isValidPlacement(gridPos.x, gridPos.y)) {
            const monster = this.createMonster(gridPos.x, gridPos.y, monsterType);
            this.grid.set(key, monster);
            return monster;
        }
        return null;
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

    isInBounds(gridX, gridY) {
        const canvas = document.getElementById('gameCanvas');
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
        const tolerance = this.gridSize * 0.8; // Allow placement closer to path
        
        for (let i = 0; i < this.path.length - 1; i++) {
            const segment = {
                start: this.path[i],
                end: this.path[i + 1]
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
        
        const monsterData = MonsterComponent.TYPES[monsterType];
        const monster = new MonsterComponent(monsterType, monsterData.stats);
        entity.addComponent(monster);
        
        const sprite = new SpriteRenderer(32, 32, monsterData.color);
        entity.addComponent(sprite);
        
        entity.addTag('monster');
        
        return entity;
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
