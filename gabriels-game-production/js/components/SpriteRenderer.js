class SpriteRenderer extends Component {
    constructor(width = 32, height = 32, color = '#ffffff') {
        super();
        this.width = width;
        this.height = height;
        this.color = color;
        this.visible = true;
        this.alpha = 1;
        this.animation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameRate = 100; // milliseconds per frame
        this.sprite = null;
    }

    setSprite(sprite) {
        this.sprite = sprite;
    }

    setAnimation(animation) {
        this.animation = animation;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    update(deltaTime) {
        if (this.animation && this.animation.frames) {
            this.frameTimer += deltaTime;
            
            if (this.frameTimer >= this.frameRate) {
                this.currentFrame = (this.currentFrame + 1) % this.animation.frames.length;
                this.frameTimer = 0;
            }
        }
    }

    render(ctx, position) {
        if (!this.visible) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        try {
            if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
                if (this.animation && this.animation.frames && this.animation.frames.length > 0) {
                    const frame = this.animation.frames[this.currentFrame];
                    ctx.drawImage(
                        this.sprite,
                        frame.x, frame.y, frame.width, frame.height,
                        position.x - this.width / 2, position.y - this.height / 2,
                        this.width, this.height
                    );
                } else {
                    ctx.drawImage(
                        this.sprite,
                        position.x - this.width / 2, position.y - this.height / 2,
                        this.width, this.height
                    );
                }
            } else {
                // Enhanced fallback rendering
                this.renderFallbackShape(ctx, position);
            }
        } catch (error) {
            console.warn('Sprite rendering error:', error);
            this.renderFallbackShape(ctx, position);
        }
        
        ctx.restore();
    }

    renderFallbackShape(ctx, position) {
        // Enhanced fallback with different shapes based on color
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        const x = position.x - this.width / 2;
        const y = position.y - this.height / 2;
        const centerX = position.x;
        const centerY = position.y;
        
        // Choose shape based on color for visual variety
        if (this.color.includes('purple') || this.color.includes('#9c27b0')) {
            // Crystal Guardian - diamond shape
            ctx.beginPath();
            ctx.moveTo(centerX, y);
            ctx.lineTo(centerX + this.width / 2, centerY);
            ctx.lineTo(centerX, y + this.height);
            ctx.lineTo(centerX - this.width / 2, centerY);
            ctx.closePath();
        } else if (this.color.includes('green') || this.color.includes('#4caf50')) {
            // Slime Defender - circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.min(this.width, this.height) / 2, 0, Math.PI * 2);
        } else if (this.color.includes('orange') || this.color.includes('#ff9800')) {
            // Beast Warrior - triangle
            ctx.beginPath();
            ctx.moveTo(centerX, y);
            ctx.lineTo(x, y + this.height);
            ctx.lineTo(x + this.width, y + this.height);
            ctx.closePath();
        } else {
            // Default - rectangle
            ctx.fillRect(x, y, this.width, this.height);
            ctx.strokeRect(x, y, this.width, this.height);
            return;
        }
        
        ctx.fill();
        ctx.stroke();
    }

    createSimpleSprite(ctx, color = null) {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const spriteCtx = canvas.getContext('2d');
        
        const fillColor = color || this.color;
        spriteCtx.fillStyle = fillColor;
        spriteCtx.fillRect(0, 0, this.width, this.height);
        
        // Add border
        spriteCtx.strokeStyle = '#000';
        spriteCtx.lineWidth = 2;
        spriteCtx.strokeRect(1, 1, this.width - 2, this.height - 2);
        
        return canvas;
    }
}
