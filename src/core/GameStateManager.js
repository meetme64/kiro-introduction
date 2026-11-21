/**
 * GameStateManager - Manages game state transitions
 * Implements state machine pattern for TITLE, PLAYING, PAUSED, GAMEOVER states
 *
 * @module GameStateManager
 */

import { CONFIG } from '../config.js';

// ============================================================================
// GAME STATE TYPE DEFINITION
// ============================================================================

/**
 * Game state type representing the current state of gameplay
 * @typedef {'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'} GameState
 */
const GAME_STATES = Object.freeze({
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
});

// ============================================================================
// GAME STATE MODEL INTERFACE
// ============================================================================

/**
 * GameStateModel interface representing the complete game state
 * @interface GameStateModel
 * @property {GameState} state - Current game state
 * @property {number} score - Current session score
 * @property {number} highScore - Persisted high score
 * @property {boolean} isInitialized - Whether game is initialized
 * @property {boolean} assetsLoaded - Whether all assets are loaded
 * @property {number} startTime - Timestamp when current state started
 * @property {number} lastFrameTime - Timestamp of last frame update
 * @property {Object} savedState - Saved state for resume (paused state)
 * @property {boolean} isNewHighScore - Whether current score is a new high score
 */

/**
 * Creates a default GameStateModel
 * @returns {GameStateModel}
 */
function createDefaultStateModel() {
    return {
        state: GAME_STATES.TITLE,
        score: 0,
        highScore: 0,
        isInitialized: false,
        assetsLoaded: false,
        startTime: 0,
        lastFrameTime: 0,
        savedState: null,
        isNewHighScore: false
    };
}

// ============================================================================
// STATE TRANSITION MATRIX
// ============================================================================

/**
 * Valid state transitions matrix
 * Maps current state to array of allowed next states
 */
const VALID_TRANSITIONS = {
    [GAME_STATES.TITLE]: {
        allowed: [GAME_STATES.PLAYING],
        description: 'Title → Playing on jump/tap/click'
    },
    [GAME_STATES.PLAYING]: {
        allowed: [GAME_STATES.PAUSED, GAME_STATES.GAMEOVER],
        description: 'Playing → Paused (P/ESC) or Game Over (collision)'
    },
    [GAME_STATES.PAUSED]: {
        allowed: [GAME_STATES.PLAYING],
        description: 'Paused → Playing on P/ESC/jump/tap'
    },
    [GAME_STATES.GAMEOVER]: {
        allowed: [GAME_STATES.TITLE, GAME_STATES.PLAYING],
        description: 'Game Over → Title (optional ESC) or Playing (restart)'
    }
};

// ============================================================================
// STATE HANDLER BASE CLASS
// ============================================================================

/**
 * Base class for state handlers
 * Each state has enter, update, and exit methods
 * @class StateHandler
 */
class StateHandler {
    /**
     * @param {GameStateManager} manager - Reference to state manager
     */
    constructor(manager) {
        this.manager = manager;
    }

    /**
     * Live reference to the current game object.
     *
     * This used to be captured once as `this.game = manager.game` in the
     * constructor. State handlers are constructed synchronously inside
     * `GameStateManager`'s own constructor - before main.js ever gets a
     * chance to run `gameStateManager.game = game` (the "connect circular
     * references" step happens afterwards, in Phase 7 of initGame). That
     * meant every handler's `this.game` was permanently frozen at
     * `undefined`, so `if (!this.game) return;` at the top of
     * PlayingStateHandler.update() (and the other handlers) silently
     * bailed out on every single frame - Kiro never moved, pipes and
     * clouds never spawned, collisions were never checked. Reading
     * `manager.game` live on every access fixes this regardless of
     * construction order.
     * @returns {Object|undefined} The current game object
     */
    get game() {
        return this.manager.game;
    }

    /**
     * Called when entering this state
     * @param {GameState} fromState - Previous state
     */
    enter(fromState) {
        // Override in subclasses
    }

    /**
     * Called each frame while in this state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Override in subclasses
    }

    /**
     * Called when exiting this state
     * @param {GameState} toState - Next state
     */
    exit(toState) {
        // Override in subclasses
    }
}

// ============================================================================
// TITLE STATE HANDLER
// ============================================================================

/**
 * Handles TITLE state - displays main menu
 * @class TitleStateHandler
 * @extends StateHandler
 */
class TitleStateHandler extends StateHandler {
    /**
     * Displays title screen
     * @param {GameState} fromState - Previous state
     */
    enter(fromState) {
        if (this.manager.debugMode) {
            console.log('[TitleState] Entering TITLE state');
        }

        // Show title screen UI
        if (this.game?.uiManager) {
            this.game.uiManager.showScreen('title');
        }

        // Play title music if available
        if (this.game?.audioEngine) {
            this.game.audioEngine.playMusic?.('title');
        }

        // Reset Kiro animation to idle
        if (this.game?.kiro) {
            this.game.kiro.setAnimation?.('idle');
        }

        // Emit state change event
        this._emitStateChange('TITLE', fromState);
    }

    /**
     * Updates title screen animations
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Animate title screen elements if needed
        // Title bob, etc.
    }

    /**
     * Handles input in TITLE state
     * @param {Object} input - Input event
     */
    handleInput(input) {
        if (input.type === 'jump' || input.type === 'restart' || input.type === 'start') {
            this.manager.startGame();
        }
    }

    /**
     * Cleans up title screen
     * @param {GameState} toState - Next state
     */
    exit(toState) {
        if (this.manager.debugMode) {
            console.log('[TitleState] Exiting TITLE state');
        }

        // Hide title screen UI
        if (this.game?.uiManager) {
            this.game.uiManager.hideScreen('title');
        }

        // Stop title music
        if (this.game?.audioEngine) {
            this.game.audioEngine.stopMusic?.();
        }

        this._emitStateChange(toState, 'TITLE');
    }

    /**
     * Emits state change event
     * @private
     */
    _emitStateChange(to, from) {
        if (this.game?.eventBus) {
            this.game.eventBus.emit('stateChange', { from, to, state: 'TITLE' });
        }
    }
}

// ============================================================================
// PLAYING STATE HANDLER
// ============================================================================

/**
 * Handles PLAYING state - active gameplay
 * @class PlayingStateHandler
 * @extends StateHandler
 */
class PlayingStateHandler extends StateHandler {
    /**
     * Initializes gameplay systems
     * @param {GameState} fromState - Previous state
     */
    enter(fromState) {
        if (this.manager.debugMode) {
            console.log('[PlayingState] Entering PLAYING state');
        }

        // Reset game state for new session if coming from TITLE or GAMEOVER
        if (fromState === GAME_STATES.TITLE || fromState === GAME_STATES.GAMEOVER) {
            this._fullReset();
        } else if (fromState === GAME_STATES.PAUSED) {
            // Resume from pause - no reset needed
            this._restorePauseState();
        }

        // Show HUD
        if (this.game?.uiManager) {
            this.game.uiManager.showScreen('hud');
        }

        // Play game music
        if (this.game?.audioEngine) {
            this.game.audioEngine.playMusic?.('gameplay');
            this.game.audioEngine.setMuted?.(false);
        }

        // Mark game as playing
        if (this.game) {
            this.game.isPlaying = true;
            this.game.isPaused = false;
        }

        // Emit state change event
        this._emitStateChange('PLAYING', fromState);
    }

    /**
     * Updates gameplay systems
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.game) return;

        // Update Kiro physics
        if (this.game.kiro) {
            this.game.kiro.update?.(deltaTime, this.game.renderer?.canvas, this.game.pipeManager?.pipes);
        }

        // Update physics engine
        if (this.game.physicsEngine) {
            this.game.physicsEngine.update?.(deltaTime);
        }

        // Update pipes
        if (this.game.pipeManager) {
            this.game.pipeManager.update?.(deltaTime);
        }

        // Update clouds
        if (this.game.cloudManager) {
            this.game.cloudManager.update?.(deltaTime);
        }

        // Check collisions
        // NOTE: `collisionDetector.check(...)` doesn't exist on the real
        // CollisionDetector class (it only had `checkAllCollisions`,
        // `checkKiroPipeCollision`, `checkKiroBoundaryCollision`, etc.).
        // The optional-chained call above silently no-op'd forever, so
        // Kiro could never die - it just fell through the floor and kept
        // going. Call the real method and act on its result.
        if (this.game.collisionDetector && this.game.kiro) {
            const canvasHeight = this.game.renderer?.getDimensions?.().height
                ?? this.game.canvas?.height
                ?? 640;
            const result = this.game.collisionDetector.checkAllCollisions(
                this.game.kiro,
                this.game.pipeManager?.getPipes?.() || [],
                canvasHeight
            );
            if (result?.collided) {
                this.manager.triggerGameOver();
                return;
            }
        }

        // Update score
        if (this.game.scoreManager) {
            // Check for pipe passages
            if (this.game.pipeManager && this.game.kiro) {
                for (const pipe of this.game.pipeManager.pipes) {
                    this.game.scoreManager.checkPassage?.(this.game.kiro, pipe);
                }
            }
        }

        // Update difficulty based on score
        if (this.game.difficulty && this.game.scoreManager) {
            this.game.difficulty.update?.(this.game.scoreManager.getCurrent?.());
        }
    }

    /**
     * Cleans up playing state
     * @param {GameState} toState - Next state
     */
    exit(toState) {
        if (this.manager.debugMode) {
            console.log('[PlayingState] Exiting PLAYING state');
        }

        // Hide HUD
        if (this.game?.uiManager) {
            this.game.uiManager.hideScreen('hud');
        }

        // Stop music
        if (this.game?.audioEngine) {
            this.game.audioEngine.stopMusic?.();
        }

        // Mark game as not playing
        if (this.game) {
            this.game.isPlaying = false;
        }

        // If transitioning to PAUSED, save current state
        if (toState === GAME_STATES.PAUSED) {
            this._savePauseState();
        }

        this._emitStateChange(toState, 'PLAYING');
    }

    /**
     * Handles input in PLAYING state
     * @param {Object} input - Input event
     */
    handleInput(input) {
        if (input.type === 'pause' || input.type === 'escape') {
            this.manager.transitionTo(GAME_STATES.PAUSED);
        } else if (input.type === 'jump') {
            // Jump is handled by the game loop via the physics system
            // This is set up through inputHandler.onJump callback
        }
    }

    /**
     * Performs full game reset for new session
     * @private
     */
    _fullReset() {
        if (this.manager.debugMode) {
            console.log('[PlayingState] Full game reset');
        }

        // Reset Kiro position and velocity
        if (this.game?.kiro) {
            this.game.kiro.reset?.();
            this.game.kiro.x = CONFIG.visual.canvas.baseWidth / 2 - (CONFIG.hitbox?.spriteWidth / 2 || 20);
            this.game.kiro.y = CONFIG.visual.canvas.baseHeight / 2 - (CONFIG.hitbox?.spriteHeight / 2 || 20);
            this.game.kiro.velocity = 0;
            this.game.kiro.rotation = 0;
            this.game.kiro.setAnimation?.('flap');
        }

        // Clear all pipes
        if (this.game?.pipeManager) {
            this.game.pipeManager.reset?.();
        }

        // Reset score
        if (this.game?.scoreManager) {
            this.game.scoreManager.reset?.();
        }

        // Reset difficulty
        if (this.game?.difficulty) {
            this.game.difficulty.reset?.();
        }

        // Reset clouds
        if (this.game?.cloudManager) {
            this.game.cloudManager.reset?.();
        }

        // Reset physics engine
        if (this.game?.physicsEngine) {
            this.game.physicsEngine.reset?.();
        }

        // Reset collision detector
        if (this.game?.collisionDetector) {
            this.game.collisionDetector.reset?.();
        }

        // Apply invincibility frames if implemented
        if (this.game?.kiro && CONFIG.game.invincibilityFrames > 0) {
            this.game.kiro.startInvincibility?.(CONFIG.game.invincibilityFrames);
        }

        // Emit game reset event
        if (this.game?.eventBus) {
            this.game.eventBus.emit('gameReset', {});
        }
    }

    /**
     * Restores state from pause
     * @private
     */
    _restorePauseState() {
        if (this.manager.debugMode) {
            console.log('[PlayingState] Resuming from pause');
        }

        // Resume audio
        if (this.game?.audioEngine) {
            this.game.audioEngine.setMuted?.(false);
        }
    }

    /**
     * Saves current state for pause
     * @private
     */
    _savePauseState() {
        if (this.manager.debugMode) {
            console.log('[PlayingState] Saving pause state');
        }

        this.manager.stateModel.savedState = {
            score: this.game?.scoreManager?.getCurrent?.() || 0,
            kiroState: this.game?.kiro?.getState?.() || null,
            pipeState: this.game?.pipeManager?.pipes?.slice() || [],
            cloudState: this.game?.cloudManager?.getClouds?.() || [],
            difficulty: this.game?.difficulty?.currentTier || 0
        };
    }

    /**
     * Emits state change event
     * @private
     */
    _emitStateChange(to, from) {
        if (this.game?.eventBus) {
            this.game.eventBus.emit('stateChange', { from, to, state: 'PLAYING' });
        }
    }
}

// ============================================================================
// PAUSED STATE HANDLER
// ============================================================================

/**
 * Handles PAUSED state - gameplay suspended
 * @class PausedStateHandler
 * @extends StateHandler
 */
class PausedStateHandler extends StateHandler {
    /**
     * Shows pause overlay
     * @param {GameState} fromState - Previous state
     */
    enter(fromState) {
        if (this.manager.debugMode) {
            console.log('[PausedState] Entering PAUSED state');
        }

        // Show pause overlay
        if (this.game?.uiManager) {
            this.game.uiManager.showOverlay?.('pause');
        }

        // Mute audio
        if (this.game?.audioEngine) {
            this.game.audioEngine.setMuted?.(true);
        }

        // Mark game as paused
        if (this.game) {
            this.game.isPaused = true;
        }

        // Emit state change event
        this._emitStateChange('PAUSED', fromState);
    }

    /**
     * Updates paused state (minimal - just timer if needed)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Can track pause duration here if needed
    }

    /**
     * Handles input in PAUSED state
     * @param {Object} input - Input event
     */
    handleInput(input) {
        if (input.type === 'pause' || input.type === 'escape' || input.type === 'jump' || input.type === 'restart') {
            this.manager.transitionTo(GAME_STATES.PLAYING);
        }
    }

    /**
     * Cleans up pause state
     * @param {GameState} toState - Next state
     */
    exit(toState) {
        if (this.manager.debugMode) {
            console.log('[PausedState] Exiting PAUSED state');
        }

        // Hide pause overlay
        if (this.game?.uiManager) {
            this.game.uiManager.hideOverlay?.('pause');
        }

        // Unmute audio
        if (this.game?.audioEngine) {
            this.game.audioEngine.setMuted?.(false);
        }

        // Mark game as not paused
        if (this.game) {
            this.game.isPaused = false;
        }

        this._emitStateChange(toState, 'PAUSED');
    }

    /**
     * Emits state change event
     * @private
     */
    _emitStateChange(to, from) {
        if (this.game?.eventBus) {
            this.game.eventBus.emit('stateChange', { from, to, state: 'PAUSED' });
        }
    }
}

// ============================================================================
// GAME OVER STATE HANDLER
// ============================================================================

/**
 * Handles GAMEOVER state - displays game over screen
 * @class GameOverStateHandler
 * @extends StateHandler
 */
class GameOverStateHandler extends StateHandler {
    /**
     * Displays game over screen with final score
     * @param {GameState} fromState - Previous state
     */
    enter(fromState) {
        if (this.manager.debugMode) {
            console.log('[GameOverState] Entering GAMEOVER state');
        }

        // Play game over sound
        if (this.game?.audioEngine) {
            this.game.audioEngine.playGameOver?.();
        }

        // Calculate final score and high score
        const currentScore = this.game?.scoreManager?.getCurrent?.() || this.manager.stateModel.score;
        const highScore = this.game?.scoreManager?.getHighScore?.() || this.manager.stateModel.highScore;
        const isNewRecord = currentScore > highScore;

        // Save high score if new record
        if (this.game?.scoreManager) {
            this.game.scoreManager.saveIfHigher?.();

            // Update state model with new high score
            if (isNewRecord) {
                this.manager.stateModel.highScore = currentScore;
                this.manager.stateModel.isNewHighScore = true;
            } else {
                this.manager.stateModel.isNewHighScore = false;
            }
        }

        // Mark game as not playing
        if (this.game) {
            this.game.isPlaying = false;
        }

        // Show game over screen
        if (this.game?.uiManager) {
            this.game.uiManager.showScreen('gameOver', {
                score: currentScore,
                highScore: isNewRecord ? currentScore : highScore,
                isNewRecord
            });
        }

        // Emit state change event
        this._emitStateChange('GAMEOVER', fromState);
    }

    /**
     * Updates game over screen (animations, etc.)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Can add animations or timer-based elements here
    }

    /**
     * Handles input in GAMEOVER state
     * @param {Object} input - Input event
     */
    handleInput(input) {
        if (input.type === 'jump' || input.type === 'restart') {
            // Transition to PLAYING state (restart game)
            this.manager.restartGame();
        } else if (input.type === 'escape') {
            // Optional: Transition to TITLE state
            // Only allowed if config permits (disabled by default)
            if (this.game?.config?.game?.allowTitleFromGameOver) {
                this.manager.returnToTitle();
            }
        }
    }

    /**
     * Cleans up game over state
     * @param {GameState} toState - Next state
     */
    exit(toState) {
        if (this.manager.debugMode) {
            console.log('[GameOverState] Exiting GAMEOVER state');
        }

        // Hide game over screen
        if (this.game?.uiManager) {
            this.game.uiManager.hideScreen('gameOver');
        }

        // Reset new high score flag
        this.manager.stateModel.isNewHighScore = false;

        this._emitStateChange(toState, 'GAMEOVER');
    }

    /**
     * Emits state change event
     * @private
     */
    _emitStateChange(to, from) {
        if (this.game?.eventBus) {
            this.game.eventBus.emit('stateChange', { from, to, state: 'GAMEOVER' });
        }
    }
}

// ============================================================================
// GAME STATE MANAGER CLASS
// ============================================================================

/**
 * GameStateManager - Controls overall game flow through state machine transitions
 *
 * @class GameStateManager
 * @property {GameState} currentState - Current game state
 * @property {GameStateModel} stateModel - Complete game state data
 * @property {Object} game - Reference to main game instance
 * @property {boolean} debugMode - Enable debug logging for transitions
 * @property {Object} stateHandlers - Map of state handlers
 */
class GameStateManager {
    /**
     * Creates a new GameStateManager instance
     * @param {Object} game - Reference to the main game object
     * @param {boolean} [debugMode=false] - Enable debug logging
     */
    constructor(game, debugMode = false) {
        this.game = game;
        this.debugMode = debugMode || CONFIG.game.debugMode || false;
        this.stateModel = createDefaultStateModel();
        this.currentState = GAME_STATES.TITLE;

        // Callbacks for state lifecycle events
        this.onTransitionCallbacks = [];

        // Initialize state handlers
        this.stateHandlers = {
            [GAME_STATES.TITLE]: new TitleStateHandler(this),
            [GAME_STATES.PLAYING]: new PlayingStateHandler(this),
            [GAME_STATES.PAUSED]: new PausedStateHandler(this),
            [GAME_STATES.GAMEOVER]: new GameOverStateHandler(this)
        };
    }

    // ============================================================================
    // STATE ACCESSORS
    // ============================================================================

    /**
     * Gets the current game state
     * @returns {GameState}
     */
    getState() {
        return this.currentState;
    }

    /**
     * Gets the complete state model
     * @returns {GameStateModel}
     */
    getStateModel() {
        return { ...this.stateModel };
    }

    /**
     * Gets the current score
     * @returns {number}
     */
    getScore() {
        return this.stateModel.score;
    }

    /**
     * Gets the high score
     * @returns {number}
     */
    getHighScore() {
        return this.stateModel.highScore;
    }

    /**
     * Checks if game is in playing state
     * @returns {boolean}
     */
    isPlaying() {
        return this.currentState === GAME_STATES.PLAYING;
    }

    /**
     * Checks if game is in paused state
     * @returns {boolean}
     */
    isPaused() {
        return this.currentState === GAME_STATES.PAUSED;
    }

    /**
     * Checks if game is in title state
     * @returns {boolean}
     */
    isTitle() {
        return this.currentState === GAME_STATES.TITLE;
    }

    /**
     * Checks if game is in game over state
     * @returns {boolean}
     */
    isGameOver() {
        return this.currentState === GAME_STATES.GAMEOVER;
    }

    // ============================================================================
    // STATE TRANSITIONS
    // ============================================================================

    /**
     * Validates if a state transition is allowed
     * @param {GameState} targetState - The target state to transition to
     * @returns {{valid: boolean, reason?: string}}
     */
    validateTransition(targetState) {
        // Check if target state is valid
        const validStates = Object.values(GAME_STATES);
        if (!validStates.includes(targetState)) {
            return {
                valid: false,
                reason: `Invalid target state: ${targetState}`
            };
        }

        // Check if already in target state
        if (this.currentState === targetState) {
            return {
                valid: false,
                reason: `Already in target state: ${targetState}`
            };
        }

        // Check transition matrix
        const currentTransitions = VALID_TRANSITIONS[this.currentState];
        if (!currentTransitions) {
            return {
                valid: false,
                reason: `No transitions defined for state: ${this.currentState}`
            };
        }

        if (!currentTransitions.allowed.includes(targetState)) {
            return {
                valid: false,
                reason: `Invalid transition: ${this.currentState} → ${targetState}. ${currentTransitions.description}`
            };
        }

        return { valid: true };
    }

    /**
     * Transitions to a new game state
     * Executes exit handler for current state, updates state, then executes enter handler for new state
     *
     * State transition flow:
     * 1. Call exit() on current state handler
     * 2. Update currentState and stateModel
     * 3. Call enter() on new state handler
     * 4. Emit transition events
     *
     * @param {GameState} targetState - The target state to transition to
     * @returns {boolean} - Whether the transition was successful
     */
    transitionTo(targetState) {
        const validation = this.validateTransition(targetState);

        if (!validation.valid) {
            if (this.debugMode) {
                console.warn(`[GameStateManager] Invalid transition attempted: ${validation.reason}`);
            }
            return false;
        }

        const previousState = this.currentState;

        // Log transition for debugging
        if (this.debugMode) {
            console.log(`[GameStateManager] Transition: ${previousState} → ${targetState}`);
        }

        // Call exit handler for current state
        const currentHandler = this.stateHandlers[previousState];
        if (currentHandler && typeof currentHandler.exit === 'function') {
            currentHandler.exit(targetState);
        }

        // Perform the state transition
        this.currentState = targetState;
        this.stateModel.state = targetState;
        this.stateModel.startTime = performance.now();

        // Call enter handler for new state
        const newHandler = this.stateHandlers[targetState];
        if (newHandler && typeof newHandler.enter === 'function') {
            newHandler.enter(previousState);
        }

        // Emit transition event
        this._emitTransitionEvent(previousState, targetState);

        return true;
    }

    /**
     * Transitions to GAME_OVER state (used by collision detection)
     * @returns {boolean} - Whether the transition was successful
     */
    triggerGameOver() {
        return this.transitionTo(GAME_STATES.GAMEOVER);
    }

    /**
     * Starts a new game session (transitions to PLAYING)
     * @returns {boolean} - Whether the transition was successful
     */
    startGame() {
        this.resetForNewGame();
        return this.transitionTo(GAME_STATES.PLAYING);
    }

    /**
     * Restarts game from game over (transitions to PLAYING)
     * @returns {boolean} - Whether the transition was successful
     */
    restartGame() {
        return this.startGame();
    }

    /**
     * Returns to title screen
     * @returns {boolean} - Whether the transition was successful
     */
    returnToTitle() {
        this.reset();
        return this.transitionTo(GAME_STATES.TITLE);
    }

    /**
     * Emits a transition event to registered callbacks
     * @param {GameState} from - Previous state
     * @param {GameState} to - New state
     * @private
     */
    _emitTransitionEvent(from, to) {
        const event = {
            from,
            to,
            timestamp: performance.now()
        };

        for (const callback of this.onTransitionCallbacks) {
            try {
                callback(event);
            } catch (error) {
                console.error('[GameStateManager] Transition callback error:', error);
            }
        }

        // Emit to game event bus if available
        if (this.game?.eventBus) {
            this.game.eventBus.emit('stateChange', event);
        }
    }

    /**
     * Registers a callback for state transitions
     * @param {Function} callback - Function to call on state transition
     * @returns {Function} - Function to unregister the callback
     */
    onTransition(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onTransition requires a function callback');
        }

        this.onTransitionCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.onTransitionCallbacks.indexOf(callback);
            if (index > -1) {
                this.onTransitionCallbacks.splice(index, 1);
            }
        };
    }

    // ============================================================================
    // STATE RESET
    // ============================================================================

    /**
     * Resets the game state to initial values
     * Restores TITLE state with default values
     * @param {Object} [options] - Reset options
     * @param {boolean} [options.keepHighScore=true] - Whether to preserve high score
     * @param {boolean} [options.resetState=true] - Whether to reset to TITLE state
     */
    reset(options = {}) {
        const {
            keepHighScore = true,
            resetState = true
        } = options;

        const previousHighScore = this.stateModel.highScore;

        // Reset state model to defaults
        this.stateModel = createDefaultStateModel();

        // Restore high score if preserved
        if (keepHighScore) {
            this.stateModel.highScore = previousHighScore;
        }

        // Transition to initial state if requested
        if (resetState) {
            this.currentState = GAME_STATES.TITLE;
            this.stateModel.state = GAME_STATES.TITLE;
        }

        if (this.debugMode) {
            console.log('[GameStateManager] State reset:', {
                highScorePreserved: keepHighScore,
                newState: this.currentState,
                highScore: this.stateModel.highScore
            });
        }

        // Emit reset event
        if (this.game?.eventBus) {
            this.game.eventBus.emit('gameStateReset', {
                highScorePreserved: keepHighScore,
                state: this.currentState
            });
        }
    }

    /**
     * Resets game state for a new playing session
     * Called when transitioning from Title/GameOver to Playing
     * @param {Object} [highScore] - Optional high score to set
     */
    resetForNewGame(highScore) {
        // Reset score and playing state
        this.stateModel.score = 0;
        this.stateModel.startTime = performance.now();
        this.stateModel.lastFrameTime = 0;

        // Update high score if provided
        if (typeof highScore === 'number' && highScore >= 0) {
            this.stateModel.highScore = highScore;
        }

        if (this.debugMode) {
            console.log('[GameStateManager] Reset for new game:', {
                score: this.stateModel.score,
                highScore: this.stateModel.highScore
            });
        }
    }

    /**
     * Updates the high score
     * @param {number} newHighScore - New high score value
     */
    updateHighScore(newHighScore) {
        if (typeof newHighScore === 'number' && newHighScore >= 0) {
            this.stateModel.highScore = newHighScore;

            if (this.debugMode) {
                console.log('[GameStateManager] High score updated:', newHighScore);
            }
        }
    }

    /**
     * Sets the asset loaded status
     * @param {boolean} loaded - Whether assets are loaded
     */
    setAssetsLoaded(loaded) {
        this.stateModel.assetsLoaded = Boolean(loaded);
    }

    /**
     * Sets the game initialized status
     * @param {boolean} initialized - Whether game is initialized
     */
    setInitialized(initialized) {
        this.stateModel.isInitialized = Boolean(initialized);
    }

    // ============================================================================
    // UPDATE AND INPUT HANDLING
    // ============================================================================

    /**
     * Updates state-specific logic
     * Delegates to the current state handler's update method
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        this.stateModel.lastFrameTime = performance.now();

        // Delegate to state handler's update method
        const handler = this.stateHandlers[this.currentState];
        if (handler && typeof handler.update === 'function') {
            handler.update(deltaTime);
        }
    }

    /**
     * Forces update of score from score manager
     * Call this after state handler updates
     * @private
     */
    _updateScore() {
        if (this.game?.scoreManager) {
            this.stateModel.score = this.game.scoreManager.getCurrent?.() ||
                                   this.game.scoreManager.getCurrentScore?.() ||
                                   0;
        }
    }

    /**
     * Handles input events by delegating to the current state handler
     * @param {Object} input - Input event data
     * @param {string} input.type - Type of input ('jump', 'pause', 'restart', 'escape')
     * @param {boolean} [input.isRepeat=false] - Whether this is a repeated key press
     */
    handleInput(input) {
        if (!input || typeof input.type !== 'string') {
            return;
        }

        // First, try to delegate to state handler's handleInput method
        const handler = this.stateHandlers[this.currentState];
        if (handler && typeof handler.handleInput === 'function') {
            handler.handleInput(input);
            return;
        }

        // Fallback to internal switch-based routing
        switch (this.currentState) {
            case GAME_STATES.TITLE:
                this._handleTitleInput(input);
                break;
            case GAME_STATES.PLAYING:
                this._handlePlayingInput(input);
                break;
            case GAME_STATES.PAUSED:
                this._handlePausedInput(input);
                break;
            case GAME_STATES.GAMEOVER:
                this._handleGameOverInput(input);
                break;
            default:
                break;
        }
    }

    /**
     * Handles input in TITLE state
     * @param {Object} input - Input event
     * @private
     */
    _handleTitleInput(input) {
        if (input.type === 'jump' || input.type === 'restart') {
            // Transition to PLAYING state
            this.resetForNewGame(this.stateModel.highScore);
            this.transitionTo(GAME_STATES.PLAYING);
        }
    }

    /**
     * Handles input in PLAYING state
     * @param {Object} input - Input event
     * @private
     */
    _handlePlayingInput(input) {
        if (input.type === 'pause') {
            // Transition to PAUSED state
            this.transitionTo(GAME_STATES.PAUSED);
        } else if (input.type === 'jump' || input.type === 'restart') {
            // Jump handling is delegated to the physics system
            // This is handled by the game loop via callbacks
        }
    }

    /**
     * Handles input in PAUSED state
     * @param {Object} input - Input event
     * @private
     */
    _handlePausedInput(input) {
        if (input.type === 'pause' || input.type === 'jump' || input.type === 'restart') {
            // Transition back to PLAYING state
            this.transitionTo(GAME_STATES.PLAYING);
        }
    }

    /**
     * Handles input in GAMEOVER state
     * @param {Object} input - Input event
     * @private
     */
    _handleGameOverInput(input) {
        if (input.type === 'jump' || input.type === 'restart') {
            // Transition to PLAYING state (restart game)
            this.resetForNewGame(this.stateModel.highScore);
            this.transitionTo(GAME_STATES.PLAYING);
        } else if (input.type === 'pause' && this.game?.config?.game?.allowTitleFromGameOver) {
            // Optional: Transition to TITLE state
            this.transitionTo(GAME_STATES.TITLE);
        }
    }

    // ============================================================================
    // DEBUG UTILITIES
    // ============================================================================

    /**
     * Gets a debug representation of the current state
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            currentState: this.currentState,
            stateModel: { ...this.stateModel },
            validTransitions: VALID_TRANSITIONS[this.currentState],
            isPlaying: this.isPlaying(),
            isPaused: this.isPaused(),
            isTitle: this.isTitle(),
            isGameOver: this.isGameOver()
        };
    }

    /**
     * Enables or disables debug mode
     * @param {boolean} enabled
     */
    setDebugMode(enabled) {
        this.debugMode = Boolean(enabled);
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export constants - all named exports for testing compatibility
export { GAME_STATES };
export { VALID_TRANSITIONS };

// Export class
export { GameStateManager };

// Export type for reference
export { GAME_STATES as GameState };

// Default export
export default GameStateManager;