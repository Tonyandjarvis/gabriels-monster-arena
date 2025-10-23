class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = 0;
        this.fps = 0;
        this.frameTimes = [];
        this.memoryUsage = 0;
        this.isEnabled = false;
        this.stats = {
            fps: 0,
            memory: 0,
            entities: 0,
            projectiles: 0,
            enemies: 0,
            monsters: 0
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
            
            // Log performance data
            this.logPerformance();
        }
        
        this.frameTimes.push(currentTime);
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
    }

    logPerformance() {
        console.log(`FPS: ${this.fps}, Memory: ${(this.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
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

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 120);
        
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
        
        ctx.restore();
    }
}
