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
        component.entity = this;
        this.components.set(component.constructor.name, component);
        return this;
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
        this.components.forEach(component => {
            component.entity = null;
        });
        this.components.clear();
        this.tags.clear();
        this.active = false;
    }
}
