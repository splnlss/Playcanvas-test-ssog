# PlayCanvas Streaming SOG Viewer with VR

Status: Active original prototype track — headset-local rendering; desktop-rendered VR investigated separately\
Date: 2026-11-10\
Updated: 2026-11-11 — modular scene assets, walking collision plan, future avatars

## Separate research track — 2026-11-11

The user asked to move Mac desktop-GPU-to-Quest streaming research to a separate tab and continue the original plan here. This PRD again governs the original viewer: the host serves SOG data and the headset renders it locally. That prototype does not satisfy the separate desktop-GPU rendering goal; keep the two tracks explicit.

Desktop-rendered immersive VR remains a separate investigation, Mac preferred with a Windows machine available as fallback. See [remote-rendering decision](remote-rendering-decision.md) for context. Do not migrate this implementation or adopt streaming infrastructure without a later decision.

## Purpose

Create a simple browser prototype for sharing and exploring prepared Gaussian splat scenes. Visitors can inspect a progressively streamed scene on desktop or enter VR on Meta Quest 3. Basic flight lets them explore beyond the starting viewpoint. Adjustable VR quality lets us compare visual detail and rendering performance.

The repository currently contains agent skills and Claude configuration; the viewer is a new application.

## Scope

The prototype includes:

- PlayCanvas rendering with native Streamed SOG loading.
- One configured scene per shared link, starting with a public sample permitted for reuse; replacing the model requires only scene configuration changes.
- Desktop Orbit and Fly modes.
- An Enter VR button, Quest 3 controller flight, and a small headset menu.
- Manual Low/Medium/High VR quality presets, a basic FPS display, and optional automatic quality adjustment.
- Loading feedback, useful errors, retry, and reset.
- Static HTTPS deployment with scene assets hosted separately if needed.

Keep this small: one viewer, a small configuration file, and minimal controls. No backend, accounts, uploads, conversion pipeline, scene catalog, editor, annotations, audio, tours, AR, hand tracking, multiplayer, teleportation, or implemented walking/collision detection in the initial flight prototype. Walking collision design and future avatar attachment are planned below. Mobile support and additional headsets are outside acceptance scope.

## Users and success

The visitor opens a link and explores without installing software. The scene publisher selects a prepared dataset and starting views through configuration. The prototype tester changes VR quality while observing FPS.

Success means:

1. Useful scene content appears before the complete dataset downloads.
2. Desktop and Quest 3 flight work as specified.
3. VR entry and exit work repeatedly without losing the scene or desktop view.
4. VR quality can be changed during a session, with the active preset and FPS visible in the headset menu.
5. A shared URL reliably selects its configured scene.

## Scene configuration and streaming

Use PlayCanvas's native Streamed SOG pipeline. The format has a `lod-meta.json` index referencing spatial chunks and levels of detail. Resolve asset paths from the manifest; do not assume chunk filenames. A full download of a single SOG before display does not satisfy streaming. Single `.sog` support is a convenience for model replacement and must be identified as non-streamed; the default sample and streaming acceptance checks use a streamed source. See the [Streamed SOG format](https://developer.playcanvas.com/user-manual/gaussian-splatting/formats/streamed-sog/) and [streaming guide](https://developer.playcanvas.com/user-manual/gaussian-splatting/building/unified-rendering/lod-streaming/).

A small configuration file contains:

- Top-level default scene ID, plus scene ID, title, typed splat source, source attribution, and reuse permission reference for each scene. A source is either `streamed-sog` with a manifest URL or `sog` with a single-file URL; both use native PlayCanvas loading.
- Scene transform, up-axis correction if needed, and scale in meters.
- Desktop starting camera position, orbit target, and Orbit re-entry target distance (default 3 meters).
- VR starting origin and heading, including explicit floor/height configuration.
- Desktop quality settings and three distinct VR quality presets.
- Flight speeds and snap-turn angle.
- Optional future walking metadata: an aligned collision-mesh URL and a feet-level safe spawn pose. These are data only in the initial prototype; do not load collision assets until walking is implemented.

A URL such as `?scene=sample` selects a configured ID. No parameter opens the default scene; an unknown ID shows a helpful error. Adding a prepared scene requires editing configuration rather than viewer logic. Arbitrary remote URL entry is excluded.

Use an HTTPS sample whose reuse permissions can be verified, preserve required attribution, and record its manifest location during implementation. Select a dataset large enough that the manual flight route triggers additional chunk requests. Prepare the dataset separately if the permitted source is not already streamed SOG. Hosting must support required CORS access and keep manifest and chunk versions consistent.

Load appropriate detail as the camera moves, using bounded engine resource settings. Keep visible content while more detail arrives. “Scene ready” means the first rendered frame containing initial scene splats, not merely a loaded manifest. That condition removes “Loading scene…” and permits VR entry. Show “Refining scene…” only if a supported engine signal exposes chunk loading; otherwise omit that indicator. Do not display an invented progress percentage. Initial load failures expose Retry. For refinement failures, retain available content and show a notice when an error signal is available; offer per-chunk Retry only if the engine supports it. Otherwise offer an explicit Reload scene action, which may reload the dataset. Do not build a custom chunk scheduler or loop retries indefinitely.

## Modular scene replacement

Keep one scene-loading module with a small `load(scene)`, `reload()`, and `destroy()` interface. It owns splat assets, transforms, readiness, errors, and cleanup. Desktop controls, XR, quality, and the future avatar must not contain model URLs or infer scene geometry. Native source selection stays inside the loader; do not build a plugin registry.

Keep the scene content root separate from the player rig. Apply model scale and orientation to scene content, not to the player; movement and tracking remain in world meters. Record all starting poses in that normalized world space. This avoids changing flight speed, headset scale, or later avatar size when swapping models.

The prototype swap workflow is: edit/add a scene descriptor, select its ID through the URL, and reload the page. A model browser or live switching control is unnecessary. The loader still cleans up on Retry/reload and ignores stale asynchronous completions. If a swap is requested during VR, end VR before replacement, then apply the new starting pose and profiles. Do not preserve an old scene's spawn or future collision geometry with the new model.

For a single-file source, hide streaming-refinement status and indicate “Single SOG — not streamed.” Splat/LOD budget changes may not affect a single-level asset; mark unsupported budget controls as unavailable instead of pretending they change its detail. FPS remains available. Streamed scenes retain all three required quality presets.

Acceptance: two descriptors with distinct URLs and transforms can be selected without editing viewer or controls code; at least one must be streamed. Native loading of the second descriptor and correct player scale are verified. Add a small reusable single-file sample only when needed for that check, rather than a second large download.

## Walking collision plan — later phase

Walking is a separate locomotion mode planned before implementation begins. The initial prototype still ships Orbit and collision-free Fly. Do not install physics or expose a nonfunctional Walk button now.

Use an independently prepared, simplified static collision mesh associated with each scene descriptor. It must share the splat's content transform and align with its floors and walls. A `.sog` URL alone is insufficient input for this planned walking path. Generate or author collision geometry offline, then inspect it; do not derive runtime collision from the currently visible LOD or GPU splat budget. PlayCanvas documents [collision generation from splats](https://developer.playcanvas.com/user-manual/splat-transform/collision/) and [primitive/mesh collision shapes](https://developer.playcanvas.com/user-manual/physics/collision-shapes/).

The later walking controller will use a player capsule, gravity, ground detection, wall sliding, head clearance, and explicit slope/step limits. It will resolve requested movement against the scene collision mesh before moving the player rig. Keep collision resolution independent from desktop/VR input and avatar rendering. Choose and validate the controller/physics implementation when that phase starts; no new dependency or generic physics interface is required now.

Walk becomes available only after the matching collision asset and a valid feet-level safe spawn are ready. Missing, failed, or mismatched collision data disables Walk with an explanation; it never silently enables collision-free walking. Fly deliberately bypasses collision. Changing model clears old collision state and requires revalidation. Entering Walk from Fly returns to a validated safe spawn rather than assuming the visitor's current position is supported.

In VR, validate how the body capsule follows physical head translation without forcing the tracked camera through artificial corrections. Physical movement can still take a head beyond a virtual wall; do not imply that virtual collision constrains the visitor's real body. Define fade/obstruction behavior and re-entry handling during the walking phase.

Walking acceptance will cover floors, walls, doorways/head clearance, slopes/steps, high-speed movement without tunneling, safe spawn and reset, missing collision assets, source/transform changes, and VR physical head offsets. Inspect alignment independently of splat quality. See [walking and avatar follow-up](walking-and-avatars.md) for the staged implementation plan.

## Future avatars

Keep a player rig with a world-space body origin, head/camera tracking, and optional controller poses. Later avatar rendering consumes these poses; it does not own camera movement, scene loading, or collision resolution. A body mesh attaches to the player origin rather than the camera or splat root. This leaves room for both desktop and VR presentation without coupling model replacement to the avatar.

Avatar assets, animation, inverse kinematics, networking, and multiplayer are later work. Do not create empty avatar classes or choose a networking stack now. Before avatars ship, specify feet alignment, body/head offsets, scale, local first-person visibility, and how walking/collision drives the body independently of tracked head pose.

## Desktop interaction

A compact toolbar offers Orbit/Fly, Reset view, Enter VR, and controls help. Start in Orbit mode.

| Mode | Input | Behavior |
| --- | --- | --- |
| Orbit | Left drag | Rotate around the orbit target. |
| Orbit | Right drag | Pan. |
| Orbit | Wheel | Zoom. |
| Fly | Click canvas, then mouse | Capture pointer and look around; Escape releases pointer. |
| Fly | W/A/S/D | Move forward/back and sideways relative to camera heading, without roll. |
| Fly | Q/E | Move down/up along world vertical. |
| Fly | Shift while moving | Increase speed from 1.5 m/s to 3 m/s. |
| Either | Reset view | Restore configured desktop pose and orbit target, return to Orbit, and release pointer lock. |

Use yaw-relative horizontal desktop flight so Q/E explicitly controls altitude. Normalize diagonal movement and scale movement by elapsed time. Switching modes preserves the current camera position; returning to Orbit places its target the configured distance ahead along the current view direction. Suppress movement while pointer capture is released, the page lacks focus, or a menu control has focus. Clear held inputs on focus loss.

Flight has no collisions or capture-boundary restrictions. Reset provides recovery when the visitor leaves the captured area.

## VR entry and lifecycle

Enable Enter VR after the shared “scene ready” condition and immersive VR availability are both true. Show a disabled button with a short explanation on unsupported devices; desktop viewing remains usable. Recheck availability when it changes.

Request immersive VR directly from the button action and prevent duplicate requests. Use the loaded scene and the configured VR starting pose. Save the desktop pose, orbit target, and Orbit/Fly mode before entry. On failed entry or exit, restore them and the desktop quality settings. Never automatically reacquire pointer lock; Fly requires another canvas click. Disable desktop camera input while immersed.

Handle rejected entry, session errors, runtime exit, and headset disconnection without leaving controls stuck. End movement on controller disconnection or session end. A later entry starts at the configured VR pose again.

PlayCanvas documents availability checks, user-initiated startup, and session lifecycle events in [Using WebXR](https://developer.playcanvas.com/user-manual/xr/using-webxr/).

## VR movement and menu

| Input | Behavior |
| --- | --- |
| Physical head movement | Tracked view position and orientation. |
| Left thumbstick | Horizontal flight relative to headset heading; looking up/down does not change altitude. |
| Right thumbstick vertical | Move up/down along world vertical. |
| Right thumbstick horizontal | Snap turn in 30° increments around the current head position. |
| Left controller X button | Toggle the headset menu. |
| Right controller ray and trigger | Select menu controls. |

VR movement speed is 1.5 m/s with no boost. Use thumbstick dead zones, normalize combined movement, and require the horizontal stick to return to neutral before another snap turn. When both right-stick axes are engaged, use the dominant axis to avoid turning and changing altitude accidentally. Do not apply artificial pitch or roll.

The small world-space menu provides Reset position, Exit VR, Low/Medium/High quality selection, an Auto quality toggle, and the FPS readout. Opening it pauses controller flight and turning while head tracking continues. It appears in front of the visitor on opening and remains stable while they point at it.

Reset briefly fades out, restores the configured VR origin and heading, then fades in. It preserves the selected quality mode. Exit ends the XR session; the runtime's own exit controls also remain valid.

Use configured physical scale. Prefer floor-relative tracking; when unavailable, use an explicitly configured local-space height offset. Verify floor placement on the headset rather than inferring it from scene bounds.

## Adjustable VR performance

Manual control is the default: Auto quality starts off. Low, Medium, and High map to distinct, documented engine-supported splat/LOD budgets. Exact values are established using the sample scene and Quest 3, and remain editable in configuration. Start at Medium. Preserve the last active preset across VR exit/re-entry within the page session; reset Auto to off on every entry.

Selecting a preset applies it without restarting the session or reloading the entire scene. Confirm live budget changes during the feasibility milestone; if unavailable, report the blocker before changing this requirement. Do not silently substitute resolution-only presets. Allow streaming to settle as detail changes. In manual mode, no automatic process silently overrides the chosen budget.

Show the active preset and a smoothed application frame rate, updated about once per second, inside the headset menu. This is an application FPS estimate, not a claim about compositor performance or a full GPU profiler.

Optional Auto quality is the final enhancement and may be deferred without blocking acceptance of manual presets and FPS. If included, it uses the same three presets: lower one level after FPS stays below 90% of the session target for three seconds; raise one level only after FPS stays above 98% for ten seconds. Wait at least ten seconds between changes. Show the active preset while Auto is on. Selecting a manual preset disables Auto. Use the runtime's reported refresh rate when available; otherwise use a labeled configurable target of 72 FPS.

Avoid a custom profiler, charts, arbitrary sliders, and extensive tuning panels. Three presets, one toggle, and FPS are sufficient for this prototype.

## Minimal interface and errors

Keep the scene dominant. Show its title, the compact toolbar, and unobtrusive loading feedback. Provide concise desktop and VR control instructions before entry. Toolbar controls must have readable labels and keyboard focus.

Handle invalid manifests, missing assets, CORS/network failures, and unsupported graphics with a readable explanation. Offer Retry for recoverable loading errors. A fatal initial load must not enable VR; a refinement error must not discard already visible content. Do not require HTML overlays to be visible in immersive VR.

## Technical approach

Use a small standalone PlayCanvas Engine app suitable for static hosting, with WebGL2 as the planned backend. WebGPU exploration is outside prototype scope. PlayCanvas recommends WebGL2 for XR where the browser lacks the WebGPU/XR bridge; validate the actual headset rather than assuming compatibility. See [XR backend requirements](https://developer.playcanvas.com/user-manual/web-components/xr/). Pin the engine version after confirming that native streaming and immersive stereo rendering work together on Quest 3. Prefer built-in engine loading and resource controls over a custom streaming system.

Keep scene configuration, camera controls, XR lifecycle, and interface state understandable without building a framework around them. Maintain loading state separately from XR state. Scene assets may live on another HTTPS host with appropriate CORS permissions.

## Acceptance checklist

| Area | Evidence required |
| --- | --- |
| Scene links/model swaps | Default and explicit IDs load; invalid IDs error. Replace source/transform through configuration only; verify streamed and single-file source behavior, asset cleanup, and unchanged meter-based player scale. |
| Streaming | Network capture shows useful content before all chunks download, and new requests as flight changes viewpoint. |
| Desktop | Orbit, flight, speed boost, mode switching, pointer release, focus loss, and reset behave as specified. |
| VR rendering | Real Quest 3 check confirms both-eye rendering, scale, floor placement, head tracking, and continued streaming during flight. |
| VR controls | Flight, vertical movement, one snap per stick deflection, menu selection, reset fade, and exit work on controllers. |
| Quality | On streamed scenes, each preset changes its configured budget during VR; FPS and active preset are visible; manual selection remains unchanged until the tester changes it. |
| Auto quality (optional) | If included, enabling Auto permits preset changes; manual selection disables it, without rapid oscillation. Deferral does not block manual-quality acceptance. |
| Lifecycle | Five entry/exit cycles restore desktop pose, orbit target, mode, and quality without automatic pointer capture, duplicate controls, sessions, or persistent movement; Auto starts off on re-entry. |
| Failure | Failed initial loads, missing refinement chunks, denied VR entry, and controller disconnects leave a recoverable interface. |
| Deployment | The static app opens over HTTPS and loads its separately hosted assets where configured. |

Record a simple comparison for Low/Medium/High: dataset, device/browser, configured budgets, actual runtime refresh rate when available, average application FPS, and visible quality notes over the same manually described 60-second flight route. Record notes in Markdown; no automated replay, recorder, or benchmark dashboard is required. Aim for 60 FPS on the reference desktop and 72 FPS on Quest 3 when its session runs at 72 Hz. These are measurement targets, not promises for every preset; a deliberately expensive High preset may fall short and remain useful for testing.

Run a ten-minute flight session to check crashes and resource growth. Use the engine's configured resource limits and record observed behavior. Do not turn this prototype into a benchmark suite.

## Delivery order

1. Prove native streamed SOG and immersive stereo rendering with a permitted sample on Quest 3 using WebGL2. Verify live splat-budget changes, the first-content readiness signal, controller ray/button interaction with a minimal world-space panel, and the floor/local reference-space fallback. Record supported streaming/error signals and refresh-rate access, the engine version, sample/scale, and budgets. Documentation alone does not pass this hardware gate.
2. Add modular scene descriptors/native loading, separate scene/player roots, configured scene links, desktop Orbit/Fly controls, loading/error feedback, and reset. Verify a model swap without controls changes.
3. Add VR lifecycle, controller flight, and the small headset menu.
4. Add the three adjustable quality presets and FPS display; complete the acceptance checklist and deploy to static HTTPS hosting. Add the optional Auto toggle last if it remains small.

The specific sample manifest, hosting provider, engine version, reference desktop, and numerical quality budgets are implementation selections. Record them when validated; they do not require additional product features.

## Review disposition

Claude’s independent review is preserved in `docs/PRD-claude-review.md`; its findings and their resolutions are tracked in `docs/PRD-review-resolution.md`. The approved reset fade remains required. Engine-dependent capabilities remain validation items until tested, rather than being claimed as proven.

Walking/collision and avatars are documented follow-up phases, not additional initial prototype release gates. This sequencing interprets the request for a collision plan before starting while retaining the agreed simple flight prototype.
