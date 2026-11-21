/**
 * Kiro.js - Kiro Player Character Entity
 * 
 * Character specifications:
 * - Base sprite: 32x32px, rendered at 40x40px
 * - Circular hitbox: 12px radius centered at (16, 16)
 * - Animation states: IDLE, FLAP, DEATH
 * - Physics: gravity (800 px/s²), jump velocity (-300 px/s)
 */

import { CONFIG } from '../config.js';
import { Cape } from './Cape.js';

/**
 * Animation states for Kiro
 */
const ANIMATION_STATES = Object.freeze({
    IDLE: 'IDLE',
    FLAP: 'FLAP',
    DEATH: 'DEATH'
});

/**
 * BirdModel interface representing the player's character state.
 * @typedef {Object} BirdModel
 * @property {number} x - Horizontal position (sprite's left edge)
 * @property {number} y - Vertical position (sprite's top edge)
 * @property {number} width - Sprite width in pixels
 * @property {number} height - Sprite height in pixels
 * @property {number} velocity - Vertical velocity in px/s
 * @property {number} animationFrame - Current wing animation frame (0-2)
 * @property {number} rotation - Sprite rotation in degrees
 */

/**
 * Kiro character class representing the player-controlled character.
 * Implements physics-based movement, wing animation states, and rendering with rotation.
 */
class Kiro {
    /**
     * Creates a new Kiro instance.
     * @param {Object} config - Game configuration object
     * @param {number} canvasWidth - Width of the game canvas
     * @param {number} canvasHeight - Height of the game canvas
     */
    constructor(config, canvasWidth, canvasHeight) {
        this.config = config;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Position (sprite position, not hitbox center)
        this.#x = 0;
        this.#y = 0;

        // Physics properties
        this.#velocity = 0;
        this.#rotation = 0;

        // Animation state
        this.#animationFrame = 0;
        this.#animationTimer = 0;
        this.animationState = ANIMATION_STATES.IDLE;

        // Death animation
        this.#isDead = false;
        this.#deathFrame = 0;
        this.#deathTotalFrames = CONFIG.game?.deathSequenceFrames || 60;
        this.#opacity = 1.0;

        // Hitbox (12px radius circular, calculated from config)
        const hitboxConfig = CONFIG.hitbox || {};
        this.#hitboxRadius = hitboxConfig.inset 
            ? (hitboxConfig.spriteWidth / 2) - hitboxConfig.inset 
            : 12;

        // Sprite dimensions
        this.#spriteWidth = hitboxConfig.spriteWidth || 40;
        this.#spriteHeight = hitboxConfig.spriteHeight || 40;

        // State flags
        this.#isInvincible = false;
        this.#invincibilityFrames = 0;
        this.#flashTimer = 0;

        // Wing animation frame timing (switch every 100ms during flap)
        this.#wingFrameInterval = 0.1;

        // Cape system (Requirement 14)
        this.#cape = new Cape(CONFIG.cape);

        // Bind methods for consistent reference
        this.jump = this.jump.bind(this);
        this.reset = this.reset.bind(this);

        // Initialize position at center of canvas
        this.reset();
    }

    #x;
    #y;
    #velocity;
    #rotation;
    #animationFrame;
    #animationTimer;
    #isDead;
    #deathFrame;
    #deathTotalFrames;
    #opacity;
    #hitboxRadius;
    #spriteWidth;
    #spriteHeight;
    #isInvincible;
    #invincibilityFrames;
    #flashTimer;
    #wingFrameInterval;
    #cape;

    // =========================================================================
    // Position and Velocity Accessors
    // =========================================================================

    /**
     * Gets the current position.
     * @returns {{x: number, y: number}} Current position object
     */
    getPosition() {
        return { x: this.#x, y: this.#y };
    }

    /**
     * Gets the current velocity.
     * @returns {number} Current vertical velocity in px/s
     */
    getVelocity() {
        return this.#velocity;
    }

    /**
     * Gets the current rotation angle.
     * @returns {number} Current rotation in degrees
     */
    getRotation() {
        return this.#rotation;
    }

    /**
     * Gets the current wing animation frame.
     * @returns {number} Current frame index (0, 1, or 2)
     */
    getAnimationFrame() {
        return this.#animationFrame;
    }

    /**
     * Sets the position directly.
     * @param {number} x - New X position
     * @param {number} y - New Y position
     */
    setPosition(x, y) {
        this.#x = x;
        this.#y = y;
    }

    /**
     * Gets the width of the sprite.
     * @returns {number} Sprite width in pixels
     */
    get width() {
        return this.#spriteWidth;
    }

    /**
     * Gets the height of the sprite.
     * @returns {number} Sprite height in pixels
     */
    get height() {
        return this.#spriteHeight;
    }

    // =========================================================================
    // Physics Methods
    // =========================================================================

    /**
     * Applies gravity to velocity and updates position based on deltaTime.
     * Called by physics engine during game loop.
     * @param {number} dt - Delta time in seconds
     */
    applyPhysics(dt) {
        if (this.#isDead) return;

        // Apply gravity (scaled from per-frame to per-second)
        const physicsConfig = this.config.physics || this.config;
        const gravityPerSecond = physicsConfig.gravity * 60;
        this.#velocity += gravityPerSecond * dt;

        // Clamp to terminal velocity
        const terminalVelocityPerSecond = physicsConfig.terminalVelocity * 60;
        this.#velocity = Math.max(
            -terminalVelocityPerSecond,
            Math.min(terminalVelocityPerSecond, this.#velocity)
        );

        // Update position
        this.#y += this.#velocity * dt;

        // Update rotation based on velocity
        this.updateRotation();
    }

    /**
     * Jump action - sets upward velocity.
     */
    jump() {
        if (this.#isDead) return;

        const physicsConfig = this.config.physics || this.config;
        this.#velocity = physicsConfig.jumpStrength;
    }

    /**
     * Update rotation based on velocity.
     * Clamped between maxRotationDown and maxRotationUp.
     */
    updateRotation() {
        const physicsConfig = this.config.physics || this.config;
        const rotationPerVelocity = physicsConfig.rotationRate || 3;
        const targetRotation = this.#velocity * rotationPerVelocity;

        // Smooth rotation interpolation
        this.#rotation += (targetRotation - this.#rotation) * 0.1;

        // Clamp rotation
        const maxUp = physicsConfig.maxRotationUp || 30;
        const maxDown = physicsConfig.maxRotationDown || 90;
        this.#rotation = Math.max(-maxDown, Math.min(maxUp, this.#rotation));
    }

    // =========================================================================
    // Animation Methods
    // =========================================================================

    /**
     * Set the animation state.
     * @param {string} state - New animation state (IDLE, FLAP, DEATH)
     */
    setAnimation(state) {
        if (this.animationState === state && state !== ANIMATION_STATES.FLAP) return;

        this.animationState = state;
        this.#animationFrame = 0;
        this.#animationTimer = 0;
    }

    /**
     * Updates the wing animation frame.
     * Toggles between frames 0, 1, 2 periodically during flap.
     * @param {number} dt - Delta time in seconds
     */
    updateWingAnimation(dt) {
        if (this.#isDead) return;

        this.#animationTimer += dt;

        if (this.#animationTimer >= this.#wingFrameInterval) {
            this.#animationTimer = 0;
            // Cycle through frames 0, 1, 2
            this.#animationFrame = (this.#animationFrame + 1) % 3;
        }
    }

    /**
     * Idle animation - gentle bobbing motion.
     * @param {number} dt - Delta time in seconds
     */
    updateIdleAnimation(dt) {
        const idleDuration = 0.2; // 200ms per frame
        const bobAmount = 2; // 2px vertical movement

        this.#animationTimer += dt;

        if (this.#animationTimer >= idleDuration) {
            this.#animationTimer = 0;
            this.#animationFrame = (this.#animationFrame + 1) % 2;

            // Bob effect based on frame
            this.#y += this.#animationFrame === 0 ? -bobAmount : bobAmount;
        }
    }

    /**
     * Updates the death animation (fade and spin).
     * @param {number} dt - Delta time in seconds
     */
    updateDeathAnimation(dt) {
        this.#deathFrame++;

        // Calculate progress (0 to 1)
        const progress = this.#deathFrame / this.#deathTotalFrames;

        // Fade opacity
        this.#opacity = 1.0 - progress;

        // Rotate to 90 degrees downward
        this.#rotation = progress * 90;
    }

    /**
     * Starts the death sequence.
     */
    die() {
        if (this.#isDead) return;

        this.#isDead = true;
        this.animationState = ANIMATION_STATES.DEATH;
        this.#deathFrame = 0;
        this.#rotation = 0;
    }

    // =========================================================================
    // Invincibility Methods
    // =========================================================================

    /**
     * Checks if the character is currently invincible.
     * @returns {boolean} True if invincible
     */
    isInvincible() {
        return this.#isInvincible;
    }

    /**
     * Activates invincibility for a specified number of frames.
     * @param {number} frames - Number of invincibility frames (default: 120)
     */
    activateInvincibility(frames = 120) {
        this.#isInvincible = true;
        this.#invincibilityFrames = frames;
        this.#flashTimer = 0;
    }

    /**
     * Deactivates invincibility immediately.
     */
    deactivateInvincibility() {
        this.#isInvincible = false;
        this.#invincibilityFrames = 0;
    }

    /**
     * Gets the remaining invincibility frames.
     * @returns {number} Remaining invincibility frames
     */
    getInvincibilityFrames() {
        return this.#invincibilityFrames;
    }

    /**
     * Checks if the character is dead.
     * @returns {boolean} True if dead
     */
    isDead() {
        return this.#isDead;
    }

    /**
     * Gets the current opacity (for death animation).
     * @returns {number} Current opacity (0.0 to 1.0)
     */
    getOpacity() {
        return this.#opacity;
    }

    // =========================================================================
    // Collision Detection Methods
    // =========================================================================

    /**
     * Gets the circular hitbox for collision detection.
     * @returns {Object} Circular hitbox with centerX, centerY, radius
     */
    getHitbox() {
        // Hitbox is centered on sprite, inset from edges
        const centerX = this.#x + (this.#spriteWidth / 2);
        const centerY = this.#y + (this.#spriteHeight / 2);

        return {
            type: 'circle',
            centerX: centerX,
            centerY: centerY,
            radius: this.#hitboxRadius
        };
    }

    /**
     * Check if this entity has passed a pipe.
     * @param {Object} pipe - Pipe object with x position
     * @returns {boolean} True if passed
     */
    hasPassed(pipe) {
        const spriteCenterX = this.#x + (this.#spriteWidth / 2);
        return spriteCenterX > pipe.x + pipe.width;
    }

    /**
     * Check collision with boundary.
     * @param {Object} canvas - Canvas dimensions {width, height}
     * @returns {Object} { ceiling: boolean, ground: boolean }
     */
    checkBoundaryCollision(canvas) {
        const hitbox = this.getHitbox();
        const ceiling = (hitbox.centerY - hitbox.radius) < 0;
        const ground = (hitbox.centerY + hitbox.radius) > canvas.height;

        return { ceiling, ground };
    }

    /**
     * Check if entity is currently colliding with any pipes.
     * @param {Array} pipes - Array of pipe objects
     * @param {Object} canvas - Canvas dimensions
     * @returns {boolean} True if collision detected
     */
    checkPipeCollisions(pipes, canvas) {
        if (this.#isInvincible) return false;

        for (const pipe of pipes) {
            // Check upper pipe
            const upperHitbox = {
                x: pipe.x,
                y: 0,
                width: pipe.width,
                height: pipe.gapPosition
            };

            if (this.checkCollisionWithRect(upperHitbox)) {
                return true;
            }

            // Check lower pipe
            const lowerHitbox = {
                x: pipe.x,
                y: pipe.gapPosition + pipe.gapHeight,
                width: pipe.width,
                height: canvas.height - pipe.gapPosition - pipe.gapHeight
            };

            if (this.checkCollisionWithRect(lowerHitbox)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check collision with a rectangular pipe.
     * Circle-rectangle collision algorithm.
     * @param {Object} rect - Rectangle hitbox {x, y, width, height}
     * @returns {boolean} True if collision detected
     */
    checkCollisionWithRect(rect) {
        const circle = this.getHitbox();

        // Find closest point on rectangle to circle center
        const closestX = Math.max(
            rect.x,
            Math.min(circle.centerX, rect.x + rect.width)
        );

        const closestY = Math.max(
            rect.y,
            Math.min(circle.centerY, rect.y + rect.height)
        );

        // Calculate distance
        const distanceX = circle.centerX - closestX;
        const distanceY = circle.centerY - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        // Check if distance is less than radius
        return distanceSquared < (circle.radius * circle.radius);
    }

    // =========================================================================
    // Main Update Method
    // =========================================================================

    /**
     * Main update method - updates position, animation, and checks collisions.
     * @param {number} dt - Delta time in seconds
     * @param {Array} pipes - Array of pipe objects
     * @returns {Object|null} Collision result or null
     */
    update(dt, pipes) {
        // Apply physics
        this.applyPhysics(dt);

        // Update animations
        if (this.animationState === ANIMATION_STATES.IDLE) {
            this.updateIdleAnimation(dt);
        } else if (this.animationState === ANIMATION_STATES.FLAP) {
            this.updateWingAnimation(dt);
        } else if (this.animationState === ANIMATION_STATES.DEATH) {
            this.updateDeathAnimation(dt);
        }

        // Check boundary collisions
        const canvas = { width: this.canvasWidth, height: this.canvasHeight };
        const boundary = this.checkBoundaryCollision(canvas);

        if (boundary.ceiling || boundary.ground) {
            this.die();
            return {
                type: 'BOUNDARY',
                boundary,
                position: { x: this.#x, y: this.#y }
            };
        }

        // Check pipe collisions (if not dead)
        if (!this.#isDead && this.checkPipeCollisions(pipes, canvas)) {
            this.die();
            return {
                type: 'PIPE',
                position: { x: this.#x, y: this.#y }
            };
        }

        return null;
    }

    // =========================================================================
    // Cape Methods (Requirement 14)
    // =========================================================================

    /**
     * Updates the cape animation based on Kiro's movement.
     * @param {number} dt - Delta time in seconds
     */
    updateCape(dt) {
        this.#cape.update(dt, this.#velocity, this.#rotation);
    }

    /**
     * Renders the cape behind Kiro.
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderCape(ctx) {
        this.#cape.render(ctx, this.#x, this.#y, this.#rotation);
    }

    /**
     * Gets the cape state for debugging.
     * @returns {Object} Cape state
     */
    getCapeState() {
        return this.#cape.getState();
    }

    // =========================================================================
    // Reset Method
    // =========================================================================

    /**
     * Resets the character to starting position for new game sessions.
     * Position is set to canvas horizontal center and 50% vertical position.
     */
    reset() {
        // Position at canvas horizontal center
        this.#x = this.canvasWidth / 2 - this.#spriteWidth / 2;
        // Position at 50% from top (vertical center)
        this.#y = this.canvasHeight * 0.5;

        this.#velocity = 0;
        this.#rotation = 0;

        this.animationState = ANIMATION_STATES.IDLE;
        this.#animationFrame = 0;
        this.#animationTimer = 0;

        this.#isDead = false;
        this.#deathFrame = 0;
        this.#opacity = 1.0;

        this.#isInvincible = false;
        this.#invincibilityFrames = 0;

        // Reset cape
        this.#cape.reset();
    }

    /**
     * Updates canvas dimensions (responsive design).
     * @param {number} canvasWidth - New canvas width
     * @param {number} canvasHeight - New canvas height
     */
    updateCanvasSize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
}

// Export as default for convenient importing
export default Kiro;

// Also export the class and constants for external use
export { Kiro, ANIMATION_STATES };
