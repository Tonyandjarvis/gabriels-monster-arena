class ParticleSystem extends System {
    constructor() {
        super();
        this.particles = [];
        this.particlePool = new ObjectPool(
            () => this.createParticle(),
            (particle) => particle.reset()
        );
    }

    setDependencies(dependencies) {
        // ParticleSystem doesn't need external dependencies
        console.log('ParticleSystem dependencies set (none required)');
    }

    createParticle() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 1.0,
            maxLife: 1.0,
            size: 5,
            color: '#ffffff',
            alpha: 1.0,
            type: 'default',
            reset() {
                this.x = 0;
                this.y = 0;
                this.vx = 0;
                this.vy = 0;
                this.life = 1.0;
                this.maxLife = 1.0;
                this.size = 5;
                this.color = '#ffffff';
                this.alpha = 1.0;
                this.type = 'default';
            }
        };
    }

    createExplosion(x, y, color = '#ff6b6b', count = 8) {
        for (let i = 0; i < count; i++) {
            const particle = this.particlePool.acquire();
            
            const angle = (i / count) * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = 1.0;
            particle.maxLife = 1.0;
            particle.size = 3 + Math.random() * 4;
            particle.color = color;
            particle.type = 'explosion';
            
            this.particles.push(particle);
        }
    }

    createLevelUpEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            const particle = this.particlePool.acquire();
            
            const angle = (i / 12) * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 20; // Float upward
            particle.life = 1.5;
            particle.maxLife = 1.5;
            particle.size = 4 + Math.random() * 3;
            particle.color = '#FFD700';
            particle.type = 'levelup';
            
            this.particles.push(particle);
        }
    }

    createUpgradeEffect(x, y) {
        for (let i = 0; i < 6; i++) {
            const particle = this.particlePool.acquire();
            
            particle.x = x + (Math.random() - 0.5) * 20;
            particle.y = y + (Math.random() - 0.5) * 20;
            particle.vx = (Math.random() - 0.5) * 20;
            particle.vy = -30 - Math.random() * 20;
            particle.life = 1.0;
            particle.maxLife = 1.0;
            particle.size = 3 + Math.random() * 2;
            particle.color = '#4CAF50';
            particle.type = 'upgrade';
            
            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx * (deltaTime / 1000);
            particle.y += particle.vy * (deltaTime / 1000);
            
            // Update velocity (gravity for some types)
            if (particle.type === 'explosion') {
                particle.vy += 50 * (deltaTime / 1000); // Gravity
            } else if (particle.type === 'levelup') {
                particle.vy += 10 * (deltaTime / 1000); // Light gravity
            }
            
            // Update life
            particle.life -= deltaTime / (particle.maxLife * 1000);
            
            // Update alpha
            particle.alpha = particle.life;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particlePool.release(particle);
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();
        
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow effect for special particles
            if (particle.type === 'levelup') {
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
        
        ctx.restore();
    }

    getParticleCount() {
        return this.particles.length;
    }
}
