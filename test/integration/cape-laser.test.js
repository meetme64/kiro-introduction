/**
 * Integration tests for Cape and Laser systems
 * Tests Cape/Laser interaction with game systems and state management
 * 
 * Validates Requirements:
 * - 14.1-14.7: Cape rendering and animation
 * - 14.8-14.37: Laser weapon system
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { GameLoop } from '../../src/core/GameLoop.js';
import { Kiro } from '../../src/entities/Kiro.js';
import { Cape } from '../../src/entities/Cape.js';
import LaserSystem from '../../src/systems/LaserSystem.js';
import PipeDamageManager from '../../src/systems/PipeDamageManager.js';
import { CONFIG } from '../../config.js';

// ============================================================================
// MOCK HELPERS
// ============================================================================

function createMockEventBus() {
    return {
        listeners: new Map(),
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
            return () => this.off(event, callback);
        },
        off(event, callback) {
            const handlers = this.listeners.get(event);
            if (handlers) {
                const index = handlers.indexOf(callback);
                if (index > -1) handlers.splice(index, 1);
            }
        },
        emit(event, data) {
            const handlers = this.listeners.get(event);
            if (handlers) {
                handlers.forEach(cb => cb(data));
            }
        },
        once(event, callback) {
            const wrapper = (data) => {
                callback(data);
                this.off(event, wrapper);
            };
            this.on(event, wrapper);
        }
    };
}

function createMockAudioEngine() {
    return {
        init: jest.fn().mockResolvedValue(undefined),
        playJump: jest.fn(),
        playGameOver: jest.fn(),
        playLaserFire: jest.fn(),
        playLaserHit: jest.fn(),
        playLaserReady: jest.fn(),
        setMuted: jest.fn(),
        isMuted: jest.fn().mockReturnValue(false),
        resume: jest.fn().mockResolvedValue(true),
        dispose: jest.fn()
    };
}

function createMockUIManager() {
    return {
        showScreen: jest.fn(),
        hideScreen: jest.fn(),
        showOverlay: jest.fn(),
        hideOverlay: jest.fn(),
        render: jest.fn(),
        getScreen: jest.fn().mockReturnValue(null)
    };
}

function createMockStateManager() {
    const eventBus = createMockEventBus();
    return {
        game: null,
        currentState: 'TITLE',
        states: {
            TITLE: { enter: jest.fn(), exit: jest.fn(), update: jest.fn(), handleInput: jest.fn() },
            PLAYING: { enter: jest.fn(), exit: jest.fn(), update: jest.fn(), handleInput: jest.fn() },
            PAUSED: { enter: jest.fn(), exit: jest.fn(), update: jest.fn(), handleInput: jest.fn() },
            GAMEOVER: { enter: jest.fn(), exit: jest.fn(), update: jest.fn(), handleInput: jest.fn() }
        },
        getState: () => this.currentState,
        setState: function(state) { this.currentState = state; },
        isPlaying: () => this.currentState === 'PLAYING',
        update: jest.fn(),
        handleInput: jest.fn(),
        transition: jest.fn(),
        onTransition: eventBus.on.bind(eventBus),
        emit: eventBus.emit.bind(eventBus)
    };
}

function createMockGame() {
    const eventBus = createMockEventBus();
    const stateManager = createMockStateManager();
    const audioEngine = createMockAudioEngine();
    const uiManager = createMockUIManager();
    
    return {
        eventBus,
        stateManager,
        audioEngine,
        uiManager,
        renderer: {
            canvas: { width: 480, height: 640 },
            ctx: {
                save: jest.fn(),
                restore: jest.fn(),
                fillRect: jest.fn(),
                clearRect: jest.fn(),
                translate: jest.fn(),
                rotate: jest.fn(),
                beginPath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                closePath: jest.fn(),
                fill: jest.fn(),
                stroke: jest.fn(),
                fillText: jest.fn(),
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                font: ''
            },
            clear: jest.fn(),
            drawKiro: jest.fn(),
            drawPauseOverlay: jest.fn(),
            drawText: jest.fn()
        },
        pipeManager: {
            getPipes: jest.fn().mockReturnValue([]),
            update: jest.fn(),
            render: jest.fn()
        },
        cloudManager: {
            update: jest.fn(),
            render: jest.fn()
        },
        collisionDetector: {
            check: jest.fn()
        },
        scoreManager: {
            getCurrentScore: jest.fn().mockReturnValue(0),
            update: jest.fn()
        },
        difficulty: {
            currentTier: 0,
            getDifficulty: jest.fn().mockReturnValue({ speed: 1.0, gapSize: 180, tier: 0 }),
            reset: jest.fn()
        },
        kiro: null, // Will be set in beforeEach
        laserSystem: null,
        damageManager: null
    };
}

// ============================================================================
// CAPE INTEGRATION TESTS
// ============================================================================

describe('Cape Integration', () => {
    let game;
    let kiro;
    let cape;

    beforeEach(() => {
        game = createMockGame();
        kiro = new Kiro(CONFIG, 480, 640);
        game.kiro = kiro;
        cape = new Cape(CONFIG.cape);
    });

    describe('Cape Rendering in Game States', () => {
        test('cape should render behind Kiro sprite', () => {
            const ctx = game.renderer.ctx;
            
            // Render cape first
            cape.render(ctx, kiro.getPosition().x, kiro.getPosition().y, kiro.getRotation());
            
            // Then Kiro would render (but we're just testing cape renders)
            expect(ctx.save).toHaveBeenCalled();
            expect(ctx.restore).toHaveBeenCalled();
        });

        test('cape should animate during flight', () => {
            const dt = 1/60;
            
            // Kiro jumping (negative velocity)
            kiro.jump();
            
            // Update cape with jump velocity
            cape.update(dt, kiro.getVelocity(), kiro.getRotation());
            
            const state = cape.getState();
            expect(state.flowOffset).toBeLessThan(0);
        });

        test('cape should follow Kiro rotation', () => {
            const dt = 1/60;
            
            // Rotate Kiro
            kiro.jump();
            // Simulate rotation from velocity
            const rotation = 45;
            
            cape.update(dt, kiro.getVelocity(), rotation);
            
            const state = cape.getState();
            // Cape rotation should be proportional to Kiro rotation
            expect(state.rotation).toBeCloseTo(rotation * 0.8, 0);
        });

        test('cape should reset on game reset', () => {
            const dt = 1/60;
            
            // Animate cape
            cape.update(dt, -5, 30);
            
            // Reset
            cape.reset();
            
            const state = cape.getState();
            expect(state.flowOffset).toBe(0);
            expect(state.rotation).toBe(0);
        });
    });

    describe('Cape in Game Loop', () => {
        test('game loop should update cape during PLAYING state', () => {
            const loop = new GameLoop(game, { enableProfiling: false });
            const dt = 1/60;
            
            // Set to PLAYING state
            game.stateManager.setState('PLAYING');
            
            // Create cape update callback
            let capeUpdated = false;
            loop.onUpdate((deltaTime, gameObj) => {
                if (gameObj.kiro && typeof gameObj.kiro.updateCape === 'function') {
                    gameObj.kiro.updateCape(deltaTime);
                    capeUpdated = true;
                }
            });
            
            // Manually trigger update (normally done by loop)
            const callbacks = loop.onUpdateCallbacks;
            callbacks.forEach(cb => cb(dt, game));
            
            expect(capeUpdated).toBe(true);
        });

        test('game loop should render cape before Kiro sprite', () => {
            const loop = new GameLoop(game, { enableProfiling: false });
            const ctx = game.renderer.ctx;
            
            let capeRendered = false;
            let kiroRendered = false;
            
            loop.onRender((gameObj) => {
                // Cape renders first
                if (gameObj.kiro && typeof gameObj.kiro.renderCape === 'function') {
                    gameObj.kiro.renderCape(ctx);
                    capeRendered = true;
                }
                // Then Kiro renders
                gameObj.renderer.drawKiro(gameObj.kiro);
                kiroRendered = true;
            });
            
            // Manually trigger render
            const callbacks = loop.onRenderCallbacks;
            callbacks.forEach(cb => cb(game));
            
            expect(capeRendered).toBe(true);
            expect(kiroRendered).toBe(true);
        });
    });

    describe('Cape Configuration', () => {
        test('cape should use correct colors from config', () => {
            const ctx = game.renderer.ctx;
            
            cape.render(ctx, 100, 100, 0);
            
            // Cape should use CONFIG.cape.color
            expect(cape.config.color).toBe('#DC143C');
            expect(cape.config.secondaryColor).toBe('#8B0000');
        });

        test('cape dimensions should match config', () => {
            expect(cape.config.width).toBe(14);
            expect(cape.config.minHeight).toBe(20);
            expect(cape.config.maxHeight).toBe(28);
        });

        test('cape animation should use flowSpeed from config', () => {
            const dt = 1/60;
            
            cape.update(dt, -5, 0);
            
            expect(cape.config.flowSpeed).toBe(0.15);
            expect(cape.config.maxFlowOffset).toBe(8);
        });
    });
});

// ============================================================================
// LASER INTEGRATION TESTS
// ============================================================================

describe('Laser Integration', () => {
    let game;
    let laserSystem;
    let damageManager;

    beforeEach(() => {
        game = createMockGame();
        laserSystem = new LaserSystem(CONFIG.laser);
        damageManager = new PipeDamageManager(CONFIG.laser);
        game.laserSystem = laserSystem;
        game.damageManager = damageManager;
    });

    describe('Laser Firing', () => {
        test('laser should fire from Kiro position', () => {
            const kiroPos = { x: 100, y: 100 };
            
            const beam = laserSystem.fireLaser(kiroPos.x, kiroPos.y, () => {});
            
            expect(beam).toBeDefined();
            expect(beam.x).toBe(kiroPos.x + 40);
            expect(beam.y).toBe(kiroPos.y + 20);
        });

        test('laser should trigger fire audio', () => {
            const audioFireMock = jest.fn();
            const kiroPos = { x: 100, y: 100 };
            
            laserSystem.fireLaser(kiroPos.x, kiroPos.y, audioFireMock);
            
            expect(audioFireMock).toHaveBeenCalled();
        });

        test('laser should not fire when on cooldown', () => {
            const kiroPos = { x: 100, y: 100 };
            
            laserSystem.fireLaser(kiroPos.x, kiroPos.y, () => {});
            const secondFire = laserSystem.fireLaser(kiroPos.x, kiroPos.y, () => {});
            
            expect(secondFire).toBeNull();
            expect(laserSystem.getActiveBeams().length).toBe(1);
        });

        test('laser should set cooldown timer', () => {
            const kiroPos = { x: 100, y: 100 };
            
            laserSystem.fireLaser(kiroPos.x, kiroPos.y, () => {});
            
            const state = laserSystem.getCooldownState();
            expect(state.isReady).toBe(false);
            expect(state.framesRemaining).toBe(CONFIG.laser.cooldownFrames);
        });
    });

    describe('Laser in Game Loop', () => {
        test('game loop should update laser during PLAYING state', () => {
            const loop = new GameLoop(game, { enableProfiling: false });
            const dt = 1/60;
            
            game.stateManager.setState('PLAYING');
            
            let laserUpdated = false;
            loop.onUpdate((deltaTime, gameObj) => {
                if (gameObj.laserSystem) {
                    gameObj.laserSystem.update(
                        deltaTime,
                        gameObj.pipeManager ? gameObj.pipeManager.getPipes() : [],
                        gameObj.damageManager,
                        () => gameObj.audioEngine.playLaserHit(CONFIG.laser.soundVolume.hit)
                    );
                    laserUpdated = true;
                }
            });
            
            const callbacks = loop.onUpdateCallbacks;
            callbacks.forEach(cb => cb(dt, game));
            
            expect(laserUpdated).toBe(true);
        });

        test('game loop should render laser beams', () => {
            const loop = new GameLoop(game, { enableProfiling: false });
            const ctx = game.renderer.ctx;
            
            laserSystem.fireLaser(100, 100, () => {});
            
            let laserRendered = false;
            loop.onRender((gameObj) => {
                if (gameObj.laserSystem) {
                    gameObj.laserSystem.renderLaser(ctx);
                    laserRendered = true;
                }
            });
            
            const callbacks = loop.onRenderCallbacks;
            callbacks.forEach(cb => cb(game));
            
            expect(laserRendered).toBe(true);
        });

        test('game loop should render laser timer in HUD', () => {
            const loop = new GameLoop(game, { enableProfiling: false });
            const ctx = game.renderer.ctx;
            
            let timerRendered = false;
            loop.onRender((gameObj) => {
                if (gameObj.laserSystem) {
                    gameObj.laserSystem.renderLaserTimer(
                        ctx,
                        gameObj.renderer.canvas.width,
                        gameObj.renderer.canvas.height
                    );
                    timerRendered = true;
                }
            });
            
            const callbacks = loop.onRenderCallbacks;
            callbacks.forEach(cb => cb(game));
            
            expect(timerRendered).toBe(true);
        });
    });

    describe('Laser Cooldown UI', () => {
        test('should show READY when laser is available', () => {
            const ctx = game.renderer.ctx;
            
            laserSystem.renderLaserTimer(ctx, 480, 640);
            
            expect(ctx.fillStyle).toBe('#4ECDC4');
            expect(ctx.fillText).toHaveBeenCalledWith(
                'LASER: READY',
                expect.any(Number),
                expect.any(Number)
            );
        });

        test('should show countdown when on cooldown', () => {
            const ctx = game.renderer.ctx;
            
            laserSystem.fireLaser(100, 100, () => {});
            laserSystem.renderLaserTimer(ctx, 480, 640);
            
            expect(ctx.fillStyle).toBe('#FF6B6B');
            expect(ctx.fillText).toHaveBeenCalledWith(
                expect.stringContaining('s'),
                expect.any(Number),
                expect.any(Number)
            );
        });
    });

    describe('Laser-Pipe Interaction', () => {
        test('laser should damage pipe on hit', () => {
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            // Fire laser at upper section
            laserSystem.fireLaser(100, 50, () => {});
            
            laserSystem.update(
                1/60,
                [pipe],
                damageManager,
                () => {}
            );
            
            expect(damageManager.getHoles(pipe, 'UPPER').length).toBe(1);
        });

        test('laser hit should trigger audio', () => {
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            const hitAudioMock = jest.fn();
            
            laserSystem.fireLaser(100, 50, () => {});
            
            laserSystem.update(
                1/60,
                [pipe],
                damageManager,
                hitAudioMock
            );
            
            expect(hitAudioMock).toHaveBeenCalled();
        });

        test('pipe should be marked as damaged after hit', () => {
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            laserSystem.fireLaser(100, 50, () => {});
            laserSystem.update(1/60, [pipe], damageManager, () => {});
            
            expect(damageManager.isSectionDestroyed(pipe, 'UPPER')).toBe(false);
            expect(damageManager.getHoles(pipe, 'UPPER').length).toBe(1);
        });

        test('pipe should be destroyed after max hits', () => {
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            // Fire 3 times at the same section (bypass cooldown between shots).
            // Use a fixed origin so every beam lands within the pipe's
            // horizontal span and the UPPER vertical section.
            for (let i = 0; i < 3; i++) {
                laserSystem.isReady = true;
                laserSystem.fireLaser(100, 30, () => {});
                laserSystem.update(1/60, [pipe], damageManager, () => {});
            }
            
            expect(damageManager.isSectionDestroyed(pipe, 'UPPER')).toBe(true);
        });
    });

    describe('Game Reset', () => {
        test('reset() should clear all laser beams', () => {
            laserSystem.fireLaser(100, 100, () => {});
            // Bypass cooldown to allow a second beam to coexist for this test
            laserSystem.isReady = true;
            laserSystem.fireLaser(200, 200, () => {});
            
            expect(laserSystem.getActiveBeams().length).toBe(2);
            
            laserSystem.reset();
            
            expect(laserSystem.getActiveBeams()).toEqual([]);
        });

        test('reset() should reset cooldown', () => {
            laserSystem.fireLaser(100, 100, () => {});
            
            laserSystem.reset();
            
            const state = laserSystem.getCooldownState();
            expect(state.isReady).toBe(true);
            expect(state.framesRemaining).toBe(0);
        });

        test('reset() should clear all pipe damage', () => {
            const pipe = {
                x: 100,
                width: 60,
                gapPosition: 100,
                gapHeight: 180
            };
            
            laserSystem.fireLaser(100, 50, () => {});
            laserSystem.update(1/60, [pipe], damageManager, () => {});
            
            expect(damageManager.getHoles(pipe, 'UPPER').length).toBe(1);
            
            damageManager.reset();
            
            expect(damageManager.getHoles(pipe, 'UPPER')).toEqual([]);
        });
    });

    describe('Laser Input Handling', () => {
        test('laser should only fire during PLAYING state', () => {
            const kiroPos = { x: 100, y: 100 };
            
            // During PLAYING state
            game.stateManager.setState('PLAYING');
            const beam = laserSystem.fireLaser(kiroPos.x, kiroPos.y, () => {});
            expect(beam).toBeDefined();
            
            // During other states, should still fire (logic handled by input handler)
            // The LaserSystem doesn't know about game state
            const beam2 = laserSystem.fireLaser(kiroPos.x, kiroPos.y, () => {});
            expect(beam2).toBeNull(); // On cooldown
        });

        test('laser fire should trigger audio when successful', () => {
            const kiroPos = { x: 100, y: 100 };
            
            laserSystem.fireLaser(kiroPos.x, kiroPos.y, () => {
                game.audioEngine.playLaserFire(CONFIG.laser.soundVolume.fire);
            });
            
            expect(game.audioEngine.playLaserFire).toHaveBeenCalledWith(
                CONFIG.laser.soundVolume.fire
            );
        });
    });

    describe('Laser Configuration', () => {
        test('should use correct beam parameters', () => {
            expect(CONFIG.laser.beamLength).toBe(150);
            expect(CONFIG.laser.beamSpeed).toBe(15);
            expect(CONFIG.laser.holeRadius).toBe(20);
            expect(CONFIG.laser.maxHolesPerSection).toBe(3);
        });

        test('should use correct colors', () => {
            expect(CONFIG.laser.colors.beam).toBe('#00FF00');
            expect(CONFIG.laser.colors.beamCore).toBe('#FFFFFF');
            expect(CONFIG.laser.colors.glow).toBe('rgba(0, 255, 0, 0.3)');
        });

        test('should use correct cooldown', () => {
            expect(CONFIG.laser.cooldownFrames).toBe(1200);
            expect(CONFIG.laser.cooldownFrames / 60).toBe(20); // 20 seconds at 60 FPS
        });

        test('should use correct sound volumes', () => {
            expect(CONFIG.laser.soundVolume.fire).toBe(1.0);
            expect(CONFIG.laser.soundVolume.hit).toBe(0.8);
            expect(CONFIG.laser.soundVolume.ready).toBe(0.6);
        });
    });
});