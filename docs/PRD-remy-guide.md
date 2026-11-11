# Remy guide: walk, sit, speak for 30 seconds, stand

Date: 2026-11-11  
Status: Requirements draft for review; Remy selected by the user, integration pending  
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
- Blend idle, walking, deceleration, and alignment without snapping limbs or abruptly rotating the torso. Turns near the seat must include plausible foot repositioning.
- Keep feet in contact with the verified ground during stance. Avoid visible skating, hovering, knee inversion, or stretching limbs to reach the ground.
- Give one movement adapter authority over world position. Imported skeletal hip motion and controller travel must not apply the same displacement twice. Preserve natural pelvis sway while compensating travel as required.

### Sitting and standing

- Author Remy's approach, pelvis contact, feet, hand placement, and standing pose against an aligned reference of the actual pipe and nearby floor. Reuse the existing route as a starting point for measurement.
- Derive alignment from Remy's mesh and animation. The mannequin's hip offset and limb dimensions are not valid calibration for Remy.
- Match the sit transition to the pipe's measured height. Keep the pelvis supported and the legs clear of the pipe; feet should reach their prepared support positions.
- Review hands and elbows throughout the motion. The downloaded clip's armrest-oriented pose must be edited or replaced if it looks unsupported on the pipe.
- Prepare a stable seated idle and a natural stand-up transition. Holding the final sit frame and reversing the sit clip are development candidates; use them only if visual review confirms believable posture, weight transfer, and continuity. Acquire or author separate clips when needed.
- Validate the swept movement around the pipe and nearby objects. Keep collision active for unrelated obstacles; define any controlled seat contact behavior explicitly.
- Full body IK is optional for this increment. Authored clips and offsets must satisfy contact quality before adding a solver.

### Seated delivery

- Use subtle breathing, occasional natural blinks, and restrained head movement. Keep the pelvis planted and avoid repetitive large gestures or upper-body swaying.
- Gaze may read the active viewer position as a target within configured anatomical limits. Looking behind the guide must not twist its seated body around or interrupt the recording.
- Facial speech channels, gaze, and body animation must coexist without overwriting each other's controls. The guide does not mirror the visitor's headset or controller poses.

## Speech and facial preparation

Use the existing `/guide/ronda-intro-30s.mp3`: seconds 0–30 of the user-supplied Joseph/Ronda recording. Preserve the recorded speakers and order. The current excerpt contains both introductions; one Remy guide presents that excerpt for this increment. Voice replacement or separate characters would require a later content decision.

- Play the recording once after Remy reaches the stable seated pose. Keep it seated until successful playback completion; never stand because a separate 30-second wall timer elapsed.
- Keep the audio at its normal playback rate for acceptance. Pausing, buffering, or delayed audio permission extends elapsed time without trimming content.
- Retain positional sound attached to Remy's actual head, along with volume, mute, and captions on desktop and in XR.
- Add and export facial morph targets sufficient for the current `neutral`, `A`, `E`, `O`, and `M` vocabulary. Validate the actual visual shapes against the recording and revise mappings or cue preparation if necessary. Shape names alone are insufficient evidence of lip sync.
- Use actual audio playback time to sample captions and visemes. Blend between shapes, hold neutral through silence, and release facial controls after Stop, failure, cancellation, or completion. Muting preserves timing.
- Bind cues to the final excerpt's content revision. The existing automatic transcript and simplified Rhubarb mapping require human review against Remy's face.
- If facial preparation is incomplete, label any separate body preview accordingly. Keep the complete speaking-guide milestone unavailable until its required facial channels pass validation.

## Asset and scene integration

Export one self-contained rigged GLB with documented scale in meters, rest pose, forward direction, feet offset, bone names, facial mappings, and animation mappings. Use a provisional height of 1.75 m, then validate body proportions and pipe fit. Height adjustments must trigger revalidation of seat poses and collision clearance.

Keep Remy's root independent of the scaled splat scene and the viewer rig. Configure the model URL, revision, source/license record, animation mappings, and scene anchors separately. Camera reset and XR entry/exit must preserve the guide's position and checkpoint. Scene reload cancels old loads and playback, releases resources, and creates at most one fresh guide without auto-starting it.

The existing Ronda placement is a visual starting reference: origin `[-2.2, 0.25, -3.55]`, yaw `-90°`, seat height `0.77 m` relative to that origin. These values do not establish Remy's final feet level, pelvis offset, or collider alignment. Measure those together in the scan. Other scenes require their own validated route and seat configuration.

A complete aligned collider for this small guide area is sufficient. Validate the starting pose, every route segment, the sit transition, and stand clearance before enabling the sequence. Missing collision coverage or a blocked route produces a safe, actionable failure while exploration remains usable.

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

These are preparation targets, not measured runtime budgets. Record download bytes, decoded texture memory, triangles, materials/draw calls, bone count, and active facial shapes for the final GLB. Measure the same settled scene and route with the avatar off and on, preserving the same manual quality preset and splat budget.

Before release, record the exact headset model, browser, renderer, refresh target, framebuffer scale, FPS, and frame-time distribution. Use the existing viewer's selected refresh target as the performance gate; document any target change explicitly. Include both the walk and seated speech with facial animation. A source FBX size or desktop-only observation cannot establish Quest acceptance.

Verify the guide's lighting, contact shadow, and occlusion from both sides of scanned geometry at multiple splat detail levels. Shadow quality must support believable contact without hiding pose/alignment errors.

## Acceptance evidence

| Area | Required evidence |
| --- | --- |
| Asset | Final GLB loads at the documented height, orientation, and feet level; required clips and mouth shapes validate. Record final asset statistics and source revision. |
| Natural motion | Record the complete sequence from front, side, and an oblique view. Review foot stance, turns, deceleration, seat contact, hands, seated motion, and stand weight transfer. No visible pops, skating, floating, or intersections in those views. |
| Scene safety | Actual Ronda route and pipe pass collision/contact checks. Exercise blocked walking and blocked standing; remain in a safe supported pose with actionable recovery. |
| Speech | Play the entire 30.000-second excerpt at normal rate after sitting. Verify audible positional sound, reviewed captions, mouth shapes, silence, mute, pause/resume, and neutralization. Standing starts only after successful playback completion. |
| Recovery | Exercise repeated Start, Stop and Pause in each stage, Restart, failed audio permission, missing assets, scene reload, and visibility suspension. No duplicate voice or stale motion. |
| Viewer independence | Move the desktop camera and enter/exit XR during the run. The guide stays at its world pose/checkpoint and the visitor's camera is never driven by Remy. |
| Performance | Capture comparable avatar-off/on measurements on desktop and the actual Quest device with movement, speech, and facial animation active. Confirm the documented viewer performance gate. |

Automated checks should cover required asset/mapping validation, playback-driven sequence progression, interruption behavior, and stale asynchronous completions. Visual and device evidence remains necessary for natural movement, contact, speech quality, and performance.

## Delivery checkpoints

1. **Asset ready:** optimize Remy, document the rig, prepare compatible clips, add facial shapes, export and validate the GLB.
2. **Body sequence ready:** connect the existing sequence controller, calibrate the actual route/pipe, and review natural walk/sit/stand motion and safe controls.
3. **Speaking sequence ready:** map the reviewed 30-second audio cues and captions to Remy, retain seated motion, and validate speech completion/recovery.
4. **Accepted:** capture real-scene visual evidence and desktop/Quest results for every acceptance row.

MakeHuman/MPFB remains a [documented future asset source](superpowers/specs/2026-11-11-avatar-guide-design.md#future-avatar-source-makehuman--mpfb). Current delivery uses Remy. The additional viewer-body, full body IK, third-person, and likeness-customization phases remain governed by the broader avatar PRD.

## Sources

- [Remy in Mixamo](https://www.mixamo.com/#/?page=1&query=Remy&type=Character)
- [Adobe Mixamo FAQ: access and permitted character/animation use](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)
- [Bundled recording preparation and cue provenance](../public/guide/README.md)
- Source asset counts, missing facial controls, and clip frame ranges above come from local Blender inspection of the downloaded FBXs, not catalog performance claims.
