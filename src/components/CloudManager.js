/**
 * CloudManager - Manages cloud background decorations
 * Spawns and updates cloud entities for parallax effect
 * Uses ObjectPool to reduce garbage collection
 */
import ObjectPool from '../utils/ObjectPool.js';

class CloudManager {
    /**
     * Creates a new CloudManager
     * @param {Object} config - Game configuration
     */
    constructor(config) {
        this.config = config;
        this.clouds = [];

        // Create cloud pool with 10-15 capacity based on config
        const poolSize = config.cloudPoolSize || 12;
        this.cloudPool = new ObjectPool(
            () => this._createEmptyCloud(),
            poolSize,
            poolSize * 2
        );

        this.frameCounter = 0;
        this.spawnInterval = config.cloudSpawnInterval || 180;
    }

    /**
     * Creates an empty cloud object structure
     * @returns {Object} Empty cloud object
     */
    _createEmptyCloud() {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            speed: 0
        };
    }

    /**
     * Updates all clouds and spawns new ones
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.frameCounter++;

        if (this.frameCounter >= this.spawnInterval) {
            this.frameCounter = 0;
            this.spawnCloud();
        }

        // Update cloud positions
        for (const cloud of this.clouds) {
            cloud.x -= cloud.speed * dt;
        }

        // Remove offscreen clouds
        this.removeOffscreenClouds();
    }

    /**
     * Spawns a new cloud with random properties
     */
    spawnCloud() {
        // Acquire cloud from pool or create new
        const cloud = this.cloudPool.acquire();

        // Reset cloud properties
        cloud.x = this.config.canvasWidth;
        cloud.y = Math.random() * (this.config.canvasHeight * 0.6);
        cloud.width = 80 + Math.random() * 60;
        cloud.height = 30 + Math.random() * 20;
        cloud.speed = 20 + Math.random() * 30;

        this.clouds.push(cloud);
    }

    /**
     * Gets all active clouds
     * @returns {Array} Array of cloud objects
     */
    getClouds() {
        return this.clouds;
    }

    /**
     * Removes offscreen clouds and returns them to the pool
     */
    removeOffscreenClouds() {
        const remainingClouds = [];

        for (const cloud of this.clouds) {
            if (cloud.x + cloud.width > 0) {
                remainingClouds.push(cloud);
            } else {
                // Return offscreen cloud to pool
                this.cloudPool.release(cloud);
            }
        }

        this.clouds = remainingClouds;
    }

    /**
     * Gets cloud pool statistics
     * @returns {Object} Pool statistics
     */
    getPoolStats() {
        return this.cloudPool.getStats();
    }

    /**
     * Resets the cloud manager for a new game
     */
    reset() {
        // Release all clouds back to pool
        for (const cloud of this.clouds) {
            this.cloudPool.release(cloud);
        }
        this.clouds = [];
        this.frameCounter = 0;
    }
}

export default CloudManager;