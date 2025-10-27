class CombatSystem extends System {
    constructor() {
        super();
        this.projectiles = [];
        this.projectilePool = new ObjectPool(
            () => this.createProjectile(),
            (projectile) => projectile.reset()
        );
        this.combatEvents = [];
        this.damageNumbers = [];
        this.damageNumberPool = new ObjectPool(
            () => this.createDamageNumber(),
            (damageNumber) => damageNumber.reset()
        );
        
        // System dependencies
        this.renderSystem = null;
        this.particleSystem = null;
        this.audioSystem = null;
    }

    setDependencies(dependencies) {
        try {
            console.log('Setting CombatSystem dependencies...');
            this.renderSystem = dependencies.renderSystem;
            this.particleSystem = dependencies.particleSystem;
            this.audioSystem = dependencies.audioSystem;
            this.gameEngine = dependencies.gameEngine;
            console.log('CombatSystem dependencies set successfully');
        } catch (error) {
            console.error('Failed to set CombatSystem dependencies:', error);
            throw new Error(`CombatSystem dependency setup failed: ${error.message}`);
        }
    }

    createProjectile() {
        const entity = new Entity();
        entity.addComponent(new PositionComponent());
        entity.addComponent(new ProjectileComponent());
        entity.addComponent(new SpriteRenderer(8, 8, '#ffff00'));
        entity.addTag('projectile');
        return entity;
    }

    createDamageNumber() {
        return {
            x: 0,
            y: 0,
            damage: 0,
            lifetime: 1000,
            age: 0,
            velocity: { x: 0, y: -50 },
            color: '#ff0000',
            reset() {
                this.x = 0;
                this.y = 0;
                this.damage = 0;
                this.lifetime = 1000;
                this.age = 0;
                this.velocity = { x: 0, y: -50 };
                this.color = '#ff0000';
            }
        };
    }

    update(deltaTime) {
        // Update monsters
        this.updateMonsters(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update damage numbers
        this.updateDamageNumbers(deltaTime);
        
        // Process combat events
        this.processCombatEvents();
        
        // Debug logging every 4 seconds
        if (this.debugTimer === undefined) {
            this.debugTimer = 0;
        }
        
        this.debugTimer += deltaTime;
        if (this.debugTimer >= 4000) {
            const allEntities = Array.from(this.entities);
            const monsterCount = allEntities.filter(e => e.hasTag('monster')).length;
            const enemyCount = allEntities.filter(e => e.hasTag('enemy')).length;
            const projectileCount = allEntities.filter(e => e.hasTag('projectile')).length;
            const activeProjectiles = this.projectiles.length;
            const activeDamageNumbers = this.damageNumbers.length;
            
            console.log(`CombatSystem Debug:
        Total entities: ${allEntities.length}
        - Monsters: ${monsterCount}
        - Enemies: ${enemyCount}
        - Projectiles (entities): ${projectileCount}
        Active projectile pool: ${activeProjectiles}
        Active damage numbers: ${activeDamageNumbers}`);
            this.debugTimer = 0;
        }
    }

    updateMonsters(deltaTime) {
        this.entities.forEach(entity => {
            // Only process entities with monster tag
            if (!entity.hasTag('monster')) return;
            
            const monsterComp = entity.getComponent('MonsterComponent');
            const pos = entity.getComponent('PositionComponent');
            
            if (monsterComp && pos && !monsterComp.isDead()) {
                this.updateMonsterCombat(entity, monsterComp, pos, deltaTime);
            }
        });
    }

    updateMonsterCombat(monster, monsterComp, pos, deltaTime) {
        // Find target if needed - force retarget every few seconds to avoid stuck targeting
        if (!monsterComp.target || this.isTargetDead(monsterComp.target) || 
            (monsterComp.lastTargetTime && Date.now() - monsterComp.lastTargetTime > 3000)) {
            monsterComp.target = this.findNearestEnemy(pos, monsterComp.stats.range);
            monsterComp.lastTargetTime = Date.now();
            if (monsterComp.target) {
                console.log(`Monster ${monster.id} targeting enemy ${monsterComp.target.id} at range ${monsterComp.stats.range}`);
            } else {
                console.log(`Monster ${monster.id} found no enemies in range ${monsterComp.stats.range}`);
            }
        }
        
        // Attack if target is in range and cooldown is ready
        if (monsterComp.target && this.isTargetInRange(pos, monsterComp.target, monsterComp.stats.range)) {
            const canAttack = monsterComp.canAttack();
            const timeSinceLastAttack = Date.now() - monsterComp.lastAttack;
            const cooldown = monsterComp.attackCooldown;
            
            console.log(`Monster ${monster.id} attack check: canAttack=${canAttack}, timeSince=${timeSinceLastAttack}, cooldown=${cooldown}`);
            
            if (canAttack) {
                console.log(`Monster ${monster.id} attacking enemy ${monsterComp.target.id}`);
                this.performAttack(monster, monsterComp, pos);
            }
        }
        
        // Update monster state
        monsterComp.update(deltaTime);
    }

    findNearestEnemy(position, range) {
        let nearestEnemy = null;
        let nearestDistance = range;
        
        // Search through all entities with enemy tag
        // Use GameEngine's entities if available, otherwise fall back to system entities
        const entitiesToSearch = this.gameEngine ? this.gameEngine.entities : this.entities;
        
        entitiesToSearch.forEach(entity => {
            if (entity.hasTag('enemy')) {
                const enemyPos = entity.getComponent('PositionComponent');
                const enemyComp = entity.getComponent('EnemyComponent');
                
                if (enemyPos && enemyComp && !enemyComp.isDead()) {
                    const distance = position.distanceTo(enemyPos);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestEnemy = entity;
                    }
                }
            }
        });
        
        return nearestEnemy;
    }

    isTargetInRange(position, target, range) {
        const targetPos = target.getComponent('PositionComponent');
        if (!targetPos) return false;
        
        return position.distanceTo(targetPos) <= range;
    }

    isTargetDead(target) {
        const enemyComp = target.getComponent('EnemyComponent');
        return !enemyComp || enemyComp.isDead();
    }

    performAttack(monster, monsterComp, pos) {
        const damage = monsterComp.attack();
        
        // Create projectile
        const projectile = this.projectilePool.acquire();
        const projectileComp = projectile.getComponent('ProjectileComponent');
        const projectilePos = projectile.getComponent('PositionComponent');
        
        projectilePos.setPosition(pos.x, pos.y);
        projectileComp.initialize(damage, 300, monsterComp.target);
        projectileComp.sourceMonster = monster; // Track which monster fired this projectile
        
        this.projectiles.push(projectile);
        
        // Add combat event
        this.combatEvents.push({
            type: 'attack',
            monster: monster,
            target: monsterComp.target,
            damage: damage
        });
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const projectileComp = projectile.getComponent('ProjectileComponent');
            const pos = projectile.getComponent('PositionComponent');
            
            if (!projectileComp.update(deltaTime)) {
                // Projectile expired
                this.projectilePool.release(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Move projectile towards target
            if (projectileComp.target) {
                const targetPos = projectileComp.target.getComponent('PositionComponent');
                const enemyComp = projectileComp.target.getComponent('EnemyComponent');
                
                if (targetPos && enemyComp && !enemyComp.isDead()) {
                    const dx = targetPos.x - pos.x;
                    const dy = targetPos.y - pos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 15) { // Increased hit detection radius
                        // Hit target
                        console.log(`Projectile hit enemy at distance ${distance}`);
                        this.hitTarget(projectile, projectileComp);
                        this.projectilePool.release(projectile);
                        this.projectiles.splice(i, 1);
                    } else {
                        // Move towards target
                        const moveX = (dx / distance) * projectileComp.speed * (deltaTime / 1000);
                        const moveY = (dy / distance) * projectileComp.speed * (deltaTime / 1000);
                        pos.move(moveX, moveY);
                    }
                } else {
                    // Target is dead or invalid
                    console.log('Projectile target is dead or invalid, removing projectile');
                    this.projectilePool.release(projectile);
                    this.projectiles.splice(i, 1);
                }
            } else {
                // No target
                console.log('Projectile has no target, removing');
                this.projectilePool.release(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }

    hitTarget(projectile, projectileComp) {
        if (!projectileComp.target) {
            console.log('HitTarget: No target specified');
            return;
        }
        
        const target = projectileComp.target;
        const enemyComp = target.getComponent('EnemyComponent');
        const targetPos = target.getComponent('PositionComponent');
        
        if (!enemyComp || !targetPos) {
            console.log('HitTarget: Target missing EnemyComponent or PositionComponent');
            return;
        }
        
        if (enemyComp.isDead()) {
            console.log('HitTarget: Target is already dead');
            return;
        }
        
        // Check if projectile can hit this target
        if (!projectileComp.hitTarget(target)) {
            console.log('HitTarget: Projectile cannot hit this target');
            return;
        }
        
        const damage = projectileComp.damage;
        console.log(`HitTarget: Dealing ${damage} damage to enemy ${target.id}`);
        
        const died = enemyComp.takeDamage(damage);
        console.log(`HitTarget: Enemy ${died ? 'died' : 'survived'} (health: ${enemyComp.stats.health}/${enemyComp.stats.maxHealth})`);
        
        // Create damage number
        const damageNumber = this.damageNumberPool.acquire();
        damageNumber.x = targetPos.x;
        damageNumber.y = targetPos.y;
        damageNumber.damage = damage;
        damageNumber.color = died ? '#ff0000' : '#ffff00';
        this.damageNumbers.push(damageNumber);
        
        // Add combat event
        this.combatEvents.push({
            type: 'hit',
            target: target,
            damage: damage,
            died: died
        });
        
        // If enemy died, add death event
        if (died) {
            console.log(`HitTarget: Enemy ${target.id} died, adding death event`);
            this.combatEvents.push({
                type: 'enemy_died',
                enemy: target,
                reward: enemyComp.getReward()
            });
            
            // Don't destroy the enemy here - let the death event handler do it
            // This prevents multiple projectiles from hitting the same enemy
        }
        
        // Give experience to the monster that fired the projectile
        if (died && projectileComp.sourceMonster) {
            const monsterComp = projectileComp.sourceMonster.getComponent('MonsterComponent');
            if (monsterComp) {
                const expGained = enemyComp.getReward() / 2; // Half the reward as experience
                const leveledUp = monsterComp.addExperience(expGained);
                
                if (leveledUp) {
                    this.combatEvents.push({
                        type: 'monster_leveled_up',
                        monster: projectileComp.sourceMonster,
                        newLevel: monsterComp.level
                    });
                }
            }
        }
    }

    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const damageNumber = this.damageNumbers[i];
            damageNumber.age += deltaTime;
            
            if (damageNumber.age >= damageNumber.lifetime) {
                this.damageNumberPool.release(damageNumber);
                this.damageNumbers.splice(i, 1);
            } else {
                // Move damage number
                damageNumber.x += damageNumber.velocity.x * (deltaTime / 1000);
                damageNumber.y += damageNumber.velocity.y * (deltaTime / 1000);
                
                // Fade out
                const alpha = 1 - (damageNumber.age / damageNumber.lifetime);
                damageNumber.alpha = alpha;
            }
        }
    }

    processCombatEvents() {
        this.combatEvents.forEach(event => {
            switch (event.type) {
                case 'attack':
                    // Handle attack event
                    break;
                case 'hit':
                    // Handle hit event
                    break;
            }
        });
        
        this.combatEvents.length = 0;
    }

    render(ctx) {
        // Render projectiles
        this.projectiles.forEach(projectile => {
            const pos = projectile.getComponent('PositionComponent');
            const sprite = projectile.getComponent('SpriteRenderer');
            
            if (pos && sprite) {
                sprite.render(ctx, pos);
            }
        });
        
        // Render damage numbers
        this.damageNumbers.forEach(damageNumber => {
            ctx.save();
            ctx.fillStyle = damageNumber.color;
            ctx.globalAlpha = damageNumber.alpha || 1;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(damageNumber.damage.toString(), damageNumber.x, damageNumber.y);
            ctx.restore();
        });
    }

    getCombatStats() {
        return {
            activeProjectiles: this.projectiles.length,
            activeDamageNumbers: this.damageNumbers.length,
            projectilePoolSize: this.projectilePool.getPooledCount()
        };
    }

    getCombatEvents() {
        const events = [...this.combatEvents];
        this.combatEvents.length = 0;
        return events;
    }
}
