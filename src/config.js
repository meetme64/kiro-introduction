/**
 * src/config.js - Centralized Game Configuration
 */

export const CONFIG = {
    physics: {
        gravity: 0.25,
        jumpStrength: -4.5,
        terminalVelocity: 8.0,
        horizontalVelocity: 2.0,
        rotationRate: 3,
        maxRotationUp: 30,
        maxRotationDown: 90
    },
    pipes: {
        wallPairSpacing: 90,
        baseGapHeight: 180,
        minGapHeight: 140,
        pipeWidth: 60,
        gapClearance: 50,
        difficultyThresholds: [10, 20, 30, 50],
        speedMultipliers: [1.0, 1.1, 1.2, 1.3, 1.5],
        gapSizes: [180, 170, 160, 150, 140]
    },
    clouds: {
        layers: {
            background: { speed: 0.5, opacity: 0.5 },
            midground: { speed: 1.0, opacity: 0.65 },
            foreground: { speed: 2.0, opacity: 0.8 }
        },
        spawnInterval: 120,
        minCloudsPerLayer: 2,
        maxCloudsPerLayer: 5
    },
    game: {
        targetFPS: 60,
        deathSequenceFrames: 60,
        invincibilityFrames: 120,
        invincibilityFlashInterval: 4,
        jumpDebounceMs: 50,
        assetLoadTimeout: 5000,
        debugMode: false
    },
    scoring: {
        highScoreKey: 'flappyKiroHighScore',
        pointsPerPipe: 1
    },
    visual: {
        skyColor: '#70C5CE',
        pipeColor: '#00AA00',
        pipeOutline: '#004400',
        pipeOutlineWidth: 2,
        titleFont: '48px "Press Start 2P", monospace',
        scoreFont: '32px "Press Start 2P", monospace',
        textFont: '24px "Press Start 2P", monospace',
        textColor: '#FFFFFF',
        textOutline: '#000000',
        highScoreColor: '#FFD700',
        canvas: { baseWidth: 480, baseHeight: 640, maxWidth: 480, maxHeight: 640 }
    },
    hitbox: {
        spriteWidth: 40,
        spriteHeight: 40,
        inset: 4,
        get width() { return this.spriteWidth - (this.inset * 2); },
        get height() { return this.spriteHeight - (this.inset * 2); }
    },
    cape: {
        width: 14,
        minHeight: 20,
        maxHeight: 28,
        color: '#DC143C',
        secondaryColor: '#8B0000',
        flowSpeed: 0.15,
        maxFlowOffset: 8,
        anchorOffset: -5
    },
    laser: {
        cooldownFrames: 1200,
        beamLength: 150,
        beamSpeed: 15,
        holeRadius: 20,
        maxHolesPerSection: 3,
        colors: { beam: '#00FF00', beamCore: '#FFFFFF', glow: 'rgba(0, 255, 0, 0.3)' },
        soundVolume: { fire: 1.0, hit: 0.8, ready: 0.6 }
    }
};

export const PHYSICS = CONFIG.physics;
export const PIPES = CONFIG.pipes;
export const CLOUDS = CONFIG.clouds;
export const GAME = CONFIG.game;
export const SCORING = CONFIG.scoring;
export const VISUAL = CONFIG.visual;
export const HITBOX = CONFIG.hitbox;

export default CONFIG;
