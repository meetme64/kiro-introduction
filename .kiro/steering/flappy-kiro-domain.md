# Flappy Kiro Domain-Specific Steering

This document provides domain-specific patterns and guidelines for implementing Flappy Kiro game logic, state management, scoring, and difficulty progression.

## Game State Management

### State Machine Implementation

The game uses a finite state machine with four states: TITLE, PLAYING, PAUSED, GAMEOVER.

```javascript
// Game states as constants
const GAME_STATES = Object.freeze({
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
});

// State machine class
class GameStateManager {
    constructor(game) {
        this.game = game;
        this.currentState = GAME_STATES.TITLE;
        this.stateData = {};
        
        this.states = {
            [GAME_STATES.TITLE]: new TitleState(this),
            [GAME_STATES.PLAYING]: new PlayingState(this),
            [GAME_STATES.PAUSED]: new PausedState(this),
            [GAME_STATES.GAMEOVER]: new GameOverState(this)
        };
    }
    
    transition(newState) {
        if (this.currentState === newState) return;
        
        const currentHandler = this.states[this.currentState];
        const nextHandler = this.states[newState];
        
        currentHandler?.exit();
        this.currentState = newState;
        nextHandler?.enter();
        
        this.game.eventBus.emit('stateChange', {
            from: currentHandler?.constructor.name,
            to: nextHandler?.constructor.name
        });
    }
    
    update(dt) {
        const handler = this.states[this.currentState];
        handler?.update(dt);
    }
    
    handleInput(input) {
        const handler = this.states[this.currentState];
        handler?.handleInput(input);
    }
    
    getState() {
        return this.currentState;
    }
}
```

### State Handlers

```javascript
class TitleState {
    constructor(manager) {
        this.manager = manager;
        this.game = manager.game;
    }
    
    enter() {
        this.game.ui.showScreen('mainMenu');
        this.game.audio.playMusic('title');
        this.game.ghosty.setAnimation('idle');
    }
    
    exit() {
        this.game.ui.hideScreen('mainMenu');
    }
    
    update(dt) {
        // Animate ghosty idle
        this.game.ghosty.updateIdleAnimation(dt);
    }
    
    handleInput(input) {
        if (input.type === 'jump') {
            this.manager.transition(GAME_STATES.PLAYING);
        }
    }
}

class PlayingState {
    constructor(manager) {
        this.manager = manager;
        this.game = manager.game;
    }
    
    enter() {
        this.game.reset();
        this.game.ui.showHUD();
        this.game.audio.playMusic('gameplay');
        this.game.ghosty.setAnimation('flap');
    }
    
    exit() {
        this.game.ui.hideHUD();
        this.game.audio.stopMusic();
    }
    
    update(dt) {
        this.game.physics.update(dt);
        this.game.pipes.update(dt);
        this.game.clouds.update(dt);
        this.game.collision.check();
        this.game.score.update();
        
        if (this.game.collision.hasCollision()) {
            this.manager.transition(GAME_STATES.GAMEOVER);
        }
    }
    
    handleInput(input) {
        if (input.type === 'pause') {
            this.manager.transition(GAME_STATES.PAUSED);
        } else if (input.type === 'jump') {
            this.game.ghosty.jump();
            this.game.audio.play('jump');
        }
    }
}

class PausedState {
    constructor(manager) {
        this.manager = manager;
        this.game = manager.game;
    }
    
    enter() {
        this.game.ui.showOverlay('pause');
        this.game.audio.setMuted(true);
    }
    
    exit() {
        this.game.ui.hideOverlay('pause');
        this.game.audio.setMuted(false);
    }
    
    handleInput(input) {
        if (input.type === 'pause' || input.type === 'jump') {
            this.manager.transition(GAME_STATES.PLAYING);
        }
    }
}

class GameOverState {
    constructor(manager) {
        this.manager = manager;
        this.game = manager.game;
    }
    
    enter() {
        this.game.audio.play('gameOver');
        this.game.ghosty.playDeathAnimation();
        
        const finalScore = this.game.score.getCurrent();
        const highScore = this.game.score.getHighScore();
        const isNewRecord = finalScore > highScore;
        
        this.game.score.saveIfHigher();
        
        this.game.ui.showGameOver({
            score: finalScore,
            highScore: isNewRecord ? finalScore : highScore,
            isNewRecord
        });
    }
    
    exit() {
        this.game.ui.hideGameOver();
    }
    
    handleInput(input) {
        if (input.type === 'jump') {
            this.manager.transition(GAME_STATES.TITLE);
        }
    }
}
```

### State Transition Matrix

| From → To | TITLE | PLAYING | PAUSED | GAMEOVER |
|-----------|-------|---------|--------|----------|
| TITLE | - | Jump/Tap | - | - |
| PLAYING | - | - | 'P'/ESC | Collision |
| PAUSED | - | 'P'/ESC/Jump | - | - |
| GAMEOVER | Jump/Tap | - | - | - |

## Score Persistence

### Score Manager Implementation

```javascript
class ScoreManager {
    constructor(config) {
        this.config = config;
        this.currentScore = 0;
        this.pipesPassed = new Set();
        this.loadHighScore();
    }
    
    loadHighScore() {
        const storageKey = this.config.highScoreKey;
        try {
            const stored = localStorage.getItem(storageKey);
            this.highScore = stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            console.warn('Failed to load high score:', e);
            this.highScore = 0;
        }
    }
    
    saveHighScore() {
        const storageKey = this.config.highScoreKey;
        try {
            localStorage.setItem(storageKey, String(this.highScore));
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }
    }
    
    saveIfHigher() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
            return true; // New record
        }
        return false;
    }
    
    increment() {
        this.currentScore++;
        this.game.eventBus.emit('scoreChange', {
            current: this.currentScore,
            highScore: this.highScore
        });
    }
    
    checkPassage(pipe) {
        if (!pipe.passed && this.game.ghosty.hasPassed(pipe)) {
            pipe.passed = true;
            this.increment();
            this.game.audio.play('score');
            this.game.eventBus.emit('pipePassed', { pipe });
        }
    }
    
    reset() {
        this.currentScore = 0;
        this.pipesPassed.clear();
    }
    
    getCurrent() {
        return this.currentScore;
    }
    
    getHighScore() {
        return this.highScore;
    }
}
```

### High Score Storage Pattern

```javascript
// Storage with fallback chain
class ScoreStorage {
    static STORAGE_KEY = 'flappyKiroHighScore';
    
    static load() {
        // Try localStorage first
        try {
            const value = localStorage.getItem(this.STORAGE_KEY);
            if (value !== null) {
                return { source: 'localStorage', score: parseInt(value, 10) };
            }
        } catch (e) {
            console.warn('localStorage unavailable:', e);
        }
        
        // Fallback to sessionStorage
        try {
            const value = sessionStorage.getItem(this.STORAGE_KEY);
            if (value !== null) {
                return { source: 'sessionStorage', score: parseInt(value, 10) };
            }
        } catch (e) {
            console.warn('sessionStorage unavailable:', e);
        }
        
        // Default if no storage available
        return { source: 'default', score: 0 };
    }
    
    static save(score) {
        // Prefer localStorage
        try {
            localStorage.setItem(this.STORAGE_KEY, String(score));
            return { success: true, source: 'localStorage' };
        } catch (e) {
            console.warn('localStorage write failed:', e);
        }
        
        // Fallback to sessionStorage
        try {
            sessionStorage.setItem(this.STORAGE_KEY, String(score));
            return { success: true, source: 'sessionStorage' };
        } catch (e) {
            console.warn('sessionStorage write failed:', e);
            return { success: false };
        }
    }
}
```

### Score Display Formatting

```javascript
class ScoreFormatter {
    static format(score) {
        return String(score).padStart(5, '0');
    }
    
    static formatHighScore(score) {
        return `BEST: ${score}`;
    }
    
    static formatMedal(score) {
        if (score >= 50) return '🥇';
        if (score >= 25) return '🥈';
        if (score >= 10) return '🥉';
        if (score >= 5) return '⭐';
        return '';
    }
}
```

## Difficulty Progression

### Difficulty Manager

```javascript
class DifficultyManager {
    constructor(config) {
        this.config = config;
        this.currentTier = 0;
        this.scoreThresholds = config.difficultyThresholds;
        this.speedMultipliers = config.speedMultipliers;
        this.gapSizes = config.gapSizes;
    }
    
    update(score) {
        // Find highest tier for current score
        let newTier = 0;
        for (let i = 0; i < this.scoreThresholds.length; i++) {
            if (score >= this.scoreThresholds[i]) {
                newTier = i + 1;
            }
        }
        
        if (newTier !== this.currentTier) {
            const oldTier = this.currentTier;
            this.currentTier = newTier;
            
            this.game.eventBus.emit('difficultyChange', {
                from: oldTier,
                to: newTier,
                speed: this.getSpeed(),
                gapSize: this.getGapSize()
            });
        }
    }
    
    getSpeed() {
        return this.config.baseSpeed * this.speedMultipliers[this.currentTier];
    }
    
    getGapSize() {
        return this.gapSizes[this.currentTier] ?? this.gapSizes[this.gapSizes.length - 1];
    }
    
    getDifficulty() {
        return {
            tier: this.currentTier,
            speed: this.getSpeed(),
            gapSize: this.getGapSize(),
            isMax: this.currentTier === this.scoreThresholds.length
        };
    }
    
    reset() {
        this.currentTier = 0;
    }
}
```

### Difficulty Progression Table

| Score Threshold | Speed Multiplier | Gap Size | Description |
|-----------------|------------------|----------|-------------|
| 0-9 | 1.0x | 180px | Normal difficulty |
| 10-19 | 1.1x | 170px | Slightly faster |
| 20-29 | 1.2x | 160px | Medium difficulty |
| 30-49 | 1.3x | 150px | Hard |
| 50+ | 1.5x | 140px | Expert |

### Pipe Generation with Difficulty

```javascript
class PipeGenerator {
    constructor(config, difficultyManager) {
        this.config = config;
        this.difficulty = difficultyManager;
        this.frameCounter = 0;
        this.spawnInterval = config.wallPairSpacing;
    }
    
    update(dt) {
        this.frameCounter++;
        
        if (this.frameCounter >= this.spawnInterval) {
            this.frameCounter = 0;
            this.spawnPipe();
        }
    }
    
    spawnPipe() {
        const difficulty = this.difficulty.getDifficulty();
        
        // Calculate gap position (25-75% of canvas with clearance)
        const minGapY = this.config.gapClearance + (difficulty.gapSize / 2);
        const maxGapY = this.config.canvasHeight - minGapY;
        const gapPosition = minGapY + Math.random() * (maxGapY - minGapY);
        
        const pipe = {
            x: this.config.canvasWidth,
            y: 0, // Not used directly
            width: this.config.pipeWidth,
            gapHeight: difficulty.gapSize,
            gapPosition: gapPosition,
            speed: difficulty.speed,
            passed: false
        };
        
        this.game.pipes.push(pipe);
        this.game.eventBus.emit('pipeSpawn', { pipe });
    }
    
    reset() {
        this.frameCounter = 0;
        this.difficulty.reset();
    }
}
```

## Game Reset Pattern

```javascript
class GameResetter {
    constructor(game) {
        this.game = game;
    }
    
    fullReset() {
        // Reset in dependency order
        this.game.score.reset();
        this.game.pipeGenerator.reset();
        this.game.pipes.clear();
        this.game.clouds.reset();
        this.game.ghosty.reset();
        this.game.difficulty.reset();
        this.game.collision.reset();
        
        this.game.eventBus.emit('gameReset');
    }
    
    softReset() {
        // Keep high score, reset current state
        this.game.ghosty.reset();
        this.game.pipes.clear();
        this.game.score.resetCurrent();
        this.game.clouds.reset();
        
        this.game.eventBus.emit('gameSoftReset');
    }
}
```

## Event Bus Pattern

```javascript
class EventBus {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback, priority = 0) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push({ callback, priority });
        this.listeners.get(event).sort((a, b) => b.priority - a.priority);
    }
    
    off(event, callback) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            const index = handlers.findIndex(h => h.callback === callback);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            for (const handler of handlers) {
                handler.callback(data);
            }
        }
    }
    
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
}
```

## Common Game Events

| Event | Data | Purpose |
|-------|------|---------|
| `stateChange` | `{ from, to }` | Notify UI of state transitions |
| `scoreChange` | `{ current, highScore }` | Update score display |
| `pipePassed` | `{ pipe }` | Trigger score animation |
| `pipeSpawn` | `{ pipe }` | Pre-render pipe if needed |
| `difficultyChange` | `{ from, to, speed, gapSize }` | Notify difficulty changes |
| `collision` | `{ type, entity }` | Trigger collision response |
| `gameReset` | `{}` | Full game reset |
| `highScoreNew` | `{ score }` | New record achieved |

## Implementation Checklist

- [ ] State machine with four states (TITLE, PLAYING, PAUSED, GAMEOVER)
- [ ] State handlers with enter/update/exit methods
- [ ] Score manager with localStorage persistence
- [ ] Fallback to sessionStorage if localStorage unavailable
- [ ] Difficulty tier system based on score thresholds
- [ ] Speed and gap size adjust with difficulty
- [ ] Event bus for loose coupling between systems
- [ ] Game reset pattern (full and soft reset)
- [ ] Proper event cleanup on state transitions
- [ ] Audio state management (mute on pause)
