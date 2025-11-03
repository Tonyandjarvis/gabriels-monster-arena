class CombatSystem extends System {
    constructor() {
        super();
        this.entities = new Map(); // Initialize entities Map
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
        console.log(`🔫 CombatSystem.update() called with deltaTime: ${deltaTime}, entities: ${this.entities.size}`);

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
        console.log(`CombatSystem: updateMonsters called, entities count: ${this.entities.size}`);

        let monsterCount = 0;
        this.entities.forEach(entity => {
            // Only process entities with monster tag
            if (!entity.hasTag('monster')) return;

            monsterCount++;
            const monsterComp = entity.getComponent('MonsterComponent');
            const pos = entity.getComponent('PositionComponent');

            if (monsterComp && pos && !monsterComp.isDead()) {
                console.log(`Processing monster ${entity.id} at (${pos.x}, ${pos.y})`);
                this.updateMonsterCombat(entity, monsterComp, pos, deltaTime);
            } else {
                console.log(`Skipping monster ${entity.id} - missing components or dead`);
            }
        });

        console.log(`CombatSystem: Processed ${monsterCount} monsters`);
    }

    updateMonsterCombat(monster, monsterComp, pos, deltaTime) {
        console.log(`⚔️ Processing monster ${monster.id} at position (${pos.x}, ${pos.y})`);

        // Find target if needed - force retarget every few seconds to avoid stuck targeting
        if (!monsterComp.target || this.isTargetDead(monsterComp.target) ||
            (monsterComp.lastTargetTime && Date.now() - monsterComp.lastTargetTime > 3000)) {
            console.log(`🎯 Monster ${monster.id} needs new target`);
            monsterComp.target = this.findNearestEnemy(pos, monsterComp.stats.range);
            monsterComp.lastTargetTime = Date.now();
            if (monsterComp.target) {
                console.log(`✅ Monster ${monster.id} targeting enemy ${monsterComp.target.id} at range ${monsterComp.stats.range}`);
            } else {
                console.log(`❌ Monster ${monster.id} found no enemies in range ${monsterComp.stats.range}`);
            }
        } else {
            console.log(`🎯 Monster ${monster.id} has existing target: ${monsterComp.target ? monsterComp.target.id : 'none'}`);
        }

        // Attack if target is in range and cooldown is ready
        if (monsterComp.target) {
            const inRange = this.isTargetInRange(pos, monsterComp.target, monsterComp.stats.range);
            console.log(`📏 Monster ${monster.id} target in range: ${inRange}`);

            if (inRange) {
                const canAttack = monsterComp.canAttack();
                const timeSinceLastAttack = Date.now() - monsterComp.lastAttack;
                const cooldown = monsterComp.attackCooldown;

                console.log(`⏰ Monster ${monster.id} attack check: canAttack=${canAttack}, timeSince=${timeSinceLastAttack}ms, cooldown=${cooldown}ms`);

                if (canAttack) {
                    console.log(`🚀 Monster ${monster.id} ATTACKING enemy ${monsterComp.target.id}!`);
                    this.performAttack(monster, monsterComp, pos);
                } else {
                    console.log(`⏳ Monster ${monster.id} on cooldown (${timeSinceLastAttack}/${cooldown}ms)`);
                }
            }
        }

        // Update monster state
        monsterComp.update(deltaTime);
    }

    findNearestEnemy(position, range) {
        console.log(`Searching for enemy near (${position.x}, ${position.y}) with range ${range}`);
        
        if (!this.gameEngine) {
            console.error('No gameEngine reference in CombatSystem!');
            return null;
        }
        
        let nearest = null;
        let minDist = Infinity;
        
        const entitiesToSearch = this.gameEngine ? this.gameEngine.entities : this.entities;

        entitiesToSearch.forEach(entity => {
            if (entity.hasTag('enemy')) {
                const enemyPos = entity.getComponent('PositionComponent');
                if (enemyPos) {
                    const dist = Math.sqrt(
                        Math.pow(enemyPos.x - position.x, 2) + Math.pow(enemyPos.y - position.y, 2)
                    );
                    if (dist <= range && dist < minDist) {
                        minDist = dist;
                        nearest = entity;
                    }
                }
            }
        });
        
        if (!nearest) {
            console.warn('No enemy found within range - expanding search');
            // Emergency fallback: try larger range
            range *= 1.5;
            // Repeat search with larger range...
        }
        
        return nearest;
    }

    isTargetInRange(position, target, range) {
        const targetPos = target.getComponent('PositionComponent');
        if (!targetPos) return false;
        
        // Calculate distance manually
        const dx = targetPos.x - position.x;
        const dy = targetPos.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= range;
    }

    isTargetDead(target) {
        const enemyComp = target.getComponent('EnemyComponent');
        return !enemyComp || enemyComp.isDead();
    }

    performAttack(monster, monsterComp, pos) {
        console.log(`💥 PERFORMING ATTACK: Monster ${monster.id} firing at ${monsterComp.target.id}`);

        const damage = monsterComp.attack();
        console.log(`⚡ Damage calculated: ${damage}`);

        // Create projectile
        const projectile = this.projectilePool.acquire();
        console.log(`🚀 Projectile acquired from pool: ${projectile ? 'success' : 'failed'}`);

        if (!projectile) {
            console.error('❌ Failed to acquire projectile from pool!');
            return;
        }

        const projectileComp = projectile.getComponent('ProjectileComponent');
        const projectilePos = projectile.getComponent('PositionComponent');

        if (!projectileComp || !projectilePos) {
            console.error('❌ Projectile missing required components!');
            return;
        }

        projectilePos.setPosition(pos.x, pos.y);
        projectileComp.initialize(damage, 400, monsterComp.target);
        projectileComp.sourceMonster = monster; // Track which monster fired this projectile

        this.projectiles.push(projectile);
        console.log(`📦 Projectile created and added to active list. Total projectiles: ${this.projectiles.length}`);

        // Add combat event
        this.combatEvents.push({
            type: 'attack',
            monster: monster,
            target: monsterComp.target,
            damage: damage
        });

        console.log(`📢 Combat event added: attack from ${monster.id} to ${monsterComp.target.id}`);
    }

    updateProjectiles(deltaTime) {
        console.log(`🚀 Updating ${this.projectiles.length} projectiles`);

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const projectileComp = projectile.getComponent('ProjectileComponent');
            const pos = projectile.getComponent('PositionComponent');

            console.log(`📍 Projectile ${i}: pos=(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}), target=${projectileComp.target ? projectileComp.target.id : 'none'}`);

            if (!projectileComp.update(deltaTime)) {
                console.log(`⏰ Projectile ${i} expired, releasing to pool`);
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

                    // Improved collision detection with larger radius and prediction
                    const collisionRadius = 35; // Increased from 15
                    const enemySpeed = enemyComp.getEffectiveSpeed();
                    const predictionTime = distance / projectileComp.speed;

                    // Predict enemy position based on their movement
                    const predictedX = targetPos.x + (enemySpeed * predictionTime * 0.003); // Adjusted factor
                    const predictedY = targetPos.y + (enemyComp.direction ? enemyComp.direction.y * enemySpeed * predictionTime * 0.0005 : 0); // Add Y prediction if available

                    const predictedDx = predictedX - pos.x;
                    const predictedDy = predictedY - pos.y;
                    const predictedDistance = Math.sqrt(predictedDx * predictedDx + predictedDy * predictedDy);

                    if (distance < collisionRadius || predictedDistance < collisionRadius) {
                        // Hit target
                        console.log(`Hit detected! Distance: ${distance}, Predicted: ${predictedDistance}`);
                        this.hitTarget(projectile, projectileComp);
                        this.projectilePool.release(projectile);
                        this.projectiles.splice(i, 1);
                    } else {
                        // Miss - debug logging
                        console.log(`Missed hit - Distance: ${distance}, Predicted: ${predictedDistance}`);

                        // Move towards target with slight prediction
                        const targetX = (targetPos.x + predictedX) / 2; // Average current and predicted
                        const targetY = (targetPos.y + predictedY) / 2;

                        const moveDx = targetX - pos.x;
                        const moveDy = targetY - pos.y;
                        const moveDistance = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

                        if (moveDistance > 0) {
                            const moveX = (moveDx / moveDistance) * projectileComp.speed * (deltaTime / 1000);
                            const moveY = (moveDy / moveDistance) * projectileComp.speed * (deltaTime / 1000);
                            pos.move(moveX, moveY);
                        }
                    }
                } else {
                    // Target is dead or invalid - try to find new target
                    console.log('Projectile target is dead or invalid, trying to retarget');
                    const newTarget = this.findNearestEnemy(pos, 100); // Search within 100 pixels for new target
                    if (newTarget) {
                        projectileComp.target = newTarget;
                        console.log('Projectile retargeted to new enemy');
                    } else {
                        this.projectilePool.release(projectile);
                        this.projectiles.splice(i, 1);
                    }
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
            projectilePoolSize: this.projectilePool.getPooledCount(),
            totalEntities: this.entities.size,
            monsterCount: Array.from(this.entities.values()).filter(e => e.hasTag('monster')).length,
            enemyCount: Array.from(this.entities.values()).filter(e => e.hasTag('enemy')).length
        };
    }

    // Debug function - call from browser console: window.gameEngine.combatSystem.testCombat()
    testCombat() {
        console.log('🧪 === COMBAT SYSTEM TEST ===');
        console.log('Stats:', this.getCombatStats());

        console.log('🎯 Testing monster targeting...');
        this.entities.forEach(entity => {
            if (entity.hasTag('monster')) {
                const monsterComp = entity.getComponent('MonsterComponent');
                const pos = entity.getComponent('PositionComponent');
                if (monsterComp && pos) {
                    console.log(`Monster ${entity.id} at (${pos.x}, ${pos.y})`);
                    console.log(`  Range: ${monsterComp.stats.range}`);
                    console.log(`  Can attack: ${monsterComp.canAttack()}`);
                    console.log(`  Last attack: ${monsterComp.lastAttack}`);
                    console.log(`  Cooldown: ${monsterComp.attackCooldown}`);

                    const target = this.findNearestEnemy(pos, monsterComp.stats.range);
                    console.log(`  Target found: ${target ? target.id : 'none'}`);

                    if (target) {
                        const inRange = this.isTargetInRange(pos, target, monsterComp.stats.range);
                        console.log(`  Target in range: ${inRange}`);
                    }
                }
            }
        });

        console.log('👹 Testing enemy detection...');
        this.entities.forEach(entity => {
            if (entity.hasTag('enemy')) {
                const enemyComp = entity.getComponent('EnemyComponent');
                const pos = entity.getComponent('PositionComponent');
                console.log(`Enemy ${entity.id}: alive=${enemyComp ? !enemyComp.isDead() : 'no comp'}, pos=${pos ? `(${pos.x}, ${pos.y})` : 'no pos'}`);
            }
        });

        console.log('=== TEST COMPLETE ===');
        return 'Combat system test completed - check console logs above';
    }

    getCombatEvents() {
        const events = [...this.combatEvents];
        this.combatEvents.length = 0;
        return events;
    }

    addEntity(entity) {
        if (entity && !this.entities.has(entity.id)) {
            this.entities.set(entity.id, entity);
            console.log(`Entity ${entity.id} added to CombatSystem`);
        }
    }

    removeEntity(entity) {
        if (entity && this.entities.has(entity.id)) {
            this.entities.delete(entity.id);
            console.log(`Entity ${entity.id} removed from CombatSystem`);
        }
    }
}
