class System {
    constructor() {
        this.entities = new Set();
        this.enabled = true;
        this.priority = 0;
    }

    addEntity(entity) {
        this.entities.add(entity);
    }

    removeEntity(entity) {
        this.entities.delete(entity);
    }

    update(deltaTime) {
        if (!this.enabled) return;
        
        try {
            this.entities.forEach(entity => {
                if (entity.active) {
                    try {
                        this.updateEntity(entity, deltaTime);
                    } catch (error) {
                        console.error(`Error updating entity ${entity.id} in ${this.constructor.name}:`, error);
                        // Don't remove entity, just log the error
                    }
                }
            });
        } catch (error) {
            console.error(`Error in ${this.constructor.name} update:`, error);
            // Disable system if it's causing critical errors
            if (error.message.includes('critical')) {
                this.enabled = false;
                console.error(`${this.constructor.name} disabled due to critical error`);
            }
        }
    }

    updateEntity(entity, deltaTime) {
        // Override in subclasses
    }

    render(ctx) {
        if (!this.enabled) {
            console.warn(`⚠️ ${this.constructor.name}.render() skipped - system is disabled!`);
            return;
        }
        
        try {
            this.entities.forEach(entity => {
                if (entity.active) {
                    try {
                        this.renderEntity(entity, ctx);
                    } catch (error) {
                        console.error(`Error rendering entity ${entity.id} in ${this.constructor.name}:`, error);
                        // Don't remove entity, just log the error
                    }
                }
            });
        } catch (error) {
            console.error(`Error in ${this.constructor.name} render:`, error);
            // Don't disable system for render errors, just log them
        }
    }

    renderEntity(entity, ctx) {
        // Override in subclasses
    }

    destroy() {
        this.entities.clear();
    }
}
