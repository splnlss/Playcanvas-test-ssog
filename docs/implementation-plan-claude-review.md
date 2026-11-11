# Claude implementation plan review

Date: 2026-11-11\
Reviewed: `docs/superpowers/plans/2026-11-10-sog-viewer.md` only.

**Verdict: proceed, after a handful of plan-text fixes.** The architecture is right for a prototype: model replacement stays in config plus `viewer.ts`, the player rig is independent of scene content, and walking and avatars are correctly left as reserved data only. No finding below requires a redesign. I reviewed only the plan text; the PRD, review disposition, and walking document were not supplied.

## High priority

- **Engine-coupled modules have no test seam.** Task 2 demands viewer lifecycle tests with "a fake asset boundary" and player head-pivot tests, but `createViewer(canvas)` and `createPlayer(app)` accept only live engine objects. Vitest in Node has no WebGL2. Fix: put the load state machine and the pivot math into pure functions, for example `turnAroundPivot(rootPose, headWorldPos, degrees)` in `movement.ts`, and give `createViewer` an optional second argument for the asset loader. Keep `player.ts` and `viewer.ts` as thin glue.
- **Desktop tests need a DOM the stack does not declare.** Pointer lock, blur, and Escape handling are browser events. Either model desktop input as a pure state machine fed event records, or add a DOM environment to the Vitest config in Task 1. Decide before Task 3 writes tests.
- **Quality ownership on VR exit is contradictory.** `QualityControls.select` takes only low, medium, or high, so it cannot express the desktop profile. Yet "exit restores desktop budget" is listed as a Task 5 quality test while "desktop restoration remains owned by `xr.ts`". Fix: state that `xr.exit()` calls `viewer.setQuality(scene.desktopProfile)` directly, that the quality module is VR-only, and move that test into the XR test file.
- **Local HTTPS for the headset can stall Task 1.** Installing a trusted local CA on Quest is not straightforward. Add the standard alternative: `adb reverse` the dev server port and open `http://localhost:<port>` in the Quest browser, which counts as a secure context. Also confirm the chosen sample's manifest and chunk URLs send CORS headers before the headset session, with a self-hosted fallback outside Git.

## Medium priority

- **Task 1 verifies behaviors whose owning modules arrive later.** Snap thresholds live in `movement.ts` (Task 3) and the panel in `vr-menu.ts` (Task 4), so Task 1 writes throwaway code for both. Keep the menu ray test since it is a feasibility risk. Reduce the snap check to "any button calls `turn(30)` and the head stays put" and defer stick thresholds.
- **A splat budget path is asserted, not hypothesized.** The plan names a specific engine property to "record". Reword to "verify whether a runtime splat budget setting exists and which call changes detail live". The gate already requires live proof, so only the wording needs to change.
- **"End active XR before replacement" is assigned to the Viewer,** which has no XR knowledge. Assign it to `main.ts`, which owns both.
- **Underspecified conventions will cause test disagreements.** Specify quaternion component order, whether the diagonal cap applies to the horizontal plane only or the full vector, and give "re-entry distance" the same name as the Task 3 "3 meters ahead" orbit target.
- **`setAuto` appears in the required interface** while Auto is optional. Mark it optional, or add it only in Task 5 if implemented.
- **The worktree already has an untracked `docs/` directory.** "Commit only Task 1 files" needs an explicit path list at commit time rather than a blanket add.

## Low priority

- The test "two descriptors load without changes to controls" is structural and cannot fail meaningfully in a unit test. Drop it.
- "Verify no capture-boundary collisions" in Task 3 is unclear. Say what is meant, presumably pointer lock edge behavior.
- The ten-minute resource check should name its method: remote devtools from desktop Chrome over adb against the Quest browser.
- The `build` script repeats `typecheck`. Harmless, but one or the other.

Nothing here changes task order beyond trimming Task 1. Apply the high-priority edits to the plan, then execution can begin with Task 1 and its hardware gate.
