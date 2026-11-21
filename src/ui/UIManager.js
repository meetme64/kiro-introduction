/**
 * UIManager - Manages all UI screens and overlays
 * Coordinates between different UI screens and HUD
 */
class UIManager {
    constructor() {
        this.screens = {};
        this.overlays = {};
        this.currentScreen = null;
        this.hud = null;
    }

    registerScreen(name, screen) {
        this.screens[name] = screen;
    }

    registerOverlay(name, overlay) {
        this.overlays[name] = overlay;
    }

    setHUD(hud) {
        this.hud = hud;
    }

    /**
     * Returns a registered screen by name, or null if not found.
     * @param {string} name - Screen name used at registration time
     * @returns {Object|null} The registered screen instance
     */
    getScreen(name) {
        return this.screens[name] || null;
    }

    showScreen(name, data) {
        if (this.currentScreen) {
            this.currentScreen.hide();
        }
        this.currentScreen = this.screens[name];
        if (this.currentScreen) {
            // GameOverScreen.show(score, isNewHighScore) takes two
            // positional args, while GameStateManager calls
            // showScreen('gameOver', { score, highScore, isNewRecord }).
            // Forward the object's fields positionally when data is an
            // object with a `score` field; otherwise call show() plain
            // (TitleScreen/HUD take no arguments).
            if (data && typeof data === 'object' && 'score' in data) {
                this.currentScreen.show(data.score, data.isNewRecord);
            } else {
                this.currentScreen.show();
            }
        }
    }

    /**
     * Hides a specific registered screen by name. If it is the currently
     * active screen, clears `currentScreen` too.
     * @param {string} name - Screen name used at registration time
     */
    hideScreen(name) {
        const screen = this.screens[name];
        if (screen && typeof screen.hide === 'function') {
            screen.hide();
        }
        if (this.currentScreen === screen) {
            this.currentScreen = null;
        }
    }

    showOverlay(name) {
        const overlay = this.overlays[name];
        if (overlay) {
            overlay.show();
        }
    }

    hideOverlay(name) {
        const overlay = this.overlays[name];
        if (overlay) {
            overlay.hide();
        }
    }

    /**
     * Renders the currently active screen, if it exposes a render() method.
     * Safe to call every frame; no-ops when there is no current screen.
     */
    render() {
        if (this.currentScreen && typeof this.currentScreen.render === 'function') {
            this.currentScreen.render();
        }
    }

    updateScore(currentScore, highScore) {
        if (this.hud) {
            this.hud.updateScore(currentScore, highScore);
        }
    }

    showGameOver(data) {
        const screen = this.screens.gameOver;
        if (screen) {
            screen.show(data);
        }
    }

    hideGameOver() {
        const screen = this.screens.gameOver;
        if (screen) {
            screen.hide();
        }
    }
}
export { UIManager };
export default UIManager;
