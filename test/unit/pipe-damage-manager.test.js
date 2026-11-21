/**
 * Unit tests for PipeDamageManager
 * Tests damage tracking, hole management, and pipe rendering with damage
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

describe('PipeDamageManager', () => {
    let PipeDamageManager;
    let damageConfig;

    beforeEach(async () => {
        // Dynamic import to ensure fresh module
        const module = await import('../../src/systems/PipeDamageManager.js');
        PipeDamageManager = module.default || module.PipeDamageManager;
        
        // Damage configuration
        damageConfig = {
            cooldownFrames: 1200,
            beamLength: 150,
            beamSpeed: 15,
            holeRadius: 20,
            maxHolesPerSection: 3,
            colors: { 
                beam: '#00FF00', 
                beamCore: '#FFFFFF', 
                glow: 'rgba(0, 255, 0, 0.3)' 
            },
            soundVolume: { fire: 1.0, hit: 0.8, ready: 0.6 }
        };
    });

    describe('PipeDamageManager Initialization', () => {
        test('should create PipeDamageManager instance with config', () => {
            const manager = new PipeDamageManager(damageConfig);
            expect(manager).toBeDefined();
            expect(manager.config).toEqual(damageConfig);
        });

        test('should start with empty damage map', () => {
            const manager = new PipeDamageManager(damageConfig);
            const damageMap = manager.getDamageMap();
            
            expect(damageMap.size).toBe(0);
        });
    });

    describe('Hit Registration', () => {
        test('registerHit() should increment hit counter', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 50);
            
            expect(manager.isSectionDestroyed(pipe, 'UPPER')).toBe(false);
            expect(manager.getHoles(pipe, 'UPPER').length).toBe(1);
        });

        test('registerHit() should record hole position', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'LOWER', 120, 400);
            
            const holes = manager.getHoles(pipe, 'LOWER');
            expect(holes.length).toBe(1);
            expect(holes[0].x).toBe(120);
            expect(holes[0].y).toBe(400);
            expect(holes[0].radius).toBe(damageConfig.holeRadius);
        });

        test('registerHit() should support multiple hits on same section', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 30);
            manager.registerHit(pipe, 'UPPER', 120, 50);
            manager.registerHit(pipe, 'UPPER', 130, 70);
            
            const holes = manager.getHoles(pipe, 'UPPER');
            expect(holes.length).toBe(3);
        });

        test('registerHit() should not add more holes than maxHolesPerSection', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            // Register 4 hits but only 3 holes should be recorded
            for (let i = 0; i < 4; i++) {
                manager.registerHit(pipe, 'UPPER', 110 + i * 10, 30 + i * 10);
            }
            
            const holes = manager.getHoles(pipe, 'UPPER');
            expect(holes.length).toBe(damageConfig.maxHolesPerSection);
        });

        test('registerHit() should track both sections independently', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 50);
            manager.registerHit(pipe, 'LOWER', 120, 400);
            
            expect(manager.getHoles(pipe, 'UPPER').length).toBe(1);
            expect(manager.getHoles(pipe, 'LOWER').length).toBe(1);
        });

        test('registerHit() should use pipe id if available', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { id: 'pipe-123', x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 50);
            
            const damageMap = manager.getDamageMap();
            expect(damageMap.has('pipe-123')).toBe(true);
        });

        test('registerHit() should generate id from position if not available', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 50);
            
            const damageMap = manager.getDamageMap();
            // Should have generated id from x-gapPosition
            expect(damageMap.size).toBe(1);
        });
    });

    describe('Section Destruction Detection', () => {
        test('isSectionDestroyed() should return false for undamaged section', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            expect(manager.isSectionDestroyed(pipe, 'UPPER')).toBe(false);
        });

        test('isSectionDestroyed() should return false for partial damage', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            // 2 hits (less than maxHolesPerSection = 3)
            manager.registerHit(pipe, 'UPPER', 110, 50);
            manager.registerHit(pipe, 'UPPER', 120, 60);
            
            expect(manager.isSectionDestroyed(pipe, 'UPPER')).toBe(false);
        });

        test('isSectionDestroyed() should return true when max hits reached', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            // 3 hits = maxHolesPerSection
            for (let i = 0; i < 3; i++) {
                manager.registerHit(pipe, 'UPPER', 110 + i * 10, 50 + i * 10);
            }
            
            expect(manager.isSectionDestroyed(pipe, 'UPPER')).toBe(true);
        });

        test('isSectionDestroyed() should track sections independently', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            // Destroy upper section
            for (let i = 0; i < 3; i++) {
                manager.registerHit(pipe, 'UPPER', 110 + i * 10, 50 + i * 10);
            }
            
            expect(manager.isSectionDestroyed(pipe, 'UPPER')).toBe(true);
            expect(manager.isSectionDestroyed(pipe, 'LOWER')).toBe(false);
        });
    });

    describe('Hole Detection', () => {
        test('hasHoleAt() should detect point inside hole', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 120, 50);
            
            // Point at center of hole
            expect(manager.hasHoleAt(pipe, 'UPPER', 120, 50)).toBe(true);
        });

        test('hasHoleAt() should detect point near hole edge', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 120, 50);
            
            // Point just inside radius
            expect(manager.hasHoleAt(pipe, 'UPPER', 135, 50)).toBe(true);
        });

        test('hasHoleAt() should not detect point outside hole', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 120, 50);
            
            // Point outside radius
            expect(manager.hasHoleAt(pipe, 'UPPER', 150, 50)).toBe(false);
        });

        test('hasHoleAt() should return false for undamaged section', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            expect(manager.hasHoleAt(pipe, 'UPPER', 120, 50)).toBe(false);
        });

        test('hasHoleAt() should check multiple holes', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 100, 30);
            manager.registerHit(pipe, 'UPPER', 130, 50);
            
            expect(manager.hasHoleAt(pipe, 'UPPER', 130, 50)).toBe(true);
        });

        test('hasHoleAt() should work with lower section', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'LOWER', 120, 400);
            
            expect(manager.hasHoleAt(pipe, 'LOWER', 120, 400)).toBe(true);
        });
    });

    describe('Hole Retrieval', () => {
        test('getHoles() should return empty array for undamaged section', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            const holes = manager.getHoles(pipe, 'UPPER');
            expect(holes).toEqual([]);
        });

        test('getHoles() should return all holes for damaged section', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 30);
            manager.registerHit(pipe, 'UPPER', 120, 40);
            
            const holes = manager.getHoles(pipe, 'UPPER');
            expect(holes.length).toBe(2);
        });

        test('getHoles() should return holes with correct properties', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 120, 50);
            
            const holes = manager.getHoles(pipe, 'UPPER');
            expect(holes[0]).toHaveProperty('x', 120);
            expect(holes[0]).toHaveProperty('y', 50);
            expect(holes[0]).toHaveProperty('radius', damageConfig.holeRadius);
        });
    });

    describe('Damage Clearing', () => {
        test('clearDamage() should remove all damage for specific pipe', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 50);
            manager.registerHit(pipe, 'LOWER', 120, 400);
            
            manager.clearDamage(pipe);
            
            expect(manager.getHoles(pipe, 'UPPER')).toEqual([]);
            expect(manager.getHoles(pipe, 'LOWER')).toEqual([]);
        });

        test('reset() should clear all damage', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe1 = { x: 100, gapPosition: 100, gapHeight: 180 };
            const pipe2 = { x: 200, gapPosition: 150, gapHeight: 180 };
            
            manager.registerHit(pipe1, 'UPPER', 110, 50);
            manager.registerHit(pipe2, 'LOWER', 210, 400);
            
            manager.reset();
            
            const damageMap = manager.getDamageMap();
            expect(damageMap.size).toBe(0);
        });

        test('cleanup() should remove off-screen pipes', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const offScreenPipe = { x: -150, gapPosition: 100, gapHeight: 180 };
            const onScreenPipe = { x: 200, gapPosition: 150, gapHeight: 180 };
            
            manager.registerHit(offScreenPipe, 'UPPER', -140, 50);
            manager.registerHit(onScreenPipe, 'LOWER', 210, 400);
            
            manager.cleanup(480); // Canvas width
            
            // Off-screen pipe damage should be cleaned up
            const damageMap = manager.getDamageMap();
            expect(damageMap.size).toBe(1);
        });
    });

    describe('Pipe Rendering with Holes', () => {
        let mockCtx;

        beforeEach(() => {
            mockCtx = {
                save: jest.fn(),
                restore: jest.fn(),
                fillRect: jest.fn(),
                strokeRect: jest.fn(),
                beginPath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                closePath: jest.fn(),
                fill: jest.fn(),
                stroke: jest.fn(),
                rect: jest.fn(),
                clip: jest.fn(),
                arc: jest.fn(),
                roundRect: jest.fn()
            };
        });

        test('renderPipeWithHoles() should render normal pipe when no damage', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, width: 60, gapPosition: 100, gapHeight: 180 };
            
            manager.renderPipeWithHoles(mockCtx, pipe, 'UPPER');
            
            // Should have called fillRect for normal pipe
            expect(mockCtx.fillRect).toHaveBeenCalled();
        });

        test('renderPipeWithHoles() should render with holes when damaged', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, width: 60, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 120, 50);
            manager.renderPipeWithHoles(mockCtx, pipe, 'UPPER');
            
            // Should have used clip for holes
            expect(mockCtx.clip).toHaveBeenCalledWith('evenodd');
        });

        test('renderPipeWithHoles() should use specified colors', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, width: 60, gapPosition: 100, gapHeight: 180 };
            
            manager.renderPipeWithHoles(mockCtx, pipe, 'UPPER', '#00AA00', '#004400');
            
            expect(mockCtx.fillStyle).toBe('#00AA00');
            expect(mockCtx.strokeStyle).toBe('#004400');
        });

        test('renderPipeWithHoles() should draw hole outlines', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, width: 60, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 120, 50);
            manager.renderPipeWithHoles(mockCtx, pipe, 'UPPER');
            
            // Should have drawn arc for hole outline
            expect(mockCtx.arc).toHaveBeenCalled();
        });

        test('renderPipeWithHoles() should handle lower section', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, width: 60, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'LOWER', 120, 400);
            manager.renderPipeWithHoles(mockCtx, pipe, 'LOWER');
            
            // Should have called fillRect for lower section
            expect(mockCtx.fillRect).toHaveBeenCalled();
        });
    });

    describe('Damage Map Inspection', () => {
        test('getDamageMap() should return internal damage map', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 50);
            
            const damageMap = manager.getDamageMap();
            expect(damageMap instanceof Map).toBe(true);
        });

        test('damageMap should track damage correctly', () => {
            const manager = new PipeDamageManager(damageConfig);
            
            const pipe = { x: 100, gapPosition: 100, gapHeight: 180 };
            
            manager.registerHit(pipe, 'UPPER', 110, 50);
            
            const damageMap = manager.getDamageMap();
            const pipeId = `${pipe.x}_${pipe.gapPosition}`;
            const damage = damageMap.get(pipeId);
            
            expect(damage.UPPER.hits).toBe(1);
            expect(damage.LOWER.hits).toBe(0);
        });
    });
});