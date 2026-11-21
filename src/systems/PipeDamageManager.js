/**
 * PipeDamageManager.js - Pipe Damage Tracking System
 * 
 * Tracks damage state for pipe sections and renders pipes with holes.
 * Requirement 14.12-14.15
 */

export class PipeDamageManager {
    /**
     * Create a PipeDamageManager instance
     * @param {Object} config - Laser configuration from CONFIG.laser
     */
    constructor(config) {
        this.config = config;
        this.damageMap = new Map(); // pipeId -> { UPPER: { hits: 0, holes: [] }, LOWER: {...} }
    }

    /**
     * Register a hit on a pipe section
     * @param {Object} pipe - Pipe object
     * @param {string} section - 'UPPER' or 'LOWER'
     * @param {number} laserX - Laser X position when hit
     * @param {number} laserY - Laser Y position when hit
     */
    registerHit(pipe, section, laserX, laserY) {
        const pipeId = pipe.id || `${pipe.x}_${pipe.gapPosition}`;
        
        if (!this.damageMap.has(pipeId)) {
            this.damageMap.set(pipeId, {
                UPPER: { hits: 0, holes: [] },
                LOWER: { hits: 0, holes: [] }
            });
        }

        const pipeDamage = this.damageMap.get(pipeId);
        const sectionDamage = pipeDamage[section];

        // Record hit
        sectionDamage.hits++;

        // Record hole position
        if (sectionDamage.hits <= this.config.maxHolesPerSection) {
            sectionDamage.holes.push({
                x: laserX,
                y: laserY,
                radius: this.config.holeRadius
            });
        }
    }

    /**
     * Check if a pipe section is fully destroyed
     * @param {Object} pipe - Pipe object
     * @param {string} section - 'UPPER' or 'LOWER'
     * @returns {boolean} True if section is destroyed
     */
    isSectionDestroyed(pipe, section) {
        const pipeId = pipe.id || `${pipe.x}_${pipe.gapPosition}`;
        const damage = this.damageMap.get(pipeId);
        
        if (!damage) return false;
        
        return damage[section].hits >= this.config.maxHolesPerSection;
    }

    /**
     * Check if there's a hole at a specific position
     * @param {Object} pipe - Pipe object
     * @param {string} section - 'UPPER' or 'LOWER'
     * @param {number} x - X position to check
     * @param {number} y - Y position to check
     * @returns {boolean} True if there's a hole at position
     */
    hasHoleAt(pipe, section, x, y) {
        const pipeId = pipe.id || `${pipe.x}_${pipe.gapPosition}`;
        const damage = this.damageMap.get(pipeId);
        
        if (!damage) return false;

        const holes = damage[section].holes;
        for (const hole of holes) {
            const dx = x - hole.x;
            const dy = y - hole.y;
            if (dx * dx + dy * dy <= hole.radius * hole.radius) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get holes for a pipe section
     * @param {Object} pipe - Pipe object
     * @param {string} section - 'UPPER' or 'LOWER'
     * @returns {Array} Array of hole positions
     */
    getHoles(pipe, section) {
        const pipeId = pipe.id || `${pipe.x}_${pipe.gapPosition}`;
        const damage = this.damageMap.get(pipeId);
        
        if (!damage) return [];
        
        return damage[section].holes;
    }

    /**
     * Clear all damage for a specific pipe
     * @param {Object} pipe - Pipe object
     */
    clearDamage(pipe) {
        const pipeId = pipe.id || `${pipe.x}_${pipe.gapPosition}`;
        this.damageMap.delete(pipeId);
    }

    /**
     * Clean up damage records for pipes that are off-screen
     * @param {number} canvasWidth - Canvas width
     */
    cleanup(canvasWidth) {
        for (const [pipeId, damage] of this.damageMap) {
            // Parse pipeId to get x position (split on '_' so a negative
            // x value's leading '-' sign stays part of the number)
            const x = parseInt(pipeId.split('_')[0], 10);
            
            // If pipe is off-screen to the left, remove its damage
            if (x < -100) {
                this.damageMap.delete(pipeId);
            }
        }
    }

    /**
     * Render a pipe section with holes (if damaged)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} pipe - Pipe object
     * @param {string} section - 'UPPER' or 'LOWER'
     * @param {string} pipeColor - Base pipe color
     * @param {string} pipeOutline - Pipe outline color
     */
    renderPipeWithHoles(ctx, pipe, section, pipeColor = '#00AA00', pipeOutline = '#004400') {
        const pipeId = pipe.id || `${pipe.x}_${pipe.gapPosition}`;
        const damage = this.damageMap.get(pipeId);

        if (!damage) {
            // No damage, render normal pipe
            this._renderNormalSection(ctx, pipe, section, pipeColor, pipeOutline);
            return;
        }

        const sectionDamage = damage[section];

        if (sectionDamage.hits === 0) {
            // No hits, render normal pipe
            this._renderNormalSection(ctx, pipe, section, pipeColor, pipeOutline);
            return;
        }

        // Render with holes
        this._renderSectionWithHoles(ctx, pipe, section, sectionDamage.holes, pipeColor, pipeOutline);
    }

    /**
     * Render a normal pipe section
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} pipe - Pipe object
     * @param {string} section - 'UPPER' or 'LOWER'
     */
    _renderNormalSection(ctx, pipe, section, pipeColor, pipeOutline) {
        const pipeWidth = pipe.width || 52;
        
        ctx.save();
        ctx.fillStyle = pipeColor;
        ctx.strokeStyle = pipeOutline;
        ctx.lineWidth = 2;

        if (section === 'UPPER') {
            // Upper pipe: from top to gap
            const height = pipe.gapPosition;
            ctx.fillRect(pipe.x, 0, pipeWidth, height);
            ctx.strokeRect(pipe.x, 0, pipeWidth, height);
            
            // Add cap
            this._renderPipeCap(ctx, pipe.x, pipe.gapPosition - 10, pipeWidth, pipeColor, pipeOutline);
        } else {
            // Lower pipe: from gap bottom to bottom
            const lowerY = pipe.gapPosition + pipe.gapHeight;
            const height = 640 - lowerY;
            ctx.fillRect(pipe.x, lowerY, pipeWidth, height);
            ctx.strokeRect(pipe.x, lowerY, pipeWidth, height);
            
            // Add cap
            this._renderPipeCap(ctx, pipe.x, lowerY, pipeWidth, pipeColor, pipeOutline);
        }

        ctx.restore();
    }

    /**
     * Render a pipe section with holes
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} pipe - Pipe object
     * @param {string} section - 'UPPER' or 'LOWER'
     * @param {Array} holes - Array of hole positions
     */
    _renderSectionWithHoles(ctx, pipe, section, holes, pipeColor, pipeOutline) {
        const pipeWidth = pipe.width || 52;
        
        ctx.save();
        ctx.fillStyle = pipeColor;
        ctx.strokeStyle = pipeOutline;
        ctx.lineWidth = 2;

        // Calculate section bounds
        let sectionY, sectionHeight;
        if (section === 'UPPER') {
            sectionY = 0;
            sectionHeight = pipe.gapPosition;
        } else {
            sectionY = pipe.gapPosition + pipe.gapHeight;
            sectionHeight = 640 - sectionY;
        }

        // Create clipping region for holes
        ctx.beginPath();
        ctx.rect(pipe.x, sectionY, pipeWidth, sectionHeight);
        
        // Subtract holes from clipping region
        for (const hole of holes) {
            ctx.rect(
                hole.x - hole.radius,
                hole.y - hole.radius,
                hole.radius * 2,
                hole.radius * 2
            );
        }

        // Use even-odd rule to create holes
        ctx.clip('evenodd');

        // Draw pipe with holes
        ctx.fillRect(pipe.x, sectionY, pipeWidth, sectionHeight);
        ctx.strokeRect(pipe.x, sectionY, pipeWidth, sectionHeight);

        ctx.restore();

        // Draw hole outlines (optional - shows damage more clearly)
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (const hole of holes) {
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Render a pipe cap decoration
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Pipe width
     */
    _renderPipeCap(ctx, x, y, width, pipeColor, pipeOutline) {
        // Cap is a 10x10 rounded rectangle at the end of each pipe
        const capHeight = 10;
        
        ctx.save();
        ctx.fillStyle = pipeColor;
        ctx.strokeStyle = pipeOutline;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(x - 2, y, width + 4, capHeight, 3);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Get damage map for inspection
     * @returns {Map} Damage map
     */
    getDamageMap() {
        return this.damageMap;
    }

    /**
     * Reset all damage
     */
    reset() {
        this.damageMap.clear();
    }
}

// Export as default
export default PipeDamageManager;
