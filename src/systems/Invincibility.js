/**
 * Invincibility.js - Invincibility system for post-restart protection
 *
 * Provides temporary invincibility after game restart to prevent
 * immediate re-collision. Includes flash effect for visual feedback.
 *
 * Validates: Requirements 3.15-3.19
 */

import { CONFIG } from '../config.js';

/**
 * InvincibilityModel interface defining the data structure for invincibility tracking
 * @typedef {Object} InvincibilityModel
 * @property {number} framesRemaining - Number of frames left in invincibility
 * @property {number} totalFrames - Total frames for full invincibility duration
 * @property {number} flashInterval - Interval in frames for visibility toggle
 * @property {boolean} isActive - Whether invincibility is currently active
 */

/**
 * Invincibility class manages temporary invincibility frames after restart
 *
 * Provides 120 frames (2 seconds at 60 FPS) of invincibility with a visual
 * flash effect toggling every 4 frames. During invincibility, pipe collision
 * detection is disabled but boundary collisions remain active.
 */
class Invincibility {
    /**
     * Creates a new Invincibility instance
     * @param {Object} [config] - Configuration object with invincibility settings
     * @param {number} [config.frames] - Total invincibility frames (default: 120)
     * @param {number} [config.flashInterval] - Flash toggle interval frames (default: 4)
     */
    constructor(config = {}) {
        // Total frames for invincibility duration
        this._totalFrames = config.frames ?? CONFIG.game.invincibilityFrames;

        // Flash toggle interval in frames
        this._flashInterval = config.flashInterval ?? CONFIG.game.invincibilityFlashInterval;

        // Frames remaining in invincibility
        this._framesRemaining = 0;

        // Frame counter for flash timing
        this._frameCounter = 0;

        // Current flash state (visible or hidden)
        this._isVisible = true;
    }

    /**
     * Gets the invincibility model data
     * @returns {InvincibilityModel} Current invincibility state
     */
    get model() {
        return {
            framesRemaining: this._framesRemaining,
            totalFrames: this._totalFrames,
            flashInterval: this._flashInterval,
            isActive: this.isActive()
        };
    }

    /**
     * Gets total invincibility frames
     * @returns {number} Total frames configured
     */
    get totalFrames() {
        return this._totalFrames;
    }

    /**
     * Gets remaining invincibility frames
     * @returns {number} Frames remaining
     */
    get framesRemaining() {
        return this._framesRemaining;
    }

    /**
     * Gets flash interval
     * @returns {number} Flash toggle interval in frames
     */
    get flashInterval() {
        return this._flashInterval;
    }

    /**
     * Activates invincibility for the full duration
     *
     * Starts the invincibility period with the configured number of frames.
     * This method can be called to re-apply invincibility if needed.
     *
     * @returns {void}
     */
    activate() {
        this._framesRemaining = this._totalFrames;
        this._frameCounter = 0;
        this._isVisible = true;
    }

    /**
     * Updates invincibility state, counting down frames
     *
     * Should be called once per game frame. Decrements the frame counter
     * and returns whether invincibility is still active.
     *
     * @returns {boolean} True if invincibility is still active after update
     */
    update() {
        if (this._framesRemaining <= 0) {
            return false;
        }

        this._framesRemaining--;
        this._frameCounter++;

        // Toggle visibility based on flash interval
        if (this._frameCounter >= this._flashInterval) {
            this._frameCounter = 0;
            this._isVisible = !this._isVisible;
        }

        return this._framesRemaining > 0;
    }

    /**
     * Checks if invincibility is currently active
     *
     * @returns {boolean} True if invincibility frames remain
     */
    isActive() {
        return this._framesRemaining > 0;
    }

    /**
     * Checks if the sprite should flash (be hidden) this frame
     *
     * Used by the renderer to determine whether to show or hide
     * the Kiro sprite during invincibility for visual feedback.
     *
     * @returns {boolean} True if sprite should be hidden this frame
     */
    shouldFlash() {
        return this._framesRemaining > 0 && !this._isVisible;
    }

    /**
     * Checks if pipe collision detection should be performed
     *
     * During invincibility, pipe collisions are disabled to prevent
     * immediate re-collision after restart.
     *
     * @returns {boolean} True if pipe collision detection is enabled
     */
    isPipeCollisionEnabled() {
        return this._framesRemaining <= 0;
    }

    /**
     * Checks if boundary collision detection should be performed
     *
     * Boundary collisions (ceiling and ground) remain active even
     * during invincibility.
     *
     * @returns {boolean} True if boundary collision detection is enabled
     */
    isBoundaryCollisionEnabled() {
        return true; // Boundary collisions always enabled
    }

    /**
     * Gets current visibility state for rendering
     *
     * @returns {boolean} True if Kiro should be visible this frame
     */
    isVisible() {
        return this._framesRemaining <= 0 || this._isVisible;
    }

    /**
     * Resets the invincibility state
     *
     * Clears all invincibility data. After reset, isActive() returns false
     * and all collision detection methods return their default enabled state.
     *
     * @returns {void}
     */
    reset() {
        this._framesRemaining = 0;
        this._frameCounter = 0;
        this._isVisible = true;
    }

    /**
     * Gets progress percentage of invincibility completion
     *
     * @returns {number} Percentage complete (0.0 to 1.0)
     */
    getProgress() {
        if (this._totalFrames === 0) {
            return 1.0;
        }
        return 1.0 - (this._framesRemaining / this._totalFrames);
    }
}

// Export as default
export default Invincibility;