class WaveSystem extends System {
    constructor() {
        super();
        this.currentWave = 0;
        this.waves = this.generateWaves();
        this.spawnTimer = 0;
        this.spawnInterval = 1000;
        this.enemiesInWave = 0;
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.waveActive = false;
        this.waveComplete = false;
        this.waveReward = 0;
        this.spawnPosition = { x: 50, y: 200 };
        this.combatEvents = [];
    }

    generateWaves() {
        return [
            // Wave 1
            {
                enemies: [
                    { type: 'BASIC', count: 5, spawnDelay: 1000 },
                    { type: 'FAST', count: 3, spawnDelay: 800 }
                ],
                reward: 100,
                description: 'First wave - Basic enemies'
            },
            // Wave 2
            {
                enemies: [
                    { type: 'BASIC', count: 8, spawnDelay: 900 },
                    { type: 'FAST', count: 5, spawnDelay: 700 },
                    { type: 'TANK', count: 2, spawnDelay: 1500 }
                ],
                reward: 150,
                description: 'Second wave - Mixed enemies'
            },
            // Wave 3
            {
                enemies: [
                    { type: 'BASIC', count: 10, spawnDelay: 800 },
                    { type: 'FAST', count: 8, spawnDelay: 600 },
                    { type: 'TANK', count: 3, spawnDelay: 1200 },
                    { type: 'FLYING', count: 4, spawnDelay: 1000 }
                ],
                reward: 200,
                description: 'Third wave - All enemy types'
            },
            // Wave 4
            {
                enemies: [
                    { type: 'BASIC', count: 15, spawnDelay: 700 },
                    { type: 'FAST', count: 12, spawnDelay: 500 },
                    { type: 'TANK', count: 5, spawnDelay: 1000 },
                    { type: 'FLYING', count: 6, spawnDelay: 800 }
                ],
                reward: 250,
                description: 'Fourth wave - Large numbers'
            },
            // Wave 5 (Boss wave)
            {
                enemies: [
                    { type: 'TANK', count: 10, spawnDelay: 2000 },
                    { type: 'FLYING', count: 8, spawnDelay: 1500 }
                ],
                reward: 300,
                description: 'Boss wave - Elite enemies'
            }
        ];
    }

    startWave() {
        console.log(`Starting wave ${this.currentWave + 1} of ${this.waves.length}`);
        
        if (this.currentWave >= this.waves.length) {
            // All waves completed
            this.combatEvents.push({
                type: 'all_waves_complete'
            });
            return false;
        }

        const wave = this.waves[this.currentWave];
        this.waveActive = true;
        this.waveComplete = false;
        this.enemiesInWave = 0;
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.waveReward = wave.reward;
        this.spawnTimer = 0;

        // Calculate total enemies in wave
        wave.enemies.forEach(enemyGroup => {
            this.enemiesInWave += enemyGroup.count;
        });

        console.log(`Wave ${this.currentWave + 1} started with ${this.enemiesInWave} enemies`);

        this.combatEvents.push({
            type: 'wave_started',
            wave: this.currentWave + 1,
            description: wave.description
        });

        this.currentWave++; // Increment wave counter
        return true;
    }

    update(deltaTime) {
        if (this.waveActive && !this.waveComplete) {
            this.spawnTimer += deltaTime;
            this.updateSpawning(deltaTime);
            this.updateWaveStatus();
        }
    }

    updateSpawning(deltaTime) {
        if (this.enemiesSpawned >= this.enemiesInWave) {
            return;
        }

        const wave = this.waves[this.currentWave - 1]; // Fix array access
        const spawnInterval = 2000; // 2 second intervals
        
        if (this.spawnTimer >= spawnInterval) {
            // Spawn next enemy in sequence - iterate through ALL enemy types
            for (let i = 0; i < wave.enemies.length; i++) {
                const enemyGroup = wave.enemies[i];
                if (enemyGroup && this.getSpawnedCount(enemyGroup.type) < enemyGroup.count) {
                    this.spawnEnemy(enemyGroup.type);
                    this.spawnTimer = 0;
                    break; // Spawn one enemy at a time
                }
            }
        }
    }

    getSpawnedCount(enemyType) {
        let count = 0;
        this.entities.forEach(entity => {
            if (entity.hasTag('enemy')) {
                const enemyComp = entity.getComponent('EnemyComponent');
                if (enemyComp && enemyComp.type === enemyType) {
                    count++;
                }
            }
        });
        return count;
    }

    getNextSpawnTime(enemyType, spawnDelay) {
        const spawnedCount = this.getSpawnedCount(enemyType);
        return spawnedCount * spawnDelay;
    }

    spawnNextEnemy() {
        const wave = this.waves[this.currentWave - 1]; // Fix array access
        let soonestEnemy = null;
        let soonestTime = Infinity;

        wave.enemies.forEach(enemyGroup => {
            const spawnedCount = this.getSpawnedCount(enemyGroup.type);
            if (spawnedCount < enemyGroup.count) {
                const nextSpawn = this.getNextSpawnTime(enemyGroup.type, enemyGroup.spawnDelay);
                if (nextSpawn < soonestTime) {
                    soonestTime = nextSpawn;
                    soonestEnemy = enemyGroup;
                }
            }
        });

        if (soonestEnemy) {
            this.spawnEnemy(soonestEnemy.type);
        }
    }

    spawnEnemy(enemyType) {
        const enemyData = EnemyComponent.TYPES[enemyType];
        if (!enemyData) return null;

        const entity = new Entity();
        entity.addComponent(new PositionComponent(this.spawnPosition.x, this.spawnPosition.y));
        
        const enemy = new EnemyComponent(enemyType, enemyData.stats);
        entity.addComponent(enemy);
        
        const sprite = new SpriteRenderer(24, 24, enemyData.color);
        entity.addComponent(sprite);
        
        entity.addTag('enemy');

        this.entities.add(entity);
        this.enemiesSpawned++;
        this.enemiesAlive++;

        console.log(`Spawned ${enemyType} enemy (${this.enemiesSpawned}/${this.enemiesInWave}) at (${this.spawnPosition.x}, ${this.spawnPosition.y})`);

        this.combatEvents.push({
            type: 'enemy_spawned',
            enemy: entity,
            enemyType: enemyType
        });

        return entity;
    }

    updateWaveStatus() {
        // Check if all enemies in wave are spawned and dead
        if (this.enemiesSpawned >= this.enemiesInWave && this.enemiesAlive <= 0) {
            this.completeWave();
        }
    }

    completeWave() {
        this.waveActive = false;
        this.waveComplete = true;
        // Don't increment currentWave here - it's already incremented in startWave()

        this.combatEvents.push({
            type: 'wave_completed',
            wave: this.currentWave,
            reward: this.waveReward
        });
    }

    onEnemyDied(enemy) {
        this.enemiesAlive--;
        
        const enemyComp = enemy.getComponent('EnemyComponent');
        if (enemyComp) {
            this.combatEvents.push({
                type: 'enemy_died',
                enemy: enemy,
                reward: enemyComp.getReward()
            });
        }
    }

    updateEntity(entity, deltaTime) {
        const enemyComp = entity.getComponent('EnemyComponent');
        if (enemyComp) {
            enemyComp.update(deltaTime);
        }
    }

    getWaveInfo() {
        if (this.currentWave >= this.waves.length) {
            return {
                currentWave: this.currentWave,
                totalWaves: this.waves.length,
                waveComplete: true,
                description: 'All waves completed!'
            };
        }

        const wave = this.waves[this.currentWave];
        return {
            currentWave: this.currentWave + 1,
            totalWaves: this.waves.length,
            waveActive: this.waveActive,
            waveComplete: this.waveComplete,
            enemiesSpawned: this.enemiesSpawned,
            enemiesInWave: this.enemiesInWave,
            enemiesAlive: this.enemiesAlive,
            description: wave.description,
            reward: wave.reward
        };
    }

    getCombatEvents() {
        const events = [...this.combatEvents];
        this.combatEvents.length = 0;
        return events;
    }

    reset() {
        this.currentWave = 0;
        this.spawnTimer = 0;
        this.enemiesInWave = 0;
        this.enemiesSpawned = 0;
        this.enemiesAlive = 0;
        this.waveActive = false;
        this.waveComplete = false;
        this.waveReward = 0;
        this.combatEvents = [];
    }

    render(ctx) {
        // Render wave info
        const waveInfo = this.getWaveInfo();
        
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Wave: ${waveInfo.currentWave}/${waveInfo.totalWaves}`, 20, 40);
        
        if (waveInfo.waveActive) {
            ctx.fillText(`Enemies: ${waveInfo.enemiesAlive}/${waveInfo.enemiesInWave}`, 20, 65);
        }
        
        ctx.restore();
    }
}
