/**
 * @fileoverview PipeManager - Manages pipe generation, movement, and cleanup
 * @module systems/PipeManager
 */

import { CONFIG, DIFFICULTY_TIERS } from '../config.js';

/**
 * @typedef {Object} ObstacleModel
 * @description Data model for pipe obstacles in the game
 * @property {number} x - Horizontal position of the pipe
 * @property {number} y - Vertical position (not used directly, gapPosition determines heights)
 * @property {number} width - Width of the pipe segment (60px)
 * @property {number} gapHeight - Vertical size of the gap between upper and lower pipes
 * @property {number} gapPosition - Vertical center position of the gap
 * @property {boolean} passed - Whether the player has passed this pipe for scoring
 * @property {number} speed - Horizontal movement speed of the pipe
 */

/**
 * @typedef {Object} DifficultyTier
 * @description Represents a difficulty level with associated parameters
 * @property {number} threshold - Score threshold for this tier
 * @property {number} speedMultiplier - Multiplier for base horizontal velocity
 * @property {number} gapSize - Gap height for this tier
 * @property {string} name - Human-readable name of the tier
 */

/**
 * PipeManager class
 * Handles creation, movement, and cleanup of pipe obstacles
 * Implements difficulty progression based on score thresholds
 */
class PipeManager {
    /**
     * Creates a new PipeManager instance
     * @param {Object} config - Game configuration object
     * @param {number} canvasWidth - Width of the game canvas
     * @param {number} canvasHeight - Height of the game canvas
     */
    constructor(config, canvasWidth, canvasHeight) {
        /** @type {Object} Game configuration */
        this._config = config;

        /** @type {number} Canvas width */
        this._canvasWidth = canvasWidth;

        /** @type {number} Canvas height */
        this._canvasHeight = canvasHeight;

        /** @type {ObstacleModel[]} Active pipe obstacles */
        this._pipes = [];

        /** @type {number} Frame counter for spawn timing */
        this._frameCounter = 0;

        /** @type {number} X position of the last spawned pipe */
        this._lastSpawnX = 0;

        /** @type {number} Current difficulty tier index */
        this._currentTierIndex = 0;

        /** @type {number} Base horizontal velocity from config */
        this._baseSpeed = CONFIG.physics.horizontalVelocity || 2.0;

        /** @type {number} Wall pair spacing in frames */
        this._spawnInterval = CONFIG.pipes.wallPairSpacing || 90;

        /** @type {number} Minimum gap clearance from edges */
        this._gapClearance = CONFIG.pipes.gapClearance || 50;
    }

    /**
     * Gets the current difficulty tier based on score
     * @param {number} score - Current game score
     * @returns {DifficultyTier} The active difficulty tier
     */
    _getDifficultyTier(score) {
        // Find the appropriate tier based on score
        // Use the last tier whose threshold is <= score
        let tierIndex = 0;
        for (let i = 0; i < DIFFICULTY_TIERS.length; i++) {
            if (score >= DIFFICULTY_TIERS[i].threshold) {
                tierIndex = i;
            } else {
                break;
            }
        }
        return DIFFICULTY_TIERS[tierIndex];
    }

    /**
     * Gets the gap size for the current score
     * @param {number} score - Current game score
     * @returns {number} Gap size in pixels
     */
    _getGapSize(score) {
        const tier = this._getDifficultyTier(score);
        return tier.gapSize;
    }

    /**
     * Gets the speed for the current score
     * @param {number} score - Current game score
     * @returns {number} Movement speed in pixels per frame
     */
    _getSpeed(score) {
        const tier = this._getDifficultyTier(score);
        return this._baseSpeed * tier.speedMultiplier;
    }

    /**
     * Calculates a valid random gap position
     * Ensures the gap is within 25%-75% of canvas height and properly clamped
     * @param {number} gapSize - Size of the gap
     * @returns {number} Valid gap position (center Y)
     */
    _calculateGapPosition(gapSize) {
        // Calculate the minimum and maximum allowed positions
        const minGapY = this._gapClearance + (gapSize / 2);
        const maxGapY = this._canvasHeight - minGapY;

        // Generate random position between 25% and 75% of canvas
        const minRandom = this._canvasHeight * 0.25;
        const maxRandom = this._canvasHeight * 0.75;

        let gapPosition = minRandom + Math.random() * (maxRandom - minRandom);

        // Clamp to valid range (within 50px of edges requirement)
        // The gap center should not be within gapClearance of top/bottom
        if (gapPosition < minGapY) {
            gapPosition = minGapY;
        } else if (gapPosition > maxGapY) {
            gapPosition = maxGapY;
        }

        return gapPosition;
    }

    /**
     * Returns all active obstacles
     * @returns {ObstacleModel[]} Array of active pipe obstacles
     */
    getObstacles() {
        return [...this._pipes];
    }

    /**
     * Updates pipe positions, spawns new pipes, and removes off-screen pipes
     * @param {number} deltaTime - Time elapsed since last update (in frames, typically 1.0)
     * @param {number} currentScore - Current game score for difficulty calculation
     */
    update(deltaTime, currentScore) {
        // Increment frame counter
        this._frameCounter++;

        // Spawn new pipe if enough frames have passed
        if (this._frameCounter >= this._spawnInterval) {
            this._frameCounter = 0;
            this._spawnPipe(currentScore);
        }

        // Update pipe positions (move left)
        const speed = this._getSpeed(currentScore);
        for (const pipe of this._pipes) {
            pipe.x -= speed * deltaTime;
        }

        // Remove pipes that have passed off the left edge
        this._removeOffscreenPipes();
    }

    /**
     * Spawns a new pipe at the right edge of the canvas
     * @param {number} currentScore - Current game score for difficulty calculation
     * @returns {ObstacleModel} The newly created pipe obstacle
     */
    _spawnPipe(currentScore) {
        const gapSize = this._getGapSize(currentScore);
        const gapPosition = this._calculateGapPosition(gapSize);
        const speed = this._getSpeed(currentScore);

        /** @type {ObstacleModel} */
        const pipe = {
            x: this._canvasWidth,
            y: 0,
            width: CONFIG.pipes.pipeWidth || 60,
            gapHeight: gapSize,
            gapPosition: gapPosition,
            passed: false,
            speed: speed
        };

        this._pipes.push(pipe);
        this._lastSpawnX = pipe.x;

        return pipe;
    }

    /**
     * Removes pipes that have moved completely off the left side of the canvas
     */
    _removeOffscreenPipes() {
        this._pipes = this._pipes.filter(pipe => pipe.x + pipe.width > 0);
    }

    /**
     * Resets the pipe manager to initial state
     */
    reset() {
        this._pipes = [];
        this._frameCounter = 0;
        this._lastSpawnX = 0;
        this._currentTierIndex = 0;
    }

    /**
     * Gets the X position where Kiro scores a point
     * This is the center of the last spawned pipe
     * @returns {number} X position for scoring
     */
    getScorePosition() {
        // Score is awarded when Kiro passes the center of a pipe
        // The pipe's width is the gap where scoring happens
        if (this._pipes.length === 0) {
            return 0;
        }

        // Find the leftmost pipe that hasn't been passed yet
        for (const pipe of this._pipes) {
            if (!pipe.passed) {
                return pipe.x + (pipe.width / 2);
            }
        }

        // If all pipes passed, return position of last pipe
        const lastPipe = this._pipes[this._pipes.length - 1];
        return lastPipe ? lastPipe.x + (lastPipe.width / 2) : 0;
    }

    /**
     * Gets the number of active pipes
     * @returns {number} Count of active pipes
     */
    getPipeCount() {
        return this._pipes.length;
    }

    /**
     * Gets the current frame counter value
     * @returns {number} Current frame count since last spawn
     */
    getFrameCounter() {
        return this._frameCounter;
    }

    /**
     * Gets the current spawn interval
     * @returns {number} Frames between pipe spawns
     */
    getSpawnInterval() {
        return this._spawnInterval;
    }

    /**
     * Updates canvas dimensions (for responsive design)
     * @param {number} canvasWidth - New canvas width
     * @param {number} canvasHeight - New canvas height
     */
    updateCanvasSize(canvasWidth, canvasHeight) {
        this._canvasWidth = canvasWidth;
        this._canvasHeight = canvasHeight;
    }
}

// Export as default module
export default PipeManager;