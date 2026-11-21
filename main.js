/**
 * main.js - Flappy Kiro Game Entry Point
 *
 * Initializes all game systems after the DOM is ready.
 * Uses ES modules for proper import/export support.
 */

import { GameLoop } from './src/core/GameLoop.js';
import { CONFIG } from './config.js';
import { GameStateManager } from './src/core/GameStateManager.js';
import { InputHandler } from './src/core/InputHandler.js';
import { PhysicsEngine } from './src/systems/PhysicsEngine.js';
import { CollisionDetector } from './src/systems/CollisionDetector.js';
import ScoreManager from './src/components/ScoreManager.js';
import CloudManager from './src/components/CloudManager.js';
import PipeManager from './src/components/PipeManager.js';
import CanvasRenderer from './src/rendering/CanvasRenderer.js';
import { AssetLoader } from './src/assets/AssetLoader.js';
import { AudioEngine } from './src/audio/AudioEngine.js';
import { UIManager } from './src/ui/UIManager.js';
import TitleScreen from './src/ui/TitleScreen.js';
import GameOverScreen from './src/ui/GameOverScreen.js';
import { HUD } from './src/ui/HUD.js';
import { GameAssets } from './src/assets/assets.js';
import { LaserSystem } from './src/systems/LaserSystem.js';
import { PipeDamageManager } from './src/systems/PipeDamageManager.js';
import { Cape } from './src/entities/Cape.js';

// ============================================================================
// GAME READY STATE
// ============================================================================

/**
 * Tracks the initialization state of the game.
 * @readonly
 * @enum {string}
 */
const GAME_READY_STATES = Object.freeze({
    INITIALIZING: 'INITIALIZING',
    READY: 'READY',
    ERROR: 'ERROR'
});

/**
 * Game initialization state tracker.
 * @type {string}
 */
let gameReadyState = GAME_READY_STATES.INITIALIZING;

/**
 * Sets the game ready state and logs the transition.
 * @param {string} newState - The new state to set
 * @param {string} [message] - Optional message for logging
 */
function setGameReadyState(newState, message) {
    const oldState = gameReadyState;
    gameReadyState = newState;
    console.log(`[GameState] ${oldState} -> ${newState}${message ? ': ' + message : ''}`);
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

/**
 * Global error handler for uncaught exceptions during initialization.
 * @param {Error} error - The error that was thrown
 * @param {string} context - Context where the error occurred
 */
function handleInitializationError(error, context) {
    console.error(`[Error] Initialization failed in ${context}:`, error);
    setGameReadyState(GAME_READY_STATES.ERROR, error.message);

    // Attempt to show error to user via console
    console.error(`
========================================
Flappy Kiro Initialization Error
========================================
Context: ${context}
Error: ${error.message}

Please check the browser console for details.
Refresh the page to retry initialization.
========================================
    `);
}

/**
 * Wraps a function with error boundary handling.
 * @param {Function} fn - Function to wrap
 * @param {string} context - Context name for error messages
 * @returns {Function} Wrapped function with error handling
 */
function withErrorBoundary(fn, context) {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            handleInitializationError(error, context);
            throw error; // Re-throw after logging
        }
    };
}

// ============================================================================
// EVENT BUS (Simple implementation for game events)
// ============================================================================

/**
 * Simple event bus for game-wide events
 */
const eventBus = {
    listeners: new Map(),

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    },

    off(event, callback) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            const index = handlers.indexOf(callback);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    },

    emit(event, data) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[EventBus] Error in ${event} handler:`, error);
                }
            });
        }
    },

    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
};

// ============================================================================
// GAME INITIALIZATION
// ============================================================================

/**
 * Main game initialization function.
 * Sets up all game systems and starts the game loop.
 */
async function initGame() {
    console.log('[Init] Starting Flappy Kiro initialization...');

    try {
        // Phase 1: Canvas and Renderer Setup
        console.log('[Init] Phase 1: Setting up canvas and renderer...');
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element #gameCanvas not found');
        }
        console.log(`[Init] Canvas found: ${canvas.width}x${canvas.height}`);

        const rendererConfig = {
            baseWidth: CONFIG.canvasWidth || 480,
            baseHeight: CONFIG.canvasHeight || 640,
            maxWidth: CONFIG.canvasWidth || 480,
            maxHeight: CONFIG.canvasHeight || 640,
            skyColor: '#70C5CE'
        };
        const renderer = new CanvasRenderer(canvas, rendererConfig);
        console.log('[Init] CanvasRenderer initialized');

        // Phase 2: Asset Loading (async, non-blocking)
        console.log('[Init] Phase 2: Loading assets asynchronously...');
        const assetLoader = new AssetLoader();
        const { ASSET_MANIFEST } = GameAssets;

        // Load assets without blocking - game can start with missing assets
        const assetLoadPromise = assetLoader.loadAll(ASSET_MANIFEST)
            .then((progress) => {
                console.log(`[AssetLoader] Assets loaded: ${progress.loaded}/${progress.total} (${progress.percent.toFixed(1)}%)`);
                if (assetLoader.hasErrors()) {
                    console.warn('[AssetLoader] Some assets failed to load:', assetLoader.getErrors());
                }
            })
            .catch((error) => {
                console.warn('[AssetLoader] Asset loading encountered an error:', error.message);
            });

        // Phase 3: Initialize Audio Engine
        console.log('[Init] Phase 3: Initializing audio engine...');
        const audioEngine = new AudioEngine();

        try {
            await audioEngine.init();
            console.log('[AudioEngine] Audio context initialized successfully');
        } catch (audioError) {
            console.warn('[AudioEngine] Audio initialization failed - continuing without audio:', audioError.message);
            console.warn('[AudioEngine] This may be due to browser autoplay policies or lack of Web Audio API support');
        }

        // Phase 4: Initialize Game Systems
        console.log('[Init] Phase 4: Initializing game systems...');

        // Create event bus reference for game object
        const eventBusRef = eventBus;

        // Create game state manager
        const gameStateManager = new GameStateManager(null);
        console.log('[GameStateManager] Initialized');

        // Create input handler
        const inputHandler = new InputHandler(null);
        console.log('[InputHandler] Initialized');

        // Create physics engine
        const physicsEngine = new PhysicsEngine(CONFIG);
        console.log('[PhysicsEngine] Initialized');

        // Create collision detector
        const collisionDetector = new CollisionDetector();
        console.log('[CollisionDetector] Initialized');

        // Create score manager
        const scoreManager = new ScoreManager(CONFIG);
        console.log(`[ScoreManager] High score loaded: ${scoreManager.getHighScore()}`);

        // Create cloud manager
        const cloudManager = new CloudManager(CONFIG);
        console.log('[CloudManager] Initialized');

        // Phase 5: Difficulty and Pipe Management
        console.log('[Init] Phase 5: Setting up difficulty and pipes...');

        // Create difficulty manager
        const difficultyManager = {
            currentTier: 0,
            getDifficulty() {
                // NOTE: difficulty tiers live under CONFIG.difficulty (not
                // CONFIG.pipes - that key doesn't exist on the flat root
                // config.js). Using the wrong key threw
                // "Cannot read properties of undefined (reading
                // 'speedMultipliers')" on every pipe spawn attempt, which
                // silently aborted PipeManager.update() (and everything
                // GameStateManager.update() still had queued after it)
                // once every wallPairSpacing frames.
                const tier = Math.min(this.currentTier, CONFIG.difficulty.speedMultipliers.length - 1);
                // Base horizontal scroll speed (Requirement 1: 2.0 px/frame).
                // There's no dedicated "base speed" field on the flat root
                // config.js, so it's defined here and scaled by the tier
                // multiplier, matching the documented difficulty table.
                const baseSpeed = 2.0;
                return {
                    speed: baseSpeed * CONFIG.difficulty.speedMultipliers[tier],
                    gapSize: CONFIG.difficulty.gapSizes[tier] ?? CONFIG.difficulty.gapSizes[CONFIG.difficulty.gapSizes.length - 1],
                    tier: this.currentTier
                };
            },
            reset() {
                this.currentTier = 0;
            },
            update(score) {
                const thresholds = CONFIG.difficulty.scoreThresholds;
                let newTier = 0;
                for (let i = 0; i < thresholds.length; i++) {
                    if (score >= thresholds[i]) {
                        newTier = i + 1;
                    }
                }
                this.currentTier = newTier;

                // Emit difficulty change event
                eventBusRef.emit('difficultyChange', {
                    tier: this.currentTier,
                    ...this.getDifficulty()
                });
            }
        };
        console.log('[DifficultyManager] Initialized');

        // Create pipe manager with difficulty reference
        const pipeManager = new PipeManager(CONFIG, difficultyManager);
        console.log('[PipeManager] Initialized');

        // Phase 6: UI System Setup
        console.log('[Init] Phase 6: Setting up UI system...');

        const uiManager = new UIManager();
        console.log('[UIManager] Initialized');

        // Create and register UI components
        const titleScreen = new TitleScreen(renderer, scoreManager);
        const gameOverScreen = new GameOverScreen(renderer, scoreManager);
        const hud = new HUD();

        uiManager.registerScreen('title', titleScreen);
        uiManager.registerScreen('gameOver', gameOverScreen);
        uiManager.registerScreen('hud', hud);
        console.log('[UI] Screens registered');

        // Phase 7: Create Game Object
        console.log('[Init] Phase 7: Creating game object...');

        const game = {
            // Core systems
            canvas,
            renderer,
            stateManager: gameStateManager,
            inputHandler,
            physicsEngine,
            collisionDetector,
            scoreManager,
            pipeManager,
            cloudManager,
            audioEngine,
            uiManager,
            assetLoader,
            eventBus: eventBusRef,

            // Difficulty management
            difficulty: difficultyManager,

            // Laser system (Requirement 14)
            laserSystem: new LaserSystem(CONFIG.laser),
            damageManager: new PipeDamageManager(CONFIG.laser),

            // Game entities
            kiro: {
                x: CONFIG.hitbox?.spriteWidth || 100,
                y: CONFIG.canvasHeight / 2,
                velocity: 0,
                width: CONFIG.hitbox?.spriteWidth || 34,
                height: CONFIG.hitbox?.spriteHeight || 24,
                rotation: 0,

                // Cape system (Requirement 14) - delegates to a Cape instance
                // while keeping the plain x/y/velocity/rotation properties
                // that GameStateManager reads and mutates directly.
                _cape: new Cape(CONFIG.cape),
                getPosition() {
                    return { x: this.x, y: this.y };
                },
                getVelocity() {
                    return this.velocity;
                },
                getRotation() {
                    return this.rotation;
                },
                updateCape(dt) {
                    this._cape.update(dt, this.velocity, this.rotation);
                },
                renderCape(ctx) {
                    this._cape.render(ctx, this.x, this.y, this.rotation);
                },

                // Physics (Requirement 1). Previously missing entirely -
                // `game.kiro` was a static data object with no update/jump
                // methods, while PhysicsEngine tracked its own private,
                // disconnected position. GameStateManager.PlayingStateHandler
                // already calls `kiro.update?.(dt, ...)` every frame and
                // InputHandler's jump callback calls `kiro.jump?.()`
                // directly - both were silently no-op'ing via optional
                // chaining, so Kiro never moved.
                jump() {
                    // CONFIG.jumpStrength (-6) is defined in "px per
                    // 1/60-sec frame" units - velocity stays in that same
                    // unit throughout, so no conversion is needed here.
                    this.velocity = CONFIG.jumpStrength;
                },
                update(dtMs) {
                    // GameStateManager.update(deltaTime) is called from
                    // GameLoop with `this.deltaTimeMs` (milliseconds), and
                    // forwards that value straight through to
                    // `kiro.update?.(deltaTime, ...)` unconverted.
                    //
                    // CONFIG.gravity/terminalVelocity/jumpStrength are all
                    // tuned as "per 1/60-sec frame" quantities (e.g.
                    // gravity: 0.25 means +0.25 px/frame of velocity every
                    // frame at a 60 FPS reference rate). Converting those
                    // into a continuous px/sec^2 acceleration and
                    // integrating with `dt` in seconds requires *two*
                    // factors of 60 (one for velocity's unit, one because
                    // gravity is a per-tick increment, not a per-second
                    // rate) - using only one factor made gravity 60x too
                    // weak, so Kiro never stopped rising after a jump.
                    // Working directly in "frame-equivalents" avoids the
                    // conversion entirely and matches the original
                    // discrete-frame model exactly when running at 60 FPS.
                    const frameEquivalent = (dtMs / 1000) * 60;

                    this.velocity += CONFIG.gravity * frameEquivalent;
                    this.velocity = Math.max(
                        -CONFIG.terminalVelocity,
                        Math.min(CONFIG.terminalVelocity, this.velocity)
                    );
                    this.y += this.velocity * frameEquivalent;

                    const rotationRate = CONFIG.kiro?.rotationSpeed || 3;
                    const maxUp = CONFIG.kiro?.minRotation ?? -90;
                    const maxDown = CONFIG.kiro?.maxRotation ?? 30;
                    const targetRotation = this.velocity * rotationRate;
                    this.rotation = Math.max(maxUp, Math.min(maxDown, targetRotation));
                }
            },

            // Game state
            pipes: [],
            clouds: [],
            isPlaying: false,
            isPaused: false,

            // Reset method
            reset() {
                this.kiro.x = CONFIG.hitbox?.spriteWidth || 100;
                this.kiro.y = CONFIG.canvasHeight / 2;
                this.kiro.velocity = 0;
                this.kiro.rotation = 0;
                this.pipes = [];
                this.clouds = [];
                this.scoreManager.reset();
                this.difficulty.reset();
                this.pipeManager.reset();
                this.cloudManager.reset();
                this.isPlaying = true;
                this.isPaused = false;

                // Emit reset event
                this.eventBus.emit('gameReset', {});
            }
        };

        // Connect circular references
        gameStateManager.game = game;
        inputHandler.game = game;
        console.log('[Game] Game object created and references connected');

        // Phase 8: Game Loop Setup
        console.log('[Init] Phase 8: Setting up game loop...');

        const gameLoop = new GameLoop(game, {
            targetFPS: CONFIG.targetFPS || 60,
            enableProfiling: CONFIG.game?.debugMode || false
        });
        console.log('[GameLoop] Initialized');

        // Connect input to game state manager
        inputHandler.onJump(() => {
            game.stateManager.handleInput({ type: 'jump' });

            // GameStateManager's PLAYING handler intentionally does not
            // apply the jump itself (see its _handlePlayingInput comment:
            // "Jump is handled by the game loop via the physics system /
            // This is set up through inputHandler.onJump callback") - but
            // nothing ever actually called kiro.jump() here, so pressing
            // space/clicking never moved Kiro. Apply it directly when
            // actively playing.
            if (game.stateManager.getState() === 'PLAYING' && typeof game.kiro.jump === 'function') {
                game.kiro.jump();
                game.audioEngine?.playJump?.();
            }
        });

        inputHandler.onPause(() => {
            game.stateManager.handleInput({ type: 'pause' });
        });

        inputHandler.onRestart(() => {
            game.stateManager.handleInput({ type: 'restart' });
        });

        // Connect laser input
        inputHandler.onLaser(() => {
            if (game.stateManager.getState() === 'PLAYING' && game.laserSystem.isReady) {
                const kiroPos = game.kiro.getPosition();
                game.laserSystem.fireLaser(kiroPos.x, kiroPos.y, () => {
                    game.audioEngine.playLaserFire(CONFIG.laser.soundVolume.fire);
                });
            }
        });

        // Connect game state manager to pause/resume loop
        game.stateManager.onTransition((event) => {
            if (event.to === 'PAUSED' && gameLoop.getIsRunning()) {
                gameLoop.pause();
            } else if (event.to === 'PLAYING' && gameLoop.getIsPaused()) {
                gameLoop.resume();
            }
        });
        console.log('[GameLoop] Connected to state manager for pause/resume');

        // Listen for state changes to handle game flow
        eventBusRef.on('stateChange', (event) => {
            if (event.to === 'PLAYING') {
                game.isPlaying = true;
                game.isPaused = false;
            } else if (event.to === 'PAUSED') {
                game.isPaused = true;
            } else if (event.to === 'GAMEOVER' || event.to === 'TITLE') {
                game.isPlaying = false;
            }
        });

        // Phase 9: Start Systems
        console.log('[Init] Phase 9: Starting systems...');

        // Wait for asset loading to complete (non-blocking for game start)
        await assetLoadPromise;

        // Start the game loop
        gameLoop.start();
        console.log('[GameLoop] Started');

        // Show title screen
        uiManager.showScreen('title');
        console.log('[UI] Title screen displayed');

        // =========================================================================
        // GAME READY - Mark initialization complete
        // =========================================================================
        setGameReadyState(GAME_READY_STATES.READY, 'All systems initialized');
        console.log('[Init] ========================================');
        console.log('[Init] Flappy Kiro is ready to play!');
        console.log('[Init] ========================================');

        return { game, gameLoop, gameStateManager, uiManager };

    } catch (error) {
        handleInitializationError(error, 'initGame');
        throw error;
    }
}

// ============================================================================
// DOM READY HANDLER
// ============================================================================

/**
 * Handles DOMContentLoaded event and starts game initialization.
 */
async function onDOMReady() {
    console.log('[DOM] DOMContentLoaded event fired');
    console.log('[DOM] Document readyState:', document.readyState);

    // Start initialization
    try {
        const result = await initGame();
        console.log('[DOM] Game initialization completed successfully');

        // Store references for debugging
        if (typeof window !== 'undefined') {
            window.GameRefs = result;
        }

    } catch (error) {
        console.error('[DOM] Game initialization failed:', error);
        // Error is already handled by the error boundary in initGame
    }
}

// ============================================================================
// STARTUP
// ============================================================================

// Check if DOM is already loaded
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDOMReady, { once: true });
        console.log('[Startup] Waiting for DOMContentLoaded...');
    } else {
        // DOM already loaded (e.g., defer script or script at end of body)
        console.log('[Startup] DOM already ready, readyState:', document.readyState);
        // Use setTimeout to allow other deferred scripts to run first
        setTimeout(onDOMReady, 0);
    }
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

// Expose minimal debug API to window for development
if (typeof window !== 'undefined') {
    window.FlappyKiro = {
        version: '1.0.0',
        getReadyState: () => gameReadyState,
        isReady: () => gameReadyState === GAME_READY_STATES.READY,
        getReadyStates: () => Object.assign({}, GAME_READY_STATES),
        getEventBus: () => eventBus
    };
    console.log('[Debug] FlappyKiro debug API exposed at window.FlappyKiro');
}

// Export for module usage
export { initGame, eventBus, GAME_READY_STATES };
