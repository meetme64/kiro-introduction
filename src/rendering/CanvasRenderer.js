/**
 * CanvasRenderer - Handles all 2D rendering for Flappy Kiro
 * Manages HTML5 Canvas context, drawing operations, and responsive sizing
 */
class CanvasRenderer {
    /**
     * Creates a new CanvasRenderer instance
     * @param {HTMLElement} containerElement - DOM element to append canvas to
     * @param {Object} config - Configuration object with canvas settings
     * @param {number} config.baseWidth - Base canvas width in pixels
     * @param {number} config.baseHeight - Base canvas height in pixels
     * @param {number} config.maxWidth - Maximum canvas width for responsive sizing
     * @param {number} config.maxHeight - Maximum canvas height for responsive sizing
     * @param {string} config.skyColor - Background color hex code
     */
    constructor(containerElement, config) {
        this._container = containerElement;
        this._config = config;

        // If an existing <canvas> element was passed directly (e.g. a
        // canvas already declared in the page markup), adopt it instead
        // of creating and appending a brand new one into itself.
        const adoptExisting = Boolean(
            containerElement && typeof containerElement.getContext === 'function'
        );

        /** @type {HTMLCanvasElement} */
        this._canvas = adoptExisting ? containerElement : document.createElement('canvas');
        /** @type {CanvasRenderingContext2D} */
        this._ctx = this._canvas.getContext('2d');

        this._scaleX = 1;
        this._scaleY = 1;

        this._initializeCanvas(adoptExisting);
    }

    /**
     * Initializes the canvas element with base dimensions
     * @private
     * @param {boolean} [adopted=false] - True when an existing canvas was adopted
     */
    _initializeCanvas(adopted = false) {
        const { baseWidth, baseHeight } = this._config;
        this._canvas.width = baseWidth;
        this._canvas.height = baseHeight;
        this._canvas.style.display = 'block';
        this._canvas.style.imageRendering = 'pixelated';

        if (!adopted) {
            this._container.appendChild(this._canvas);
        }
    }

    /**
     * Clears the canvas with the sky-blue background color
     */
    clear() {
        const { skyColor } = this._config;
        this._ctx.fillStyle = skyColor;
        this._ctx.fillRect(0, 0, this._width, this._height);
    }

    /**
     * Draws a sprite image with optional rotation
     * @param {HTMLImageElement} image - The image to draw
     * @param {number} x - X coordinate of the sprite center
     * @param {number} y - Y coordinate of the sprite center
     * @param {number} width - Width of the sprite
     * @param {number} height - Height of the sprite
     * @param {number} [rotation=0] - Rotation angle in degrees
     */
    drawSprite(image, x, y, width, height, rotation = 0) {
        const ctx = this._ctx;

        if (rotation === 0) {
            // Fast path for non-rotated sprites
            ctx.drawImage(
                image,
                x - width / 2,
                y - height / 2,
                width,
                height
            );
        } else {
            // Rotated sprite rendering
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this._degreesToRadians(rotation));
            ctx.drawImage(
                image,
                -width / 2,
                -height / 2,
                width,
                height
            );
            ctx.restore();
        }
    }

    /**
     * Draws text with retro font styling (white fill with black stroke)
     * @param {string} text - The text to display
     * @param {number} x - X coordinate for text placement
     * @param {number} y - Y coordinate for text placement
     * @param {string} font - CSS font specification (e.g., "24px 'Press Start 2P', monospace")
     * @param {string} color - Fill color for the text
     * @param {string} [align='center'] - Text alignment ('left', 'center', 'right')
     */
    drawText(text, x, y, font, color, align = 'center') {
        const ctx = this._ctx;

        // Set up text styles
        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

        // Draw stroke outline first (for visibility)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);

        // Draw fill on top
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }

    /**
     * Draws a filled rectangle
     * @param {number} x - X coordinate of the top-left corner
     * @param {number} y - Y coordinate of the top-left corner
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle
     * @param {string} color - Fill color (hex code or color name)
     */
    drawRectangle(x, y, width, height, color) {
        this._ctx.fillStyle = color;
        this._ctx.fillRect(x, y, width, height);
    }

    /**
     * Draws a rectangle with optional fill and stroke
     * @param {number} x - X coordinate of the top-left corner
     * @param {number} y - Y coordinate of the top-left corner
     * @param {number} width - Width of the rectangle
     * @param {number} height - Height of the rectangle
     * @param {string} fillColor - Fill color (hex code or color name)
     * @param {string} strokeColor - Stroke color (hex code or color name)
     * @param {number} lineWidth - Width of the stroke line
     */
    drawOutlinedRectangle(x, y, width, height, fillColor, strokeColor, lineWidth) {
        const ctx = this._ctx;

        // Fill the rectangle
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, width, height);
        }

        // Draw the stroke
        if (strokeColor && lineWidth > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.strokeRect(x, y, width, height);
        }
    }

    /**
     * Returns the current canvas dimensions
     * @returns {{width: number, height: number}} Object containing width and height
     */
    getDimensions() {
        return {
            width: this._width,
            height: this._height
        };
    }

    /**
     * Resizes the canvas to new dimensions within max constraints
     * @param {number} newWidth - Requested width
     * @param {number} newHeight - Requested height
     */
    resize(newWidth, newHeight) {
        const { maxWidth, maxHeight } = this._config;

        // Clamp to maximum dimensions
        const clampedWidth = Math.min(newWidth, maxWidth);
        const clampedHeight = Math.min(newHeight, maxHeight);

        // Update canvas internal dimensions
        this._canvas.width = clampedWidth;
        this._canvas.height = clampedHeight;

        // Re-apply image rendering quality
        this._canvas.style.imageRendering = 'pixelated';

        // Ensure canvas display size matches internal size
        this._canvas.style.width = `${clampedWidth}px`;
        this._canvas.style.height = `${clampedHeight}px`;
    }

    /**
     * Sets the render scale for high DPI displays
     * @param {number} scaleX - Horizontal scale factor
     * @param {number} scaleY - Vertical scale factor
     */
    setScale(scaleX, scaleY) {
        this._scaleX = scaleX;
        this._scaleY = scaleY;

        // Apply scale to canvas CSS for high DPI rendering
        if (scaleX !== 1 || scaleY !== 1) {
            this._canvas.style.width = `${this._width / scaleX}px`;
            this._canvas.style.height = `${this._height / scaleY}px`;
        } else {
            // Reset to default dimensions when scale is 1
            this._canvas.style.width = `${this._width}px`;
            this._canvas.style.height = `${this._height}px`;
        }
    }

    /**
     * Converts degrees to radians for canvas rotation
     * @private
     * @param {number} degrees - Angle in degrees
     * @returns {number} Angle in radians
     */
    _degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Gets the internal canvas element
     * @returns {HTMLCanvasElement} The canvas element
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * Gets the 2D rendering context
     * @returns {CanvasRenderingContext2D} The canvas context
     */
    get context() {
        return this._ctx;
    }

    /**
     * Alias for `context`. Some callers (e.g. LaserSystem, Cape) are
     * written against a raw CanvasRenderingContext2D and expect a
     * short `.ctx` accessor rather than `.context`.
     * @returns {CanvasRenderingContext2D} The canvas context
     */
    get ctx() {
        return this._ctx;
    }

    /**
     * Draws all active parallax clouds as semi-transparent rounded shapes.
     * @param {Array<{x: number, y: number, width: number, height: number}>} clouds
     */
    drawClouds(clouds) {
        if (!clouds || clouds.length === 0) return;

        const ctx = this._ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        for (const cloud of clouds) {
            const x = cloud.x;
            const y = cloud.y;
            const w = cloud.width;
            const h = cloud.height;

            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(x, y, w, h, h / 2);
            } else {
                ctx.rect(x, y, w, h);
            }
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Draws all active pipe pairs (upper and lower sections with caps).
     * @param {Array<{x: number, width: number, gapPosition: number, gapHeight: number}>} pipes
     */
    drawPipes(pipes) {
        if (!pipes || pipes.length === 0) return;

        const { pipeColor, pipeOutline, pipeOutlineWidth } = this._config;
        const fillColor = pipeColor || '#00AA00';
        const strokeColor = pipeOutline || '#004400';
        const lineWidth = pipeOutlineWidth || 2;
        const canvasHeight = this._height;

        for (const pipe of pipes) {
            const upperHeight = pipe.gapPosition;
            const lowerY = pipe.gapPosition + pipe.gapHeight;
            const lowerHeight = canvasHeight - lowerY;

            this.drawOutlinedRectangle(pipe.x, 0, pipe.width, upperHeight, fillColor, strokeColor, lineWidth);
            this.drawOutlinedRectangle(pipe.x, lowerY, pipe.width, lowerHeight, fillColor, strokeColor, lineWidth);
        }
    }

    /**
     * Draws Kiro at its current position/rotation.
     * Uses the ghosty sprite image when provided, otherwise falls back
     * to a simple placeholder shape so gameplay is never invisible.
     * @param {{x: number, y: number, width: number, height: number, rotation: number}} kiro
     * @param {HTMLImageElement} [image] - Optional preloaded sprite image
     */
    drawKiro(kiro, image) {
        if (!kiro) return;

        const width = kiro.width || 40;
        const height = kiro.height || 40;
        const centerX = kiro.x + width / 2;
        const centerY = kiro.y + height / 2;
        const rotation = kiro.rotation || 0;

        if (image) {
            this.drawSprite(image, centerX, centerY, width, height, rotation);
            return;
        }

        const ctx = this._ctx;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this._degreesToRadians(rotation));
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Draws a semi-transparent black overlay across the whole canvas,
     * used behind the PAUSED text.
     */
    drawPauseOverlay() {
        const ctx = this._ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this._width, this._height);
        ctx.restore();
    }

    /**
     * Gets the current width of the canvas
     * @returns {number} Width in pixels
     */
    get _width() {
        return this._canvas.width;
    }

    /**
     * Gets the current height of the canvas
     * @returns {number} Height in pixels
     */
    get _height() {
        return this._canvas.height;
    }
}

export default CanvasRenderer;