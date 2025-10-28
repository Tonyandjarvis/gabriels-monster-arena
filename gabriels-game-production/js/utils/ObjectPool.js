class ObjectPool {
    constructor(createFn, resetFn = null) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
    }

    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            
            if (this.resetFn) {
                this.resetFn(obj);
            }
            
            this.pool.push(obj);
        }
    }

    clear() {
        this.pool.length = 0;
        this.active.length = 0;
    }

    getActiveCount() {
        return this.active.length;
    }

    getPooledCount() {
        return this.pool.length;
    }
}
