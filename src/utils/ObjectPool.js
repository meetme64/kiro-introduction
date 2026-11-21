/**
 * ObjectPool - Generic object pool for performance optimization
 * Recycles objects to reduce garbage collection pauses during gameplay
 *
 * @example
 * const pipePool = new ObjectPool(
 *   () => ({ x: 0, y: 0, width: 60, height: 100 }),
 *   10,
 *   30
 * );
 *
 * const pipe = pipePool.acquire();
 * // ... use pipe ...
 * pipePool.release(pipe);
 */
class ObjectPool {
    #factory;
    #maxSize;
    #pool;

    /**
     * Creates a new ObjectPool instance
     * @param {Function} factory - Factory function to create new instances
     * @param {number} [initialSize=10] - Number of objects to pre-allocate
     * @param {number} [maxSize=50] - Maximum number of objects in pool
     */
    constructor(factory, initialSize = 10, maxSize = 50) {
        if (typeof factory !== 'function') {
            throw new TypeError('ObjectPool factory must be a function');
        }

        this.#factory = factory;
        this.#maxSize = maxSize;
        this.#pool = [];

        // Pre-allocate initial objects
        for (let i = 0; i < initialSize; i++) {
            this.#pool.push({
                instance: factory(),
                active: false,
                lastUsed: Date.now()
            });
        }
    }

    /**
     * Acquires an object from the pool
     * Reuses inactive objects first, creates new if under maxSize,
     * or recycles least recently used if at capacity
     * @returns {*} The acquired object instance
     */
    acquire() {
        // Find first inactive object
        for (const item of this.#pool) {
            if (!item.active) {
                item.active = true;
                item.lastUsed = Date.now();
                return item.instance;
            }
        }

        // Create new object if under max size
        if (this.#pool.length < this.#maxSize) {
            const instance = this.#factory();
            this.#pool.push({
                instance,
                active: true,
                lastUsed: Date.now()
            });
            return instance;
        }

        // Recycle least recently used object (oldest first in pool)
        // Pool is ordered oldest to newest, so shift from front
        const oldest = this.#pool.shift();
        oldest.active = true;
        oldest.lastUsed = Date.now();
        this.#pool.push(oldest);
        return oldest.instance;
    }

    /**
     * Returns an object to the pool for reuse
     * @param {*} instance - The object instance to release
     */
    release(instance) {
        const item = this.#pool.find(item => item.instance === instance);
        if (item) {
            item.active = false;
            item.lastUsed = Date.now();
        }
    }

    /**
     * Releases all active objects back to the pool
     */
    releaseAll() {
        for (const item of this.#pool) {
            item.active = false;
            item.lastUsed = Date.now();
        }
    }

    /**
     * Gets the number of currently active objects
     * @returns {number} Count of active objects in use
     */
    getActiveCount() {
        let count = 0;
        for (const item of this.#pool) {
            if (item.active) count++;
        }
        return count;
    }

    /**
     * Gets the total number of objects in the pool
     * @returns {number} Total objects (active + inactive)
     */
    getPoolSize() {
        return this.#pool.length;
    }

    /**
     * Clears the pool completely, removing all objects
     */
    clear() {
        this.#pool.length = 0;
    }

    /**
     * Gets pool statistics for debugging/monitoring
     * @returns {Object} Pool statistics
     */
    getStats() {
        return {
            active: this.getActiveCount(),
            total: this.getPoolSize(),
            maxSize: this.#maxSize,
            utilizationPercent: ((this.getActiveCount() / this.getPoolSize()) * 100).toFixed(1)
        };
    }
}

export default ObjectPool;