/**
 * PerformanceMonitor - Monitors game performance metrics
 * Tracks FPS, memory usage, and frame timing
 */
class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.frameTimes = [];
        this.maxFrameTimes = 60;
    }

    update(timestamp) {
        this.frameCount++;

        const now = performance.now();
        const elapsed = now - this.lastFpsUpdate;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }

        // Track frame times
        this.frameTimes.push(now - timestamp);
        if (this.frameTimes.length > this.maxFrameTimes) {
            this.frameTimes.shift();
        }
    }

    getFPS() {
        return this.fps;
    }

    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }

    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        }
        return null;
    }

    shouldReduceQuality() {
        const memory = this.getMemoryUsage();
        return memory && memory.percent > 80;
    }

    reset() {
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.frameTimes = [];
    }
}