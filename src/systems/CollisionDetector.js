/**
 * CollisionDetector.js - Collision Detection System for Flappy Kiro
 * 
 * Detects collisions between Kiro and game obstacles (pipes, boundaries).
 * Uses HitboxUtils for accurate circle-rectangle collision detection.
 * Emits Game_Over events via EventBus on collision detection.
 * 
 * Collision Types:
 * - PIPE_UPPER: Collision with upper pipe section
 * - PIPE_LOWER: Collision with lower pipe section
 * - CEILING: Kiro went above canvas
 * - GROUND: Kiro went below canvas
 * 
 * @module CollisionDetector
 */

import { CONFIG } from '../config.js';
import HitboxUtils from '../utils/HitboxUtils.js';

// ============================================================================
// COLLISION TYPE CONSTANTS
// ============================================================================

/**
 * Collision type identifiers
 * @readonly
 * @enum {string}
 */
const COLLISION_TYPES = Object.freeze({
    PIPE_UPPER: 'PIPE_UPPER',
    PIPE_LOWER: 'PIPE_LOWER',
    CEILING: 'CEILING',
    GROUND: 'GROUND',
    NONE: null
});

// ============================================================================
// COLLISION RESULT INTERFACE
// ============================================================================

/**
 * Collision result object structure
 * @typedef {Object} CollisionResult
 * @property {boolean} collided - Whether a collision occurred
 * @property {string|null} type - Type of collision (null if no collision)
 * @property {Object|null} kiroHitbox - Kiro's hitbox at time of collision
 * @property {Object|null} pipe - Pipe object involved in collision (if applicable)
 * @property {number} timestamp - Timestamp of collision detection
 */

// ============================================================================
// COLLISION DETECTOR CLASS
// ============================================================================

/**
 * CollisionDetector - Detects collisions between Kiro and game obstacles
 * 
 * Performs collision checks at the start of each frame before physics updates.
 * Uses HitboxUtils for accurate circle-rectangle collision detection.
 * Emits Game_Over events via EventBus when collisions are detected.
 * 
 * @class CollisionDetector
 * @property {Object} eventBus - Event bus for emitting collision events
 * @property {boolean} isEnabled - Whether collision detection is enabled
 * @property {Object} config - Collision configuration
 */
class CollisionDetector {
    /**
     * Creates a new CollisionDetector instance
     * 
     * @param {Object} options - Configuration options
     * @param {Object} [options.eventBus] - Event bus for emitting events
     * @param {Object} [options.config] - Custom configuration (uses CONFIG by default)
     */
    constructor(options = {}) {
        /**
         * Event bus for emitting game events
         * @type {Object|null}
         */
        this.eventBus = options.eventBus || null;
        
        /**
         * Whether collision detection is enabled
         * @type {boolean}
         */
        this.isEnabled = true;
        
        /**
         * Collision configuration
         * @type {Object}
         */
        this.config = options.config || CONFIG;
        
        /**
         * Collision types for reference
         * @type {Object}
         */
        this.COLLISION_TYPES = COLLISION_TYPES;
        
        /**
         * Last collision result for debugging/inspection
         * @type {CollisionResult|null}
         */
        this.lastResult = null;
    }
    
    // =========================================================================
    // PUBLIC API
    // =========================================================================
    
    /**
     * Checks if Kiro collides with a specific pipe.
     * Returns true if collision detected with either upper or lower pipe section.
     * Decorative caps are NOT checked (visual only).
     * 
     * @param {Object} kiro - Kiro entity with x, y, spriteWidth, spriteHeight
     * @param {Object} pipe - Pipe object with x, pipeWidth, gapPosition, gapHeight
     * @param {number} canvasHeight - Height of the game canvas
     * @returns {boolean} True if collision detected with the pipe
     * 
     * @example
     * const collided = detector.checkKiroPipeCollision(kiro, pipe, 640);
     * if (collided) { /* handle collision *\/ }
     */
    checkKiroPipeCollision(kiro, pipe, canvasHeight) {
        // Get Kiro's circular hitbox
        const kiroHitbox = HitboxUtils.getKiroHitbox(
            kiro.x,
            kiro.y,
            kiro.spriteWidth || this.config.hitbox.spriteWidth,
            kiro.spriteHeight || this.config.hitbox.spriteHeight,
            this.config.hitbox.inset
        );
        
        // Get pipe hitboxes (main body only - caps are non-collidable)
        const upperHitbox = HitboxUtils.getUpperPipeHitbox(pipe);
        const lowerHitbox = HitboxUtils.getLowerPipeHitbox(pipe, canvasHeight);
        
        // Check circle-rectangle collision for both pipe sections
        const upperCollision = HitboxUtils.checkCircleRectangleCollision(kiroHitbox, upperHitbox);
        const lowerCollision = HitboxUtils.checkCircleRectangleCollision(kiroHitbox, lowerHitbox);
        
        return upperCollision || lowerCollision;
    }
    
    /**
     * Checks if Kiro collides with boundaries (ceiling and/or ground).
     * Returns an object indicating which boundaries were breached.
     * 
     * @param {Object} kiro - Kiro entity with x, y, spriteWidth, spriteHeight
     * @param {number} canvasHeight - Height of the game canvas
     * @returns {{ ceiling: boolean, ground: boolean }} Boundary collision flags
     * 
     * @example
     * const { ceiling, ground } = detector.checkKiroBoundaryCollision(kiro, 640);
     * if (ceiling) console.log('Hit ceiling!');
     * if (ground) console.log('Hit ground!');
     */
    checkKiroBoundaryCollision(kiro, canvasHeight) {
        // Get Kiro's circular hitbox
        const kiroHitbox = HitboxUtils.getKiroHitbox(
            kiro.x,
            kiro.y,
            kiro.spriteWidth || this.config.hitbox.spriteWidth,
            kiro.spriteHeight || this.config.hitbox.spriteHeight,
            this.config.hitbox.inset
        );
        
        // Check boundary collisions
        return HitboxUtils.checkBoundaryCollision(kiroHitbox, canvasHeight);
    }
    
    /**
     * Performs comprehensive collision check against all obstacles.
     * Checks boundaries first (fastest), then pipes.
     * Returns detailed collision result including type and entity info.
     * 
     * This method is designed to be called at the start of each frame
     * before physics updates.
     * 
     * @param {Object} kiro - Kiro entity with x, y, spriteWidth, spriteHeight
     * @param {Object[]} pipes - Array of pipe objects
     * @param {number} canvasHeight - Height of the game canvas
     * @returns {CollisionResult} Detailed collision result
     * 
     * @example
     * const result = detector.checkAllCollisions(kiro, pipes, 640);
     * if (result.collided) {
     *     console.log('Collision detected:', result.type);
     * }
     */
    checkAllCollisions(kiro, pipes, canvasHeight) {
        // Get Kiro's hitbox once for reuse
        const kiroHitbox = HitboxUtils.getKiroHitbox(
            kiro.x,
            kiro.y,
            kiro.spriteWidth || this.config.hitbox.spriteWidth,
            kiro.spriteHeight || this.config.hitbox.spriteHeight,
            this.config.hitbox.inset
        );
        
        const result = {
            collided: false,
            type: COLLISION_TYPES.NONE,
            kiroHitbox: HitboxUtils.cloneHitbox(kiroHitbox),
            pipe: null,
            timestamp: performance.now()
        };
        
        // Check boundaries first (fastest)
        const boundaries = HitboxUtils.checkBoundaryCollision(kiroHitbox, canvasHeight);
        
        if (boundaries.ceiling) {
            result.collided = true;
            result.type = COLLISION_TYPES.CEILING;
            this._handleCollision(result, kiro);
            return result;
        }
        
        if (boundaries.ground) {
            result.collided = true;
            result.type = COLLISION_TYPES.GROUND;
            this._handleCollision(result, kiro);
            return result;
        }
        
        // Check each pipe for collision
        for (const pipe of pipes) {
            // Get pipe hitboxes
            const upperHitbox = HitboxUtils.getUpperPipeHitbox(pipe);
            const lowerHitbox = HitboxUtils.getLowerPipeHitbox(pipe, canvasHeight);
            
            // Check upper pipe collision
            if (HitboxUtils.checkCircleRectangleCollision(kiroHitbox, upperHitbox)) {
                result.collided = true;
                result.type = COLLISION_TYPES.PIPE_UPPER;
                result.pipe = pipe;
                this._handleCollision(result, kiro);
                return result;
            }
            
            // Check lower pipe collision
            if (HitboxUtils.checkCircleRectangleCollision(kiroHitbox, lowerHitbox)) {
                result.collided = true;
                result.type = COLLISION_TYPES.PIPE_LOWER;
                result.pipe = pipe;
                this._handleCollision(result, kiro);
                return result;
            }
        }
        
        // Store result for inspection
        this.lastResult = result;
        
        return result;
    }
    
    /**
     * Checks collision with a specific pipe section.
     * Useful for debugging or detailed collision reporting.
     * 
     * @param {Object} kiro - Kiro entity
     * @param {Object} pipe - Pipe object
     * @param {boolean} isUpper - Whether to check upper pipe (true) or lower (false)
     * @param {number} canvasHeight - Height of the game canvas
     * @returns {boolean} True if collision detected
     */
    checkPipeSectionCollision(kiro, pipe, isUpper, canvasHeight) {
        const kiroHitbox = HitboxUtils.getKiroHitbox(
            kiro.x,
            kiro.y,
            kiro.spriteWidth || this.config.hitbox.spriteWidth,
            kiro.spriteHeight || this.config.hitbox.spriteHeight,
            this.config.hitbox.inset
        );
        
        const pipeHitbox = isUpper
            ? HitboxUtils.getUpperPipeHitbox(pipe)
            : HitboxUtils.getLowerPipeHitbox(pipe, canvasHeight);
        
        return HitboxUtils.checkCircleRectangleCollision(kiroHitbox, pipeHitbox);
    }
    
    /**
     * Gets Kiro's current hitbox for external use.
     * 
     * @param {Object} kiro - Kiro entity
     * @returns {Object} Circular hitbox with centerX, centerY, radius, type
     */
    getKiroHitbox(kiro) {
        return HitboxUtils.getKiroHitbox(
            kiro.x,
            kiro.y,
            kiro.spriteWidth || this.config.hitbox.spriteWidth,
            kiro.spriteHeight || this.config.hitbox.spriteHeight,
            this.config.hitbox.inset
        );
    }
    
    /**
     * Gets a pipe's hitbox (upper or lower section).
     * 
     * @param {Object} pipe - Pipe object
     * @param {boolean} isUpper - Whether to get upper pipe (true) or lower (false)
     * @param {number} canvasHeight - Height of the game canvas
     * @returns {Object} Rectangle hitbox with x, y, width, height, type
     */
    getPipeHitbox(pipe, isUpper, canvasHeight) {
        return isUpper
            ? HitboxUtils.getUpperPipeHitbox(pipe)
            : HitboxUtils.getLowerPipeHitbox(pipe, canvasHeight);
    }
    
    /**
     * Resets internal state.
     * Clears last collision result and resets any counters.
     */
    reset() {
        this.lastResult = null;
        this.isEnabled = true;
    }
    
    /**
     * Enables or disables collision detection.
     * Useful for invincibility periods or debugging.
     * 
     * @param {boolean} enabled - Whether to enable collision detection
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }
    
    /**
     * Gets the last collision result for debugging.
     * 
     * @returns {CollisionResult|null} Last collision result or null
     */
    getLastResult() {
        return this.lastResult;
    }
    
    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================
    
    /**
     * Handles collision by emitting Game_Over event.
     * 
     * @param {CollisionResult} result - Collision result
     * @param {Object} kiro - Kiro entity
     * @private
     */
    _handleCollision(result, kiro) {
        // Store result for inspection
        this.lastResult = result;
        
        // Emit Game_Over event via EventBus
        if (this.eventBus) {
            this.eventBus.emit('Game_Over', {
                type: result.type,
                kiroPosition: { x: kiro.x, y: kiro.y },
                kiroHitbox: result.kiroHitbox,
                pipe: result.pipe,
                timestamp: result.timestamp
            });
        }
        
        // Emit legacy collision event for backward compatibility
        if (this.eventBus) {
            this.eventBus.emit('collision', {
                type: result.type,
                entity: result.pipe || 'boundary',
                kiroPosition: { x: kiro.x, y: kiro.y }
            });
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CollisionDetector, COLLISION_TYPES };

// Default export for convenience
export default CollisionDetector;