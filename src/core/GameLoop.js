/**
 * GameLoop - Main game loop manager
 * Handles the requestAnimationFrame loop, delta time calculation, and frame-rate independent updates
 *
 * Implements the game loop pattern with:
 * - Delta time calculation using performance.now()
 * - Frame rate monitoring with rolling average (60 frames)
 * - Pause/resume functionality through GameStateManager integration
 * - Frame budget tracking (< 16.67ms per frame at 60 FPS)
 *
 * @module GameLoop
 */

import { CONFIG } from '../config.js';

// ============================================================================
// GAME LOOP CLASS
// ============================================================================

/**
 * GameLoop - Manages the main game loop with frame-rate independent updates
 *
 * @class GameLoop
 * @property {number} targetFPS - Target frames per second (default: 60)
 * @property {number} frameInterval - Target frame interval in ms (16.67ms)
 * @property {boolean} isRunning - Whether the loop is currently running
 * @property {boolean} isPaused - Whether the game is paused
 * @property {number} lastTime - Timestamp of last frame
 * @property {number} deltaTime - Time since last frame in seconds
 * @property {number} currentFPS - Current measured FPS
 * @property {Object} frameBudget - Tracks time spent in each phase
 */
class GameLoop {
    /**
     * Creates a new GameLoop instance
     * @param {Object} game - Reference to the main game object
     * @param {Object} [options] - Configuration options
     * @param {number} [options.targetFPS=60] - Target FPS
     * @param {boolean} [options.enableProfiling=false] - Enable frame timing
     */
    constructor(game, options = {}) {
        this.game = game;

        // Frame timing configuration
        this.targetFPS = options.targetFPS || CONFIG.targetFPS || 60;
        this.frameInterval = 1000 / this.targetFPS;

        // Loop state
        this.isRunning = false;
        this.isPaused = false;
        this.animationFrameId = null;

        // Time tracking
        this.lastTime = 0;
        this.deltaTime = 0;           // In seconds for physics calculations
        this.deltaTimeMs = 0;         // In milliseconds for display

        // Frame rate monitoring (rolling average over 60 frames)
        this.frameTimes = [];
        this.frameTimeWindow = 60;
        this.currentFPS = this.targetFPS;

        // Frame budget tracking
        this.frameBudget = {
            target: this.frameInterval,
            used: 0,
            update: 0,
            render: 0,
            remaining: 0
        };

        // Profiling
        this.enableProfiling = options.enableProfiling || CONFIG.game.debugMode || false;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        // Callbacks
        this.onUpdateCallbacks = [];
        this.onRenderCallbacks = [];
        this.onFrameEndCallbacks = [];

        // Bound methods for event listeners
        this._boundTick = this._tick.bind(this);
        this._boundPause = this._handleVisibilityChange.bind(this);
    }

    // ============================================================================
    // LOOP CONTROL
    // ============================================================================

    /**
     * Starts the game loop
     * @returns {boolean} - Whether the loop was started successfully
     */
    start() {
        if (this.isRunning) {
            console.warn('[GameLoop] Already running');
            return false;
        }

        console.log('[GameLoop] Starting game loop');
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.frameTimes = [];

        // Set up visibility change listener for pause on tab switch
        document.addEventListener('visibilitychange', this._boundPause);

        // Start the loop
        this.animationFrameId = requestAnimationFrame(this._boundTick);

        // Emit start event
        this._emitEvent('loopStart', { timestamp: this.lastTime });

        return true;
    }

    /**
     * Stops the game loop
     * @returns {boolean} - Whether the loop was stopped successfully
     */
    stop() {
        if (!this.isRunning) {
            console.warn('[GameLoop] Not running');
            return false;
        }

        console.log('[GameLoop] Stopping game loop');
        this.isRunning = false;
        this.isPaused = false;

        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Remove visibility change listener
        document.removeEventListener('visibilitychange', this._boundPause);

        // Emit stop event
        this._emitEvent('loopStop', { timestamp: performance.now() });

        return true;
    }

    /**
     * Pauses the game loop (stops updating, continues rendering)
     * @returns {boolean} - Whether the pause was successful
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            return false;
        }

        console.log('[GameLoop] Pausing game loop');
        this.isPaused = true;
        this._emitEvent('loopPause', { timestamp: performance.now() });

        return true;
    }

    /**
     * Resumes the game loop from paused state
     * @returns {boolean} - Whether the resume was successful
     */
    resume() {
        if (!this.isRunning || !this.isPaused) {
            return false;
        }

        console.log('[GameLoop] Resuming game loop');
        this.isPaused = false;
        this.lastTime = performance.now(); // Reset lastTime to prevent large delta
        this._emitEvent('loopResume', { timestamp: performance.now() });

        return true;
    }

    /**
     * Toggles pause state
     * @returns {boolean} - New pause state
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
        return this.isPaused;
    }

    /**
     * Checks if the loop is currently running
     * @returns {boolean}
     */
    getIsRunning() {
        return this.isRunning;
    }

    /**
     * Checks if the game is paused
     * @returns {boolean}
     */
    getIsPaused() {
        return this.isPaused;
    }

    // ============================================================================
    // TIME MANAGEMENT
    // ============================================================================

    /**
     * Gets the current delta time in seconds
     * @returns {number}
     */
    getDeltaTime() {
        return this.deltaTime;
    }

    /**
     * Gets the current delta time in milliseconds
     * @returns {number}
     */
    getDeltaTimeMs() {
        return this.deltaTimeMs;
    }

    /**
     * Gets the current FPS (rolling average)
     * @returns {number}
     */
    getFPS() {
        return this.currentFPS;
    }

    /**
     * Gets the frame budget information
     * @returns {Object}
     */
    getFrameBudget() {
        return { ...this.frameBudget };
    }

    /**
     * Gets performance statistics
     * @returns {Object}
     */
    getStats() {
        const avgFrameTime = this.frameTimes.length > 0
            ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
            : 0;

        return {
            currentFPS: this.currentFPS,
            averageFrameTime: avgFrameTime,
            frameCount: this.frameCount,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            deltaTime: this.deltaTime,
            frameBudget: this.getFrameBudget()
        };
    }

    // ============================================================================
    // CALLBACK REGISTRATION
    // ============================================================================

    /**
     * Registers a callback to be called during update phase
     * @param {Function} callback - Function to call with (deltaTime, game)
     * @returns {Function} - Unsubscribe function
     */
    onUpdate(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onUpdate requires a function callback');
        }
        this.onUpdateCallbacks.push(callback);
        return () => this._removeCallback(this.onUpdateCallbacks, callback);
    }

    /**
     * Registers a callback to be called during render phase
     * @param {Function} callback - Function to call with (game)
     * @returns {Function} - Unsubscribe function
     */
    onRender(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onRender requires a function callback');
        }
        this.onRenderCallbacks.push(callback);
        return () => this._removeCallback(this.onRenderCallbacks, callback);
    }

    /**
     * Registers a callback to be called at end of each frame
     * @param {Function} callback - Function to call with (stats)
     * @returns {Function} - Unsubscribe function
     */
    onFrameEnd(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onFrameEnd requires a function callback');
        }
        this.onFrameEndCallbacks.push(callback);
        return () => this._removeCallback(this.onFrameEndCallbacks, callback);
    }

    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================

    /**
     * Main tick function called by requestAnimationFrame
     * @param {number} currentTime - Current timestamp from RAF
     * @private
     */
    _tick(currentTime) {
        if (!this.isRunning) return;

        // Calculate delta time
        const deltaMs = currentTime - this.lastTime;

        // Only update if enough time has passed (frame skipping for lag)
        if (deltaMs >= this.frameInterval * 2) {
            // Lag spike - reset timing but cap delta time
            this.lastTime = currentTime - this.frameInterval;
            this.deltaTime = this.frameInterval / 1000;
            this.deltaTimeMs = this.frameInterval;
        } else {
            this.deltaTimeMs = deltaMs;
            this.deltaTime = Math.min(deltaMs / 1000, 0.1); // Cap at 100ms
            this.lastTime = currentTime;
        }

        // Track frame time for FPS calculation
        this.frameTimes.push(deltaMs);
        if (this.frameTimes.length > this.frameTimeWindow) {
            this.frameTimes.shift();
        }

        // Update FPS every second
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.currentFPS = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;

            if (this.enableProfiling) {
                this._logPerformance();
            }
        }

        // Reset frame budget tracking
        const frameStart = performance.now();
        this.frameBudget.update = 0;
        this.frameBudget.render = 0;
        this.frameBudget.used = 0;

        // UPDATE PHASE - Only update game logic when not paused
        // Wrapped in try/catch so a single bad frame (e.g. a UI rendering
        // bug) cannot permanently kill the RAF loop and freeze the canvas.
        const updateStart = performance.now();
        try {
            if (!this.isPaused) {
                this._update();
            }
        } catch (error) {
            console.error('[GameLoop] Update phase error (frame continues):', error);
        }
        this.frameBudget.update = performance.now() - updateStart;

        // RENDER PHASE - Always render (to show pause overlay)
        const renderStart = performance.now();
        try {
            this._render();
        } catch (error) {
            console.error('[GameLoop] Render phase error (frame continues):', error);
        }
        this.frameBudget.render = performance.now() - renderStart;

        // Calculate total frame time
        this.frameBudget.used = performance.now() - frameStart;
        this.frameBudget.remaining = Math.max(0, this.frameBudget.target - this.frameBudget.used);

        // Emit frame end event with stats
        try {
            this._emitFrameEnd();
        } catch (error) {
            console.error('[GameLoop] Frame end callback error (frame continues):', error);
        }

        // Schedule next frame - always, even if update/render threw above,
        // so the loop keeps running instead of freezing on a single error.
        if (this.isRunning) {
            this.animationFrameId = requestAnimationFrame(this._boundTick);
        }
    }

    /**
     * Update phase - updates all game systems
     * @private
     */
    _update() {
        // Emit update callbacks
        for (const callback of this.onUpdateCallbacks) {
            try {
                callback(this.deltaTime, this.game);
            } catch (error) {
                console.error('[GameLoop] Update callback error:', error);
            }
        }

        // Update game state manager
        if (this.game?.stateManager) {
            this.game.stateManager.update(this.deltaTimeMs);
        }

        // Only update game-feature entities when in PLAYING state.
        // NOTE: physics/pipes/clouds/collisions/score/difficulty are
        // already updated safely by GameStateManager.update() above
        // (via PlayingStateHandler.update()) - duplicating those calls
        // here previously used the wrong method names on several
        // systems (e.g. collisionDetector.check vs checkAllCollisions),
        // throwing every frame and risking a double-update of game
        // state on top of that. Only Cape/Laser/invincibility, which
        // are not handled by GameStateManager, belong here.
        if (this.game?.stateManager?.isPlaying()) {
            // Update cape (Requirement 14)
            if (this.game.kiro && typeof this.game.kiro.updateCape === 'function') {
                this.game.kiro.updateCape(this.deltaTime);
            }

            // Update laser system (Requirement 14)
            if (this.game.laserSystem) {
                this.game.laserSystem.update(
                    this.deltaTime,
                    this.game.pipeManager ? this.game.pipeManager.getPipes() : [],
                    this.game.damageManager,
                    () => this.game.audioEngine.playLaserHit(CONFIG.laser.soundVolume.hit)
                );
            }
            if (this.game.invincibilityManager) {
                this.game.invincibilityManager.update(this.deltaTime);
            }
        }
    }

    /**
     * Render phase - renders the current game state
     * @private
     */
    _render() {
        // Emit render callbacks
        for (const callback of this.onRenderCallbacks) {
            try {
                callback(this.game);
            } catch (error) {
                console.error('[GameLoop] Render callback error:', error);
            }
        }

        // Clear the canvas
        if (this.game?.renderer) {
            this.game.renderer.clear();
        }

        // Render based on game state
        if (this.game?.stateManager && this.game?.renderer) {
            const state = this.game.stateManager.getState();

            switch (state) {
                case 'TITLE':
                    this._renderTitleState();
                    break;
                case 'PLAYING':
                    this._renderPlayingState();
                    break;
                case 'PAUSED':
                    this._renderPlayingState(); // Still render game behind overlay
                    this._renderPauseOverlay();
                    break;
                case 'GAMEOVER':
                    this._renderGameOverState();
                    break;
            }
        }
    }

    /**
     * Renders the title screen state
     * @private
     */
    _renderTitleState() {
        // Title screen is handled by UIManager
        if (this.game?.uiManager) {
            this.game.uiManager.render();
        }
    }

    /**
     * Renders the playing state
     * @private
     */
    _renderPlayingState() {
        // Render clouds (background)
        if (this.game?.cloudManager && this.game?.renderer) {
            this.game.renderer.drawClouds(this.game.cloudManager.getClouds());
        }

        // Render pipes
        if (this.game?.pipeManager && this.game?.renderer) {
            this.game.renderer.drawPipes(this.game.pipeManager.getPipes());
        }

        // Render laser beams (Requirement 14) - after pipes, before Kiro
        if (this.game.laserSystem && this.game.renderer) {
            this.game.laserSystem.renderLaser(this.game.renderer.ctx);
        }

        // Render cape (Requirement 14) - before Kiro sprite
        if (this.game.kiro && this.game.renderer && typeof this.game.kiro.renderCape === 'function') {
            this.game.kiro.renderCape(this.game.renderer.ctx);
        }

        // Render Kiro
        if (this.game?.kiro && this.game?.renderer) {
            const kiroImage = this.game.assetLoader?.get?.('ghosty_idle');
            this.game.renderer.drawKiro(this.game.kiro, kiroImage);
        }

        // Render laser timer (Requirement 14)
        if (this.game.laserSystem && this.game.renderer) {
            this.game.laserSystem.renderLaserTimer(
                this.game.renderer.ctx,
                this.game.renderer.canvas.width,
                this.game.renderer.canvas.height
            );
        }

        // Render HUD
        if (this.game?.uiManager && this.game?.scoreManager) {
            const hud = this.game.uiManager.getScreen('hud');
            if (hud && typeof hud.render === 'function') {
                hud.render(this.game.scoreManager.getCurrent());
            }
        }
    }

    /**
     * Renders the pause overlay
     * @private
     */
    _renderPauseOverlay() {
        if (this.game?.uiManager) {
            // Semi-transparent overlay
            this.game.renderer.drawPauseOverlay();

            // "PAUSED" text
            this.game.renderer.drawText(
                'PAUSED',
                this.game.renderer.canvas.width / 2,
                this.game.renderer.canvas.height / 2,
                CONFIG.visual.titleFont,
                CONFIG.visual.textColor
            );
        }
    }

    /**
     * Renders the game over state
     * @private
     */
    _renderGameOverState() {
        // Render static game state in background
        this._renderPlayingState();

        // Game over screen is handled by UIManager
        if (this.game?.uiManager) {
            this.game.uiManager.render();
        }
    }

    /**
     * Handles visibility change events (tab switching)
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            // Tab became hidden - pause if playing
            if (this.game?.stateManager?.isPlaying()) {
                this.pause();
                console.log('[GameLoop] Tab hidden, auto-paused');
            }
        } else {
            // Tab became visible - optionally resume
            // Don't auto-resume as user might have tabbed away intentionally
            console.log('[GameLoop] Tab visible');
        }
    }

    /**
     * Removes a callback from an array
     * @param {Array} array - Array to remove from
     * @param {Function} callback - Function to remove
     * @private
     */
    _removeCallback(array, callback) {
        const index = array.indexOf(callback);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    /**
     * Emits an event to listeners
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @private
     */
    _emitEvent(event, data) {
        if (this.game?.eventBus) {
            this.game.eventBus.emit(event, data);
        }
    }

    /**
     * Emits frame end event with performance stats
     * @private
     */
    _emitFrameEnd() {
        const stats = this.getStats();

        for (const callback of this.onFrameEndCallbacks) {
            try {
                callback(stats);
            } catch (error) {
                console.error('[GameLoop] Frame end callback error:', error);
            }
        }
    }

    /**
     * Logs performance information
     * @private
     */
    _logPerformance() {
        const stats = this.getStats();
        const budgetPct = (this.frameBudget.used / this.frameBudget.target * 100).toFixed(1);

        console.log(`[GameLoop] FPS: ${stats.currentFPS} | ` +
            `Frame: ${this.frameBudget.used.toFixed(2)}ms/${this.frameBudget.target}ms (${budgetPct}%) | ` +
            `Update: ${this.frameBudget.update.toFixed(2)}ms | ` +
            `Render: ${this.frameBudget.render.toFixed(2)}ms`);
    }

    // ============================================================================
    // DEBUG METHODS
    // ============================================================================

    /**
     * Gets debug information about the game loop
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            targetFPS: this.targetFPS,
            frameInterval: this.frameInterval,
            currentFPS: this.currentFPS,
            deltaTime: this.deltaTime,
            frameBudget: this.getFrameBudget(),
            callbackCounts: {
                update: this.onUpdateCallbacks.length,
                render: this.onRenderCallbacks.length,
                frameEnd: this.onFrameEndCallbacks.length
            }
        };
    }

    /**
     * Enables or disables profiling
     * @param {boolean} enabled
     */
    setProfiling(enabled) {
        this.enableProfiling = Boolean(enabled);
    }

    /**
     * Dumps performance statistics to console
     */
    dumpStats() {
        const stats = this.getStats();
        console.log('=== GameLoop Statistics ===');
        console.log(`Running: ${stats.isRunning}`);
        console.log(`Paused: ${stats.isPaused}`);
        console.log(`FPS: ${stats.currentFPS}`);
        console.log(`Delta Time: ${(stats.deltaTime * 1000).toFixed(2)}ms`);
        console.log(`Frame Budget Used: ${stats.frameBudget.used.toFixed(2)}ms`);
        console.log(`Frame Budget Target: ${stats.frameBudget.target}ms`);
        console.log(`Update Time: ${stats.frameBudget.update.toFixed(2)}ms`);
        console.log(`Render Time: ${stats.frameBudget.render.toFixed(2)}ms`);
        console.log(`Frame Count: ${stats.frameCount}`);
        console.log('============================');
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { GameLoop };

export default GameLoop;
