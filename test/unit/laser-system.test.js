/**
 * Unit tests for LaserSystem
 * Tests laser firing, cooldown management, beam movement, and collision detection
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

describe('LaserSystem', () => {
    let LaserSystem;
    let laserConfig;
    let mockCallback;

    beforeEach(async () => {
        // Dynamic import to ensure fresh module
        const module = await import('../../src/systems/LaserSystem.js');
        LaserSystem = module.default || module.LaserSystem;
        
        // Laser configuration
        laserConfig = {
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

        mockCallback = jest.fn();
    });

    describe('LaserSystem Initialization', () => {
        test('should create LaserSystem instance with config', () => {
            const system = new LaserSystem(laserConfig);
            expect(system).toBeDefined();
            expect(system.config).toEqual(laserConfig);
        });

        test('should start with empty active beams', () => {
            const system = new LaserSystem(laserConfig);
            const beams = system.getActiveBeams();
            expect(beams).toEqual([]);
        });

        test('should start ready with no cooldown', () => {
            const system = new LaserSystem(laserConfig);
            const state = system.getCooldownState();
            
            expect(state.isReady).toBe(true);
            expect(state.remaining).toBe(0);
            expect(state.framesRemaining).toBe(0);
        });
    });

    describe('Laser Firing', () => {
        test('fireLaser() should create a new beam', () => {
            const system = new LaserSystem(laserConfig);
            
            const beam = system.fireLaser(100, 100, mockCallback);
            
            expect(beam).toBeDefined();
            expect(beam.x).toBe(140); // 100 + 40 (front of Kiro)
            expect(beam.y).toBe(120); // 100 + 20 (center)
            expect(beam.length).toBe(laserConfig.beamLength);
            expect(beam.speed).toBe(laserConfig.beamSpeed);
        });

        test('fireLaser() should not fire when on cooldown', () => {
            const system = new LaserSystem(laserConfig);
            
            // First fire should succeed
            system.fireLaser(100, 100, mockCallback);
            
            // Second fire should return null
            const result = system.fireLaser(100, 100, mockCallback);
            
            expect(result).toBeNull();
            expect(system.getActiveBeams().length).toBe(1);
        });

        test('fireLaser() should trigger fire callback', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            
            expect(mockCallback).toHaveBeenCalled();
        });

        test('fireLaser() should set cooldown', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            
            const state = system.getCooldownState();
            expect(state.isReady).toBe(false);
            expect(state.framesRemaining).toBe(laserConfig.cooldownFrames);
            expect(state.secondsRemaining).toBe(laserConfig.cooldownFrames / 60);
        });

        test('fireLaser() should add beam to active beams', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            
            const beams = system.getActiveBeams();
            expect(beams.length).toBe(1);
        });

        test('fireLaser() should handle null onFire callback', () => {
            const system = new LaserSystem(laserConfig);
            
            // Should not throw
            expect(() => {
                system.fireLaser(100, 100, null);
                system.fireLaser(100, 100, undefined);
            }).not.toThrow();
        });
    });

    describe('Cooldown Management', () => {
        test('update() should decrement cooldown', () => {
            const system = new LaserSystem(laserConfig);
            const dt = 1/60;
            
            system.fireLaser(100, 100, mockCallback);
            const initialState = system.getCooldownState();
            
            // Update multiple frames
            system.update(dt, [], null, mockCallback);
            system.update(dt, [], null, mockCallback);
            system.update(dt, [], null, mockCallback);
            
            const state = system.getCooldownState();
            expect(state.framesRemaining).toBeLessThan(initialState.framesRemaining);
        });

        test('isReady should return true when cooldown is complete', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            expect(system.getCooldownState().isReady).toBe(false);
            
            // Simulate cooldown completion
            system.cooldownRemaining = 0;
            
            expect(system.getCooldownState().isReady).toBe(true);
        });

        test('getCooldownState() should return correct format', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            const state = system.getCooldownState();
            
            expect(state).toHaveProperty('remaining');
            expect(state).toHaveProperty('isReady');
            expect(state).toHaveProperty('framesRemaining');
            expect(state).toHaveProperty('secondsRemaining');
        });
    });

    describe('Beam Movement', () => {
        test('update() should move beam forward', () => {
            const system = new LaserSystem(laserConfig);
            const dt = 1/60;
            
            system.fireLaser(100, 100, mockCallback);
            const initialX = system.getActiveBeams()[0].x;
            
            system.update(dt, [], null, mockCallback);
            
            const beams = system.getActiveBeams();
            expect(beams[0].x).toBeGreaterThan(initialX);
        });

        test('update() should remove beam when off screen', () => {
            const system = new LaserSystem(laserConfig);
            const dt = 1/60;
            
            system.fireLaser(100, 100, mockCallback);
            
            // Move beam way off screen
            const beam = system.getActiveBeams()[0];
            beam.x = 1000; // Beyond 480 + 150 = 630
            
            system.update(dt, [], null, mockCallback);
            
            expect(system.getActiveBeams().length).toBe(0);
        });
    });

    describe('Collision Detection', () => {
        test('update() should detect collision with upper pipe section', () => {
            const system = new LaserSystem(laserConfig);
            const dt = 1/60;
            
            system.fireLaser(100, 50, mockCallback);
            
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            const mockDamageManager = {
                registerHit: jest.fn()
            };
            
            system.update(dt, [pipe], mockDamageManager, mockCallback);
            
            expect(mockDamageManager.registerHit).toHaveBeenCalledWith(
                pipe, 
                'UPPER', 
                expect.any(Number), 
                expect.any(Number)
            );
        });

        test('update() should detect collision with lower pipe section', () => {
            const system = new LaserSystem(laserConfig);
            const dt = 1/60;
            
            system.fireLaser(100, 400, mockCallback);
            
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            const mockDamageManager = {
                registerHit: jest.fn()
            };
            
            system.update(dt, [pipe], mockDamageManager, mockCallback);
            
            expect(mockDamageManager.registerHit).toHaveBeenCalledWith(
                pipe, 
                'LOWER', 
                expect.any(Number), 
                expect.any(Number)
            );
        });

        test('update() should trigger hit callback on collision', () => {
            const system = new LaserSystem(laserConfig);
            const dt = 1/60;
            
            system.fireLaser(100, 50, mockCallback);
            
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            const mockDamageManager = {
                registerHit: jest.fn()
            };
            
            system.update(dt, [pipe], mockDamageManager, mockCallback);
            
            expect(mockCallback).toHaveBeenCalled();
        });

        test('update() should remove beam after collision', () => {
            const system = new LaserSystem(laserConfig);
            const dt = 1/60;
            
            system.fireLaser(100, 50, mockCallback);
            expect(system.getActiveBeams().length).toBe(1);
            
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            const mockDamageManager = {
                registerHit: jest.fn()
            };
            
            system.update(dt, [pipe], mockDamageManager, mockCallback);
            
            expect(system.getActiveBeams().length).toBe(0);
        });

        test('update() should not collide with pipes when not overlapping', () => {
            const system = new LaserSystem(laserConfig);
            const dt = 1/60;
            
            system.fireLaser(100, 300, mockCallback); // In the gap
            
            const pipe = {
                x: 400, // Pipe is far to the right, beyond beam's reach
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            const mockDamageManager = {
                registerHit: jest.fn()
            };
            
            system.update(dt, [pipe], mockDamageManager, mockCallback);
            
            expect(mockDamageManager.registerHit).not.toHaveBeenCalled();
            expect(system.getActiveBeams().length).toBe(1); // Beam still exists
        });
    });

    describe('Laser Rendering', () => {
        let mockCtx;

        beforeEach(() => {
            mockCtx = {
                save: jest.fn(),
                restore: jest.fn(),
                fillRect: jest.fn(),
                beginPath: jest.fn(),
                rect: jest.fn(),
                clip: jest.fn(),
                fill: jest.fn(),
                stroke: jest.fn()
            };
        });

        test('renderLaser() should draw glow for each beam', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            system.renderLaser(mockCtx);
            
            // Should save context for each beam
            expect(mockCtx.save).toHaveBeenCalled();
        });

        test('renderLaser() should draw glow rectangle', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            system.renderLaser(mockCtx);
            
            // Should fill glow rectangle (height 8)
            expect(mockCtx.fillRect).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                laserConfig.beamLength,
                8
            );
        });

        test('renderLaser() should draw main beam', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            system.renderLaser(mockCtx);
            
            // Should draw main beam (height 4) and core (height 2)
            const fillRectCalls = mockCtx.fillRect.mock.calls;
            expect(fillRectCalls.length).toBeGreaterThanOrEqual(2);
        });

        test('renderLaser() should use correct colors', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            system.renderLaser(mockCtx);
            
            // Last color applied should be the beam core color
            expect(mockCtx.fillStyle).toBe(laserConfig.colors.beamCore);
        });

        test('renderLaser() with no beams should do nothing', () => {
            const system = new LaserSystem(laserConfig);
            
            system.renderLaser(mockCtx);
            
            expect(mockCtx.fillRect).not.toHaveBeenCalled();
        });
    });

    describe('Laser Timer UI', () => {
        let mockCtx;

        beforeEach(() => {
            mockCtx = {
                save: jest.fn(),
                restore: jest.fn(),
                fillText: jest.fn(),
                font: '',
                fillStyle: ''
            };
        });

        test('renderLaserTimer() should show READY when available', () => {
            const system = new LaserSystem(laserConfig);
            
            system.renderLaserTimer(mockCtx, 480, 640);
            
            expect(mockCtx.fillStyle).toBe('#4ECDC4');
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                'LASER: READY',
                expect.any(Number),
                expect.any(Number)
            );
        });

        test('renderLaserTimer() should show countdown when on cooldown', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            system.renderLaserTimer(mockCtx, 480, 640);
            
            expect(mockCtx.fillStyle).toBe('#FF6B6B');
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                expect.stringContaining('LASER:'),
                expect.any(Number),
                expect.any(Number)
            );
        });

        test('renderLaserTimer() should show timer in seconds', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            system.renderLaserTimer(mockCtx, 480, 640);
            
            // Timer should show seconds remaining (e.g., "20.0s")
            const textCall = mockCtx.fillText.mock.calls[0];
            expect(textCall[0]).toMatch(/\d+\.\ds/);
        });

        test('renderLaserTimer() should save and restore context', () => {
            const system = new LaserSystem(laserConfig);
            
            system.renderLaserTimer(mockCtx, 480, 640);
            
            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });
    });

    describe('Reset Functionality', () => {
        test('reset() should clear all beams', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            // Bypass cooldown to allow a second beam to coexist for this test
            system.isReady = true;
            system.fireLaser(200, 200, mockCallback);
            
            expect(system.getActiveBeams().length).toBe(2);
            
            system.reset();
            
            expect(system.getActiveBeams()).toEqual([]);
        });

        test('reset() should reset cooldown', () => {
            const system = new LaserSystem(laserConfig);
            
            system.fireLaser(100, 100, mockCallback);
            system.reset();
            
            const state = system.getCooldownState();
            expect(state.isReady).toBe(true);
            expect(state.framesRemaining).toBe(0);
        });
    });

    describe('Internal Collision Logic', () => {
        test('_checkBeamCollision() should detect horizontal overlap', () => {
            const system = new LaserSystem(laserConfig);
            
            const beam = { x: 100, length: 50 };
            const pipe = { x: 120, width: 60 };
            
            // Horizontal overlap exists (100+50 > 120 and 100 < 120+60)
            const result = system._checkBeamCollision(beam, pipe, 'UPPER');
            expect(result).toBe(true);
        });

        test('_checkBeamCollision() should detect no horizontal overlap', () => {
            const system = new LaserSystem(laserConfig);
            
            const beam = { x: 0, length: 50 };
            const pipe = { x: 100, width: 60 };
            
            // No horizontal overlap (0+50 < 100)
            const result = system._checkBeamCollision(beam, pipe, 'UPPER');
            expect(result).toBe(false);
        });

        test('_checkBeamCollision() should detect vertical overlap with upper section', () => {
            const system = new LaserSystem(laserConfig);
            
            const beam = { x: 100, length: 50, y: 50 };
            const pipe = { x: 100, width: 60, gapPosition: 100, gapHeight: 180 };
            
            // 50 is within upper section (0 to 100)
            const result = system._checkBeamCollision(beam, pipe, 'UPPER');
            expect(result).toBe(true);
        });

        test('_checkBeamCollision() should detect vertical overlap with lower section', () => {
            const system = new LaserSystem(laserConfig);
            
            const beam = { x: 100, length: 50, y: 400 };
            const pipe = { x: 100, width: 60, gapPosition: 100, gapHeight: 180 };
            
            // 400 is within lower section (280 to 640)
            const result = system._checkBeamCollision(beam, pipe, 'LOWER');
            expect(result).toBe(true);
        });
    });
});