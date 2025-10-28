class ProjectileComponent extends Component {
    constructor() {
        super();
        this.damage = 0;
        this.speed = 200;
        this.target = null;
        this.trail = [];
        this.maxTrailLength = 5;
        this.piercing = false;
        this.piercedTargets = new Set();
        this.lifetime = 3000; // 3 seconds max lifetime
        this.age = 0;
    }

    initialize(damage, speed, target, piercing = false) {
        this.damage = damage;
        this.speed = speed;
        this.target = target;
        this.piercing = piercing;
        this.piercedTargets.clear();
        this.age = 0;
        this.trail = [];
    }

    update(deltaTime) {
        this.age += deltaTime;
        
        if (this.age >= this.lifetime) {
            return false; // Projectile should be destroyed
        }

        // Update trail
        if (this.entity && this.entity.getComponent('PositionComponent')) {
            const pos = this.entity.getComponent('PositionComponent');
            this.trail.push({ x: pos.x, y: pos.y });
            
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        return true; // Projectile is still alive
    }

    hitTarget(target) {
        if (this.piercing) {
            if (this.piercedTargets.has(target)) {
                return false; // Already hit this target
            }
            this.piercedTargets.add(target);
        }
        return true; // Can hit target
    }

    isExpired() {
        return this.age >= this.lifetime;
    }

    reset() {
        this.damage = 0;
        this.speed = 200;
        this.target = null;
        this.trail = [];
        this.piercing = false;
        this.piercedTargets.clear();
        this.age = 0;
    }
}
