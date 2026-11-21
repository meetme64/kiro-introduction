/**
 * PlayingHUD.js - In-game rendering for gameplay elements
 * 
 * Renders Kiro, pipes, clouds, and score during gameplay.
 * Provides high-performance canvas rendering with proper z-ordering.
 */

import { VISUAL } from '../config.js';

/**
 * PlayingHUD - Renders all gameplay elements during PLAYING state
 * Handles rendering order: clouds → pipes → Kiro → score
 */
class PlayingHUD {
    /**
     * Creates a new PlayingHUD instance
     * @param {CanvasRenderer} renderer - The canvas renderer instance
     * @param {Object} [config] - Optional configuration overrides
     */
    constructor(renderer, config = {}) {
        /** @type {CanvasRenderer} */
        this._renderer = renderer;
        
        // Configuration with defaults
        this._config = {
            pipeColor: config.pipeColor || VISUAL.pipeColor,
            pipeOutline: config.pipeOutline || VISUAL.pipeOutline,
            pipeOutlineWidth: config.pipeOutlineWidth || VISUAL.pipeOutlineWidth,
            scoreFont: config.scoreFont || VISUAL.scoreFont,
            scoreColor: config.scoreColor || VISUAL.textColor,
            scoreOutline: config.scoreOutline || VISUAL.textOutline,
            pauseFont: config.pauseFont || VISUAL.textFont,
            pauseColor: config.pauseColor || VISUAL.textColor,
            pauseOutline: config.pauseOutline || VISUAL.textOutline
        };
    }

    // =========================================================================
    // Main Render Methods
    // =========================================================================

    /**
     * Renders all gameplay elements in correct z-order
     * @param {Kiro} kiro - The Kiro entity instance
     * @param {Array} pipes - Array of pipe objects from PipeManager
     * @param {Array} clouds - Array of cloud objects from CloudManager
     * @param {number} score - Current score value
     * @param {boolean} [isPaused=false] - Whether the game is paused
     */
    render(kiro, pipes, clouds, score, isPaused = false) {
        // Clear canvas with sky background
        this._renderer.clear();

        // Render in z-order (background to foreground)
        this._renderClouds(clouds);
        this._renderPipes(pipes);
        this._renderKiro(kiro);
        this._renderScore(score);

        // Optional pause indicator
        if (isPaused) {
            this._renderPauseIndicator();
        }
    }

    /**
     * Renders the score display in top-center position
     * Uses retro font styling with white fill and black outline
     * @param {number} score - Current score value to display
     */
    _renderScore(score) {
        const { width } = this._renderer.getDimensions();
        const formattedScore = String(score).padStart(5, '0');

        // Position at top-center of canvas
        const x = width / 2;
        const y = 60;

        this._renderer.drawText(
            formattedScore,
            x,
            y,
            this._config.scoreFont,
            this._config.scoreColor
        );
    }

    /**
     * Renders pause indicator when game is paused
     * Displays a small "PAUSED" text indicator
     * @private
     */
    _renderPauseIndicator() {
        const { width, height } = this._renderer.getDimensions();

        // Draw semi-transparent overlay
        const ctx = this._renderer.context;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // Draw "PAUSED" text
        this._renderer.drawText(
            'PAUSED',
            width / 2,
            height / 2,
            this._config.pauseFont,
            this._config.pauseColor
        );
    }

    // =========================================================================
    // Entity Render Methods
    // =========================================================================

    /**
     * Renders all clouds in the background layer
     * Clouds are rendered before other game elements
     * @param {Array} clouds - Array of cloud objects
     * @private
     */
    _renderClouds(clouds) {
        for (const cloud of clouds) {
            this._renderCloud(cloud);
        }
    }

    /**
     * Renders a single cloud
     * @param {Object} cloud - Cloud object with x, y, width, height
     * @private
     */
    _renderCloud(cloud) {
        // Cloud body - white rounded rectangles
        const ctx = this._renderer.context;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 2;

        // Draw cloud as overlapping circles for organic shape
        const centerX = cloud.x + cloud.width / 2;
        const centerY = cloud.y + cloud.height / 2;
        const radius = cloud.height / 2;

        // Main cloud body
        this._drawCloudShape(centerX, centerY, radius);
    }

    /**
     * Draws a cloud shape using multiple circles
     * @param {number} centerX - X center position
     * @param {number} centerY - Y center position
     * @param {number} radius - Base radius
     * @private
     */
    _drawCloudShape(centerX, centerY, radius) {
        const ctx = this._renderer.context;

        // Draw three overlapping circles for cloud shape
        const positions = [
            { x: centerX - radius * 0.5, y: centerY },
            { x: centerX, y: centerY - radius * 0.3 },
            { x: centerX + radius * 0.5, y: centerY }
        ];

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (const pos of positions) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stroke around cloud shape
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.5, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Renders all pipe obstacles
     * Pipes are green with black outline per spec
     * @param {Array} pipes - Array of pipe objects
     * @private
     */
    _renderPipes(pipes) {
        for (const pipe of pipes) {
            this._renderPipe(pipe);
        }
    }

    /**
     * Renders a single pipe pair (upper and lower segments)
     * @param {Object} pipe - Pipe object with x, width, gapPosition, gapHeight
     * @private
     */
    _renderPipe(pipe) {
        const { width: canvasWidth, height: canvasHeight } = this._renderer.getDimensions();

        // Upper pipe segment (from top to gap start)
        const upperHeight = pipe.gapPosition;
        this._renderPipeSegment(pipe.x, 0, pipe.width, upperHeight);

        // Lower pipe segment (from gap end to bottom)
        const lowerY = pipe.gapPosition + pipe.gapHeight;
        const lowerHeight = canvasHeight - lowerY;
        this._renderPipeSegment(pipe.x, lowerY, pipe.width, lowerHeight);

        // Render pipe cap (optional detail at gap edges)
        this._renderPipeCap(pipe.x, pipe.gapPosition, pipe.width);
        this._renderPipeCap(pipe.x, pipe.gapPosition + pipe.gapHeight, pipe.width);
    }

    /**
     * Renders a single pipe segment with fill and outline
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Pipe width
     * @param {number} height - Pipe height
     * @private
     */
    _renderPipeSegment(x, y, width, height) {
        if (height <= 0) return;

        this._renderer.drawOutlinedRectangle(
            x,
            y,
            width,
            height,
            this._config.pipeColor,
            this._config.pipeOutline,
            this._config.pipeOutlineWidth
        );
    }

    /**
     * Renders a cap at the end of a pipe segment
     * @param {number} x - X position
     * @param {number} y - Y position (edge of gap)
     * @param {number} width - Pipe width
     * @private
     */
    _renderPipeCap(x, y, width) {
        const capHeight = 24;
        const capWidth = width + 8; // Slightly wider than pipe

        // Position cap centered on the gap edge
        const capX = x - 4;
        const capY = y - capHeight / 2;

        this._renderer.drawOutlinedRectangle(
            capX,
            capY,
            capWidth,
            capHeight,
            this._config.pipeColor,
            this._config.pipeOutline,
            this._config.pipeOutlineWidth
        );
    }

    /**
     * Renders the Kiro character sprite
     * Applies rotation based on velocity
     * @param {Kiro} kiro - The Kiro entity
     * @private
     */
    _renderKiro(kiro) {
        const position = kiro.getPosition();
        const rotation = kiro.getRotation();
        const opacity = kiro.getOpacity();

        // Get sprite from asset loader if available
        const sprite = this._getKiroSprite(kiro);

        if (sprite) {
            // Apply opacity for death animation
            if (opacity < 1.0) {
                this._renderer.context.globalAlpha = opacity;
            }

            // Draw sprite with rotation
            this._renderer.drawSprite(
                sprite,
                position.x + kiro.width / 2,
                position.y + kiro.height / 2,
                kiro.width,
                kiro.height,
                rotation
            );

            // Restore opacity
            if (opacity < 1.0) {
                this._renderer.context.globalAlpha = 1.0;
            }
        } else {
            // Fallback: draw placeholder rectangle if sprite not loaded
            this._renderKiroPlaceholder(position, rotation, opacity);
        }
    }

    /**
     * Gets the current Kiro sprite based on animation state
     * @param {Kiro} kiro - The Kiro entity
     * @returns {HTMLImageElement|null} The sprite image or null
     * @private
     */
    _getKiroSprite(kiro) {
        // Access sprite cache - would be populated by AssetLoader
        // This is a placeholder for the sprite system
        return null;
    }

    /**
     * Renders a placeholder for Kiro when sprite is unavailable
     * @param {Object} position - Position {x, y}
     * @param {number} rotation - Rotation angle in degrees
     * @param {number} opacity - Opacity for death animation
     * @private
     */
    _renderKiroPlaceholder(position, rotation, opacity) {
        const ctx = this._renderer.context;

        ctx.save();
        ctx.translate(position.x + 20, position.y + 20);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.globalAlpha = opacity;

        // Draw body
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(5, -3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw wing
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.ellipse(-5, 3, 8, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// Export as default for convenient importing
export default PlayingHUD;