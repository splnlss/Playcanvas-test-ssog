# Phase 1 scripted guide — proposed integration design

Date: 2026-11-11  
Status: Initial prototype implementation authorized and started on 2026-11-11; full milestone acceptance pending  
Requirements: [Avatar PRD](../../PRD-avatar.md)

## Intent and confirmed starting state

Deliver one independent guide that walks an authored route to the pipe, sits, speaks supplied recorded lines with captions and timed visemes, stands when safe, and idles. Desktop and Quest 3 visitors remain free to explore. Audio and lip sync belong to this first milestone, before video-derived appearance.

The user asked to begin while the PlayCanvas viewer prototype is still being completed. At the initial inspection, this worktree contained agent skills and configuration, with no application, package manifest, pinned engine, collision implementation, or avatar assets. The latest viewer was subsequently fast-forwarded from origin to `84ab04e`, bringing TypeScript, Vite, Vitest, and PlayCanvas 2.24.0; real collision and avatar assets remain absent. The requirements were copied unchanged from the sibling `import-these-files-3b8f6a18` worktree. Their linked viewer and walking documents are now also present locally after the viewer update.

This proposal prepares the avatar subsystem without adding requirements to the viewer prototype's release gate. The initial runtime increment is an explicitly labeled procedural pose preview with synthetic-fixture mode; it does not satisfy the production guide acceptance criteria.

## Approach and alternatives

Recommended: a small sequence controller with explicit adapters for movement, character animation, speech, and presentation. Keep control logic independent of PlayCanvas entities so cancellation, checkpoints, and playback behavior can be checked without a headset. Implement adapters against the completed viewer's pinned engine and lifecycle, rather than inventing its APIs now.

A single engine script would be quicker initially but would mix root movement, animation transitions, audio waiting, and scene teardown. A general behavior tree or avatar framework would introduce authoring and runtime machinery that the one prepared sequence does not need. Neither is proposed.

## Ownership and integration

- The viewer owns scene loading, its player/cameras, XR lifecycle, manual quality, and the application update loop.
- The guide owns a separate world-space root, avatar resources, one sequence, body animation, speech, and guide controls. Its root is a sibling of scene content and player roots; scene scaling never scales the guide.
- The movement adapter is the sole authority for the guide root. It uses the validated collision controller, actual resolved displacement, and authored route readiness. Animation clips are in-place; any authored seating displacement is applied once through this authority.
- Facial animation writes only configured speech channels. Body animation and bounded gaze keep their own channels; neither rewrites mouth shapes.
- Scene replacement or teardown invalidates the guide session before disposing resources. Async completions from an old session cannot attach entities, move the root, or restart audio.

Use explicit initialization, update, and disposal calls at the viewer's existing lifecycle seams. Do not create a plugin registry, second rendering loop, or second player controller. Viewer reset affects the guide only if it actually reloads/replaces the scene; resetting a camera alone does not restart the guide.

## Content contract

Keep reusable avatar settings separate from scene-specific guide settings. Validate all required content before enabling Start.

| Content | Required data and validation |
| --- | --- |
| Avatar | Model URL/revision, license/attribution, height in meters, orientation and feet offsets, documented reference rig/rest pose, bone mapping, idle/walk/sit-down/seated/stand-up mappings, and supported facial channel mappings. Missing required clips or visemes fail validation. |
| Scene guide | Scene/collision revision association, validated starting pose and capsule dimensions, authored route, pipe approach/seated/standing poses, seat height, and stand clearance. Use normalized world meters and an explicit transform convention matching the viewer. |
| Speech | Final audio URL/revision, checked transcript, caption intervals, ordered time-aligned viseme intervals and weights, facial mappings, volume, and positional range. Cue times use seconds of audio media time. |

Tie timing data to a content-addressed audio revision (or a verified content hash in the asset preparation step). A changed recording requires regenerated or revalidated cues. Validate finite ordered times, audio duration coverage, supported mouth mappings, and caption text before playback. Reject incompatible resources with a concise error; never substitute jaw amplitude for accepted lip sync.

The first route is authored and collision-validated. It does not require a runtime navmesh system. Route points alone are insufficient evidence: verify traversable segments, coverage readiness, capsule clearance, and blocked-motion recovery with the chosen controller. Sitting poses and clips must be prepared together for the selected rig and pipe geometry.

### Authoring options recorded for later

User direction, 2026-11-11: retain **Blender** and **Theatre.js** as future authoring candidates; use a best-guess route for prototyping now. Tool selection and a route-authoring UI are not prerequisites for the prototype.

- **Blender:** author route curves, named approach/seat/stand anchors, and animation alignment against an aligned reference mesh. A small exporter would sample the curve into route points and export anchors in the agreed coordinate frame. Blender's [Follow Path constraint](https://docs.blender.org/manual/en/5.0/animation/constraints/relationship/follow_path.html) can preview travel along a curve; importing the editable route into the viewer would be our integration work.
- **Theatre.js:** consider a visual timeline inside the browser for timing and presentation. It supports [sequences](https://www.theatrejs.com/docs/latest/manual/sequences) and [audio synchronization](https://www.theatrejs.com/docs/latest/manual/audio). Connecting timeline intent to guide actions, collision, and the authoritative speech clock requires an adapter; do not let its timeline independently overwrite the guide root or advance blocked actions.

Neither workflow has been tested with this viewer. Keep prototype route data independent of these tools so either can supply it later.

### Provisional route for prototyping

Use the following hand-authored fixture until the actual pipe and collision geometry are available. These are deliberate guesses, not measurements of the scanned scene. They allow movement, turn, sitting, speech, and controls to be prototyped without waiting for an authoring tool.

Define a right-handed, Y-up fixture frame in meters. Its origin is the floor directly beneath the pipe seat contact; the pipe runs along X, and +Z points out toward the open approach area. The opening viewpoint looks toward the pipe from +Z, making +X the viewer's right. Positions below are feet-level unless explicitly marked as a seat contact. Apply one rigid fixture-to-world translation/yaw transform to all route points and anchors when aligning it to the real scene; do not parent the guide to the scaled splat root. Start with an identity transform in a synthetic test scene.

User direction: start 4 m to the right, outside the opening view, then approach, turn, and sit. Interpret 4 m as a lateral offset from the approach centerline, not total walking distance. Check the opening camera framing to keep this start offscreen; the lateral offset alone cannot guarantee that. This describes the initial composition only: the viewer remains free to turn and see the guide, and the route never follows subsequent camera motion.

| Marker | Position [x, y, z], meters | Purpose |
| --- | --- | --- |
| Start | [4.0, 0.0, 1.5] | Initial feet pose, outside the opening view to the right, facing -X toward the first waypoint. |
| Waypoint 1 | [2.0, 0.0, 1.5] | Enter from the right along the open approach area. |
| Waypoint 2 | [0.0, 0.0, 1.5] | Reach the approach centerline and head toward the pipe. |
| Approach / stand / final idle | [0.0, 0.0, 0.6] | Stop walking, turn to face +Z, sit backward toward the pipe; return here after standing. |
| Seat contact | [0.0, 0.6, 0.0] | Assumed pipe top under the pelvis; this is not a feet/root position. Derive the seated root offset from the selected rig and clip. |

For the synthetic fixture, assume flat ground and a stationary pipe with radius 0.3 m, center height 0.3 m, and length 3 m along X. Leave the route and front stand area clear. Start with walking speed 0.8 m/s, waypoint arrival tolerance 0.1 m, turn speed capped at 120 degrees/s, and a standing capsule radius 0.3 m / total height 1.75 m. These are editable prototype values, not device-tested movement or asset budgets. Clamp travel to each remaining segment distance; hitting a waypoint tolerance must not cause a positional snap through geometry.

Walk through the points in order, using actual resolved movement to drive the walk animation. At approach, stop, align facing +Z, then play the compatible sit transition. After speech, check standing clearance, stand into the same approach pose, and remain idle facing +Z. Choose a sit/stand clip compatible with the assumed 0.6 m seat or revise that height; do not force a rig to match by treating the seat contact as its root. Validate the transition sweep against unrelated geometry; this fixture does not authorize disabling collision globally.

Expose this only as an explicitly selected prototype fixture. Revalidate each route segment with the selected capsule/controller; blocked or unsupported motion fails safely rather than passing through obstacles. Before using the scanned scene, align the fixture, inspect every segment and seat transition, and replace guessed coordinates with measured anchors. Passing the fixture exercises control behavior only and does not satisfy real-scene route, sitting, collision, or Quest acceptance.

## Sequence and controls

Use one explicit checkpoint list: start → walk to approach → align/sit → seated speech → stand → final standing idle. A checkpoint advances only after its action succeeds. Body transitions report their final stable pose; speech reports completion only after playback ends successfully.

Track lifecycle (loading, ready, running, pausing, paused, stopping, stopped, failed, completed, disposed), current checkpoint, stable body pose, and a session/action cancellation identity. Do not let every combination become an independent animation state. Start is accepted only from ready; completion is one-shot. From stopped or completed, use Restart. From failed, Retry is available only when safe continuation can be established.

| Control/event | Required result |
| --- | --- |
| Start | Claim the single run immediately and unlock sound in the user gesture before asynchronous walking begins. Duplicate activation has no effect. |
| Pause | Freeze walking and speech. If sitting/standing is underway, finish to a supported pose before marking paused. Preserve the next checkpoint and media position; idle breathing and bounded gaze may continue. |
| Resume | Continue the preserved action/next checkpoint and media position. A rejected audio resume waits for an explicit enable-audio gesture. |
| Stop | Cancel pending work, halt movement, stop speech, and neutralize facial channels. Finish a body transition to a stable supported pose; preserve location and do not force a seated guide to stand. |
| Restart | Cancel and settle the old action, fade only the guide, restore the validated spawn and speech state, fade in, and start one run. Revalidate spawn before placement; a failed validation leaves the guide safely stopped with an explanation. |
| Retry | Revalidate the failed action and restart it from its recorded safe checkpoint/current pose. Do not replay successful walking or sitting. Reuse the recorded speech position for a playback failure when safe; otherwise require Restart. |
| Scene teardown | Invalidate immediately, stop audio/movement, release listeners and assets, and remove entities. Completing a visible pose transition is unnecessary when removing the guide. |

Serialize control changes. If Stop or Restart arrives during a pause transition, retain the final requested operation and settle the same transition once. A new session invalidates all previous completions. Failure during movement leaves the guide at the last collision-valid pose; blocked stand clearance leaves it seated.

## Speech, captions, and audio permission

The playback adapter exposes actual media position, playing/waiting/paused/ended/error state, duration, rate, and controls. The exact media/Web Audio/PlayCanvas implementation is selected only after verifying positional routing and playback-clock behavior against the pinned engine on Quest 3.

On each update, sample the actual audio position to select and blend visemes and captions. Seek, rate changes, buffering, pause, replay, and mute all use this same position; never accumulate a separate speech timer. During pause preserve the facial pose at that position. During buffering freeze at the current position without advancing cues. Before audible playback starts, hold neutral. Stop/end/error/cancellation releases facial ownership and blends to neutral. Muting changes gain only: captions and mouth animation continue.

Attach positional voice to the guide's head with configurable range. Desktop and XR controls invoke the same commands. Use the viewer's world-space XR interface patterns; HTML-only controls do not satisfy headset acceptance. If sound remains blocked after the initial gesture, hold the speech checkpoint and show Enable audio instead of silently advancing.

Caption intervals and the checked transcript must agree. Cue generation is an offline content-preparation step using the finalized audio. Select its tool after the audio language, license, and processing constraints are known; no cloud processing service or TTS provider is assumed.

## Failure and lifecycle behavior

Avatar/content failure leaves exploration available. Errors identify the failed resource/action and offer Retry or Restart as appropriate. No automatic retry loop, skipped action, duplicate voice, or hidden collision bypass is permitted.

Avatar replacement is configuration plus page reload for Phase 1. Verify a second compatible asset, including sitting and facial mappings. Clean up stale loads and partial failures. VR entry/exit and camera mode changes do not move or restart the guide. Browser visibility and XR suspension behavior must be checked with the actual audio path so resumption cannot advance sequence checkpoints without successful playback.

## Delivery boundaries

1. Review this integration design, then write the implementation plan against the available viewer checkout. That plan must pin actual file seams and the engine version rather than assume a new app scaffold.
2. Prepare/validate the reference rig, final speech package, matching collision mesh, authored route, and pipe poses. Content work can proceed while the viewer is completed.
3. Implement and verify the sequence/control logic and content validation, then attach real movement, animation, positional audio, facial, and interface adapters.
4. Verify the full pipe sequence in the streamed scene on desktop and Quest 3, including replacement, occlusion, lifecycle, and performance.

Do not add viewer body, full body IK, third-person controls, video reconstruction, interactive dialogue, or a generic authoring editor to this milestone. Guide movement requires validated collision; it does not require exposing a viewer Walk mode.

## Verification and release evidence

Automated behavior checks should exercise duplicate Start, control races, transition settling, stale completions, checkpoint Retry, invalid content, and cleanup. Speech checks should vary actual playback position/state to verify seek, rate, buffering, mute, pause, and neutralization. These checks verify logic; they do not prove audible or visual quality.

Manual desktop and Quest checks must show the real licensed character completing the real pipe sequence with audible positional speech, captions, offline visemes, safe collision, and all controls. Exercise blocked routes, unsafe standing, failed playback, scene reloads, camera changes, XR entry/exit, and a second compatible GLB. Check avatar occlusion from both sides of scanned surfaces at multiple splat quality levels.

Record avatar-off/on measurements over the same route after streaming settles: device/browser, engine, refresh target, manual quality/splat budget, FPS/frame time, and mesh/material/texture costs. Set numeric avatar budgets from those measurements before release. Missing scene assets, final audio/cues, or headset evidence keeps milestone acceptance open; synthetic fixtures may validate control logic only.

## Inputs needed for the implementation plan

- The finished or sufficiently stable viewer checkout, pinned engine, lifecycle entry points, and desktop/XR UI patterns.
- The selected scene and its revision, aligned collision geometry, route, pipe anchors, and clearance measurements.
- A licensed reference rig with required clips/facial controls, plus a second compatible replacement asset.
- Final speech audio, checked transcript, captions, and matching offline viseme cues.
- Access to Quest 3 for collision, positional audio, rendering, and performance acceptance.

These are explicit integration/content inputs, not completed selections. Engine feasibility and device performance remain unverified.
