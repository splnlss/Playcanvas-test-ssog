# Remy guide: walk, sit, speak for 30 seconds, stand

Date: 2026-11-11  
Status: Requirements draft for review; Remy selected by the user, integration pending  
Quality direction: Natural walking and mouth movement are required for acceptance, confirmed by the user on 2026-11-11.

Related: [Avatar PRD](PRD-avatar.md), [guide integration design](superpowers/specs/2026-11-11-avatar-guide-design.md), [walking and collision requirements](walking-and-avatars.md)

## Purpose and success

Replace the procedural mannequin with Adobe Mixamo's **Remy** as an independent guide in the Ronda Gaussian splat scene. After an explicit Start, Remy walks in from the right, approaches the pipe, turns and sits naturally, delivers the existing 30-second recorded excerpt with synchronized mouth movements and captions, stands up, and remains idle beside the pipe.

The visitor remains free to explore on desktop and Quest. Success requires a continuous, believable sequence on the actual scanned pipe, correct speech timing, safe recovery controls, and measured rendering cost alongside the splats. A model loading successfully or completing the synthetic fixture alone does not establish acceptance.

This PRD specializes the existing avatar requirements for Remy. Shared lifecycle, collision, controls, and playback requirements continue to apply; this document defines the selected asset and the movement quality needed for this sequence.

## Starting evidence

The current viewer uses PlayCanvas 2.24.0 and has a procedural articulated guide, an authored provisional route, sequence controls, positional audio, draft captions, and offline mouth cues. Real guide collision and production GLB integration are pending.

The following source files were downloaded through the user's signed-in Mixamo session on 2026-11-11:

| Source | Intended use | Inspection status |
| --- | --- | --- |
| `Remy.fbx` | Character and humanoid skeleton in T-pose | Imported into Blender 5.2.2; 35,196 triangles across seven meshes, six materials; textures up to 2048 × 2048. |
| `Walking.fbx` | Male Standard Walk | Exported at 30 fps, without skin, with In Place enabled; imported frame range 1–38. |
| `Sitting.fbx` | Sitting Down Arms Outside Armrests | Exported at 30 fps, without skin; imported frame range 1–134. Pipe compatibility requires review. |
| `Standing Idle.fbx` | Standing Idle | Exported at 30 fps, without skin; imported frame range 1–181. |
| Seated idle and stand-up | Supported seated delivery and rising with weight transfer | Not yet acquired/authored; required outputs of asset preparation. |
| Turn/stop motion | Planted alignment and final steps | Acquire/author if walk/idle blending fails the walking-quality gate. |

These are local source downloads, not bundled production assets. No optimized GLB or runtime replacement has been validated. Inspect and record final exported triangle counts, transforms, clip durations, and file sizes during preparation.

**Facial readiness is a required dependency:** the inspected Remy source has no facial shape keys and no jaw bone. Prepare speech mouth shapes offline before accepting the speaking guide. A static face or a jaw-open approximation does not satisfy this requirement.

## Visitor sequence

| Stage | Required behavior | Completion condition |
| --- | --- | --- |
| Ready | Remy stands at the configured starting pose with subtle idle motion. Start becomes available after required assets, facial mappings, audio, route, and seat data pass validation. | One explicit Start claims one run and unlocks audio where required. |
| Walk | Enter from the right along the prepared route. Blend out of idle, walk at a believable pace, and turn smoothly through route changes. | Arrive at the seat approach without overshoot, sliding, or passing through obstacles. |
| Align | Decelerate, place the final steps, and orient the body to the pipe's sitting direction. | Feet and body reach the prepared sit-start pose. |
| Sit | Bend knees and hips, lower the pelvis, and shift weight onto the pipe in a continuous motion. | Reach the verified seated pose with stable seat contact. |
| Speak | Remain seated, play the complete 30-second excerpt, show captions, and animate mapped mouth shapes from audio playback time. Maintain restrained breathing and head movement. | The recording ends successfully; the mouth returns to neutral. |
| Stand | Check clearance, lean forward, bring weight over the feet, rise, and settle into standing. | Reach the prepared stable standing pose without intersecting the pipe. |
| Complete | Remain idle beside the pipe, facing the authored direction. | No automatic replay; Restart explicitly begins another run. |

The 30 seconds describes the speech content. Walking, sitting, standing, pauses, and buffering add to total elapsed sequence time.

## Natural movement requirements

### Walking and turning

- Use compatible humanoid clips retargeted to Remy's skeleton. Drive walk playback from actual resolved travel; stopping or encountering an obstruction must stop stepping.
- Match step cadence to travel speed. Start with the existing 0.8 m/s route setting and tune it with the selected walk clip; this value is provisional.
- Preserve the walk's weight transfer, pelvis motion, opposite arm swing, and relaxed upper-body movement after retargeting. Review the motion on Remy's proportions; copying rotations onto the rig is not sufficient.
- Blend idle, walking, deceleration, and alignment without snapping limbs or abruptly rotating the torso. Turns near the seat must include plausible foot repositioning.
- Keep the stance foot stable while the other foot swings. Do not rotate a standing body around feet that remain fixed in their idle pose. Acquire or author a turn/stop clip when the existing walk/idle blend cannot achieve a natural approach and alignment.
- Keep feet in contact with the verified ground during stance. Avoid visible skating, hovering, knee inversion, or stretching limbs to reach the ground.
- Review the loop boundary for a repeated hitch and review every route corner, departure from idle, final step, and arrival at the pipe at normal playback speed. A smooth straight walking segment alone does not pass.
- Give one movement adapter authority over world position. Imported skeletal hip motion and controller travel must not apply the same displacement twice. Preserve natural pelvis sway while compensating travel as required.

### Sitting and standing

- Author Remy's approach, pelvis contact, feet, hand placement, and standing pose against an aligned reference of the actual pipe and nearby floor. Reuse the existing route as a starting point for measurement.
- Derive alignment from Remy's mesh and animation. The mannequin's hip offset and limb dimensions are not valid calibration for Remy.
- Match the sit transition to the pipe's measured height. Keep the pelvis supported and the legs clear of the pipe; feet should reach their prepared support positions.
- Review hands and elbows throughout the motion. The downloaded clip's armrest-oriented pose must be edited or replaced if it looks unsupported on the pipe.
- Prepare a stable seated idle and a natural stand-up transition, using dedicated clips as the starting choice. A held sit frame requires an added breathing layer; a reversed sit requires its own visual review of forward lean and weight transfer. Neither candidate substitutes for the required seated/stand mappings or bypasses the quality gate.
- Export sit/stand clips with net horizontal travel extracted into authored movement curves. Preserve vertical pelvis motion and local sway. The movement adapter applies those curves once between the measured approach, seated, and standing anchors, using clip playback time. Report transition completion from the clip endpoint and supported contact, rather than the mannequin's fixed 1.2-second timer. Review the exported animation with its movement curve to detect double movement or removed weight transfer.
- Validate the swept movement around the pipe and nearby objects. Keep collision active for unrelated obstacles; define any controlled seat contact behavior explicitly.
- Full body IK is optional for this increment. Authored clips and offsets must satisfy contact quality before adding a solver.

### Seated delivery

- Use subtle breathing, occasional natural blinks, and restrained head movement. Prepare left/right eyelid controls alongside speech shapes. Keep the pelvis planted and avoid repetitive large gestures or upper-body swaying.
- Gaze may read the active viewer position as a target within configured anatomical limits. Looking behind the guide must not twist its seated body around or interrupt the recording.
- Facial speech channels, gaze, and body animation must coexist without overwriting each other's controls. The guide does not mirror the visitor's headset or controller poses.

## Speech and facial preparation

Use the existing `/guide/ronda-intro-30s.mp3`: seconds 0–30 of the user-supplied Joseph/Ronda recording. Preserve the recorded speakers and order. The current excerpt contains both introductions; one Remy guide presents that excerpt for this increment. Voice replacement or separate characters would require a later content decision.

- Play the recording once after Remy reaches the stable seated pose. Keep it seated until successful playback completion; never stand because a separate 30-second wall timer elapsed.
- Keep the audio at its normal playback rate for acceptance. Pausing, buffering, or delayed audio permission extends elapsed time without trimming content.
- Retain positional sound attached to Remy's actual head, along with volume, mute, and captions on desktop and in XR.
- Prepare facial controls that can visibly close the lips for sounds such as M/B/P, round them for rounded vowels, widen them where appropriate, and form the lip/teeth contact needed for F/V. Verify jaw, lips, teeth, and the mouth interior together; reject tearing, collapsed lips, exposed gaps, or mesh intersections.
- Treat the current `neutral`, `A`, `E`, `O`, and `M` vocabulary as a provisional starting mapping. Preserve the original Rhubarb cue distinctions and add or revise Remy's mouth shapes and cue mapping wherever this simplified set loses visible speech distinctions. Natural appearance on this recording takes precedence over retaining the mannequin's four non-neutral shapes.
- Prepare eight speech shapes for Remy: closed lips, narrow teeth, medium open, wide open, rounded, puckered, lip/teeth contact, and tongue-up. Preserve neutral as the rest pose and map the original Rhubarb A–H/X cues to those controls. Review their timing and deformation against the recording before acceptance.
- Use actual audio playback time to sample captions and visemes. Blend between shapes, hold neutral through silence, and release facial controls after Stop, failure, cancellation, or completion. Muting preserves timing.
- Smooth the transitions between neighboring speech sounds so the mouth anticipates and releases them naturally. Avoid snapping between isolated poses, opening fully on every syllable, or repeating one open/close cycle regardless of the spoken sound. Retain brief complete lip closures instead of smoothing them away.
- Review the full excerpt in a close frontal view and a three-quarter view at normal speed with audible speech. Check clear consonant closures and vowel changes, the pauses between speakers, and the final return to rest. A distant avatar, matching cue timestamps, or convincing muted animation alone does not establish natural lip sync.
- Recalibrate the current `0.10 s` facial cue lead against Remy's actual face and audio output on desktop and Quest. Record the chosen lead and observed alignment at the beginning, middle, and end of the excerpt. Fix consistently early/late mouth motion or accumulated drift; do not shift the audio or captions to hide a facial timing error.
- Bind cues to the final excerpt's content revision. The existing automatic transcript and simplified Rhubarb mapping require human review against Remy's face.
- If facial preparation is incomplete, any separate development body preview must have a distinct mode and label, and cannot satisfy the complete sequence's Start/readiness gate. Such a preview is optional; keep the complete speaking-guide milestone unavailable until its required facial channels pass validation.

## Asset and scene integration

Export one self-contained rigged GLB with documented scale in meters, rest pose, forward direction, feet offset, bone names, facial mappings, and animation mappings. Use a provisional height of 1.75 m, then validate body proportions and pipe fit. Height adjustments must trigger revalidation of seat poses and collision clearance.

Keep Remy's root independent of the scaled splat scene and the viewer rig. Configure the model URL, revision, source/license record, animation mappings, and scene anchors separately. Camera reset and XR entry/exit must preserve the guide's position and checkpoint. Scene reload cancels old loads and playback, releases resources, and creates at most one fresh guide without auto-starting it.

The existing Ronda placement is a visual starting reference: origin `[-2.2, 0.25, -3.55]`, yaw `-90°`, seat height `0.77 m` relative to that origin. These values do not establish Remy's final feet level, pelvis offset, or collider alignment. Measure those together in the scan. Other scenes require their own validated route and seat configuration.

A complete aligned collider for this small guide area is sufficient. Validate the starting pose, every route segment, the sit transition, and stand clearance before enabling the sequence. Missing collision coverage or a blocked route produces a safe, actionable failure while exploration remains usable.

Before clip editing, measure and record the floor under the route, pipe top and radius, and approach/stand clearance against the scene revision. Resolve the provisional `0.25` origin and `0.42` shadow-ground references; neither establishes a measured floor. Prepare a static guide-area collider and a capsule controller with ground contact, gravity, wall sliding, and explicit slope/step limits. Scope this controller to the guide; visitor-controlled walking remains a separate feature. Validate authored seat motion against dedicated body clearance volumes and the supporting pipe contact.

## Controls and failures

Preserve Start, Pause/Resume, Stop, Restart, Retry, volume/mute, and captions through the shared desktop/XR commands.

- Repeated Start never duplicates the guide, sequence, or voice.
- Pause during walking freezes travel. Pause during speech freezes audio and mouth timing together. A sit/stand transition settles to its supported endpoint before reporting paused.
- Stop halts walking and speech, clears pending actions, and neutralizes the mouth. Settle an active sit/stand transition safely; a seated guide remains seated.
- Restart settles current motion, fades only Remy, restores the validated starting pose and speech state, fades in, and starts once.
- Hidden browser or suspended XR pauses the sequence; resumption is explicit.
- Failed model, animation, facial, route, seat, or audio validation identifies the missing capability. Retry revalidates the failed action from a safe checkpoint. Failed playback must not advance to standing.
- Blocked stand clearance leaves Remy seated with a useful explanation and Retry. A failed character load must leave the viewer usable.

## Rendering and performance targets

Remy shares the rendering budget with the streamed scene. Initial asset preparation targets are **5,000–10,000 total triangles**, **1–2 materials**, **textures at 1K or below where appearance allows**, and a documented bone/morph count. Include clothing, shoes, and hair in these counts. Prefer simple opaque materials; inspect any hair cutouts for overdraw and visual artifacts.

Preserve sufficient facial and joint geometry for the accepted mouth shapes and walk deformations. Optimize topology and atlas materials before authoring final facial shapes, then verify that the exported GLB preserves their deformation and the body clips. Do not meet a preparation target by making the face or gait visibly worse; adjust the asset allocation and remeasure runtime cost.

These are preparation targets, not measured runtime budgets. Record download bytes, decoded texture memory, triangles, materials/draw calls, bone count, and active facial shapes for the final GLB. Measure the same settled scene and route with the avatar off and on, preserving the same manual quality preset and splat budget.

Before release, record the exact headset model, browser, renderer, refresh target, framebuffer scale, FPS, and frame-time distribution. Use 60 FPS on the reference desktop and 72 FPS at a 72 Hz Quest session as the initial acceptance targets. At a higher actual headset refresh rate T, use T FPS and a frame budget of 1000/T ms. For three complete runs after initial scene streaming settles, require mean application FPS at least 95% of the chosen target and the 95th percentile application frame time no more than 110% of that budget. Record the share of frames exceeding the budget. Name the manual quality preset, renderer, and reference desktop in the validation report before collecting acceptance runs; hold them fixed for avatar-off/on comparisons. Document any agreed target change explicitly. Include both the walk and seated speech with facial animation. These are application measurements, not compositor measurements. A source FBX size or desktop-only observation cannot establish Quest acceptance.

Verify the guide's lighting and occlusion from both sides of scanned geometry at multiple splat detail levels. If the existing contact shadow is retained, it must not mask pose/alignment errors. A new shadow implementation is optional.

## Acceptance evidence

| Area | Required evidence |
| --- | --- |
| Asset | Final GLB loads at the documented height, orientation, and feet level; required clips and mouth shapes validate. Record final asset statistics and source revision. |
| Natural motion | Record the complete sequence from front, side, and an oblique view. Review foot stance, turns, deceleration, seat contact, hands, seated motion, and stand weight transfer. No visible pops, skating, floating, or intersections in those views. |
| Walking quality | Show a full-body recording with feet visible at normal speed, including departure, multiple walk cycles, route corners, alignment, and the final step. Verify stable stance feet, cadence matched to travel, weight transfer, arm swing, and no loop hitch. Add turn/stop animation if these checks fail. |
| Scene safety | Actual Ronda route and pipe pass collision/contact checks. Exercise blocked walking and blocked standing; remain in a safe supported pose with actionable recovery. |
| Speech | Play the entire 30.000-second excerpt at normal rate after sitting. Verify audible positional sound, reviewed captions, mouth shapes, silence, mute, pause/resume, and neutralization. Retain inherited seek, changed-rate, and explicit replay checks as robustness cases. Standing starts only after successful playback completion. |
| Mouth quality | Record the complete audible excerpt in frontal and three-quarter facial views at normal speed. Verify lip closures, rounded/wide vowels, required lip/teeth contact, smooth transitions, pauses, and return to rest. Record facial lead calibration and check alignment at the beginning, middle, and end. Reject repetitive jaw flapping, snapping poses, persistent timing offsets, or broken facial geometry. |
| Recovery | Exercise repeated Start, Stop and Pause in each stage, Restart, failed audio permission, missing assets, scene reload, and visibility suspension. No duplicate voice or stale motion. |
| Viewer independence | Move the desktop camera and enter/exit XR during the run. The guide stays at its world pose/checkpoint and the visitor's camera is never driven by Remy. |
| Performance | Capture comparable avatar-off/on measurements on desktop and the actual Quest device with movement, speech, and facial animation active. Confirm the documented viewer performance gate. |

Automated checks should cover required asset/mapping validation, playback-driven sequence progression, interruption behavior, and stale asynchronous completions. Visual and device evidence remains necessary for natural movement, contact, speech quality, and performance.

Walking and mouth quality are separate required gates. Review them on the final exported Remy in the actual scene on desktop and Quest, at the intended viewing distance; use closer inspection and slow motion to diagnose defects. A reviewer must record pass/fail with links to the captures and any remaining defects. Passing tests, loading animation clips, or staying within the asset budget does not replace visual acceptance. Failed walking or mouth quality keeps the complete guide milestone open.

## Delivery checkpoints

1. **Scene measurements ready:** measure floor/pipe/clearance, record anchors and scene revision, and prepare the aligned guide-area collider. Resolve the provisional floor references before fitting clips.
2. **Asset ready:** optimize Remy while preserving the face and joints, document the rig, prepare compatible clips including seated idle, stand-up, and any required turn/stop motion against those measurements, author the reviewed facial and eyelid controls, export, and validate the GLB deformations.
3. **Body sequence ready:** implement and validate the guide capsule controller, connect the existing sequence controller using clip-driven transition completion, and review natural walk/sit/stand motion and safe controls against the measured route/pipe.
4. **Speaking sequence ready:** map the reviewed 30-second audio cues and captions to Remy, tune transitions and facial lead against the actual face, retain seated motion, and validate speech quality and completion/recovery.
5. **Accepted:** capture real-scene visual evidence and desktop/Quest results for every acceptance row, with explicit walking-quality and mouth-quality verdicts.

MakeHuman/MPFB remains a [documented future asset source](superpowers/specs/2026-11-11-avatar-guide-design.md#future-avatar-source-makehuman--mpfb). Current delivery uses Remy. The additional viewer-body, full body IK, third-person, and likeness-customization phases remain governed by the broader avatar PRD.

## Sources

- [Remy in Mixamo](https://www.mixamo.com/#/?page=1&query=Remy&type=Character)
- [Adobe Mixamo FAQ: access and permitted character/animation use](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)
- [Bundled recording preparation and cue provenance](../public/guide/README.md)
- Source asset counts, missing facial controls, and clip frame ranges above come from local Blender inspection of the downloaded FBXs, not catalog performance claims.
