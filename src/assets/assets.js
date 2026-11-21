/**
 * assets.js - Game asset manifest
 * Defines all assets to be loaded by AssetLoader
 */

// Image assets
const IMAGES = {
    GHOSTY_IDLE: { key: 'ghosty_idle', src: 'assets/ghosty.png', type: 'image' }
};

// Audio assets
const AUDIO = {
    JUMP: { key: 'jump', src: 'assets/jump.wav', type: 'audio' },
    GAME_OVER: { key: 'gameOver', src: 'assets/game_over.wav', type: 'audio' }
};

// Complete manifest
// Note: only list assets that actually exist under assets/. AssetLoader's
// Promise.allSettled means a missing file wouldn't block init, but it
// produces noisy 404s and a misleading "failed to load" warning.
const ASSET_MANIFEST = [IMAGES.GHOSTY_IDLE, AUDIO.JUMP, AUDIO.GAME_OVER];

// Sprite definitions
const SPRITES = {
    GHOSTY: {
        image: 'ghosty_idle',
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        frameWidth: 32,
        frameHeight: 32,
        frameCount: 1,
        frameInterval: 100,
        animations: {
            idle: [0],
            flap: [0, 1],
            hit: [2],
            dead: [3]
        }
    }
};

const GameAssets = {
    IMAGES,
    AUDIO,
    ASSET_MANIFEST,
    SPRITES
};
export { GameAssets, IMAGES, AUDIO, ASSET_MANIFEST, SPRITES };
export default GameAssets;
