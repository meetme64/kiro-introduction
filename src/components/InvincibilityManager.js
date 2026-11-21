/**
 * InvincibilityManager - Manages invincibility power-up state
 * Handles activation, timer, and collision immunity
 */
class InvincibilityManager {
    constructor(config) {
        this.config = config;
        this.isActive = false;
        this.duration = config.invincibilityDuration || 5000;
        this.timer = 0;
    }

    activate() {
        this.isActive = true;
        this.timer = this.duration;
    }

    update(dt) {
        if (this.isActive) {
            this.timer -= dt * 1000;
            if (this.timer <= 0) {
                this.deactivate();
            }
        }
    }

    deactivate() {
        this.isActive = false;
        this.timer = 0;
    }

    isInvincible() {
        return this.isActive;
    }

    getRemainingTime() {
        return Math.max(0, this.timer);
    }

    reset() {
        this.isActive = false;
        this.timer = 0;
    }
}