# Remy Guide Implementation Plan

> **For agentic workers:** User approved execution on 2026-11-11 and selected Claude as the implementer. Claude uses executing-plans to work task-by-task; the coordinating agent handles browser/asset support and independent verification. Preserve the checks below and record rulings without asking for repeated implementation approval.

**Goal:** Replace the mannequin with Remy walking naturally to the real pipe, sitting, delivering the supplied 30-second excerpt with natural mouth movement, standing, and idling, with safe controls on desktop and Quest.

**Architecture:** Keep the existing sequence and audio-clock ownership. Add a validated content package, a guide-only Rapier movement adapter, and a PlayCanvas model/animation presentation. Export offline-authored body motion, facial shapes, and seat movement curves together; runtime movement applies travel once and animation reports actual transition completion.

**Tech Stack:** Existing TypeScript, PlayCanvas 2.24.0, Vite, Vitest, Blender 5.2.2 for local preparation; add exact `@dimforge/rapier3d-compat` 0.21.0 after the feasibility check in Task 3. Preserve the existing audio recording and native splat loader.

**Spec:** [Remy PRD](../../PRD-remy-guide.md), [shared avatar requirements](../../PRD-avatar.md), [Claude review and qualifications](../../PRD-remy-guide-claude-review.md).

## Global constraints

- Guide world position is independent of the visitor and scene scaling; preserve existing Orbit/Fly and XR navigation.
- Playback uses the existing 30.000-second audio excerpt at normal rate for acceptance. Stand only after successful audio completion.
- No facial rig currently exists. Author and inspect it; static lips or amplitude-driven jaw motion do not satisfy the speaking milestone.
- Initial preparation targets: 5,000–10,000 total triangles, 1–2 materials, textures at 1K or below where appearance allows. Preserve face/joint deformation quality and measure any exceptions.
- Required visual gates: natural walking and natural mouth movement on the final exported Remy in the actual scene, desktop and Quest.
- Performance gate: target 60 FPS on the named reference desktop and 72 FPS in a 72 Hz Quest session, or actual refresh T at higher rates. Across three complete settled-scene runs, mean application FPS ≥95% of target and p95 application frame time ≤110% of (1000/target) ms. Record over-budget frame share and fixed preset/backend/device.
- Required resources or collider validation failure disables the complete guide with an actionable reason; exploration remains available.
- Start is one-shot. Pause/Stop during a transition settle to supported poses; Restart fades only the guide. Scene disposal invalidates old loads and playback.
- Do not overwrite concurrent guide/audio work. Preserve the latest primary button, six-second lip-sync sample, timing calibration, and captions preference when integrating.

## Review focus

1. A reload/disposal during model or collision loading cannot attach old entities or leave a second voice. Task 6 tests both late success and late rejection.
2. A blocked segment or stand clearance must preserve support and show recovery. Tasks 3/4 test movement resolution and transition refusal.
3. Pause/Stop/Restart at animation boundaries must not advance checkpoints from stale clip completion. Task 4 tests completion identity and control precedence.
4. Short lip closures, cue gaps, delayed playback, and seeking must retain recognizable speech shapes without drifting from audio. Task 5 tests these cases from the raw cues.
5. Optimization/export can silently lose morphs, retargeting, transforms, or texture alpha. Task 2 validates the actual exported GLB and captures deformation evidence.

## Execution order and file ownership

| Task | Main files | Responsibility |
| --- | --- | --- |
| 0 | Existing guide tests; validation record | Establish an uncontested baseline. |
| 1 | `public/guide/remy/ronda-seat.json`, `ronda-collision.glb`, `docs/remy-scene-measurements.md` | Measured scene anchors, revision, and guide-area geometry. |
| 2 | `scripts/prepare-remy.py`, `scripts/validate-remy.mjs`, `public/guide/remy/` | Reproducible model/clip/morph export and content manifest. |
| 3 | `src/guide/collision.ts`, `tests/guide-collision.test.ts`, dependency files | Capsule movement and authored transition clearance. |
| 4 | `src/guide/body.ts`, `src/guide/animation.ts`, `src/guide/sequence.ts` | Clip-driven body actions and sequence integration. |
| 5 | `src/guide/remy-face.ts`, speech adapter and tests | Raw Rhubarb mapping, smooth mouth transitions, blinking, and calibration. |
| 6 | `src/guide/model.ts`, `presentation.ts`, `index.ts`, shared UI | Asset lifecycle, readiness, model presentation, shared controls. |
| 7 | `docs/remy-guide-validation.md`, README | Visual, integration, and device evidence. |

## Task 0: Baseline and isolation

**Observed:** This is already a linked worktree on `avatar-prd-document-f450bbf6`. Source/audio files have changed during the session. Do not create a nested worktree or reset those changes.

**Latest planning-time preflight:** On 2026-11-11, the initial lip-sync restart test failed while concurrent edits were in progress. After those edits, the focused guide tests passed (9/9), the complete suite passed (74/74 across 17 files), and `npm run build` passed with the existing large-engine-chunk warning. No runtime/test fixes were made by this planning task. Recheck the latest tree before execution; the troubleshooting steps below apply only if the failure returns.

- [ ] Read current diffs in files to be modified and capture the baseline revision/status in `docs/remy-guide-validation.md`.
- [ ] Run `npm test` and `npm run build` before implementation.
- [ ] Resolve the observed failing `starts a six second lip sync sample seated without walking and resets for normal Restart` test after checking the latest concurrent edits. The observed assertion receives `6` instead of `undefined`. The test currently waits for `talk` immediately after requesting Restart, while the pre-reset checkpoint can still be `talk`; trace the fade/reset before deciding whether the test or implementation is wrong.
- [ ] If that wait is the confirmed cause, wait for the restart to reach the new running/walk state before waiting for the new talk checkpoint. Keep the regression that normal playback has no six-second cutoff.
- [ ] Rerun the suite/build; record the exact result. Commit only intentional preflight changes, separately from the feature.

## Task 1: Measure the real guide area before fitting clips

**Files:** Create `docs/remy-scene-measurements.md`, `public/guide/remy/ronda-seat.json`, and `public/guide/remy/ronda-collision.glb`; modify `src/guide/placement.ts` only when replacing guesses with measured, recorded values.

**Produces:** A revisioned seat package in normalized world meters: floor/contact samples, pipe center/axis/radius/top, spawn, route points, approach/seated/stand anchors, capsule dimensions, slope/step limits, and collision source/transform. Anchors include orientation and support surface ID. Record measurement method, uncertainty, and screenshots.

- [ ] Inspect the actual Ronda scan from the saved camera and oblique views; use scene depth picks and an aligned reference mesh to measure the route floor, pipe, and free space. Resolve `origin.y=0.25` versus `shadowGroundY=0.42`; neither is measurement evidence by itself.
- [ ] Author a simplified static guide-area collision GLB in Blender with support surface IDs for floor and pipe, plus nearby obstacles. Tie its hash and transform to the Ronda source revision. Do not use an unrelated scene's collider.
- [ ] Validate coverage of the complete route, seated position, and stand clearance. Record a supported spawn and sufficient bounds for the entire guide capsule.
- [ ] Add validation tests in `tests/guide-content.test.ts`: reject nonfinite anchors, missing support IDs, mismatched scene/collision revisions, invalid capsule dimensions, and route points outside collider coverage. Run the tests red before implementing `validateGuideContent(content: GuideContent): string[]` in `src/guide/content.ts`.
- [ ] Run the tests green, verify geometry alignment visually, and commit the measurement package and evidence. Do not advance final clip fitting with guessed measurements.

## Task 2: Prepare a speech-capable Remy asset

**Files:** Create `scripts/prepare-remy.py`, `scripts/validate-remy.mjs`, `public/guide/remy/remy.glb`, `public/guide/remy/manifest.json`, `public/guide/remy/README.md`, and `tests/remy-asset.test.js`.

**Consumes:** Measured Task 1 seat package; local downloaded `Remy.fbx`, `Walking.fbx`, `Sitting.fbx`, and `Standing Idle.fbx`.

**Produces:** One self-contained rigged GLB and a `GuideContent` manifest: model hash/height/forward/feet offset, source records, bone/animation/morph mappings, clip timings/contact markers, walk distance per cycle, seat movement curves, and final mesh/material/texture statistics. Runtime assets use revisioned local URLs. Preserve editable authoring files outside the public folder and document their location.

- [ ] Inspect mouth topology/interior, hair transparency, deformed knees/elbows, and the imported skeleton at 1.75 m. Capture reference views before optimization.
- [ ] Acquire compatible seated idle, stand-up, and turn/stop clips through the existing signed-in Mixamo workflow, or author them locally when the catalog clips do not fit the measured pipe. Inspect every candidate on Remy before selecting it. Keep unsupported armrest poses out of the final sequence.
- [ ] Optimize and atlas the mesh before final shape authoring, retaining adequate vertices around lips, eyelids, shoulders, hips, and knees. Keep the face/eyes/mouth interior intact. Record actual exported costs against the preparation targets.
- [ ] Fit sit/stand motion to the measured seat. Extract net horizontal hip travel into time-sampled movement curves while preserving vertical weight transfer and pelvis sway. Export approach/seated/standing offsets and planted-foot markers with the clips. Inspect clip + curve together.
- [ ] Author eight speech morphs: `closed`, `teeth`, `open`, `wide`, `round`, `pucker`, `fv`, `tongueUp`, plus `blinkLeft` and `blinkRight`; neutral is zero speech weight. Add or repair the mouth interior, teeth, and tongue where required to produce those shapes. Review deformations, not just names.
- [ ] Export named clips `idle`, `walk`, `turn`, `sit`, `seated`, `stand`. A reviewed equivalent turn/stop blend can replace a dedicated `turn` track only when the manifest states its mapping and the foot-contact review passes. Reversal/held-pose candidates retain their PRD quality conditions.
- [ ] Write failing asset-validator tests using malformed minimal GLBs: missing morphs/skin/clip, duplicate mapping, external image URI, invalid height, NaN keyframes, and mismatched hashes must fail. Implement the validator and run those tests green.
- [ ] Run the same validator against the actual GLB. Reimport into Blender and inspect each clip/morph, texture alpha, axes, feet origin, and contact markers after export. Save evidence and commit the final asset/manifest/preparation tools. An inadequate face is a content failure to correct here, not a reason to silently ship a static mouth.

## Task 3: Guide-only movement and clearance

**Files:** Create `src/guide/collision.ts` and `tests/guide-collision.test.ts`; modify `package.json`/lockfile.

**Interface:** `createGuideCollision(content: GuideContent, geometry: CollisionGeometry): Promise<GuideCollision>` returns `move(feet: Vec3Tuple, delta: Vec3Tuple, dt: number): MoveResult`, `validateSpawn(feet): ClearanceResult`, `validateTransition(samples: BodyClearanceSample[]): ClearanceResult`, and `destroy()`. `MoveResult` contains resolved feet position, grounded state, and blocked reason. `ClearanceResult` contains `safe` and a useful reason.

- [ ] Install exact `@dimforge/rapier3d-compat@0.21.0` for a focused desktop/Quest WASM initialization and capsule-controller feasibility check. Use Rapier's kinematic character controller and shape queries; do not introduce a second PlayCanvas physics world or player-walking mode.
- [ ] Write tests against real Rapier geometry: supported spawn, wall sliding, thin obstacle under a large elapsed time, ground loss, excessive slope/step, invalid scene revision, and disposed world. Example contract: a wall before the destination yields `blocked=true` and a resolved position on the near side, never the requested far-side position.
- [ ] Implement capsule movement with gravity and fixed bounded substeps, applying only `computedMovement()`. Take capsule/ground/slope/step values from validated content, not hidden runtime defaults.
- [ ] Implement conservative body-volume checks over authored sit/stand paths. Rapier's character controller handles translation, not animated limb rotation: sample the authored body envelope and conservatively bound angular movement between samples. Permit only the named supporting pipe contact region; do not exclude the entire pipe or unrelated obstacles.
- [ ] Test an obstacle in stand clearance rejects the action while seated, and an obstacle beside the pipe rejects a sit sweep. Test that the supporting contact itself is accepted without accepting torso/pipe penetration.
- [ ] Run tests red/green, repeat the WASM/controller fixture on the target browser/headset, document compatibility, and commit. Failed feasibility is a documented blocker requiring a revised controller choice, not an unchecked fallback.

References checked during planning: [Rapier character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/) and [shape queries](https://www.rapier.rs/docs/user_guides/javascript/scene_queries/). Version 0.21.0 was returned by npm on 2026-11-11.

## Task 4: Clip-driven body actions and sequence checkpoints

**Files:** Create `src/guide/body.ts`, `src/guide/animation.ts`, `tests/guide-body.test.ts`; modify `src/guide/sequence.ts`, `src/guide/config.ts`, and `tests/guide.test.ts`.

**Interfaces:** `GuideBody` exposes `pose`, `begin(action: 'walk'|'align'|'sit'|'stand'): void`, `update(dt): { status: 'running'|'complete'|'blocked'; reason?: string }`, `reset(): void`, and `destroy(): void`. `createGuideSequence(speech, body?)` consumes this body; retain a procedural fixture adapter for existing diagnostic tests. The Remy adapter owns resolved travel, action time, animation selection, and supported endpoints. The sequence owns commands/checkpoints and audio start/end.

- [ ] Write failing tests with a controllable body adapter: talk starts only after sit completion; stand starts only after successful audio end; blocked walking/standing fails safely; late completion from a cancelled action cannot advance the new run.
- [ ] Add tests for Pause/Stop in every transition, Restart while settling, and Retry at the current safe checkpoint. Preserve the six-second diagnostic sample's explicit behavior without limiting normal 30-second speech.
- [ ] Implement body locomotion from Task 3's resolved distance, with smooth acceleration/deceleration, stride-phase matching, stable stance contacts, and authored alignment motion. Stop stepping when resolved distance is zero.
- [ ] Implement a public PlayCanvas `AnimComponent` state graph using the manifest's clip mappings. Blend body states, preserve local sway, and sample authored seat displacement through the movement adapter once. Use actual clip completion plus support readiness instead of `transitionSeconds=1.2` for Remy.
- [ ] Add deterministic body tests: paused movement preserves feet position; walking two distances samples matching stride phases; blocked motion produces no step progression; seat movement reaches the measured anchor exactly once; different clip durations change transition completion accordingly.
- [ ] Run focused tests and the full suite green. Inspect feet/turns/seat transfer with the exported GLB in the fixture and actual scan; correct clips/curves where needed. Commit the body/sequence increment with any visual acceptance still open stated explicitly.

## Task 5: Natural mouth movement and calibrated playback

**Files:** Create `src/guide/remy-face.ts`, `tests/remy-face.test.ts`; modify `src/guide/speech.ts` only at the shared playback/sampling seam; preserve existing timing controls and tests.

**Interface:** `sampleRemyFace(cues: RhubarbCue[], audioTime: number, active: boolean, lead: number): Record<string, number>` produces morph weights for Task 2's named channels. `createRemyFace(model, mappings)` applies those weights and eyelid controls without changing body tracks or the camera. Consume the existing speech snapshot's actual media time/status and configured mouth lead.

- [ ] Write tests using the bundled raw cue file: A→closed, B→teeth, C→open, D→wide, E→round, F→pucker, G→fv, H→tongueUp, X/gaps→rest. Reject invalid intervals or cues outside the content-bound audio duration.
- [ ] Test bounded neighboring-shape blending, preserved brief closed-lip cores, neutral silence, no mouth before playback begins, pause at the current audio pose, seeks in both directions, rate changes, muted playback, and neutralization on Stop/end/error.
- [ ] Implement media-time sampling with bounded onset/release windows, initially ≤40 ms per boundary and clipped to half the cue duration. Preserve the core of short closures and avoid smoothing across long silent gaps. These are tuning defaults to validate on Remy, not proof of naturalness.
- [ ] Apply morph controls by validated names and keep blinking/gaze from overwriting speech channels. Use restrained blink/head motion; no randomly repeated talking gesture loop.
- [ ] Preserve per-session timing adjustment and revalidate the current 0.10-second lead. Do not shift audio/captions. Bind raw cues and any regenerated package to the existing recording hash; human-review captions and speech distinctions against the exact excerpt.
- [ ] Run tests red/green and capture the entire audible excerpt frontally and at three-quarter angle. Review consonant closures, vowels, F/V contact, pauses, and timing at beginning/middle/end. Adjust shapes/cues/lead until that gate passes; commit the sampler and reviewed asset/cue revisions together.

## Task 6: Model ownership, readiness, and shared UI

**Files:** Create `src/guide/model.ts`, `tests/guide-model.test.ts`, `tests/guide-readiness.test.ts`; modify `src/guide/presentation.ts`, `src/guide/index.ts`, `src/main.ts`, and guide labels in `index.html` as needed. Reuse current XR menu actions/readout.

**Interface:** `loadGuideModel(app, content): { ready: Promise<LoadedGuideModel>; destroy(): void }`. The loaded model exposes root/head, body animation binding, facial mapping, and `destroy()`. `createGuide` reports explicit loading/ready/error status; Start is enabled only after model, facial/body mappings, collision/anchors, and speech content validate.

- [ ] Write failing lifecycle tests: destroy before load resolution, stale rejection after reload, partial model/collider failure, repeated Start, and repeated scene reload all leave at most one owned model/voice. Failed readiness must identify the missing resource/capability.
- [ ] Load PlayCanvas container assets with owned leases/disposal using the existing asset-store patterns. Instantiate Remy under an independent world root; keep scene scaling and visitor tracking out of its transform chain.
- [ ] Split reusable caption/fixture presentation from procedural body construction. Bind positional audio to Remy's head; preserve captions toggle, volume, mute, lip-sync calibration, and the current primary action behavior.
- [ ] Make Remy the configured guide after its content passes validation; keep the procedural mannequin available only as an explicitly selected diagnostic/recovery mode. Missing Remy content must not silently appear to be a completed Remy guide.
- [ ] Retain or adapt the existing projected shadow only if it remains valid for the skinned body. Do not project a stale T-pose bound as evidence of correct ground contact. Label any shadow limitation in validation rather than starting an unrelated shadow rewrite.
- [ ] Test readiness/error/Retry behavior on desktop and through the existing XR menu. Verify visibility suspension, scene reload, camera reset, and entry/exit preserve the required semantics.
- [ ] Run focused tests, the full suite, and `npm run build`; commit the integrated runtime with honest device/content acceptance status.

## Task 7: Review and acceptance evidence

**Files:** `docs/remy-guide-validation.md`, README, source/asset fixes identified by verification.

- [ ] Run `npm test` and `npm run build`. Record exact pass/fail counts and the existing engine bundle warning if present.
- [ ] Capture complete normal-speed walking/sitting/speaking/standing from front, side, and oblique views with feet visible. Capture the full audible 30 seconds in frontal and three-quarter face views. Use slow motion only to diagnose visible defects.
- [ ] Record separate walking-quality and mouth-quality verdicts. Correct sliding, frozen turns, loop hitches, poor weight transfer, lip flapping, gaps, or timing errors before marking those gates passed.
- [ ] Exercise blocked walking, unsafe stand clearance, playback rejection, repeated Start, Pause/Stop at each stage, Restart, Retry, seek/rate/replay, mute, visibility loss, reload, and five XR entry/exit cycles. Verify one guide and one voice remain.
- [ ] Name the reference desktop, manual quality preset, backend, headset model, actual refresh, framebuffer scale, and scene revision before measurement. Capture avatar-off/on frame timings over three complete settled-scene runs; evaluate the PRD's numerical gate and record over-budget share. Quest 3S observations do not imply Quest 3 results, or vice versa.
- [ ] Obtain an independent review of the implemented change and content validation evidence, resolve material findings, and record any remaining device/content blockers. No full milestone claim from a fixture, unit tests, or a desktop-only run.
- [ ] Update README with actual run/setup paths and supported content. Commit only intentional feature files and validation evidence; do not push/deploy without the corresponding request.

## Claude review disposition incorporated into planning

| Finding | Resolution in this plan |
| --- | --- |
| R1 collision prerequisites | Task 1 prepares the aligned guide-area mesh; Task 3 provides the guide capsule controller before Task 4 integration. Visitor walking is separate. |
| R2 measurements before clips | Task 1 explicitly precedes Task 2's final fitting and resolves the provisional floor references. |
| R3 seated/stand content | Required named outputs in Task 2, with reviewed dedicated clips as the starting choice. |
| R4 displacement/completion | Horizontal travel curves applied by one body adapter; retained vertical sway; clip/support-driven completion in Tasks 2/4. |
| R5 performance gate | PRD now states explicit FPS/frame-time gates and fixed test conditions; Task 7 measures them. |
| R6 development preview | Optional separate diagnostic mode; it cannot satisfy production readiness and is not a required new product flow. |
| R7 eyelids | Task 2 prepares left/right eyelid controls; Task 5 applies restrained blinks. |
| R8 face pipeline and vocabulary | Optimize before final morph authoring; preserve eight raw speech distinctions; validate current lead on Remy. |
| R9 turns | Manifest mapping plus visual gate requires extra turn/stop motion when walk/idle blending fails. |
| R10 inherited speech/shadow scope | Task 7 retains seek/rate/replay checks; Task 6 reuses the shadow only where valid and does not require a new implementation. |

## Self-review and handoff

Coverage checked against every Remy PRD section: source/facial readiness (Tasks 1/2/6), natural body sequence (Tasks 2/3/4/7), natural mouth/audio (Tasks 2/5/7), controls/lifecycle (Tasks 4/6/7), and rendering/device cost (Tasks 2/6/7). Each review-focus risk has owning tests. Actual scene measurements, final authored assets, and device evidence are deliverables to produce, not assumed existing inputs.

Recommended execution: **native in this session**, because scene measurements, clip fitting, collision, and facial work share one content package and need sequential visual iteration. A separate reviewer should inspect the final implementation. Alternative: subagent-driven execution after content preparation; independent implementation tasks can then be delegated with fixed interfaces.

**Approved:** user reviewed the handoff and instructed: "Proceed but have claude build it." Claude is the selected implementer; proceed with the task sequence and verification.
