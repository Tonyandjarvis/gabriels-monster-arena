class RenderSystem extends System {
    constructor() {
        super();
        this.background = null;
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.renderLayers = {
            background: [],
            path: [],
            monsters: [],
            enemies: [],
            projectiles: [],
            ui: [],
            effects: []
        };
    }

    setBackground(backgroundImage) {
        this.background = backgroundImage;
    }

    update(deltaTime) {
        // Update animations and effects
        this.entities.forEach(entity => {
            const sprite = entity.getComponent('SpriteRenderer');
            if (sprite) {
                sprite.update(deltaTime);
            }
        });
    }

    render(ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Render background
        this.renderBackground(ctx);
        
        // Render game entities
        this.renderEntities(ctx);
        
        // Render UI elements
        this.renderUI(ctx);
    }

    renderBackground(ctx) {
        if (this.background) {
            ctx.drawImage(this.background, 0, 0, ctx.canvas.width, ctx.canvas.height);
        } else {
            // Default background
            const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
            gradient.addColorStop(0, '#2c3e50');
            gradient.addColorStop(1, '#34495e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    renderEntities(ctx) {
        // Render enemies first (behind monsters)
        this.entities.forEach(entity => {
            if (entity.hasTag('enemy')) {
                this.renderEntity(entity, ctx);
            }
        });
        
        // Render monsters
        this.entities.forEach(entity => {
            if (entity.hasTag('monster')) {
                this.renderEntity(entity, ctx);
            }
        });
        
        // Render projectiles
        this.entities.forEach(entity => {
            if (entity.hasTag('projectile')) {
                this.renderEntity(entity, ctx);
            }
        });
    }

    renderEntity(entity, ctx) {
        const pos = entity.getComponent('PositionComponent');
        const sprite = entity.getComponent('SpriteRenderer');
        
        if (pos && sprite && sprite.visible) {
            // Render sprite
            sprite.render(ctx, pos);
            
            // Render health bars for monsters and enemies
            this.renderHealthBar(entity, ctx, pos);
            
            // Render special effects
            this.renderSpecialEffects(entity, ctx, pos);
        }
    }

    renderHealthBar(entity, ctx, pos) {
        let healthComp = null;
        let maxHealth = 100;
        let currentHealth = 100;
        
        if (entity.hasTag('monster')) {
            healthComp = entity.getComponent('MonsterComponent');
            if (healthComp) {
                maxHealth = healthComp.stats.maxHealth;
                currentHealth = healthComp.stats.health;
            }
        } else if (entity.hasTag('enemy')) {
            healthComp = entity.getComponent('EnemyComponent');
            if (healthComp) {
                maxHealth = healthComp.stats.maxHealth;
                currentHealth = healthComp.stats.health;
            }
        }
        
        if (healthComp && maxHealth > 0) {
            const healthPercentage = currentHealth / maxHealth;
            const barWidth = 30;
            const barHeight = 4;
            const barY = pos.y - 25;
            
            // Background
            ctx.save();
            ctx.fillStyle = '#333';
            ctx.fillRect(pos.x - barWidth / 2, barY, barWidth, barHeight);
            
            // Health
            ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : 
                           healthPercentage > 0.25 ? '#FF9800' : '#f44336';
            ctx.fillRect(pos.x - barWidth / 2, barY, barWidth * healthPercentage, barHeight);
            
            // Border
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(pos.x - barWidth / 2, barY, barWidth, barHeight);
            ctx.restore();
        }
    }

    renderSpecialEffects(entity, ctx, pos) {
        // Render attack effects for monsters
        if (entity.hasTag('monster')) {
            const monsterComp = entity.getComponent('MonsterComponent');
            if (monsterComp && monsterComp.isAttacking) {
                this.renderAttackEffect(ctx, pos, monsterComp);
            }
        }
        
        // Render death effects for enemies
        if (entity.hasTag('enemy')) {
            const enemyComp = entity.getComponent('EnemyComponent');
            if (enemyComp && enemyComp.isDead()) {
                this.renderDeathEffect(ctx, pos);
            }
        }
    }

    renderAttackEffect(ctx, pos, monsterComp) {
        ctx.save();
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        
        const radius = monsterComp.stats.range;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    renderDeathEffect(ctx, pos) {
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.globalAlpha = 0.5;
        
        // Simple death effect - red circle that fades
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    renderUI(ctx) {
        // This will be handled by the UISystem
        // Just a placeholder for now
    }

    addEntity(entity) {
        this.entities.add(entity);
    }

    removeEntity(entity) {
        this.entities.delete(entity);
    }

    setCamera(x, y, zoom = 1) {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.zoom = zoom;
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.camera.zoom,
            y: (worldY - this.camera.y) * this.camera.zoom
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.camera.zoom + this.camera.x,
            y: screenY / this.camera.zoom + this.camera.y
        };
    }
}
