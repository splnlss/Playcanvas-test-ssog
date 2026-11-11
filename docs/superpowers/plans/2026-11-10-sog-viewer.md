# Streaming SOG Viewer Implementation Plan

> **Active original track — 2026-11-11:** The user moved desktop-GPU-to-Quest research into a separate tab and asked to continue this original local-rendering viewer plan here. Resume at Task 1’s unpassed hardware gate; do not treat successful page loading as proof of immersive VR.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Recommend native execution for this small, sequential prototype.

**Goal:** Build the simple desktop and Quest 3 viewer defined in the PRD, with streaming, flight, and manual VR quality comparisons.

**Architecture:** A static vanilla TypeScript app uses PlayCanvas's native streaming and WebGL2 rendering. A player rig independent of scene content supports desktop and XR; small modules own configuration, movement, sessions, quality, and interface controls. Complete the hardware feasibility gate before building the remaining UI.

**Tech Stack:** PlayCanvas Engine, TypeScript, Vite, Vitest for pure logic and lifecycle tests, npm with a committed lockfile. No UI framework, backend, physics, or custom streaming engine. Resolve supported package versions at execution and pin PlayCanvas to the exact version validated in Task 1.

**Spec:** [PRD](../../PRD.md), [review disposition](../../PRD-review-resolution.md), [walking and avatar follow-up](../../walking-and-avatars.md). Read all three before execution.

## Global Constraints

- Targets: desktop Chromium and Meta Quest 3 browser; static HTTPS hosting.
- Prepared native Streamed SOG assets; one configured scene per shared link. Also support native single-file `.sog` replacement, clearly labeled non-streamed, without claiming LOD controls affect it.
- Model URLs/transforms live only in scene configuration and loading; model changes never require controls edits. Scene root and meter-based player rig are separate.
- Walking collision and avatars are planned follow-ups, not prototype implementations; no physics/avatar dependencies or placeholder frameworks now.
- Flight: 1.5 m/s, desktop Shift boost to 3 m/s, Q/E vertical, no collisions.
- VR: headset-yaw-relative horizontal flight, right-stick vertical movement and 30° snap turns; no artificial pitch/roll or VR boost.
- Manual Low/Medium/High and FPS are required; Auto is optional and off on VR entry.
- Preserve scene content during refinement; restore desktop mode, pose, target, and quality after VR.
- Keep the reset fade and small controller-operated menu; do not add feature scope.
- No hardware verification claim based on desktop emulation or documentation alone.

## Review Focus

- Stale load completion after Retry must not replace the active scene or enable VR for a failed attempt (Task 2).
- Lost pointer lock, focus, or controllers must stop movement, including held inputs (Tasks 3–4).
- Duplicate VR requests, denied entry, and external exit must restore one usable desktop state (Task 4).
- Turning with an offset physical head position must rotate around that head without unintended translation (Tasks 1 and 4).
- Manual quality must not be overridden by Auto or leak into the restored desktop settings (Tasks 4–5).

## File map and shared interfaces

Create only files needed by each task; do not scaffold empty abstractions. Keep load-generation/readiness transitions and head-pivot turn math engine-independent for Node tests. Desktop input state consumes event records, avoiding an extra DOM test dependency; verify actual browser event wiring manually.

| File | Responsibility |
| --- | --- |
| `package.json`, lockfile, `tsconfig.json`, `index.html` | Minimal Vite/TypeScript scripts and canvas host. |
| `src/main.ts`, `src/style.css` | App composition, resize/cleanup, compact desktop interface. |
| `src/config.ts` | Scene registry, settings validation, URL selection, shared types. |
| `src/viewer.ts` | App and scene content root, native source selection/loading, readiness/errors, asset ownership and cleanup. |
| `src/player.ts` | Independent player root/camera, world-meter pose and rig movement; future walking/avatar attachment. |
| `src/movement.ts` | Pure movement/snap decisions shared by desktop and VR. |
| `src/desktop.ts` | Orbit/Fly input, pointer lifecycle, pose/target snapshots. |
| `src/xr.ts` | XR lifecycle, rig/controller input, desktop restoration. |
| `src/quality.ts` | Presets, manual/optional Auto state, smoothed FPS. |
| `src/vr-menu.ts` | One world-space panel, pointer hit selection, reset fade. |
| `tests/{config,viewer,player,movement,desktop,xr,quality}.test.ts` | Meaningful logic and lifecycle coverage. |
| `README.md`, `docs/prototype-validation.md` | Run/deploy instructions and honest manual evidence. |

Use these application-owned interfaces; they are not claims about PlayCanvas APIs:

- `Vec3 = [number, number, number]`; `Pose = { position: Vec3; rotation: [number, number, number, number] }` (meters, quaternion in `[x, y, z, w]` order).
- `DesktopSnapshot = { pose: Pose; target: Vec3; mode: 'orbit' | 'fly' }`.
- `Preset = 'low' | 'medium' | 'high'`; `QualityProfile = { splatBudget: number }` with positive, ascending VR budgets.
- `SplatSource = { kind: 'streamed-sog'; manifestUrl: string } | { kind: 'sog'; url: string }`.
- `SceneConfig` includes ID/title/source/attribution/permission reference, transform position/rotation/uniform scale, desktop pose/target, VR pose/local eye height, re-entry distance, speeds, angle, and desktop/VR quality profiles. Optional `walking: { collisionMeshUrl: string; safeSpawn: Pose }` is reserved data, not loaded by the initial prototype.
- `resolveScene(search: string): SceneConfig` uses configured `defaultSceneId`; invalid IDs produce a labeled error.
- `createPlayer(app): PlayerRig` creates independent `root` and tracked `camera`; expose `getPose(): Pose`, `setPose(pose: Pose): void`, `move(deltaMeters: Vec3): void`, `turn(degrees: number): void`, and `destroy(): void`. The root represents the body/rig origin; head and controller tracking remain relative to it. Turn preserves current head world position.
- `createViewer(canvas: HTMLCanvasElement): Promise<Viewer>`; `Viewer` owns `app`, `sceneRoot`, and `player: PlayerRig`, `load(scene): Promise<void>` (resolves at first content), `reload(): Promise<void>`, `setQuality(profile): void`, and `destroy(): void`. Loading a new descriptor disposes old scene assets and resets scene-specific poses/profiles; the player rig is independent of the scene transform. The composition module `main.ts`, which knows both modules, ends active XR before calling scene replacement; the loader never imports XR.
- `LoadState = 'loading' | 'ready' | 'error'`; optional refinement notices never replace ready content with an initial spinner.
- `createDesktop(viewer, scene): DesktopControls` exposes `snapshot()`, `restore(snapshot)`, `setEnabled(boolean)`, `reset()`, and `destroy()`.
- `createQuality(apply: (profile: QualityProfile) => void, profiles): QualityControls` exposes `select(preset)`, `onEnter()`, `update(dtSeconds, targetFps)`, and read-only `{ preset, auto, fps }` state. `onEnter()` resets Auto off, retains last preset, and applies it.
- `createXr(viewer, desktop, quality, scene): XrControls` exposes `enter(): Promise<void>`, `exit(): Promise<void>`, `reset(): Promise<void>`, `destroy()`, and read-only `state: 'unavailable' | 'idle' | 'starting' | 'active' | 'ending'`.

`viewer.ts` contains engine-specific integration. Do not invent a public engine hook to satisfy these interfaces; verify against the pinned source in Task 1 and record the chosen calls.

## Task 1: Prove streaming, stereo, and live budgets

**Files:** Create package/bootstrap files, `src/load-state.ts`, initial pivot math and their tests, `src/main.ts`, the initial `src/viewer.ts`, `src/player.ts`, `src/config.ts`, `docs/prototype-validation.md`; later tasks extend these.

**Interfaces:** Produce `createViewer`, positive `QualityProfile` support, and one permitted sample configuration. Task 2 completes validation/error behavior. Use temporary minimal VR entry and a single test panel; later tasks replace their handlers.

- [ ] Resolve current compatible dependencies, add `dev`, `build`, `typecheck`, and `test` scripts; `build` runs `tsc --noEmit && vite build`, `test` runs `vitest run`. Set up WebGL2 PlayCanvas with separate scene root and player rig, and native streamed loading. No scaffolding tests.
- [ ] Choose a publicly reusable sample and record its exact manifest, source, permission reference, attribution, transform, and initial view. Confirm it is actually streamed SOG and the flight route will request additional chunks. Check manifest and chunk CORS access before hardware testing. If hosting must change, copy permitted assets outside Git to an authorized asset host; do not copy a large dataset into Git.
- [ ] Inspect the installed engine/types and record concrete APIs for initial splat readiness, stream/error observability, whether a runtime splat-budget setting exists and which installed-engine call changes detail live, XR events, runtime frame rate, and menu ray/button input. Where stream signals are absent, use the PRD fallbacks.
- [ ] Start with exploratory positive budgets of 250k/500k/1M; tune and record actual Low/Medium/High values without treating these starting numbers as measured recommendations. Verify budget changes while immersed without whole-scene reload; a setter existing in docs is insufficient evidence.
- [ ] Run `npm run typecheck` and `npm run build`; require exit 0. For USB-connected Quest testing, try `adb reverse tcp:5173 tcp:5173` and open `http://localhost:5173` in the headset browser; verify secure-context/XR support there. Otherwise use existing authorized HTTPS hosting. Do not install a local CA or change browser security flags automatically.
- [ ] On Quest 3, verify both-eye splats, physical head motion, first-content readiness, live budgets, floor/local-space offset, ray/trigger activation of one panel button, and a button-triggered 30° turn that preserves the head pivot. Stick thresholds belong to Task 3. Record device/browser, engine version, evidence, and supported/fallback signals. A desktop emulator may help development but does not pass this step.
- [ ] **Gate:** Continue only when streaming, stereo, live splat-detail changes, and minimal menu interaction pass. If headset access is unavailable, mark `not run` and request the smallest manual hardware check; do not present feasibility as proven or build the remaining UI speculatively.
- [ ] Stage explicit Task 1 paths only, leaving pre-existing untracked documents intentional; never blanket-stage this worktree. Commit only Task 1 files with `feat: prove streamed SOG and Quest VR feasibility` after the gate passes.

## Task 2: Configured scene links and recoverable loading

**Files:** Extend `src/config.ts`, `src/viewer.ts`, `src/main.ts`; create `src/style.css`, `tests/config.test.ts`, `tests/viewer.test.ts`, `tests/player.test.ts`.

**Interfaces:** Complete `resolveScene`, `Viewer.load/reload/destroy`, and `LoadState`; produce validated configuration for every later task.

- [ ] Add failing tests: no scene parameter resolves `defaultSceneId`; unknown ID errors; invalid source kind/URL, invalid scale, nonpositive/unsorted streamed budgets, and missing attribution/source URL configuration fail clearly. single-file sources report non-streamed and disable ineffective budget controls. A scene scale change leaves player motion in meters unchanged. A late result from load A after retry B cannot replace B; manifest success alone cannot mark ready; a failed refinement does not destroy visible content. Use a small injected fake asset boundary for lifecycle tests rather than mirroring engine internals.
- [ ] Run `npm test -- tests/config.test.ts tests/viewer.test.ts tests/player.test.ts`; confirm failures exercise the intended missing behaviors.
- [ ] Implement configuration validation, both native source kinds, and minimal loading/error/Retry UI. Keep URLs/source dispatch inside `viewer.ts`; no loader plugin system. Support config+URL+page-reload model replacement, not a scene picker. Use streamed assets for three-preset performance testing; mark unsupported single-file budget controls unavailable. Resolve first-content readiness using Task 1's verified integration. Clean up obsolete listeners/assets on reload and disposal. Implement explicit Reload scene where per-chunk retry is unavailable.
- [ ] Re-run the three test files and `npm run build`; require passing output. Check default/explicit/unknown links and offline initial load in the browser. Capture partial loading in the network panel.
- [ ] Commit with `feat: add configured scenes and loading recovery`.

## Task 3: Desktop Orbit and Fly

**Files:** Create `src/movement.ts`, `src/desktop.ts`, `tests/movement.test.ts`, `tests/desktop.test.ts`; extend `src/main.ts` and toolbar styles.

**Interfaces:** Produce `DesktopControls`. Add `flightDelta(axes: Vec3, yawRadians: number, speed: number, dtSeconds: number): Vec3` and `snapTurn(axis: number, armed: boolean): { degrees: number; armed: boolean }` for reuse in Task 4. Cap the full three-axis movement vector, including vertical movement, to the selected speed. Quaternion order is `[x, y, z, w]`; use `orbitReentryDistance` consistently. Clamp movement dt to 0.05 seconds after stalls, dead zone 0.15; snap threshold 0.7 and re-arm below 0.2.

- [ ] Write failing tests: forward movement is 1.5 meters after one second split across normal frame steps, boost is 3 meters, diagonal movement is capped, yaw rotates horizontal movement without pitch-driven ascent, stalled frames do not jump, and held snap input produces one 30° turn until neutral. Desktop tests cover pointer/focus loss clearing held keys, Reset returning to Orbit, and Orbit re-entry target exactly 3 meters ahead by default.
- [ ] Run `npm test -- tests/movement.test.ts tests/desktop.test.ts`; confirm intended failures.
- [ ] Implement Orbit drag/pan/zoom and Fly pointer/mouse/WASD/QE/Shift. Use frame-time movement in world meters through `PlayerRig`, independently of scene scale, and explicit focus handling. Preserve pose on mode changes and snapshots; restore never requests pointer lock.
- [ ] Run the tests and `npm run build`. Manually check every input, mode switch, page blur, Escape, Reset, and help text; verify flight passes through the visual scene without collision constraints and Escape releases pointer lock.
- [ ] Commit with `feat: add desktop orbit and flight`.

## Task 4: VR lifecycle, controller flight, and minimal menu

**Files:** Create `src/xr.ts`, `src/vr-menu.ts`, `tests/xr.test.ts`; extend `src/main.ts`, reuse movement and desktop interfaces. Create the minimal `src/quality.ts` preset state needed by the menu; Task 5 completes metrics/quality behavior.

**Interfaces:** Produce `XrControls`. `createVrMenu(viewer, actions): { setVisible(visible): void; update(): void; destroy(): void }` consumes reset/exit/selectPreset actions and displayed quality state; add the optional Auto action only in Task 5 if implemented.

- [ ] Write failing XR lifecycle tests with a fake session boundary: repeated enter requests start once; rejection restores desktop state/quality; external session end and controller loss stop movement; five cycles create no duplicate callbacks; saved pose/target/mode are restored without pointer lock. Verify a snap around an offset head position leaves that head position unchanged. Menu-open state suppresses flight/turning while tracking continues.
- [ ] Run `npm test -- tests/xr.test.ts tests/movement.test.ts`; confirm failures for missing behaviors.
- [ ] Implement availability and scene-ready gating, direct user-gesture entry, session cleanup, floor/local fallback, controller axes validated on Quest, dominant right-stick axis, X-menu toggle, and right-ray trigger selection. Apply tracked pose only through engine XR handling; locomotion calls the player rig. Never parent the rig to scene content or assign tracked camera pose from an avatar.
- [ ] Build one stable panel with Reset, Exit, and preset controls. Implement reset fade with a brief full-view unlit overlay validated in both eyes; clear movement, reposition under fade, then reveal. Do not add controller models, menus within menus, or a UI framework.
- [ ] Run tests and `npm run build`. On Quest, verify flight/altitude/snap, head pivot, menu input, fade, reset scale, denied entry, external exit, disconnected controllers, and five entry/exit cycles. Record results honestly.
- [ ] Commit with `feat: add VR flight and headset controls`.

## Task 5: Manual quality and FPS, then optional Auto

**Files:** Complete `src/quality.ts`, create `tests/quality.test.ts`, extend menu and XR integration, update validation notes.

**Interfaces:** Complete `QualityControls`; `update` consumes frame dt and target FPS from the verified runtime path or the labeled 72 FPS fallback. Use one-second windows for the FPS estimate; persist preset in page memory only. The quality module is VR-only. On exit or failed entry, `xr.ts` calls `viewer.setQuality(scene.desktopProfile)` directly; test desktop restoration in `tests/xr.test.ts`. Add `setAuto(enabled)` only if implementing optional Auto.

- [ ] Write failing tests: selecting each preset applies its distinct configured budget; manual selection disables Auto when implemented; re-entry keeps preset but resets Auto off; FPS uses elapsed time and ignores invalid dt. Manual state cannot be overridden by later automatic updates.
- [ ] Run `npm test -- tests/quality.test.ts tests/xr.test.ts`; confirm intended failures, then implement preset/FPS behavior and the active-state readout.
- [ ] Run those tests and `npm run build`; verify all three presets change actual detail/budget in the headset without session restart. Record a manual Low/Medium/High comparison on the same described 60-second path, including quality notes and application FPS.
- [ ] Optional final enhancement: implement Auto only if it fits the existing state module. First add tests for downshift after 3 seconds below 90%, upshift after 10 seconds above 98%, a 10-second cooldown, bounds, manual override, and re-entry reset. Run red then green. If deferred, record it and omit the toggle rather than shipping a nonfunctional control.
- [ ] Commit with `feat: add VR quality presets and FPS` (and a separate optional Auto commit if implemented).

## Task 6: Static preview and prototype acceptance

**Files:** Create `README.md`; finalize `docs/prototype-validation.md`; change app files only to fix observed failures.

**Interfaces:** Deployment consumes the `dist/` output; no new application subsystem.

- [ ] Run `npm test`, `npm run typecheck`, and `npm run build`; require all exit 0. No live dataset requests in unit tests.
- [ ] Exercise each PRD acceptance row in desktop and real Quest 3 browsers. Record pass/fail/not-run with device versions. Describe the path rather than writing replay tooling; perform the ten-minute manual resource/crash check.
- [ ] Serve `dist/` over static HTTPS, verify CORS and relative chunks, scene links, denied VR, missing manifest/chunk behavior, resize and recovery. Use a temporary preview or existing authorized destination; request a destination before a final public deployment if none is supplied.
- [ ] Document `npm ci`, dev/build commands, HTTPS preview URL, scene configuration/attribution and model swap steps for both source kinds, scene/player transform conventions, controls, actual budgets, engine/backend version, FPS limitations, optional Auto status, and remaining measured limitations.
- [ ] Commit with `docs: record prototype setup and acceptance results`. Do not claim full completion with untested headset rows.

## Self-review and execution handoff

Coverage: scene configuration/streaming/errors/model replacement/player isolation → Tasks 1–2; desktop → Task 3; VR lifecycle/flight/menu/fade → Tasks 1 and 4; quality/FPS/optional Auto → Task 5; hosting/manual measurements → Task 6. Every Review Focus item has an owning test step. Exact engine hooks, sample, and budgets are gated discoveries, not fabricated settled facts.

Recommend native execution: these six tasks share a small number of interfaces and depend on one hardware feasibility result. Review this plan before implementation and select native or subagent-driven execution. Hardware access is required to finish Task 1; the plan itself does not assert that a headset is connected.

Follow-up design: `docs/walking-and-avatars.md` specifies the collision asset contract, later walking controller integration, and avatar attachment. These are intentionally not added as implementation tasks in this initial flight prototype.

## Claude plan review disposition — 2026-11-11

[Original review](../../implementation-plan-claude-review.md). Applied: pure loading/pivot test seams; pure desktop event state; XR-only desktop quality restoration; ADB localhost option with secure-context validation; initial panel/turn probe instead of early full input implementation; loader/XR coordination in main; explicit quaternion/full-vector movement conventions; optional Auto interface; explicit commit paths. Configuration-only swapping is manually verified rather than asserted by a structural unit test. The ten-minute Quest resource check uses desktop Chrome remote devtools over ADB when available. Build includes typechecking; separate typecheck runs are diagnostic only.
