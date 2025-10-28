class MonsterComponent extends Component {
    constructor(type, stats = null) {
        super();
        this.type = type;
        this.level = 1;
        this.experience = 0;
        
        // Use provided stats or load from configuration
        if (stats) {
            this.stats = {
                health: stats.health,
                maxHealth: stats.health,
                damage: stats.damage,
                range: stats.range,
                attackSpeed: stats.attackSpeed,
                cost: stats.cost,
                upgradeCost: stats.upgradeCost || stats.cost * 2
            };
        } else {
            // Load from configuration if available
            this.loadFromConfig(type);
        }
        
        this.target = null;
        this.lastAttack = -Infinity; // Allow immediate first attack
        this.attackTimer = 0;
        this.isAttacking = false;
        
        // Set attack cooldown after stats are loaded
        this.attackCooldown = 1000 / this.stats.attackSpeed;
    }
    
    loadFromConfig(type) {
        // Default stats as fallback
        const defaultStats = {
            health: 100,
            damage: 25,
            range: 150,
            attackSpeed: 1.0,
            cost: 50,
            upgradeCost: 100
        };
        
        // Try to load from configuration
        if (window.configLoader && window.configLoader.configs.has('monsters')) {
            const monstersConfig = window.configLoader.configs.get('monsters');
            if (monstersConfig && monstersConfig.monsters && monstersConfig.monsters[type]) {
                const monsterConfig = monstersConfig.monsters[type];
                this.stats = {
                    health: monsterConfig.stats.health,
                    maxHealth: monsterConfig.stats.health,
                    damage: monsterConfig.stats.damage,
                    range: monsterConfig.stats.range,
                    attackSpeed: monsterConfig.stats.attackSpeed,
                    cost: monsterConfig.stats.cost,
                    upgradeCost: monsterConfig.stats.upgradeCost || monsterConfig.stats.cost * 2
                };
                console.log(`Loaded monster config for ${type}:`, this.stats);
                return;
            }
        }
        
        // Use default stats
        this.stats = {
            health: defaultStats.health,
            maxHealth: defaultStats.health,
            damage: defaultStats.damage,
            range: defaultStats.range,
            attackSpeed: defaultStats.attackSpeed,
            cost: defaultStats.cost,
            upgradeCost: defaultStats.upgradeCost
        };
    }

    canAttack() {
        return Date.now() - this.lastAttack >= this.attackCooldown;
    }

    attack() {
        if (this.canAttack()) {
            this.lastAttack = Date.now();
            this.attackTimer = 0;
            this.isAttacking = true;
            return this.stats.damage;
        }
        return 0;
    }

    takeDamage(damage) {
        this.stats.health -= damage;
        if (this.stats.health < 0) {
            this.stats.health = 0;
        }
        return this.stats.health <= 0;
    }

    heal(amount) {
        this.stats.health += amount;
        if (this.stats.health > this.stats.maxHealth) {
            this.stats.health = this.stats.maxHealth;
        }
    }

    isDead() {
        return this.stats.health <= 0;
    }

    addExperience(amount) {
        this.experience += amount;
        const requiredExp = this.level * 100;
        
        if (this.experience >= requiredExp) {
            return this.levelUp();
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.experience = 0;
        
        // Increase stats
        this.stats.maxHealth += 20;
        this.stats.health = this.stats.maxHealth; // Full heal on level up
        this.stats.damage += 5;
        this.stats.range += 10;
        
        console.log(`Monster leveled up to level ${this.level}!`);
        return true;
    }

    getUpgradeCost() {
        return this.stats.upgradeCost;
    }

    upgrade() {
        if (this.level < 5) { // Max level 5
            this.stats.maxHealth += 30;
            this.stats.health = this.stats.maxHealth;
            this.stats.damage += 10;
            this.stats.range += 15;
            this.stats.attackSpeed += 0.2;
            this.level++;
            
            // Increase upgrade cost for next upgrade
            this.stats.upgradeCost = Math.floor(this.stats.upgradeCost * 1.5);
            
            return true;
        }
        return false;
    }

    update(deltaTime) {
        this.attackTimer += deltaTime;
        
        if (this.isAttacking && this.attackTimer >= 200) {
            this.isAttacking = false;
        }
    }
}

// Monster types configuration - defined early for immediate access
// Load monster types from configuration
MonsterComponent.loadTypesFromConfig = function() {
    MonsterComponent.TYPES = {};

    // Try to load from configuration
    if (window.configLoader && window.configLoader.configs.has('monsters')) {
        const monstersConfig = window.configLoader.configs.get('monsters');
        if (monstersConfig && monstersConfig.monsters) {
            for (const [monsterType, monsterConfig] of Object.entries(monstersConfig.monsters)) {
                MonsterComponent.TYPES[monsterType] = {
                    name: monsterConfig.name,
                    stats: {
                        health: monsterConfig.stats.health,
                        damage: monsterConfig.stats.damage,
                        range: monsterConfig.stats.range,
                        attackSpeed: monsterConfig.stats.attackSpeed,
                        cost: monsterConfig.stats.cost,
                        upgradeCost: monsterConfig.stats.upgradeCost || monsterConfig.stats.cost * 2
                    },
                    color: monsterConfig.visual.color,
                    description: monsterConfig.description,
                    shape: monsterConfig.visual.shape
                };
            }
            console.log('Loaded monster types from configuration:', Object.keys(MonsterComponent.TYPES));
            return;
        }
    }

    // Fallback to hardcoded types
    console.warn('Failed to load monster types from configuration, using hardcoded fallbacks');
    MonsterComponent.TYPES = {
        GEM: {
            name: 'Crystal Guardian',
            stats: {
                health: 150,
                damage: 25,
                range: 120,
                attackSpeed: 1.5,
                cost: 50,
                upgradeCost: 100
            },
            color: '#9c27b0',
            description: 'A mystical crystal guardian with powerful ranged attacks',
            shape: 'diamond'
        },
        BLOB: {
            name: 'Slime Defender',
            stats: {
                health: 200,
                damage: 15,
                range: 80,
                attackSpeed: 2.0,
                cost: 30,
                upgradeCost: 60
            },
            color: '#4caf50',
            description: 'A resilient slime creature with good health and moderate damage',
            shape: 'circle'
        },
        ANIMAL: {
            name: 'Beast Warrior',
            stats: {
                health: 100,
                damage: 35,
                range: 100,
                attackSpeed: 1.0,
                cost: 70,
                upgradeCost: 140
            },
            color: '#ff9800',
            description: 'A fierce beast with high damage but lower health',
            shape: 'triangle'
        }
    };
};

// Initialize types
MonsterComponent.loadTypesFromConfig();