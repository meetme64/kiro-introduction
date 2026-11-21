/**
 * TitleScreen - Main title screen for Flappy Kiro
 * Renders the game title, instructions, and high score display
 * Handles animations for title text and instructions
 */
import { VISUAL } from '../config.js';

class TitleScreen {
    /**
     * Creates a new TitleScreen instance
     * @param {CanvasRenderer} renderer - The canvas renderer for drawing
     * @param {ScoreManager} scoreManager - The score manager for high score data
     */
    constructor(renderer, scoreManager) {
        /** @type {CanvasRenderer} */
        this._renderer = renderer;
        /** @type {ScoreManager} */
        this._scoreManager = scoreManager;

        /** @type {boolean} */
        this._isVisible = false;

        // Animation state
        /** @type {number} */
        this._animationTime = 0;
        /** @type {number} */
        this._pulsePhase = 0;

        // Cached dimensions for positioning
        /** @type {number} */
        this._canvasWidth = 0;
        /** @type {number} */
        this._canvasHeight = 0;

        this._updateDimensions();
    }

    /**
     * Updates cached canvas dimensions
     * @private
     */
    _updateDimensions() {
        const dimensions = this._renderer.getDimensions();
        this._canvasWidth = dimensions.width;
        this._canvasHeight = dimensions.height;
    }

    /**
     * Shows the title screen and prepares it for display
     * Called when transitioning to the TITLE game state
     */
    show() {
        this._isVisible = true;
        this._animationTime = 0;
        this._pulsePhase = 0;
        this._updateDimensions();
    }

    /**
     * Hides the title screen and performs cleanup
     * Called when transitioning away from the TITLE game state
     */
    hide() {
        this._isVisible = false;
    }

    /**
     * Renders all title screen elements
     * Draws title, instructions, and score information
     */
    render() {
        if (!this._isVisible) return;

        this._renderTitle();
        this._renderInstruction();
        this._renderHighScore();
        this._renderLastScore();
    }

    /**
     * Updates animation state for pulsing effects
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        if (!this._isVisible) return;

        this._animationTime += deltaTime;
        this._pulsePhase += deltaTime * Math.PI * 2; // Full cycle every second
    }

    /**
     * Renders the main game title
     * @private
     */
    _renderTitle() {
        const titleY = this._canvasHeight * 0.30;
        const titleColor = VISUAL.textColor;

        // Draw title with floating animation
        const floatOffset = Math.sin(this._animationTime * 2) * 3;

        this._renderer.drawText(
            'Flappy Kiro',
            this._canvasWidth / 2,
            titleY + floatOffset,
            VISUAL.titleFont,
            titleColor
        );
    }

    /**
     * Renders the start instruction with pulsing animation
     * @private
     */
    _renderInstruction() {
        const instructionY = this._canvasHeight * 0.50;

        // Pulsing size effect
        const pulseFactor = 0.5 + 0.5 * Math.sin(this._pulsePhase);
        const baseSize = 24;
        const pulseSize = baseSize + (pulseFactor * 4);

        const font = `${pulseSize}px "Press Start 2P", monospace`;

        this._renderer.drawText(
            'Press SPACE or TAP to Start',
            this._canvasWidth / 2,
            instructionY,
            font,
            VISUAL.textColor
        );
    }

    /**
     * Renders the high score display
     * @private
     */
    _renderHighScore() {
        const highScoreY = this._canvasHeight * 0.70;
        const highScoreText = `Best: ${this._scoreManager.getHighScore()}`;

        this._renderer.drawText(
            highScoreText,
            this._canvasWidth / 2,
            highScoreY,
            VISUAL.textFont,
            VISUAL.highScoreColor
        );
    }

    /**
     * Renders the last session score if available
     * Only shows when there was a previous score greater than 0
     * @private
     */
    _renderLastScore() {
        const lastScore = this._scoreManager.getCurrent();

        // Only show last score if there was a previous session
        if (lastScore > 0) {
            const lastScoreY = this._canvasHeight * 0.75;
            const lastScoreText = `Last: ${lastScore}`;

            this._renderer.drawText(
                lastScoreText,
                this._canvasWidth / 2,
                lastScoreY,
                VISUAL.textFont,
                VISUAL.textColor
            );
        }
    }
}

export default TitleScreen;