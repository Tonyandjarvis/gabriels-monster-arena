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
        
        // Debug logging
        const monsterCount = Array.from(this.entities).filter(e => e.hasTag('monster')).length;
        const enemyCount = Array.from(this.entities).filter(e => e.hasTag('enemy')).length;
        if (monsterCount > 0 || enemyCount > 0) {
            console.log(`CombatSystem: ${monsterCount} monsters, ${enemyCount} enemies, ${this.projectiles.length} projectiles`);
        }
    }

    updateMonsters(deltaTime) {
        this.entities.forEach(monster => {
            const monsterComp = monster.getComponent('MonsterComponent');
            const pos = monster.getComponent('PositionComponent');
            
            if (monsterComp && pos && !monsterComp.isDead()) {
                this.updateMonsterCombat(monster, monsterComp, pos, deltaTime);
            }
        });
    }

    updateMonsterCombat(monster, monsterComp, pos, deltaTime) {
        // Find target if needed
        if (!monsterComp.target || this.isTargetDead(monsterComp.target)) {
            monsterComp.target = this.findNearestEnemy(pos, monsterComp.stats.range);
        }
        
        // Attack if target is in range and cooldown is ready
        if (monsterComp.target && this.isTargetInRange(pos, monsterComp.target, monsterComp.stats.range)) {
            if (monsterComp.canAttack()) {
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
        this.entities.forEach(entity => {
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
                if (targetPos && !projectileComp.target.getComponent('EnemyComponent').isDead()) {
                    const dx = targetPos.x - pos.x;
                    const dy = targetPos.y - pos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 10) {
                        // Hit target
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
                    this.projectilePool.release(projectile);
                    this.projectiles.splice(i, 1);
                }
            } else {
                // No target
                this.projectilePool.release(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }

    hitTarget(projectile, projectileComp) {
        if (!projectileComp.target || !projectileComp.hitTarget(projectileComp.target)) {
            return;
        }
        
        const target = projectileComp.target;
        const enemyComp = target.getComponent('EnemyComponent');
        const targetPos = target.getComponent('PositionComponent');
        
        if (enemyComp && targetPos) {
            const damage = projectileComp.damage;
            const died = enemyComp.takeDamage(damage);
            
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
                this.combatEvents.push({
                    type: 'enemy_died',
                    enemy: target,
                    reward: enemyComp.getReward()
                });
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
}
