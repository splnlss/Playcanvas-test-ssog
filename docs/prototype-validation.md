# Prototype validation

Date: 2026-11-11\
Phase: local-rendering prototype implemented — **hardware acceptance partial**

## Environment and source

- Node 26.7.0; npm 11.19.0.
- Exact dependencies: PlayCanvas 2.24.0, TypeScript 7.0.2, Vite 8.3.8, Vitest 5.1.0; see lockfile.
- Planned backend: WebGL2. Observed in desktop status: PlayCanvas 2.24.0 / WebGL2.
- Connected authorized device: **Quest 3S** (`panther`), not Quest 3. Results on this device must not be labeled as Quest 3 results.
- Local viewer: `http://localhost:5173/`; USB reverse TCP 5173 configured and Quest Browser opened.
- Sample: SA3D_R&D_XP47 by Stephane Agullo, CC BY 4.0. Permission: https://raw.githubusercontent.com/playcanvas/engine/main/examples/assets/splats/apartment.txt .
- Download: public PlayCanvas `examples/assets/splats/apartment.sog`. Local three-level derivative prepared with SplatTransform 3.11.1; SH removed, 50%/12.5% decimation, spatial chunk extent 4, target 128K per chunk. Source has 661,466 splats; sample is small and cannot exercise a 1M ceiling fully.
- Generated manifest: `/sample/streamed/lod-meta.json`; source and chunks served from the same local origin, avoiding cross-origin dependencies for the probe.
- Transform: 180° about X, scale 1. Starting desktop position `[-3.8,-0.1,7.2]`, looking at `[0,-0.1,0]`, based on the official example. VR feet origin `[-3.8,-1.7,7.2]` and local height 1.6 m are provisional, not physically calibrated.

## Engine evidence from installed source

- `GSplatComponentSystem.EVENT_FRAMEREADY` / `frame:ready` reports camera, layer, sorted-frame readiness and pending loads. Initial loading pins the coarsest level, then waits for readiness and a postrender frame with positive `app.stats.frame.gsplats`. It subsequently releases the LOD pin.
- `app.scene.gsplat.splatBudget` is a runtime setter in the installed engine. Live behavior **inside VR** remains to be demonstrated.
- XR startup/end/availability are provided by `app.xr`; `frameRate` may be null. Current probe reports it rather than inventing a refresh rate.
- Controller `getOrigin()`/`getDirection()` and `selectstart` support the menu. Updated controller/menu interaction remains pending.
- A supported per-chunk retry/error interface has not been established. The probe offers whole-scene reload and a 60-second visible active-frame initial readiness deadline (background time is excluded). No custom scheduler has been added.
- Official comparison: `playcanvas/engine/examples/src/examples/gaussian-splatting/vr-lod/example.mjs` uses native streaming and frame readiness. Code implementation here remains local and minimal; no large example UI is copied.

## Checks completed

| Check | Result |
| --- | --- |
| Loading state generations | 4 automated tests pass; stale completion, failed-load readiness, disposal and visible-frame deadline covered. |
| Head-pivot math | 5 movement tests pass; head pivot, normalized flight, frame clamping and snap re-arming covered. |
| Desktop streamed rendering | Observed in Chrome: apartment renders; readiness status changes after initial content. |
| Desktop readout | Observed approximately 59 app FPS, 661,466 splats, 1M budget. This is a point observation, not a benchmark. |
| Build | Typechecking and Vite build pass; large-engine-bundle notice remains. |
| Public sample preparation | Completes; generated data ignored by Git. |
| Device connection and page launch | ADB authorized, reverse port succeeds, Quest Browser launch command succeeds. User subsequently confirmed the viewer worked in the headset; immersive entry is confirmed, detailed acceptance is separate. |

## Required hardware gate

The user confirmed “yes it worked in headset.” This confirms basic immersive entry/display on Quest 3S. It does not establish every row below or validate the later controller/menu updates.

| Check | Result |
| --- | --- |
| Quest page renders initial content and enables VR | User confirmed |
| Immersive VR starts and exits | Entry confirmed by user; exit pending |
| Correct scene in both eyes | Pending |
| Head tracking and scale/floor alignment | Pending |
| Right-trigger menu selection and left-X toggle | Pending |
| 250k/500k/1M budget changes live without session restart | Pending |
| 30° turn keeps physical head pivot stationary | Pending |
| Local-space fallback | Not run |
| Cold network capture / deferred chunk demand on movement | Not yet captured |

## Implementation verification

- `npm test`: 34 tests pass in 8 files. Coverage includes configuration, load generations/deadline, real native asset request ownership, movement, desktop focus/input state, XR lifecycle, menu hit regions and quality/Auto state.
- `npm run build`: TypeScript check and production build pass. The 2.2 MB engine JavaScript bundle emits a chunk-size warning.
- Desktop browser evidence while the preview pane was available: streamed apartment rendered, approximately 59 application FPS and positive splat count; coarse and refined chunk requests observed. Canvas drawing dimensions matched its 1303 × 1293 viewport after the sizing fix. These are observations, not performance benchmarks.
- Independent implementation review identified four important issues. All four were fixed; see [review and resolution](implementation-code-review.md).
- Full controller flight, X menu, trigger selection, reset fade, manual quality and optional Auto are implemented. Automated checks do not substitute for headset integration checks.
- Subsequent browser QA exercised actual pointer capture, Orbit/pan/zoom, flight speed/altitude/boost, pointer release and Reset. Escape required an explicit app handler; its browser regression now passes. See the [QA report](qa/2026-11-11-viewer-testing.md).

## Remaining acceptance

Verify updated flight/altitude/snap, head pivot, menu placement and input, both-eye fade, reset floor height, denied entry, external exit, controller disconnection and five entry/exit cycles. Run a ten-minute session and compare Low/Medium/High over the same 60-second path. Test a missing manifest/chunk, a static HTTPS preview, and target Quest 3 hardware. No deployment has been published.

The current sample's small size limits spatial streaming/performance stress; a larger permitted scene is needed to exercise the 1M budget fully. Walking collision and avatars remain documented future work.

## Auto checkbox correction

The browser-page Auto checkbox was disabled outside an active XR session, making it unusable before entering immersive VR. It is now enabled once a streamed scene is ready, accepts a pre-entry choice, and preserves that choice at session startup. Session exit still clears Auto; manual preset selection also clears it. A regression test first reproduced startup discarding the choice, then passed after the correction. All 34 tests and the production build pass. In the live preview, the ready checkbox was enabled and clicking it changed its checked state. The user subsequently confirmed that the corrected Auto checkbox works.

## User performance report

The user reports that FPS remains too low with Auto at its lowest quality setting on Quest 3S. Exact FPS, viewing path and compositor timing have not been captured. Current Low is a 250,000-splat target; Auto cannot reduce below it and does not adjust XR resolution or fixed foveation. This is a failed subjective performance acceptance check, not a measured benchmark. Next proposed experiment: reduce Low to 100,000 splats, test lower XR framebuffer scale and supported fixed foveation separately, and compare the same path before combining changes. No improvement is claimed yet.

## Ronda Lobato scene addition

Added `?scene=ronda` using the user-supplied HTTPS streamed SOG manifest. Manifest version 1, generated by SplatTransform 3.7.0, five LOD levels: 4,922,690 / 1,722,942 / 886,084 / 443,042 / 196,908 splats. The coarse chunk returns `Access-Control-Allow-Origin: *`; browser requests for the manifest, chunk metadata and WebP textures succeeded across coarse and finer levels.

Desktop preview reached Ready and visibly rendered the scene, with a point observation around 59–60 app FPS and 994,613 splats under the 1M desktop budget. This is not a Quest benchmark. The 180° X rotation and starting desktop `[0,1.6,5]` / VR feet `[0,0,5]` poses are provisional; headset scale/floor/placement remains to be checked. Current Low is 250k; the scene-wide coarsest level is already about 197k, limiting how far a budget reduction alone can simplify it. Creator/license metadata was not supplied; the footer labels its source without inheriting the apartment's CC BY claim.

Verification: all 35 tests pass, typechecking/production build passes with the existing engine chunk-size warning, and browser screenshot inspected.

## Extended browser QA

See [2026-11-11 test report](qa/2026-11-11-viewer-testing.md) and its raw results/screenshots. A ten-minute desktop flight completed at 59–60 sampled app FPS with no uncaught exceptions; texture allocation stabilized and later dropped. Scene routing, single SOG gating, production static loading, native budget changes, three reloads and injected initial/refinement failure recovery passed. Two local fixes address Escape handling in the embedded preview and long error text overflowing the panel; browser regressions and all 35 automated tests/build pass. Quest remained connected but asleep during these checks, so hardware acceptance and the reported low Quest FPS remain open.

## Quest optimization pass

After the user reported that the headset viewer works, enabled SH0 for default Ronda through a local metadata-only derivative: 17 chunk JSON files remove `shN` and point retained textures at their original remote URLs. Hosted data is unchanged. Browser verification reached Ready, all nine loaded SOG resources reported `shBands = 0`, and there were zero `shN_` requests. `npm run prepare:ronda` regenerates this ignored local metadata.

The configured XR scale multiplier is now 0.7 (49% of the former pixel area, before any runtime overrides and the existing device-pixel-ratio factor). Low/Medium/High request 100k/250k/500k budgets and fixed foveation 0.8/0.5/0.2, respectively, when supported. The menu reports scale and actual foveation, with N/A on unsupported runtimes. The original hosted Ronda path and former render settings remain at `?scene=ronda-full` for comparison. No additional geometry LOD was generated; the 196,908-splat scene-wide coarse floor remains.

Automated checks: 37 tests pass in 9 files and typecheck/production build passes. Metadata transformation and invalid scale/foveation settings were observed failing before implementation. Native SH0 loading/network behavior was verified in the browser. Real headset resolution/foveation support and FPS improvement are still to be measured after exiting, refreshing and re-entering VR.

At a desktop budget target of 100,000 on the optimized path, the observed drawn count was exactly 196,908, confirming the coarse LOD floor. This is not a Quest FPS measurement.

## WebGPU enablement

User requested WebGPU for Quest. Added Auto / WebGPU / WebGL2 selection with `?backend=` links. Auto prefers WebGPU only with both `navigator.gpu` and `XRGPUBinding`; native engine device initialization retains WebGL2 fallback. Explicit WebGPU permits desktop rendering even without the immersive bridge, with a visible warning that WebGL2 is needed for VR in that case. The status/readout report the actual device; backend changes preserve the scene query.

On the connected Quest 3S Browser 156, an already-active debugging socket allowed read-only capability inspection without changing flags: the visible viewer exposed `navigator.gpu` and `XRGPUBinding` and selected WebGPU automatically. The headset reported asleep and scene readiness/immersive rendering has not yet been confirmed for this backend. An asynchronous request asks the user to wear it and test entry/stereo/FPS.

On the Mac preview, actual native device type was `webgpu`; Ronda reached Ready with 994,613 drawn splats at about 59 app FPS. Desktop lacked XRGPUBinding and displayed the appropriate VR warning. Changing the renderer to WebGL2 preserved `scene=ronda` in the URL.

40 tests and the production build pass (existing engine chunk warning). Independent read-only review found no Critical or Important issues, verified engine WebGPU session integration and fallback, and noted the initial WebGL2-specific startup text; that text now says Starting renderer. No measured Quest FPS improvement or WebGPU immersive pass is claimed.

## Desktop WebGPU default

At the user's request, Auto now prefers WebGPU on desktop without requiring XRGPUBinding. Runtime immersive-VR capability detection retains the bridge requirement for headsets/PCVR devices; errors conservatively preserve the VR-compatible path. Explicit renderer overrides and native WebGL2 fallback remain available. A regression first showed desktop Auto incorrectly choosing WebGL2, then passed after the correction. 41 tests and the production build pass.

## Camera copy and explicit VR renderer label

Added page and headset Copy camera actions. JSON includes actual camera/player world poses, scene/backend, and default-pose configuration blocks. Local-space height is removed from VR rig spawn while physical head offsets remain only in the exact camera capture. Clipboard failure retains JSON on the page and in per-scene local storage; Copy saved camera avoids replacing a captured VR pose with the desktop pose after exit. Headset panel heading now uses full actual renderer names WebGPU/WebGL2. Browser capture produced Ronda/WebGPU JSON and an expanded Saved camera panel. New pose tests and seventh-menu-row hit coverage pass; in-headset interaction of the new action still needs manual validation.

## User-selected default camera

Applied the user-supplied Ronda bookmark as desktop position/target and VR feet origin/heading (local eye height 1.6m). Desktop position `[-4.966210842132568, 1.6858277320861816, -3.4595277309417725]`; VR feet Y `0.08582773208618155`, heading `-87.94902015045483°`. Ronda original/SH0 comparison variants share these defaults through the same scene descriptor. Reset uses the same saved poses. This replaces the provisional `[0,1.6,5]` desktop spawn; no new physical floor calibration is inferred.
