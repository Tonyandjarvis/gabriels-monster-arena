class Entity {
    constructor(id = null) {
        this.id = id || this.generateId();
        this.components = new Map();
        this.active = true;
        this.tags = new Set();
    }

    generateId() {
        return 'entity_' + Math.random().toString(36).substr(2, 9);
    }

    addComponent(component) {
        try {
            if (!component) {
                throw new Error('Cannot add null or undefined component');
            }
            
            if (!component.constructor || !component.constructor.name) {
                throw new Error('Component must have a valid constructor name');
            }
            
            // Validate component has required methods
            if (typeof component.destroy !== 'function') {
                console.warn(`Component ${component.constructor.name} missing destroy method`);
            }
            
            component.entity = this;
            this.components.set(component.constructor.name, component);
            
            console.log(`Component ${component.constructor.name} added to entity ${this.id}`);
            return this;
        } catch (error) {
            console.error(`Failed to add component to entity ${this.id}:`, error);
            throw new Error(`Component addition failed: ${error.message}`);
        }
    }

    getComponent(componentName) {
        return this.components.get(componentName);
    }

    hasComponent(componentName) {
        return this.components.has(componentName);
    }

    removeComponent(componentName) {
        const component = this.components.get(componentName);
        if (component) {
            component.entity = null;
            this.components.delete(componentName);
        }
        return this;
    }

    addTag(tag) {
        this.tags.add(tag);
        return this;
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }

    removeTag(tag) {
        this.tags.delete(tag);
        return this;
    }

    destroy() {
        try {
            console.log(`Destroying entity ${this.id}`);
            
            // Call destroy on all components first
            this.components.forEach(component => {
                try {
                    if (typeof component.destroy === 'function') {
                        component.destroy();
                    }
                } catch (error) {
                    console.error(`Error destroying component ${component.constructor.name}:`, error);
                }
                component.entity = null;
            });
            
            // Clear all data structures
            this.components.clear();
            this.tags.clear();
            this.active = false;
            
            console.log(`Entity ${this.id} destroyed successfully`);
        } catch (error) {
            console.error(`Error destroying entity ${this.id}:`, error);
            // Force cleanup even if there's an error
            this.components.clear();
            this.tags.clear();
            this.active = false;
        }
    }
}
