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
        
        this.entities.forEach(entity => {
            if (entity.active) {
                this.updateEntity(entity, deltaTime);
            }
        });
    }

    updateEntity(entity, deltaTime) {
        // Override in subclasses
    }

    render(ctx) {
        if (!this.enabled) return;
        
        this.entities.forEach(entity => {
            if (entity.active) {
                this.renderEntity(entity, ctx);
            }
        });
    }

    renderEntity(entity, ctx) {
        // Override in subclasses
    }

    destroy() {
        this.entities.clear();
    }
}
