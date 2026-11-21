/**
 * PhysicsEngine - Handles physics calculations for Kiro entity
 *
 * Manages position, velocity, and rotation physics including:
 * - Gravity application and terminal velocity clamping
 * - Jump velocity application
 * - Rotation based on velocity
 *
 * All physics values are configurable via the CONFIG.physics object.
 * Physics calculations are frame-based (per-frame updates).
 */
class PhysicsEngine {
    /** @type {object} Configuration object containing physics constants */
    #config;

    /** @type {number} X position in pixels */
    #x;

    /** @type {number} Y position in pixels */
    #y;

    /** @type {number} Vertical velocity in px/frame (positive = down) */
    #velocityY;

    /** @type {number} Rotation angle in degrees */
    #rotation;

    /** @type {number} Gravity acceleration in px/frame² */
    #gravity;

    /** @type {number} Jump velocity in px/frame (negative = up) */
    #jumpStrength;

    /** @type {number} Maximum absolute velocity in px/frame */
    #terminalVelocity;

    /** @type {number} Horizontal velocity in px/frame */
    #horizontalVelocity;

    /** @type {number} Rotation degrees per 1 px/frame of velocity */
    #rotationRate;

    /** @type {number} Maximum upward rotation in degrees (negative) */
    #maxRotationUp;

    /** @type {number} Maximum downward rotation in degrees (positive) */
    #maxRotationDown;

    /**
     * Creates a new PhysicsEngine instance
     * @param {object} config - Configuration object with physics settings
     * @param {number} [config.gravity=0.25] - Downward acceleration (px/frame²)
     * @param {number} [config.jumpStrength=-4.5] - Upward velocity on jump (px/frame)
     * @param {number} [config.terminalVelocity=8.0] - Maximum fall speed (px/frame)
     * @param {number} [config.horizontalVelocity=2.0] - Forward speed (px/frame)
     * @param {number} [config.rotationRate=3] - Degrees rotation per 1 px/frame
     * @param {number} [config.maxRotationUp=30] - Maximum upward rotation degrees
     * @param {number} [config.maxRotationDown=90] - Maximum downward rotation degrees
     */
    constructor(config) {
        this.#config = config;

        // Load physics constants from config with defaults
        this.#gravity = config.gravity ?? 0.25;
        this.#jumpStrength = config.jumpStrength ?? -4.5;
        this.#terminalVelocity = config.terminalVelocity ?? 8.0;
        this.#horizontalVelocity = config.horizontalVelocity ?? 2.0;
        this.#rotationRate = config.rotationRate ?? 3;
        this.#maxRotationUp = config.maxRotationUp ?? 30;
        this.#maxRotationDown = config.maxRotationDown ?? 90;

        // Initialize physics state
        this.#x = 0;
        this.#y = 0;
        this.#velocityY = 0;
        this.#rotation = 0;
    }

    /**
     * Applies an upward jump force to Kiro
     * Sets vertical velocity directly to the configured jump strength
     *
     * @returns {number} The jump velocity that was applied
     */
    applyJump() {
        this.#velocityY = this.#jumpStrength;
        return this.#velocityY;
    }

    /**
     * Updates physics state for one frame
     * Applies gravity, clamps velocity, updates position and rotation
     *
     * @param {number} [deltaTime=1] - Time delta (unused, kept for interface compatibility)
     *                              Physics is frame-based, so this is typically 1.0
     */
    update(deltaTime = 1) {
        // Apply gravity
        this.#velocityY += this.#gravity;

        // Clamp velocity to terminal velocity (both directions)
        this.#velocityY = Math.max(
            -this.#terminalVelocity,
            Math.min(this.#terminalVelocity, this.#velocityY)
        );

        // Update position based on velocity
        this.#y += this.#velocityY;

        // Calculate rotation based on velocity
        this.#updateRotation();
    }

    /**
     * Updates rotation based on current velocity
     * Rotation is calculated as: velocity * rotationRate
     * Then clamped between maxRotationUp and maxRotationDown
     *
     * @private
     */
    #updateRotation() {
        const targetRotation = this.#velocityY * this.#rotationRate;
        this.#rotation = Math.max(
            -this.#maxRotationDown,
            Math.min(this.#maxRotationUp, targetRotation)
        );
    }

    /**
     * Gets the current vertical velocity
     *
     * @returns {number} Current velocity in px/frame (positive = down)
     */
    getVelocity() {
        return this.#velocityY;
    }

    /**
     * Gets the current position
     *
     * @returns {{ x: number, y: number }} Current position object
     */
    getPosition() {
        return {
            x: this.#x,
            y: this.#y
        };
    }

    /**
     * Gets the current rotation angle
     *
     * @returns {number} Current rotation in degrees
     */
    getRotation() {
        return this.#rotation;
    }

    /**
     * Gets the horizontal velocity
     *
     * @returns {number} Horizontal velocity in px/frame
     */
    getHorizontalVelocity() {
        return this.#horizontalVelocity;
    }

    /**
     * Resets physics state to initial values
     * Position, velocity, and rotation are all reset to defaults
     */
    reset() {
        this.#x = 0;
        this.#y = 0;
        this.#velocityY = 0;
        this.#rotation = 0;
    }

    /**
     * Sets the position directly (for initialization or respawn)
     *
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     */
    setPosition(x, y) {
        this.#x = x;
        this.#y = y;
    }

    /**
     * Gets the current physics state for debugging or serialization
     *
     * @returns {{ x: number, y: number, velocityY: number, rotation: number }}
     */
    getState() {
        return {
            x: this.#x,
            y: this.#y,
            velocityY: this.#velocityY,
            rotation: this.#rotation
        };
    }
}

// Named export for testing compatibility
export { PhysicsEngine };

// Default export
export default PhysicsEngine;