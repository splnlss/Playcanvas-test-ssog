# Scripted avatar guide and future video customization

Status: Requirements agreed; initial procedural guide prototype implemented — Phase 1 acceptance pending  
Date: 2026-11-11  
Updated: 2026-11-11 — agreed pipe sequence, independent guide, playback controls, and timed mouth shapes  
Related: [Viewer PRD](PRD.md), [walking and collision follow-up](walking-and-avatars.md)

## Purpose

Add an independent scripted guide inside the large streamed Gaussian splat scene. The first milestone uses a generic rigged character: walk to the pipe, sit on it, deliver supplied recorded lines with synchronized mouth movements, stand up, and remain idle nearby. Support desktop and Meta Quest 3, with a clear path to replacing the guide's appearance with a likeness created from video recordings.

Deliver this as a follow-up to the viewer prototype. Establish reliable movement and collision before adding full body inverse kinematics (IK). Add desktop third-person controls in a later phase.

The guide has its own position and behavior, separate from the viewer's navigation and tracked poses. A body representing the viewer is a separate later feature. Audio playback drives timed mouth shapes from the first speaking milestone.

## Interpretation of video customization

Video recordings are intended primarily to personalize the person's appearance. Recorded motion is a separate optional extension. Neither requires video processing in the first avatar release.

The runtime asset is a rigged GLB character. A future offline workflow may reconstruct or model a likeness from recordings, then clean, rig, optimize, and export it to that format. The PRD does not assume arbitrary phone footage can automatically produce a production-ready avatar.

A volumetric video of a person is a different asset: it replays captured movement. It does not fulfill the requirement for a freely controllable, replaceable character. Selecting a reconstruction or motion-capture service belongs to the customization phase after a representative recording has been evaluated.

## Users and success

- Visitors explicitly start a guide and watch it walk to the pipe, sit, speak, stand, and idle while they remain free to explore.
- The scene publisher can replace the default avatar through configuration, without editing camera, collision, or splat-loading code.
- A later creator can prepare a personalized avatar from recordings and validate it against the same asset requirements.
- A scene author prepares one verified walking route and the pipe sitting pose, and supplies the final voice recording with a provided or checked transcript.

Success means the complete pipe sequence works on desktop and Quest 3 with reliable collision, seat alignment, playback-driven mouth shapes, captions, and recovery controls. The guide remains correctly scaled when scenes change and leaves sufficient performance for streamed splats. Full body IK and third-person controls have independent later acceptance gates.

## Delivery phases

| Phase | Deliverable | Prerequisite |
| --- | --- | --- |
| 1 | Generic replaceable guide, validated route/collision, pipe sitting transitions, supplied speech, timed mouth shapes, captions, and playback controls | Working viewer; prepared route, pipe poses, compatible GLB/clips, final audio, transcript, and mouth cues |
| 2 | Optional viewer body and grounded player animation | Separate viewer body work; walking/collision acceptance from the existing follow-up plan |
| 3 | Full body IK in VR; optional guide alignment improvements | Movement/collision verified; viewer body required for tracked self-avatar IK |
| 4 | Desktop third-person controller and following camera | Stable grounded movement; reuse the same collision and animation state |
| Separate follow-up | Video-derived appearance; optionally recorded motion | Stable avatar asset requirements and an evaluated sample recording |
| Separate follow-up | Additional guide routes, seats, and speech sequences | First pipe sequence accepted |

The first guide milestone includes validated guide movement/collision before the complete sequence is released. It does not require shipping a viewer-controlled Walk mode. Video customization can proceed independently once the asset requirements are stable; it is not a dependency for IK or third-person controls.

Use authored sitting and standing clips matched to the pipe height before full body IK is available; IK may later improve foot and seat alignment. The guide does not depend on a viewer body, desktop third-person camera controls, or video-derived appearance.

## Phase 1: independent guide milestone

### Presentation

- Ship one reusable, licensed generic humanoid GLB with a skeleton, idle/walk/sit-down/seated/stand-up clips, and mapped speech mouth shapes. Preserve attribution.
- Give the guide its own body root and configured world-space starting pose. Keep avatar scale independent from the splat content transform.
- Keep the guide fully visible in desktop and VR. Existing Orbit/Fly and VR navigation remain independent from guide movement; the viewer may explore while the sequence continues.
- Do not apply local first-person head/body hiding to the guide. Viewer body rendering is deferred; existing controller representations remain separate.
- Provide Start guide, Pause/Resume, Stop, Restart, captions, volume/mute, and useful Retry/error feedback. Restore the default asset through configuration.
- Camera mode changes and tracked viewer motion must not reposition the guide or restart its sequence.

### Configuration and asset requirements

Store avatar configuration separately from scene descriptors. Include the model URL, asset revision, attribution, physical height, model orientation correction, feet/root offset, bone mapping, animation mapping, and presentation settings. Page reload is sufficient for replacement in the first release.

Require a documented humanoid bone hierarchy, a documented rest pose, feet-level placement after applying the configured offset, and transforms normalized to world meters. The initial asset establishes the reference rig and records its bone names. An asset with another skeleton must be retargeted offline or have an explicitly supported mapping; matching file extensions alone is insufficient.

Require compatible sitting/standing transitions and facial morph targets or rig controls mapped to timed viseme shapes. A viseme represents the visible mouth shape of a speech sound. Validate these capabilities before starting the sequence, including replacement with a video-derived likeness; a jaw-only asset does not satisfy the first speaking milestone.

Apply height and alignment when loading the asset. Appearance customization must not silently change collision capsule dimensions. Body size changes that require different clearance are validated through walking configuration.

Load avatar assets independently from splat assets. A failed avatar load shows a concise notice and allows viewing to continue without the avatar. Ignore stale load completions and dispose avatar resources on replacement or teardown. Scene reloads must not duplicate the player or avatar.

## Movement and collision prerequisites; later viewer body

Use the walking and collision behavior defined in [the existing follow-up](walking-and-avatars.md): aligned offline collision geometry, safe spawn, capsule movement, gravity, wall sliding, explicit slope/step limits, and VR obstruction handling.

Drive idle/walk animation from resolved horizontal movement, not just scripted intent or held keys. Distinguish grounded, airborne, and Fly states so blocked movement does not keep the avatar walking in place. Blend animation changes and orient the body from movement heading without inheriting camera pitch or roll. Start with in-place clips; movement remains owned by the controller.

Collision must remain stable while splat chunks load, unload, or change detail. For a scene with segmented collision coverage, make an area walkable only after its collision data is ready. For a small initial walking area, loading its complete simplified collision mesh is acceptable. Do not implement a new collision streaming system merely to match visual streaming.

An absent or invalid collider disables Walk with an explanation. A hidden avatar or a failed animation must never bypass collision. Reset and scene replacement clear locomotion state and place the body at a validated spawn.

## Phase 3: full body IK

Add IK only after movement and collision pass their acceptance checks on the actual target headset. Choose the solver through a focused feasibility check using the default rig; no IK dependency is selected by this PRD.

- Use tracked head and controller poses as targets relative to the authoritative player origin.
- Estimate torso, pelvis, elbows, knees, and legs from those targets, locomotion state, and ground contacts. Headset and two controllers do not provide measured full body tracking.
- Add height calibration, arm reach limits, stable bend directions, and controlled foot placement on validated collision surfaces.
- Ground feet during supported standing/walking. Release planting during falling and Fly; avoid stretching limbs to preserve a planted foot.
- Keep the local head hidden, make the body visible below the viewpoint, and prevent obvious torso clipping during ordinary looking and turning.
- On controller tracking loss, blend the affected arm to a rest pose. On session loss, stop consuming stale XR targets; recalibrate or restore presentation when tracking resumes.
- IK adjusts visual bones only. It must not move the tracked camera, change player locomotion, or resolve collision.

Treat physical head penetration of virtual walls using the walking phase's obstruction behavior. A solved body does not constrain the visitor's real body.

## Phase 4: third-person controller later

Add a desktop Third-person mode with a following camera, camera-relative movement, body rotation, and animations driven by the existing walking controller. Evaluate the PlayCanvas third-person controller as a starting point when this phase begins; verify its compatibility with the selected engine and physics setup.

Keep one authority for player movement. Reuse the validated collision path instead of stacking another movement controller over it. Camera obstruction tests use collision geometry and bring the camera closer when walls intervene. Verify narrow spaces, corners, ceilings, and recovery to the normal follow distance.

Mode changes clear held inputs and preserve a valid player position. Entering walking from an unsupported Fly location uses the validated safe spawn. VR continues to use the tracked first-person camera; a following camera is not introduced into VR by this phase.

## Future customization from recordings

Prepare assets outside the viewer through this workflow:

1. Obtain permission to use the person's recordings and define where source footage may be processed and retained.
2. Evaluate a representative recording for useful views, lighting, occlusion, and reconstruction quality. Establish capture instructions from that result before requesting a full recording session.
3. Create the likeness, then clean topology/materials, rig it, normalize scale, and export a GLB compatible with the reference rig or supported mapping.
4. Optimize mesh, materials, textures, and skeleton against measured desktop and Quest budgets.
5. Validate idle/walk animation and, when available, IK. Replace the configured model and retain the default avatar as recovery.

If recorded motion is requested, extract and retarget it offline into separate animation clips. Review foot sliding, scale, joint limits, and root movement. Imported clips must follow the controller's movement ownership rules. Do not assume appearance reconstruction also supplies animation.

An upload screen, in-browser reconstruction, live video capture, automatic rigging, likeness editor, and runtime retargeting are outside the basic release. Video customization requires its own evaluated asset pipeline before implementation is scheduled.

## Scripted guide behavior — first milestone

### Behavior and ownership

Allow a scene author to script actions equivalent to `walkTo(destination)`, `sit(seatId)`, `stand()`, `talk(audioId)`, and `stop()`. These names describe the intended authoring capability, not a required implementation API. Each action reports completion, cancellation, or a useful failure so a script can sequence behavior and recover.

Use a separate guide instance with its own body origin, locomotion state, and animation state. Reuse validated movement/collision behavior and avatar rendering where appropriate. The guide must not consume the viewer's tracked head/controller poses, move the viewer's camera, or inherit local first-person visibility rules. Its face and body remain visible to the viewer.

Walking and sitting are mutually exclusive body actions. Speech may run while idle, walking, or seated, with mouth animation layered over body animation. A new conflicting body action cancels or explicitly sequences after the current action; do not let animation, scripts, and physics independently write the guide's root transform.

### Walking and sitting

- Walk to a configured world-space destination using validated navigable paths and collision. Prepare a navmesh or authored walkable routes for the first guide scene; a straight-line move through scanned furniture does not satisfy this feature.
- Move only through areas with ready collision/navigation data. Report unreachable or blocked destinations and stop safely without walking in place indefinitely.
- Define seats explicitly in scene metadata, including seat ID, approach position, sitting position/orientation, seat height, and stand-up clearance. The pipe visible in the splat does not automatically supply a seat.
- Approach the seat, align, play a sit-down transition, hold a seated pose, and support a stand-up transition. Account for pipe geometry without disabling collision globally or passing through unrelated obstacles. Limit initial support to prepared seats compatible with the chosen avatar and clips.
- Validate space before standing. If blocked, remain seated and report the failure. Seat alignment may use a controlled transition to a validated pose; prevent root motion from applying movement twice.
- On stop or cancellation, halt walking safely. If a sitting transition has begun, finish to a valid supported pose before reporting cancellation. Scene reset/replacement cancels the sequence and removes stale seat/path references.

### Talking and audio-driven mouth movements

Use one supplied, finalized voice recording and a provided or checked transcript for the first sequence. Prepare captions and mouth timings from that final audio. A future text-to-speech source can supply equivalent audio and timing data through the same playback path. Interactive dialogue, microphone input, speech recognition, and an AI conversation service require separate scope; talking to the viewer initially means delivering scripted spoken content.

Audio playback is the authoritative speech clock. Drive mouth movements from the audio's actual playback position, including delayed starts, buffering, pause/resume, seek, replay, and playback-rate changes. Do not run mouth animation on a separate timer that can drift from the voice.

Support these quality levels:

- Basic: use the playing audio's amplitude envelope to drive a smoothed jaw or mouth-open control, returning to neutral during silence. This produces approximate talking motion, not phoneme-accurate lip sync.
- Improved: use time-aligned viseme cues prepared from the final speech audio, blending mapped mouth shapes against the same playback clock. A viseme describes the visible mouth shape of a speech sound. Associate cues with the exact audio revision so replacement audio cannot silently reuse stale timing.

The first speaking guide must use time-aligned viseme cues prepared offline from the supplied final recording. Amplitude-driven jaw motion is an optional development preview and does not satisfy milestone acceptance. Preserve head/body animation while speech controls only the mapped facial channels. When playback stops, fails, is cancelled, or ends, release speech-owned facial controls and blend the mouth to neutral.

Provide an explicit viewer action to enable sound when required by browser playback rules. If playback is blocked, keep the action waiting with a clear enable-audio control and do not animate speech before audio starts. Use positional voice audio attached to the guide's head, with configurable range and volume, and provide captions plus pause/stop controls. During muted playback, captions and mouth timing continue from the playback clock.

Allow the guide's head or gaze to orient toward the viewer within comfortable limits, without turning a seated body through the pipe or overriding speech mouth shapes. Do not require the viewer to remain at a fixed camera position.

### Example authored sequence

After the viewer presses Start guide: walk along the prepared route to the pipe, align to its authored sitting pose, sit down, gently face the viewer within seated gaze limits, play the supplied lines with captions and timed mouth shapes, then stand when clearance is available and remain idle beside the pipe. Run once per explicit start; do not automatically loop or follow the viewer. If the viewer moves behind the guide, continue speaking without twisting the body around. This complete sequence is the first avatar milestone, following the initial viewer prototype.

### Sequence controls and recovery

- Start guide begins once from the ready starting state and enables audio through the viewer interaction where required. Repeated clicks must not start duplicate sequences or voices.
- Pause freezes sequence progress and walking. Pause speech and mouth cues at the same playback position; keep idle breathing and bounded gaze behavior active. If sitting or standing is underway, finish that transition to a stable pose before marking the sequence paused. Resume continues from that pose and audio position.
- Stop ends speech, neutralizes the mouth, cancels pending actions, and halts walking safely in place. Complete any sitting/standing transition to a supported pose; do not force a seated guide to stand. Stop does not reset its location.
- Restart is a separate explicit action: cancel the current sequence, fade the guide out, restore its validated starting pose and playback state, fade it in, and begin once. Fade the guide rather than the viewer's camera. Starting again after completion requires Restart.
- An unreachable/blocked route, invalid pipe pose, blocked stand-up clearance, missing mouth cues, or speech load/playback failure stops the sequence safely and shows an actionable explanation plus Retry. Remain seated if standing is unsafe. Exploration remains available; do not silently skip an action.
- Retry revalidates the failed action and its resources, then retries from the current safe pose and recorded sequence checkpoint. Never repeat a completed walk/sit action blindly. If safe continuation cannot be established, explain that Restart is required.
- Prepare the route and pipe anchors manually for the first scene. Treat missing scene assets, route metadata, supplied speech, checked transcript, and mouth cues as content readiness failures; do not claim the milestone passes with substitutes or missing actions.

## Rendering and performance

The avatar is a normal mesh rendered alongside the streamed SOG environment. Verify visibility in front of and behind scanned walls and furniture, including thin surfaces and coarse splat LODs. Fix composition issues in the selected renderer; if a depth proxy is required, keep its alignment and revision tied to the environment. A collision mesh may need refinement before it is suitable as a visual occlusion proxy.

Match avatar materials and lighting to the captured environment. Start with simple materials and tuned environment lighting. Treat a blob/contact shadow as an optional visual improvement; do not depend on dynamic shadow reception by splats for acceptance.

Measure the same route with the avatar disabled and enabled at the same quality setting, after streaming settles. Record application FPS, frame time, active splat budget, and avatar asset costs on desktop and Quest 3. Establish numeric mesh, texture, material, and IK update budgets from those measurements before each phase ships. Preserve the viewer's manual quality behavior; do not silently reduce splat quality to conceal avatar cost.

## Acceptance

| Area | Required evidence |
| --- | --- |
| Basic guide | Generic asset loads at its own starting pose with correct height/orientation; remains visible and independent from viewer movement in desktop and VR. |
| Replacement | A second compatible GLB works through configuration only; model scale and scene scale remain independent. |
| Visibility | Guide head/body remain visible in desktop and VR; changing viewer camera modes or XR tracking never transfers pose ownership to the guide. |
| Failure/lifecycle | Missing/invalid avatar assets leave the viewer usable; repeated reset, scene reload, and VR entry/exit do not duplicate avatars or retain stale poses. |
| Grounded movement | Guide movement/collision checks pass; idle/walk follows actual movement, blocked routes fail safely, and visual streaming never removes collision support. Player Fly/Walk checks apply separately when a viewer body is introduced. |
| Rendering | Check avatar occlusion and lighting at multiple viewpoints and splat quality levels on desktop and Quest. |
| Performance | Record comparable avatar-off/avatar-on measurements on Quest 3; verify the existing viewer performance target under the documented test configuration. |
| IK, later | Test calibration, standing, walking, turns, slopes, steps, crouching, reach limits, tracking loss, falling, and Fly without camera displacement or unstable limbs. |
| Third-person, later | Test camera-relative walking, obstruction/recovery, animation, reset, and mode changes without a second movement authority. |
| Video customization, later | One consented sample recording produces a compatible personalized asset, reviewed visually and on the target device; document manual preparation steps and limitations. |
| Scripted walking | Complete a route around obstacles; unreachable destinations, unloaded coverage, cancellation, reset, and scene changes produce safe results without moving the viewer. |
| Sitting | Approach the pipe, sit at its prepared pose, speak while seated, and stand without visible floating, penetration, or duplicate root movement. Blocked stand-up clearance leaves the guide safely seated. |
| Speech and mouth | Verify audible speech, captions, positional sound, silence, pause/resume, seek, rate changes, mute, replay, and interruption. Mouth animation follows the playback clock and returns to neutral on end/error; blocked playback does not start mouth motion. |
| Guide asset replacement | A second speech-capable avatar supports the same scripted sequence through configured animation, seat alignment, and mouth mappings. Basic assets missing required capabilities fail validation before the sequence starts. |
| Sequence controls | Verify single start, pause during walking/speech/sitting/standing, resume, safe Stop, faded Restart, Retry, and one-shot completion into standing idle beside the pipe on desktop and Quest 3. |
| Guide performance | Repeat Quest 3 performance checks with scripted movement, seated transitions, audio, and facial animation active alongside the streamed scene. |

## Scope boundaries

The first avatar release includes one independent generic guide, configuration-based replacement, and the complete prepared pipe sequence with speech, timed mouth shapes, captions, and controls. A body representing the viewer, full body IK, third-person controls, and video-derived appearance remain later work. Multiplayer, remote human-controlled avatars, networking, accounts, avatar marketplaces, broader facial expressions, finger tracking, clothing simulation, and volumetric playback remain separate future work. This PRD adds no requirements to the initial viewer prototype's release gate.

## References

- [PlayCanvas model import](https://developer.playcanvas.com/user-manual/assets/models/)
- [PlayCanvas animation](https://developer.playcanvas.com/user-manual/animation/)
- [PlayCanvas Gaussian renderer and depth considerations](https://developer.playcanvas.com/user-manual/gaussian-splatting/rendering-architecture/renderers/)
- [PlayCanvas third-person controller source](https://github.com/playcanvas/engine/blob/main/scripts/esm/third-person-controller.mjs)

These identify candidate engine capabilities. Compatibility and performance remain implementation validation tasks for the pinned engine version and Quest 3.
