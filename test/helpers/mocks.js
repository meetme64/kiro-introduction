/**
 * Test Mocks - Mock objects for game testing
 * Provides consistent mock game objects and system mocks
 */

/**
 * Creates a mock game object for testing
 * @returns {Object} Mock game object
 */
function createMockGame() {
    const game = {
        renderer: createMockRenderer(),
        physicsEngine: createMockPhysicsEngine(),
        pipeManager: createMockPipeManager(),
        cloudManager: createMockCloudManager(),
        collisionDetector: createMockCollisionDetector(),
        scoreManager: createMockScoreManager(),
        difficulty: createMockDifficulty(),
        uiManager: createMockUIManager(),
        kiro: createMockKiro(),
        eventBus: createMockEventBus(),
        config: {
            physics: {
                gravity: 0.25,
                jumpStrength: -4.5,
                terminalVelocity: 8
            },
            game: { targetFPS: 60 }
        }
    };

    // stateManager.update() owns per-frame system orchestration (physics ->
    // pipes -> clouds -> collision -> score -> difficulty), matching the
    // real GameStateManager.PlayingStateHandler.update() contract. GameLoop
    // itself only calls `stateManager.update()` and does not duplicate this
    // orchestration directly.
    game.stateManager = createMockStateManager(game);

    return game;
}

/**
 * Creates a mock state manager
 * @returns {Object} Mock state manager
 */
function createMockStateManager(game) {
    const state = { current: 'TITLE' };
    return {
        getState: () => state.current,
        isPlaying: () => state.current === 'PLAYING',
        isPaused: () => state.current === 'PAUSED',
        isTitle: () => state.current === 'TITLE',
        isGameOver: () => state.current === 'GAMEOVER',
        transitionTo: (newState) => { state.current = newState; },
        update: (dt) => {
            if (!game || state.current !== 'PLAYING') return;
            game.physicsEngine.update(dt);
            game.pipeManager.update(dt);
            game.cloudManager.update(dt);
            game.collisionDetector.check(game.kiro, game.pipeManager.getPipes());
            game.scoreManager.update(dt);
            game.difficulty.update(game.scoreManager.getCurrentScore());
        }
    };
}

/**
 * Creates a mock renderer
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} Mock renderer
 */
function createMockRenderer(width = 480, height = 640) {
    return {
        canvas: { width, height },
        clear: () => {},
        drawKiro: () => {},
        drawPipes: () => {},
        drawClouds: () => {},
        drawText: () => {},
        drawPauseOverlay: () => {},
        getDimensions: () => ({ width, height })
    };
}

/**
 * Creates a mock physics engine
 * @returns {Object} Mock physics engine
 */
function createMockPhysicsEngine() {
    return {
        update: () => {},
        applyGravity: () => {},
        jump: () => {}
    };
}

/**
 * Creates a mock pipe manager
 * @returns {Object} Mock pipe manager
 */
function createMockPipeManager() {
    return {
        update: () => {},
        getPipes: () => [],
        render: () => {},
        reset: () => {}
    };
}

/**
 * Creates a mock cloud manager
 * @returns {Object} Mock cloud manager
 */
function createMockCloudManager() {
    return {
        update: () => {},
        render: () => {},
        reset: () => {}
    };
}

/**
 * Creates a mock collision detector
 * @returns {Object} Mock collision detector
 */
function createMockCollisionDetector() {
    return {
        check: () => false,
        hasCollision: () => false
    };
}

/**
 * Creates a mock score manager
 * @returns {Object} Mock score manager
 */
function createMockScoreManager() {
    return {
        getCurrentScore: () => 0,
        getHighScore: () => 0,
        increment: () => {},
        reset: () => {},
        update: () => {}
    };
}

/**
 * Creates a mock difficulty manager
 * @returns {Object} Mock difficulty manager
 */
function createMockDifficulty() {
    return {
        update: () => {},
        getDifficulty: () => ({ tier: 0, speed: 1, gapSize: 180 })
    };
}

/**
 * Creates a mock UI manager
 * @returns {Object} Mock UI manager
 */
function createMockUIManager() {
    return {
        render: () => {},
        getScreen: () => null,
        showScreen: () => {},
        hideScreen: () => {}
    };
}

/**
 * Creates a mock Kiro entity
 * @returns {Object} Mock Kiro
 */
function createMockKiro() {
    return {
        x: 100,
        y: 300,
        velocity: 0,
        rotation: 0,
        update: () => {},
        jump: () => {},
        reset: () => {}
    };
}

/**
 * Creates a mock event bus
 * @returns {Object} Mock event bus
 */
function createMockEventBus() {
    const listeners = new Map();
    return {
        listeners,
        on: (event, callback) => {
            if (!listeners.has(event)) listeners.set(event, []);
            listeners.get(event).push(callback);
        },
        off: (event, callback) => {
            const handlers = listeners.get(event);
            if (handlers) {
                const index = handlers.indexOf(callback);
                if (index > -1) handlers.splice(index, 1);
            }
        },
        emit: (event, data) => {
            const handlers = listeners.get(event);
            if (handlers) handlers.forEach(cb => cb(data));
        },
        once: (event, callback) => {
            const wrapper = (data) => {
                callback(data);
                this.off(event, wrapper);
            };
            this.on(event, wrapper);
        }
    };
}

/**
 * Creates a mock canvas
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} Mock canvas
 */
function createMockCanvas(width = 480, height = 640) {
    return {
        width,
        height,
        id: 'gameCanvas',
        getContext: () => createMockCanvasContext()
    };
}

/**
 * Creates a mock canvas context
 * @returns {Object} Mock canvas context
 */
function createMockCanvasContext() {
    return {
        canvas: { width: 480, height: 640 },
        fillStyle: null,
        strokeStyle: null,
        lineWidth: 1,
        font: '16px sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillText: () => {},
        strokeText: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        arc: () => {},
        drawImage: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(480 * 640 * 4) }),
        putImageData: () => {},
        createLinearGradient: () => ({
            addColorStop: () => {},
            getColorStopValue: () => '#000'
        }),
        createRadialGradient: () => ({
            addColorStop: () => {},
            getColorStopValue: () => '#000'
        })
    };
}

module.exports = {
    createMockGame,
    createMockStateManager,
    createMockRenderer,
    createMockPhysicsEngine,
    createMockPipeManager,
    createMockCloudManager,
    createMockCollisionDetector,
    createMockScoreManager,
    createMockDifficulty,
    createMockUIManager,
    createMockKiro,
    createMockEventBus,
    createMockCanvas,
    createMockCanvasContext
};