# Ghosty Character Specifications

## Overview

Ghosty is the main player character in Flappy Kiro - a friendly ghost sprite that players guide through obstacles. This document outlines the complete sprite specifications, animation frames, and collision parameters for implementing Ghosty in the game.

## Sprite Dimensions

| Property | Value | Notes |
|----------|-------|-------|
| Base Width | 32px | Natural sprite size |
| Base Height | 32px | Natural sprite size |
| Render Width | 40px | Scaled up for gameplay visibility |
| Render Height | 40px | Scaled up for gameplay visibility |
| Scale Factor | 1.25x | Applied during rendering |

## Hitbox Specifications

| Property | Value | Notes |
|----------|-------|-------|
| Hitbox Type | Circular | More forgiving than rectangular |
| Hitbox Radius | 12px | Derived from sprite dimensions |
| Hitbox Center | (16, 16) | Center of 32x32 sprite |
| Collision Inset | 4px | Margin from sprite edges |
| Hitbox Coverage | ~50% | Area coverage for forgiving gameplay |

```
Sprite Layout (32x32):
┌────────────────────────┐
│                        │
│      ███████████       │
│     ██          ██     │
│    ██   (12px)   ██    │
│    ██     ●      ██    │ ← Hitbox center (16,16)
│    ██            ██    │   Radius = 12px
│     ██          ██     │
│      ████████████      │
│                        │
└────────────────────────┘
```

## Animation States

### 1. Idle State

**Description:** Ghosty floats gently while waiting for player input.

| Property | Value |
|----------|-------|
| Frame Count | 2 frames |
| Frame Duration | 200ms per frame |
| Animation Type | Bobbing/hovering |
| Movement | 2px vertical offset alternating |

**Frame Breakdown:**

| Frame | Description | Position Offset |
|-------|-------------|-----------------|
| Idle-1 | Ghosty at neutral position | (0, 0) |
| Idle-2 | Ghosty raised slightly | (0, -2) |

### 2. Flap State (Jump Animation)

**Description:** Ghosty's wing animation during jump.

| Property | Value |
|----------|-------|
| Frame Count | 3 frames |
| Frame Duration | 100ms per frame |
| Animation Type | Wing flap cycle |

**Frame Breakdown:**

| Frame | Description | Visual Elements |
|-------|-------------|-----------------|
| Flap-1 | Wings up | Arms extended upward |
| Flap-2 | Wings neutral | Arms at sides |
| Flap-3 | Wings down | Arms extended downward |

### 3. Death State

**Description:** Ghosty's death animation sequence.

| Property | Value |
|----------|-------|
| Frame Count | 6 frames |
| Frame Duration | 100ms per frame (600ms total) |
| Animation Type | Fade out + spin |

**Frame Breakdown:**

| Frame | Opacity | Rotation | Description |
|-------|---------|----------|-------------|
| Death-1 | 100% | 0° | Start of death sequence |
| Death-2 | 90% | 15° | Initial fade, slight rotation |
| Death-3 | 75% | 30° | Continued fade |
| Death-4 | 55% | 45° | More fade |
| Death-5 | 35% | 60° | Near transparent |
| Death-6 | 0% | 90° | Fully faded, facing down |

**Death Animation Trigger:**
- Collision with pipe or boundary
- 60 frames total duration
- Followed by Game Over state transition

## Sprite Sheet Layout

```
Ghosty Sprite Sheet (96x64 pixels)

[Idle]      [Flap]      [Death]
+--------+ +--------+ +--------+
|        | |        | |        |
| ██████ | | ██████ | | ██████ |
| ████   | | ████   | | ████   |
| ██  ●  | | ██ ╱   | | ██  ●  |
| ██     | | ██     | | ██     |
| ██████ | | ██████ | | ██████ |
|      ██ | |      ██ | | ░░░░  |
|      ██ | |   ╲  ██ | | ░░░░  |
+--------+ +--------+ +--------+
 32x32      32x32       32x32

Total Sheet Size: 96x64px (3 columns x 2 rows)
```

## Rotation Based on Velocity

Ghosty rotates based on vertical velocity for visual feedback.

| Velocity (px/frame) | Rotation Angle | Visual State |
|---------------------|----------------|--------------|
| -4.5 (jump) | +30° max | Pointing up |
| -2.0 | +15° | Slight up |
| 0.0 | 0° | Neutral |
| +2.0 | -15° | Slight down |
| +8.0 (terminal) | -90° max | Pointing down |

**Rotation Rate:** 3° per 1 px/frame velocity

## Color Palette

| Element | Color Code | Usage |
|---------|------------|-------|
| Ghost Body | #FFFFFF | Main body fill |
| Ghost Outline | #000000 | 2px outline |
| Eyes | #000000 | Left and right |
| Cheeks | #FFB6C1 | Pink blush (optional) |

## Render Scale Animation

Ghosty can be rendered at different scales based on game state:

| State | Scale Factor | Width | Height |
|-------|--------------|-------|--------|
| Normal | 1.0x | 32px | 32px |
| Playable | 1.25x | 40px | 40px |
| Minimap | 0.5x | 16px | 16px |

## Implementation Reference

### Sprite Loading

```javascript
const GHOSTY_SPRITES = {
    idle: ['ghosty_idle_1.png', 'ghosty_idle_2.png'],
    flap: ['ghosty_flap_1.png', 'ghosty_flap_2.png', 'ghosty_flap_3.png'],
    death: ['ghosty_death_1.png', 'ghosty_death_2.png', 'ghosty_death_3.png',
            'ghosty_death_4.png', 'ghosty_death_5.png', 'ghosty_death_6.png']
};
```

### Hitbox Usage

```javascript
function getGhostyHitbox(x, y) {
    return {
        type: 'circle',
        centerX: x + 16,  // Center of 32px sprite
        centerY: y + 16,
        radius: 12
    };
}
```

### Sprite Rendering

```javascript
function renderGhosty(ctx, x, y, frame, rotation, opacity = 1) {
    ctx.save();
    ctx.translate(x + 20, y + 20);  // Center of 40x40 render area
    ctx.rotate(rotation * Math.PI / 180);
    ctx.globalAlpha = opacity;
    
    const sprite = getSprite(frame);
    ctx.drawImage(sprite, -20, -20, 40, 40);
    
    ctx.restore();
}
```

## Asset Files

| File | Dimensions | Format | Purpose |
|------|------------|--------|---------|
| ghosty.png | 96x64px | PNG-8 | Complete sprite sheet |
| ghosty_idle_1.png | 32x32px | PNG | Idle frame 1 |
| ghosty_idle_2.png | 32x32px | PNG | Idle frame 2 |
| ghosty_flap_1.png | 32x32px | PNG | Flap frame 1 |
| ghosty_flap_2.png | 32x32px | PNG | Flap frame 2 |
| ghosty_flap_3.png | 32x32px | PNG | Flap frame 3 |
| ghosty_death_1.png | 32x32px | PNG | Death frame 1 |
| ... | ... | ... | Death frames 2-6 |

## Sprite Creation Guidelines

1. **Use pixel art style** - Keep sharp edges, no anti-aliasing
2. **Center the ghost** - Ghost body should be centered in frame
3. **Consistent outline** - 2px black outline on all visible edges
4. **Expressive eyes** - Large, slightly offset eyes for personality
5. **Flowing bottom** - Wavy/rounded bottom edge (classic ghost style)
6. **Transparent background** - 100% transparent PNG format

## File Location

All sprite assets should be placed in: `/assets/sprites/ghosty/`

```
assets/
└── sprites/
    └── ghosty/
        ├── ghosty.png           (sprite sheet)
        ├── ghosty_idle_1.png
        ├── ghosty_idle_2.png
        ├── ghosty_flap_1.png
        ├── ghosty_flap_2.png
        ├── ghosty_flap_3.png
        └── ghosty_death_*.png   (6 frames)
```
