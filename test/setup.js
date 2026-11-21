/**
 * Jest test setup with JSDOM mocks
 * Configures browser environment for testing
 * 
 * NOTE: This file uses CommonJS because it's loaded by Jest's setupFilesAfterEnv
 */

// TextEncoder/TextDecoder are required by jsdom and whatwg-url
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set up JSDOM environment before tests run
const { JSDOM } = require('jsdom');

// Create a DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><canvas id="gameCanvas"></canvas></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

// Set up global objects
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.performance = dom.window.performance;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.MouseEvent = dom.window.MouseEvent;
global.TouchEvent = dom.window.TouchEvent;

// Mock AudioContext
class MockAudioContext {
    constructor() {
        this.state = 'running';
    }
    
    createOscillator() {
        return {
            connect: () => {},
            disconnect: () => {},
            start: () => {},
            stop: () => {}
        };
    }
    
    createGain() {
        return {
            connect: () => {},
            disconnect: () => {},
            gain: { value: 1, setValueAtTime: () => {} }
        };
    }
    
    resume() {
        return Promise.resolve();
    }
    
    suspend() {
        return Promise.resolve();
    }
    
    close() {
        return Promise.resolve();
    }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Mock canvas context
const mockCanvasContext = {
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

// Create a shared event listener registry for canvas elements
const canvasEventListeners = new Map();

// Mock HTMLCanvasElement
class MockHTMLCanvasElement {
    constructor() {
        this.width = 480;
        this.height = 640;
        this.id = 'gameCanvas';
        this.tagName = 'CANVAS';
        this.style = {};
        this._eventListeners = {};
    }

    getContext(type) {
        if (type === '2d') return mockCanvasContext;
        return null;
    }

    toDataURL(type, quality) {
        return 'data:image/png;base64,mock';
    }

    addEventListener(event, handler, options) {
        if (!this._eventListeners[event]) {
            this._eventListeners[event] = [];
        }
        this._eventListeners[event].push({ handler, options });

        // Also track globally for dispatch
        const key = `${this.id}_${event}`;
        if (!canvasEventListeners.has(key)) {
            canvasEventListeners.set(key, []);
        }
        canvasEventListeners.get(key).push(handler);
    }

    removeEventListener(event, handler, options) {
        if (this._eventListeners[event]) {
            this._eventListeners[event] = this._eventListeners[event].filter(l => l.handler !== handler);
        }

        // Also remove from global registry
        const key = `${this.id}_${event}`;
        if (canvasEventListeners.has(key)) {
            const handlers = canvasEventListeners.get(key);
            canvasEventListeners.set(key, handlers.filter(h => h !== handler));
        }
    }

    dispatchEvent(event) {
        const key = `${this.id}_${event.type}`;
        const listeners = canvasEventListeners.get(key) || [];

        for (const listener of listeners) {
            try {
                listener(event);
            } catch (e) {
                // Ignore errors from handlers
            }
        }
        return true;
    }
}

// Replace document.getElementById to return our mock canvas
const originalGetElementById = document.getElementById.bind(document);
document.getElementById = function(id) {
    if (id === 'gameCanvas') {
        return new MockHTMLCanvasElement();
    }
    return originalGetElementById(id);
};

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i]
    };
})();
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i]
    };
})();
global.sessionStorage = sessionStorageMock;

// Mock document.addEventListener and document.removeEventListener for testing
// These need to be mocks so tests can verify they're called correctly
const eventListeners = {};
const eventHandlerWrappers = {};

document.addEventListener = jest.fn((event, handler, options) => {
    if (!eventListeners[event]) {
        eventListeners[event] = [];
    }
    eventListeners[event].push({ handler, options });
});

document.removeEventListener = jest.fn((event, handler, options) => {
    if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(l => l.handler !== handler);
    }
});

// Make dispatchEvent work properly for events
const originalDispatchEvent = document.dispatchEvent.bind(document);
document.dispatchEvent = function(event) {
    const listeners = eventListeners[event.type] || [];
    for (const listener of listeners) {
        try {
            listener.handler(event);
        } catch (e) {
            // Ignore errors from handlers
        }
    }
    return true;
};

// Make window.dispatchEvent work the same way
if (typeof window !== 'undefined') {
    window.addEventListener = document.addEventListener;
    window.removeEventListener = document.removeEventListener;
    window.dispatchEvent = document.dispatchEvent;
}

/**
 * Creates a mock game object for testing
 */
function createMockGame() {
    return {
        stateManager: createMockStateManager(),
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
}

function createMockStateManager() {
    const state = { current: 'TITLE' };
    return {
        getState: () => state.current,
        isPlaying: () => state.current === 'PLAYING',
        isPaused: () => state.current === 'PAUSED',
        isTitle: () => state.current === 'TITLE',
        isGameOver: () => state.current === 'GAMEOVER',
        transitionTo: (newState) => { state.current = newState; },
        update: () => {}
    };
}

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

function createMockPhysicsEngine() {
    return {
        update: () => {},
        applyGravity: () => {},
        jump: () => {}
    };
}

function createMockPipeManager() {
    return {
        update: () => {},
        getPipes: () => [],
        render: () => {},
        reset: () => {}
    };
}

function createMockCloudManager() {
    return {
        update: () => {},
        render: () => {},
        reset: () => {}
    };
}

function createMockCollisionDetector() {
    return {
        check: () => false,
        hasCollision: () => false
    };
}

function createMockScoreManager() {
    return {
        getCurrentScore: () => 0,
        getHighScore: () => 0,
        increment: () => {},
        reset: () => {},
        update: () => {}
    };
}

function createMockDifficulty() {
    return {
        update: () => {},
        getDifficulty: () => ({ tier: 0, speed: 1, gapSize: 180 })
    };
}

function createMockUIManager() {
    return {
        render: () => {},
        getScreen: () => null,
        showScreen: () => {},
        hideScreen: () => {}
    };
}

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
 * Creates a mock canvas for testing
 */
function createMockCanvas(width = 480, height = 640) {
    return new MockHTMLCanvasElement();
}

/**
 * Wait for a specified number of milliseconds
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulate keyboard event
 */
function simulateKeyEvent(type, key, options = {}) {
    const event = new KeyboardEvent(type, {
        key,
        code: key === ' ' ? 'Space' : key,
        bubbles: true,
        cancelable: true,
        ...options
    });
    document.dispatchEvent(event);
    return event;
}

/**
 * Simulate mouse click
 */
function simulateClick(element = document.body, options = {}) {
    const rect = element.getBoundingClientRect
        ? element.getBoundingClientRect()
        : { left: 0, top: 0, width: 100, height: 100 };
    
    const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        ...options
    });
    element.dispatchEvent(event);
    return event;
}

/**
 * Simulate touch event
 */
function simulateTouch(element, options = {}) {
    const rect = element.getBoundingClientRect
        ? element.getBoundingClientRect()
        : { left: 0, top: 0, width: 100, height: 100 };
    
    const event = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 0, target: element, clientX: rect.left, clientY: rect.top })],
        ...options
    });
    element.dispatchEvent(event);
    return event;
}

// Export utilities for use in tests
module.exports = {
    createMockGame,
    createMockCanvas,
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
    wait,
    simulateKeyEvent,
    simulateClick,
    simulateTouch
};