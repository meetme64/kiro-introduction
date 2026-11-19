# Implementation Plan: Flappy Kiro

## Overview

This implementation plan provides a comprehensive task list for building Flappy Kiro, a retro browser-based endless scroller game. The implementation follows the component-based architecture outlined in the design document, using vanilla HTML5 Canvas and JavaScript with no external dependencies.

The plan is organized into 7 phases that build incrementally:
1. **Foundation** - Project setup, configuration, and HTML structure
2. **Core Engine** - Game loop, state management, and input handling
3. **Physics & Collision** - Physics calculations and collision detection
4. **Game Objects** - Kiro, pipes, and cloud implementations
5. **Rendering** - Visual rendering and UI systems
6. **Audio & Polish** - Sound effects and performance optimization
7. **Testing** - Unit tests and property-based tests

Each task builds on previous work, with clear dependencies and acceptance criteria. The plan ensures all requirements from the requirements document are addressed and traceable through implementation.

## Tasks

### Phase 1: Foundation

- [ ] 1. Create project directory structure
  - Create main project directories: `src/core`, `src/components`, `src/utils`, `src/assets`
  - Set up empty files for all major modules
  - Create `index.html` placeholder
  - _Requirements: Assumptions, Constraints_
  - _Design Reference: Architecture_
  - Estimated Complexity: S
  - Dependencies: None

- [ ] 2. Create centralized configuration file (config.js)
  - Implement CONFIG object with all physics constants (gravity, jumpStrength, terminalVelocity, horizontalVelocity, rotationRate, maxRotationUp, maxRotationDown)
  - Implement pipe configuration (wallPairSpacing, baseGapHeight, minGapHeight, pipeWidth, gapClearance, difficultyThresholds, speedMultipliers, gapSizes)
  - Implement cloud configuration (layers with speed/opacity, spawnInterval, cloud count limits)
  - Implement game settings (targetFPS, deathSequenceFrames, invincibilityFrames, jumpDebounceMs, assetLoadTimeout)
  - Implement visual configuration (colors, fonts, canvas dimensions, hitbox settings)
  - Add validation functions to ensure configuration integrity
  - Export individual section objects for convenience (PHYSICS, PIPES, CLOUDS, etc.)
  - _Requirements: 1, 2, 11, 13_
  - _Design Reference: Configuration System_
  - Estimated Complexity: L
  - Dependencies: 1

- [ ] 3. Create HTML entry point (index.html)
  - Set up HTML5 document structure with charset and viewport meta tags
  - Create canvas element with id "gameCanvas"
  - Include config.js and main.js script tags with defer attribute
  - Add minimal CSS for centering canvas and basic styling
  - Add game container div for responsive canvas positioning
  - Include font link for "Press Start 2P" or fallback monospace font
  - _Requirements: 9, 11_
  - _Design Reference: Components and Interfaces > Canvas Renderer_
  - Estimated Complexity: S
  - Dependencies: 1, 2

- [ ] 4. Create main game entry point (main.js)
  - Implement IIFE wrapper to avoid global namespace pollution
  - Create game initialization function that runs on DOMContentLoaded
  - Add console logging for development/debugging
  - Set up game ready state variable
  - Add error boundary for uncaught exceptions during initialization
  - _Requirements: 6.3, 6.4_
  - _Design Reference: Components and Interfaces > Canvas Renderer_
  - Estimated Complexity: S
  - Dependencies: 1, 2, 3

### Phase 2: Core Engine

- [ ] 5. Implement Game State Manager core
  - Define GameState type ('TITLE', 'PLAYING', 'PAUSED', 'GAMEOVER')
  - Create GameStateModel interface with state, score, highScore, isInitialized, assetsLoaded
  - Implement state machine with valid transition matrix
  - Create transitionTo() method with validation
  - Add state transition logging for debugging
  - Implement state reset functionality
  - _Requirements: 5.1, 5.17-5.22_
  - _Design Reference: Components and Interfaces > Game State Manager, Correctness Properties > Property 20_
  - Estimated Complexity: M
  - Dependencies: 2

- [ ] 6. Implement Input Handler
  - Implement InputHandler class with keyboard event listeners (spacebar, P, ESC)
  - Implement mouse click and touch event listeners
  - Add isJumpPressed(), isPausePressed() methods
  - Implement onJump(), onPause(), onRestart() callback registration methods
  - Add debounce logic with 50ms window for jump inputs
  - Handle browser default prevention for spacebar to prevent scrolling
  - Support both click and tap for touch devices
  - _Requirements: 10.1-10.4_
  - _Design Reference: Components and Interfaces > Input Handler, Correctness Properties > Property 19_
  - Estimated Complexity: M
  - Dependencies: 2

- [ ] 7. Implement Game Loop
  - Create main game loop using requestAnimationFrame
  - Implement delta time calculation for frame-rate independent updates
  - Implement update() function that calls physics, collision, and game logic
  - Implement draw() function for rendering
  - Target 60 FPS with 16.67ms frame budget
  - Add frame rate monitoring and logging
  - Implement pause/resume functionality
  - _Requirements: 8.1, 8.3, 8.4_
  - _Design Reference: Optimization Guidelines > Frame Budget Distribution_
  - Estimated Complexity: M
  - Dependencies: 5, 6

- [ ] 8. Implement Game State transitions
  - Implement TITLE → PLAYING on space/tap/click
  - Implement PLAYING → PAUSED on P/ESC
  - Implement PAUSED → PLAYING on P/ESC/space/tap/click
  - Implement PLAYING → GAMEOVER on collision
  - Implement GAMEOVER → PLAYING on space/tap/click
  - Add initialization logic for each state transition
  - Clear/update appropriate resources on each transition
  - _Requirements: 5.17-5.22_
  - _Design Reference: Components and Interfaces > Game State Manager_
  - Estimated Complexity: M
  - Dependencies: 5, 6, 7

- [ ] 9. Implement Score Manager core
  - Create ScoreManager class with currentScore and highScore tracking
  - Implement getCurrentScore(), getHighScore(), incrementScore() methods
  - Implement reset() for new game sessions
  - Add checkHighScore() to detect new high score
  - Implement localStorage persistence with sessionStorage fallback
  - Handle storage quota exceeded and unavailable storage gracefully
  - Add loadHighScore() on game initialization
  - _Requirements: 4.1-4.5, 5.12-5.16_
  - _Design Reference: Components and Interfaces > Score Manager, Data Models > Score Model_
  - Estimated Complexity: M
  - Dependencies: 2

### Phase 3: Physics & Collision

- [ ] 10. Implement Physics Engine
  - Create PhysicsEngine class with position (x, y), velocity (Velocity_Y), rotation tracking
  - Implement applyJump() that sets velocity directly to jumpStrength (-4.5)
  - Implement update() that applies gravity (0.25) each frame
  - Implement velocity clamping to terminalVelocity (±8.0)
  - Implement position updates adding velocity to y coordinate
  - Implement rotation calculation based on velocity (3 degrees per 1 px/frame)
  - Limit rotation to max 30 degrees up and 90 degrees down
  - Initialize velocity to 0 on game start
  - _Requirements: 1.1-1.12_
  - _Design Reference: Components and Interfaces > Physics Engine, Correctness Properties > Properties 1-4_
  - Estimated Complexity: L
  - Dependencies: 2, 7

- [ ]* 11. Write property tests for Physics Engine
  - **Property 1: Physics velocity clamping** - Verify velocity stays within terminal bounds
  - **Property 2: Gravity accumulation** - Verify velocity after n frames equals n × gravity
  - **Property 3: Jump velocity override** - Verify jump sets velocity to jumpStrength regardless of prior value
  - **Property 4: Position update consistency** - Verify position mathematically consistent with velocity
  - Test with fast-check library for 100+ iterations each
  - _Requirements: 1.2-1.5, 1.11_
  - _Design Reference: Correctness Properties_
  - Estimated Complexity: M
  - Dependencies: 10
  - Optional: Yes (property-based test)

- [ ] 12. Implement Hitbox calculation utilities
  - Create getKiroHitbox() returning circle hitbox (radius = width/2)
  - Create getPipeHitbox() returning rectangle hitbox for upper/lower pipes
  - Implement AABB intersection check function
  - Implement circle-rectangle collision check function
  - Add boundary collision check functions for ceiling and ground
  - Define HitboxModel and Rectangle interfaces
  - _Requirements: 3.1-3.10_
  - _Design Reference: Components and Interfaces > Collision Detector > Hitbox Calculations_
  - Estimated Complexity: M
  - Dependencies: 2, 10

- [ ] 13. Implement Collision Detector
  - Create CollisionDetector class with checkKiroPipeCollision() method
  - Implement checkKiroBoundaryCollision() for ceiling/ground detection
  - Implement AABB collision algorithm for pipe body detection
  - Implement circle-rectangle collision for more accurate detection
  - Perform collision checks at start of each frame before physics updates
  - Trigger Game_Over event on collision detection
  - Handle decorative caps as non-collidable
  - _Requirements: 3.1-3.10_
  - _Design Reference: Components and Interfaces > Collision Detector > Algorithms 1-4_
  - Estimated Complexity: L
  - Dependencies: 10, 12

- [ ] 14. Implement Death Sequence animation
  - Create DeathAnimationModel interface (isPlaying, frame, totalFrames, startOpacity, startRotation)
  - Implement 60-frame death sequence with opacity fade to 0%
  - Implement 90-degree downward rotation during death
  - Transition to Game_Over state after animation completes
  - Stop physics updates during death sequence
  - _Requirements: 3.11-3.14_
  - _Design Reference: Components and Interfaces > Collision Detector > Algorithm 4, Correctness Properties > Property 15_
  - Estimated Complexity: M
  - Dependencies: 5, 13

- [ ] 15. Implement Invincibility system (optional)
  - Create InvincibilityModel with framesRemaining tracking
  - Set 120 frames (2 seconds) of invincibility after restart
  - Implement flash effect toggling every 4 frames
  - Disable pipe collision detection while invincibility active
  - Continue boundary collision detection (ceiling/ground)
  - Count down frames each update and restore normal detection at 0
  - _Requirements: 3.15-3.19_
  - _Design Reference: Data Models > Invincibility Model, Correctness Properties > Property 16_
  - Estimated Complexity: M
  - Dependencies: 10, 13

- [ ]* 16. Write property tests for Collision Detection
  - **Property 8: Collision detection accuracy** - Verify correct AABB intersection
  - **Property 9: Boundary collision detection** - Verify ceiling/ground violations trigger game over
  - Test with various Kiro positions and pipe configurations
  - Test boundary edge cases (at exactly 0, at exactly canvas height)
  - _Requirements: 3.1-3.10_
  - _Design Reference: Correctness Properties_
  - Estimated Complexity: M
  - Dependencies: 13
  - Optional: Yes (property-based test)

### Phase 4: Game Objects

- [ ] 17. Implement Kiro player character
  - Create BirdModel interface with x, y, width, height, velocity, animationFrame, rotation
  - Implement sprite rendering with rotation transformation
  - Implement wing animation frame switching
  - Connect physics engine updates to position/velocity
  - Initialize at canvas horizontal center and 50% vertical position
  - Implement reset() for new game sessions
  - _Requirements: 1.1-1.12_
  - _Design Reference: Data Models > Bird Model, Components and Interfaces > Physics Engine_
  - Estimated Complexity: M
  - Dependencies: 10

- [ ] 18. Implement Pipe Manager
  - Create ObstacleModel interface with x, y, width, gapHeight, gapPosition, passed, speed
  - Implement getObstacles() returning active pipes array
  - Implement update() for pipe movement leftward at horizontal velocity
  - Implement spawnPipe() with random gap positioning (25%-75% of canvas height)
  - Implement gap size adjustment based on score thresholds
  - Implement pipe speed adjustment based on score thresholds
  - Implement removal of pipes that pass canvas left edge
  - Implement Wall Pair Spacing of 90 frames between spawns
  - _Requirements: 2.1-2.20_
  - _Design Reference: Components and Interfaces > Pipe Manager, Data Models > Obstacle Model_
  - Estimated Complexity: L
  - Dependencies: 2, 7, 10

- [ ]* 19. Write property tests for Pipe Generation
  - **Property 5: Pipe gap size progression** - Verify gap size decreases monotonically with score
  - **Property 6: Gap position bounds** - Verify gap center between 25%-75%, clamped from edges
  - **Property 7: Pipe movement speed consistency** - Verify pipe translation matches velocity
  - **Property 10: Score increment on passage** - Verify score increments exactly once per pipe
  - Test with random score values across difficulty thresholds
  - _Requirements: 2.3-2.15, 4.1, 4.2_
  - _Design Reference: Correctness Properties_
  - Estimated Complexity: M
  - Dependencies: 18
  - Optional: Yes (property-based test)

- [ ] 20. Implement Cloud Manager
  - Create CloudModel interface with x, y, width, height, layer, opacity, speed
  - Implement multi-layer support (background, midground, foreground)
  - Implement parallax factor: foreground 1.0, midground 0.5, background 0.25
  - Implement cloud spawning at random positions off-screen right
  - Implement cloud movement at layer-appropriate speeds
  - Implement removal of clouds passing canvas left edge
  - Implement opacity range 50%-80% for clouds
  - _Requirements: 13.1-13.9_
  - _Design Reference: Components and Interfaces > Cloud Renderer, Data Models > Cloud Model_
  - Estimated Complexity: M
  - Dependencies: 2, 7

- [ ]* 21. Write property tests for Cloud Parallax
  - **Property 13: Parallax layer speed ordering** - Verify foreground > midground > background speeds
  - **Property 14: Cloud layer removal** - Verify clouds removed when passing canvas edge
  - Test speed ratios match expected parallax factors
  - Test removal timing is correct
  - _Requirements: 13.3-13.6, 13.8_
  - _Design Reference: Correctness Properties_
  - Estimated Complexity: S
  - Dependencies: 20
  - Optional: Yes (property-based test)

### Phase 5: Rendering

- [ ] 22. Implement Asset Loader
  - Create AssetLoader class with image and audio loading methods
  - Implement loadImage() returning Promise with HTMLImageElement
  - Implement loadAudio() returning Promise with HTMLAudioElement
  - Implement getImage(), getAudio() for asset retrieval
  - Track loading progress and completion status
  - Implement error handling with fallback behavior
  - Implement asset pool for preloaded resources
  - _Requirements: 6.3, 6.4_
  - _Design Reference: Components and Interfaces > Asset Loader_
  - Estimated Complexity: M
  - Dependencies: 2

- [ ] 23. Implement Canvas Renderer
  - Create CanvasRenderer class initializing HTML5 Canvas
  - Implement clear() for sky-blue background fill (#70C5CE)
  - Implement drawSprite() for image rendering with position and rotation
  - Implement drawText() for retro font text with stroke outline
  - Implement drawRectangle() for geometric shapes
  - Implement getDimensions() for canvas size queries
  - Handle canvas resizing for responsive display (max 480×640)
  - _Requirements: 7.1-7.6, 11.1-11.4_
  - _Design Reference: Components and Interfaces > Canvas Renderer, Data Models > Canvas Settings Model_
  - Estimated Complexity: M
  - Dependencies: 2, 3

- [ ] 24. Implement Title Screen rendering
  - Render game title "Flappy Kiro" centered at 30% from top (48px retro font)
  - Render "Press SPACE or TAP to Start" instruction at 50% from top
  - Render high score "Best: {High_Score}" at 70% from top
  - Render last session score if available
  - Use white text with black outline for visibility
  - _Requirements: 5.2_
  - _Design Reference: Components and Interfaces > Canvas Renderer_
  - Estimated Complexity: S
  - Dependencies: 5, 9, 23

- [ ] 25. Implement Playing state rendering
  - Render current score in top-center (32px retro font)
  - Render score within 3 frames of pipe passage
  - Render pause indicator when paused (optional)
  - Render Kiro sprite at current position with rotation
  - Render pipes with green color (#00AA00) and black outline (#004400, 2px)
  - Render clouds in background before pipes and Kiro
  - _Requirements: 5.3, 7.1-7.6_
  - _Design Reference: Components and Interfaces > Canvas Renderer_
  - Estimated Complexity: M
  - Dependencies: 17, 18, 20, 23

- [ ] 26. Implement Pause Screen rendering
  - Render semi-transparent overlay (50% black) over game area
  - Render "PAUSED" centered (48px retro font)
  - Render "Press P to Resume" instruction (24px font)
  - Continue rendering underlying game state at last known position
  - _Requirements: 5.7, 5.8_
  - _Design Reference: Components and Interfaces > Canvas Renderer_
  - Estimated Complexity: S
  - Dependencies: 5, 23, 25

- [ ] 27. Implement Game Over Screen rendering
  - Render "GAME OVER" centered at 25% from top (48px retro font)
  - Render final score at 40% from top (32px font)
  - Render high score at 50% from top (24px font, gold color #FFD700)
  - Render "SPACE or TAP to Restart" instruction at 70% from top
  - Render "NEW HIGH SCORE!" flashing indicator when record set
  - _Requirements: 5.9, 5.10_
  - _Design Reference: Components and Interfaces > Canvas Renderer_
  - Estimated Complexity: M
  - Dependencies: 5, 9, 23

- [ ] 28. Implement Cloud Renderer
  - Render clouds with semi-transparency (layer-specific opacity)
  - Render clouds before pipes and Kiro (proper layering)
  - Implement cloud sprite rendering from pre-loaded assets
  - Handle cloud rotation/sway effects (optional)
  - _Requirements: 13.1, 13.9_
  - _Design Reference: Components and Interfaces > Cloud Renderer_
  - Estimated Complexity: S
  - Dependencies: 20, 22, 23

- [ ] 29. Implement Sprite Batcher optimization
  - Implement render batching by layer (sky, clouds, pipes, Kiro, UI)
  - Group similar render operations to minimize canvas state changes
  - Pre-render static elements to off-screen canvases
  - Optimize draw calls for 60 FPS target
  - _Requirements: 8.1-8.5_
  - _Design Reference: Optimization Guidelines > Sprite Batching Strategy_
  - Estimated Complexity: M
  - Dependencies: 23, 25, 28

### Phase 6: Audio & Polish

- [ ] 30. Implement Audio Engine
  - Create AudioEngine class managing Web Audio API
  - Implement playJump() for jump sound effect
  - Implement playGameOver() for collision sound effect
  - Implement loadAssets() for async audio loading
  - Handle browser autoplay restrictions gracefully
  - Fall back silently if audio unavailable (log warning)
  - Implement volume control at 100% for both sounds
  - _Requirements: 6.1-6.4_
  - _Design Reference: Components and Interfaces > Audio Engine_
  - Estimated Complexity: M
  - Dependencies: 22

- [ ] 31. Implement Game Reset/Restart functionality
  - Implement reset() for full game restart
  - Reset Kiro's position to horizontal center and 50% vertical
  - Reset Velocity_Y to 0
  - Clear all active pipes
  - Reset Score to 0
  - Apply invincibility frames if implemented
  - Transition to Playing state
  - _Requirements: 12.1-12.5_
  - _Design Reference: Requirements > Requirement 12_
  - Estimated Complexity: S
  - Dependencies: 5, 10, 18

- [ ] 32. Implement Object Pooling
  - Create ObjectPool class for pipe and cloud reuse
  - Pre-allocate pool of 10-20 objects
  - Implement acquire() and release() methods
  - Recycle least recently used objects when pool exhausted
  - Apply to Pipe Manager and Cloud Manager
  - Verify GC pauses eliminated or minimized
  - _Requirements: 8.5_
  - _Design Reference: Optimization Guidelines > Object Pooling for Obstacles_
  - Estimated Complexity: M
  - Dependencies: 18, 20

- [ ] 33. Implement Performance Monitor
  - Create PerformanceMonitor class for frame timing
  - Track frame times with rolling average over 60 frames
  - Calculate current FPS from frame times
  - Implement shouldReduceQuality() for automatic scaling
  - Generate performance reports
  - Log performance warnings when targets exceeded
  - _Requirements: 8.1-8.5_
  - _Design Reference: Optimization Guidelines > Performance Monitoring_
  - Estimated Complexity: M
  - Dependencies: 7

- [ ] 34. Implement Quality Scaling
  - Implement quality level enum (HIGH, MEDIUM, LOW)
  - Implement automatic quality reduction when FPS < 30
  - Disable cloud rendering on MEDIUM/LOW quality
  - Simplify pipe rendering on LOW quality
  - Restore full quality when FPS > 55
  - _Requirements: 8.2, 8.2a_
  - _Design Reference: Optimization Guidelines > Quality Degradation Levels_
  - Estimated Complexity: M
  - Dependencies: 28, 29, 33

- [ ]* 35. Write property tests for State Management
  - **Property 20: State transition consistency** - Verify transitions are atomic and valid
  - Test all valid state transitions
  - Test invalid transition rejection
  - Test state reset functionality
  - _Requirements: 5.17-5.22_
  - _Design Reference: Correctness Properties_
  - Estimated Complexity: M
  - Dependencies: 5, 8
  - Optional: Yes (property-based test)

- [ ]* 36. Write property tests for Scoring System
  - **Property 11: High score persistence** - Verify high score saved to localStorage within 100ms
  - Test persistence fallback to sessionStorage
  - Test graceful handling when storage unavailable
  - _Requirements: 4.3-4.5, 5.12-5.16_
  - _Design Reference: Correctness Properties_
  - Estimated Complexity: M
  - Dependencies: 9
  - Optional: Yes (property-based test)

### Phase 7: Testing

- [ ] 37. Set up testing framework
  - Create test runner script for Node.js with JSDOM
  - Set up fast-check for property-based testing
  - Create test directory structure
  - Configure test script with npm test command
  - Set up coverage reporting
  - _Requirements: All_
  - _Design Reference: Testing Strategy_
  - Estimated Complexity: S
  - Dependencies: None

- [ ] 38. Write unit tests for Configuration
  - Test CONFIG object exports all required sections
  - Test validation functions reject invalid values
  - Test getter functions for computed values
  - Test backward compatibility exports
  - _Requirements: All_
  - _Design Reference: Configuration System_
  - Estimated Complexity: S
  - Dependencies: 2

- [ ] 39. Write unit tests for Game State Manager
  - Test state transitions (all 6 transitions)
  - Test invalid transition rejection
  - Test state reset functionality
  - Test initial state configuration
  - _Requirements: 5.17-5.22_
  - _Design Reference: Components and Interfaces > Game State Manager_
  - Estimated Complexity: S
  - Dependencies: 5

- [ ] 40. Write unit tests for Input Handler
  - Test keyboard event handling (spacebar, P, ESC)
  - Test mouse click handling
  - Test touch/tap handling
  - Test debounce effectiveness (second input ignored within 50ms)
  - Test callback registration and triggering
  - _Requirements: 10.1-10.4_
  - _Design Reference: Components and Interfaces > Input Handler_
  - Estimated Complexity: S
  - Dependencies: 6

- [ ] 41. Write unit tests for Score Manager
  - Test score increment functionality
  - Test high score comparison and update
  - Test localStorage persistence
  - Test sessionStorage fallback
  - Test graceful handling when storage unavailable
  - Test reset functionality
  - _Requirements: 4.1-4.5, 5.12-5.16_
  - _Design Reference: Components and Interfaces > Score Manager_
  - Estimated Complexity: S
  - Dependencies: 9

- [ ] 42. Write unit tests for Rendering
  - Test canvas clearing with sky color
  - Test sprite rendering with position and rotation
  - Test text rendering with font and outline
  - Test rectangle drawing with color
  - Test canvas dimension getters
  - _Requirements: 7.1-7.6, 11.1-11.4_
  - _Design Reference: Components and Interfaces > Canvas Renderer_
  - Estimated Complexity: S
  - Dependencies: 23

- [ ] 43. Write integration tests for Game Loop
  - Test 60 FPS target achievement
  - Test delta time calculation accuracy
  - Test pause/resume functionality
  - Test frame budget adherence (update <5ms, render <10ms)
  - Test state update ordering (physics → collision → render)
  - _Requirements: 8.1-8.5_
  - _Design Reference: Optimization Guidelines > Frame Budget Distribution_
  - Estimated Complexity: M
  - Dependencies: 7

- [ ] 44. Write integration tests for Full Gameplay
  - Test complete game session from title to game over
  - Test score accumulation through multiple pipes
  - Test difficulty scaling at score thresholds
  - Test state transitions with all inputs
  - Test high score saving and retrieval
  - _Requirements: All_
  - _Design Reference: Testing Strategy_
  - Estimated Complexity: L
  - Dependencies: All previous tasks

- [ ] 45. Run all tests and fix failures
  - Execute full test suite with `npm test`
  - Review coverage report for gaps
  - Fix any failing unit tests
  - Fix any failing property tests
  - Document any skipped optional tests
  - _Requirements: All_
  - _Design Reference: Testing Strategy_
  - Estimated Complexity: M
  - Dependencies: 37, 38, 39, 40, 41, 42, 43, 44

### Checkpoints

- [ ] 46. Checkpoint - Foundation Complete
  - Ensure all Phase 1 tasks completed
  - Verify configuration loads without errors
  - Verify HTML loads in browser
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 47. Checkpoint - Core Engine Complete
  - Ensure all Phase 2 tasks completed
  - Verify game loop runs at 60 FPS
  - Verify input handling responds correctly
  - Verify state transitions work properly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 48. Checkpoint - Physics & Collision Complete
  - Ensure all Phase 3 tasks completed
  - Verify physics calculations match design
  - Verify collision detection is accurate
  - Verify death sequence animation works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 49. Checkpoint - Game Objects Complete
  - Ensure all Phase 4 tasks completed
  - Verify Kiro responds to input correctly
  - Verify pipe generation and movement
  - Verify cloud parallax effects
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 50. Checkpoint - Rendering Complete
  - Ensure all Phase 5 tasks completed
  - Verify all screens render correctly
  - Verify sprites display properly
  - Verify UI elements are visible
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 51. Checkpoint - Audio & Polish Complete
  - Ensure all Phase 6 tasks completed
  - Verify sound effects play correctly
  - Verify performance targets met
  - Verify quality scaling works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 52. Checkpoint - Testing Complete
  - Ensure all Phase 7 tasks completed
  - Verify all tests pass
  - Verify coverage meets targets
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP delivery
- Property tests validate universal correctness properties across input ranges, complementing unit tests
- Each task references specific requirements for full traceability
- Estimated complexity: S=Small (1-2 hours), M=Medium (2-4 hours), L=Large (4-8 hours)
- Dependencies should be resolved in order before starting dependent tasks
- Checkpoints ensure incremental validation with user feedback
- All tests should run with `npm test` once the testing framework is set up
- The implementation uses vanilla JavaScript with no external dependencies
- Audio files (jump.wav, game_over.wav) and sprite (ghosty.png) should be placed in assets folder

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3", "4"] },
    { "id": 1, "tasks": ["5", "6", "9"] },
    { "id": 2, "tasks": ["7"] },
    { "id": 3, "tasks": ["8"] },
    { "id": 4, "tasks": ["10", "12", "14"] },
    { "id": 5, "tasks": ["11", "13", "15"] },
    { "id": 6, "tasks": ["16"] },
    { "id": 7, "tasks": ["17"] },
    { "id": 8, "tasks": ["18", "20"] },
    { "id": 9, "tasks": ["19", "21"] },
    { "id": 10, "tasks": ["22", "23"] },
    { "id": 11, "tasks": ["24", "26"] },
    { "id": 12, "tasks": ["25", "28"] },
    { "id": 13, "tasks": ["27", "29"] },
    { "id": 14, "tasks": ["30", "31", "32"] },
    { "id": 15, "tasks": ["33", "34"] },
    { "id": 16, "tasks": ["35", "36"] },
    { "id": 17, "tasks": ["37", "38"] },
    { "id": 18, "tasks": ["39", "40", "41", "42"] },
    { "id": 19, "tasks": ["43"] },
    { "id": 20, "tasks": ["44"] },
    { "id": 21, "tasks": ["45"] },
    { "id": 22, "tasks": ["46"] },
    { "id": 23, "tasks": ["47"] },
    { "id": 24, "tasks": ["48"] },
    { "id": 25, "tasks": ["49"] },
    { "id": 26, "tasks": ["50"] },
    { "id": 27, "tasks": ["51"] },
    { "id": 28, "tasks": ["52"] }
  ]
}
```