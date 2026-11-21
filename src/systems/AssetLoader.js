/**
 * AssetLoader - Manages loading and caching of game assets
 * Handles images and audio with progress tracking and error handling
 */
class AssetLoader {
    /**
     * Create a new AssetLoader
     * @param {Object} config - Configuration object for asset loading
     * @param {string} [config.basePath=''] - Base path for asset URLs
     * @param {number} [config.timeout=5000] - Loading timeout in milliseconds
     */
    constructor(config = {}) {
        /** @type {Map<string, HTMLImageElement>} */
        this.#images = new Map();
        /** @type {Map<string, HTMLAudioElement>} */
        this.#audio = new Map();
        /** @type {Array<{name: string, type: string, src: string}>} */
        this.#loadingQueue = [];
        /** @type {number} */
        this.#loadedCount = 0;
        /** @type {number} */
        this.#totalCount = 0;
        /** @type {Array<{name: string, type: string, error: Error}>} */
        this.#errors = [];
        /** @type {string} */
        this.#basePath = config.basePath || '';
        /** @type {number} */
        this.#timeout = config.timeout || 5000;
    }

    // =========================================================================
    // Private Fields
    // =========================================================================

    /** @type {Map<string, HTMLImageElement>} */
    #images;
    /** @type {Map<string, HTMLAudioElement>} */
    #audio;
    /** @type {Array<{name: string, type: string, src: string}>} */
    #loadingQueue;
    /** @type {number} */
    #loadedCount;
    /** @type {number} */
    #totalCount;
    /** @type {Array<{name: string, type: string, error: Error}>} */
    #errors;
    /** @type {string} */
    #basePath;
    /** @type {number} */
    #timeout;

    // =========================================================================
    // Public Methods
    // =========================================================================

    /**
     * Load an image asset
     * @param {string} name - Unique identifier for the asset
     * @param {string} src - Image source URL
     * @returns {Promise<HTMLImageElement>} Promise resolving to the loaded image
     */
    loadImage(name, src) {
        return new Promise((resolve) => {
            // Check if already loaded
            if (this.#images.has(name)) {
                resolve(this.#images.get(name));
                return;
            }

            const img = new Image();
            const fullSrc = this.#basePath + src;

            // Set up timeout for network resilience
            const timeoutId = setTimeout(() => {
                img.onload = null;
                img.onerror = null;
                const error = new Error(`Image load timeout: ${fullSrc}`);
                console.warn(error.message);
                this.#errors.push({ name, type: 'image', error });
                resolve(null);
            }, this.#timeout);

            /** @type {HTMLImageElement} */
            img.onload = () => {
                clearTimeout(timeoutId);
                this.#images.set(name, img);
                this.#loadedCount++;
                resolve(img);
            };

            /** @type {HTMLImageElement} */
            img.onerror = () => {
                clearTimeout(timeoutId);
                const error = new Error(`Failed to load image: ${fullSrc}`);
                console.warn(error.message);
                this.#errors.push({ name, type: 'image', error });
                // Resolve with null for graceful degradation
                resolve(null);
            };

            img.src = fullSrc;
        });
    }

    /**
     * Load an audio asset
     * @param {string} name - Unique identifier for the asset
     * @param {string} src - Audio source URL
     * @returns {Promise<HTMLAudioElement>} Promise resolving to the loaded audio
     */
    loadAudio(name, src) {
        return new Promise((resolve) => {
            // Check if already loaded
            if (this.#audio.has(name)) {
                resolve(this.#audio.get(name));
                return;
            }

            const fullSrc = this.#basePath + src;
            const audio = new Audio();

            // Set up timeout for network resilience
            const timeoutId = setTimeout(() => {
                audio.oncanplaythrough = null;
                audio.onerror = null;
                const error = new Error(`Audio load timeout: ${fullSrc}`);
                console.warn(error.message);
                this.#errors.push({ name, type: 'audio', error });
                resolve(null);
            }, this.#timeout);

            /** @type {HTMLAudioElement} */
            audio.oncanplaythrough = () => {
                clearTimeout(timeoutId);
                this.#audio.set(name, audio);
                this.#loadedCount++;
                resolve(audio);
            };

            /** @type {HTMLAudioElement} */
            audio.onerror = () => {
                clearTimeout(timeoutId);
                const error = new Error(`Failed to load audio: ${fullSrc}`);
                console.warn(error.message);
                this.#errors.push({ name, type: 'audio', error });
                // Resolve with null for graceful degradation
                resolve(null);
            };

            audio.src = fullSrc;
            audio.load();
        });
    }

    /**
     * Get a loaded image by name
     * @param {string} name - Asset identifier
     * @returns {HTMLImageElement | null} The loaded image or null if not found
     */
    getImage(name) {
        return this.#images.get(name) || null;
    }

    /**
     * Get a loaded audio by name
     * @param {string} name - Asset identifier
     * @returns {HTMLAudioElement | null} The loaded audio or null if not found
     */
    getAudio(name) {
        return this.#audio.get(name) || null;
    }

    /**
     * Load multiple assets from a manifest
     * @param {Array<{name: string, type: 'image'|'audio', src: string}>} manifest - Array of assets to load
     * @returns {Promise<{loaded: number, total: number}>} Promise resolving to loading progress
     */
    async loadAll(manifest) {
        this.#loadingQueue = [...manifest];
        this.#loadedCount = 0;
        this.#totalCount = manifest.length;
        this.#errors = [];

        const loadPromises = manifest.map(async (asset) => {
            if (asset.type === 'image') {
                return this.loadImage(asset.name, asset.src);
            } else if (asset.type === 'audio') {
                return this.loadAudio(asset.name, asset.src);
            }
            console.warn(`Unknown asset type: ${asset.type}`);
            return null;
        });

        await Promise.allSettled(loadPromises);
        return this.getProgress();
    }

    /**
     * Get current loading progress
     * @returns {{loaded: number, total: number, percent: number}} Progress object with count and percentage
     */
    getProgress() {
        const total = this.#totalCount || this.#loadingQueue.length;
        const percent = total > 0 ? (this.#loadedCount / total) * 100 : 100;
        return {
            loaded: this.#loadedCount,
            total,
            percent: Math.round(percent * 100) / 100
        };
    }

    /**
     * Check if all assets have finished loading
     * @returns {boolean} True if all assets are loaded
     */
    areAllLoaded() {
        const total = this.#totalCount || this.#loadingQueue.length;
        return this.#loadedCount >= total;
    }

    /**
     * Check if there were any loading errors
     * @returns {boolean} True if there were errors
     */
    hasErrors() {
        return this.#errors.length > 0;
    }

    /**
     * Get all loading errors
     * @returns {Array<{name: string, type: string, error: Error}>} Array of error objects
     */
    getErrors() {
        return [...this.#errors];
    }

    /**
     * Clear all loaded assets and reset state
     */
    reset() {
        this.#images.clear();
        this.#audio.clear();
        this.#loadingQueue = [];
        this.#loadedCount = 0;
        this.#totalCount = 0;
        this.#errors = [];
    }

    /**
     * Get count of loaded images
     * @returns {number} Number of loaded images
     */
    getImageCount() {
        return this.#images.size;
    }

    /**
     * Get count of loaded audio files
     * @returns {number} Number of loaded audio files
     */
    getAudioCount() {
        return this.#audio.size;
    }
}

export default AssetLoader;