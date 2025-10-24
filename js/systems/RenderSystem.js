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
        try {
            // Clear canvas (only RenderSystem should do this)
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Render background
            this.renderBackground(ctx);
            
            // Render placement grid
            this.renderPlacementGrid(ctx);
            
            // Render path (if pathfinding system exists)
            if (this.pathfindingSystem) {
                this.pathfindingSystem.render(ctx);
            }
            
            // Render game entities in proper order
            this.renderEntities(ctx);
            
            // Render attack ranges
            this.renderAttackRanges(ctx);
            
            // Render UI elements
            this.renderUI(ctx);
            
            console.log(`RenderSystem rendered ${this.entities.size} entities`);
        } catch (error) {
            console.error('Error in RenderSystem render:', error);
            // Show error on canvas
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Rendering Error', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
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

    renderPlacementGrid(ctx) {
        // Get grid size from placement system if available
        const gridSize = 32; // Default grid size
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= canvasWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= canvasHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    renderAttackRanges(ctx) {
        // Render attack ranges for monsters when hovering or placing
        this.entities.forEach(entity => {
            if (entity.hasTag('monster')) {
                const monsterComp = entity.getComponent('MonsterComponent');
                const posComp = entity.getComponent('PositionComponent');
                
                if (monsterComp && posComp) {
                    // Show range circle for monsters
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(posComp.x, posComp.y, monsterComp.stats.range, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        });
    }

    renderEntities(ctx) {
        try {
            // Create sorted list of entities by render priority
            const entitiesToRender = Array.from(this.entities)
                .filter(entity => entity.active)
                .sort((a, b) => {
                    // Define render order: enemies (back) -> monsters -> projectiles (front)
                    const getRenderPriority = (entity) => {
                        if (entity.hasTag('enemy')) return 1;
                        if (entity.hasTag('monster')) return 2;
                        if (entity.hasTag('projectile')) return 3;
                        return 0;
                    };
                    
                    return getRenderPriority(a) - getRenderPriority(b);
                });
            
            // Render entities in order
            entitiesToRender.forEach(entity => {
                try {
                    this.renderEntity(entity, ctx);
                } catch (error) {
                    console.error(`Error rendering entity ${entity.id}:`, error);
                }
            });
            
            console.log(`Rendered ${entitiesToRender.length} entities`);
        } catch (error) {
            console.error('Error in renderEntities:', error);
        }
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
            const barWidth = 40;
            const barHeight = 6;
            const barY = pos.y - 30;
            
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
            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x - barWidth / 2, barY, barWidth, barHeight);
            
            // Show level for monsters
            if (entity.hasTag('monster') && healthComp.level) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Lv.${healthComp.level}`, pos.x, barY - 5);
            }
            
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
