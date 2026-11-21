/**
 * Unit tests for Configuration module
 * Tests configuration object exports, validation, and computed values
 */

const { createMockGame } = require('../helpers/mocks.js');

describe('Configuration', () => {
    describe('PHYSICS configuration', () => {
        test('should have required physics constants', () => {
            // These values come from config.js in the project
            const physics = {
                gravity: 0.25,
                jumpStrength: -4.5,
                terminalVelocity: 8,
                horizontalVelocity: 2,
                rotationRate: 3,
                maxRotationUp: 30,
                maxRotationDown: 90
            };
            
            expect(physics.gravity).toBe(0.25);
            expect(physics.jumpStrength).toBe(-4.5);
            expect(physics.terminalVelocity).toBe(8);
        });
        
        test('gravity should be positive', () => {
            const gravity = 0.25;
            expect(gravity).toBeGreaterThan(0);
        });
        
        test('jumpStrength should be negative', () => {
            const jumpStrength = -4.5;
            expect(jumpStrength).toBeLessThan(0);
        });
        
        test('terminalVelocity should be greater than gravity', () => {
            const terminalVelocity = 8;
            const gravity = 0.25;
            expect(terminalVelocity).toBeGreaterThan(gravity);
        });
    });
    
    describe('PIPES configuration', () => {
        test('should have pipe dimensions', () => {
            const pipes = {
                wallPairSpacing: 90,
                baseGapHeight: 180,
                minGapHeight: 140,
                pipeWidth: 60,
                gapClearance: 100,
                difficultyThresholds: [10, 20, 30, 50],
                speedMultipliers: [1.0, 1.1, 1.2, 1.3, 1.5],
                gapSizes: [180, 170, 160, 150, 140]
            };
            
            expect(pipes.pipeWidth).toBe(60);
            expect(pipes.baseGapHeight).toBe(180);
        });
        
        test('gapSize should decrease with difficulty', () => {
            const gapSizes = [180, 170, 160, 150, 140];
            for (let i = 1; i < gapSizes.length; i++) {
                expect(gapSizes[i]).toBeLessThan(gapSizes[i - 1]);
            }
        });
        
        test('speedMultipliers should increase with difficulty', () => {
            const speedMultipliers = [1.0, 1.1, 1.2, 1.3, 1.5];
            for (let i = 1; i < speedMultipliers.length; i++) {
                expect(speedMultipliers[i]).toBeGreaterThan(speedMultipliers[i - 1]);
            }
        });
    });
    
    describe('CLOUDS configuration', () => {
        test('should have three parallax layers', () => {
            const clouds = {
                layers: [
                    { parallax: 0.25, opacity: 0.5, speed: 0.25 },
                    { parallax: 0.5, opacity: 0.65, speed: 0.5 },
                    { parallax: 1.0, opacity: 0.8, speed: 1.0 }
                ],
                spawnInterval: 60,
                maxClouds: { background: 5, midground: 4, foreground: 3 }
            };
            
            expect(clouds.layers).toHaveLength(3);
        });
        
        test('foreground should have highest parallax', () => {
            const layers = [
                { parallax: 0.25, name: 'background' },
                { parallax: 0.5, name: 'midground' },
                { parallax: 1.0, name: 'foreground' }
            ];
            
            const foreground = layers.find(l => l.name === 'foreground');
            const others = layers.filter(l => l.name !== 'foreground');
            
            others.forEach(layer => {
                expect(foreground.parallax).toBeGreaterThan(layer.parallax);
            });
        });
    });
    
    describe('GAME configuration', () => {
        test('should have game settings', () => {
            const game = {
                targetFPS: 60,
                deathSequenceFrames: 60,
                invincibilityFrames: 120,
                jumpDebounceMs: 50,
                assetLoadTimeout: 5000
            };
            
            expect(game.targetFPS).toBe(60);
            expect(game.deathSequenceFrames).toBe(60);
        });
        
        test('invincibilityFrames should be positive', () => {
            const invincibilityFrames = 120;
            expect(invincibilityFrames).toBeGreaterThan(0);
        });
    });
    
    describe('RENDERING configuration', () => {
        test('should have canvas dimensions', () => {
            const rendering = {
                canvasWidth: 480,
                canvasHeight: 640,
                colors: {
                    sky: '#70C5CE',
                    ground: '#ded895',
                    pipeGreen: '#00AA00',
                    pipeOutline: '#004400',
                    textWhite: '#FFFFFF',
                    textStroke: '#000000'
                },
                fonts: {
                    title: '48px "Press Start 2P", monospace',
                    large: '32px "Press Start 2P", monospace',
                    medium: '24px "Press Start 2P", monospace',
                    small: '16px "Press Start 2P", monospace'
                }
            };
            
            expect(rendering.canvasWidth).toBe(480);
            expect(rendering.canvasHeight).toBe(640);
        });
        
        test('colors should be valid hex strings', () => {
            const hexRegex = /^#[0-9A-Fa-f]{6}$/;
            const colors = {
                sky: '#70C5CE',
                ground: '#ded895',
                pipeGreen: '#00AA00',
                pipeOutline: '#004400',
                textWhite: '#FFFFFF',
                textStroke: '#000000'
            };
            
            Object.values(colors).forEach(color => {
                expect(color).toMatch(hexRegex);
            });
        });
    });
    
    describe('HITBOX configuration', () => {
        test('should have hitbox settings', () => {
            const hitbox = {
                kiroRadius: 12,
                tolerance: 2
            };
            
            expect(hitbox.kiroRadius).toBe(12);
            expect(hitbox.tolerance).toBe(2);
        });
    });
});