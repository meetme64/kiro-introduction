/**
 * AudioEngine - Manages all game audio playback using Web Audio API
 * Handles sound effects with support for browser autoplay restrictions
 *
 * @module AudioEngine
 */
class AudioEngine {
    #audioContext;
    #jumpBuffer;
    #gameOverBuffer;
    #isMuted;
    #volume;

    /**
     * Creates a new AudioEngine instance
     * @param {Object} [config={}] - Configuration options
     * @param {number} [config.volume=1.0] - Master volume (0.0 to 1.0)
     */
    constructor(config = {}) {
        this.#volume = config.volume ?? 1.0;
        this.#audioContext = null;
        this.#jumpBuffer = null;
        this.#gameOverBuffer = null;
        this.#isMuted = false;
    }

    /**
     * Loads audio assets from the asset loader
     * Fetches audio files and decodes them into buffers
     *
     * @param {AssetLoader} assetLoader - The asset loader instance
     * @returns {Promise<void>} Resolves when assets are loaded
     */
    async loadAssets(assetLoader) {
        try {
            // Initialize audio context
            this.#audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Fetch and decode jump sound
            await this.#loadSound('jump', assetLoader);

            // Fetch and decode game over sound
            await this.#loadSound('gameOver', assetLoader);
        } catch (error) {
            console.warn('[AudioEngine] Audio unavailable:', error.message);
            this.#audioContext = null;
        }
    }

    /**
     * Internal method to load and decode a sound file
     *
     * @param {string} key - Asset key ('jump' or 'gameOver')
     * @param {AssetLoader} assetLoader - The asset loader instance
     * @private
     */
    async #loadSound(key, assetLoader) {
        const asset = assetLoader.get(key);

        if (!asset) {
            console.warn(`[AudioEngine] Audio asset '${key}' not found in loader`);
            return;
        }

        try {
            // Fetch the audio file
            const response = await fetch(asset.src);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();

            // Decode the audio data
            if (this.#audioContext) {
                const audioBuffer = await this.#audioContext.decodeAudioData(arrayBuffer);

                // Store in appropriate buffer
                if (key === 'jump') {
                    this.#jumpBuffer = audioBuffer;
                } else if (key === 'gameOver') {
                    this.#gameOverBuffer = audioBuffer;
                }
            }
        } catch (error) {
            console.warn(`[AudioEngine] Failed to load sound '${key}':`, error.message);
        }
    }

    /**
     * Plays the jump sound effect
     * Resumes audio context if suspended (browser autoplay policy)
     */
    playJump() {
        this.#playSound(this.#jumpBuffer, 'jump');
    }

    /**
     * Plays the game over sound effect
     * Resumes audio context if suspended (browser autoplay policy)
     */
    playGameOver() {
        this.#playSound(this.#gameOverBuffer, 'gameOver');
    }

    /**
     * Internal method to play a sound buffer
     *
     * @param {AudioBuffer} buffer - The audio buffer to play
     * @param {string} name - Debug name for logging
     * @private
     */
    #playSound(buffer, name) {
        // Don't play if muted
        if (this.#isMuted) {
            return;
        }

        // Don't play if no audio context or buffer
        if (!this.#audioContext || !buffer) {
            return;
        }

        // Handle suspended audio context (browser autoplay policy)
        if (this.#audioContext.state === 'suspended') {
            this.#audioContext.resume().catch(() => {
                // Ignore resume errors - will fall back silently
            });
        }

        try {
            // Create buffer source
            const source = this.#audioContext.createBufferSource();
            source.buffer = buffer;

            // Create gain node for volume control
            const gainNode = this.#audioContext.createGain();
            gainNode.gain.value = this.#volume;

            // Connect source -> gain -> destination
            source.connect(gainNode);
            gainNode.connect(this.#audioContext.destination);

            // Play immediately
            source.start(0);
        } catch (error) {
            console.warn(`[AudioEngine] Failed to play sound '${name}':`, error.message);
        }
    }

    /**
     * Mutes or unmutes all audio
     *
     * @param {boolean} muted - True to mute, false to unmute
     */
    setMuted(muted) {
        this.#isMuted = Boolean(muted);
    }

    /**
     * Checks if audio is currently muted
     *
     * @returns {boolean} True if audio is muted
     */
    isMuted() {
        return this.#isMuted;
    }

    /**
     * Resumes the audio context (required for browser autoplay policy)
     * Call this on user interaction events like click or keydown
     *
     * @returns {Promise<boolean>} True if resumed successfully
     */
    async resume() {
        if (!this.#audioContext) {
            return false;
        }

        if (this.#audioContext.state === 'suspended') {
            try {
                await this.#audioContext.resume();
                return true;
            } catch (error) {
                console.warn('[AudioEngine] Failed to resume audio context:', error.message);
                return false;
            }
        }

        return true;
    }

    /**
     * Gets the current volume level
     *
     * @returns {number} Current volume (0.0 to 1.0)
     */
    getVolume() {
        return this.#volume;
    }

    /**
     * Sets the master volume
     *
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        this.#volume = Math.max(0.0, Math.min(1.0, volume));
    }

    /**
     * Cleans up audio engine resources
     * Call this when shutting down the game
     */
    dispose() {
        if (this.#audioContext) {
            this.#audioContext.close().catch(() => {
                // Ignore close errors
            });
            this.#audioContext = null;
        }

        this.#jumpBuffer = null;
        this.#gameOverBuffer = null;
        this.#isMuted = false;
    }

    /**
     * Plays the laser fire sound effect
     * @param {number} volume - Volume level (0.0 to 1.0, default 1.0)
     */
    playLaserFire(volume = 1.0) {
        this._playSoundWithVolume('laser_fire', volume);
    }

    /**
     * Plays the laser hit sound effect
     * @param {number} volume - Volume level (0.0 to 1.0, default 0.8)
     */
    playLaserHit(volume = 0.8) {
        this._playSoundWithVolume('laser_hit', volume);
    }

    /**
     * Plays the laser ready sound effect
     * @param {number} volume - Volume level (0.0 to 1.0, default 0.6)
     */
    playLaserReady(volume = 0.6) {
        this._playSoundWithVolume('laser_ready', volume);
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { AudioEngine };

export default AudioEngine;