/**
 * PipeManager - Manages pipe generation and updates
 * Spawns pipe pairs with configurable gaps and speeds
 * Uses ObjectPool to reduce garbage collection
 */
import ObjectPool from '../utils/ObjectPool.js';

class PipeManager {
    /**
     * Creates a new PipeManager
     * @param {Object} config - Game configuration
     * @param {Object} difficultyManager - Difficulty manager instance
     */
    constructor(config, difficultyManager) {
        this.config = config;
        this.difficulty = difficultyManager;
        this.pipes = [];

        // Create pipe pool with 10-20 capacity based on config
        const poolSize = config.pipePoolSize || 15;
        this.pipePool = new ObjectPool(
            () => this._createEmptyPipe(),
            poolSize,
            poolSize * 2
        );

        this.frameCounter = 0;
        this.spawnInterval = config.wallPairSpacing || 120;
    }

    /**
     * Creates an empty pipe object structure
     * @returns {Object} Empty pipe object
     */
    _createEmptyPipe() {
        return {
            x: 0,
            width: 0,
            gapHeight: 0,
            gapPosition: 0,
            speed: 0,
            passed: false
        };
    }

    /**
     * Updates all pipes and spawns new ones
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.frameCounter++;

        if (this.frameCounter >= this.spawnInterval) {
            this.frameCounter = 0;
            this.spawnPipe();
        }

        // Update pipe positions
        for (const pipe of this.pipes) {
            pipe.x -= pipe.speed;
        }

        // Remove offscreen pipes
        this.removeOffscreenPipes();
    }

    /**
     * Spawns a new pipe pair with random gap position
     */
    spawnPipe() {
        const difficulty = this.difficulty.getDifficulty();
        const minGapY = this.config.gapClearance + (difficulty.gapSize / 2);
        const maxGapY = this.config.canvasHeight - minGapY;
        const gapPosition = minGapY + Math.random() * (maxGapY - minGapY);

        // Acquire pipe from pool or create new
        const pipe = this.pipePool.acquire();

        // Reset pipe properties
        pipe.x = this.config.canvasWidth;
        pipe.width = this.config.pipeWidth;
        pipe.gapHeight = difficulty.gapSize;
        pipe.gapPosition = gapPosition;
        pipe.speed = difficulty.speed;
        pipe.passed = false;

        this.pipes.push(pipe);
    }

    /**
     * Gets all active pipes
     * @returns {Array} Array of pipe objects
     */
    getPipes() {
        return this.pipes;
    }

    /**
     * Removes offscreen pipes and returns them to the pool
     */
    removeOffscreenPipes() {
        const remainingPipes = [];

        for (const pipe of this.pipes) {
            if (pipe.x + pipe.width > 0) {
                remainingPipes.push(pipe);
            } else {
                // Return offscreen pipe to pool
                this.pipePool.release(pipe);
            }
        }

        this.pipes = remainingPipes;
    }

    /**
     * Gets pipe pool statistics
     * @returns {Object} Pool statistics
     */
    getPoolStats() {
        return this.pipePool.getStats();
    }

    /**
     * Resets the pipe manager for a new game
     */
    reset() {
        // Release all pipes back to pool
        for (const pipe of this.pipes) {
            this.pipePool.release(pipe);
        }
        this.pipes = [];
        this.frameCounter = 0;
        this.difficulty.reset();
    }
}

export default PipeManager;