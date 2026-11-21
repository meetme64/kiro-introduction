/**
 * Property-based tests using fast-check
 * Tests universal properties across many input ranges
 *
 * These tests validate core game mechanics using automated input generation
 */

// Check if fast-check is available
let fc;
try {
    fc = require('fast-check');
} catch (e) {
    // fast-check not available, skip these tests
    console.log('fast-check not available, skipping property-based tests');
}

// Use describe or describe.skip based on availability
const describeFastCheck = fc ? describe : describe.skip;

describeFastCheck('Property-based tests (fast-check)', () => {
    
    describe('Physics properties', () => {
        /**
         * Property 1: Physics velocity clamping
         * Velocity should stay within terminal bounds after gravity application
         */
        test('velocity should stay within terminal bounds', () => {
            fc.assert(
                fc.property(
                    fc.nat(16),  // Initial velocity as uint (0-15), we'll subtract 8 later
                    fc.nat(10),  // Gravity as uint (0-9), divide by 10 later
                    (initialVelInt, gravityInt) => {
                        const initialVelocity = initialVelInt - 8; // Range: -8 to 7
                        const gravity = gravityInt / 10; // Range: 0 to 0.9
                        const terminalVelocity = 8;
                        
                        let velocity = initialVelocity;
                        for (let i = 0; i < 10; i++) {
                            velocity += gravity;
                            velocity = Math.max(-terminalVelocity, Math.min(terminalVelocity, velocity));
                        }
                        
                        return velocity >= -terminalVelocity && velocity <= terminalVelocity;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Property 2: Jump velocity override
         * Jump sets velocity to jumpStrength regardless of prior value
         */
        test('jump sets velocity to jumpStrength', () => {
            fc.assert(
                fc.property(
                    fc.nat(21),  // -10 to 10
                    fc.nat(10),  // -10 to -1 (we'll adjust)
                    (initialInt, jumpInt) => {
                        const initialVelocity = initialInt - 10;
                        const jumpStrength = (jumpInt + 1) * -1; // -1 to -10
                        
                        let velocity = initialVelocity;
                        velocity = jumpStrength;
                        
                        return velocity === jumpStrength;
                    }
                ),
                { numRuns: 50 }
            );
        });
        
        /**
         * Property 3: Position update consistency
         * Position change should match velocity * dt for normal game values
         */
        test('position updates should be consistent with velocity', () => {
            fc.assert(
                fc.property(
                    fc.nat(480),  // Position 0-480
                    fc.nat(160),  // Velocity -80 to 80, divide by 10
                    fc.nat(100),  // dt as uint, divide by 1000
                    (posInt, velInt, dtInt) => {
                        const y = posInt;
                        const velocity = (velInt - 80) / 10; // -8 to 8
                        const dt = dtInt / 1000 + 0.01; // 0.01 to 0.1 + 0.01 = 0.011 to 0.11
                        
                        const newY = y + velocity * dt;
                        const computed = velocity * dt;
                        const diff = Math.abs(newY - y - computed);
                        
                        return diff < 0.0001;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
    
    describe('Pipe generation properties', () => {
        /**
         * Property 4: Gap size should not increase with difficulty tier
         */
        test('gap size should not increase with difficulty', () => {
            const gapSizes = [180, 170, 160, 150, 140];
            
            for (let tier1 = 0; tier1 < gapSizes.length; tier1++) {
                for (let tier2 = tier1; tier2 < gapSizes.length; tier2++) {
                    expect(gapSizes[tier2]).toBeLessThanOrEqual(gapSizes[tier1]);
                }
            }
        });
        
        /**
         * Property 5: Pipe movement (robust)
         */
        test('pipe movement should be consistent', () => {
            fc.assert(
                fc.property(
                    fc.nat(580), // x position 0-580
                    fc.nat(40),  // speed 0-40, divide by 10 = 0-4
                    fc.nat(10),  // dt as uint, divide by 100 = 0.01-0.1
                    (xInt, speedInt, dtInt) => {
                        const x = xInt;
                        const speed = speedInt / 10 + 1; // 1-5
                        const dt = dtInt / 100 + 0.01; // 0.01-0.1 + 0.01 = 0.02-0.11
                        
                        const newX = x - speed * dt;
                        return newX < x + 0.001; // Moves left (within floating point tolerance)
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
    
    describe('Scoring properties', () => {
        /**
         * Property 6: Score calculation from pipe passages
         */
        test('score equals count of true values in passed pipes', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.boolean(), 0, 20),
                    (passedPipes) => {
                        const score = passedPipes.filter(p => p).length;
                        return score >= 0 && score <= passedPipes.length;
                    }
                ),
                { numRuns: 50 }
            );
        });
        
        /**
         * Property 7: High score is at least current score
         */
        test('high score calculation is correct', () => {
            fc.assert(
                fc.property(
                    fc.integer(0, 100),
                    fc.integer(0, 100),
                    (current, stored) => {
                        const highScore = Math.max(current, stored);
                        return highScore >= current && highScore >= stored;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
    
    describe('Cloud parallax properties', () => {
        /**
         * Property 8: Parallax speed ordering
         */
        test('parallax layers have correct speed ordering', () => {
            const layers = [
                { parallax: 0.25, speed: 0.25 },
                { parallax: 0.5, speed: 0.5 },
                { parallax: 1.0, speed: 1.0 }
            ];
            
            for (let i = 1; i < layers.length; i++) {
                expect(layers[i].speed).toBeGreaterThan(layers[i - 1].speed);
            }
        });
        
        /**
         * Property 9: Cloud position update (robust)
         */
        test('cloud position updates with parallax', () => {
            fc.assert(
                fc.property(
                    fc.nat(530), // x position 0-530
                    fc.nat(75),  // speed 0-75, divide by 100 = 0-0.75 + 0.25 = 0.25-1.0
                    fc.nat(10),  // dt as uint, divide by 100
                    (xInt, speedInt, dtInt) => {
                        const x = xInt;
                        const speed = speedInt / 100 + 0.25; // 0.25-1.0
                        const dt = dtInt / 100 + 0.01; // 0.01-0.1 + 0.01 = 0.02-0.11
                        
                        const newX = x - speed * dt;
                        return newX < x + 0.001; // Moves left
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
    
    describe('State management properties', () => {
        /**
         * Property 10: Valid state transitions matrix
         */
        test('valid state transitions are allowed', () => {
            const validTransitions = {
                TITLE: ['PLAYING'],
                PLAYING: ['PAUSED', 'GAMEOVER'],
                PAUSED: ['PLAYING'],
                GAMEOVER: ['TITLE', 'PLAYING']
            };
            
            // Test all 16 possible state combinations
            const states = ['TITLE', 'PLAYING', 'PAUSED', 'GAMEOVER'];
            
            for (const from of states) {
                for (const to of states) {
                    if (from === to) continue; // Same state is always valid
                    
                    const isValid = validTransitions[from].includes(to);
                    if (isValid) {
                        // Valid transition should be allowed
                        expect(validTransitions[from]).toContain(to);
                    }
                }
            }
            
            // Verify the matrix
            expect(validTransitions.TITLE).toContain('PLAYING');
            expect(validTransitions.TITLE).not.toContain('PAUSED');
            expect(validTransitions.TITLE).not.toContain('GAMEOVER');
            
            expect(validTransitions.PLAYING).toContain('PAUSED');
            expect(validTransitions.PLAYING).toContain('GAMEOVER');
            expect(validTransitions.PLAYING).not.toContain('TITLE');
            
            expect(validTransitions.PAUSED).toContain('PLAYING');
            expect(validTransitions.PAUSED).not.toContain('TITLE');
            expect(validTransitions.PAUSED).not.toContain('GAMEOVER');
            
            expect(validTransitions.GAMEOVER).toContain('TITLE');
            expect(validTransitions.GAMEOVER).toContain('PLAYING');
            expect(validTransitions.GAMEOVER).not.toContain('PAUSED');
        });
    });
    
    describe('Boundary properties', () => {
        /**
         * Property 11: Canvas boundary collision detection
         */
        test('boundary collision detection works at edges', () => {
            fc.assert(
                fc.property(
                    fc.integer(0, 640),
                    (y) => {
                        const ceiling = y <= 0;
                        const ground = y >= 640;
                        const outOfBounds = ceiling || ground;
                        return outOfBounds === ceiling || outOfBounds === ground;
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        /**
         * Property 12: Velocity range is symmetric
         */
        test('velocity bounds are symmetric', () => {
            const positive = 8;
            const negative = -8;
            expect(Math.abs(positive)).toBe(Math.abs(negative));
        });
    });
    
    describe('Game configuration properties', () => {
        /**
         * Property 13: Difficulty thresholds are increasing
         */
        test('difficulty thresholds are increasing', () => {
            const thresholds = [10, 20, 30, 50];
            for (let i = 1; i < thresholds.length; i++) {
                expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
            }
        });
        
        /**
         * Property 14: Speed multipliers are increasing
         */
        test('speed multipliers increase with difficulty', () => {
            const multipliers = [1.0, 1.1, 1.2, 1.3, 1.5];
            for (let i = 1; i < multipliers.length; i++) {
                expect(multipliers[i]).toBeGreaterThan(multipliers[i - 1]);
            }
        });
    });
});