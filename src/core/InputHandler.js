/**
 * InputHandler - Handles user input events for Flappy Kiro
 * Maps keyboard, mouse, and touch inputs to game actions
 *
 * @module InputHandler
 */

import { CONFIG } from '../config.js';

// ============================================================================
// KEY CODES AND CONSTANTS
// ============================================================================

/**
 * Key code constants for input mapping
 */
const KEY_CODES = Object.freeze({
    KEY_L: 'KeyL',
    SPACE: 'Space',
    KEY_P: 'KeyP',
    ESCAPE: 'Escape'
});

/**
 * Key code numeric values (legacy support)
 */
const KEY_CODE_VALUES = Object.freeze({
    SPACE: 32,
    KEY_P: 80,
    ESCAPE: 27
});


// ============================================================================
// INPUT HANDLER CLASS
// ============================================================================

/**
 * InputHandler - Manages all user input for the game
 *
 * Handles keyboard, mouse, and touch inputs with debouncing
 * to prevent rapid duplicate inputs. Supports the following inputs:
 * - Spacebar: Jump action
 * - P key: Pause action
 * - ESC key: Pause action
 * - Mouse click: Jump action
 * - Touch tap: Jump action
 * - L key: Laser fire
 * - Right-click: Laser fire
 *
 * @class InputHandler
 */
class InputHandler {
    /**
     * Creates a new InputHandler instance
     * @param {HTMLElement} targetElement - The element to attach listeners to (usually canvas)
     */
    constructor(targetElement) {
        this.targetElement = targetElement;

        // Input state tracking
        this._jumpPressed = false;
        this._pausePressed = false;

        // Debounce timing
        this._lastJumpTime = 0;
        this._debounceWindow = CONFIG.game?.jumpDebounceMs || 50;

        // Callback storage
        this._jumpCallbacks = [];
        this._pauseCallbacks = [];
        this._restartCallbacks = [];
        this._laserCallbacks = [];

        // Bound handlers for cleanup
        this._boundKeyDown = this._handleKeyDown.bind(this);
        this._boundKeyUp = this._handleKeyUp.bind(this);
        this._boundMouseDown = this._handleMouseDown.bind(this);
        this._boundClick = this._handleClick.bind(this);
        this._boundTouchStart = this._handleTouchStart.bind(this);
        this._boundTouchEnd = this._handleTouchEnd.bind(this);
        this._boundContextMenu = this._handleContextMenu.bind(this);

        // Setup event listeners
        this._setupListeners();
    }

    // ============================================================================
    // EVENT LISTENER SETUP
    // ============================================================================

    /**
     * Sets up all event listeners
     * @private
     */
    _setupListeners() {
        // Keyboard events
        document.addEventListener('keydown', this._boundKeyDown);
        document.addEventListener('keyup', this._boundKeyUp);

        // Mouse events on target element
        if (this.targetElement) {
            this.targetElement.addEventListener('mousedown', this._boundMouseDown);
            this.targetElement.addEventListener('click', this._boundClick);
        }

        // Touch events on target element
        if (this.targetElement) {
            this.targetElement.addEventListener('touchstart', this._boundTouchStart, { passive: false });
            this.targetElement.addEventListener('touchend', this._boundTouchEnd, { passive: false });
        }

        // Right-click for laser fire
        document.addEventListener('contextmenu', this._boundContextMenu);
    }

    // ============================================================================
    // KEYBOARD HANDLERS
    // ============================================================================

    /**
     * Handles keydown events
     * @param {KeyboardEvent} event - The keyboard event
     * @private
     */
    _handleKeyDown(event) {
        const key = event.code || event.key;

        // Handle spacebar with debounce and default prevention
        if (key === KEY_CODES.SPACE || event.keyCode === KEY_CODE_VALUES.SPACE) {
            const now = performance.now();

            // Check debounce window
            if (now - this._lastJumpTime >= this._debounceWindow) {
                this._lastJumpTime = now;
                this._jumpPressed = true;
                this._triggerJump();
            }

            // Prevent default browser behavior (scrolling)
            event.preventDefault();
        }

        // Handle pause keys (P and ESC)
        if (key === KEY_CODES.KEY_P || event.keyCode === KEY_CODE_VALUES.KEY_P ||
            key === KEY_CODES.ESCAPE || event.keyCode === KEY_CODE_VALUES.ESCAPE) {
            this._pausePressed = true;
            this._triggerPause();
            event.preventDefault();
        }

        // Handle laser (L key)
        if (key === KEY_CODES.KEY_L) {
            this._triggerLaser();
            event.preventDefault();
        }
    }

    /**
     * Handles keyup events
     * @param {KeyboardEvent} event - The keyboard event
     * @private
     */
    _handleKeyUp(event) {
        const key = event.code || event.key;

        // Reset jump pressed state on space release
        if (key === KEY_CODES.SPACE || event.keyCode === KEY_CODE_VALUES.SPACE) {
            this._jumpPressed = false;
        }

        // Reset pause pressed state on P/ESC release
        if (key === KEY_CODES.KEY_P || event.keyCode === KEY_CODE_VALUES.KEY_P ||
            key === KEY_CODES.ESCAPE || event.keyCode === KEY_CODE_VALUES.ESCAPE) {
            this._pausePressed = false;
        }
    }

    // ============================================================================
    // MOUSE HANDLERS
    // ============================================================================

    /**
     * Handles mousedown events
     * @param {MouseEvent} event - The mouse event
     * @private
     */
    _handleMouseDown(event) {
        const now = performance.now();

        // Check debounce window
        if (now - this._lastJumpTime >= this._debounceWindow) {
            this._lastJumpTime = now;
            this._jumpPressed = true;
            this._triggerJump();
        }
    }

    /**
     * Handles click events
     * @param {MouseEvent} event - The mouse event
     * @private
     */
    _handleClick(event) {
        // Click is handled primarily by mousedown, but this provides fallback
        // for cases where mousedown might be consumed
    }

    // ============================================================================
    // TOUCH HANDLERS
    // ============================================================================

    /**
     * Handles touchstart events
     * @param {TouchEvent} event - The touch event
     * @private
     */
    _handleTouchStart(event) {
        // Prevent default to stop mouse emulation and scrolling
        event.preventDefault();

        const now = performance.now();

        // Check debounce window
        if (now - this._lastJumpTime >= this._debounceWindow) {
            this._lastJumpTime = now;
            this._jumpPressed = true;
            this._triggerJump();
        }
    }

    /**
     * Handles touchend events
     * @param {TouchEvent} event - The touch event
     * @private
     */
    _handleTouchEnd(event) {
        // Reset jump pressed state
        this._jumpPressed = false;
    }

    // ============================================================================
    // CONTEXT MENU (RIGHT-CLICK) HANDLER
    // ============================================================================

    /**
     * Handles context menu (right-click) for laser fire
     * @param {MouseEvent} event - The mouse event
     * @private
     */
    _handleContextMenu(event) {
        event.preventDefault();
        this._triggerLaser();
    }

    // ============================================================================
    // CALLBACK TRIGGERS
    // ============================================================================

    /**
     * Triggers all registered jump callbacks
     * @private
     */
    _triggerJump() {
        // Trigger jump callbacks
        for (const callback of this._jumpCallbacks) {
            try {
                callback();
            } catch (error) {
                console.error('[InputHandler] Jump callback error:', error);
            }
        }

        // Also trigger restart callbacks (jump can mean restart in some states)
        for (const callback of this._restartCallbacks) {
            try {
                callback();
            } catch (error) {
                console.error('[InputHandler] Restart callback error:', error);
            }
        }
    }

    /**
     * Triggers all registered pause callbacks
     * @private
     */
    _triggerPause() {
        for (const callback of this._pauseCallbacks) {
            try {
                callback();
            } catch (error) {
                console.error('[InputHandler] Pause callback error:', error);
            }
        }
    }

    /**
     * Triggers all registered laser callbacks
     * @private
     */
    _triggerLaser() {
        for (const callback of this._laserCallbacks) {
            try {
                callback();
            } catch (error) {
                console.error('[InputHandler] Laser callback error:', error);
            }
        }
    }

    // ============================================================================
    // PUBLIC API - STATE QUERY
    // ============================================================================

    /**
     * Returns whether the jump action is currently pressed
     * @returns {boolean} True if jump is pressed
     */
    isJumpPressed() {
        return this._jumpPressed;
    }

    /**
     * Returns whether the pause action is currently pressed
     * @returns {boolean} True if pause is pressed
     */
    isPausePressed() {
        return this._pausePressed;
    }

    // ============================================================================
    // PUBLIC API - CALLBACK REGISTRATION
    // ============================================================================

    /**
     * Registers a callback for jump actions
     * @param {Function} callback - Function to call on jump input
     * @returns {Function} Unsubscribe function
     */
    onJump(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onJump requires a function callback');
        }

        this._jumpCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this._jumpCallbacks.indexOf(callback);
            if (index > -1) {
                this._jumpCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Registers a callback for pause actions
     * @param {Function} callback - Function to call on pause input
     * @returns {Function} Unsubscribe function
     */
    onPause(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onPause requires a function callback');
        }

        this._pauseCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this._pauseCallbacks.indexOf(callback);
            if (index > -1) {
                this._pauseCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Registers a callback for restart actions
     * @param {Function} callback - Function to call on restart input
     * @returns {Function} Unsubscribe function
     */
    onRestart(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onRestart requires a function callback');
        }

        this._restartCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this._restartCallbacks.indexOf(callback);
            if (index > -1) {
                this._restartCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Registers a callback for laser actions
     * @param {Function} callback - Function to call on laser input
     * @returns {Function} Unsubscribe function
     */
    onLaser(callback) {
        if (typeof callback !== 'function') {
            throw new Error('onLaser requires a function callback');
        }

        this._laserCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this._laserCallbacks.indexOf(callback);
            if (index > -1) {
                this._laserCallbacks.splice(index, 1);
            }
        };
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    /**
     * Removes all event listeners and cleans up resources
     */
    destroy() {
        // Remove keyboard listeners
        document.removeEventListener('keydown', this._boundKeyDown);
        document.removeEventListener('keyup', this._boundKeyUp);

        // Remove mouse listeners
        if (this.targetElement) {
            this.targetElement.removeEventListener('mousedown', this._boundMouseDown);
            this.targetElement.removeEventListener('click', this._boundClick);
            this.targetElement.removeEventListener('touchstart', this._boundTouchStart);
            this.targetElement.removeEventListener('touchend', this._boundTouchEnd);
        }

        // Remove context menu listener
        document.removeEventListener('contextmenu', this._boundContextMenu);

        // Clear callback arrays
        this._jumpCallbacks = [];
        this._pauseCallbacks = [];
        this._restartCallbacks = [];
        this._laserCallbacks = [];

        // Reset state
        this._jumpPressed = false;
        this._pausePressed = false;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export constants
export const INPUT_KEY_CODES = KEY_CODES;
export const INPUT_KEY_CODE_VALUES = KEY_CODE_VALUES;

// Export class
export { InputHandler };

// Default export
export default InputHandler;
