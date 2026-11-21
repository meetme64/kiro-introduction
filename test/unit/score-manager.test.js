/**
 * Unit tests for ScoreManager
 * Tests score increment functionality, reset functionality, and checkPassage logic
 * Note: Storage persistence tests verify behavior, not implementation details
 */

import { jest, describe, test, expect } from '@jest/globals';

// Create isolated storage for each test
function createStorage() {
    return {
        store: {},
        getItem(key) { return this.store[key] || null; },
        setItem(key, value) { this.store[key] = String(value); },
        removeItem(key) { delete this.store[key]; },
        clear() { this.store = {}; }
    };
}

describe('ScoreManager', () => {
    describe('Initial state', () => {
        test('initial score is 0', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                expect(manager.getCurrent()).toBe(0);
                expect(manager.pipesPassed.size).toBe(0);
            });
        });
    });

    describe('Score increment', () => {
        test('increment() increases score by 1', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                manager.increment();
                expect(manager.getCurrent()).toBe(1);

                manager.increment();
                expect(manager.getCurrent()).toBe(2);
            });
        });

        test('multiple increments accumulate correctly', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                for (let i = 0; i < 10; i++) {
                    manager.increment();
                }
                expect(manager.getCurrent()).toBe(10);
            });
        });

        test('score never goes negative', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                expect(manager.getCurrent()).toBe(0);

                manager.increment();
                expect(manager.getCurrent()).toBe(1);

                manager.reset();
                expect(manager.getCurrent()).toBe(0);

                // Increment again to ensure it works after reset
                manager.increment();
                expect(manager.getCurrent()).toBe(1);
            });
        });
    });

    describe('Reset functionality', () => {
        test('reset() sets current score to 0', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                for (let i = 0; i < 5; i++) {
                    manager.increment();
                }
                expect(manager.getCurrent()).toBe(5);

                manager.reset();
                expect(manager.getCurrent()).toBe(0);
            });
        });

        test('reset() clears pipesPassed set', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                manager.pipesPassed.add('pipe1');
                manager.pipesPassed.add('pipe2');
                manager.pipesPassed.add('pipe3');
                expect(manager.pipesPassed.size).toBe(3);

                manager.reset();
                expect(manager.pipesPassed.size).toBe(0);
            });
        });

        test('can increment after reset', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                manager.increment();
                manager.increment();
                expect(manager.getCurrent()).toBe(2);

                manager.reset();
                expect(manager.getCurrent()).toBe(0);

                manager.increment();
                expect(manager.getCurrent()).toBe(1);
            });
        });
    });

    describe('Check passage logic', () => {
        test('checkPassage() increments score when ghosty passes pipe', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                const ghosty = { x: 200 };
                const pipe = { x: 100, width: 50, passed: false };

                // ghosty.x (200) > pipe.x (100) + pipe.width (50) = 150
                // 200 > 150 is true
                const result = manager.checkPassage(ghosty, pipe);

                expect(result).toBe(true);
                expect(manager.getCurrent()).toBe(1);
                expect(pipe.passed).toBe(true);
            });
        });

        test('checkPassage() does not increment when pipe already passed', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                const ghosty = { x: 300 };
                const pipe = { x: 100, width: 50, passed: true };

                const result = manager.checkPassage(ghosty, pipe);

                expect(result).toBe(false);
                expect(manager.getCurrent()).toBe(0);
            });
        });

        test('checkPassage() does not increment when ghosty not past pipe', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                const ghosty = { x: 120 };
                const pipe = { x: 100, width: 50, passed: false };

                // 120 > 150 is false
                const result = manager.checkPassage(ghosty, pipe);

                expect(result).toBe(false);
                expect(manager.getCurrent()).toBe(0);
                expect(pipe.passed).toBe(false);
            });
        });
    });

    describe('getCurrent and getHighScore', () => {
        test('getCurrent() returns current score', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                expect(manager.getCurrent()).toBe(0);

                manager.increment();
                manager.increment();
                expect(manager.getCurrent()).toBe(2);

                manager.increment();
                expect(manager.getCurrent()).toBe(3);
            });
        });

        test('getHighScore() returns high score after being set', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                manager.highScore = 50;
                expect(manager.getHighScore()).toBe(50);
            });
        });

        test('getHighScore() returns correct value after saveIfHigher', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });

                for (let i = 0; i < 10; i++) {
                    manager.increment();
                }

                expect(manager.getCurrent()).toBe(10);
                expect(manager.getHighScore()).toBe(0); // Not saved yet

                manager.saveIfHigher();
                expect(manager.getHighScore()).toBe(10);
            });
        });
    });

    describe('High score comparison', () => {
        test('saveIfHigher() updates highScore when current > high', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                manager.highScore = 5;
                expect(manager.getHighScore()).toBe(5);

                manager.increment();
                manager.increment();
                expect(manager.getCurrent()).toBe(2);

                // Current (2) is less than high (5), should return false
                expect(manager.saveIfHigher()).toBe(false);
                expect(manager.getHighScore()).toBe(5);

                // Continue incrementing
                for (let i = 0; i < 5; i++) {
                    manager.increment();
                }
                expect(manager.getCurrent()).toBe(7);

                // Current (7) is greater than high (5), should return true
                expect(manager.saveIfHigher()).toBe(true);
                expect(manager.getHighScore()).toBe(7);
            });
        });

        test('saveIfHigher() returns false when current <= high', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                manager.highScore = 10;

                // Current equals high
                for (let i = 0; i < 10; i++) {
                    manager.increment();
                }
                expect(manager.saveIfHigher()).toBe(false);

                // Current less than high
                manager.reset();
                manager.increment();
                expect(manager.saveIfHigher()).toBe(false);
            });
        });
    });

    describe('Configuration', () => {
        test('highScoreKey is configurable', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'customKey' });
                expect(manager.highScoreKey).toBe('customKey');
            });
        });

        test('default highScoreKey is used when not provided', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({});
                expect(manager.highScoreKey).toBe('flappyKiroHighScore');
            });
        });
    });

    describe('Storage error handling', () => {
        test('saveHighScore() does not throw when storage errors', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                mockStorage.setItem = function() { throw new Error('localStorage access denied'); };
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });
                manager.increment();

                // This should not throw
                expect(() => manager.saveHighScore()).not.toThrow();
            });
        });

        test('saveIfHigher() does not throw when storage errors', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                mockStorage.setItem = function() { throw new Error('QuotaExceededError'); };
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });

                for (let i = 0; i < 10; i++) {
                    manager.increment();
                }

                // This should not throw
                expect(() => manager.saveIfHigher()).not.toThrow();
            });
        });
    });

    describe('Performance requirements', () => {
        test('saveIfHigher() completes within acceptable time', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });

                // Get a high score
                for (let i = 0; i < 100; i++) {
                    manager.increment();
                }

                const startTime = performance.now();
                const result = manager.saveIfHigher();
                const endTime = performance.now();

                expect(result).toBe(true);
                // saveIfHigher should complete very quickly (just comparison and assignment)
                expect(endTime - startTime).toBeLessThan(10);
            });
        });
    });

    describe('Property-based tests', () => {
        test('score is always non-negative after any sequence of operations', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });

                // Perform random operations
                for (let i = 0; i < 100; i++) {
                    const operation = Math.random();
                    if (operation < 0.4) {
                        manager.increment();
                    } else if (operation < 0.7) {
                        manager.saveIfHigher();
                    } else {
                        manager.reset();
                    }
                }

                expect(manager.getCurrent()).toBeGreaterThanOrEqual(0);
            });
        });

        test('reset always sets current score to exactly 0', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });

                // Increment
                for (let i = 0; i < 20; i++) {
                    manager.increment();
                }
                expect(manager.getCurrent()).toBe(20);

                // Reset
                manager.reset();
                expect(manager.getCurrent()).toBe(0);

                // Increment again
                manager.increment();
                manager.increment();
                expect(manager.getCurrent()).toBe(2);

                // Reset again
                manager.reset();
                expect(manager.getCurrent()).toBe(0);
            });
        });

        test('score increments by exactly 1 each time', () => {
            return import('../../src/components/ScoreManager.js').then(({ default: ScoreManager }) => {
                const mockStorage = createStorage();
                global.localStorage = mockStorage;

                const manager = new ScoreManager({ highScoreKey: 'testKey' });

                for (let i = 1; i <= 100; i++) {
                    manager.increment();
                    expect(manager.getCurrent()).toBe(i);
                }
            });
        });
    });
});