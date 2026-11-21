# Flappy Kiro Implementation Tasks

## Task 1: Add Cape Configuration
- **Status:** Ready
- **Requirement:** 14.1-14.7
- **Description:** Add CAPE_CONFIG to config.js with colors, dimensions, and animation parameters
- **Implementation:**
  - Add CAPE_CONFIG object to config.js with: width: 14, minHeight: 20, maxHeight: 28, color: '#DC143C', secondaryColor: '#8B0000', flowSpeed: 0.15, maxFlowOffset: 8, anchorOffset: -5
  - Export CAPE_CONFIG alongside existing configurations
  - Add validation for cape configuration values
- **Verification:** Run npm test to verify config validation passes

## Task 2: Create Cape.js Entity
- **Status:** Ready
- **Requirement:** 14.1-14.7
- **Description:** Create Cape entity class with rendering and animation logic
- **Implementation:**
  - Create src/entities/Cape.js file
  - Implement constructor with config reference
  - Implement update(dt, kiroVelocity, kiroRotation) for animation state
  - Implement createCape() to initialize cape state object
  - Implement updateCapeAnimation() for flow/drag animation based on Kiro movement
  - Implement renderCape(ctx, kiroX, kiroY, kiroRotation) to draw the cape
- **Verification:** npm test passes

## Task 3: Integrate Cape into Kiro Entity
- **Status:** Ready
- **Requirement:** 14.1-14.7
- **Description:** Add cape rendering to Kiro entity
- **Implementation:**
  - Modify src/entities/Kiro.js to import Cape
  - Add #cape private field initialized with Cape instance
  - Add updateCape(dt) method delegating to cape.update
  - Add renderCape(ctx) method delegating to cape.render
  - Ensure cape renders behind Kiro sprite (before sprite draw)
- **Verification:** npm test passes

## Task 4: Integrate Cape into Game Loop
- **Status:** Ready
- **Requirement:** 14.1-14.7
- **Description:** Add cape update and render calls to game loop
- **Implementation:**
  - Modify main.js to call kiro.updateCape(dt) during update phase
  - Modify main.js render to call kiro.renderCape(ctx) after background but before Kiro sprite
  - Pass Kiro velocity and rotation to cape for animation
- **Verification:** npm test passes, game renders correctly at localhost:8080

## Task 5: Add Laser Configuration
- **Status:** Ready
- **Requirement:** 14.8-14.37
- **Description:** Add LASER_CONFIG to config.js with beam parameters, cooldown, and colors
- **Implementation:**
  - Add LASER_CONFIG object to config.js with:
    - cooldownFrames: 1200 (20 seconds at 60 FPS)
    - beamLength: 150
    - beamSpeed: 15
    - holeRadius: 20
    - maxHolesPerSection: 3
    - colors: { beam: '#00FF00', beamCore: '#FFFFFF', glow: 'rgba(0, 255, 0, 0.3)' }
    - soundVolume: { fire: 1.0, hit: 0.8, ready: 0.6 }
- **Verification:** npm test passes

## Task 6: Create LaserSystem.js
- **Status:** Ready
- **Requirement:** 14.8-14.17, 14.18-14.25
- **Description:** Create LaserSystem class for beam management and cooldown
- **Implementation:**
  - Create src/systems/LaserSystem.js file
  - Implement constructor with config reference
  - Implement fireLaser(kiroX, kiroY) - creates new laser beam, starts cooldown
  - Implement update(dt, pipes, damageManager) - moves beams, checks collisions
  - Implement renderLaser(ctx) - draws all active laser beams
  - Implement renderLaserTimer(ctx, canvasWidth, canvasHeight) - draws cooldown UI
  - Implement reset() - clears beams and resets cooldown
  - Implement isReady() - returns true if cooldown is 0
  - Implement getCooldownRemaining() - returns frames remaining
- **Verification:** npm test passes

## Task 7: Create PipeDamageManager.js
- **Status:** Ready
- **Requirement:** 14.12-14.15
- **Description:** Create PipeDamageManager for tracking pipe damage state
- **Implementation:**
  - Create src/systems/PipeDamageManager.js file
  - Implement constructor with config reference
  - Implement registerHit(pipe, section, laserX, laserY) - records damage and hole position
  - Implement isSectionDestroyed(pipeId, section) - returns true if 3+ hits
  - Implement hasHoleAt(pipe, section, x, y) - checks if position is within a hole
  - Implement getHoles(pipeId, section) - returns array of hole positions
  - Implement clearDamage(pipeId) - removes all damage for a pipe
  - Implement cleanup() - removes damage records for destroyed pipes
  - Implement renderPipeWithHoles(ctx, pipe, section) - renders pipe with hole cutouts
- **Verification:** npm test passes

## Task 8: Add Laser Audio Methods
- **Status:** Ready
- **Requirement:** 14.26-14.28
- **Description:** Add laser sound effect methods to AudioEngine
- **Implementation:**
  - Modify src/audio/AudioEngine.js to add:
    - playLaserFire() - plays laser_fire.wav at configured volume
    - playLaserHit() - plays laser_hit.wav at configured volume
    - playLaserReady() - plays laser_ready.wav at configured volume
  - Ensure methods handle audio context availability gracefully
- **Verification:** npm test passes

## Task 9: Add Laser Input Handling
- **Status:** Ready
- **Requirement:** 14.29-14.31
- **Description:** Add 'L' key and right-click handling for laser firing
- **Implementation:**
  - Modify src/core/InputHandler.js to add:
    - KEY_L constant for 'KeyL' key code
    - onLaser(callback) method for registering laser callbacks
    - _handleContextMenu(event) - prevents default, triggers laser
    - _triggerLaser() - fires laser if cooldown ready
    - Integrate laser input in handleInput method
  - Ensure laser input only works during Playing state
- **Verification:** npm test passes

## Task 10: Integrate LaserSystem into Game Loop
- **Status:** Ready
- **Requirement:** 14.33-14.37
- **Description:** Add laser update, render, and reset calls to main.js
- **Implementation:**
  - Modify main.js to:
    - Import LaserSystem and PipeDamageManager
    - Add laserSystem and damageManager to game object
    - Call laserSystem.update(dt, pipes, damageManager) during update phase
    - Call laserSystem.renderLaser(ctx) during render phase
    - Call laserSystem.renderLaserTimer(ctx) during HUD render
    - Call laserSystem.reset() and damageManager.reset() in game.reset()
  - Pass laserSystem reference to collision detector for destroyed section handling
- **Verification:** npm test passes, game works at localhost:8080

## Task 11: Update Collision Detection for Destroyed Sections
- **Status:** Ready
- **Requirement:** 14.37
- **Description:** Skip collision for fully destroyed pipe sections
- **Implementation:**
  - Modify src/components/CollisionDetector.js to:
    - Accept damageManager reference in checkKiroPipeCollision
    - Skip collision check for sections where isSectionDestroyed() returns true
    - Continue checking non-destroyed sections normally
- **Verification:** npm test passes, destroyed sections don't cause collision

## Task 12: Integrate Pipe Damage Rendering
- **Status:** Ready
- **Requirement:** 14.15
- **Description:** Update PipeManager to render pipes with damage
- **Implementation:**
  - Modify src/components/PipeManager.js render method:
    - For each pipe, call damageManager.renderPipeWithHoles() instead of direct render
    - Pass the pipe section and damage manager to handle hole rendering
  - Ensure holes are rendered as transparent/gap sections in the pipe
- **Verification:** npm test passes, visually damaged pipes render correctly

## Task 13: Write Unit Tests for Cape
- **Status:** Ready
- **Requirement:** 14.1-14.7
- **Description:** Create unit tests for Cape entity
- **Implementation:**
  - Create test/unit/cape.test.js
  - Test cape initialization with config values
  - Test updateCapeAnimation with various Kiro velocities
  - Test renderCape produces correct drawing calls
  - Test cape flow animation boundaries
- **Verification:** npm test passes with 100% coverage on Cape.js

## Task 14: Write Unit Tests for LaserSystem
- **Status:** Ready
- **Requirement:** 14.8-14.25
- **Description:** Create unit tests for LaserSystem
- **Implementation:**
  - Create test/unit/laser-system.test.js
  - Test fireLaser creates beam and starts cooldown
  - Test update moves beam correctly
  - Test cooldown timer decrements properly
  - Test isReady and getCooldownRemaining
  - Test renderLaserTimer formats correctly
  - Test reset clears all state
- **Verification:** npm test passes with 100% coverage on LaserSystem.js

## Task 15: Write Unit Tests for PipeDamageManager
- **Status:** Ready
- **Requirement:** 14.12-14.15
- **Description:** Create unit tests for PipeDamageManager
- **Implementation:**
  - Create test/unit/pipe-damage-manager.test.js
  - Test registerHit increments damage counter
  - Test isSectionDestroyed returns true after 3 hits
  - Test hasHoleAt detects hole position correctly
  - Test clearDamage removes all damage for pipe
  - Test cleanup removes destroyed pipe records
  - Test renderPipeWithHoles produces correct rendering
- **Verification:** npm test passes with 100% coverage on PipeDamageManager.js

## Task 16: Write Integration Tests for Cape/Laser
- **Status:** Ready
- **Requirement:** All Cape and Laser requirements
- **Description:** Integration tests for Cape/Laser with game systems
- **Implementation:**
  - Create test/integration/cape-laser.test.js
  - Test Cape renders correctly in all game states
  - Test Laser fires on 'L' key press during Playing state
  - Test Laser input is ignored in non-Playing states
  - Test Cooldown timer displays correctly
  - Test Audio methods called at correct times
  - Test Game reset clears laser state
- **Verification:** npm test passes

## Task 17: Run All Tests and Fix Failures
- **Status:** Ready
- **Description:** Run full test suite and fix any failures
- **Implementation:**
  - Run npm test to execute all tests
  - Analyze any failures and fix underlying code issues
  - Repeat until all tests pass
- **Verification:** npm test shows all tests passing

## Task 18: Final Verification at localhost:8080
- **Status:** Ready
- **Description:** Start game server and verify all features work
- **Implementation:**
  - Start HTTP server at port 8080
  - Verify Cape renders behind Kiro with animation
  - Verify 'L' key fires laser
  - Verify right-click fires laser
  - Verify cooldown timer displays correctly
  - Verify pipes get damaged by laser
  - Verify audio plays for laser events
  - Verify destroyed sections are non-collidable
- **Verification:** All features functional in browser

## Task Summary

| Task | Description | Status |
|------|-------------|--------|
| 1 | Add Cape Configuration | Ready |
| 2 | Create Cape.js Entity | Ready |
| 3 | Integrate Cape into Kiro Entity | Ready |
| 4 | Integrate Cape into Game Loop | Ready |
| 5 | Add Laser Configuration | Ready |
| 6 | Create LaserSystem.js | Ready |
| 7 | Create PipeDamageManager.js | Ready |
| 8 | Add Laser Audio Methods | Ready |
| 9 | Add Laser Input Handling | Ready |
| 10 | Integrate LaserSystem into Game Loop | Ready |
| 11 | Update Collision Detection for Destroyed Sections | Ready |
| 12 | Integrate Pipe Damage Rendering | Ready |
| 13 | Write Unit Tests for Cape | Ready |
| 14 | Write Unit Tests for LaserSystem | Ready |
| 15 | Write Unit Tests for PipeDamageManager | Ready |
| 16 | Write Integration Tests for Cape/Laser | Ready |
| 17 | Run All Tests and Fix Failures | Ready |
| 18 | Final Verification at localhost:8080 | Ready |

**Total Tasks:** 18
**Estimated Effort:** 6-8 hours
