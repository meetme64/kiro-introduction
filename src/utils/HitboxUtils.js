/**
 * HitboxUtils - Collision detection utilities for Flappy Kiro
 * 
 * Provides pure functions for calculating hitboxes and detecting collisions
 * between game entities (Kiro, pipes, boundaries).
 */

// ============================================================================
// Type Definitions / Interfaces
// ============================================================================

/**
 * Circle hitbox representation for Kiro's collision detection
 * @typedef {Object} CircleHitbox
 * @property {'circle'} type - Discriminator identifying this as a circle hitbox
 * @property {number} centerX - X coordinate of circle center
 * @property {number} centerY - Y coordinate of circle center
 * @property {number} radius - Circle radius in pixels
 */

/**
 * Rectangle hitbox representation for pipes and caps
 * @typedef {Object} RectangleHitbox
 * @property {'rectangle'} type - Discriminator identifying this as a rectangle hitbox
 * @property {number} x - X coordinate of left edge
 * @property {number} y - Y coordinate of top edge
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 */

/**
 * Axis-Aligned Bounding Box for rectangular collision checks
 * @typedef {Object} AABB
 * @property {number} x - X coordinate of left edge
 * @property {number} y - Y coordinate of top edge
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 */

/**
 * Boundary collision result
 * @typedef {Object} BoundaryCollision
 * @property {boolean} ceiling - Whether Kiro collided with ceiling
 * @property {boolean} ground - Whether Kiro collided with ground
 */

// ============================================================================
// Configuration
// ============================================================================

const HITBOX_CONFIG = {
    /** Default inset from sprite edges for hitbox calculation */
    defaultInset: 4
};

// ============================================================================
// Kiro Hitbox Functions
// ============================================================================

/**
 * Calculates Kiro's circular hitbox based on sprite position and dimensions.
 * The hitbox is centered on the sprite with a radius derived from the sprite
 * dimensions minus the configurable inset.
 * 
 * @param {number} x - Kiro's X position (left edge of sprite)
 * @param {number} y - Kiro's Y position (top edge of sprite)
 * @param {number} spriteWidth - Width of the sprite in pixels
 * @param {number} spriteHeight - Height of the sprite in pixels
 * @param {number} [inset=HITBOX_CONFIG.defaultInset] - Inset from sprite edges
 * @returns {CircleHitbox} The calculated circular hitbox
 * 
 * @example
 * // 40x40 sprite with default 4px inset
 * const hitbox = getKiroHitbox(100, 200, 40, 40);
 * // Returns: { type: 'circle', centerX: 120, centerY: 220, radius: 16 }
 */
export function getKiroHitbox(x, y, spriteWidth, spriteHeight, inset = HITBOX_CONFIG.defaultInset) {
    const hitboxWidth = spriteWidth - (inset * 2);
    const hitboxHeight = spriteHeight - (inset * 2);
    const radius = Math.min(hitboxWidth, hitboxHeight) / 2;

    return {
        type: 'circle',
        centerX: x + (spriteWidth / 2),
        centerY: y + (spriteHeight / 2),
        radius
    };
}

// ============================================================================
// Pipe Hitbox Functions
// ============================================================================

/**
 * Calculates a rectangular hitbox for a decorative pipe cap.
 * Used for visual-only elements that may have collision detection needs.
 * 
 * @param {number} pipeX - X position of the pipe
 * @param {number} pipeY - Y position of the pipe segment top
 * @param {number} pipeWidth - Width of the pipe
 * @param {number} pipeHeight - Height of the pipe segment
 * @returns {RectangleHitbox} The rectangular hitbox for the cap
 * 
 * @example
 * const hitbox = getPipeHitbox(400, 0, 60, 200);
 * // Returns: { type: 'rectangle', x: 400, y: 0, width: 60, height: 200 }
 */
export function getPipeHitbox(pipeX, pipeY, pipeWidth, pipeHeight) {
    return {
        type: 'rectangle',
        x: pipeX,
        y: pipeY,
        width: pipeWidth,
        height: pipeHeight
    };
}

/**
 * Calculates the rectangular hitbox for the upper section of a pipe.
 * The upper pipe extends from the top of the canvas to the gap's top edge.
 * 
 * @param {Object} pipe - The pipe object containing position and gap info
 * @param {number} pipe.x - X position of the pipe
 * @param {number} pipe.gapPosition - Y position of the gap's top edge
 * @param {number} pipe.gapHeight - Height of the gap between pipes
 * @param {number} pipe.pipeWidth - Width of the pipe
 * @returns {RectangleHitbox} The rectangular hitbox for the upper pipe section
 * 
 * @example
 * const pipe = { x: 400, gapPosition: 250, gapHeight: 180, pipeWidth: 60 };
 * const upperHitbox = getUpperPipeHitbox(pipe);
 * // Returns: { type: 'rectangle', x: 400, y: 0, width: 60, height: 250 }
 */
export function getUpperPipeHitbox(pipe) {
    return {
        type: 'rectangle',
        x: pipe.x,
        y: 0,
        width: pipe.pipeWidth,
        height: pipe.gapPosition
    };
}

/**
 * Calculates the rectangular hitbox for the lower section of a pipe.
 * The lower pipe extends from the gap's bottom edge to the bottom of the canvas.
 * 
 * @param {Object} pipe - The pipe object containing position and gap info
 * @param {number} pipe.x - X position of the pipe
 * @param {number} pipe.gapPosition - Y position of the gap's top edge
 * @param {number} pipe.gapHeight - Height of the gap between pipes
 * @param {number} pipe.pipeWidth - Width of the pipe
 * @param {number} canvasHeight - Height of the game canvas
 * @returns {RectangleHitbox} The rectangular hitbox for the lower pipe section
 * 
 * @example
 * const pipe = { x: 400, gapPosition: 250, gapHeight: 180, pipeWidth: 60 };
 * const lowerHitbox = getLowerPipeHitbox(pipe, 640);
 * // Returns: { type: 'rectangle', x: 400, y: 430, width: 60, height: 210 }
 */
export function getLowerPipeHitbox(pipe, canvasHeight) {
    const gapBottom = pipe.gapPosition + pipe.gapHeight;
    
    return {
        type: 'rectangle',
        x: pipe.x,
        y: gapBottom,
        width: pipe.pipeWidth,
        height: canvasHeight - gapBottom
    };
}

// ============================================================================
// AABB Intersection Functions
// ============================================================================

/**
 * Checks if two AABB (Axis-Aligned Bounding Boxes) intersect.
 * Uses the standard AABB intersection algorithm.
 * 
 * @param {AABB} a - First rectangle
 * @param {AABB} b - Second rectangle
 * @returns {boolean} True if the rectangles intersect
 * 
 * @example
 * const boxA = { x: 0, y: 0, width: 100, height: 100 };
 * const boxB = { x: 50, y: 50, width: 100, height: 100 };
 * const intersects = checkAABBIntersection(boxA, boxB);
 * // Returns: true
 */
export function checkAABBIntersection(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Checks if a circle and rectangle intersect using the closest-point algorithm.
 * Finds the closest point on the rectangle to the circle center and checks
 * if that point is within the circle's radius.
 * 
 * @param {CircleHitbox} circle - The circle hitbox
 * @param {RectangleHitbox} rect - The rectangle hitbox
 * @returns {boolean} True if the circle and rectangle intersect
 * 
 * @example
 * const circle = { type: 'circle', centerX: 100, centerY: 100, radius: 20 };
 * const rect = { type: 'rectangle', x: 90, y: 90, width: 50, height: 50 };
 * const collides = checkCircleRectangleCollision(circle, rect);
 * // Returns: true
 */
export function checkCircleRectangleCollision(circle, rect) {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(rect.x, Math.min(circle.centerX, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.centerY, rect.y + rect.height));
    
    // Calculate distance from circle center to closest point
    const distanceX = circle.centerX - closestX;
    const distanceY = circle.centerY - closestY;
    
    // Check if distance is less than circle radius
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    const radiusSquared = circle.radius * circle.radius;
    
    return distanceSquared < radiusSquared;
}

// ============================================================================
// Boundary Collision Functions
// ============================================================================

/**
 * Checks if Kiro's hitbox has collided with the ceiling.
 * The collision occurs when the top of the hitbox is above the canvas (y < 0).
 * 
 * @param {CircleHitbox} hitbox - Kiro's circular hitbox
 * @param {number} canvasHeight - Height of the game canvas
 * @returns {boolean} True if ceiling collision detected
 * 
 * @example
 * const hitbox = { type: 'circle', centerX: 100, centerY: -5, radius: 16 };
 * const collided = checkCeilingCollision(hitbox, 640);
 * // Returns: true (hitbox extends above canvas)
 */
export function checkCeilingCollision(hitbox, canvasHeight) {
    return (hitbox.centerY - hitbox.radius) < 0;
}

/**
 * Checks if Kiro's hitbox has collided with the ground.
 * The collision occurs when the bottom of the hitbox is below the canvas.
 * 
 * @param {CircleHitbox} hitbox - Kiro's circular hitbox
 * @param {number} canvasHeight - Height of the game canvas
 * @returns {boolean} True if ground collision detected
 * 
 * @example
 * const hitbox = { type: 'circle', centerX: 100, centerY: 650, radius: 16 };
 * const collided = checkGroundCollision(hitbox, 640);
 * // Returns: true (hitbox extends below canvas)
 */
export function checkGroundCollision(hitbox, canvasHeight) {
    return (hitbox.centerY + hitbox.radius) > canvasHeight;
}

/**
 * Checks both ceiling and ground boundary collisions simultaneously.
 * Returns a combined result for efficient boundary checking.
 * 
 * @param {CircleHitbox} hitbox - Kiro's circular hitbox
 * @param {number} canvasHeight - Height of the game canvas
 * @returns {BoundaryCollision} Object with ceiling and ground collision flags
 * 
 * @example
 * const hitbox = { type: 'circle', centerX: 100, centerY: 320, radius: 16 };
 * const result = checkBoundaryCollision(hitbox, 640);
 * // Returns: { ceiling: false, ground: false }
 */
export function checkBoundaryCollision(hitbox, canvasHeight) {
    return {
        ceiling: checkCeilingCollision(hitbox, canvasHeight),
        ground: checkGroundCollision(hitbox, canvasHeight)
    };
}

// ============================================================================
// Combined Collision Check Functions
// ============================================================================

/**
 * Checks if Kiro collides with a pipe (both upper and lower sections).
 * 
 * @param {CircleHitbox} kiroHitbox - Kiro's circular hitbox
 * @param {Object} pipe - The pipe object
 * @param {number} pipe.x - X position of the pipe
 * @param {number} pipe.gapPosition - Y position of the gap's top edge
 * @param {number} pipe.gapHeight - Height of the gap between pipes
 * @param {number} pipe.pipeWidth - Width of the pipe
 * @param {number} canvasHeight - Height of the game canvas
 * @returns {boolean} True if collision detected with either pipe section
 * 
 * @example
 * const kiroHitbox = { type: 'circle', centerX: 400, centerY: 250, radius: 16 };
 * const pipe = { x: 395, gapPosition: 200, gapHeight: 180, pipeWidth: 60 };
 * const collided = checkKiroPipeCollision(kiroHitbox, pipe, 640);
 */
export function checkKiroPipeCollision(kiroHitbox, pipe, canvasHeight) {
    const upperHitbox = getUpperPipeHitbox(pipe);
    const lowerHitbox = getLowerPipeHitbox(pipe, canvasHeight);
    
    return checkCircleRectangleCollision(kiroHitbox, upperHitbox) ||
           checkCircleRectangleCollision(kiroHitbox, lowerHitbox);
}

/**
 * Checks if Kiro collides with any boundaries or pipes.
 * Comprehensive collision check for game over detection.
 * 
 * @param {CircleHitbox} kiroHitbox - Kiro's circular hitbox
 * @param {Object[]} pipes - Array of pipe objects
 * @param {number} canvasHeight - Height of the game canvas
 * @returns {Object} Collision result with type and details
 * 
 * @example
 * const hitbox = getKiroHitbox(100, 320, 40, 40);
 * const result = checkAllCollisions(hitbox, pipes, 640);
 * // Returns: { hasCollision: true, type: 'PIPE' } or { hasCollision: false }
 */
export function checkAllCollisions(kiroHitbox, pipes, canvasHeight) {
    // Check boundaries first (fastest check)
    const boundaries = checkBoundaryCollision(kiroHitbox, canvasHeight);
    
    if (boundaries.ceiling) {
        return { hasCollision: true, type: 'CEILING' };
    }
    
    if (boundaries.ground) {
        return { hasCollision: true, type: 'GROUND' };
    }
    
    // Check each pipe for collision
    for (const pipe of pipes) {
        if (checkKiroPipeCollision(kiroHitbox, pipe, canvasHeight)) {
            return { hasCollision: true, type: 'PIPE' };
        }
    }
    
    return { hasCollision: false, type: null };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a deep copy of a hitbox for immutability.
 * 
 * @param {CircleHitbox|RectangleHitbox} hitbox - The hitbox to copy
 * @returns {CircleHitbox|RectangleHitbox} A new hitbox with the same properties
 * 
 * @example
 * const original = getKiroHitbox(100, 200, 40, 40);
 * const copy = cloneHitbox(original);
 */
export function cloneHitbox(hitbox) {
    return JSON.parse(JSON.stringify(hitbox));
}

/**
 * Checks if an object is a valid circle hitbox.
 * 
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if valid circle hitbox
 */
export function isCircleHitbox(obj) {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        obj.type === 'circle' &&
        typeof obj.centerX === 'number' &&
        typeof obj.centerY === 'number' &&
        typeof obj.radius === 'number'
    );
}

/**
 * Checks if an object is a valid rectangle hitbox.
 * 
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if valid rectangle hitbox
 */
export function isRectangleHitbox(obj) {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        obj.type === 'rectangle' &&
        typeof obj.x === 'number' &&
        typeof obj.y === 'number' &&
        typeof obj.width === 'number' &&
        typeof obj.height === 'number'
    );
}

// ============================================================================
// Default Export (convenience object)
// ============================================================================

/**
 * HitboxUtils module - All hitbox calculation and collision detection functions
 */
const HitboxUtils = {
    getKiroHitbox,
    getPipeHitbox,
    getUpperPipeHitbox,
    getLowerPipeHitbox,
    checkAABBIntersection,
    checkCircleRectangleCollision,
    checkCeilingCollision,
    checkGroundCollision,
    checkBoundaryCollision,
    checkKiroPipeCollision,
    checkAllCollisions,
    cloneHitbox,
    isCircleHitbox,
    isRectangleHitbox,
    HITBOX_CONFIG
};

export default HitboxUtils;