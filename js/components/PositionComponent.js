class PositionComponent extends Component {
    constructor(x = 0, y = 0) {
        super();
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.scale = 1;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    distanceTo(otherPosition) {
        const dx = this.x - otherPosition.x;
        const dy = this.y - otherPosition.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    rotate(angle) {
        this.rotation += angle;
    }

    setRotation(angle) {
        this.rotation = angle;
    }
}
