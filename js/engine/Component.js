class Component {
    constructor() {
        this.entity = null;
        this.active = true;
    }

    destroy() {
        try {
            console.log(`Destroying component ${this.constructor.name}`);
            this.active = false;
            
            if (this.entity) {
                this.entity.removeComponent(this.constructor.name);
            }
            
            console.log(`Component ${this.constructor.name} destroyed successfully`);
        } catch (error) {
            console.error(`Error destroying component ${this.constructor.name}:`, error);
            this.active = false;
        }
    }

    // Override in subclasses for component-specific initialization
    initialize() {
        // Default implementation - override in subclasses
    }

    // Override in subclasses for component-specific updates
    update(deltaTime) {
        // Default implementation - override in subclasses
    }

    // Validate component data
    validate() {
        return this.active && this.entity !== null;
    }
}
