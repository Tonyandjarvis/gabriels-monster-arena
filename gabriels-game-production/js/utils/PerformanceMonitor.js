class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = 0;
        this.fps = 0;
        this.frameTimes = [];
        this.memoryUsage = 0;
        this.isEnabled = false;
        this.throttlingEnabled = true;
        this.targetFPS = 60;
        this.minFPS = 30; // Minimum acceptable FPS
        this.throttleLevel = 0; // 0 = normal, 1 = reduced updates, 2 = minimal updates
        this.lastThrottleCheck = 0;
        this.stats = {
            fps: 0,
            memory: 0,
            entities: 0,
            projectiles: 0,
            enemies: 0,
            monsters: 0,
            throttling: false,
            throttleLevel: 0
        };
    }

    enable() {
        this.isEnabled = true;
        this.lastTime = performance.now();
    }

    disable() {
        this.isEnabled = false;
    }

    update(currentTime) {
        if (!this.isEnabled) return;

        this.frameCount++;

        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;

            // Check memory usage
            if (performance.memory) {
                this.memoryUsage = performance.memory.usedJSHeapSize;
            }

            // Update stats
            this.stats.fps = this.fps;
            this.stats.memory = this.memoryUsage;

            // Automatic performance throttling
            this.updateThrottling();

            // Log performance data
            this.logPerformance();
        }

        this.frameTimes.push(currentTime);
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
    }

    updateThrottling() {
        if (!this.throttlingEnabled) return;

        const currentTime = performance.now();

        // Only check throttling every 5 seconds to avoid rapid changes
        if (currentTime - this.lastThrottleCheck < 5000) return;
        this.lastThrottleCheck = currentTime;

        if (this.fps < this.minFPS && this.throttleLevel < 2) {
            // Performance is poor, increase throttling
            this.throttleLevel++;
            this.stats.throttling = true;
            this.stats.throttleLevel = this.throttleLevel;
            console.warn(`Performance throttling increased to level ${this.throttleLevel} (FPS: ${this.fps})`);
        } else if (this.fps >= this.targetFPS - 5 && this.throttleLevel > 0) {
            // Performance recovered, decrease throttling
            this.throttleLevel--;
            this.stats.throttling = this.throttleLevel > 0;
            this.stats.throttleLevel = this.throttleLevel;
            console.log(`Performance throttling decreased to level ${this.throttleLevel} (FPS: ${this.fps})`);
        }
    }

    shouldSkipUpdate() {
        // Return true if this update should be skipped based on throttling
        if (!this.throttlingEnabled || this.throttleLevel === 0) return false;

        // Level 1: Skip every 3rd frame
        if (this.throttleLevel === 1) {
            return Math.random() < 0.33;
        }

        // Level 2: Skip every 2nd frame
        if (this.throttleLevel === 2) {
            return Math.random() < 0.5;
        }

        return false;
    }

    shouldSkipEntityUpdate(entityType) {
        // Skip updates for less critical entities during throttling
        if (!this.throttlingEnabled || this.throttleLevel === 0) return false;

        if (this.throttleLevel >= 1 && entityType === 'particle') {
            return Math.random() < 0.5;
        }

        if (this.throttleLevel >= 2 && (entityType === 'particle' || entityType === 'effect')) {
            return Math.random() < 0.8;
        }

        return false;
    }

    logPerformance() {
        const throttleMsg = this.stats.throttling ? ` (Throttling: ${this.throttleLevel})` : '';
        console.log(`FPS: ${this.fps}, Memory: ${(this.memoryUsage / 1024 / 1024).toFixed(2)}MB${throttleMsg}`);
    }

    updateEntityStats(entities) {
        this.stats.entities = entities.size;
        this.stats.projectiles = 0;
        this.stats.enemies = 0;
        this.stats.monsters = 0;

        entities.forEach(entity => {
            if (entity.hasTag('projectile')) {
                this.stats.projectiles++;
            } else if (entity.hasTag('enemy')) {
                this.stats.enemies++;
            } else if (entity.hasTag('monster')) {
                this.stats.monsters++;
            }
        });
    }

    getStats() {
        return { ...this.stats };
    }

    render(ctx) {
        if (!this.isEnabled) return;

        const height = this.stats.throttling ? 135 : 120;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, height);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        let y = 25;
        ctx.fillText(`FPS: ${this.stats.fps}`, 20, y);
        y += 15;
        ctx.fillText(`Memory: ${(this.stats.memory / 1024 / 1024).toFixed(2)}MB`, 20, y);
        y += 15;
        ctx.fillText(`Entities: ${this.stats.entities}`, 20, y);
        y += 15;
        ctx.fillText(`Monsters: ${this.stats.monsters}`, 20, y);
        y += 15;
        ctx.fillText(`Enemies: ${this.stats.enemies}`, 20, y);
        y += 15;
        ctx.fillText(`Projectiles: ${this.stats.projectiles}`, 20, y);

        // Show throttling status
        if (this.stats.throttling) {
            y += 15;
            ctx.fillStyle = this.stats.throttleLevel === 2 ? '#ff6b6b' : '#ff9800';
            ctx.fillText(`⚠ Throttling: Level ${this.stats.throttleLevel}`, 20, y);
        }

        ctx.restore();
    }
}
