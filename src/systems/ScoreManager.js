/**
 * ScoreManager - Manages scoring and high score persistence
 *
 * Handles score tracking for game sessions with localStorage/sessionStorage
 * fallback for high score persistence. Follows the storage pattern from
 * the flappy-kiro-domain steering document.
 */
class ScoreManager {
    /** @type {object} Configuration object */
    #config;

    /** @type {number} Current session score */
    #currentScore;

    /** @type {number} Persisted high score */
    #highScore;

    /** @type {string} Storage key for high score persistence */
    #storageKey;

    /**
     * Creates a new ScoreManager instance
     * @param {object} config - Configuration object with scoring settings
     * @param {string} config.highScoreKey - Storage key for high score (default: 'flappyKiroHighScore')
     */
    constructor(config) {
        this.#config = config;
        this.#currentScore = 0;
        this.#highScore = 0;
        this.#storageKey = config.highScoreKey || 'flappyKiroHighScore';

        this.#loadHighScore();
    }

    /**
     * Gets the current session score
     * @returns {number} Current score value
     */
    getCurrentScore() {
        return this.#currentScore;
    }

    /**
     * Gets the persisted high score
     * @returns {number} High score value
     */
    getHighScore() {
        return this.#highScore;
    }

    /**
     * Increments the score by 1 and returns the new value
     * @returns {number} New score value after increment
     */
    incrementScore() {
        this.#currentScore++;
        return this.#currentScore;
    }

    /**
     * Resets the current score to 0 for a new game session
     */
    reset() {
        this.#currentScore = 0;
    }

    /**
     * Checks if current score exceeds high score
     * @returns {boolean} True if current score > high score
     */
    checkHighScore() {
        return this.#currentScore > this.#highScore;
    }

    /**
     * Saves high score to storage if current score exceeds it
     * @returns {boolean} True if high score was updated and saved
     */
    saveIfHigher() {
        if (this.#currentScore > this.#highScore) {
            this.#highScore = this.#currentScore;
            this.#saveHighScore();
            return true;
        }
        return false;
    }

    /**
     * Loads the high score from storage on game initialization
     * Tries localStorage first, falls back to sessionStorage
     */
    #loadHighScore() {
        // Try localStorage first
        if (this.#tryLoadFromStorage(localStorage)) {
            return;
        }

        // Fallback to sessionStorage
        if (this.#tryLoadFromStorage(sessionStorage)) {
            return;
        }

        // Storage completely unavailable - use default
        this.#highScore = 0;
        console.warn('ScoreManager: No storage available, high score will not persist');
    }

    /**
     * Attempts to load high score from a storage object
     * @param {Storage} storage - localStorage or sessionStorage
     * @returns {boolean} True if loaded successfully
     */
    #tryLoadFromStorage(storage) {
        try {
            const value = storage.getItem(this.#storageKey);
            if (value !== null) {
                this.#highScore = parseInt(value, 10);
                return true;
            }
        } catch (e) {
            // Storage unavailable - will try fallback
        }
        return false;
    }

    /**
     * Saves the high score to storage
     * Tries localStorage first, falls back to sessionStorage
     */
    #saveHighScore() {
        // Try localStorage first
        if (this.#trySaveToStorage(localStorage)) {
            return;
        }

        // Fallback to sessionStorage
        if (this.#trySaveToStorage(sessionStorage)) {
            return;
        }

        // Storage completely unavailable
        console.warn('ScoreManager: No storage available, high score will not persist');
    }

    /**
     * Attempts to save high score to a storage object
     * @param {Storage} storage - localStorage or sessionStorage
     * @returns {boolean} True if saved successfully
     */
    #trySaveToStorage(storage) {
        try {
            storage.setItem(this.#storageKey, String(this.#highScore));
            return true;
        } catch (e) {
            // Handle quota exceeded or storage unavailable
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('ScoreManager: Storage quota exceeded, cannot save high score');
            } else {
                console.warn(`ScoreManager: Failed to save to storage: ${e.message}`);
            }
        }
        return false;
    }
}

export default ScoreManager;