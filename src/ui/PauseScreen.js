/**
 * PauseScreen - Pause overlay with game state preservation
 * Renders semi-transparent overlay and pause text while preserving underlying game state
 */
class PauseScreen {
    /**
     * Creates a new PauseScreen instance
     * @param {CanvasRenderer} renderer - The canvas renderer for drawing operations
     */
    constructor(renderer) {
        /** @type {CanvasRenderer} */
        this._renderer = renderer;
        this._isVisible = false;
    }

    /**
     * Prepares the pause overlay for display
     */
    show() {
        this._isVisible = true;
    }

    /**
     * Cleans up the pause overlay
     */
    hide() {
        this._isVisible = false;
    }

    /**
     * Draws the pause overlay and text
     * Should be called after the underlying game state has been rendered
     */
    render() {
        if (!this._isVisible) {
            return;
        }

        const { width, height } = this._renderer.getDimensions();
        const ctx = this._renderer.context;

        // Draw semi-transparent black overlay (50% opacity)
        ctx.save();
        ctx.globalAlpha = 0.5;
        this._renderer.drawRectangle(0, 0, width, height, '#000000');
        ctx.restore();

        // Draw "PAUSED" title text - 48px retro font, centered
        this._renderer.drawText(
            'PAUSED',
            width / 2,
            height / 2 - 30,
            '48px "Press Start 2P", monospace',
            '#FFFFFF'
        );

        // Draw "Press P to Resume" instruction - 24px font, centered below title
        this._renderer.drawText(
            'Press P to Resume',
            width / 2,
            height / 2 + 40,
            '24px "Press Start 2P", monospace',
            '#FFFFFF'
        );
    }

    /**
     * Checks if the pause screen is currently visible
     * @returns {boolean} True if the pause screen is visible
     */
    get isVisible() {
        return this._isVisible;
    }
}

export default PauseScreen;