/**
 * CloudManager - Manages cloud background decorations with parallax effect
 *
 * Handles multi-layer cloud spawning, movement, and removal for the
 * parallax scrolling background system.
 */

/**
 * @typedef {Object} CloudModel
 * @property {number} x - Horizontal position (pixels)
 * @property {number} y - Vertical position (pixels)
 * @property {number} width - Cloud width (80-150 pixels)
 * @property {property} height - Cloud height (30-50 pixels)
 * @property {'BACKGROUND'|'MIDGROUND'|'FOREGROUND'} layer - Parallax layer
 * @property {number} opacity - Layer-specific opacity (0.5-0.8)
 * @property {number} speed - Movement speed (pixels per frame)
 */

/**
 * Cloud layer constants for parallax depth
 * @enum {string}
 */
const CLOUD_LAYERS = Object.freeze({
    BACKGROUND: 'BACKGROUND',
    MIDGROUND: 'MIDGROUND',
    FOREGROUND: 'FOREGROUND'
});

/**
 * Layer configuration with parallax speeds and opacity
 */
const LAYER_CONFIG = Object.freeze({
    [CLOUD_LAYERS.BACKGROUND]: { speed: 0.5, opacity: 0.5 },
    [CLOUD_LAYERS.MIDGROUND]: { speed: 1.0, opacity: 0.65 },
    [CLOUD_LAYERS.FOREGROUND]: { speed: 2.0, opacity: 0.8 }
});

/**
 * Layer weights for spawning (higher = more likely)
 */
const LAYER_WEIGHTS = Object.freeze({
    [CLOUD_LAYERS.BACKGROUND]: 3,
    [CLOUD_LAYERS.MIDGROUND]: 2,
    [CLOUD_LAYERS.FOREGROUND]: 1
});

/**
 * Cloud size ranges
 */
const SIZE_RANGES = Object.freeze({
    width: { min: 80, max: 150 },
    height: { min: 30, max: 50 }
});

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = Object.freeze({
    spawnInterval: 120,
    canvasWidth: 480,
    canvasHeight: 640
});

/**
 * CloudManager - Handles cloud spawning, movement, and cleanup
 *
 * @class
 */
class CloudManager {
    /**
     * Creates a new CloudManager instance
     *
     * @param {Object} config - Cloud configuration object
     * @param {number} canvasWidth - Width of the game canvas
     * @param {number} canvasHeight - Height of the game canvas
     */
    constructor(config, canvasWidth, canvasHeight) {
        /**
         * Cloud configuration settings
         * @type {Object}
         */
        this.config = { ...DEFAULT_CONFIG, ...config };

        /**
         * Canvas dimensions for boundary calculations
         * @type {{width: number, height: number}}
         */
        this.canvasDimensions = {
            width: canvasWidth ?? this.config.canvasWidth,
            height: canvasHeight ?? this.config.canvasHeight
        };

        /**
         * Array of active cloud objects
         * @type {CloudModel[]}
         */
        this.#clouds = [];

        /**
         * Frame counter for spawn timing
         * @type {number}
         */
        this.#spawnTimer = 0;
    }

    // -------------------------------------------------------------------------
    // Private Fields
    // -------------------------------------------------------------------------

    /** @type {CloudModel[]} */
    #clouds;

    /** @type {number} */
    #spawnTimer;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Updates cloud positions, spawns new clouds, and removes off-screen clouds
     *
     * @param {number} deltaTime - Time elapsed since last update (in frames, typically 1.0)
     * @returns {void}
     */
    update(deltaTime) {
        this.#spawnTimer++;

        if (this.#spawnTimer >= this.config.spawnInterval) {
            this.#spawnTimer = 0;
            this.#spawnCloud();
        }

        // Update cloud positions
        for (const cloud of this.#clouds) {
            cloud.x -= cloud.speed * deltaTime;
        }

        // Remove clouds that have moved off-screen
        this.#removeOffscreenClouds();
    }

    /**
     * Resets the cloud manager to initial state
     *
     * Clears all clouds and resets the spawn timer.
     *
     * @returns {void}
     */
    reset() {
        this.#clouds = [];
        this.#spawnTimer = 0;
    }

    /**
     * Returns all active clouds sorted by layer depth
     *
     * Background clouds are returned first for proper rendering order.
     *
     * @returns {CloudModel[]} Array of clouds sorted by layer priority
     */
    getClouds() {
        return [...this.#clouds].sort((a, b) => {
            const layerOrder = [
                CLOUD_LAYERS.BACKGROUND,
                CLOUD_LAYERS.MIDGROUND,
                CLOUD_LAYERS.FOREGROUND
            ];
            return layerOrder.indexOf(a.layer) - layerOrder.indexOf(b.layer);
        });
    }

    /**
     * Returns the number of active clouds
     *
     * @returns {number} Count of clouds currently managed
     */
    getCloudCount() {
        return this.#clouds.length;
    }

    /**
     * Returns cloud counts by layer
     *
     * @returns {{background: number, midground: number, foreground: number}}
     */
    getCloudsByLayer() {
        const counts = {
            [CLOUD_LAYERS.BACKGROUND]: 0,
            [CLOUD_LAYERS.MIDGROUND]: 0,
            [CLOUD_LAYERS.FOREGROUND]: 0
        };

        for (const cloud of this.#clouds) {
            counts[cloud.layer]++;
        }

        return counts;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Spawns a new cloud at a random position off-screen right
     *
     * @returns {CloudModel} The newly created cloud
     */
    #spawnCloud() {
        const layer = this.#selectRandomLayer();
        const layerSettings = LAYER_CONFIG[layer];

        const cloud = {
            x: this.canvasDimensions.width + Math.random() * 100,
            y: this.#generateRandomY(),
            width: this.#generateRandomWidth(),
            height: this.#generateRandomHeight(),
            layer: layer,
            opacity: layerSettings.opacity,
            speed: layerSettings.speed
        };

        this.#clouds.push(cloud);
        return cloud;
    }

    /**
     * Removes clouds that have moved completely off-screen
     *
     * @returns {void}
     */
    #removeOffscreenClouds() {
        this.#clouds = this.#clouds.filter(cloud => cloud.x + cloud.width > 0);
    }

    /**
     * Selects a random layer based on weighted probabilities
     *
     * Background and midground clouds are more likely than foreground.
     *
     * @returns {typeof CLOUD_LAYERS[keyof typeof CLOUD_LAYERS]} Selected layer
     */
    #selectRandomLayer() {
        const totalWeight = Object.values(LAYER_WEIGHTS).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (const [layer, weight] of Object.entries(LAYER_WEIGHTS)) {
            random -= weight;
            if (random <= 0) {
                return layer;
            }
        }

        return CLOUD_LAYERS.BACKGROUND;
    }

    /**
     * Generates a random vertical position for a cloud
     *
     * Clouds spawn in the upper portion of the canvas.
     *
     * @returns {number} Random Y position
     */
    #generateRandomY() {
        return Math.random() * (this.canvasDimensions.height * 0.6);
    }

    /**
     * Generates a random cloud width
     *
     * @returns {number} Random width between 80-150 pixels
     */
    #generateRandomWidth() {
        return SIZE_RANGES.width.min + Math.random() * (SIZE_RANGES.width.max - SIZE_RANGES.width.min);
    }

    /**
     * Generates a random cloud height
     *
     * @returns {number} Random height between 30-50 pixels
     */
    #generateRandomHeight() {
        return SIZE_RANGES.height.min + Math.random() * (SIZE_RANGES.height.max - SIZE_RANGES.height.min);
    }
}

// Export class and constants
export { CloudManager as default, CloudManager, CLOUD_LAYERS, LAYER_CONFIG };