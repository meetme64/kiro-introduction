/**
 * ScoreManager - Manages scoring and high score persistence
 * Handles pipe passage detection and localStorage persistence
 */
export default class ScoreManager {
    constructor(config) {
        this.config = config;
        this.currentScore = 0;
        this.highScore = 0;
        this.pipesPassed = new Set();
        this.highScoreKey = config.highScoreKey || 'flappyKiroHighScore';
        this.loadHighScore();
    }

    loadHighScore() {
        try {
            const stored = localStorage.getItem(this.highScoreKey);
            this.highScore = stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            console.warn('Failed to load high score:', e);
            this.highScore = 0;
        }
    }

    saveHighScore() {
        try {
            localStorage.setItem(this.highScoreKey, String(this.highScore));
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }
    }

    saveIfHigher() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
            return true;
        }
        return false;
    }

    increment() {
        this.currentScore++;
    }

    checkPassage(ghosty, pipe) {
        if (!pipe.passed && ghosty.x > pipe.x + pipe.width) {
            pipe.passed = true;
            this.increment();
            return true;
        }
        return false;
    }

    getCurrent() {
        return this.currentScore;
    }

    getHighScore() {
        return this.highScore;
    }

    reset() {
        this.currentScore = 0;
        this.pipesPassed.clear();
    }
}