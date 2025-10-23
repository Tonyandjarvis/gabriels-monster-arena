class MonsterComponent extends Component {
    constructor(type, stats) {
        super();
        this.type = type;
        this.level = 1;
        this.experience = 0;
        this.stats = {
            health: stats.health,
            maxHealth: stats.health,
            damage: stats.damage,
            range: stats.range,
            attackSpeed: stats.attackSpeed,
            cost: stats.cost,
            upgradeCost: stats.upgradeCost || stats.cost * 2
        };
        this.target = null;
        this.lastAttack = 0;
        this.attackCooldown = 1000 / this.stats.attackSpeed;
        this.attackTimer = 0;
        this.isAttacking = false;
    }

    canAttack() {
        return Date.now() - this.lastAttack >= this.attackCooldown;
    }

    attack() {
        this.lastAttack = Date.now();
        this.attackTimer = 0;
        this.isAttacking = true;
        return this.stats.damage;
    }

    takeDamage(damage) {
        this.stats.health -= damage;
        if (this.stats.health <= 0) {
            this.stats.health = 0;
            return true; // Monster died
        }
        return false;
    }

    addExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        const expNeeded = this.level * 100; // 100, 200, 300, etc.
        if (this.experience >= expNeeded) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.experience = 0;
        
        // Increase stats
        this.stats.maxHealth = Math.floor(this.stats.maxHealth * 1.2);
        this.stats.health = this.stats.maxHealth;
        this.stats.damage = Math.floor(this.stats.damage * 1.15);
        this.stats.range = Math.floor(this.stats.range * 1.1);
        this.stats.attackSpeed = Math.floor(this.stats.attackSpeed * 1.05);
        
        return true;
    }

    heal(amount) {
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    }

    upgrade() {
        if (this.level < 3) {
            this.level++;
            this.experience = 0;
            
            // Increase stats
            this.stats.maxHealth = Math.floor(this.stats.maxHealth * 1.5);
            this.stats.health = this.stats.maxHealth;
            this.stats.damage = Math.floor(this.stats.damage * 1.3);
            this.stats.range = Math.floor(this.stats.range * 1.2);
            this.stats.attackSpeed = Math.floor(this.stats.attackSpeed * 1.1);
            this.stats.upgradeCost = Math.floor(this.stats.upgradeCost * 1.5);
            
            return true;
        }
        return false;
    }

    getUpgradeCost() {
        return this.stats.upgradeCost;
    }

    getHealthPercentage() {
        return this.stats.health / this.stats.maxHealth;
    }

    isDead() {
        return this.stats.health <= 0;
    }

    resetTarget() {
        this.target = null;
    }

    setTarget(target) {
        this.target = target;
    }

    update(deltaTime) {
        this.attackTimer += deltaTime;
        
        if (this.isAttacking && this.attackTimer >= 200) {
            this.isAttacking = false;
        }
    }
}

// Monster types configuration
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
        description: 'A mystical crystal guardian with powerful ranged attacks'
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
        description: 'A resilient slime creature with good health and moderate damage'
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
        description: 'A fierce beast with high damage but lower health'
    }
};
