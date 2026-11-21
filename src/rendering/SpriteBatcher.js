/**
 * SpriteBatcher - Optimizes rendering by batching similar draw operations
 * Groups render operations by layer to minimize canvas state changes
 * Pre-renders static elements to off-screen canvases for performance
 */
class SpriteBatcher {
    /**
     * Creates a new SpriteBatcher instance
     * @param {CanvasRenderer} renderer - The canvas renderer to use for drawing
     */
    constructor(renderer) {
        /** @type {CanvasRenderer} */
        this._renderer = renderer;
        
        /** @type {CanvasRenderingContext2D} */
        this._ctx = renderer.context;
        
        /** @type {Map<string, RenderBatch>} */
        this._batches = new Map();
        
        /** @type {string|null} */
        this._currentLayer = null;
        
        /** @type {RenderBatch|null} */
        this._currentBatch = null;
        
        /** @type {Map<string, HTMLCanvasElement>} */
        this._cachedCanvases = new Map();
        
        /** @type {ObjectPool} */
        this._spritePool = new ObjectPool(() => ({
            image: null,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rotation: 0
        }), 50);
        
        /** @type {ObjectPool} */
        this._rectPool = new ObjectPool(() => ({
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            color: '#000000'
        }), 50);
        
        this._initializeBatches();
    }

    /**
     * Initializes batch containers for all render layers
     * @private
     */
    _initializeBatches() {
        for (const layer of Object.values(BATCH_LAYERS)) {
            this._batches.set(layer, {
                sprites: [],
                rectangles: []
            });
        }
    }

    /**
     * Starts a new batch for the specified layer
     * @param {string} layer - The layer name from BATCH_LAYERS
     * @returns {void}
     * @throws {Error} If invalid layer is provided
     */
    beginBatch(layer) {
        if (!Object.values(BATCH_LAYERS).includes(layer)) {
            throw new Error(`Invalid batch layer: ${layer}`);
        }
        
        this._currentLayer = layer;
        this._currentBatch = this._batches.get(layer);
    }

    /**
     * Adds a sprite to the current batch
     * @param {HTMLImageElement} image - The image to draw
     * @param {number} x - X coordinate of the sprite center
     * @param {number} y - Y coordinate of the sprite center
     * @param {number} width - Width of the sprite
     * @param {number} height - Height of the sprite
     * @param {number} [rotation=0] - Rotation angle in degrees
     * @returns {void}
     */
    addSprite(image, x, y, width, height, rotation = 0) {
        if (!this._currentBatch) {
            console.warn('No active batch. Call beginBatch() first.');
            return;
        }
        
        const sprite = this._spritePool.acquire();
        sprite.image = image;
        sprite.x = x;
        sprite.y = y;
        sprite.width = width;
        sprite.height = height;
        sprite.rotation = rotation;
        
        this._currentBatch.sprites.push(sprite);
    }

    /**
     * Adds a rectangle to the current batch
     * @param {number} x - X coordinate of the top-left corner
     * @param {number} y - Y coordinate of the top-left corner
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle
     * @param {string} color - Fill color (hex code or color name)
     * @returns {void}
     */
    addRectangle(x, y, width, height, color) {
        if (!this._currentBatch) {
            console.warn('No active batch. Call beginBatch() first.');
            return;
        }
        
        const rect = this._rectPool.acquire();
        rect.x = x;
        rect.y = y;
        rect.width = width;
        rect.height = height;
        rect.color = color;
        
        this._currentBatch.rectangles.push(rect);
    }

    /**
     * Renders all items in the current batch and clears it
     * @returns {void}
     */
    endBatch() {
        if (!this._currentBatch) {
            return;
        }
        
        this._renderBatch(this._currentBatch);
        this._clearBatch(this._currentLayer);
        
        this._currentLayer = null;
        this._currentBatch = null;
    }

    /**
     * Renders a complete batch of items
     * @param {string} layer - The layer name to render
     * @param {Object} items - Object containing sprites and rectangles arrays
     * @returns {void}
     */
    renderBatch(layer, items) {
        const batch = this._batches.get(layer);
        if (!batch) {
            return;
        }
        
        // Copy items to batch
        for (const sprite of items.sprites || []) {
            const pooled = this._spritePool.acquire();
            Object.assign(pooled, sprite);
            batch.sprites.push(pooled);
        }
        
        for (const rect of items.rectangles || []) {
            const pooled = this._rectPool.acquire();
            Object.assign(pooled, rect);
            batch.rectangles.push(pooled);
        }
        
        this._renderBatch(batch);
        this._clearBatch(layer);
    }

    /**
     * Renders all sprites and rectangles in a batch
     * Groups by fillStyle/image to minimize context state changes
     * @private
     * @param {RenderBatch} batch - The batch to render
     * @returns {void}
     */
    _renderBatch(batch) {
        // Render rectangles first (background elements)
        this._renderRectangleBatch(batch.rectangles);
        
        // Render sprites
        this._renderSpriteBatch(batch.sprites);
    }

    /**
     * Renders a batch of rectangles, grouped by color
     * @private
     * @param {Array} rectangles - Array of rectangle objects
     * @returns {void}
     */
    _renderRectangleBatch(rectangles) {
        if (rectangles.length === 0) {
            return;
        }
        
        // Group rectangles by color for efficient rendering
        const byColor = new Map();
        for (const rect of rectangles) {
            if (!byColor.has(rect.color)) {
                byColor.set(rect.color, []);
            }
            byColor.get(rect.color).push(rect);
        }
        
        // Render each color group with minimal context changes
        for (const [color, rects] of byColor) {
            this._ctx.fillStyle = color;
            for (const rect of rects) {
                this._ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            }
        }
    }

    /**
     * Renders a batch of sprites with optimized state changes
     * @private
     * @param {Array} sprites - Array of sprite objects
     * @returns {void}
     */
    _renderSpriteBatch(sprites) {
        for (const sprite of sprites) {
            this._renderSprite(sprite);
        }
    }

    /**
     * Renders a single sprite
     * @private
     * @param {Object} sprite - Sprite object with image, x, y, width, height, rotation
     * @returns {void}
     */
    _renderSprite(sprite) {
        const { image, x, y, width, height, rotation } = sprite;
        
        if (!image) {
            return;
        }
        
        if (rotation === 0) {
            // Fast path for non-rotated sprites
            this._ctx.drawImage(
                image,
                x - width / 2,
                y - height / 2,
                width,
                height
            );
        } else {
            // Rotated sprite rendering
            this._ctx.save();
            this._ctx.translate(x, y);
            this._ctx.rotate(rotation * (Math.PI / 180));
            this._ctx.drawImage(
                image,
                -width / 2,
                -height / 2,
                width,
                height
            );
            this._ctx.restore();
        }
    }

    /**
     * Clears a batch and returns items to pools
     * @private
     * @param {string} layer - The layer name to clear
     * @returns {void}
     */
    _clearBatch(layer) {
        const batch = this._batches.get(layer);
        if (!batch) {
            return;
        }
        
        // Return sprites to pool
        for (const sprite of batch.sprites) {
            this._spritePool.release(sprite);
        }
        batch.sprites.length = 0;
        
        // Return rectangles to pool
        for (const rect of batch.rectangles) {
            this._rectPool.release(rect);
        }
        batch.rectangles.length = 0;
    }

    /**
     * Pre-renders a static element to an off-screen canvas
     * @param {string} key - Unique key for caching
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {function} renderFn - Function that draws to the canvas
     * @returns {HTMLCanvasElement} The cached canvas
     */
    preRenderToCache(key, width, height, renderFn) {
        let cached = this._cachedCanvases.get(key);
        
        if (!cached || cached.width !== width || cached.height !== height) {
            cached = document.createElement('canvas');
            cached.width = width;
            cached.height = height;
            this._cachedCanvases.set(key, cached);
            
            const ctx = cached.getContext('2d');
            renderFn(ctx, width, height);
        }
        
        return cached;
    }

    /**
     * Renders a cached canvas element
     * @param {string} key - The cache key
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {void}
     */
    renderCached(key, x, y) {
        const cached = this._cachedCanvases.get(key);
        if (cached) {
            this._ctx.drawImage(cached, x, y);
        }
    }

    /**
     * Clears all cached canvases
     * @returns {void}
     */
    clearCache() {
        this._cachedCanvases.clear();
    }

    /**
     * Gets statistics about current batch state
     * @returns {Object} Batch statistics
     */
    getStats() {
        const stats = {
            layers: {},
            totalSprites: 0,
            totalRectangles: 0,
            cachedCanvases: this._cachedCanvases.size
        };
        
        for (const [layer, batch] of this._batches) {
            stats.layers[layer] = {
                sprites: batch.sprites.length,
                rectangles: batch.rectangles.length
            };
            stats.totalSprites += batch.sprites.length;
            stats.totalRectangles += batch.rectangles.length;
        }
        
        return stats;
    }

    /**
     * Clears all batches and returns items to pools
     * @returns {void}
     */
    clearAllBatches() {
        for (const layer of Object.values(BATCH_LAYERS)) {
            this._clearBatch(layer);
        }
        
        this._currentLayer = null;
        this._currentBatch = null;
    }

    /**
     * Pre-renders pipe segments to an off-screen canvas for efficient reuse
     * @param {string} color - Pipe fill color
     * @param {string} outlineColor - Pipe outline color
     * @param {number} pipeWidth - Width of pipe
     * @param {number} height - Canvas height
     * @param {number} outlineWidth - Outline width
     * @returns {HTMLCanvasElement} The cached pipe canvas
     */
    preRenderPipeSegment(color, outlineColor, pipeWidth, height, outlineWidth = 2) {
        const key = `pipe_${color}_${outlineColor}_${pipeWidth}_${height}`;
        
        return this.preRenderToCache(key, pipeWidth, height, (ctx, w, h) => {
            // Fill pipe body
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, w, h);
            
            // Draw outline
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = outlineWidth;
            ctx.lineJoin = 'round';
            ctx.strokeRect(0, 0, w, h);
        });
    }

    /**
     * Pre-renders a cloud segment for parallax layers
     * @param {string} color - Cloud fill color
     * @param {number} width - Cloud width
     * @param {number} height - Cloud height
     * @returns {HTMLCanvasElement} The cached cloud canvas
     */
    preRenderCloudSegment(color, width, height) {
        const key = `cloud_${color}_${width}_${height}`;
        
        return this.preRenderToCache(key, width, height, (ctx, w, h) => {
            // Draw cloud as overlapping circles for fluffy appearance
            ctx.fillStyle = color;
            
            const centerY = h / 2;
            const circleRadius = h / 2;
            
            // Main circle
            ctx.beginPath();
            ctx.arc(w / 2, centerY, circleRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Left circle
            ctx.beginPath();
            ctx.arc(circleRadius * 0.6, centerY, circleRadius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            // Right circle
            ctx.beginPath();
            ctx.arc(w - circleRadius * 0.6, centerY, circleRadius * 0.7, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Pre-renders the sky background
     * @param {string} color - Background color
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {HTMLCanvasElement} The cached sky canvas
     */
    preRenderSky(color, width, height) {
        const key = `sky_${color}_${width}_${height}`;
        
        return this.preRenderToCache(key, width, height, (ctx, w, h) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, w, h);
        });
    }

    /**
     * Pre-renders a UI panel background
     * @param {string} key - Unique cache key
     * @param {number} width - Panel width
     * @param {number} height - Panel height
     * @param {string} bgColor - Background color
     * @param {string} borderColor - Border color
     * @param {number} borderWidth - Border width
     * @returns {HTMLCanvasElement} The cached panel canvas
     */
    preRenderPanel(key, width, height, bgColor, borderColor, borderWidth = 2) {
        const cacheKey = `panel_${key}_${width}_${height}_${bgColor}_${borderColor}`;
        
        return this.preRenderToCache(cacheKey, width, height, (ctx, w, h) => {
            // Semi-transparent background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, w, h);
            
            // Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.lineJoin = 'round';
            ctx.strokeRect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth);
        });
    }
}

/**
 * Batch layer constants defining render order
 * Rendered from first to last (back to front)
 */
export const BATCH_LAYERS = Object.freeze({
    /** Background color layer */
    SKY: 'SKY',
    
    /** Background parallax clouds */
    CLOUDS_BACKGROUND: 'CLOUDS_BACKGROUND',
    
    /** Midground parallax clouds */
    CLOUDS_MIDGROUND: 'CLOUDS_MIDGROUND',
    
    /** Pipe obstacles */
    PIPES: 'PIPES',
    
    /** Foreground parallax clouds */
    CLOUDS_FOREGROUND: 'CLOUDS_FOREGROUND',
    
    /** Player character */
    KIRO: 'KIRO',
    
    /** Score and HUD elements */
    UI: 'UI',
    
    /** Pause and game over overlays */
    OVERLAY: 'OVERLAY'
});

/**
 * Render order for proper layering
 * Elements earlier in array are drawn first (behind)
 */
export const RENDER_ORDER = [
    BATCH_LAYERS.SKY,
    BATCH_LAYERS.CLOUDS_BACKGROUND,
    BATCH_LAYERS.PIPES,
    BATCH_LAYERS.CLOUDS_MIDGROUND,
    BATCH_LAYERS.KIRO,
    BATCH_LAYERS.CLOUDS_FOREGROUND,
    BATCH_LAYERS.UI,
    BATCH_LAYERS.OVERLAY
];

/**
 * Default render batch structure
 * @typedef {Object} RenderBatch
 * @property {Array} sprites - Array of sprite objects
 * @property {Array} rectangles - Array of rectangle objects
 */

export default SpriteBatcher;