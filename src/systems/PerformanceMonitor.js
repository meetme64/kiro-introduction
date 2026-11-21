/**
 * PerformanceMonitor - Tracks game performance metrics
 * Monitors frame timing, FPS, and provides quality scaling recommendations
 */
class PerformanceMonitor {
    /**
     * Creates a new PerformanceMonitor instance
     * @param {Object} config - Configuration object with performance thresholds
     * @param {number} [config.fpsWarningThreshold=30] - FPS below which warnings are logged
     * @param {number} [config.fpsQualityIncreaseThreshold=55] - FPS above which quality can increase
     * @param {number} [config.frameTimeWarningThreshold=16.67] - Frame time (ms) above which warnings are logged
     * @param {number} [config.rollingAverageFrames=60] - Number of frames for rolling average
     * @param {number} [config.targetFPS=60] - Target FPS for calculations
     */
    constructor(config = {}) {
        // Configuration with defaults
        this.#fpsWarningThreshold = config.fpsWarningThreshold ?? 30;
        this.#fpsQualityIncreaseThreshold = config.fpsQualityIncreaseThreshold ?? 55;
        this.#frameTimeWarningThreshold = config.frameTimeWarningThreshold ?? 16.67;
        this.#rollingAverageFrames = config.rollingAverageFrames ?? 60;
        this.#targetFPS = config.targetFPS ?? 60;

        // Frame time tracking (rolling buffer)
        this.#frameTimes = [];

        // Current metrics
        this.#currentFPS = this.#targetFPS;
        this.#averageFPS = this.#targetFPS;
        this.#lastFrameTime = 0;
        this.#averageFrameTime = 1000 / this.#targetFPS;

        // Frame timing
        this.#frameStartTime = 0;
        this.#frameCount = 0;

        // Performance warning tracking
        this.#lowFpsWarningLogged = false;
        this.#highFrameTimeWarningLogged = false;
    }

    // =========================================================================
    // Public Methods
    // =========================================================================

    /**
     * Marks the start of a new frame
     * @returns {number} The timestamp when the frame started
     */
    beginFrame() {
        this.#frameStartTime = performance.now();
        return this.#frameStartTime;
    }

    /**
     * Marks the end of a frame and records its duration
     * @returns {number} The recorded frame time in milliseconds
     */
    endFrame() {
        const frameEndTime = performance.now();
        this.#lastFrameTime = frameEndTime - this.#frameStartTime;

        // Add to rolling buffer (maintains max size)
        this.#frameTimes.push(this.#lastFrameTime);
        if (this.#frameTimes.length > this.#rollingAverageFrames) {
            this.#frameTimes.shift();
        }

        // Update metrics
        this.#updateMetrics();

        // Check for performance warnings
        this.#checkPerformanceWarnings();

        this.#frameCount++;

        return this.#lastFrameTime;
    }

    /**
     * Returns the current instantaneous FPS
     * @returns {number} Current FPS (1000 / last frame time)
     */
    getFPS() {
        return this.#currentFPS;
    }

    /**
     * Returns the rolling average FPS over the configured number of frames
     * @returns {number} Average FPS over the rolling window
     */
    getAverageFPS() {
        return this.#averageFPS;
    }

    /**
     * Returns the last recorded frame time in milliseconds
     * @returns {number} Last frame time in ms
     */
    getFrameTime() {
        return this.#lastFrameTime;
    }

    /**
     * Returns the rolling average frame time in milliseconds
     * @returns {number} Average frame time over the rolling window
     */
    getAverageFrameTime() {
        return this.#averageFrameTime;
    }

    /**
     * Determines if quality should be reduced based on performance
     * @returns {boolean} True if FPS is below the warning threshold
     */
    shouldReduceQuality() {
        return this.#currentFPS < this.#fpsWarningThreshold;
    }

    /**
     * Determines if quality can be increased based on performance
     * @returns {boolean} True if FPS is above the increase threshold
     */
    shouldIncreaseQuality() {
        return this.#averageFPS > this.#fpsQualityIncreaseThreshold;
    }

    /**
     * Generates a comprehensive performance report
     * @returns {Object} Performance data including FPS, frame times, and recommendations
     */
    getPerformanceReport() {
        const memoryInfo = this.#getMemoryUsage();

        return {
            // Current metrics
            fps: Math.round(this.#currentFPS * 10) / 10,
            averageFPS: Math.round(this.#averageFPS * 10) / 10,
            frameTime: Math.round(this.#lastFrameTime * 100) / 100,
            averageFrameTime: Math.round(this.#averageFrameTime * 100) / 100,

            // Statistics
            frameCount: this.#frameCount,
            samplesCollected: this.#frameTimes.length,

            // Recommendations
            shouldReduceQuality: this.shouldReduceQuality(),
            shouldIncreaseQuality: this.shouldIncreaseQuality(),

            // Memory usage (if available)
            memory: memoryInfo,

            // Configuration
            thresholds: {
                fpsWarning: this.#fpsWarningThreshold,
                fpsQualityIncrease: this.#fpsQualityIncreaseThreshold,
                frameTimeWarning: this.#frameTimeWarningThreshold,
                targetFPS: this.#targetFPS,
                rollingAverageFrames: this.#rollingAverageFrames
            },

            // Timestamp
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Resets all tracking data to initial values
     */
    reset() {
        this.#frameTimes.length = 0;
        this.#currentFPS = this.#targetFPS;
        this.#averageFPS = this.#targetFPS;
        this.#lastFrameTime = 0;
        this.#averageFrameTime = 1000 / this.#targetFPS;
        this.#frameCount = 0;
        this.#lowFpsWarningLogged = false;
        this.#highFrameTimeWarningLogged = false;
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    /**
     * Updates FPS and frame time metrics
     * @private
     */
    #updateMetrics() {
        // Calculate instantaneous FPS from last frame time
        if (this.#lastFrameTime > 0) {
            this.#currentFPS = 1000 / this.#lastFrameTime;
        }

        // Calculate rolling average frame time
        if (this.#frameTimes.length > 0) {
            const sum = this.#frameTimes.reduce((acc, time) => acc + time, 0);
            this.#averageFrameTime = sum / this.#frameTimes.length;
            this.#averageFPS = 1000 / this.#averageFrameTime;
        }
    }

    /**
     * Checks for performance issues and logs warnings
     * @private
     */
    #checkPerformanceWarnings() {
        // Check for low FPS
        if (this.#currentFPS < this.#fpsWarningThreshold && !this.#lowFpsWarningLogged) {
            console.warn(
                `[PerformanceMonitor] Low FPS detected: ${this.#currentFPS.toFixed(1)} ` +
                `(< ${this.#fpsWarningThreshold}). Consider reducing quality settings.`
            );
            this.#lowFpsWarningLogged = true;
        } else if (this.#currentFPS >= this.#fpsWarningThreshold + 5) {
            // Reset warning once performance improves significantly
            this.#lowFpsWarningLogged = false;
        }

        // Check for high frame time
        if (this.#lastFrameTime > this.#frameTimeWarningThreshold && !this.#highFrameTimeWarningLogged) {
            console.warn(
                `[PerformanceMonitor] High frame time: ${this.#lastFrameTime.toFixed(2)}ms ` +
                `(> ${this.#frameTimeWarningThreshold}ms for ${this.#targetFPS} FPS).`
            );
            this.#highFrameTimeWarningLogged = true;
        } else if (this.#lastFrameTime <= this.#frameTimeWarningThreshold - 2) {
            // Reset warning once frame time improves
            this.#highFrameTimeWarningLogged = false;
        }
    }

    /**
     * Gets memory usage information if available
     * @private
     * @returns {Object|null} Memory usage object or null if unavailable
     */
    #getMemoryUsage() {
        if (performance && performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            return {
                usedBytes: used,
                limitBytes: limit,
                usedMB: Math.round(used / (1024 * 1024)),
                limitMB: Math.round(limit / (1024 * 1024)),
                percentUsed: Math.round((used / limit) * 100 * 10) / 10
            };
        }
        return null;
    }

    // =========================================================================
    // Private Fields
    // =========================================================================

    #fpsWarningThreshold;
    #fpsQualityIncreaseThreshold;
    #frameTimeWarningThreshold;
    #rollingAverageFrames;
    #targetFPS;

    #frameTimes;
    #currentFPS;
    #averageFPS;
    #lastFrameTime;
    #averageFrameTime;
    #frameStartTime;
    #frameCount;

    #lowFpsWarningLogged;
    #highFrameTimeWarningLogged;
}

export default PerformanceMonitor;