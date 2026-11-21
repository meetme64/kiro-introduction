/**
 * LaserSystem.js - Laser Weapon System
 * 
 * Manages laser beam firing, movement, cooldown timer, and collision detection.
 * Requirement 14.8-14.25
 */

export class LaserSystem {
    /**
     * Create a LaserSystem instance
     * @param {Object} config - Laser configuration from CONFIG.laser
     */
    constructor(config) {
        this.config = config;
        this.activeBeams = [];
        this.cooldownRemaining = 0;
        this.isReady = true;
    }

    /**
     * Fire a laser beam from Kiro's position
     * @param {number} kiroX - Kiro's X position
     * @param {number} kiroY - Kiro's Y position
     * @param {Function} onFire - Callback when laser is fired (for audio)
     * @returns {Object|null} The new beam or null if on cooldown
     */
    fireLaser(kiroX, kiroY, onFire) {
        // Check cooldown
        if (!this.isReady) {
            return null;
        }

        const beam = {
            x: kiroX + 40, // Start from front of Kiro sprite
            y: kiroY + 20, // Center vertically
            length: this.config.beamLength,
            speed: this.config.beamSpeed,
            maxLength: this.config.beamLength
        };

        this.activeBeams.push(beam);
        this.cooldownRemaining = this.config.cooldownFrames;
        this.isReady = false;

        // Trigger fire callback for audio
        if (onFire && typeof onFire === 'function') {
            onFire();
        }

        return beam;
    }

    /**
     * Update all laser beams
     * @param {number} dt - Delta time in seconds
     * @param {Array} pipes - Array of pipe objects
     * @param {PipeDamageManager} damageManager - Damage manager for pipe hits
     * @param {Function} onHit - Callback when laser hits pipe
     */
    update(dt, pipes, damageManager, onHit) {
        // Update cooldown
        if (!this.isReady) {
            this.cooldownRemaining--;
            if (this.cooldownRemaining <= 0) {
                this.cooldownRemaining = 0;
                this.isReady = true;
            }
        }

        // Update beams and check collisions
        const beamsToRemove = [];

        for (let i = 0; i < this.activeBeams.length; i++) {
            const beam = this.activeBeams[i];
            
            // Move beam
            beam.x += beam.speed;

            // Check if beam is off screen
            if (beam.x > 480 + beam.length) {
                beamsToRemove.push(i);
                continue;
            }

            // Check collision with pipes
            for (const pipe of pipes) {
                // Check upper section
                if (this._checkBeamCollision(beam, pipe, 'UPPER')) {
                    damageManager.registerHit(pipe, 'UPPER', beam.x, beam.y);
                    if (onHit) onHit();
                    beamsToRemove.push(i);
                    break;
                }

                // Check lower section
                if (this._checkBeamCollision(beam, pipe, 'LOWER')) {
                    damageManager.registerHit(pipe, 'LOWER', beam.x, beam.y);
                    if (onHit) onHit();
                    beamsToRemove.push(i);
                    break;
                }
            }
        }

        // Remove off-screen/hit beams (in reverse order to maintain indices)
        for (let i = beamsToRemove.length - 1; i >= 0; i--) {
            this.activeBeams.splice(beamsToRemove[i], 1);
        }
    }

    /**
     * Check if beam intersects with a pipe section
     * @param {Object} beam - Beam object
     * @param {Object} pipe - Pipe object
     * @param {string} section - 'UPPER' or 'LOWER'
     * @returns {boolean} True if collision detected
     */
    _checkBeamCollision(beam, pipe, section) {
        const beamEnd = beam.x + beam.length;
        
        // Check horizontal overlap
        if (beamEnd < pipe.x || beam.x > pipe.x + pipe.width) {
            return false;
        }

        // Check vertical overlap (fall back to permissive defaults when
        // vertical data is not supplied, so horizontal-only checks still work)
        const beamY = beam.y ?? 0;
        if (section === 'UPPER') {
            // Upper pipe: from 0 to gapPosition
            const gapPosition = pipe.gapPosition ?? Infinity;
            return beamY >= 0 && beamY <= gapPosition;
        } else {
            // Lower pipe: from gapPosition + gapHeight to bottom
            const lowerStart = (pipe.gapPosition ?? 0) + (pipe.gapHeight ?? 0);
            return beamY >= lowerStart && beamY <= 640;
        }
    }

    /**
     * Render all active laser beams
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderLaser(ctx) {
        const { colors } = this.config;

        for (const beam of this.activeBeams) {
            // Draw glow
            ctx.save();
            ctx.fillStyle = colors.glow;
            ctx.fillRect(beam.x, beam.y - 4, beam.length, 8);

            // Draw main beam
            ctx.fillStyle = colors.beam;
            ctx.fillRect(beam.x, beam.y - 2, beam.length, 4);

            // Draw core
            ctx.fillStyle = colors.beamCore;
            ctx.fillRect(beam.x, beam.y - 1, beam.length, 2);
            ctx.restore();
        }
    }

    /**
     * Render the cooldown timer UI
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    renderLaserTimer(ctx, canvasWidth, canvasHeight) {
        ctx.save();

        // Position: bottom left corner
        const x = 20;
        const y = canvasHeight - 30;

        // Format timer text
        let text;
        let color;

        if (this.isReady) {
            text = 'LASER: READY';
            color = '#4ECDC4';
        } else {
            const secondsRemaining = (this.cooldownRemaining / 60).toFixed(1);
            text = `LASER: ${secondsRemaining}s`;
            color = '#FF6B6B';
        }

        // Draw text
        ctx.font = '16px monospace';
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);

        ctx.restore();
    }

    /**
     * Get the cooldown state
     * @returns {Object} Cooldown state
     */
    getCooldownState() {
        const isReady = this.cooldownRemaining <= 0;
        return {
            remaining: this.cooldownRemaining,
            isReady,
            framesRemaining: this.cooldownRemaining,
            secondsRemaining: this.cooldownRemaining / 60
        };
    }

    /**
     * Get active beams
     * @returns {Array} Array of active beam objects
     */
    getActiveBeams() {
        return this.activeBeams;
    }

    /**
     * Reset the laser system
     */
    reset() {
        this.activeBeams = [];
        this.cooldownRemaining = 0;
        this.isReady = true;
    }
}

// Export as default
export default LaserSystem;
