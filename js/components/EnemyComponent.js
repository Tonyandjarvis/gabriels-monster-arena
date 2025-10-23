class EnemyComponent extends Component {
    constructor(type, stats) {
        super();
        this.type = type;
        this.stats = {
            health: stats.health,
            maxHealth: stats.health,
            speed: stats.speed,
            damage: stats.damage,
            reward: stats.reward,
            armor: stats.armor || 0
        };
        this.pathIndex = 0;
        this.distanceTraveled = 0;
        this.alive = true;
        this.slowEffect = 0;
        this.slowDuration = 0;
        this.isSlowed = false;
    }

    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.stats.armor);
        this.stats.health -= actualDamage;
        
        if (this.stats.health <= 0) {
            this.stats.health = 0;
            this.alive = false;
            return true; // Enemy died
        }
        return false;
    }

    heal(amount) {
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    }

    applySlow(slowPercent, duration) {
        this.slowEffect = slowPercent;
        this.slowDuration = duration;
        this.isSlowed = true;
    }

    update(deltaTime) {
        if (this.isSlowed) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) {
                this.isSlowed = false;
                this.slowEffect = 0;
            }
        }
    }

    getEffectiveSpeed() {
        if (this.isSlowed) {
            return this.stats.speed * (1 - this.slowEffect);
        }
        return this.stats.speed;
    }

    getHealthPercentage() {
        return this.stats.health / this.stats.maxHealth;
    }

    isDead() {
        return !this.alive || this.stats.health <= 0;
    }

    getReward() {
        return this.stats.reward;
    }
}

// Enemy types configuration
EnemyComponent.TYPES = {
    BASIC: {
        name: 'Goblin',
        stats: {
            health: 100,
            speed: 50,
            damage: 10,
            reward: 10,
            armor: 0
        },
        color: '#ff6b6b',
        description: 'Basic enemy with moderate health and speed'
    },
    FAST: {
        name: 'Imp',
        stats: {
            health: 50,
            speed: 100,
            damage: 5,
            reward: 15,
            armor: 0
        },
        color: '#4ecdc4',
        description: 'Fast but fragile enemy'
    },
    TANK: {
        name: 'Ogre',
        stats: {
            health: 200,
            speed: 25,
            damage: 20,
            reward: 25,
            armor: 5
        },
        color: '#45b7d1',
        description: 'Slow but heavily armored enemy'
    },
    FLYING: {
        name: 'Bat',
        stats: {
            health: 75,
            speed: 80,
            damage: 8,
            reward: 20,
            armor: 0
        },
        color: '#96ceb4',
        description: 'Flying enemy that can bypass some defenses'
    }
};
