/**
 * QualityManager - Manages dynamic quality scaling based on performance
 * Monitors FPS and adjusts visual quality to maintain smooth gameplay
 */
class QualityManager {
    /**
     * Quality level enumeration
     * @readonly
     * @enum {string}
     */
    static QualityLevel = Object.freeze({
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW'
    });

    /**
     * Performance thresholds for quality scaling
     * @readonly
     */
    static THRESHOLDS = Object.freeze({
        fpsLow: 30,          // FPS threshold to reduce quality
        fpsHigh: 55,         // FPS threshold to restore quality
        frameCountLow: 60,   // Frames below threshold before reducing
        frameCountHigh: 60   // Frames above threshold before increasing
    });

    /**
     * Creates a new QualityManager instance
     * @param {PerformanceMonitor} performanceMonitor - Performance monitoring instance
     * @param {Object} [config] - Optional quality configuration overrides
     */
    constructor(performanceMonitor, config = {}) {
        /** @type {PerformanceMonitor} */
        this._performanceMonitor = performanceMonitor;

        /** @type {string} Current quality level */
        this._currentLevel = QualityManager.QualityLevel.HIGH;

        /** @type {Object} Quality configuration */
        this._config = {
            fpsLow: config.fpsLow ?? QualityManager.THRESHOLDS.fpsLow,
            fpsHigh: config.fpsHigh ?? QualityManager.THRESHOLDS.fpsHigh,
            frameCountLow: config.frameCountLow ?? QualityManager.THRESHOLDS.frameCountLow,
            frameCountHigh: config.frameCountHigh ?? QualityManager.THRESHOLDS.frameCountHigh
        };

        /** @type {number} Counter for low FPS frames */
        this._lowFpsFrameCount = 0;

        /** @type {number} Counter for high FPS frames */
        this._highFpsFrameCount = 0;

        /** @type {string|null} Last logged quality level for change detection */
        this._lastLoggedLevel = null;
    }

    /**
     * Updates the quality level based on current performance
     * Checks FPS and adjusts quality up or down as needed
     * @returns {string} The new quality level after update
     */
    update() {
        const fps = this._performanceMonitor.getFPS();

        if (fps < this._config.fpsLow) {
            this._lowFpsFrameCount++;
            this._highFpsFrameCount = 0;

            if (this._lowFpsFrameCount >= this._config.frameCountLow) {
                this._reduceQuality();
                this._lowFpsFrameCount = 0;
            }
        } else if (fps > this._config.fpsHigh) {
            this._highFpsFrameCount++;
            this._lowFpsFrameCount = 0;

            if (this._highFpsFrameCount >= this._config.frameCountHigh) {
                this._increaseQuality();
                this._highFpsFrameCount = 0;
            }
        } else {
            // FPS is in the middle range, reset counters
            this._lowFpsFrameCount = 0;
            this._highFpsFrameCount = 0;
        }

        return this._currentLevel;
    }

    /**
     * Reduces quality by one level if not already at LOW
     * @private
     */
    _reduceQuality() {
        if (this._currentLevel === QualityManager.QualityLevel.HIGH) {
            this._currentLevel = QualityManager.QualityLevel.MEDIUM;
        } else if (this._currentLevel === QualityManager.QualityLevel.MEDIUM) {
            this._currentLevel = QualityManager.QualityLevel.LOW;
        }
    }

    /**
     * Increases quality by one level if not already at HIGH
     * @private
     */
    _increaseQuality() {
        if (this._currentLevel === QualityManager.QualityLevel.LOW) {
            this._currentLevel = QualityManager.QualityLevel.MEDIUM;
        } else if (this._currentLevel === QualityManager.QualityLevel.MEDIUM) {
            this._currentLevel = QualityManager.QualityLevel.HIGH;
        }
    }

    /**
     * Gets the current quality level
     * @returns {string} Current quality level (HIGH, MEDIUM, or LOW)
     */
    getLevel() {
        return this._currentLevel;
    }

    /**
     * Manually sets the quality level
     * @param {string} level - Quality level to set (HIGH, MEDIUM, or LOW)
     * @throws {Error} If level is not a valid quality level
     */
    setLevel(level) {
        const validLevels = Object.values(QualityManager.QualityLevel);
        if (!validLevels.includes(level)) {
            throw new Error(`Invalid quality level: ${level}. Must be one of: ${validLevels.join(', ')}`);
        }
        this._currentLevel = level;
        this._lowFpsFrameCount = 0;
        this._highFpsFrameCount = 0;
    }

    /**
     * Determines whether cloud rendering should be enabled
     * Clouds are disabled on MEDIUM and LOW quality levels
     * @returns {boolean} True if clouds should be rendered
     */
    shouldRenderClouds() {
        return this._currentLevel === QualityManager.QualityLevel.HIGH;
    }

    /**
     * Determines whether cloud shadows should be rendered
     * Cloud shadows are disabled on MEDIUM and LOW quality levels
     * @returns {boolean} True if cloud shadows should be rendered
     */
    shouldRenderCloudShadows() {
        return this._currentLevel === QualityManager.QualityLevel.HIGH;
    }

    /**
     * Determines whether pipe details (caps) should be rendered
     * Pipe details are only rendered on HIGH quality level
     * @returns {boolean} True if pipe caps/details should be rendered
     */
    shouldRenderPipeDetails() {
        return this._currentLevel === QualityManager.QualityLevel.HIGH;
    }

    /**
     * Determines whether HD sprites should be used
     * HD sprites are used on HIGH and MEDIUM quality levels
     * @returns {boolean} True if HD sprites should be used
     */
    shouldUseHDSprites() {
        return this._currentLevel !== QualityManager.QualityLevel.LOW;
    }

    /**
     * Determines whether simplified pipe rendering should be used
     * Simplified pipes are used on LOW quality level
     * @returns {boolean} True if simplified pipe rendering should be used
     */
    shouldUseSimplifiedPipes() {
        return this._currentLevel === QualityManager.QualityLevel.LOW;
    }

    /**
     * Gets all current quality settings as an object
     * Useful for rendering systems to check multiple settings at once
     * @returns {Object} Object containing all quality settings
     */
    getQualitySettings() {
        return {
            level: this._currentLevel,
            renderClouds: this.shouldRenderClouds(),
            renderCloudShadows: this.shouldRenderCloudShadows(),
            renderPipeDetails: this.shouldRenderPipeDetails(),
            useHDSprites: this.shouldUseHDSprites(),
            useSimplifiedPipes: this.shouldUseSimplifiedPipes()
        };
    }

    /**
     * Resets the quality manager to default state
     * Resets to HIGH quality and clears frame counters
     */
    reset() {
        this._currentLevel = QualityManager.QualityLevel.HIGH;
        this._lowFpsFrameCount = 0;
        this._highFpsFrameCount = 0;
        this._lastLoggedLevel = null;
    }
}

export default QualityManager;