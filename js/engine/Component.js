class Component {
    constructor() {
        this.entity = null;
    }

    destroy() {
        if (this.entity) {
            this.entity.removeComponent(this.constructor.name);
        }
    }
}
