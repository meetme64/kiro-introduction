# Audio Assets Specification

## Overview

This document outlines the complete sound design specifications for Flappy Kiro, including audio parameters, file formats, and implementation guidelines for all game sounds.

## Sound Effects Summary

| Sound | File | Duration | Purpose | Trigger |
|-------|------|----------|---------|---------|
| Flap | jump.wav | 0.1s | Jump/fly action | Spacebar/click/tap |
| Score | score.wav | 0.2s | Pass through pipe | Successfully pass obstacle |
| Collision | collision.wav | 0.3s | Hit obstacle/boundary | Any collision event |
| Game Over | game_over.wav | 0.5s | Game over sequence | Death animation complete |

---

## Sound 1: Flap Sound (Jump)

**File:** `jump.wav`
**Duration:** 0.1 seconds (100ms)
**Purpose:** Feedback for player jump input

### Audio Specifications

| Parameter | Value |
|-----------|-------|
| Duration | 100ms |
| Sample Rate | 44.1 kHz |
| Bit Depth | 16-bit |
| Channels | Mono |
| File Size | ~8 KB |

### Sound Characteristics

| Characteristic | Description |
|----------------|-------------|
| Type | Short whoosh/swoosh |
| Pitch | Rising from mid to high |
| Waveform | Sine with slight noise |
| Envelope | Fast attack, fast decay |
| Volume | -6dB (comfortable level) |

### Waveform Description

```
Volume
↑
│╲                    ╱│
│ ╲                  ╱ │
│  ╲                ╱  │
│   ╲              ╱   │
│    ╲            ╱    │
│     ╲__________╱     │
└──────────────────────→ Time
0ms              100ms

Attack: 5ms (0-5ms)
Sustain: 30ms (5-35ms)
Decay: 65ms (35-100ms)
```

### Frequency Profile

| Frequency Range | Content |
|-----------------|---------|
| 200-400 Hz | Subtle body |
| 400-800 Hz | Primary whoosh |
| 800-2000 Hz | Air rushing character |
| 2000+ Hz | Harmonic content |

### Implementation

```javascript
const FLAP_SOUND = {
    file: 'assets/jump.wav',
    duration: 100,
    volume: 0.7,
    trigger: 'jumpInput'
};
```

---

## Sound 2: Score Sound

**File:** `score.wav`
**Duration:** 0.2 seconds (200ms)
**Purpose:** Positive feedback for passing obstacles

### Audio Specifications

| Parameter | Value |
|-----------|-------|
| Duration | 200ms |
| Sample Rate | 44.1 kHz |
| Bit Depth | 16-bit |
| Channels | Mono |
| File Size | ~16 KB |

### Sound Characteristics

| Characteristic | Description |
|----------------|-------------|
| Type | Pleasant chime/bell |
| Pitch | Two-note arpeggio (C5 → E5) |
| Waveform | Sine with slight ring |
| Envelope | Medium attack, medium decay |
| Volume | -8dB (not too intrusive) |

### Waveform Description

```
Volume
↑
│      ╱╲    ╱╲      │
│     ╱  ╲  ╱  ╲     │
│    ╱    ╲╱    ╲    │
│   ╱             ╲   │
│──╱               ╲──│
└─────────────────────→ Time
0ms       100ms      200ms

Note 1: C5 (523.25 Hz) - 0-100ms
Note 2: E5 (659.25 Hz) - 100-200ms
```

### Frequency Profile

| Frequency Range | Content |
|-----------------|---------|
| 400-600 Hz | Bell body |
| 600-1000 Hz | Primary tone |
| 1-4 kHz | Harmonic ring |
| 4+ kHz | Air/presence |

### Implementation

```javascript
const SCORE_SOUND = {
    file: 'assets/score.wav',
    duration: 200,
    volume: 0.6,
    trigger: 'pipePassed',
    canOverlap: true  // Allow multiple score sounds
};
```

---

## Sound 3: Collision Sound

**File:** `collision.wav`
**Duration:** 0.3 seconds (300ms)
**Purpose:** Feedback for hitting obstacles or boundaries

### Audio Specifications

| Parameter | Value |
|-----------|-------|
| Duration | 300ms |
| Sample Rate | 44.1 kHz |
| Bit Depth | 16-bit |
| Channels | Mono |
| File Size | ~24 KB |

### Sound Characteristics

| Characteristic | Description |
|----------------|-------------|
| Type | Soft thud/squish |
| Pitch | Descending, low frequency |
| Waveform | Noise + low sine |
| Envelope | Fast attack, medium decay |
| Volume | -4dB (noticeable but not harsh) |

### Waveform Description

```
Volume
↑
│▓▓╲                 │
│▓▓ ╲                │
│▓▓  ╲               │
│▓▓   ╲              │
│▓▓    ╲_____________│
└───────────────────────→ Time
0ms                 300ms

Impact: 0-10ms (noise burst)
Body: 10-100ms (thud)
Tail: 100-300ms (decay)
```

### Frequency Profile

| Frequency Range | Content |
|-----------------|---------|
| 50-150 Hz | Thud impact |
| 150-400 Hz | Body resonance |
| 400-1000 Hz | Crunch/squish |
| 1-3 kHz | Contact transient |

### Implementation

```javascript
const COLLISION_SOUND = {
    file: 'assets/collision.wav',
    duration: 300,
    volume: 0.8,
    trigger: 'collisionDetected'
};
```

---

## Sound 4: Game Over Sound

**File:** `game_over.wav`
**Duration:** 0.5 seconds (500ms)
**Purpose:** Final game over feedback

### Audio Specifications

| Parameter | Value |
|-----------|-------|
| Duration | 500ms |
| Sample Rate | 44.1 kHz |
| Bit Depth | 16-bit |
| Channels | Mono |
| File Size | ~40 KB |

### Sound Characteristics

| Characteristic | Description |
|----------------|-------------|
| Type | Descending sad tone |
| Pitch | G4 → E4 → C4 (descending) |
| Waveform | Triangle with vibrato |
| Envelope | Medium attack, slow decay |
| Volume | -6dB (solemn) |

### Waveform Description

```
Volume
↑
│      ╱─╲        ╱─╲      │
│     ╱   ╲      ╱   ╲     │
│    ╱     ╲    ╱     ╲    │
│   ╱       ╲__╱       ╲   │
│──╱                   ╲───│
└─────────────────────────→ Time
0ms        250ms        500ms

Note 1: G4 (392 Hz) - 0-150ms
Note 2: E4 (329.63 Hz) - 150-300ms
Note 3: C4 (261.63 Hz) - 300-500ms
```

### Frequency Profile

| Frequency Range | Content |
|-----------------|---------|
| 200-400 Hz | Main tones |
| 400-800 Hz | Harmonics |
| 800-1.5 kHz | Vibrato content |

### Implementation

```javascript
const GAME_OVER_SOUND = {
    file: 'assets/game_over.wav',
    duration: 500,
    volume: 0.7,
    trigger: 'deathAnimationComplete',
    priority: 'high'
};
```

---

## Audio Engine Configuration

### Web Audio API Setup

```javascript
class AudioEngine {
    constructor() {
        this.context = null;
        this.buffers = {};
        this.masterVolume = 0.7;
    }
    
    async init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        await this.loadAllSounds();
    }
    
    async loadAllSounds() {
        this.buffers.jump = await this.loadSound('assets/jump.wav');
        this.buffers.score = await this.loadSound('assets/score.wav');
        this.buffers.collision = await this.loadSound('assets/collision.wav');
        this.buffers.gameOver = await this.loadSound('assets/game_over.wav');
    }
    
    loadSound(url) {
        return fetch(url)
            .then(response => response.arrayBuffer())
            .then(data => this.context.decodeAudioData(data));
    }
    
    play(soundName, options = {}) {
        if (!this.buffers[soundName]) return;
        
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        source.buffer = this.buffers[soundName];
        gainNode.gain.value = options.volume ?? this.masterVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        source.start(0);
        return source;
    }
}
```

### Sound Trigger Map

```javascript
const SOUND_TRIGGERS = {
    JUMP: { sound: 'jump', volume: 0.7 },
    SCORE: { sound: 'score', volume: 0.6, allowOverlap: true },
    COLLISION: { sound: 'collision', volume: 0.8 },
    GAME_OVER: { sound: 'gameOver', volume: 0.7 }
};
```

---

## File Format Specifications

### WAV File Requirements

| Specification | Requirement |
|---------------|-------------|
| Format | WAV (RIFF) |
| Codec | PCM 16-bit |
| Sample Rate | 44.1 kHz (or 48 kHz) |
| Channels | Mono |
| Byte Rate | 88,200 bytes/second |
| Block Align | 2 bytes |
| Endian | Little-endian |

### Recommended Export Settings

**Audacity:**
```
Export format: WAV (Microsoft) signed 16-bit PCM
Sample rate: 44100 Hz
Channels: 1 (Mono)
```

**Adobe Audition:**
```
Format: WAV
Sample rate: 44100 Hz
Bit depth: 16-bit
Channels: Mono
```

---

## Audio Asset Files

| File | Duration | Format | Size | Purpose |
|------|----------|--------|------|---------|
| jump.wav | 0.1s | WAV-PCM16 | ~8 KB | Jump feedback |
| score.wav | 0.2s | WAV-PCM16 | ~16 KB | Score feedback |
| collision.wav | 0.3s | WAV-PCM16 | ~24 KB | Collision feedback |
| game_over.wav | 0.5s | WAV-PCM16 | ~40 KB | Game over sequence |

**Total audio assets:** ~88 KB

---

## File Location

All audio assets should be placed in: `/assets/audio/`

```
assets/
└── audio/
    ├── jump.wav
    ├── score.wav
    ├── collision.wav
    └── game_over.wav
```

---

## Audio Implementation Checklist

- [ ] Load all audio files on game initialization
- [ ] Handle audio context resumption on user interaction
- [ ] Implement volume control from game settings
- [ ] Allow sound toggle (mute/unmute)
- [ ] Prevent overlapping score sounds (optional, can overlap)
- [ ] Handle audio context state changes
- [ ] Test with different system volumes
- [ ] Verify audio plays on all target browsers

---

## Browser Audio Considerations

| Browser | AudioContext | Autoplay Policy |
|---------|--------------|-----------------|
| Chrome | Full support | Requires user gesture |
| Firefox | Full support | Requires user gesture |
| Safari | Full support | Requires user gesture |
| Edge | Full support | Requires user gesture |

**Note:** AudioContext must be resumed after a user gesture (click/tap) before playing sounds.

```javascript
// Resume audio context on first interaction
document.addEventListener('click', () => {
    if (audioEngine.context?.state === 'suspended') {
        audioEngine.context.resume();
    }
}, { once: true });
```

---

## Volume Mix Guidelines

| Sound | Relative Volume | Mix Priority |
|-------|-----------------|--------------|
| Jump | 70% | Medium |
| Score | 60% | Low (can be frequent) |
| Collision | 80% | High (important feedback) |
| Game Over | 70% | High (final feedback) |
| Background | N/A | Not implemented |

**Master Volume:** 70% recommended default
