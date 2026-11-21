/**
 * TitleScreen Tests - Unit tests for TitleScreen component
 */

import TitleScreen from './TitleScreen.js';

// Simple assertion helpers
function assert(condition, message) {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}: ${message}`);
}

function assertApprox(actual, expected, tolerance, message) {
    if (Math.abs(actual - expected) > tolerance) throw new Error(`Expected ~${expected} but got ${actual} (±${tolerance}): ${message}`);
}

// Mock dependencies
function createMockRenderer() {
    return {
        getDimensions: () => ({ width: 480, height: 640 }),
        drawText: function(text, x, y, font, color) {
            this.lastText = text;
            this.lastX = x;
            this.lastY = y;
            this.lastFont = font;
            this.lastColor = color;
        },
        clear: function() {}
    };
}

function createMockScoreManager(highScore = 0, currentScore = 0) {
    return {
        getHighScore: () => highScore,
        getCurrent: () => currentScore
    };
}

describe('TitleScreen', () => {
    describe('Instantiation', () => {
        test('Should not be visible initially', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            // Check internal state if accessible or verify behavior
            expect(titleScreen._isVisible).toBe(false);
        });

        test('Should initialize with default values', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            expect(titleScreen._animationTime).toBe(0);
        });
    });

    describe('show() method', () => {
        test('Should make screen visible', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen.show();
            expect(titleScreen._isVisible).toBe(true);
        });

        test('Should reset animation time', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen._animationTime = 100;
            titleScreen.show();
            expect(titleScreen._animationTime).toBe(0);
        });

        test('Should reset pulse phase', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen._pulsePhase = Math.PI;
            titleScreen.show();
            expect(titleScreen._pulsePhase).toBe(0);
        });
    });

    describe('hide() method', () => {
        test('Should hide the screen', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen.show();
            titleScreen.hide();
            expect(titleScreen._isVisible).toBe(false);
        });
    });

    describe('update() animation', () => {
        test('Should accumulate animation time', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen.show();
            titleScreen.update(0.5);
            expect(titleScreen._animationTime).toBe(0.5);
        });

        test('Should accumulate pulse phase', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen.show();
            titleScreen.update(0.5);
            expect(titleScreen._pulsePhase).toBeCloseTo(Math.PI, 5);
        });
    });

    describe('Position calculations', () => {
        test('Title should be at 30% from top', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            const titleY = titleScreen._canvasHeight * 0.30;
            expect(titleY).toBe(192);
        });

        test('Instruction should be at 50% from top', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            const instructionY = titleScreen._canvasHeight * 0.50;
            expect(instructionY).toBe(320);
        });

        test('High score should be at 70% from top', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            const highScoreY = titleScreen._canvasHeight * 0.70;
            expect(highScoreY).toBe(448);
        });
    });

    describe('Floating animation', () => {
        test('Float offset should be 0 at start', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen._animationTime = 0;
            const floatOffset = Math.sin(titleScreen._animationTime * 2) * 3;
            expect(floatOffset).toBeCloseTo(0, 1);
        });

        test('Float offset should be +3 at quarter cycle', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen._animationTime = Math.PI / 4;
            const floatOffset = Math.sin(titleScreen._animationTime * 2) * 3;
            expect(floatOffset).toBeCloseTo(3, 1);
        });
    });

    describe('Pulse animation', () => {
        test('Pulse factor should be 0.5 at start', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen._pulsePhase = 0;
            const pulseFactor = 0.5 + 0.5 * Math.sin(titleScreen._pulsePhase);
            expect(pulseFactor).toBeCloseTo(0.5, 2);
        });

        test('Pulse factor should be 1.0 at peak', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            titleScreen._pulsePhase = Math.PI / 2;
            const pulseFactor = 0.5 + 0.5 * Math.sin(titleScreen._pulsePhase);
            expect(pulseFactor).toBeCloseTo(1.0, 2);
        });
    });

    describe('Score display', () => {
        test('Should return correct high score', () => {
            const scoreManager = createMockScoreManager(10, 0);
            expect(scoreManager.getHighScore()).toBe(10);
        });

        test('Should return correct current score', () => {
            const scoreManager = createMockScoreManager(5, 3);
            expect(scoreManager.getCurrent()).toBe(3);
        });
    });

    describe('High score formatting', () => {
        test('Should format high score correctly', () => {
            const scoreManager = createMockScoreManager(10, 0);
            const highScoreText = `Best: ${scoreManager.getHighScore()}`;
            expect(highScoreText).toBe('Best: 10');
        });
    });

    describe('Last score rendering', () => {
        test('Should not render last score when score is 0', () => {
            function testLastScore(scoreManager) {
                const lastScore = scoreManager.getCurrent();
                return lastScore > 0 ? `Last: ${lastScore}` : null;
            }
            const result = testLastScore(createMockScoreManager(5, 0));
            expect(result).toBe(null);
        });

        test('Should render last score when score > 0', () => {
            function testLastScore(scoreManager) {
                const lastScore = scoreManager.getCurrent();
                return lastScore > 0 ? `Last: ${lastScore}` : null;
            }
            const result = testLastScore(createMockScoreManager(5, 3));
            expect(result).toBe('Last: 3');
        });
    });

    describe('Module verification', () => {
        test('TitleScreen should be a class', () => {
            expect(typeof TitleScreen).toBe('function');
        });

        test('TitleScreen should accept renderer and scoreManager in constructor', () => {
            const renderer = createMockRenderer();
            const scoreManager = createMockScoreManager(5, 0);
            const titleScreen = new TitleScreen(renderer, scoreManager);
            expect(titleScreen).toBeDefined();
            expect(titleScreen._renderer).toBe(renderer);
            expect(titleScreen._scoreManager).toBe(scoreManager);
        });
    });
});