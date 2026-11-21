/**
 * Sprite - Handles sprite animation and rendering
 * Manages sprite sheets, frames, and animations
 */
class Sprite {
    constructor(image, options = {}) {
        this.image = image;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.frameWidth = options.frameWidth || this.width;
        this.frameHeight = options.frameHeight || this.height;
        this.currentFrame = 0;
        this.frameCount = options.frameCount || 1;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = options.frameInterval || 100;
        this.animation = options.animation || 'idle';
        this.animations = options.animations || { idle: [0] };
    }

    setAnimation(name) {
        if (this.animation !== name && this.animations[name]) {
            this.animation = name;
            this.currentFrame = 0;
            this.frameIndex = this.animations[name][0];
        }
    }

    update(dt) {
        const animFrames = this.animations[this.animation];
        if (animFrames && animFrames.length > 1) {
            this.frameTimer += dt * 1000;
            if (this.frameTimer >= this.frameInterval) {
                this.frameTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % animFrames.length;
                this.frameIndex = animFrames[this.currentFrame];
            }
        }
    }

    draw(ctx, x, y) {
        const frameX = (this.frameIndex % this.frameCount) * this.frameWidth;
        const frameY = Math.floor(this.frameIndex / this.frameCount) * this.frameHeight;

        ctx.drawImage(
            this.image,
            frameX, frameY,
            this.frameWidth, this.frameHeight,
            x, y,
            this.width, this.height
        );
    }

    reset() {
        this.currentFrame = 0;
        this.frameIndex = 0;
        this.frameTimer = 0;
    }
}