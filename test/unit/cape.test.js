/**
 * Unit tests for Cape entity
 * Tests cape initialization, animation, and rendering
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

describe('Cape', () => {
    let Cape;
    let capeConfig;
    let mockCtx;

    beforeEach(async () => {
        // Dynamic import to ensure fresh module
        const module = await import('../../src/entities/Cape.js');
        Cape = module.Cape;
        
        // Cape configuration
        capeConfig = {
            width: 14,
            minHeight: 20,
            maxHeight: 28,
            color: '#DC143C',
            secondaryColor: '#8B0000',
            flowSpeed: 0.15,
            maxFlowOffset: 8,
            anchorOffset: -5
        };

        // Mock canvas context
        mockCtx = {
            save: jest.fn(),
            restore: jest.fn(),
            translate: jest.fn(),
            rotate: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            closePath: jest.fn(),
            fill: jest.fn(),
            fillRect: jest.fn(),
            stroke: jest.fn(),
            strokeRect: jest.fn(),
            rect: jest.fn(),
            clip: jest.fn()
        };
    });

    describe('Cape Initialization', () => {
        test('should create Cape instance with config', () => {
            const cape = new Cape(capeConfig);
            expect(cape).toBeDefined();
            expect(cape.config).toEqual(capeConfig);
        });

        test('should initialize state with default values', () => {
            const cape = new Cape(capeConfig);
            const state = cape.getState();
            
            expect(state.flowOffset).toBe(0);
            expect(state.currentHeight).toBe(24); // midpoint between minHeight(20) and maxHeight(28)
            expect(state.rotation).toBe(0);
        });

        test('should create cape with correct default height', () => {
            const cape = new Cape(capeConfig);
            const state = cape.getState();
            
            // Initial height should be midpoint
            const expectedHeight = (capeConfig.minHeight + capeConfig.maxHeight) / 2;
            expect(state.currentHeight).toBe(expectedHeight);
        });
    });

    describe('Cape Animation', () => {
        test('update() should animate flow based on upward velocity', () => {
            const cape = new Cape(capeConfig);
            const dt = 1/60; // 60 FPS
            
            // Jumping (negative velocity) should flow upward
            cape.update(dt, -5, 0); // upward velocity
            
            const state = cape.getState();
            expect(state.flowOffset).toBeLessThan(0);
        });

        test('update() should animate flow based on downward velocity', () => {
            const cape = new Cape(capeConfig);
            const dt = 1/60;
            
            // Falling (positive velocity) should drag downward
            cape.update(dt, 5, 0); // downward velocity
            
            const state = cape.getState();
            expect(state.flowOffset).toBeGreaterThan(0);
        });

        test('update() should clamp flow to maxFlowOffset', () => {
            const cape = new Cape(capeConfig);
            const dt = 1/60;
            
            // Apply many updates with strong upward velocity
            for (let i = 0; i < 100; i++) {
                cape.update(dt, -10, 0);
            }
            
            const state = cape.getState();
            expect(state.flowOffset).toBeGreaterThanOrEqual(-capeConfig.maxFlowOffset);
            expect(state.flowOffset).toBeLessThanOrEqual(capeConfig.maxFlowOffset);
        });

        test('update() should adjust height based on flow', () => {
            const cape = new Cape(capeConfig);
            const dt = 1/60;
            
            // Initial state
            const initialHeight = cape.getState().currentHeight;
            
            // Apply flow
            cape.update(dt, -5, 0);
            
            const state = cape.getState();
            const flowRatio = Math.abs(state.flowOffset) / capeConfig.maxFlowOffset;
            const expectedHeight = capeConfig.minHeight + 
                (capeConfig.maxHeight - capeConfig.minHeight) * flowRatio;
            
            expect(state.currentHeight).toBe(expectedHeight);
        });

        test('update() should follow Kiro rotation with lag', () => {
            const cape = new Cape(capeConfig);
            const dt = 1/60;
            
            cape.update(dt, 0, 45); // 45 degree rotation
            
            const state = cape.getState();
            // Cape rotation should be 80% of Kiro rotation
            expect(state.rotation).toBeCloseTo(45 * 0.8, 1);
        });

        test('update() with zero velocity should maintain state', () => {
            const cape = new Cape(capeConfig);
            const dt = 1/60;
            
            const initialState = cape.getState();
            cape.update(dt, 0, 0); // zero velocity
            
            const state = cape.getState();
            expect(state.flowOffset).toBe(initialState.flowOffset);
        });
    });

    describe('Cape Rendering', () => {
        test('render() should save and restore context', () => {
            const cape = new Cape(capeConfig);
            
            cape.render(mockCtx, 100, 100, 0);
            
            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });

        test('render() should translate to anchor point', () => {
            const cape = new Cape(capeConfig);
            
            cape.render(mockCtx, 100, 100, 0);
            
            // Anchor point is kiroX + anchorOffset, kiroY
            expect(mockCtx.translate).toHaveBeenCalledWith(
                100 + capeConfig.anchorOffset,
                100
            );
        });

        test('render() should rotate context', () => {
            const cape = new Cape(capeConfig);
            const rotation = 45 * (Math.PI / 180);
            
            cape.render(mockCtx, 100, 100, 45);
            
            expect(mockCtx.rotate).toHaveBeenCalledWith(rotation);
        });

        test('render() should draw cape shape', () => {
            const cape = new Cape(capeConfig);
            
            cape.render(mockCtx, 100, 100, 0);
            
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.moveTo).toHaveBeenCalled();
            expect(mockCtx.lineTo).toHaveBeenCalled();
            expect(mockCtx.closePath).toHaveBeenCalled();
            expect(mockCtx.fill).toHaveBeenCalled();
        });

        test('render() should use correct colors', () => {
            const cape = new Cape(capeConfig);
            
            cape.render(mockCtx, 100, 100, 0);
            
            // Should fill with primary color
            expect(mockCtx.fillStyle).toBe(capeConfig.color);
        });

        test('render() should add shading', () => {
            const cape = new Cape(capeConfig);
            
            cape.render(mockCtx, 100, 100, 0);
            
            // Should add secondary color shading
            expect(mockCtx.fillRect).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                expect.any(Number),
                expect.any(Number)
            );
        });
    });

    describe('Cape State', () => {
        test('getState() should return current animation state', () => {
            const cape = new Cape(capeConfig);
            const dt = 1/60;
            
            cape.update(dt, -5, 30);
            
            const state = cape.getState();
            expect(state).toHaveProperty('flowOffset');
            expect(state).toHaveProperty('currentHeight');
            expect(state).toHaveProperty('rotation');
        });

        test('reset() should reset to initial state', () => {
            const cape = new Cape(capeConfig);
            const dt = 1/60;
            
            // Apply animation
            cape.update(dt, -5, 45);
            
            // Reset
            cape.reset();
            
            const state = cape.getState();
            expect(state.flowOffset).toBe(0);
            expect(state.rotation).toBe(0);
        });
    });

    describe('Cape Configuration Validation', () => {
        test('should handle zero flowSpeed', () => {
            const config = { ...capeConfig, flowSpeed: 0 };
            const cape = new Cape(config);
            const dt = 1/60;
            
            cape.update(dt, -5, 0);
            
            const state = cape.getState();
            expect(state.flowOffset).toBe(0);
        });

        test('should handle single minHeight equals maxHeight', () => {
            const config = { ...capeConfig, minHeight: 24, maxHeight: 24 };
            const cape = new Cape(config);
            
            const state = cape.getState();
            expect(state.currentHeight).toBe(24);
        });
    });
});