/**
 * Unit tests for CloudRenderer
 * Tests cloud rendering with procedural and sprite-based rendering
 */

import CloudRenderer from './CloudRenderer.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockContext() {
    const drawCalls = [];
    const ctx = {
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        drawImage: (...args) => {
            drawCalls.push({ type: 'drawImage', args });
        },
        fillStyle: '',
        fillRect: () => {},
        strokeStyle: '',
        strokeRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        globalAlpha: 1
    };
    ctx.setGlobalAlpha = (alpha) => { ctx.globalAlpha = alpha; };
    return { ctx, drawCalls };
}

function createMockAssetLoader() {
    const assets = {};
    return {
        assets,
        get(key) {
            return assets[key];
        },
        set(key, value) {
            assets[key] = value;
        }
    };
}

function createCloudConfig() {
    return {
        layers: {
            background: { parallax: 0.25, speed: 0.25 },
            midground: { parallax: 0.5, speed: 0.5 },
            foreground: { parallax: 1.0, speed: 1.0 }
        },
        sizes: {
            small: { width: 60, height: 30 },
            medium: { width: 80, height: 40 },
            large: { width: 140, height: 70 }
        },
        sway: { amplitude: 5, frequency: 0.5 }
    };
}

// ============================================================================
// TESTS
// ============================================================================

describe('CloudRenderer', () => {
    describe('Constructor', () => {
        test('Should create instance with context, assetLoader, and config', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            expect(renderer).toBeDefined();
            expect(renderer._ctx).toBe(ctx);
            expect(renderer._assetLoader).toBe(assetLoader);
            expect(renderer._config).toBe(config);
        });

        test('Should initialize proceduralCache to null', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            expect(renderer._proceduralCache).toBeNull();
        });
    });

    describe('render() method', () => {
        test('Should handle empty array gracefully', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            expect(() => renderer.render([])).not.toThrow();
        });

        test('Should handle null gracefully', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            expect(() => renderer.render(null)).not.toThrow();
        });
    });

    describe('_calculateSway() method', () => {
        test('Should return a number', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            const cloud = { x: 100, y: 100, layer: 'background' };
            const sway = renderer._calculateSway(cloud, 0);
            expect(typeof sway).toBe('number');
        });

        test('Should change over time', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            const cloud = { x: 100, y: 100, layer: 'background' };
            const sway1 = renderer._calculateSway(cloud, 0);
            const sway2 = renderer._calculateSway(cloud, 1);
            expect(sway2).not.toBe(sway1);
        });
    });

    describe('_getCloudSprite() method', () => {
        test('Should return null when assetLoader has no get method', () => {
            const { ctx } = createMockContext();
            const assetLoader = { assets: {} };
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            expect(renderer._getCloudSprite()).toBeNull();
        });

        test('Should return undefined when sprite not loaded', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            expect(renderer._getCloudSprite()).toBeUndefined();
        });

        test('Should return sprite when loaded', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            assetLoader.set('cloud', { width: 100, height: 50 });
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            const sprite = renderer._getCloudSprite();
            expect(sprite).toBeDefined();
        });
    });

    describe('Layer configuration', () => {
        test('Should have three parallax layers', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            const layers = Object.keys(renderer._config.layers);
            expect(layers).toHaveLength(3);
            expect(layers).toContain('background');
            expect(layers).toContain('midground');
            expect(layers).toContain('foreground');
        });

        test('Background layer should have lowest parallax', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            const layers = renderer._config.layers;
            expect(layers.background.parallax).toBeLessThan(layers.midground.parallax);
        });

        test('Foreground layer should have highest parallax', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            const layers = renderer._config.layers;
            expect(layers.foreground.parallax).toBeGreaterThan(layers.midground.parallax);
        });
    });

    describe('Cloud sizes', () => {
        test('Should have three size categories', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            const sizes = Object.keys(renderer._config.sizes);
            expect(sizes).toHaveLength(3);
            expect(sizes).toContain('small');
            expect(sizes).toContain('medium');
            expect(sizes).toContain('large');
        });

        test('Large clouds should be larger than small clouds', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            const sizes = renderer._config.sizes;
            expect(sizes.large.width).toBeGreaterThan(sizes.small.width);
            expect(sizes.large.height).toBeGreaterThan(sizes.small.height);
        });
    });

    describe('Module exports', () => {
        test('CloudRenderer should be a class/function', () => {
            expect(typeof CloudRenderer).toBe('function');
        });

        test('CloudRenderer should be constructable', () => {
            const { ctx } = createMockContext();
            const assetLoader = createMockAssetLoader();
            const config = createCloudConfig();
            const renderer = new CloudRenderer(ctx, assetLoader, config);
            expect(renderer).toBeInstanceOf(CloudRenderer);
        });
    });
});