/**
 * HUD - Heads-up display for in-game information
 * Shows current score during gameplay
 */
class HUD {
    constructor() {
        this.element = null;
        this.scoreElement = null;
        this.highScoreElement = null;
    }

    create() {
        this.element = document.createElement('div');
        this.element.id = 'hud';
        this.element.className = 'hud';
        this.element.innerHTML = `
            <div class="score-container">
                <span class="score" id="current-score">0</span>
                <span class="high-score" id="hud-high-score">0</span>
            </div>
        `;
        this.scoreElement = this.element.querySelector('#current-score');
        this.highScoreElement = this.element.querySelector('#hud-high-score');
        return this.element;
    }

    show() {
        if (this.element) {
            this.element.style.display = 'block';
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    updateScore(current, high) {
        if (this.scoreElement) {
            this.scoreElement.textContent = String(current).padStart(5, '0');
        }
        if (this.highScoreElement) {
            this.highScoreElement.textContent = `BEST: ${high}`;
        }
    }

    /**
     * Updates the current-score display during the game loop's render phase.
     * Safe no-op if the HUD's DOM element hasn't been created/mounted yet.
     * @param {number} score - Current session score
     */
    render(score) {
        if (this.scoreElement) {
            this.scoreElement.textContent = String(score).padStart(5, '0');
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
export { HUD };
export default HUD;
