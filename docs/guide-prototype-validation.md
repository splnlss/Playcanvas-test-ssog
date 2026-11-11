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

## Ronda pipe alignment after importing the new default view

Imported origin `7c06077` (Quest optimizations, WebGPU, camera bookmarks and the user-selected opening view), preserving the guide prototype through the merge. Prepared the 17 local SH0 metadata files with `npm run prepare:ronda`. Backend selection/labels, camera-copy controls, render scale and quality/foveation readouts remain available alongside paginated guide controls.

The saved opening camera looks approximately along +X. Native PlayCanvas depth picks across the visible pipe top returned, for example, `[-2.2994, 0.9981, -3.5537]` and `[-2.3117, 1.0026, -3.4082]`. The authored seat contact is `[-2.2, 1.02, -3.55]`, with a provisional floor of Y=0.25 and guide frame yaw=-90 degrees. The local +X entry therefore maps to world +Z (the viewer's right). The seated pelvis center is Y=1.13; its 0.11 m half-height puts its bottom at Y=1.02. The rigid placement is independent of both the camera and the splat content transform.

Inspected the mannequin seated on the actual scanned pipe from the saved default view and an angled inspection view. The latter confirms the bent thighs and seat contact rather than relying on the foreshortened frontal silhouette. [Default view](qa/screenshots/avatar-pipe-default.png) and [angled view](qa/screenshots/avatar-pipe-side.png) were captured with the HTML panel temporarily hidden for inspection. Reset restored the exact saved camera without restarting the guide. This static placement evidence used manually advanced application updates when the embedded pane withheld frame callbacks; it is not a real-time animation or hardware acceptance claim.

Scene placement lives in `src/guide/placement.ts`; `ronda` and `ronda-full` share it. The synthetic fixture retains its separate original camera/seat and uses a separate camera-bookmark scene ID. Unauthored scenes do not enable the guide. Ground/route clearance and production collision remain unverified. The missing audio package still leaves the sequence seated at the speech checkpoint.

Regression tests cover the actual pelvis contact height, route rotation/start, shared Ronda placement, unsupported-scene gating, and the unchanged fixture seat. Full suite: 62 tests passed in 15 files; TypeScript/production build passed with the existing engine-bundle size warning. Independent review found no Important or Critical alignment/merge regressions; its fixture bookmark overlap was corrected by isolating the fixture ID.

## Supplied 30-second speech excerpt

The user supplied `20261030_SLV-Joseph-Ronda.mp3` and requested its first 30 seconds. Bundled `public/guide/ronda-intro-30s.mp3` contains source seconds 0–30, re-encoded as mono 24 kHz MP3. FFprobe reports exactly 30.000000 seconds and 297839 bytes. The runtime fetches this local excerpt rather than the full remote recording.

Generated 10 automatic caption intervals locally with MLX Whisper and 152 offline mouth intervals with Rhubarb Lip Sync 1.14.0/pocketSphinx. Both are attached to the exact excerpt's SHA-256 in `src/guide/ronda-speech.json`. Captions are an unreviewed draft; Rhubarb shapes are simplified to the mannequin's diagnostic facial controls. Source/procedure/mapping are documented in `public/guide/README.md`, with the raw timing labels retained for future rig mapping.

New regressions failed before configuration, then passed: matching the bundled bytes to the cue revision and retaining the seated speech checkpoint until media completion, followed by standing/one-shot completion. Full suite: 64 tests passed in 16 files; TypeScript/production build passed with the existing engine-bundle warning.

In a new browser fixture pane, a trusted Start click resumed Web Audio (`AudioContext.state = running`). Actual HTML media reported duration 30, currentTime 0 and paused=false at start. At the end it reported currentTime=30, ended=true, paused=true, and the guide reported `completed · done`. Temporary native application ticks were used where the embedded pane withheld frame callbacks; the audio clock itself was not simulated. Final captions/facial weights were neutral. This verifies decode/playback/end sequencing, not human-reviewed caption accuracy, heard positional balance or Quest acceptance.

## Upper-left sunlight prototype

Added an owned warm directional light with ray direction `[0.7,-1,0.5]` in the guide's authored frame, rotated into world space by its scene placement. Only mannequin materials are relit; no global ambient or splat lighting settings are changed. Modest emissive fill preserves facial readability.

The ground shadow uses projected bounds of the articulated body parts, rasterized as one union mask and softened once on a 256×256 canvas. It uses actual current world transforms, follows walking/seating, respects guide fade/visibility, and releases its material/texture/entities on teardown. Mask uploads are capped at 30 Hz. It does not add a shadow-map pass or claim to receive shadows on the curved scanned pipe/wall/grass. Ronda uses a separate provisional shadow receiver at Y=0.42 (plus a 0.015 m surface bias) so grass above the original locomotion floor does not hide it; the avatar seat and route remain unchanged. The fixture uses its flat ground.

Projection regressions cover down-right direction in the opening view, rotation into Ronda world space, exact receiver contact, and points below the provisional ground. 68 tests and the production build pass, with the existing engine-bundle warning. Fixture inspection from an elevated viewpoint visibly confirmed the softened down-right silhouette and directional head/hand shading. Browser rendering inspection used manual application ticks when the embedded pane withheld frame callbacks; no Quest shadow performance measurement is claimed.

Independent read-only review found no Important shadow issues; it checked UV orientation, current articulated transforms, fixed light/projection direction, and resource teardown.
