# Requirements Document

## Feature Name

Flappy Kiro

## Introduction

Flappy Kiro is a retro browser-based endless scroller game where the player guides a ghost character named Kiro through a series of obstacles (pipes). The game features pixel-art visuals, retro sound effects, and simple tap-to-jump mechanics inspired by the classic Flappy Bird gameplay style. The objective is to navigate as far as possible without colliding with pipes or the ground, accumulating a score based on distance traveled and pipes successfully passed.

## Glossary

- **Kiro**: The ghost character controlled by the player
- **Pipe**: Vertical obstacle with a gap that the player must navigate through
- **Gap**: The vertical opening between the upper and lower pipe sections
- **Frame**: A single rendering cycle of the game loop (60 FPS = 60 frames per second)
- **Canvas**: The HTML5 canvas element used for game rendering
- **Game Loop**: The continuous cycle that updates game state and renders frames
- **Velocity_Y**: The vertical speed of Kiro, measured in pixels per frame
- **Gravity**: The constant downward force applied to Kiro each frame
- **Jump_Strength**: The instantaneous upward velocity applied when the player triggers a jump
- **Score**: The integer value representing the player's progress
- **High_Score**: The maximum score achieved across all game sessions
- **Session**: A single instance of gameplay from game start to game over
- **Collision**: Contact between Kiro and any obstacle or boundary
- **Hitbox**: The rectangular area used for collision detection, smaller than the rendered sprite
- **AABB**: Axis-Aligned Bounding Box collision detection algorithm
- **Death_Sequence**: The animation played when Kiro collides with an obstacle
- **Invincibility_Frames**: Number of frames during which collision detection is disabled after restart
- **Sprite_Flash**: The visual effect of alternating sprite visibility during invincibility
- **Delta_Time**: The elapsed time between consecutive frames, used for frame-rate independent physics
- **Cloud_Layer**: A grouping of clouds rendered at the same visual depth, used to create the parallax effect
- **Parallax_Factor**: The multiplier that determines a cloud's speed relative to its visual depth (closer clouds have higher factors)
- **Cloud_Speed**: The horizontal velocity of a cloud, measured in pixels per frame
- **Terminal_Velocity**: The maximum vertical speed Kiro can reach when falling, measured in pixels per frame
- **Horizontal_Velocity**: The constant forward speed of Kiro relative to the pipe obstacles
- **Physics_Engine**: The system component that calculates position, velocity, and acceleration for game objects
- **Wall_Pair_Spacing**: The time interval between pipe spawns, measured in frames
- **Gap_Clearance**: The minimum vertical distance from pipe edges to canvas boundaries
- **Progressive_Difficulty**: The gradual increase in game difficulty based on accumulated score
- **Pipe_Dimension**: The width and height specifications for pipe rendering
- **Pipe_Cap**: The decorative rounded end cap on each pipe segment
- **Main_Menu**: The initial game state displaying title, instructions, and high score
- **Paused**: The game state where gameplay is suspended but current state is maintained
- **Retro_Font**: A pixel-style font used for text rendering
- **Score_Manager**: The system component that tracks, compares, and persists scores

## Requirements

### Requirement 1: Player Character Control

**User Story:** As a player, I want to control Kiro's vertical movement so that I can navigate through pipe gaps.

#### Acceptance Criteria

**Physics Constants:**
- Gravity: 0.25 pixels/frame² (constant downward acceleration)
- Jump_Strength: -4.5 pixels/frame (instantaneous upward velocity)
- Terminal_Velocity: 8.0 pixels/frame (maximum falling speed)
- Horizontal_Velocity: 2.0 pixels/frame (forward scrolling speed that Kiro maintains relative to pipes)

0. THE Game Engine SHALL set Velocity_Y directly to Jump_Strength (-4.5 px/frame), discarding any prior vertical velocity.
1. WHEN the player presses the spacebar or clicks/taps the game area, THE Physics_Engine SHALL apply Jump_Strength (-4.5 pixels/frame) to Velocity_Y.
2. THE Physics_Engine SHALL apply Gravity (0.25 pixels/frame²) to Velocity_Y at the end of each frame.
3. WHERE Velocity_Y exceeds Terminal_Velocity (8.0 px/frame), THE Physics_Engine SHALL clamp Velocity_Y to Terminal_Velocity.
4. WHERE Velocity_Y is less than negative Terminal_Velocity, THE Physics_Engine SHALL clamp Velocity_Y to negative Terminal_Velocity.
5. THE Physics_Engine SHALL update Kiro's vertical position by adding Velocity_Y to the current Y coordinate each frame.
6. THE Physics_Engine SHALL maintain constant Horizontal_Velocity (2.0 px/frame) for Kiro's forward momentum relative to pipes.
7. WHERE Velocity_Y is positive, THE Ghost_Renderer SHALL rotate Kiro's sprite downward at a rate of 3 degrees per 1.0 px/frame of vertical velocity.
8. WHERE Velocity_Y is negative, THE Ghost_Renderer SHALL rotate Kiro's sprite upward at a rate of 3 degrees per 1.0 px/frame of vertical velocity.
9. THE Physics_Engine SHALL limit Kiro's maximum rotation to 30 degrees upward and 90 degrees downward.
10. WHERE the game starts, THE Physics_Engine SHALL initialize Velocity_Y to 0.
11. THE Physics_Engine SHALL use linear interpolation for smooth position updates between frames.
12. WHERE the player has pressed the spacebar or clicked/tapped, THE Game Engine SHALL respond within 2 frames.

### Requirement 2: Pipe Generation and Movement

**User Story:** As a player, I want pipes to appear continuously so that I have an endless obstacle course to navigate.

#### Acceptance Criteria

**Wall Pair Spacing:**
1. THE Pipe_Generator SHALL spawn a new pipe pair every 90 frames.
2. WHERE canvas width is 480px at 2.0 px/frame horizontal velocity, pipes spawn approximately every 4.5 screen widths apart (progressive adjustment).

**Gap Size:**
3. THE Pipe_Generator SHALL create a Gap of 180 pixels between upper and lower pipe sections.
4. WHERE the Score exceeds 10, THE Pipe_Generator SHALL reduce Gap to 170 pixels.
5. WHERE the Score exceeds 20, THE Pipe_Generator SHALL reduce Gap to 160 pixels.
6. WHERE the Score exceeds 30, THE Pipe_Generator SHALL reduce Gap to 150 pixels.
7. WHERE the Score exceeds 50, THE Pipe_Generator SHALL reduce Gap to 140 pixels (minimum Gap).

**Random Gap Positioning:**
8. THE Pipe_Generator SHALL randomly position the Gap's vertical center between 25% and 75% of the canvas height.
9. WHERE the randomly chosen Gap center falls within 50 pixels of the top or bottom edge, THE Pipe_Generator SHALL clamp the Gap to the nearest valid position.
10. THE Pipe_Generator SHALL use a pseudo-random number generator seeded by the Score for reproducible difficulty.

**Wall Movement Speed:**
11. THE Pipe_Mover SHALL translate all pipes leftward at Horizontal_Velocity (2.0 pixels per frame).
12. WHERE the Score exceeds 10, THE Pipe_Mover SHALL increase speed to 2.2 pixels per frame.
13. WHERE the Score exceeds 20, THE Pipe_Mover SHALL increase speed to 2.4 pixels per frame.
14. WHERE the Score exceeds 30, THE Pipe_Mover SHALL increase speed to 2.6 pixels per frame.
15. WHERE the Score exceeds 50, THE Pipe_Mover SHALL increase speed to 3.0 pixels per frame (maximum speed).

**Pipe Dimensions:**
16. THE Pipe_Generator SHALL create upper and lower pipes with width of 60 pixels.
17. THE Pipe_Generator SHALL extend upper pipes from the top of the canvas to the Gap's top edge.
18. THE Pipe_Generator SHALL extend lower pipes from the Gap's bottom edge to the bottom of the canvas.
19. THE Pipe_Generator SHALL add 10-pixel caps to the pipe ends (visual detail).

**Pipe Management:**
20. WHEN a pipe's right edge passes the canvas's left edge, THE Pipe_Manager SHALL remove the pipe from the active pipe list.

### Requirement 3: Collision Detection

**User Story:** As a player, I want the game to detect when Kiro hits obstacles so that I can be notified of game over.

#### Acceptance Criteria

**Precise Hitbox Definitions:**
1. THE Collision_Detector SHALL use a rectangular hitbox for Kiro that is 4 pixels smaller on each side than the rendered sprite (32x32 actual hitbox from 40x40 sprite).
2. WHERE Kiro's hitbox intersects with any pipe hitbox, THE Collision_Detector SHALL trigger a Game_Over event.
3. THE Collision_Detector SHALL calculate hitbox intersection using AABB (Axis-Aligned Bounding Box) algorithm.
4. THE Collision_Detector SHALL perform hitbox checks at the start of each frame before physics updates.

**Wall Collision Boundaries:**
5. THE Collision_Detector SHALL define pipe hitboxes as the full pipe dimensions (60px width, extending to canvas edges) excluding decorative caps.
6. WHERE Kiro's hitbox overlaps with any portion of a pipe, THE Collision_Detector SHALL register a collision.
7. THE Collision_Detector SHALL treat pipe caps as non-collidable for the purpose of gameplay (visual only).

**Ground and Ceiling Detection:**
8. WHERE Kiro's hitbox top edge is less than 0 pixels, THE Collision_Detector SHALL trigger a Game_Over event (ceiling collision).
9. WHERE Kiro's hitbox bottom edge is greater than canvas height, THE Collision_Detector SHALL trigger a Game_Over event (ground collision).
10. THE Collision_Detector SHALL check boundary conditions AFTER physics updates and BEFORE rendering.

**Collision Response Animations:**
11. WHERE a Game_Over collision is detected, THE Animation_Engine SHALL play a death sequence over 60 frames.
12. THE Animation_Engine SHALL fade Kiro's opacity to 0% over the death sequence.
13. THE Animation_Engine SHALL rotate Kiro 90 degrees downward during death animation.
14. WHERE death animation completes, THE Game Engine SHALL transition to Game_Over state.

**Invincibility Frames (optional post-death):**
15. WHERE the game restarts after a collision, THE Game Engine SHALL set Invincibility_Frames to 120 (2 seconds).
16. WHERE Invincibility_Frames is greater than 0, THE Collision_Detector SHALL NOT register pipe collisions.
17. Invincibility_Frames SHALL only suppress pipe collisions; ceiling and ground boundary collisions SHALL still trigger Game_Over events.
18. THE Animation_Engine SHALL flash Kiro's sprite on/off every 4 frames during invincibility.
18. WHERE Invincibility_Frames reaches 0, THE Game Engine SHALL resume normal collision detection.

### Requirement 4: Scoring System

**User Story:** As a player, I want to earn points so that I can track my progress and compete with previous scores.

#### Acceptance Criteria

1. WHEN Kiro's horizontal position passes a pipe's horizontal position, THE Score_Manager SHALL increment the Score by 1.
2. THE Score_Manager SHALL update the displayed score within 3 frames of the scoring event.
3. THE Score_Manager SHALL compare the current Session_Score against the stored High_Score upon game over.
4. WHERE the current Session_Score exceeds the stored High_Score value at evaluation time, THE Score_Manager SHALL update the stored High_Score.
5. THE Score_Manager SHALL persist the High_Score in the browser's local storage.

### Requirement 5: Game State Management

**User Story:** As a player, I want clear game states so that I understand when to start playing, when the game is paused, and when the game has ended.

#### Acceptance Criteria

**Supported States:**
1. THE Game Engine SHALL support Main_Menu, Playing, Paused, and Game_Over states.

**Main Menu State:**
2. WHERE the game is in Main_Menu state, THE Renderer SHALL display:
   - Game title "Flappy Kiro" centered at 30% from top
   - "Press SPACE or TAP to Start" instruction at 50% from top
   - High Score display at 70% from top
   - "Best: {High_Score}" formatted in retro pixel font
   - Current session score if available (e.g., "Last: {Session_Score}")

**Gameplay State (Playing):**
3. WHERE the game transitions to Playing state, THE Game Engine SHALL:
   - Initialize Kiro at canvas horizontal center and 50% vertical position
   - Set Velocity_Y to 0
   - Clear all active pipes
   - Set Score to 0
   - Start the Game Loop at 60 FPS
   - Begin pipe spawning timer
4. WHERE the game is in Playing state, THE Renderer SHALL display:
   - Current Score in top-center position (32px retro font)
   - Real-time score update within 3 frames of pipe passage
   - Pause indicator (optional, visible only when pause is triggered)

**Pause Functionality:**
5. WHERE the player presses 'P' or ESC during Playing state, THE Game Engine SHALL transition to Paused state.
6. WHERE the game is in Paused state, THE Game Engine SHALL:
   - Stop the Game Loop while maintaining current game state
   - Continue rendering at last known state
7. WHERE the player presses 'P', ESC, or clicks/taps during Paused state, THE Game Engine SHALL transition back to Playing state.
8. WHERE the game is in Paused state, THE Renderer SHALL display:
   - "PAUSED" centered on screen (48px retro font)
   - "Press P to Resume" instruction (24px font)
   - Semi-transparent overlay (50% black) over game area

**Game Over Screen:**
9. WHERE a collision triggers Game_Over, THE Game Engine SHALL:
   - Complete the Death_Sequence animation (60 frames)
   - Transition to Game_Over state
   - Compare Session_Score against High_Score
   - Update High_Score if Session_Score exceeds it
10. WHERE the game is in Game_Over state, THE Renderer SHALL display:
    - "GAME OVER" centered at 25% from top (48px retro font)
    - Final Score at 40% from top (32px font)
    - High Score at 50% from top (24px font, gold color)
    - "SPACE or TAP to Restart" instruction at 70% from top
    - New High Score indicator ("NEW HIGH SCORE!") flashing when record is set

**Restart Option:**
11. WHERE the player presses spacebar or clicks/taps during Game_Over state, THE Game Engine SHALL:
    - Reset Kiro's position to canvas horizontal center and 50% vertical position
    - Set Velocity_Y to 0
    - Clear all active pipes
    - Reset Score to 0
    - Transition to Playing state
    - Apply Invincibility_Frames (120 frames) if implemented

**Persistent Score Storage:**
12. THE Score_Manager SHALL persist High_Score in browser localStorage under key "flappyKiroHighScore".
13. WHERE localStorage is unavailable, THE Score_Manager SHALL use sessionStorage as fallback.
14. WHERE neither storage is available, THE Score_Manager SHALL log a warning and continue without persistence.
15. THE Score_Manager SHALL load High_Score from storage on game initialization.
16. WHERE a new High_Score is set, THE Score_Manager SHALL save to storage within 100ms.

**State Transition Summary:**
17. Main_Menu → Playing: Space/Tap/Click
18. Playing → Paused: 'P' or ESC key
19. Paused → Playing: 'P', ESC, or Space/Tap/Click
20. Playing → Game_Over: Collision detected
21. Game_Over → Playing: Space/Tap/Click
22. Game_Over → Main_Menu: (optional) 'ESC' key

### Requirement 6: Audio System

**User Story:** As a player, I want retro sound effects so that the game feels more engaging and provides audio feedback.

#### Acceptance Criteria

1. WHERE the player triggers a jump action, THE Audio_Engine SHALL play the jump.wav audio file at 100% volume.
2. WHERE the Collision_Detector triggers a Game_Over event, THE Audio_Engine SHALL play the game_over.wav audio file at 100% volume.
3. THE Audio_Engine SHALL load audio assets asynchronously without blocking game initialization.
4. WHERE audio playback fails (e.g., browser autoplay restriction), THE Audio_Engine SHALL log a warning and continue without audio.

### Requirement 7: Graphics Rendering

**User Story:** As a player, I want retro pixel-art visuals so that the game has an authentic retro aesthetic.

#### Acceptance Criteria

1. THE Renderer SHALL draw Kiro using the ghosty.png sprite at the current position.
2. THE Renderer SHALL scale the ghosty.png sprite to display at 40x40 pixels.
3. THE Renderer SHALL draw pipes with a green color (#00AA00) and black outline (#004400, 2px width).
4. THE Renderer SHALL clear the canvas with a sky-blue color (#70C5CE) each frame.
5. WHERE the game is in Playing state, THE Renderer SHALL render the current Score in the top-center of the canvas.
6. THE Renderer SHALL maintain a consistent aspect ratio across different screen sizes.

### Requirement 8: Performance Requirements

**User Story:** As a player, I want smooth gameplay so that the game is enjoyable regardless of my device performance.

#### Acceptance Criteria

1. THE Game Loop SHALL target 60 frames per second.
2. WHERE the frame rate drops below 30 FPS, THE Game Engine SHALL attempt to reduce visual complexity to maintain gameplay responsiveness.
2a. THE Game Engine SHALL automatically restore full visual complexity once FPS recovers above 30 FPS.
3. THE Game Engine SHALL complete all physics calculations within 5 milliseconds per frame.
4. THE Game Engine SHALL complete all rendering operations within 10 milliseconds per frame.
5. THE Memory_Manager SHALL ensure the game uses less than 50MB of memory during gameplay.

### Requirement 9: Browser Compatibility

**User Story:** As a player, I want to play in any modern browser so that I can enjoy the game on my preferred platform.

#### Acceptance Criteria

1. THE Game Engine SHALL function correctly in Chrome (version 90+).
2. THE Game Engine SHALL function correctly in Firefox (version 88+).
3. THE Game Engine SHALL function correctly in Safari (version 14+) on macOS and iOS.
4. THE Game Engine SHALL function correctly in Edge (version 90+).
5. WHERE the browser does not support HTML5 Canvas, THE Game Engine SHALL display a descriptive error message.

### Requirement 10: Input Responsiveness

**User Story:** As a player, I want responsive controls so that my inputs are accurately reflected in the game.

#### Acceptance Criteria

1. WHERE the player presses spacebar, THE Input_Handler SHALL register the action within 16 milliseconds.
2. WHERE the player clicks the canvas, THE Input_Handler SHALL register the action within 16 milliseconds.
3. WHERE the player taps the screen on a touch device, THE Input_Handler SHALL register the action within 50 milliseconds.
4. THE Input_Handler SHALL ignore duplicate inputs within a 50-millisecond debounce window after a jump.

### Requirement 11: Responsive Canvas Sizing

**User Story:** As a player, I want the game to fit my screen so that I can play comfortably on any device.

#### Acceptance Criteria

1. THE Canvas_Resizer SHALL set the canvas width to the viewport width, with a maximum of 480 pixels.
2. THE Canvas_Resizer SHALL set the canvas height to the viewport height, with a maximum of 640 pixels.
3. WHERE the viewport dimensions change, THE Canvas_Resizer SHALL update the canvas dimensions within 100 milliseconds.
4. THE Canvas_Resizer SHALL center the canvas horizontally and vertically within the viewport.

### Requirement 12: Game Reset and Restart

**User Story:** As a player, I want to easily restart the game so that I can try again after losing.

#### Acceptance Criteria

1. WHEN the player triggers a restart, THE Game Engine SHALL reset Kiro's position to the horizontal center and vertical center of the canvas.
2. THE Game Engine SHALL reset Velocity_Y to 0.
3. THE Game Engine SHALL clear all active pipes.
4. THE Game Engine SHALL reset the Score to 0.
5. THE Game Engine SHALL transition to Start_Screen state after reset.

### Requirement 13: Parallax Cloud Background

**User Story:** As a player, I want animated clouds in the background so that the game has depth and visual interest.

#### Acceptance Criteria

1. THE Cloud_Renderer SHALL display semi-transparent clouds in the background with an opacity between 50% and 80%.
2. THE Cloud_Layer SHALL support multiple layers (background, midground, foreground) to create depth.
3. WHERE a cloud is in the foreground layer (closest to player), THE Cloud_Mover SHALL move the cloud at a speed of 2.0 pixels per frame.
4. WHERE a cloud is in the midground layer, THE Cloud_Mover SHALL move the cloud at a speed of 1.0 pixels per frame.
5. WHERE a cloud is in the background layer (farthest from player), THE Cloud_Mover SHALL move the cloud at a speed of 0.5 pixels per frame.
6. THE Parallax_Factor SHALL be 1.0 for foreground, 0.5 for midground, and 0.25 for background clouds.
7. THE Cloud_Spawner SHALL generate clouds at random horizontal positions off-screen to the right.
8. WHEN a cloud's right edge passes the canvas's left edge, THE Cloud_Manager SHALL remove the cloud from the active cloud list.
9. WHERE the game is in Playing state, THE Renderer SHALL render all clouds before rendering pipes and Kiro.

## Assumptions

- The game will use a single HTML file with embedded JavaScript and CSS for simplicity
- The ghosty.png sprite is a 32x32 pixel image that can be scaled to 40x40 pixels
- Audio files are in WAV format and can be played directly by the Web Audio API
- No user accounts or server-side persistence is required
- The game does not require network connectivity after initial load
- No in-app purchases or advertisements are planned

## Constraints

- The game must load within 5 seconds on a 4G connection
- All assets (images and audio) must be less than 1MB total
- The game must function without external dependencies beyond the browser
- No backend server is available for high score persistence (local storage only)
### Requirement 14: Cape and Laser Weapon System

**User Story:** As a player, I want Kiro to have a red cape and a laser weapon so that I can customize the character's appearance and gain a new gameplay ability to destroy pipe sections.

#### Acceptance Criteria

**Cape Rendering:**
1. THE Renderer SHALL draw a red cape attached to Kiro's back when Kiro is rendered.
2. THE Cape SHALL use primary color #DC143C (Crimson) and secondary color #8B0000 (Dark Red) for shading.
3. THE Cape dimensions SHALL be 14 pixels wide with variable height between 20-28 pixels based on animation state.
4. WHERE Kiro is moving upward (negative Velocity_Y), THE Cape Renderer SHALL animate the cape flowing upward with maximum flow offset of 8 pixels.
5. WHERE Kiro is falling (positive Velocity_Y), THE Cape Renderer SHALL animate the cape dragging downward.
6. THE Cape anchor point SHALL be offset -5 pixels from Kiro's center to position it behind the character.
7. WHERE Kiro's rotation exceeds 30 degrees upward, THE Cape Renderer SHALL increase cape flow speed proportionally.

**Laser Weapon:**
8. WHERE the player presses 'L' key or right-clicks during Playing state, THE Laser_System SHALL fire a laser beam.
9. THE Laser beam SHALL travel horizontally to the right from Kiro's current position at 15 pixels per frame.
10. THE Laser beam SHALL have a total length of 150 pixels when fully extended.
11. THE Laser beam visual SHALL consist of a green core (#00FF00) with white center and a semi-transparent green glow.
12. THE Laser_System SHALL create a 40-pixel diameter (20-pixel radius) circular hole in any pipe section it intersects.
13. WHERE the laser intersects a pipe section, THE Pipe_Damage_Manager SHALL register a hit and track damage per pipe section.
14. EACH pipe section SHALL be destroyable after receiving 3 laser hits.
15. WHERE a pipe section receives its 3rd hit, THE Renderer SHALL render that section as partially/fully destroyed (render pipe with holes).
16. THE Laser_System SHALL NOT fire if cooldown is active.
17. WHERE a laser shot misses all pipes (travels off-screen), THE Laser_System SHALL reset without triggering destruction.

**Cooldown System:**
18. THE Laser_Cooldown SHALL be 20 seconds (1200 frames at 60 FPS).
19. WHERE a laser is fired, THE Laser_System SHALL enter cooldown state and prevent further firing.
20. THE Renderer SHALL display the cooldown timer in the bottom-left corner of the canvas during cooldown.
21. THE Cooldown timer SHALL show remaining time in seconds with one decimal place (e.g., "LASER: 15.3s").
22. WHERE cooldown reaches 0, THE Audio_Engine SHALL play a "laser ready" sound effect.
23. WHERE cooldown is active, THE Renderer SHALL display the timer with color #FF6B6B.
24. WHERE cooldown is ready, THE Renderer SHALL display "LASER: READY" in color #4ECDC4.
25. THE Cooldown timer SHALL be visible in all game states except Title screen.

**Audio Effects:**
26. WHERE a laser is fired, THE Audio_Engine SHALL play laser_fire.wav at 100% volume.
27. WHERE a laser hits a pipe, THE Audio_Engine SHALL play laser_hit.wav at 80% volume.
28. WHERE cooldown completes and laser is ready, THE Audio_Engine SHALL play laser_ready.wav at 60% volume.

**Input Mapping:**
29. THE Input_Handler SHALL bind 'L' key to laser fire action.
30. THE Input_Handler SHALL bind right mouse click to laser fire action.
31. THE Input_Handler SHALL ignore laser input during Title, Paused, and Game Over states.
32. THE Input_Handler SHALL allow laser firing during Playing state only.

**Integration:**
33. THE Game object SHALL include a reference to Laser_System for update/render calls in the game loop.
34. THE Laser_System SHALL be reset when the game resets.
35. THE Laser_System SHALL update cooldown timer each frame during cooldown.
36. THE Laser beam SHALL be rendered after pipes but before Kiro (beam passes through pipes).
37. Pipe sections with holes SHALL still cause collision damage to Kiro (holes are visual destruction only).
