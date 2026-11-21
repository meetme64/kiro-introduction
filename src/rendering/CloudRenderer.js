/**
 * CloudRenderer - Renders cloud background decorations with parallax layering
 * Handles sprite-based and procedural cloud rendering with semi-transparency
 */
class CloudRenderer {
    /**
     * Creates a new CloudRenderer instance
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
     * @param {Object} assetLoader - Asset loader with get() method for images
     * @param {Object} config - Cloud configuration object
     */
    constructor(ctx, assetLoader, config) {
        /** @type {CanvasRenderingContext2D} */
        this._ctx = ctx;
        /** @type {Object} */
        this._assetLoader = assetLoader;
        /** @type {Object} */
        this._config = config;

        /** @type {Map<string, HTMLCanvasElement>|null} */
        this._proceduralCache = null;
    }

    /**
     * Initializes procedural cloud textures for fallback rendering
     * @private
     */
    _initializeProceduralClouds() {
        // Only initialize in browser environment
        if (typeof document === 'undefined') {
            return;
        }

        if (this._proceduralCache) {
            return;
        }

        /** @type {Map<string, HTMLCanvasElement>} */
        this._proceduralCache = new Map();

        // Pre-render a few cloud variations for procedural fallback
        const sizes = ['small', 'medium', 'large'];
        for (const size of sizes) {
            const cloud = this._createProceduralCloud(size);
            this._proceduralCache.set(size, cloud);
        }
    }

    /**
     * Creates a procedural cloud texture
     * @private
     * @param {string} size - Cloud size category
     * @returns {HTMLCanvasElement} Canvas with rendered cloud
     */
    _createProceduralCloud(size) {
        const dimensions = {
            small: { width: 60, height: 30 },
            medium: { width: 100, height: 40 },
            large: { width: 150, height: 50 }
        };

        const { width, height } = dimensions[size];
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw fluffy cloud shape using overlapping circles
        ctx.fillStyle = '#FFFFFF';

        const centerX = width / 2;
        const bottomY = height - 5;

        // Main cloud body (flattened bottom)
        ctx.beginPath();
        ctx.arc(centerX - 25, bottomY - 15, 20, 0, Math.PI * 2);
        ctx.arc(centerX, bottomY - 25, 25, 0, Math.PI * 2);
        ctx.arc(centerX + 25, bottomY - 15, 20, 0, Math.PI * 2);
        ctx.fill();

        // Top puffs
        ctx.beginPath();
        ctx.arc(centerX - 15, bottomY - 35, 18, 0, Math.PI * 2);
        ctx.arc(centerX + 15, bottomY - 35, 18, 0, Math.PI * 2);
        ctx.fill();

        return canvas;
    }

    /**
     * Gets the opacity for a given layer
     * @private
     * @param {string} layer - Layer name (background, midground, foreground)
     * @returns {number} Opacity value (0-1)
     */
    _getLayerOpacity(layer) {
        const layerConfig = this._config.layers?.[layer];
        if (layerConfig && typeof layerConfig.opacity === 'number') {
            return layerConfig.opacity;
        }

        // Fallback opacity values
        const fallbackOpacity = {
            background: 0.5,
            midground: 0.65,
            foreground: 0.8
        };

        return fallbackOpacity[layer] ?? 0.5;
    }

    /**
     * Gets the procedural cloud texture based on width
     * @private
     * @param {number} width - Cloud width
     * @returns {HTMLCanvasElement|null} Procedural cloud texture or null
     */
    _getProceduralTexture(width) {
        // Lazy initialization for browser environment
        if (!this._proceduralCache) {
            this._initializeProceduralClouds();
        }

        if (!this._proceduralCache || this._proceduralCache.size === 0) {
            return null;
        }

        if (width < 80) {
            return this._proceduralCache.get('small');
        } else if (width < 120) {
            return this._proceduralCache.get('medium');
        }
        return this._proceduralCache.get('large');
    }

    /**
     * Sorts clouds by layer for proper render order
     * @private
     * @param {Array<Object>} clouds - Array of cloud objects
     * @returns {Array<Object>} Sorted cloud array
     */
    _sortByLayer(clouds) {
        const layerOrder = ['background', 'midground', 'foreground'];

        return [...clouds].sort((a, b) => {
            const layerA = a.layer || 'background';
            const layerB = b.layer || 'background';
            return layerOrder.indexOf(layerA) - layerOrder.indexOf(layerB);
        });
    }

    /**
     * Gets the sprite image for cloud rendering
     * @private
     * @returns {HTMLImageElement|null} Cloud sprite or null
     */
    _getCloudSprite() {
        if (this._assetLoader && typeof this._assetLoader.get === 'function') {
            return this._assetLoader.get('cloud');
        }
        return null;
    }

    /**
     * Calculates sway offset based on time and cloud properties
     * @private
     * @param {Object} cloud - Cloud object
     * @param {number} time - Total elapsed time in seconds
     * @returns {number} Horizontal sway offset
     */
    _calculateSway(cloud, time) {
        if (!cloud.swaySpeed && cloud.swaySpeed !== 0) {
            // Default sway behavior: slower clouds sway more
            const layerSway = {
                background: 0.0005,
                midground: 0.0003,
                foreground: 0.0001
            };
            cloud.swaySpeed = layerSway[cloud.layer] ?? 0.0003;
        }

        const swayAmount = cloud.swayAmount ?? 10;
        return Math.sin(time * cloud.swaySpeed * 1000) * swayAmount;
    }

    /**
     * Renders a single cloud with optional sprite or procedural fallback
     * @param {Object} cloud - Cloud object with x, y, width, height, layer, rotation, etc.
     * @param {number} [time=0] - Total elapsed time for animation effects
     */
    renderCloud(cloud, time = 0) {
        const ctx = this._ctx;
        const opacity = this._getLayerOpacity(cloud.layer ?? 'background');

        // Apply global alpha for layer-specific transparency
        ctx.globalAlpha = opacity;

        // Calculate render position with optional sway
        const swayOffset = this._calculateSway(cloud, time);
        const renderX = cloud.x + swayOffset;
        const renderY = cloud.y;

        // Get rotation (optional feature)
        const rotation = cloud.rotation ?? 0;

        // Try sprite-based rendering first
        const sprite = this._getCloudSprite();
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            this._renderSpriteCloud(sprite, renderX, renderY, cloud.width, cloud.height, rotation);
        } else {
            // Fallback to procedural rendering
            this._renderProceduralCloud(cloud, renderX, renderY, rotation);
        }

        // Reset alpha
        ctx.globalAlpha = 1;
    }

    /**
     * Renders a cloud using sprite asset
     * @private
     * @param {HTMLImageElement} sprite - Cloud sprite image
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Cloud width
     * @param {number} height - Cloud height
     * @param {number} [rotation=0] - Rotation angle in degrees
     */
    _renderSpriteCloud(sprite, x, y, width, height, rotation = 0) {
        const ctx = this._ctx;

        if (rotation === 0) {
            ctx.drawImage(sprite, x, y, width, height);
        } else {
            const centerX = x + width / 2;
            const centerY = y + height / 2;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
            ctx.restore();
        }
    }

    /**
     * Renders a cloud using procedural fallback
     * @private
     * @param {Object} cloud - Cloud object
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} [rotation=0] - Rotation angle in degrees
     */
    _renderProceduralCloud(cloud, x, y, rotation = 0) {
        const texture = this._getProceduralTexture(cloud.width);
        if (!texture) return;

        const ctx = this._ctx;

        if (rotation === 0) {
            // Stretch texture to match cloud dimensions
            ctx.drawImage(texture, x, y, cloud.width, cloud.height);
        } else {
            const centerX = x + cloud.width / 2;
            const centerY = y + cloud.height / 2;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(texture, -cloud.width / 2, -cloud.height / 2, cloud.width, cloud.height);
            ctx.restore();
        }
    }

    /**
     * Renders all clouds with proper layering and transparency
     * @param {Array<Object>} clouds - Array of cloud objects from CloudManager
     * @param {number} [time=0] - Total elapsed time in seconds for animation effects
     */
    render(clouds, time = 0) {
        if (!clouds || clouds.length === 0) {
            return;
        }

        // Sort clouds by layer for proper render order
        const sortedClouds = this._sortByLayer(clouds);

        // Render each cloud
        for (const cloud of sortedClouds) {
            this.renderCloud(cloud, time);
        }
    }

    /**
     * Clears the procedural cloud texture cache
     */
    dispose() {
        if (this._proceduralCache) {
            for (const canvas of this._proceduralCache.values()) {
                if (typeof canvas !== 'undefined') {
                    canvas.width = 0;
                    canvas.height = 0;
                }
            }
            this._proceduralCache.clear();
        }
    }
}

export default CloudRenderer;