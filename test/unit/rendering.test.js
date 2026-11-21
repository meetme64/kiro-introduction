/**
 * Unit tests for CanvasRenderer
 * Tests canvas clearing, sprite rendering, text rendering, rectangle drawing, and dimensions
 */

import CanvasRenderer from '../../src/rendering/CanvasRenderer.js';

// ============================================================================
// MOCK CANVAS CONTEXT
// ============================================================================

/**
 * Creates a mock context with call tracking
 */
function createMockContext(width = 480, height = 640) {
    const calls = [];
    
    const mockContext = {
        canvas: { width, height },
        fillStyle: null,
        strokeStyle: null,
        lineWidth: 1,
        font: '16px sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
        
        // Track method calls for verification
        clearRect(x, y, w, h) {
            calls.push({ method: 'clearRect', args: [x, y, w, h] });
        },
        fillRect(x, y, w, h) {
            calls.push({ method: 'fillRect', args: [x, y, w, h] });
        },
        strokeRect(x, y, w, h) {
            calls.push({ method: 'strokeRect', args: [x, y, w, h] });
        },
        fillText(text, x, y) {
            calls.push({ method: 'fillText', args: [text, x, y] });
        },
        strokeText(text, x, y) {
            calls.push({ method: 'strokeText', args: [text, x, y] });
        },
        beginPath() {
            calls.push({ method: 'beginPath' });
        },
        moveTo(x, y) {
            calls.push({ method: 'moveTo', args: [x, y] });
        },
        lineTo(x, y) {
            calls.push({ method: 'lineTo', args: [x, y] });
        },
        stroke() {
            calls.push({ method: 'stroke' });
        },
        fill() {
            calls.push({ method: 'fill' });
        },
        closePath() {
            calls.push({ method: 'closePath' });
        },
        save() {
            calls.push({ method: 'save' });
        },
        restore() {
            calls.push({ method: 'restore' });
        },
        translate(x, y) {
            calls.push({ method: 'translate', args: [x, y] });
        },
        rotate(radians) {
            calls.push({ method: 'rotate', args: [radians] });
        },
        scale(x, y) {
            calls.push({ method: 'scale', args: [x, y] });
        },
        arc() {
            calls.push({ method: 'arc' });
        },
        drawImage(image, dx, dy, dw, dh) {
            calls.push({ method: 'drawImage', args: [dx, dy, dw, dh] });
        },
        getImageData() {
            return { data: new Uint8ClampedArray(width * height * 4) };
        },
        putImageData() {},
        
        // For test verification
        _getCalls() {
            return calls;
        },
        _clearCalls() {
            calls.length = 0;
        }
    };
    
    return mockContext;
}

/**
 * Track created canvases to inject our mock context
 */
const createdCanvases = [];

/**
 * Mock HTMLCanvasElement that uses our mock context
 */
function createMockCanvasElement(width = 480, height = 640) {
    const context = createMockContext(width, height);
    const canvas = {
        width,
        height,
        style: {
            display: 'block',
            imageRendering: 'pixelated',
            width: `${width}px`,
            height: `${height}px`
        },
        getContext(type) {
            if (type === '2d') return context;
            return null;
        },
        toDataURL() {
            return 'data:image/png;base64,mock';
        },
        // Expose context for test verification
        _mockContext: context
    };
    createdCanvases.push(canvas);
    return canvas;
}

// Mock document.createElement to return our mock canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = function(tagName) {
    if (tagName.toLowerCase() === 'canvas') {
        return createMockCanvasElement();
    }
    return originalCreateElement(tagName);
};

/**
 * Creates a mock image element
 */
function createMockImage(width = 34, height = 24) {
    return {
        width,
        height,
        complete: true,
        src: 'mock-image.png'
    };
}

/**
 * Creates a test container element
 */
function createTestContainer() {
    const container = {
        children: [],
        appendChild(child) {
            this.children.push(child);
            return child;
        }
    };
    return container;
}

/**
 * Creates a default renderer configuration
 */
function createTestConfig() {
    return {
        baseWidth: 480,
        baseHeight: 640,
        maxWidth: 960,
        maxHeight: 1280,
        skyColor: '#70C5CE'
    };
}

// ============================================================================
// CANVASRENDERER INSTANTIATION TESTS
// ============================================================================

describe('CanvasRenderer instantiation', () => {
    let container;
    let config;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
    });

    test('creates instance with default configuration', () => {
        const renderer = new CanvasRenderer(container, config);

        expect(renderer).toBeDefined();
        expect(renderer.canvas).toBeDefined();
        expect(renderer.context).toBeDefined();
    });

    test('canvas has correct base dimensions', () => {
        const renderer = new CanvasRenderer(container, config);

        expect(renderer.canvas.width).toBe(480);
        expect(renderer.canvas.height).toBe(640);
    });

    test('canvas is appended to container', () => {
        const renderer = new CanvasRenderer(container, config);

        expect(container.children.length).toBe(1);
        expect(container.children[0]).toBe(renderer.canvas);
    });

    test('canvas has pixelated image rendering style', () => {
        const renderer = new CanvasRenderer(container, config);

        expect(renderer.canvas.style.imageRendering).toBe('pixelated');
        expect(renderer.canvas.style.display).toBe('block');
    });

    test('throws when container is null', () => {
        expect(() => {
            new CanvasRenderer(null, config);
        }).toThrow();
    });

    test('throws when config is missing', () => {
        expect(() => {
            new CanvasRenderer(createTestContainer(), null);
        }).toThrow();
    });
});

// ============================================================================
// CLEAR TESTS
// ============================================================================

describe('clear() - Canvas Clearing', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('clear() fills canvas with sky color #70C5CE', () => {
        renderer.clear();

        expect(renderer.context.fillStyle).toBe('#70C5CE');
    });

    test('clear() calls fillRect with correct coordinates', () => {
        renderer.clear();

        const calls = renderer.context._getCalls();
        const fillRectCall = calls.find(c => c.method === 'fillRect');
        
        expect(fillRectCall).toBeDefined();
        expect(fillRectCall.args[0]).toBe(0); // x
        expect(fillRectCall.args[1]).toBe(0); // y
        expect(fillRectCall.args[2]).toBe(480); // width
        expect(fillRectCall.args[3]).toBe(640); // height
    });

    test('clear() uses configured sky color', () => {
        container = createTestContainer();
        config = createTestConfig();
        config.skyColor = '#FF0000';
        const customRenderer = new CanvasRenderer(container, config);
        
        customRenderer.clear();
        
        expect(customRenderer.context.fillStyle).toBe('#FF0000');
    });
});

// ============================================================================
// DRAWSPRITE TESTS
// ============================================================================

describe('drawSprite() - Sprite Rendering', () => {
    let container;
    let config;
    let renderer;
    let testImage;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
        testImage = createMockImage(34, 24);
    });

    test('drawSprite() draws image at correct position', () => {
        const x = 100;
        const y = 200;
        const width = 34;
        const height = 24;

        renderer.drawSprite(testImage, x, y, width, height);

        const calls = renderer.context._getCalls();
        const drawImageCall = calls.find(c => c.method === 'drawImage');
        
        expect(drawImageCall).toBeDefined();
        // For non-rotated sprites, first two args are the offset (centered)
        expect(drawImageCall.args[0]).toBe(x - width / 2); // 100 - 17 = 83
        expect(drawImageCall.args[1]).toBe(y - height / 2); // 200 - 12 = 188
    });

    test('drawSprite() draws image with correct dimensions', () => {
        renderer.drawSprite(testImage, 100, 200, 34, 24);

        const calls = renderer.context._getCalls();
        const drawImageCall = calls.find(c => c.method === 'drawImage');
        
        expect(drawImageCall.args[2]).toBe(34);
        expect(drawImageCall.args[3]).toBe(24);
    });

    test('drawSprite() handles rotation correctly', () => {
        const rotation = 90; // degrees

        renderer.drawSprite(testImage, 100, 200, 34, 24, rotation);

        const calls = renderer.context._getCalls();
        
        // Should use save/restore for rotation
        expect(calls.find(c => c.method === 'save')).toBeDefined();
        expect(calls.find(c => c.method === 'restore')).toBeDefined();
        
        // Should translate to position
        const translateCall = calls.find(c => c.method === 'translate');
        expect(translateCall).toBeDefined();
        expect(translateCall.args[0]).toBe(100);
        expect(translateCall.args[1]).toBe(200);
        
        // Should rotate
        const rotateCall = calls.find(c => c.method === 'rotate');
        expect(rotateCall).toBeDefined();
        // 90 degrees in radians = PI/2
        expect(rotateCall.args[0]).toBeCloseTo(Math.PI / 2, 5);
    });

    test('drawSprite() uses fast path when rotation is 0', () => {
        renderer.drawSprite(testImage, 100, 200, 34, 24, 0);

        const calls = renderer.context._getCalls();
        
        // Should NOT use save/restore for 0 rotation
        expect(calls.filter(c => c.method === 'save').length).toBe(0);
        expect(calls.filter(c => c.method === 'restore').length).toBe(0);
        
        // Should directly call drawImage
        const drawImageCall = calls.find(c => c.method === 'drawImage');
        expect(drawImageCall).toBeDefined();
    });

    test('drawSprite() uses fast path when rotation is undefined (defaults to 0)', () => {
        renderer.drawSprite(testImage, 100, 200, 34, 24);

        const calls = renderer.context._getCalls();
        
        // Should NOT use save/restore for default rotation
        expect(calls.filter(c => c.method === 'save').length).toBe(0);
        expect(calls.filter(c => c.method === 'restore').length).toBe(0);
    });

    test('drawSprite() handles rotation beyond 360 degrees', () => {
        // 450 degrees = 360 + 90, should be equivalent to 90
        renderer.drawSprite(testImage, 100, 200, 34, 24, 450);

        const calls = renderer.context._getCalls();
        const rotateCall = calls.find(c => c.method === 'rotate');
        
        // 450 degrees = 7.854 radians, which is equivalent to PI/2
        expect(rotateCall.args[0]).toBeCloseTo(Math.PI * 2.5, 5);
    });

    test('drawSprite() centers sprite correctly when rotated', () => {
        renderer.drawSprite(testImage, 100, 200, 34, 24, 45);

        const calls = renderer.context._getCalls();
        const drawImageCall = calls.find(c => c.method === 'drawImage');
        
        // In rotated mode, drawImage is called with negative half-dimensions
        expect(drawImageCall.args[0]).toBe(-17); // -width/2
        expect(drawImageCall.args[1]).toBe(-12); // -height/2
    });

    test('drawSprite() handles 360 degree rotation', () => {
        renderer.drawSprite(testImage, 100, 200, 34, 24, 360);

        const calls = renderer.context._getCalls();
        const rotateCall = calls.find(c => c.method === 'rotate');
        
        // 360 degrees = 2*PI radians
        expect(rotateCall.args[0]).toBeCloseTo(Math.PI * 2, 5);
    });
});

// ============================================================================
// DRAWTEXT TESTS
// ============================================================================

describe('drawText() - Text Rendering', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('drawText() renders text with font', () => {
        const font = '24px "Press Start 2P", monospace';
        
        renderer.drawText('Hello', 100, 200, font, '#FFFFFF');

        expect(renderer.context.font).toBe(font);
    });

    test('drawText() applies stroke outline', () => {
        renderer.drawText('Score', 240, 50, '24px monospace', '#FFFFFF');

        // Stroke should be drawn first (black outline)
        const calls = renderer.context._getCalls();
        const strokeTextCall = calls.find(c => c.method === 'strokeText');
        
        expect(strokeTextCall).toBeDefined();
        expect(strokeTextCall.args[0]).toBe('Score');
    });

    test('drawText() draws fill on top of stroke', () => {
        renderer.drawText('Game Over', 240, 320, '32px monospace', '#FFFFFF');

        const calls = renderer.context._getCalls();
        const fillTextCall = calls.find(c => c.method === 'fillText');
        const strokeTextCall = calls.find(c => c.method === 'strokeText');
        
        // Fill should come after stroke
        const fillIndex = calls.indexOf(fillTextCall);
        const strokeIndex = calls.indexOf(strokeTextCall);
        
        expect(strokeIndex).toBeLessThan(fillIndex);
    });

    test('drawText() positions text correctly', () => {
        renderer.drawText('TEST', 150, 100, '16px monospace', '#FFFFFF');

        const calls = renderer.context._getCalls();
        const fillTextCall = calls.find(c => c.method === 'fillText');
        
        expect(fillTextCall.args[1]).toBe(150); // x
        expect(fillTextCall.args[2]).toBe(100); // y
    });

    test('drawText() handles default center alignment', () => {
        renderer.drawText('Center', 240, 320, '16px monospace', '#FFFFFF');

        expect(renderer.context.textAlign).toBe('center');
    });

    test('drawText() handles left alignment', () => {
        renderer.drawText('Left', 50, 100, '16px monospace', '#FFFFFF', 'left');

        expect(renderer.context.textAlign).toBe('left');
    });

    test('drawText() handles right alignment', () => {
        renderer.drawText('Right', 400, 100, '16px monospace', '#FFFFFF', 'right');

        expect(renderer.context.textAlign).toBe('right');
    });

    test('drawText() sets lineWidth for outline', () => {
        renderer.drawText('Text', 100, 200, '16px monospace', '#FFFFFF');

        expect(renderer.context.lineWidth).toBe(3);
    });

    test('drawText() handles empty text gracefully', () => {
        expect(() => {
            renderer.drawText('', 100, 200, '16px monospace', '#FFFFFF');
        }).not.toThrow();
    });

    test('drawText() handles special characters', () => {
        expect(() => {
            renderer.drawText('Score: 100', 240, 50, '24px monospace', '#FFFFFF');
        }).not.toThrow();
    });
});

// ============================================================================
// DRAWRECTANGLE TESTS
// ============================================================================

describe('drawRectangle() - Rectangle Drawing', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('drawRectangle() fills with specified color', () => {
        renderer.drawRectangle(0, 600, 480, 40, '#ded895');

        expect(renderer.context.fillStyle).toBe('#ded895');
    });

    test('drawRectangle() calls fillRect with correct arguments', () => {
        renderer.drawRectangle(10, 20, 100, 50, '#FF0000');

        const calls = renderer.context._getCalls();
        const fillRectCall = calls.find(c => c.method === 'fillRect');
        
        expect(fillRectCall).toBeDefined();
        expect(fillRectCall.args[0]).toBe(10);
        expect(fillRectCall.args[1]).toBe(20);
        expect(fillRectCall.args[2]).toBe(100);
        expect(fillRectCall.args[3]).toBe(50);
    });

    test('drawRectangle() handles zero width', () => {
        expect(() => {
            renderer.drawRectangle(0, 0, 0, 100, '#FF0000');
        }).not.toThrow();
    });

    test('drawRectangle() handles zero height', () => {
        expect(() => {
            renderer.drawRectangle(0, 0, 100, 0, '#FF0000');
        }).not.toThrow();
    });

    test('drawRectangle() handles negative dimensions', () => {
        expect(() => {
            renderer.drawRectangle(100, 100, -50, -50, '#FF0000');
        }).not.toThrow();
    });
});

// ============================================================================
// DRAWOUTLINEDRECTANGLE TESTS
// ============================================================================

describe('drawOutlinedRectangle() - Outlined Rectangle Drawing', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('drawOutlinedRectangle() fills rectangle when fillColor is provided', () => {
        renderer.drawOutlinedRectangle(10, 20, 100, 50, '#FF0000', '#000000', 2);

        const calls = renderer.context._getCalls();
        const fillRectCall = calls.find(c => c.method === 'fillRect');
        
        expect(fillRectCall).toBeDefined();
    });

    test('drawOutlinedRectangle() strokes rectangle when strokeColor and lineWidth > 0', () => {
        renderer.drawOutlinedRectangle(10, 20, 100, 50, null, '#000000', 2);

        const calls = renderer.context._getCalls();
        const strokeRectCall = calls.find(c => c.method === 'strokeRect');
        
        expect(strokeRectCall).toBeDefined();
    });

    test('drawOutlinedRectangle() skips fill when fillColor is null', () => {
        renderer.drawOutlinedRectangle(10, 20, 100, 50, null, '#000000', 2);

        const calls = renderer.context._getCalls();
        const fillRectCall = calls.find(c => c.method === 'fillRect');
        
        expect(fillRectCall).toBeUndefined();
    });

    test('drawOutlinedRectangle() skips stroke when lineWidth is 0', () => {
        renderer.drawOutlinedRectangle(10, 20, 100, 50, '#FF0000', '#000000', 0);

        const calls = renderer.context._getCalls();
        const strokeRectCall = calls.find(c => c.method === 'strokeRect');
        
        expect(strokeRectCall).toBeUndefined();
    });
});

// ============================================================================
// GETDIMENSIONS TESTS
// ============================================================================

describe('getDimensions() - Canvas Dimensions', () => {
    test('getDimensions() returns canvas dimensions', () => {
        const container = createTestContainer();
        const config = createTestConfig();
        const renderer = new CanvasRenderer(container, config);

        const dimensions = renderer.getDimensions();

        expect(dimensions.width).toBe(480);
        expect(dimensions.height).toBe(640);
    });

    test('getDimensions() returns object with width and height properties', () => {
        const container = createTestContainer();
        const config = createTestConfig();
        const renderer = new CanvasRenderer(container, config);

        const dimensions = renderer.getDimensions();

        expect(typeof dimensions.width).toBe('number');
        expect(typeof dimensions.height).toBe('number');
        expect(Object.keys(dimensions).sort()).toEqual(['height', 'width']);
    });

    test('getDimensions() returns updated dimensions after resize', () => {
        const container = createTestContainer();
        const config = createTestConfig();
        const renderer = new CanvasRenderer(container, config);

        renderer.resize(960, 720);

        const dimensions = renderer.getDimensions();

        expect(dimensions.width).toBe(960);
        expect(dimensions.height).toBe(720);
    });
});

// ============================================================================
// RESIZE TESTS
// ============================================================================

describe('resize() - Canvas Resizing', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('resize() updates canvas dimensions within max constraints', () => {
        renderer.resize(960, 1280);

        expect(renderer.canvas.width).toBeLessThanOrEqual(960);
        expect(renderer.canvas.height).toBeLessThanOrEqual(1280);
    });

    test('resize() clamps to maxWidth', () => {
        renderer.resize(2000, 640); // width exceeds max of 960

        expect(renderer.canvas.width).toBe(960); // clamped to max
    });

    test('resize() clamps to maxHeight', () => {
        renderer.resize(480, 2000); // height exceeds max of 1280

        expect(renderer.canvas.height).toBe(1280); // clamped to max
    });

    test('resize() accepts dimensions within limits', () => {
        renderer.resize(480, 640);

        expect(renderer.canvas.width).toBe(480);
        expect(renderer.canvas.height).toBe(640);
    });

    test('resize() updates canvas style dimensions', () => {
        renderer.resize(480, 640);

        expect(renderer.canvas.style.width).toBe('480px');
        expect(renderer.canvas.style.height).toBe('640px');
    });

    test('resize() re-applies pixelated image rendering', () => {
        renderer.resize(480, 640);

        expect(renderer.canvas.style.imageRendering).toBe('pixelated');
    });

    test('resize() handles zero width', () => {
        renderer.resize(0, 640);

        // Zero is within limits, should be applied
        expect(renderer.canvas.width).toBe(0);
    });

    test('resize() handles zero height', () => {
        renderer.resize(480, 0);

        expect(renderer.canvas.height).toBe(0);
    });
});

// ============================================================================
// SETSCALE TESTS
// ============================================================================

describe('setScale() - High DPI Scaling', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('setScale() sets scale values', () => {
        renderer.setScale(2, 2);

        // Scale should be applied
        expect(renderer.canvas.style.width).toBe('240px'); // 480 / 2
        expect(renderer.canvas.style.height).toBe('320px'); // 640 / 2
    });

    test('setScale(1, 1) resets to normal display size', () => {
        renderer.setScale(2, 2);
        
        // Reset canvas dimensions before testing scale 1 behavior
        renderer.canvas.width = 480;
        renderer.canvas.height = 640;
        
        renderer.setScale(1, 1);

        // When scale is 1, style should match canvas dimensions
        expect(renderer.canvas.style.width).toBe('480px');
        expect(renderer.canvas.style.height).toBe('640px');
    });
});

// ============================================================================
// DEGREESTORADIANS TESTS
// ============================================================================

describe('_degreesToRadians() - Angle Conversion', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('converts 0 degrees correctly', () => {
        const radians = renderer._degreesToRadians(0);
        expect(radians).toBe(0);
    });

    test('converts 90 degrees to PI/2', () => {
        const radians = renderer._degreesToRadians(90);
        expect(radians).toBeCloseTo(Math.PI / 2, 10);
    });

    test('converts 180 degrees to PI', () => {
        const radians = renderer._degreesToRadians(180);
        expect(radians).toBeCloseTo(Math.PI, 10);
    });

    test('converts 360 degrees to 2*PI', () => {
        const radians = renderer._degreesToRadians(360);
        expect(radians).toBeCloseTo(Math.PI * 2, 10);
    });

    test('converts 45 degrees correctly', () => {
        const radians = renderer._degreesToRadians(45);
        expect(radians).toBeCloseTo(Math.PI / 4, 10);
    });

    test('converts negative degrees correctly', () => {
        const radians = renderer._degreesToRadians(-90);
        expect(radians).toBeCloseTo(-Math.PI / 2, 10);
    });

    test('converts fractional degrees correctly', () => {
        const radians = renderer._degreesToRadians(33.33);
        expect(radians).toBeCloseTo(33.33 * (Math.PI / 180), 5);
    });
});

// ============================================================================
// CANVAS AND CONTEXT PROPERTY TESTS
// ============================================================================

describe('Canvas and Context Properties', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('canvas property returns the canvas element', () => {
        expect(renderer.canvas).toBeDefined();
        expect(renderer.canvas.width).toBeDefined();
        expect(renderer.canvas.height).toBeDefined();
    });

    test('context property returns the 2D context', () => {
        expect(renderer.context).toBeDefined();
        expect(typeof renderer.context.fillRect).toBe('function');
        expect(typeof renderer.context.fillText).toBe('function');
        expect(typeof renderer.context.drawImage).toBe('function');
    });
});

// ============================================================================
// EDGE CASES TESTS
// ============================================================================

describe('Edge Cases', () => {
    let container;
    let config;
    let renderer;

    beforeEach(() => {
        container = createTestContainer();
        config = createTestConfig();
        renderer = new CanvasRenderer(container, config);
    });

    test('handles zero dimension canvas', () => {
        renderer.resize(0, 0);

        expect(() => {
            renderer.clear();
            renderer.getDimensions();
        }).not.toThrow();
    });

    test('drawSprite() handles very large position values', () => {
        const image = createMockImage(34, 24);

        expect(() => {
            renderer.drawSprite(image, 10000, 10000, 34, 24);
        }).not.toThrow();
    });

    test('drawSprite() handles very small position values', () => {
        const image = createMockImage(34, 24);

        expect(() => {
            renderer.drawSprite(image, -10000, -10000, 34, 24);
        }).not.toThrow();
    });

    test('drawSprite() handles zero size', () => {
        const image = createMockImage(34, 24);

        expect(() => {
            renderer.drawSprite(image, 100, 200, 0, 0);
        }).not.toThrow();
    });

    test('resize() handles negative dimensions gracefully', () => {
        expect(() => {
            renderer.resize(-100, -100);
        }).not.toThrow();
    });
});

// ============================================================================
// MODULE EXPORTS TESTS
// ============================================================================

describe('Module exports', () => {
    test('CanvasRenderer is exported', () => {
        expect(typeof CanvasRenderer).toBe('function');
    });

    test('CanvasRenderer is a constructor', () => {
        const container = createTestContainer();
        const renderer = new CanvasRenderer(container, createTestConfig());

        expect(renderer instanceof CanvasRenderer).toBe(true);
    });
});

// ============================================================================
// RUN TESTS
// ============================================================================

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    console.log('Running CanvasRenderer tests...\n');
}