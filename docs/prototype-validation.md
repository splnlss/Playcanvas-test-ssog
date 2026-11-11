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
- Browser pointer-lock flight input was not fully exercised: the raw browser automation bridge closed with code 1011. Focus/input state is covered by unit tests; actual mouse/keyboard behavior remains a manual check.

## Remaining acceptance

Verify updated flight/altitude/snap, head pivot, menu placement and input, both-eye fade, reset floor height, denied entry, external exit, controller disconnection and five entry/exit cycles. Run a ten-minute session and compare Low/Medium/High over the same 60-second path. Test a missing manifest/chunk, a static HTTPS preview, and target Quest 3 hardware. No deployment has been published.

The current sample's small size limits spatial streaming/performance stress; a larger permitted scene is needed to exercise the 1M budget fully. Walking collision and avatars remain documented future work.

## Auto checkbox correction

The browser-page Auto checkbox was disabled outside an active XR session, making it unusable before entering immersive VR. It is now enabled once a streamed scene is ready, accepts a pre-entry choice, and preserves that choice at session startup. Session exit still clears Auto; manual preset selection also clears it. A regression test first reproduced startup discarding the choice, then passed after the correction. All 34 tests and the production build pass. In the live preview, the ready checkbox was enabled and clicking it changed its checked state. The user subsequently confirmed that the corrected Auto checkbox works.
