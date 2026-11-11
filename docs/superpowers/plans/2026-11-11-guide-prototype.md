# Guide Prototype Implementation Plan

> **For agentic workers:** Use executing-plans to implement these tasks inline. The user explicitly requested implementation on 2026-11-11.

**Goal:** Add a runnable, clearly labeled guide pose prototype with the right-side route, safe sequence controls, and an optional audio-clock speech path.

**Architecture:** A renderer-independent sequence owns prototype pose and checkpoints. A speech adapter owns playback and samples media time. A PlayCanvas presentation renders a temporary articulated mannequin and bridges shared desktop/XR commands. This increment does not implement production collision or replaceable GLBs.

**Tech Stack:** Existing TypeScript, PlayCanvas 2.24.0, Vite, Vitest; browser media/Web Audio. No new production dependencies.

**Spec:** `docs/superpowers/specs/2026-11-11-avatar-guide-design.md`

## Global Constraints

- Guide root is independent of player and scaled scene content.
- Start at [4, 0, 1.5], approach through [2, 0, 1.5], [0, 0, 1.5], [0, 0, 0.6]; face +Z before sitting.
- Prototype values remain visibly provisional. Synthetic ground/pipe verification does not establish scanned-scene collision safety.
- Missing speech fails at the seated checkpoint with an explanation; do not silently skip it.
- Audio media time drives captions and mouth cues; stopped/error/ended playback releases facial channels.
- Stop settles transitions; Restart fades the guide, not the camera. Reload disposes the guide. Camera reset leaves it alone.

## Review Focus

- Repeated Start and asynchronous playback completion cannot create duplicate or stale runs (Tasks 1/2).
- Stop during sitting and Pause during standing finish to supported poses (Task 1).
- Frame stalls and nonfinite elapsed time cannot teleport or corrupt a pose (Task 1).
- Pause/buffering/seek/rate/mute sample the audio position without a second speech timer (Task 2).
- Reload/disposal invalidates listeners/audio and resets ready without auto-start; XR commands use the same controller (Task 3).

## Task 1: Sequence and provisional fixture

Files: create `src/guide/sequence.ts`, `src/guide/config.ts`, `tests/guide.test.ts`.

Interfaces: `createGuideSequence(speech: GuideSpeech)` exposes state, checkpoint, pose, error, update(dt), start(), pause(), resume(), stop(), restart(), retry(), destroy(). Speech exposes play(): Promise<void>, pause(), stop(), update(), snapshot, destroy(). Pose holds feet position, yaw (degrees, +Z forward), seated blend, walk distance, opacity.

- [x] Write tests for one-shot route completion into sitting, transition settling, control precedence, Retry at the speech checkpoint, stale completions, and bad/frame-stall elapsed time.
- [x] Run `npm test -- tests/guide.test.ts`; confirm missing implementation fails.
- [x] Implement one serial checkpoint machine with bounded dt, stopped root motion, and Restart fade. Prototype movement assumes the clear synthetic fixture; no production collision claim.
- [x] Run focused tests, then suite; record results.

## Task 2: Audio and content validation

Files: create `src/guide/speech.ts`, `tests/guide-speech.test.ts`.

Interfaces: `SpeechPackage` has audio URL/revision, matching cue revision, caption intervals, and canonical A/E/O/M/neutral viseme intervals. `sampleSpeech(package, time, active)` returns caption and facial weights. `createGuideSpeech(package?, media?)` implements the Task 1 interface and reports blocked playback distinctly from failed/missing assets.

- [x] Write tests for invalid revisions/timings, silence, seeks, neutralization, and old play promises after stop/disposal.
- [x] Run focused tests and confirm failure before implementation.
- [x] Implement media-time sampling, optional positional Web Audio graph, and listener/head attachment updates; AudioContext must be unlocked from the user interaction without prematurely playing speech.
- [x] Run focused tests and suite.

## Task 3: Runnable PlayCanvas preview

Files: create `src/guide/presentation.ts`, `src/guide/index.ts`; modify `src/main.ts`, `src/xr.ts`, `src/vr-menu.ts`, `index.html`, `src/style.css`, `README.md`.

Interfaces: `createGuide(viewer)` exposes shared actions, status, caption, reset(), destroy(), setEnabled(). `createXr` accepts optional extra menu actions/readout. A `?guide=fixture` mode renders the synthetic plane/pipe without waiting for remote splats; normal scene loading retains its existing readiness gate.

- [x] Render an articulated mannequin with shared owned materials, simple in-place walking, seated/standing transitions, distinct speech mouth shapes, and guide-only fade.
- [x] Wire Start/Pause/Resume/Stop/Restart/Retry, captions, mute/volume, and audio recovery into desktop and the existing XR panel. Paginate the XR panel to at most six action rows and reserve a wrapped guide-status area.
- [x] Recreate guide state on reload; pause when document/XR visibility is lost; dispose before viewer teardown.
- [x] Run tests, typecheck/build, and browser fixture smoke check if a browser is available. Record exactly what remains unverified.
- [x] Request an independent review; fix important findings and document content/device acceptance still open.

## Execution record

- Pulled origin default branch `import-agent-skills-3b8f6a18` by fast-forward to `84ab04e`; local avatar documents preserved.
- Baseline: 35 tests passed; production build passed with the existing large-chunk warning.
- Ruling: implement the authorized prototype increment inline; final rig/audio/collision and hardware acceptance remain a later content integration step, because those inputs are absent. Cost if wrong: preview poses require adjustment to the real rig/scene.

- Task 1: completed; six sequence tests passed after implementation. Prototype movement is explicitly unconstrained fixture movement, not production collision.
- Task 2: completed; six speech tests passed, covering actual playback-time sampling, invalid content, autoplay recovery, stale playback, and missing recording.
- Task 3: completed; full suite 51/51 and production build passed. The existing engine-bundle chunk warning remains. Browser fixture rendered; engine updates driven manually verified the seated missing-content failure, Stop during restart, and reload with exactly one guide. Real-time animation in this pane was not established: a direct requestAnimationFrame probe remained pending.
- Ruling: XR controls use pages of five actions plus a More controls row rather than an unbounded tall panel. This preserves readable hit targets; cost if wrong: extra page selections.
- Final review (fresh agent): three Important findings, all addressed with failing regression tests before fixes.
- Final: fixed ignored Stop during Restart — `honors Stop during a Restart fade without starting another walk` RED→GREEN.
- Final: fixed XR visibility suspension — `pauses on XR visibility events even without a frame update and removes both listeners` RED→GREEN.
- Final: fixed hidden headset failure explanation — `keeps guide failures readable above XR buttons and includes the recovery instruction` RED→GREEN.
- No deferred minor findings. Production rig, collision, final speech/cues, Quest checks and real-scene acceptance remain outside this initial prototype increment.
