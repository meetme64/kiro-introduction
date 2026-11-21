/**
 * config.js - Game configuration settings
 * Contains all tunable game parameters
 */

export const CONFIG = Object.freeze({
    // Canvas
    canvasWidth: 480,
    canvasHeight: 640,

    // Physics
    gravity: 0.25,
    terminalVelocity: 10,
    jumpStrength: -6,

    // Kiro character
    kiro: {
        x: 100,
        y: 300,
        width: 34,
        height: 24,
        rotationSpeed: 3,
        maxRotation: 30,
        minRotation: -90
    },

    // Pipes
    pipeWidth: 52,
    pipeGapMin: 140,
    pipeGapMax: 180,
    wallPairSpacing: 120,

    // Difficulty progression
    difficulty: {
        scoreThresholds: [10, 20, 30, 50],
        speedMultipliers: [1.0, 1.1, 1.2, 1.3, 1.5],
        gapSizes: [180, 170, 160, 150, 140]
    },

    // Score
    highScoreKey: 'flappyKiroHighScore',

    // Invincibility
    invincibilityDuration: 5000,

    // Clouds
    cloudSpawnInterval: 180,

    // Game settings
    targetFPS: 60,
    frameInterval: 1000 / 60,

    // Gap clearance from edges
    gapClearance: 100,

    // Cape configuration (Requirement 14)
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

    // Laser configuration (Requirement 14)
    laser: {
        cooldownFrames: 1200, // 20 seconds at 60 FPS
        beamLength: 150,
        beamSpeed: 15,
        holeRadius: 20,
        maxHolesPerSection: 3,
        colors: {
            beam: '#00FF00',
            beamCore: '#FFFFFF',
            glow: 'rgba(0, 255, 0, 0.3)'
        },
        soundVolume: {
            fire: 1.0,
            hit: 0.8,
            ready: 0.6
        }
    }
});

export const DIFFICULTY_TIERS = Object.freeze([
    { threshold: 0, speedMultiplier: 1.0, gapSize: 180, name: 'Normal' },
    { threshold: 10, speedMultiplier: 1.1, gapSize: 170, name: 'Easy' },
    { threshold: 20, speedMultiplier: 1.2, gapSize: 160, name: 'Medium' },
    { threshold: 30, speedMultiplier: 1.3, gapSize: 150, name: 'Hard' },
    { threshold: 50, speedMultiplier: 1.5, gapSize: 140, name: 'Expert' }
]);

export default CONFIG;
