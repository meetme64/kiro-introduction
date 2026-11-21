# Bugfix: Blank Screen on Load

## Bug Condition

**Given** a player navigates to the running Flappy Kiro server (e.g. `http://localhost:8081`)
**When** the page finishes loading
**Then** the canvas should show the TITLE screen ("Flappy Kiro" title, start instruction, high score)

**Actual behavior:** The canvas stays blank (sky-blue background only, no text, no sprite). The page never recovers.

## Environment

- Static file server (`python3 -m http.server`) serving `index.html` / `main.js` as an ES module.
- Reproduced in headless Chrome (real browser engine), not just in automated Jest/jsdom tests.
- `npm test` (219 tests, Jest + jsdom) passes with this bug present — the existing test suite does not exercise the real `requestAnimationFrame` render loop against real `UIManager`/`HUD` wiring, so it did not catch this.

## Reproduction Steps

1. Start the static server: `python3 -m http.server 8081`.
2. Open `http://localhost:8081/` in a browser.
3. Observe: sky-blue canvas, no title text, no response to input. DevTools console shows an uncaught exception.

## Root Cause

`src/core/GameLoop.js`'s `_tick()` method runs `_render()` synchronously and only schedules the *next* `requestAnimationFrame` call **after** `_render()` returns:

```js
this._render();                                   // throws on frame 1
...
this.animationFrameId = requestAnimationFrame(this._boundTick);  // never reached
```

`_render()` dispatches to `_renderTitleState()`, which calls:

```js
this.game.uiManager.render();
```

`UIManager` (`src/ui/UIManager.js`) has no `render()` method — it only exposes `registerScreen`, `showScreen`, `showOverlay`, `hideOverlay`, `updateScore`, `showGameOver`, `hideGameOver`. Calling `uiManager.render()` throws `TypeError: this.game.uiManager.render is not a function`.

Because this throw happens *before* the loop reschedules itself, the very first animation frame kills the entire `requestAnimationFrame` chain. The loop never runs again, so the canvas is permanently stuck on whatever was drawn (or not drawn) in that first frame — a frozen, blank screen with no visible error to the player.

The same class of bug is latent in two more spots in `GameLoop.js`:
- `_renderPlayingState()` calls `this.game.uiManager.getScreen('hud')` — `getScreen` also does not exist on `UIManager`.
- `_renderPlayingState()` then calls `hud.render(score)` — `HUD` (`src/ui/HUD.js`) is a DOM-based component with `updateScore(current, high)`, `show()`, `hide()`, `create()`, `destroy()`, but no `render()` method.
- `_renderGameOverState()` also calls `this.game.uiManager.render()`.

All of these would independently reproduce the same "one frame then frozen" failure once the game reached that state (`PLAYING` or `GAMEOVER`), even after the TITLE-state crash is fixed.

### Secondary finding (not the cause of the blank screen, but surfaced during investigation)

`src/assets/assets.js`'s `ASSET_MANIFEST` references `assets/background.png` and `assets/score.wav`, neither of which exists in `assets/` (only `ghosty.png`, `jump.wav`, `game_over.wav` exist). These 404 but are caught by `Promise.allSettled` in `AssetLoader.loadAll()`, so they don't block init — just console noise and a `[AssetLoader] Some assets failed to load` warning.

## Fix

1. **`src/core/GameLoop.js`** — make a single frame's render/update failure non-fatal to the loop: wrap the per-frame work so `requestAnimationFrame` is always rescheduled even if `_update()`/`_render()` throws, and log the error instead of silently dying. This is the structural fix that prevents *any* future render-path exception from permanently freezing the canvas.
2. **`src/ui/UIManager.js`** — add the two methods `GameLoop` actually calls:
   - `render()` → delegates to `this.currentScreen.render()` if the current screen has one.
   - `getScreen(name)` → returns `this.screens[name]`.
3. **`src/ui/HUD.js`** — add a `render(score)` method that safely updates the score element (no-op if the DOM element hasn't been created/mounted), matching the single-argument call `GameLoop._renderPlayingState()` already makes.
4. **`src/assets/assets.js`** — remove the `BACKGROUND` and `SCORE` manifest entries that point at non-existent files, eliminating the 404s/warning (secondary cleanup, not required for the blank-screen fix itself).

## Verification

- Reproduced the exact browser error via headless real Chrome (not jsdom) with console/pageerror capture, confirming `this.game.uiManager.render is not a function` as the uncaught exception that kills the RAF loop.
- After the fix: re-run the same headless Chrome check and confirm the TITLE screen renders and the RAF loop keeps running across multiple frames (ready state reaches `READY` and stays stable, no `pageerror` events).
- `npm test` must continue to pass (219/219).

---

## Round 2: Blank Screen After Pressing Spacebar (Chrome), Still Blank on Safari

### Bug Condition

**Given** the TITLE screen is showing correctly (round 1 fix confirmed working)
**When** the player presses spacebar to start playing
**Then** the canvas should show Kiro, pipes, and clouds and respond to further input

**Actual (Chrome):** Canvas goes blank again the instant `PLAYING` state is entered, and stays blank. The loop itself keeps running (round 1's resilience fix prevented a hard freeze), but every single frame throws before any drawing happens, so nothing is ever drawn.

**Safari:** Still fully blank, including the TITLE screen. Not yet root-caused — see "Safari" section below.

### Root Cause (Chrome / PLAYING blank)

Same class of bug as round 1, but in `GameLoop._renderPlayingState()` and `GameLoop._update()`: the method names `GameLoop` calls on `CloudManager`, `PipeManager`, `CanvasRenderer`, `CollisionDetector`, and `ScoreManager` don't match what those classes actually implement. Confirmed live via headless Chrome with console capture:

```
TypeError: this.game.collisionDetector.check is not a function
TypeError: this.game.cloudManager.render is not a function
```

Specifically:
- `cloudManager.render(renderer)` — `CloudManager` has no `render()`; it only exposes `update(dt)`, `getClouds()`, `reset()`.
- `pipeManager.render(renderer)` — same gap on `PipeManager` (`update(dt)`, `getPipes()`, `reset()`).
- `renderer.drawKiro(...)`, `renderer.drawPauseOverlay(...)` — `CanvasRenderer` never had these; it only had `clear`, `drawSprite`, `drawText`, `drawRectangle`, `drawOutlinedRectangle`, `getDimensions`, `resize`, `setScale`.
- `renderer.ctx` — the real property is `renderer.context` (no `ctx` alias existed).
- `collisionDetector.check(...)` — real method is `checkAllCollisions(kiro, pipes, canvasHeight)`.
- `scoreManager.getCurrentScore()` — real method is `getCurrent()`; `scoreManager.update(dt)` doesn't exist at all.

Because `_renderPlayingState()` throws on its very first line (`cloudManager.render`), execution stops before `drawPipes`/`drawKiro` ever run — so the frame stays whatever `renderer.clear()` left it as (the sky-blue background), every single frame, forever.

Separately, **`GameLoop._update()` already duplicated work that `GameStateManager.PlayingStateHandler.update()` performs**: physics, pipe/cloud updates, collision checks, score updates, and difficulty scaling are all handled safely (via optional chaining) inside `GameStateManager`'s own `update()`, which `GameLoop._update()` also calls. `GameLoop`'s own duplicate block used the wrong method names and had no optional-chaining guard, so it threw instead of silently no-op'ing like `GameStateManager`'s copy did. This duplication was also a correctness risk independent of the crash (anything that *did* match would have run twice per frame).

Root cause, in one sentence: **the test suite's mocks (`test/helpers/mocks.js`) were written against an idealized API shape that was never reconciled with the real production classes**, so 335 Jest tests passed throughout while the real, live game was non-functional the moment `PLAYING` was reached. This is why the bug surfaced only through real-browser testing (headless Chrome with console/pageerror capture), not through `npm test`.

### Fix

1. **`src/rendering/CanvasRenderer.js`** — added the methods `GameLoop` actually calls: `drawClouds(clouds)`, `drawPipes(pipes)`, `drawKiro(kiro, image)` (draws the real ghosty sprite when available, else a visible placeholder shape so nothing is ever invisible), `drawPauseOverlay()`, and a `ctx` getter alias for `context` (for the Cape/Laser code, which was written against a raw `CanvasRenderingContext2D`).
2. **`src/core/GameLoop.js`**:
   - `_renderPlayingState()`: calls the new renderer methods instead of the nonexistent manager-side `render()` methods; fixed `scoreManager.getCurrentScore()` → `getCurrent()`.
   - `_update()`: removed the redundant, unsafe duplicate orchestration block (physics/pipes/clouds/collision/score/difficulty) since `GameStateManager.update()` (called just above it) already owns that. Kept the Cape/Laser/invincibility calls, which are not duplicated elsewhere.
3. **`test/helpers/mocks.js`** — updated `createMockStateManager()` to perform the physics→pipes→clouds→collision→score→difficulty orchestration itself (mirroring the real `GameStateManager.PlayingStateHandler.update()` contract), since that responsibility moved out of `GameLoop` in the fix above. This keeps the existing "update order" integration tests meaningful without reverting the production fix to match stale mocks.

### Verification

- `npm test`: 335/335 passing.
- Headless Chrome: loaded TITLE, pressed spacebar, sampled state every 1s for 6s. Zero `pageerror` / console error events. `gameState` correctly reports `PLAYING`. Canvas confirmed to have non-background pixel content after spacebar (previously: none).

### Follow-up finding (not fixed in this pass — separate from "blank screen")

While verifying, pipes and clouds never actually appeared during `PLAYING` even after the crash was fixed (`pipeManager.getPipes()` / `cloudManager.getClouds()` stayed empty across 6+ seconds, well past their spawn intervals). Also, `game.kiro` in `main.js` is a **plain data object** (`{ x, y, velocity, width, height, rotation }`), not an instance of the real `Kiro` class (`src/entities/Kiro.js`) or wired to `PhysicsEngine`'s internal state (`PhysicsEngine` tracks its own private `#x/#y/#velocityY`, never synced back to `game.kiro`). Net effect: Kiro doesn't currently move, jump, or collide for real — the screen is no longer *blank*, but gameplay itself doesn't yet work. This is a pre-existing gap in how `main.js` wires the game object to the entity/physics classes, not something introduced by the Cape/Laser feature or by this bugfix. Flagging it as a separate follow-up rather than fixing it here, since it's a different bug class (non-functional gameplay logic) and a larger change (rewiring `main.js`'s game-object construction), not a rendering crash.

### Safari (not yet root-caused)

Could not reproduce/diagnose directly: Safari's WebDriver requires "Allow Remote Automation" to be enabled manually in Safari's Develop menu (Settings → Advanced → "Show features for web developers", then Develop → "Allow Remote Automation"), which needs GUI interaction this session can't perform. Checked and ruled out by static review:
- MIME type: the static server sends `Content-Type: text/javascript` for `.js` files, which Safari accepts for module scripts.
- Safari version on this machine reports as very recent (`26.6.1`), so modern CSS (`aspect-ratio`) and Canvas APIs (`roundRect`) should both be supported.

Needs either: (a) enabling Safari's remote automation setting so this can be driven via `safaridriver` + WebDriver for real console capture, or (b) the user opening Safari's Web Inspector (Develop → Show Web Inspector → Console) on the page and sharing what errors appear there.

---

## Round 3: Safari Re-check, and "Kiro Doesn't Move, No Clouds/Pipes" (Chrome)

### Safari

With "Allow Remote Automation" enabled, drove real Safari via `safaridriver` + WebDriver. Result: **Safari loads the TITLE screen correctly and transitions to PLAYING correctly** - `getBoundingClientRect()` reports the full 480x640 canvas, pixel sampling confirms non-background content is drawn, and the state machine transitions as expected. Safari's WebDriver doesn't support remote log retrieval (`'se/log' command not found`), so console errors couldn't be captured directly this way, but the functional checks all passed.

This strongly suggests the Safari window the user was looking at had the **pre-fix** `main.js`/`GameLoop.js`/etc. cached (Safari is aggressive about caching ES module scripts). **Recommendation: hard-refresh Safari (Cmd+Option+R) or reload in a new Private window** before re-checking. If still blank after that, the issue is something else and needs a fresh report.

### "Kiro doesn't move, no clouds or pipes displayed" (Chrome)

This turned out to be **one root cause with three cascading symptoms**, all stemming from a single bug that was invisible until round 2's fixes took effect.

**Root cause:** `StateHandler`'s constructor (`src/core/GameStateManager.js`) did:
```js
constructor(manager) {
    this.manager = manager;
    this.game = manager.game;   // <- snapshot taken HERE
}
```
All four state handlers (`TitleStateHandler`, `PlayingStateHandler`, `PausedStateHandler`, `GameOverStateHandler`) are constructed synchronously inside `GameStateManager`'s own constructor. `main.js` calls `new GameStateManager(null)` long before it ever sets `gameStateManager.game = game` (that assignment happens afterwards, in "Phase 7: Create Game Object"). So every handler's `this.game` was permanently captured as `undefined` at construction time - and `PlayingStateHandler.update()`'s very first line, `if (!this.game) return;`, silently bailed out on **every single frame** of gameplay. Physics, pipe spawning, cloud spawning, score, difficulty, collision - none of it ever ran, with no error at all (an early `return`, not a throw). This bug existed before the Cape/Laser feature and before this bugfix session; it was just never exercised by any real-browser test.

**Fix:** changed `StateHandler.game` from a constructor-time snapshot to a live getter:
```js
get game() {
    return this.manager.game;
}
```

**Cascading bugs this exposed** (previously masked because the code paths that would have hit them never ran):
1. **`main.js`'s `difficultyManager.getDifficulty()`** read `CONFIG.pipes.speedMultipliers` / `CONFIG.pipes.gapSizes`, but the root `config.js` has no `pipes` key at all - that data lives under `CONFIG.difficulty.*`. This threw inside `PipeManager.spawnPipe()` on the very first spawn attempt. Fixed to read `CONFIG.difficulty.*`, with an explicit `baseSpeed = 2.0` constant (Requirement 1) since the flat config has no dedicated base-speed field to multiply by the tier multiplier.
2. **`game.kiro` had no `update()`/`jump()` methods at all** - it was a static data object (`{x, y, velocity, width, height, rotation}`). `PlayingStateHandler.update()` already called `kiro.update?.(...)` and `InputHandler`'s jump callback was supposed to call `kiro.jump()` (per `GameStateManager`'s own comment: *"Jump is handled by the game loop via the physics system / This is set up through inputHandler.onJump callback"*) - but nothing ever actually wired that call. Added real `update(dtMs)` and `jump()` methods directly to the `kiro` object in `main.js`, and wired `inputHandler.onJump` to call `kiro.jump()` when in `PLAYING` state.
   - First attempt at the physics scaling was itself wrong (converted the frame-tuned `gravity`/`jumpStrength` constants to px/sec using only one factor of 60, making gravity 60x too weak - Kiro would jump and then drift upward indefinitely). Reworked to integrate directly in "frame-equivalent" units (`frameEquivalent = (dtMs / 1000) * 60`), which exactly reproduces the original discrete 60-FPS-tick physics regardless of actual frame rate.
3. **`UIManager` had no `hideScreen()` method** and `showScreen(name, data)` ignored the second argument - once `PlayingStateHandler`/`TitleStateHandler`'s `enter()`/`exit()` methods actually started running (because `this.game` now resolves), they called `uiManager.hideScreen('title')`, which threw and aborted the TITLE→PLAYING transition the first time it was attempted. Added `hideScreen(name)`, and made `showScreen(name, data)` forward `data.score`/`data.isNewRecord` positionally to `GameOverScreen.show(score, isNewHighScore)`.
4. **Collision detection was a dead no-op**: `collisionDetector.check?.(...)` doesn't exist on the real `CollisionDetector` (it only has `checkAllCollisions`, `checkKiroPipeCollision`, etc.), so the optional-chained call always silently did nothing - Kiro could fall forever and never die. Changed to call the real `checkAllCollisions(kiro, pipes, canvasHeight)` and transition to `GAMEOVER` via `this.manager.triggerGameOver()` when it reports a collision.

### Verification

- `npm test`: 335/335 passing throughout every step of this round.
- Headless Chrome, end to end: TITLE renders → spacebar → `PLAYING` → jump raises Kiro and gravity pulls it back down and clamps at terminal velocity (confirmed via direct instrumentation of `velocity`/`y` over time) → pipes spawn and are visible (`pipeCount` > 0) → clouds spawn (confirmed via direct call count, naturally slower to observe in this constrained headless sandbox since rendering more pipes measurably drops the sandbox's frame rate - not expected to be an issue on normal hardware) → falling into the ceiling or ground correctly triggers `GAMEOVER`. Zero `pageerror`/console error events across the entire flow.

### Known remaining gap (noted, not blocking)

There are **two parallel, divergent `CONFIG` objects** in this codebase: the root `/config.js` (flat shape, used by `main.js`) and `/src/config.js` (nested shape, used by `CollisionDetector`, `PhysicsEngine`, `InputHandler`, the `Kiro` entity class, etc.), with different values for the same constants (e.g. `jumpStrength: -6` vs `-4.5`, `terminalVelocity: 10` vs `8.0`). They don't conflict functionally right now because each module consistently uses its own config internally, but it's a landmine for future changes (editing one config and expecting it to affect behavior governed by the other). Flagging it, not unifying it in this pass - that's a larger structural change outside "fix the blank screen / make the game playable."
