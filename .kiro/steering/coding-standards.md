# JavaScript Game Development Coding Standards

This steering document establishes coding standards, patterns, and performance guidelines for Flappy Kiro and future JavaScript game projects.

## File Structure

```
project/
├── index.html
├── game-config.json
├── assets/
│   ├── audio/
│   ├── sprites/
│   └── images/
├── src/
│   ├── main.js
│   ├── config.js
│   ├── entities/
│   │   ├── Kiro.js
│   │   ├── Pipe.js
│   │   └── Cloud.js
│   ├── systems/
│   │   ├── PhysicsEngine.js
│   │   ├── CollisionDetector.js
│   │   ├── PipeManager.js
│   │   └── ScoreManager.js
│   ├── rendering/
│   │   ├── Renderer.js
│   │   └── Sprite.js
│   ├── audio/
│   │   └── AudioEngine.js
│   └── ui/
│       ├── UIManager.js
│       └── screens/
```

## Class Naming Conventions

### Entity Classes

| Pattern | Example | Purpose |
|---------|---------|---------|
| `EntityName.js` | `Kiro.js`, `Pipe.js`, `Cloud.js` | Game objects with position/state |
| `EntityNameModel.js` | `KiroModel.js` | Data-only classes (optional) |

### System Classes

| Pattern | Example | Purpose |
|---------|---------|---------|
| `NameSystem.js` | `PhysicsEngine.js`, `CollisionDetector.js` | Game logic systems |
| `NameManager.js` | `PipeManager.js`, `ScoreManager.js` | State management |
| `NameEngine.js` | `AudioEngine.js`, `RenderEngine.js` | Core engine components |

### UI Classes

| Pattern | Example | Purpose |
|---------|---------|---------|
| `UIManager.js` | `UIManager.js` | UI orchestration |
| `*Screen.js` | `MainMenuScreen.js`, `GameOverScreen.js` | Individual screens |
| `*HUD.js` | `ScoreHUD.js` | Heads-up display elements |

### Utility Classes

| Pattern | Example | Purpose |
|---------|---------|---------|
| `Utils.js` | `MathUtils.js`, `InputUtils.js` | Helper functions |
| `Constants.js` | `GameConstants.js` | Constants (use config.js instead) |

### Naming Rules

```javascript
// GOOD - Clear, descriptive names
class PhysicsEngine {}
class PipeManager {}
class CollisionDetector {}
const GRAVITY = 0.25;

// AVOID - Vague or abbreviated names
class Phys {}
class PM {}
class CD {}
const G = 0.25;
```

## JavaScript Game Patterns

### 1. Game Loop Pattern

```javascript
class GameLoop {
    constructor() {
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
    }
    
    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.update(time));
    }
    
    update(currentTime) {
        this.deltaTime = currentTime - this.lastTime;
        
        if (this.deltaTime >= this.frameInterval) {
            const deltaSeconds = this.deltaTime / 1000;
            this.lastTime = currentTime - (this.deltaTime % this.frameInterval);
            
            this.updateSystems(deltaSeconds);
            this.render();
        }
        
        requestAnimationFrame((time) => this.update(time));
    }
    
    updateSystems(dt) {
        this.physics.update(dt);
        this.collision.check();
        this.pipes.update(dt);
        this.score.update();
    }
    
    render() {
        this.renderer.clear();
        this.renderer.drawScene();
    }
}
```

### 2. Entity-Component Pattern

```javascript
class Kiro {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.rotation = 0;
        this.state = 'IDLE';
    }
    
    applyGravity(gravity, dt) {
        this.velocity += gravity * dt;
    }
    
    jump(jumpStrength) {
        this.velocity = jumpStrength;
    }
    
    update(dt) {
        this.y += this.velocity * dt;
        this.rotation = this.calculateRotation();
    }
    
    calculateRotation() {
        return Math.max(-90, Math.min(30, this.velocity * 3));
    }
}
```

### 3. Object Pool Pattern

```javascript
class ObjectPool {
    constructor(factory, initialSize = 10, maxSize = 50) {
        this.factory = factory;
        this.maxSize = maxSize;
        this.pool = [];
        
        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push({ instance: factory(), active: false });
        }
    }
    
    acquire() {
        // Find inactive object
        for (const item of this.pool) {
            if (!item.active) {
                item.active = true;
                return item.instance;
            }
        }
        
        // Create new if under max
        if (this.pool.length < this.maxSize) {
            const instance = this.factory();
            this.pool.push({ instance, active: true });
            return instance;
        }
        
        // Recycle oldest
        const oldest = this.pool.shift();
        oldest.active = true;
        this.pool.push(oldest);
        return oldest.instance;
    }
    
    release(instance) {
        const item = this.pool.find(i => i.instance === instance);
        if (item) item.active = false;
    }
}

// Usage
const pipePool = new ObjectPool(
    () => ({ x: 0, y: 0, width: 60, height: 100 }),
    10,
    30
);

const pipe = pipePool.acquire();
pipePool.release(pipe);
```

### 4. State Machine Pattern

```javascript
class GameStateMachine {
    constructor() {
        this.states = {
            TITLE: new TitleState(this),
            PLAYING: new PlayingState(this),
            PAUSED: new PausedState(this),
            GAMEOVER: new GameOverState(this)
        };
        this.currentState = this.states.TITLE;
    }
    
    transitionTo(stateName) {
        this.currentState.exit();
        this.currentState = this.states[stateName];
        this.currentState.enter();
    }
    
    update(dt) {
        this.currentState.update(dt);
    }
    
    handleInput(input) {
        this.currentState.handleInput(input);
    }
}

class PlayingState {
    constructor(machine) {
        this.machine = machine;
    }
    
    enter() {
        this.game.start();
        this.audio.playBackground();
    }
    
    exit() {
        this.game.pause();
    }
    
    update(dt) {
        this.game.update(dt);
    }
    
    handleInput(input) {
        if (input === 'PAUSE') {
            this.machine.transitionTo('PAUSED');
        } else if (input === 'JUMP') {
            this.game.kiro.jump();
        }
    }
}
```

### 5. Singleton Pattern (Use Sparingly)

```javascript
// For truly global state only (audio context, game config)
const CONFIG = Object.freeze({
    gravity: 800,
    jumpVelocity: -300,
    targetFPS: 60
});

// For game managers - prefer dependency injection
class Game {
    constructor(audioEngine, renderer) {
        this.audio = audioEngine;
        this.renderer = renderer;
        this.isRunning = false;
    }
}
```

## Code Style Guidelines

### Variables and Constants

```javascript
// GOOD
const MAX_VELOCITY = 600;
let currentScore = 0;
let isGameRunning = false;

// Constants in UPPER_SNAKE_CASE
// Variables in camelCase
// Booleans start with is/has/should

// AVOID
const MaxVelocity = 600;
let CurrentScore = 0;
let running = false;
```

### Functions

```javascript
// GOOD - Descriptive names, small functions
function updatePhysics(entity, gravity, dt) {
    entity.velocity += gravity * dt;
    entity.y += entity.velocity * dt;
}

function checkCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x;
}

// Arrow functions for callbacks
const onJump = () => this.kiro.jump();

// Method shorthand in classes
class Game {
    update(dt) {
        this.physics.update(dt);
    }
}

// AVOID - Unclear names
function upd(obj, g, t) { /* unclear */ }
const jump = function() { /* inline */ }
```

### Classes

```javascript
// GOOD
class PhysicsEngine {
    constructor(config) {
        this.gravity = config.gravity;
        this.terminalVelocity = config.terminalVelocity;
    }
    
    applyGravity(entity, dt) {
        entity.velocity += this.gravity * dt;
        return this.clampVelocity(entity.velocity);
    }
    
    clampVelocity(velocity) {
        return Math.max(-this.terminalVelocity, 
                        Math.min(this.terminalVelocity, velocity));
    }
}

// Constructor parameters for dependencies
// Private fields with # prefix (ES2022)
class CollisionDetector {
    #hitboxRadius = 12;
    
    checkCollision(entity, obstacles) {
        // Implementation
    }
}

// AVOID - Old patterns
function PhysicsEngine(g) {
    this.g = g;  // Unclear parameter
}
PhysicsEngine.prototype.upd = function() {};
```

### Comments

```javascript
// GOOD - Why, not what
// Apply gravity with terminal velocity cap
// to prevent unrealistic acceleration
entity.velocity += gravity * dt;
entity.velocity = Math.max(-MAX_FALL, Math.min(MAX_FALL, entity.velocity));

// AVOID - Redundant comments
// Add gravity to velocity
entity.velocity += gravity * dt;
```

## Performance Optimization Guidelines

### 1. Object Pooling

```javascript
// Always pool frequently created/destroyed objects
class PipeManager {
    constructor() {
        this.activePipes = [];
        this.pipePool = new ObjectPool(this.createPipe, 10, 30);
    }
    
    spawnPipe() {
        const pipe = this.pipePool.acquire();
        this.initializePipe(pipe);
        this.activePipes.push(pipe);
    }
    
    removePipe(pipe) {
        const index = this.activePipes.indexOf(pipe);
        if (index > -1) {
            this.activePipes.splice(index, 1);
            this.pipePool.release(pipe);
        }
    }
}
```

### 2. Minimize Garbage Collection

```javascript
// GOOD - Reuse objects
class CollisionDetector {
    constructor() {
        this.tempRect = { x: 0, y: 0, width: 0, height: 0 };
    }
    
    check(pipes) {
        for (const pipe of pipes) {
            this.tempRect.x = pipe.x;
            this.tempRect.width = pipe.width;
            if (this.intersects(this.tempRect, this.kiroRect)) {
                return true;
            }
        }
        return false;
    }
}

// AVOID - Creating objects per frame
function check(pipes) {
    for (const pipe of pipes) {
        const rect = { x: pipe.x, width: pipe.width };
        if (this.intersects(rect, kiroRect)) {
            return true;
        }
    }
}
```

### 3. Efficient Loop Patterns

```javascript
// GOOD - Use for-of for arrays
for (const pipe of this.pipes) {
    this.updatePipe(pipe);
}

// Use for-in for objects with hasOwnProperty check
for (const key in this.config) {
    if (Object.prototype.hasOwnProperty.call(this.config, key)) {
        // Process key
    }
}

// Use for loop with cached length for performance-critical loops
for (let i = 0, len = this.pipes.length; i < len; i++) {
    this.pipes[i].update();
}

// AVOID - forEach in hot paths
this.pipes.forEach(pipe => {
    pipe.update();
});
```

### 4. Render Optimization

```javascript
class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.cachedPipes = new Map();
    }
    
    // Batch similar operations
    renderPipes(pipes) {
        for (const pipe of pipes) {
            this.ctx.fillStyle = '#00AA00';
            this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapPosition);
            this.ctx.fillRect(pipe.x, pipe.gapPosition + pipe.gapHeight, 
                             pipe.width, 640 - pipe.gapPosition - pipe.gapHeight);
        }
    }
    
    // Pre-render static elements
    preRenderPipeSegment() {
        const offscreen = document.createElement('canvas');
        offscreen.width = 60;
        offscreen.height = 640;
        const ctx = offscreen.getContext('2d');
        
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(0, 0, 60, 640);
        ctx.strokeStyle = '#004400';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 60, 640);
        
        this.cachedSegments.set('pipe', offscreen);
    }
}
```

### 5. Delta Time Usage

```javascript
// GOOD - Frame-rate independent movement
class PhysicsEngine {
    update(dt) {
        // dt is in seconds
        this.entity.velocity += this.gravity * dt;
        this.entity.y += this.entity.velocity * dt;
    }
}

// Calculate delta from performance.now()
const now = performance.now();
const dt = (now - this.lastTime) / 1000;
this.lastTime = now;

this.physics.update(dt);

// AVOID - Frame-dependent movement
class PhysicsEngine {
    update() {
        // Assuming 60 FPS - breaks on different refresh rates
        this.entity.velocity += this.gravity;
        this.entity.y += this.entity.velocity;
    }
}
```

### 6. Memory Management

```javascript
class MemoryManager {
    static checkUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            return { used, limit, percent: (used / limit) * 100 };
        }
        return null;
    }
    
    static shouldReduceQuality() {
        const usage = this.checkUsage();
        return usage && usage.percent > 80;
    }
}

// Monitor in game loop
if (MemoryManager.shouldReduceQuality()) {
    disableClouds();
    reduceRenderQuality();
}
```

### 7. Event Handling

```javascript
// GOOD - Use once for one-time events
document.addEventListener('click', () => {
    this.audioEngine.resume();
}, { once: true });

// Debounce frequent events
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Use passive listeners for touch/scroll
canvas.addEventListener('touchmove', handler, { passive: true });

// AVOID - Anonymous functions in loops
for (let i = 0; i < 10; i++) {
    element.addEventListener('click', function() {
        console.log(i);  // Always logs 10!
    });
}
```

## Performance Checklist

- [ ] Use object pooling for pipes, clouds, particles
- [ ] Reuse temporary objects instead of creating new ones
- [ ] Cache array lengths in loops
- [ ] Use requestAnimationFrame for rendering
- [ ] Calculate positions with delta time
- [ ] Pre-render static elements to offscreen canvases
- [ ] Batch canvas operations by fillStyle
- [ ] Remove event listeners when not needed
- [ ] Use passive listeners for touch/scroll
- [ ] Monitor memory usage during gameplay
- [ ] Profile with Chrome DevTools Performance tab

## Code Review Checklist

### Function Complexity
- [ ] Function does one thing
- [ ] Less than 20 lines per function
- [ ] Maximum 4 parameters
- [ ] Early returns for error cases

### Naming
- [ ] Descriptive names (avoid abbreviations)
- [ ] Consistent naming convention
- [ ] Boolean names start with is/has/should

### Performance
- [ ] No object creation in hot paths
- [ ] Delta time used for animations
- [ ] Object pooling for frequent allocations
- [ ] No memory leaks in event handlers

### Error Handling
- [ ] Null checks for external data
- [ ] Graceful fallback for missing assets
- [ ] Console warnings for non-critical errors

### Testing
- [ ] Core logic has unit tests
- [ ] Edge cases covered
- [ ] Performance tests for critical paths
