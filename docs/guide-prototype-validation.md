# Guide prototype validation

Date: 2026-11-11

## Implemented increment

Latest origin default branch was fast-forwarded into the avatar worktree at `84ab04e`. The existing viewer remains PlayCanvas 2.24.0 with the Ronda scene. Added a separate procedural guide root, provisional right-side route, sitting/standing pose blending, guide-only restart fade, one-shot sequence controls, speech media-time sampling/validation, positional audio wiring, and shared desktop/XR commands. Blender and Theatre.js remain candidate authoring tools.

## Automated evidence

Baseline: 35 tests passed before guide changes. Final: 51 tests passed across 11 files; TypeScript and Vite production build passed. The pre-existing engine bundle warning remains. New checks cover route completion after a supplied speech adapter ends, pause/stop transition settling, checkpoint Retry, late playback results, elapsed-time bounds, restart cancellation, cue revisions/timing/silence, autoplay recovery, media pause/buffering/mute, XR visibility events/cleanup, and readable paginated menu status.

## Browser evidence

Opened `http://localhost:5180/?guide=fixture` in a new Paradev browser pane. The scene reported synthetic-fixture readiness and rendered the mannequin/ground/pipe. The initial control overlay was narrowed so it does not cover the pipe. The fixture uses horizontal opening FOV to keep the +4 m start outside its initial view.

This pane did not deliver requestAnimationFrame callbacks during inspection, even while document.hidden was false. A direct probe remained pending while a timeout fired. Consequently, real-time visual animation is **not verified** here. By manually advancing the real PlayCanvas application's update loop through browser evaluation, the guide reached `failed · talk` at the pipe with the expected missing-content explanation, Stop during Restart returned `stopped · talk`, and Reload returned `ready · walk` with exactly one guide entity. Captured console output contained Vite/PlayCanvas informational logs and no reported application error.

An independent fresh-context code review found three Important defects. Regression tests reproduced each before fixes: ignored Stop during restart, missing event-based XR suspension handling, and absent readable headset failure explanation. All 51 tests passed after fixes.

## Still open

- Real-time animation and visual sit/stand quality in an actively rendering browser and headset.
- Licensed generic speech-capable GLB with required clips, a second compatible replacement, and the asset-loading/replacement path. The procedural mannequin is a diagnostic stand-in.
- Final supplied recording, checked transcript/captions, and offline viseme cues. No audio is bundled. The default sequence intentionally stops seated at that missing resource, so actual audible speech and the subsequent stand are not accepted end to end.
- Aligned collision geometry, validated route/pipe anchors, a collision-resolved movement adapter, stand clearance, and protected seating transitions. Current motion assumes flat, clear fixture ground and can pass through scanned geometry.
- Actual positional audio/browser unlocking, final facial mappings, XR controls/captions on Quest, splat occlusion, and performance budgets.

This is a runnable pose-prototype increment, not Phase 1 acceptance. No deployment or push was performed.
