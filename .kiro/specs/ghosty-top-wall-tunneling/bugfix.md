# Bugfix: Ghosty Passes Through the Top Wall (Pipe) Sometimes

## Bug Condition

**Given** Kiro is flying near a pipe gap, moving upward toward the upper pipe section
**When** Kiro's hitbox overlaps the upper pipe's rectangle
**Then** a `PIPE_UPPER` collision should be detected and the game should transition to `GAMEOVER`

**Actual behavior:** Kiro flies straight through the upper pipe section without any collision being registered. Reported as intermittent ("sometimes"), specifically on the top wall.

## Reproduction

1. Start the game, get a pipe on screen.
2. Jump repeatedly to fly up into the gap and continue past it into the upper pipe section's body.
3. Observe: no collision, no game over - Kiro passes straight through.

## Root Cause

`src/components/PipeManager.js` (the `PipeManager` implementation `main.js` actually constructs and uses) creates every pipe object with a `width` property:

```js
pipe.width = this.config.pipeWidth;
```

`src/utils/HitboxUtils.js`'s `getUpperPipeHitbox(pipe)` and `getLowerPipeHitbox(pipe, canvasHeight)` - which feed `CollisionDetector.checkAllCollisions()`, the method `GameStateManager.PlayingStateHandler.update()` calls every frame - read a *different* property name:

```js
export function getUpperPipeHitbox(pipe) {
    return {
        type: 'rectangle',
        x: pipe.x,
        y: 0,
        width: pipe.pipeWidth,   // <- always undefined; the real pipe objects only have `.width`
        height: pipe.gapPosition
    };
}
```

Since `pipe.pipeWidth` is always `undefined`, the resulting hitbox's `width` is `undefined`. Inside `checkCircleRectangleCollision`:

```js
const closestX = Math.max(rect.x, Math.min(circle.centerX, rect.x + rect.width));
```

`rect.x + rect.width` evaluates to `NaN` (anything + `undefined` = `NaN`), which propagates through `Math.min`/`Math.max` (both return `NaN` when either argument is `NaN`) into `distanceX`, then into `distanceSquared`. The final check `distanceSquared < radiusSquared` is `NaN < number`, which is **always `false`** in JavaScript - so this hitbox pairing can never report a collision, for any Kiro position, for any pipe, on any frame.

This affects **both** `getUpperPipeHitbox` and `getLowerPipeHitbox` identically - both sections of every pipe are unable to register a collision via this path. It manifests as "sometimes, top wall" to the player because:
- Falling through the lower pipe section is often still caught shortly afterward by the separate, correct ground-boundary check (`checkGroundCollision`, which only looks at `centerY`/`radius`/`canvasHeight` and has no dependency on pipe width at all) - so the player experiences it as "the pipe stopped me" when actually the ground did.
- There is no equivalent boundary above a mid-screen upper pipe to mask the miss, so flying through the top pipe is the case where the bug is directly visible.

Ceiling/ground boundary collision (`checkCeilingCollision`, `checkGroundCollision`, `checkBoundaryCollision`) does **not** reference `pipe.pipeWidth` at all and is unaffected by this bug.

## Fix

Change the two property reads in `src/utils/HitboxUtils.js` from `pipe.pipeWidth` to `pipe.width`, matching the actual property name set by `PipeManager`:
- `getUpperPipeHitbox(pipe)`
- `getLowerPipeHitbox(pipe, canvasHeight)`

No other function in `HitboxUtils.js` or `CollisionDetector.js` is touched. `checkCircleRectangleCollision`, `checkCeilingCollision`, `checkGroundCollision`, `checkBoundaryCollision`, and the Kiro hitbox calculation are left exactly as they are - this is a single, scoped property-name correction, not a change to any collision algorithm or behavior.

## Verification

- Confirm, via live browser testing, that flying Kiro into the body of an upper pipe section now triggers `GAMEOVER` with `type: 'PIPE_UPPER'`.
- Confirm flying into a lower pipe section still triggers `GAMEOVER` with `type: 'PIPE_LOWER'` (previously masked by the ground boundary; now correctly attributed).
- Confirm ceiling and ground boundary collisions still behave identically to before (unchanged code path) - no regression.
- `npm test` must continue to pass at the same count as before the fix.
