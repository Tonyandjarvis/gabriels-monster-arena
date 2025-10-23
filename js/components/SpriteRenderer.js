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
        
        if (this.sprite) {
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
            // Fallback to colored rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(
                position.x - this.width / 2, position.y - this.height / 2,
                this.width, this.height
            );
        }
        
        ctx.restore();
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
