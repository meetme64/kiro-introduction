/**
 * GameReset.js - Game Reset and Restart Functionality
 * 
 * Provides comprehensive game reset operations for full game restarts,
 * soft resets (player + obstacles only), and hard resets (everything).
 * 
 * Reset Types:
 * - reset(): Full game restart (default) - resets player, pipes, score, clouds, difficulty
 * - softReset(): Soft reset - resets player and obstacles only (keeps high score)
 * - hardReset(): Hard reset - resets everything including high score
 * 
 * Dependencies:
 * - Kiro: Player character entity
 * - PipeManager: Obstacle management
 * - ScoreManager: Scoring system
 * - CloudManager: Background clouds
 * - GameStateManager: Game state transitions
 * - InvincibilityManager: Post-restart invincibility
 */

import { CONFIG } from '../config.js';

/**
 * GameReset class encapsulating all game reset operations.
 * Provides clean separation of reset logic from game state management.
 */
class GameReset {
    /**
     * Creates a new GameReset instance.
     * @param {Object} game - Game instance containing all game subsystems
     * @param {Object} game.kiro - Kiro player character instance
     * @param {Object} game.pipeManager - Pipe manager instance
     * @param {Object} game.scoreManager - Score manager instance
     * @param {Object} game.cloudManager - Cloud manager instance
     * @param {Object} game.stateManager - Game state manager instance
     * @param {Object} game.invincibilityManager - Invincibility manager instance
     */
    constructor(game) {
        this.game = game;
        
        /**
         * Cached configuration for reset operations.
         * @type {Object}
         */
        this.config = {
            invincibilityFrames: CONFIG.game.invincibilityFrames,
            invincibilityFlashInterval: CONFIG.game.invincibilityFlashInterval
        };
    }

    /**
     * Performs a full game reset.
     * 
     * Resets:
     * - Kiro's position to canvas horizontal center and 50% vertical
     * - Velocity_Y to 0
     * - All active pipes
     * - Score to 0
     * - Difficulty progression
     * - Clouds
     * - Applies invincibility frames (120 frames)
     * 
     * High score is preserved (use hardReset() to clear it).
     * 
     * @returns {boolean} True if reset was successful
     */
    reset() {
        try {
            // Reset all game systems in dependency order
            this._resetKiro();
            this._resetPipes();
            this._resetScore();
            this._resetClouds();
            this._activateInvincibility();
            
            // Transition to Playing state
            if (this.game.stateManager) {
                this.game.stateManager.transitionTo('PLAYING');
            }
            
            return true;
        } catch (error) {
            console.error('Game reset failed:', error);
            return false;
        }
    }

    /**
     * Performs a soft reset.
     * 
     * Resets only:
     * - Kiro's position and velocity
     * - Active pipes
     * - Current score
     * 
     * Preserves:
     * - High score
     * - Difficulty progression (not applicable since score resets)
     * - Clouds
     * 
     * @returns {boolean} True if soft reset was successful
     */
    softReset() {
        try {
            // Reset player and obstacles only
            this._resetKiro();
            this._resetPipes();
            this._resetScore();
            
            // Transition to Playing state
            if (this.game.stateManager) {
                this.game.stateManager.transitionTo('PLAYING');
            }
            
            return true;
        } catch (error) {
            console.error('Soft reset failed:', error);
            return false;
        }
    }

    /**
     * Performs a hard reset.
     * 
     * Resets everything:
     * - All soft reset items
     * - High score (resets to 0)
     * - Clouds
     * 
     * @returns {boolean} True if hard reset was successful
     */
    hardReset() {
        try {
            // Reset everything including high score
            this._resetKiro();
            this._resetPipes();
            this._resetScore();
            this._resetHighScore();
            this._resetClouds();
            this._activateInvincibility();
            
            // Transition to Playing state
            if (this.game.stateManager) {
                this.game.stateManager.transitionTo('PLAYING');
            }
            
            return true;
        } catch (error) {
            console.error('Hard reset failed:', error);
            return false;
        }
    }

    /**
     * Resets Kiro to starting position.
     * @private
     */
    _resetKiro() {
        if (this.game.kiro) {
            this.game.kiro.reset();
        }
    }

    /**
     * Clears all active pipes and resets pipe generation.
     * @private
     */
    _resetPipes() {
        if (this.game.pipeManager) {
            this.game.pipeManager.reset();
        }
    }

    /**
     * Resets current score to 0.
     * @private
     */
    _resetScore() {
        if (this.game.scoreManager) {
            this.game.scoreManager.reset();
        }
    }

    /**
     * Resets high score to 0.
     * @private
     */
    _resetHighScore() {
        if (this.game.scoreManager) {
            this.game.scoreManager.highScore = 0;
        }
    }

    /**
     * Clears all clouds.
     * @private
     */
    _resetClouds() {
        if (this.game.cloudManager) {
            this.game.cloudManager.reset();
        }
    }

    /**
     * Activates invincibility frames if invincibility manager exists.
     * Sets invincibility to 120 frames as specified in configuration.
     * @private
     */
    _activateInvincibility() {
        if (this.game.invincibilityManager) {
            // Activate invincibility frames via manager
            this.game.invincibilityManager.reset();
            this.game.invincibilityManager.activate();
        }
        
        if (this.game.kiro) {
            // Also activate via Kiro's public method
            this.game.kiro.activateInvincibility(this.config.invincibilityFrames);
        }
    }

    /**
     * Updates invincibility frame countdown.
     * Should be called each frame during the game loop.
     * @param {number} dt - Delta time in seconds
     * @returns {number} Remaining invincibility frames (0 if inactive)
     */
    updateInvincibility(dt) {
        if (this.game.invincibilityManager) {
            this.game.invincibilityManager.update(dt);
        }
        
        if (this.game.kiro) {
            const frames = this.game.kiro.getInvincibilityFrames();
            if (frames > 0) {
                // Convert dt (seconds) to frames (assuming 60 FPS)
                const framesElapsed = Math.round(dt * 60);
                const remaining = frames - framesElapsed;
                
                if (remaining <= 0) {
                    this.game.kiro.deactivateInvincibility();
                }
                
                return Math.max(0, remaining);
            }
        }
        
        return 0;
    }

    /**
     * Checks if Kiro is currently invincible.
     * @returns {boolean} True if invincible
     */
    isInvincible() {
        if (this.game.kiro) {
            return this.game.kiro.isInvincible();
        }
        return false;
    }
}

// ============================================================================
// STATIC FACTORY METHODS
// ============================================================================

/**
 * Creates a GameReset instance from an existing game object.
 * @param {Object} game - Game instance with required subsystems
 * @returns {GameReset} New GameReset instance
 */
GameReset.create = function(game) {
    return new GameReset(game);
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default GameReset;

// ============================================================================
// NAMED EXPORTS
// ============================================================================

export { GameReset as ResetManager };