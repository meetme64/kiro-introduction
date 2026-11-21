/**
 * GameOverScreen - Game over screen for Flappy Kiro
 * Renders final score, high score, and restart instructions
 * Handles new high score announcement animation
 */
import { VISUAL } from '../config.js';

class GameOverScreen {
    /**
     * Creates a new GameOverScreen instance
     * @param {CanvasRenderer} renderer - The canvas renderer for drawing
     * @param {ScoreManager} scoreManager - The score manager for score data
     */
    constructor(renderer, scoreManager) {
        /** @type {CanvasRenderer} */
        this._renderer = renderer;
        /** @type {ScoreManager} */
        this._scoreManager = scoreManager;

        /** @type {boolean} */
        this._isVisible = false;

        // Score display state
        /** @type {number} */
        this._finalScore = 0;
        /** @type {boolean} */
        this._isNewHighScore = false;

        // Animation state
        /** @type {number} */
        this._animationTime = 0;
        /** @type {boolean} */
        this._flashVisible = true;

        // Cached dimensions for positioning
        /** @type {number} */
        this._canvasWidth = 0;
        /** @type {number} */
        this._canvasHeight = 0;

        // Flashing animation interval in seconds
        /** @constant {number} */
        this._FLASH_INTERVAL = 0.5;

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
     * Shows the game over screen with score information
     * Called when transitioning to the GAMEOVER game state
     * @param {number} [score=0] - The final score achieved
     * @param {boolean} [isNewHighScore=false] - Whether this is a new high score
     */
    show(score = 0, isNewHighScore = false) {
        this._isVisible = true;
        this._finalScore = score;
        this._isNewHighScore = isNewHighScore;
        this._animationTime = 0;
        this._flashVisible = true;
        this._updateDimensions();
    }

    /**
     * Hides the game over screen and performs cleanup
     * Called when transitioning away from the GAMEOVER game state
     */
    hide() {
        this._isVisible = false;
    }

    /**
     * Renders all game over screen elements
     * Draws game over text, scores, and instructions
     */
    render() {
        if (!this._isVisible) return;

        this._renderGameOver();
        this._renderFinalScore();
        this._renderHighScore();
        this._renderRestartInstruction();

        if (this._isNewHighScore) {
            this._renderNewHighScoreIndicator();
        }
    }

    /**
     * Updates animation state for flashing effects
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        if (!this._isVisible) return;

        this._animationTime += deltaTime;

        // Toggle flashing indicator every _FLASH_INTERVAL seconds
        this._flashVisible = Math.floor(this._animationTime / this._FLASH_INTERVAL) % 2 === 0;
    }

    /**
     * Renders the "GAME OVER" title text
     * Positioned at 25% from the top of the canvas
     * @private
     */
    _renderGameOver() {
        const y = this._canvasHeight * 0.25;

        this._renderer.drawText(
            'GAME OVER',
            this._canvasWidth / 2,
            y,
            VISUAL.titleFont,
            VISUAL.textColor
        );
    }

    /**
     * Renders the final score achieved
     * Positioned at 40% from the top of the canvas
     * @private
     */
    _renderFinalScore() {
        const y = this._canvasHeight * 0.40;
        const scoreText = `Score: ${this._finalScore}`;

        this._renderer.drawText(
            scoreText,
            this._canvasWidth / 2,
            y,
            VISUAL.scoreFont,
            VISUAL.textColor
        );
    }

    /**
     * Renders the high score
     * Positioned at 50% from the top of the canvas
     * Uses gold color (#FFD700) as specified
     * @private
     */
    _renderHighScore() {
        const y = this._canvasHeight * 0.50;
        const highScore = this._scoreManager.getHighScore();
        const highScoreText = `Best: ${highScore}`;

        this._renderer.drawText(
            highScoreText,
            this._canvasWidth / 2,
            y,
            VISUAL.textFont,
            VISUAL.highScoreColor
        );
    }

    /**
     * Renders the restart instruction text
     * Positioned at 70% from the top of the canvas
     * @private
     */
    _renderRestartInstruction() {
        const y = this._canvasHeight * 0.70;

        this._renderer.drawText(
            'SPACE or TAP to Restart',
            this._canvasWidth / 2,
            y,
            VISUAL.textFont,
            VISUAL.textColor
        );
    }

    /**
     * Renders the flashing "NEW HIGH SCORE!" indicator
     * Only shown when a new high score is achieved
     * Toggles visibility every 0.5 seconds
     * @private
     */
    _renderNewHighScoreIndicator() {
        if (!this._flashVisible) return;

        const y = this._canvasHeight * 0.60;

        this._renderer.drawText(
            'NEW HIGH SCORE!',
            this._canvasWidth / 2,
            y,
            VISUAL.textFont,
            VISUAL.highScoreColor
        );
    }
}

export default GameOverScreen;