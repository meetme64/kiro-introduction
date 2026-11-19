# UI Mockups and Interface Design

## Overview

This document provides comprehensive UI mockups and interface specifications for Flappy Kiro, including layout designs, positioning, styling, and implementation guidelines for all game screens.

## Screen Overview

| Screen | State | Key Elements | Trigger |
|--------|-------|--------------|---------|
| Main Menu | TITLE | Logo, Play button, High Score | Game start |
| HUD | PLAYING | Score display, Pause button | During gameplay |
| Game Over | GAMEOVER | Final score, High score, Restart | Collision |
| Pause Overlay | PAUSED | Pause text, Resume button | 'P' during play |

---

## Screen 1: Main Menu

### Layout Mockup

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│                      ╭─────────╮                       │
│                      │  ████   │                       │
│                      │  ████   │                       │
│                      │  ████   │     FLAPPY            │
│                      │  ████   │       KIRO            │
│                      │  ████   │                       │
│                      │  ████   │                       │
│                      │  ████   │                       │
│                      │  ████   │                       │
│                      ╰─────────╯                       │
│                                                        │
│                   ╭──────────────────╮                 │
│                   │    ▶  PLAY       │                 │
│                   ╰──────────────────╯                 │
│                                                        │
│                   ╭──────────────────╮                 │
│                   │  ★ HIGH SCORE: 5 │                 │
│                   ╰──────────────────╯                 │
│                                                        │
│              ╭──────────────────────────╮              │
│              │  Press SPACE or TAP to  │               │
│              │         START            │              │
│              ╰──────────────────────────╯              │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ghosty.png sprite centered horizontally         │  │
│  │ floats with idle animation (2px vertical bob)   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
      Canvas: 480x640 pixels
```

### Element Specifications

| Element | Position | Size | Font | Color |
|---------|----------|------|------|-------|
| Game Logo | (240, 120) | 160x160px | N/A | #FFFFFF |
| Title Text | (240, 300) | Auto | 48px "Press Start 2P" | #FFFFFF |
| Subtitle Text | (240, 350) | Auto | 24px "Press Start 2P" | #70C5CE |
| Play Button | (240, 420) | 200x50px | 24px "Press Start 2P" | #FFFFFF |
| High Score | (240, 480) | Auto | 20px "Press Start 2P" | #FFD700 |
| Instructions | (240, 560) | Auto | 16px "Press Start 2P" | #FFFFFF |

### Button States

```
IDLE STATE (Normal):
┌──────────────────┐
│    ▶  PLAY       │  White text, transparent bg
└──────────────────┘

HOVER STATE (Mouse over):
┌──────────────────┐
│    ▶  PLAY       │  Yellow text, slight glow
└──────────────────┘

PRESSED STATE (Click):
┌──────────────────┐
│  ▶   PLAYING     │  Green text, button pressed
└──────────────────┘
```

### Implementation CSS

```css
.main-menu {
    position: absolute;
    top: 0;
    left: 0;
    width: 480px;
    height: 640px;
    background: linear-gradient(to bottom, #70C5CE, #5BA3B0);
}

.game-title {
    position: absolute;
    left: 50%;
    top: 120px;
    transform: translateX(-50%);
    font-family: "Press Start 2P", monospace;
    font-size: 48px;
    color: #FFFFFF;
    text-shadow: 3px 3px 0 #000000;
}

.play-button {
    position: absolute;
    left: 50%;
    top: 420px;
    transform: translateX(-50%);
    font-family: "Press Start 2P", monospace;
    font-size: 24px;
    color: #FFFFFF;
    padding: 15px 30px;
    border: 3px solid #FFFFFF;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.1s;
}

.play-button:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #FFD700;
    border-color: #FFD700;
}

.high-score {
    position: absolute;
    left: 50%;
    top: 480px;
    transform: translateX(-50%);
    font-family: "Press Start 2P", monospace;
    font-size: 20px;
    color: #FFD700;
    text-shadow: 2px 2px 0 #000000;
}

.instructions {
    position: absolute;
    left: 50%;
    top: 560px;
    transform: translateX(-50%);
    font-family: "Press Start 2P", monospace;
    font-size: 16px;
    color: #FFFFFF;
    text-align: center;
    opacity: 0.8;
}
```

---

## Screen 2: In-Game HUD

### Layout Mockup

```
┌────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐    │
│  │                                                │    │
│  │         ← Pipes scroll left                    │    │
│  │                                                │    │
│  │                  ┌──┐                          │    │
│  │              ┌───┤  ├───┐                      │    │
│  │              │   └──┘   │                      │    │
│  │      ┌──┐    │         │    ┌──┐               │    │
│  │  ┌───┤  ├────┤         ├────┤  ├──┐            │    │
│  │  │   └──┘    │         │    └──┘   │            │    │
│  │  └───────────┴─────────┴───────────┘            │    │
│  │                                                │    │
│  │  Ghosty →                                       │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│                                              ┌──────┐  │
│                                         ★ 5 │      │  │
│                                              └──────┘  │
│  Score: ████████████░░░░░░░░░░░░░░░░░░░░░░  5        │
│  Best:  ████████████░░░░░░░░░░░░░░░░░░░░░░  7        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Score Display

```
┌─────────────────────────────────────────┐
│  ╭───╮                                    │
│  │ ★ │   CURRENT SCORE                    │
│  ╰───╯                                    │
│                                         5 │
│   BEST: 7  ████████████░░░░░░  70%       │
└─────────────────────────────────────────┘
Position: Top-center (240, 40)
```

### Progress Bar

```
┌──────────────────────────────────────────────────┐
│ ██████████████████████████████░░░░░░░░░░░░░░░ 92% │
└──────────────────────────────────────────────────┘
Width: 400px, Position: Bottom 50px
```

### Element Specifications

| Element | Position | Size | Font | Color |
|---------|----------|------|------|-------|
| Score Display | (240, 40) | Auto | 32px "Press Start 2P" | #FFFFFF |
| Score Icon | (200, 35) | 30x30px | ★ Unicode | #FFD700 |
| High Score | (240, 75) | Auto | 16px "Press Start 2P" | #FFD700 |
| Progress Bar | (40, 590) | 400x8px | N/A | Fill: #FFD700, BG: #000000 |

### Score Animation

```
SCORE INCREMENT ANIMATION (when passing pipe):

Before:     5
During:     5 → 5 → 6
After:      6

Animation: Scale punch (1.0 → 1.3 → 1.0)
Duration: 150ms
```

### Implementation CSS

```css
.hud {
    position: absolute;
    top: 0;
    left: 0;
    width: 480px;
    height: 640px;
    pointer-events: none;  /* Let clicks pass through to game */
}

.score-display {
    position: absolute;
    left: 50%;
    top: 40px;
    transform: translateX(-50%);
    font-family: "Press Start 2P", monospace;
    font-size: 48px;
    color: #FFFFFF;
    text-shadow: 3px 3px 0 #000000;
    transition: transform 0.1s;
}

.score-display.bump {
    transform: translateX(-50%) scale(1.3);
}

.score-icon {
    position: absolute;
    left: -40px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 30px;
    color: #FFD700;
}

.high-score-label {
    position: absolute;
    left: 50%;
    top: 90px;
    transform: translateX(-50%);
    font-family: "Press Start 2P", monospace;
    font-size: 16px;
    color: #FFD700;
    text-shadow: 2px 2px 0 #000000;
}

.progress-bar {
    position: absolute;
    left: 50%;
    bottom: 40px;
    transform: translateX(-50%);
    width: 400px;
    height: 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #FFD700;
    border-radius: 4px;
    transition: width 0.3s;
}
```

---

## Screen 3: Game Over Screen

### Layout Mockup

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│                   ╭─────────────╮                      │
│                   │   GAME OVER  │                      │
│                   ╰─────────────╯                      │
│                                                        │
│                 ╭────────────────────╮                 │
│                 │                    │                 │
│                 │    FINAL SCORE     │                 │
│                 │         5          │                 │
│                 │                    │                 │
│                 ╰────────────────────╯                 │
│                                                        │
│                 ╭────────────────────╮                 │
│                 │                    │                 │
│                 │    ★ HIGH SCORE    │                 │
│                 │         7 NEW!     │                 │
│                 │                    │                 │
│                 ╰────────────────────╯                 │
│                                                        │
│         ┌─────────────────────────────────┐            │
│         │     ╭───────────────────╮       │            │
│         │     │  TAP TO RESTART   │       │            │
│         │     ╰───────────────────╯       │            │
│         └─────────────────────────────────┘            │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ghosty.png - Death animation frame 1-6         │  │
│  │  - 0% opacity fade over 60 frames                │  │
│  │  - 0° to 90° rotation                            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Element Specifications

| Element | Position | Size | Font | Color |
|---------|----------|------|------|-------|
| Title | (240, 120) | Auto | 48px "Press Start 2P" | #FF4444 |
| Final Score Label | (240, 220) | Auto | 24px "Press Start 2P" | #FFFFFF |
| Final Score Value | (240, 280) | Auto | 64px "Press Start 2P" | #FFFFFF |
| High Score Label | (240, 340) | Auto | 24px "Press Start 2P" | #FFD700 |
| High Score Value | (240, 400) | Auto | 32px "Press Start 2P" | #FFD700 |
| New Record Badge | (320, 360) | Auto | 16px "Press Start 2P" | #FF0000 |
| Restart Instructions | (240, 500) | Auto | 20px "Press Start 2P" | #FFFFFF |

### High Score Animation

```
NEW HIGH SCORE FLASH ANIMATION:

Frame 1:  NEW!
Frame 2:  NEW!
Frame 3:   ew!
Frame 4:   w!
Frame 5:    !
Frame 6:     
Frame 7:    !
Frame 8:   ew!
... (loop while on game over screen)
```

### Implementation CSS

```css
.game-over-screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 480px;
    height: 640px;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.game-over-title {
    margin-top: 100px;
    font-family: "Press Start 2P", monospace;
    font-size: 48px;
    color: #FF4444;
    text-shadow: 4px 4px 0 #000000;
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.final-score-container {
    margin-top: 60px;
    text-align: center;
}

.final-score-label {
    font-family: "Press Start 2P", monospace;
    font-size: 24px;
    color: #FFFFFF;
}

.final-score-value {
    font-family: "Press Start 2P", monospace;
    font-size: 64px;
    color: #FFFFFF;
    text-shadow: 4px 4px 0 #000000;
    margin-top: 10px;
}

.high-score-container {
    margin-top: 40px;
    text-align: center;
}

.high-score-label {
    font-family: "Press Start 2P", monospace;
    font-size: 24px;
    color: #FFD700;
}

.high-score-value {
    font-family: "Press Start 2P", monospace;
    font-size: 32px;
    color: #FFD700;
    margin-top: 10px;
}

.new-record {
    color: #FF0000;
    animation: blink 0.5s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.restart-instructions {
    margin-top: 80px;
    font-family: "Press Start 2P", monospace;
    font-size: 20px;
    color: #FFFFFF;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
}
```

---

## Screen 4: Pause Overlay

### Layout Mockup

```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │                                                  │  │
│  │         Background blurred/semi-transparent      │  │
│  │                                                  │  │
│  │                                                  │  │
│  │              ╭────────────────╮                  │  │
│  │              │     PAUSED     │                  │  │
│  │              ╰────────────────╯                  │  │
│  │                                                  │  │
│  │              ╭────────────────╮                  │  │
│  │              │  Press P to    │                  │  │
│  │              │    RESUME      │                  │  │
│  │              ╰────────────────╯                  │  │
│  │                                                  │  │
│  │                                                  │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Element Specifications

| Element | Position | Size | Font | Color |
|---------|----------|------|------|-------|
| Overlay | Full screen | 480x640px | N/A | rgba(0, 0, 0, 0.5) |
| Pause Text | (240, 280) | Auto | 48px "Press Start 2P" | #FFFFFF |
| Resume Text | (240, 360) | Auto | 24px "Press Start 2P" | #CCCCCC |

### Implementation CSS

```css
.pause-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 480px;
    height: 640px;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
}

.pause-text {
    font-family: "Press Start 2P", monospace;
    font-size: 48px;
    color: #FFFFFF;
    text-shadow: 3px 3px 0 #000000;
}

.resume-text {
    margin-top: 40px;
    font-family: "Press Start 2P", monospace;
    font-size: 24px;
    color: #CCCCCC;
}
```

---

## Color Palette

| Element | Color Code | Usage |
|---------|------------|-------|
| Sky Background | #70C5CE | Main game background |
| Button Normal | #FFFFFF | Text color |
| Button Hover | #FFD700 | Highlight color |
| Title Text | #FFFFFF | Main title |
| Score Text | #FFFFFF | In-game score |
| High Score | #FFD700 | Gold color for records |
| Game Over | #FF4444 | Red for game over |
| Progress Bar | #FFD700 | Gold progress fill |
| Pipe Color | #00AA00 | Green pipes |
| Pipe Outline | #004400 | Dark green outline |

---

## Font Requirements

| Font | Size | Weight | Usage |
|------|------|--------|-------|
| "Press Start 2P" | 48px | Regular | Main titles |
| "Press Start 2P" | 32px | Regular | Score display |
| "Press Start 2P" | 24px | Regular | Subtitle, buttons |
| "Press Start 2P" | 20px | Regular | Instructions |
| "Press Start 2P" | 16px | Regular | Labels, small text |

**Font fallback order:** "Press Start 2P", "Courier New", monospace

---

## UI State Machine

```javascript
const UI_STATES = {
    TITLE: 'main-menu',
    PLAYING: 'hud',
    PAUSED: 'pause-overlay',
    GAMEOVER: 'game-over-screen'
};

function renderUI(gameState) {
    // Hide all screens
    document.querySelectorAll('.ui-screen').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show current state screen
    const currentScreen = document.querySelector(`.${UI_STATES[gameState]}`);
    if (currentScreen) {
        currentScreen.style.display = 'flex';
    }
}
```

---

## File Location

All UI-related assets should be placed in: `/assets/ui/`

```
assets/
└── ui/
    ├── button_hover.png
    ├── button_pressed.png
    ├── star_icon.png
    └── pause_icon.png
```

---

## Responsive Considerations

| Viewport | Canvas Size | UI Scaling |
|----------|-------------|------------|
| Desktop | 480x640 | 1.0x |
| Tablet | 480x640 | Scales to fit |
| Mobile | 100% width | Scales proportionally |

**UI Element Scaling Formula:**
```javascript
function scaleUIElement(baseSize, scaleFactor) {
    return baseSize * Math.min(scaleFactor, 1.5);
}
```
