/**
 * Cape.js - Cape Rendering Entity
 * 
 * Renders a flowing red cape behind Kiro that animates based on movement.
 * Requirement 14.1-14.7
 */

export class Cape {
    /**
     * Create a Cape instance
     * @param {Object} config - Cape configuration from CONFIG.cape
     */
    constructor(config) {
        this.config = config;
        this.state = this.createCape();
    }

    /**
     * Initialize cape state
     * @returns {Object} Cape state object
     */
    createCape() {
        return {
            flowOffset: 0,
            currentHeight: 24,
            rotation: 0
        };
    }

    /**
     * Update cape animation based on Kiro's movement
     * @param {number} dt - Delta time in seconds
     * @param {number} kiroVelocity - Kiro's vertical velocity (negative = up)
     * @param {number} kiroRotation - Kiro's current rotation in degrees
     */
    update(dt, kiroVelocity, kiroRotation) {
        this._updateCapeAnimation(dt, kiroVelocity, kiroRotation);
    }

    /**
     * Internal animation update
     * @param {number} dt - Delta time
     * @param {number} velocity - Vertical velocity
     * @param {number} rotation - Kiro rotation
     */
    _updateCapeAnimation(dt, velocity, rotation) {
        const { flowSpeed, maxFlowOffset, minHeight, maxHeight } = this.config;

        // Calculate flow direction based on velocity
        // Negative velocity (jumping) = cape flows upward
        // Positive velocity (falling) = cape drags downward
        let flowDirection = 0;
        if (velocity < 0) {
            flowDirection = -1; // Flow up when jumping
        } else if (velocity > 0) {
            flowDirection = 1; // Drag down when falling
        }

        // Update flow offset
        const flowChange = flowDirection * flowSpeed * 60 * dt; // 60 FPS reference
        this.state.flowOffset = Math.max(
            -maxFlowOffset,
            Math.min(maxFlowOffset, this.state.flowOffset + flowChange)
        );

        // Adjust height based on flow
        // More flow = longer cape appearance
        const flowRatio = Math.abs(this.state.flowOffset) / maxFlowOffset;
        this.state.currentHeight = minHeight + (maxHeight - minHeight) * flowRatio;

        // Cape follows Kiro rotation but with some lag for natural effect
        this.state.rotation = rotation * 0.8;
    }

    /**
     * Render the cape behind Kiro
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} kiroX - Kiro's X position
     * @param {number} kiroY - Kiro's Y position
     * @param {number} kiroRotation - Kiro's rotation in degrees
     */
    render(ctx, kiroX, kiroY, kiroRotation) {
        const { width, color, secondaryColor, anchorOffset } = this.config;
        
        // Calculate anchor point (behind Kiro)
        const anchorX = kiroX + anchorOffset;
        const anchorY = kiroY;

        // Save context for rotation
        ctx.save();

        // Translate to anchor point
        ctx.translate(anchorX, anchorY);

        // Apply cape rotation based on Kiro's current rotation
        const capeRotation = kiroRotation * (Math.PI / 180);
        ctx.rotate(capeRotation);

        // Draw cape shape
        const height = this.state.currentHeight;
        const flowOffset = this.state.flowOffset;

        // Create cape path - flows opposite to movement
        ctx.beginPath();
        
        // Top edge (attached to Kiro)
        ctx.moveTo(0, -height / 2);
        ctx.lineTo(width, -height / 2);

        // Right edge with flow animation
        ctx.lineTo(width + flowOffset, height / 2);

        // Bottom edge
        ctx.lineTo(0 + flowOffset * 0.5, height / 2);

        // Close back to top
        ctx.lineTo(0, -height / 2);
        ctx.closePath();

        // Fill with primary color
        ctx.fillStyle = color;
        ctx.fill();

        // Add shading (secondary color on one side)
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(width * 0.6, -height / 2, width * 0.4, height);

        // Restore primary color after shading
        ctx.fillStyle = color;

        // Add subtle outline
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Restore context
        ctx.restore();
    }

    /**
     * Get current cape state for debugging
     * @returns {Object} Current animation state
     */
    getState() {
        return {
            flowOffset: this.state.flowOffset,
            currentHeight: this.state.currentHeight,
            rotation: this.state.rotation
        };
    }

    /**
     * Reset cape to initial state
     */
    reset() {
        this.state = this.createCape();
    }
}
