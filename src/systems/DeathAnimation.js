/**
 * src/systems/DeathAnimation.js - Death Sequence Animation System
 *
 * Manages the death sequence animation when Kiro collides with obstacles.
 * Handles opacity fade-out and 90-degree downward rotation over 60 frames.
 */

// ============================================================================
// DEATH ANIMATION MODEL
// Interface defining the state of the death animation
// ============================================================================

/**
 * @typedef {Object} DeathAnimationModel
 * @property {boolean} isPlaying - Whether the animation is currently playing
 * @property {number} frame - Current frame of the animation (0-based)
 * @property {number} totalFrames - Total frames in the animation sequence
 * @property {number} startOpacity - Opacity at the start of animation (1.0 = 100%)
 * @property {number} startRotation - Rotation in degrees at the start of animation
 * @property {number} currentOpacity - Current calculated opacity (0-1)
 * @property {number} currentRotation - Current calculated rotation in degrees
 * @property {boolean} complete - Whether the animation has finished
 */

/**
 * DeathAnimationResult - Return type for update operations
 * @typedef {Object} DeathAnimationResult
 * @property {boolean} complete - Whether the animation sequence is complete
 * @property {number} opacity - Current opacity value (0.0 to 1.0)
 * @property {number} rotation - Current rotation in degrees
 * @property {number} frame - Current frame number
 */

// ============================================================================
// DEATH ANIMATION CLASS
// Manages the death sequence animation lifecycle
// ============================================================================

/**
 * DeathAnimation - Handles the death sequence animation for Kiro
 *
 * When Kiro collides with an obstacle, this system manages a 60-frame death
 * animation that fades opacity to 0% and rotates Kiro 90 degrees downward.
 * Physics updates are suspended during the death sequence.
 *
 * @example
 * const deathAnimation = new DeathAnimation(GAME_CONFIG);
 * deathAnimation.start(kiro.x, kiro.y, kiro.rotation);
 * const result = deathAnimation.update();
 * if (result.complete) {
 *     game.transitionTo(GAME_STATES.GAMEOVER);
 * }
 */
class DeathAnimation {
    /**
     * Creates a new DeathAnimation instance
     * @param {Object} config - Animation configuration
     * @param {number} [config.totalFrames=60] - Total frames for death animation
     */
    constructor(config = {}) {
        /** @type {number} */
        this.#totalFrames = config.totalFrames || 60;

        // Animation state - private fields
        this.#isPlaying = false;
        this.#frame = 0;
        this.#startOpacity = 1.0;
        this.#startRotation = 0;
        this.#currentOpacity = 1.0;
        this.#currentRotation = 0;

        // Frozen position during death sequence
        this.#frozenX = 0;
        this.#frozenY = 0;

        // Animation constants
        this.#targetRotation = 90; // 90 degrees downward rotation
        this.#minOpacity = 0.0;
    }

    // =========================================================================
    // PUBLIC METHODS
    // =========================================================================

    /**
     * Starts the death sequence animation
     * Freezes Kiro's position and begins the 60-frame animation sequence.
     *
     * @param {number} x - Kiro's current x position
     * @param {number} y - Kiro's current y position
     * @param {number} currentRotation - Kiro's current rotation in degrees
     * @returns {void}
     * @example
     * // When collision is detected
     * deathAnimation.start(kiro.x, kiro.y, kiro.rotation);
     */
    start(x, y, currentRotation) {
        this.#isPlaying = true;
        this.#frame = 0;
        this.#startOpacity = 1.0;
        this.#startRotation = Math.max(0, currentRotation); // Ensure non-negative start
        this.#currentOpacity = this.#startOpacity;
        this.#currentRotation = this.#startRotation;

        // Freeze physics position at collision point
        this.#frozenX = x;
        this.#frozenY = y;
    }

    /**
     * Updates the animation state by one frame
     * Calculates current opacity and rotation based on progress through
     * the 60-frame animation sequence.
     *
     * @returns {DeathAnimationResult} Animation state for rendering
     * @returns {boolean} result.complete - Whether animation is finished
     * @returns {number} result.opacity - Current opacity (0.0 to 1.0)
     * @returns {number} result.rotation - Current rotation in degrees
     * @returns {number} result.frame - Current frame number
     * @example
     * const result = deathAnimation.update();
     * kiro.opacity = result.opacity;
     * kiro.rotation = result.rotation;
     * if (result.complete) {
     *     stateManager.transitionTo('GAMEOVER');
     * }
     */
    update() {
        if (!this.#isPlaying) {
            return {
                complete: false,
                opacity: this.#startOpacity,
                rotation: this.#startRotation,
                frame: 0
            };
        }

        // Advance frame first to ensure proper calculation order
        this.#frame++;

        // Check for completion (after increment, so we complete after totalFrames updates)
        if (this.#frame >= this.#totalFrames) {
            this.#isPlaying = false;
            this.#currentOpacity = this.#minOpacity;
            this.#currentRotation = this.#targetRotation;
            return {
                complete: true,
                opacity: this.#currentOpacity,
                rotation: this.#currentRotation,
                frame: this.#totalFrames
            };
        }

        // Calculate progress (0.0 to <1.0 for intermediate frames)
        const progress = this.#frame / this.#totalFrames;

        // Linear interpolation for opacity: 1.0 -> 0.0
        this.#currentOpacity = this.#startOpacity * (1.0 - progress);

        // Linear interpolation for rotation: start -> 90 degrees downward
        const rotationRange = this.#targetRotation - this.#startRotation;
        this.#currentRotation = this.#startRotation + (rotationRange * progress);

        return {
            complete: false,
            opacity: this.#currentOpacity,
            rotation: this.#currentRotation,
            frame: this.#frame
        };
    }

    /**
     * Checks if the animation is currently in progress
     *
     * @returns {boolean} True if death animation is playing
     * @example
     * if (deathAnimation.isPlaying()) {
     *     // Skip physics updates during death sequence
     *     return;
     * }
     */
    isPlaying() {
        return this.#isPlaying;
    }

    /**
     * Gets the frozen position during death sequence
     * Used by the renderer to draw Kiro at the collision point.
     *
     * @returns {{x: number, y: number}} Frozen position coordinates
     * @example
     * const pos = deathAnimation.getPosition();
     * renderer.drawSprite(ghostyImage, pos.x, pos.y, rotation);
     */
    getPosition() {
        return { x: this.#frozenX, y: this.#frozenY };
    }

    /**
     * Resets the animation to initial state
     * Clears all animation state for a new game session.
     *
     * @returns {void}
     * @example
     * deathAnimation.reset();
     */
    reset() {
        this.#isPlaying = false;
        this.#frame = 0;
        this.#startOpacity = 1.0;
        this.#startRotation = 0;
        this.#currentOpacity = 1.0;
        this.#currentRotation = 0;
        this.#frozenX = 0;
        this.#frozenY = 0;
    }

    /**
     * Gets the current animation state as a DeathAnimationModel
     * Useful for debugging and serialization.
     *
     * @returns {DeathAnimationModel} Current animation state
     */
    getState() {
        return {
            isPlaying: this.#isPlaying,
            frame: this.#frame,
            totalFrames: this.#totalFrames,
            startOpacity: this.#startOpacity,
            startRotation: this.#startRotation,
            currentOpacity: this.#currentOpacity,
            currentRotation: this.#currentRotation,
            complete: !this.#isPlaying && this.#frame > 0
        };
    }

    // =========================================================================
    // PRIVATE FIELDS
    // =========================================================================

    /** @type {boolean} */
    #isPlaying;

    /** @type {number} */
    #frame;

    /** @type {number} */
    #totalFrames;

    /** @type {number} */
    #startOpacity;

    /** @type {number} */
    #startRotation;

    /** @type {number} */
    #currentOpacity;

    /** @type {number} */
    #currentRotation;

    /** @type {number} */
    #frozenX;

    /** @type {number} */
    #frozenY;

    /** @type {number} */
    #targetRotation;

    /** @type {number} */
    #minOpacity;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default DeathAnimation;