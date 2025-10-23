class PathfindingSystem extends System {
    constructor() {
        super();
        this.path = [];
        this.waypoints = [];
        this.pathWidth = 40;
        this.pathColor = '#8B4513';
        this.pathBorderColor = '#654321';
    }

    generatePath(start, end, obstacles = []) {
        // Simple path generation for MVP
        // Can be upgraded to A* algorithm later
        this.path = this.createSimplePath(start, end);
        this.waypoints = this.createWaypoints(this.path);
    }

    update(deltaTime) {
        // Update enemy movement along path
        this.entities.forEach(entity => {
            if (entity.hasTag('enemy')) {
                this.updateEntity(entity, deltaTime);
            }
        });
    }

    createSimplePath(start, end) {
        const path = [];
        const steps = 20;
        
        // Create a curved path
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t;
            
            // Add some curve to the path
            const curveOffset = Math.sin(t * Math.PI) * 50;
            const perpendicularX = -(end.y - start.y);
            const perpendicularY = end.x - start.x;
            const length = Math.sqrt(perpendicularX * perpendicularX + perpendicularY * perpendicularY);
            
            if (length > 0) {
                const normalizedX = perpendicularX / length;
                const normalizedY = perpendicularY / length;
                
                path.push({
                    x: x + normalizedX * curveOffset,
                    y: y + normalizedY * curveOffset
                });
            } else {
                path.push({ x, y });
            }
        }
        
        return path;
    }

    createWaypoints(path) {
        const waypoints = [];
        const spacing = 50; // Distance between waypoints
        
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            const distance = i === 0 ? 0 : this.distanceBetween(path[i - 1], point);
            
            if (i === 0 || distance >= spacing) {
                waypoints.push({
                    x: point.x,
                    y: point.y,
                    index: i
                });
            }
        }
        
        return waypoints;
    }

    distanceBetween(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getPathLength() {
        let length = 0;
        for (let i = 1; i < this.path.length; i++) {
            length += this.distanceBetween(this.path[i - 1], this.path[i]);
        }
        return length;
    }

    getPositionAlongPath(distance) {
        let currentDistance = 0;
        
        for (let i = 1; i < this.path.length; i++) {
            const segmentLength = this.distanceBetween(this.path[i - 1], this.path[i]);
            
            if (currentDistance + segmentLength >= distance) {
                const t = (distance - currentDistance) / segmentLength;
                return {
                    x: this.path[i - 1].x + (this.path[i].x - this.path[i - 1].x) * t,
                    y: this.path[i - 1].y + (this.path[i].y - this.path[i - 1].y) * t
                };
            }
            
            currentDistance += segmentLength;
        }
        
        // Return end position if distance exceeds path length
        return this.path[this.path.length - 1];
    }

    getNextWaypoint(currentPosition, currentWaypointIndex) {
        if (currentWaypointIndex >= this.waypoints.length - 1) {
            return null; // Reached end of path
        }
        
        const nextWaypoint = this.waypoints[currentWaypointIndex + 1];
        const distance = this.distanceBetween(currentPosition, nextWaypoint);
        
        if (distance < 10) {
            return currentWaypointIndex + 1;
        }
        
        return currentWaypointIndex;
    }

    render(ctx) {
        if (this.path.length < 2) return;
        
        ctx.save();
        
        // Draw path border
        ctx.strokeStyle = this.pathBorderColor;
        ctx.lineWidth = this.pathWidth + 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        
        // Draw path
        ctx.strokeStyle = this.pathColor;
        ctx.lineWidth = this.pathWidth;
        
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        
        // Draw waypoints
        ctx.fillStyle = '#FFD700';
        this.waypoints.forEach((waypoint, index) => {
            ctx.beginPath();
            ctx.arc(waypoint.x, waypoint.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw waypoint numbers
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(index.toString(), waypoint.x, waypoint.y - 10);
            ctx.fillStyle = '#FFD700';
        });
        
        ctx.restore();
    }

    updateEntity(entity, deltaTime) {
        // Update enemy movement along path
        const enemyComp = entity.getComponent('EnemyComponent');
        const pos = entity.getComponent('PositionComponent');
        
        if (enemyComp && pos) {
            this.updateEnemyMovement(entity, enemyComp, pos, deltaTime);
        }
    }

    updateEnemyMovement(entity, enemyComp, pos, deltaTime) {
        const speed = enemyComp.getEffectiveSpeed();
        const moveDistance = speed * (deltaTime / 1000);
        
        // Move enemy along path
        enemyComp.distanceTraveled += moveDistance;
        
        const newPosition = this.getPositionAlongPath(enemyComp.distanceTraveled);
        if (newPosition) {
            pos.setPosition(newPosition.x, newPosition.y);
        }
        
        // Check if enemy reached the end
        if (enemyComp.distanceTraveled >= this.getPathLength()) {
            // Enemy reached the end - damage player
            this.combatEvents.push({
                type: 'enemy_reached_end',
                enemy: entity,
                damage: enemyComp.stats.damage
            });
            
            // Remove enemy
            entity.destroy();
        }
    }

    getPath() {
        return this.path;
    }

    getWaypoints() {
        return this.waypoints;
    }

    isPointOnPath(x, y, tolerance = 20) {
        for (let i = 0; i < this.path.length - 1; i++) {
            const segment = {
                start: this.path[i],
                end: this.path[i + 1]
            };
            
            if (this.pointOnSegment({ x, y }, segment, tolerance)) {
                return true;
            }
        }
        return false;
    }

    pointOnSegment(point, segment, tolerance) {
        const dx = segment.end.x - segment.start.x;
        const dy = segment.end.y - segment.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return false;
        
        const t = ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / (length * length);
        
        if (t < 0 || t > 1) return false;
        
        const closestPoint = {
            x: segment.start.x + t * dx,
            y: segment.start.y + t * dy
        };
        
        const distance = Math.sqrt(
            (point.x - closestPoint.x) ** 2 + (point.y - closestPoint.y) ** 2
        );
        
        return distance <= tolerance;
    }
}
