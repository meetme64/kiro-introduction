/**
 * Test Utilities - Assertion helpers and testing utilities
 * Provides consistent assertion methods and test helpers
 */

/**
 * Assertion helpers for tests without a framework
 */
const assertions = {
    /**
     * Assert condition is true
     */
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    },
    
    /**
     * Assert two values are equal
     */
    assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(
                message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
            );
        }
    },
    
    /**
     * Assert two values are deeply equal
     */
    assertDeepEquals(actual, expected, message) {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
            throw new Error(
                message || `Expected ${expectedStr} but got ${actualStr}`
            );
        }
    },
    
    /**
     * Assert value is true (strict)
     */
    assertTrue(value, message) {
        if (value !== true) {
            throw new Error(message || `Expected true but got ${value}`);
        }
    },
    
    /**
     * Assert value is false (strict)
     */
    assertFalse(value, message) {
        if (value !== false) {
            throw new Error(message || `Expected false but got ${value}`);
        }
    },
    
    /**
     * Assert approximate equality for floating point
     */
    assertApprox(actual, expected, tolerance = 0.001, message) {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(
                message || `Expected ~${expected} (±${tolerance}) but got ${actual}`
            );
        }
    },
    
    /**
     * Assert value is within range
     */
    assertInRange(actual, min, max, message) {
        if (actual < min || actual > max) {
            throw new Error(
                message || `Expected ${actual} to be between ${min} and ${max}`
            );
        }
    },
    
    /**
     * Assert function throws
     */
    assertThrows(fn, expectedError, message) {
        let threw = false;
        let error = null;
        
        try {
            fn();
        } catch (e) {
            threw = true;
            error = e;
        }
        
        if (!threw) {
            throw new Error(message || 'Expected function to throw but it did not');
        }
        
        if (expectedError && !error.message.includes(expectedError)) {
            throw new Error(
                message || `Expected error containing "${expectedError}" but got "${error.message}"`
            );
        }
    },
    
    /**
     * Fail test explicitly
     */
    fail(message) {
        throw new Error(message || 'Test failed');
    }
};

/**
 * Async test helper for waiting
 */
function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a spy function
 */
function createSpy() {
    const calls = [];
    const fn = function(...args) {
        calls.push(args);
        return fn._returnValue;
    };
    fn._returnValue = undefined;
    fn.calls = calls;
    fn.called = () => calls.length > 0;
    fn.callCount = () => calls.length;
    fn.returnValue = (value) => { fn._returnValue = value; return fn; };
    
    return fn;
}

/**
 * Generate test data generators for property-based testing
 */
const generators = {
    /**
     * Generate random integer in range
     */
    int(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * Generate random float in range
     */
    float(min, max, precision = 0.001) {
        return Math.round((Math.random() * (max - min) + min) / precision) * precision;
    },
    
    /**
     * Generate random boolean
     */
    bool() {
        return Math.random() > 0.5;
    },
    
    /**
     * Pick random element from array
     */
    pick(array) {
        return array[this.int(0, array.length - 1)];
    },
    
    /**
     * Generate random game state
     */
    gameState() {
        return this.pick(['TITLE', 'PLAYING', 'PAUSED', 'GAMEOVER']);
    },
    
    /**
     * Generate random velocity value
     */
    velocity(min = -8, max = 8) {
        return this.float(min, max, 0.1);
    },
    
    /**
     * Generate random position
     */
    position(maxX = 480, maxY = 640) {
        return {
            x: this.float(0, maxX, 1),
            y: this.float(0, maxY, 1)
        };
    },
    
    /**
     * Generate random pipe configuration
     */
    pipeConfig() {
        return {
            width: this.int(50, 80),
            gapHeight: this.int(120, 200),
            gapPosition: this.int(100, 500),
            speed: this.float(1, 3, 0.1)
        };
    },
    
    /**
     * Generate array of random size
     */
    array(generator, minSize = 0, maxSize = 10) {
        const size = this.int(minSize, maxSize);
        return Array.from({ length: size }, () => generator());
    }
};

/**
 * Run property-based test
 */
async function propertyTest(name, generator, property, iterations = 100) {
    const failures = [];
    
    for (let i = 0; i < iterations; i++) {
        const input = generator();
        try {
            property(input);
        } catch (error) {
            failures.push({ input, error: error.message });
        }
    }
    
    if (failures.length > 0) {
        throw new Error(
            `Property "${name}" failed after ${iterations} iterations:\n` +
            failures.slice(0, 5).map(f => 
                `  Input: ${JSON.stringify(f.input)}\n  Error: ${f.error}`
            ).join('\n') +
            (failures.length > 5 ? `\n  ... and ${failures.length - 5} more failures` : '')
        );
    }
    
    console.log(`✓ Property "${name}" passed ${iterations} iterations`);
}

/**
 * Benchmark function performance
 */
async function benchmark(fn, iterations = 1000) {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    
    const end = performance.now();
    const total = end - start;
    const avg = total / iterations;
    
    return { total, avg, iterations };
}

module.exports = {
    assertions,
    wait,
    createSpy,
    generators,
    propertyTest,
    benchmark
};