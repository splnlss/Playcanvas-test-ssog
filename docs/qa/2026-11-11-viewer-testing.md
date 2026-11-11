# Viewer testing — 2026-11-11

Revision under test: `84ab04e`, followed by the two local fixes documented below. Dataset: Ronda Lobato, default scene. Backend: PlayCanvas 2.24.0 / WebGL2. Desktop: Apple M3 Pro, 36 GB, embedded Chromium preview. Quest 3S connected over USB; Browser 156.0.0.38.16.1112015520, Android 14. Device reported asleep during the automated desktop run; no fresh headset pass is inferred from the connection.

## Results

| Check | Result and evidence |
| --- | --- |
| Default Ronda, explicit apartment streamed and single SOG | Pass; each reached its correct ready state. Single SOG disabled LOD controls. |
| Invalid scene ID | Pass; clear unknown-scene message, VR disabled. |
| Orbit / pan / wheel zoom | Pass with real CDP mouse events; player position changed for each action. |
| Orbit → Fly | Pass; pose preserved. |
| Fly pointer capture | Pass with actual canvas click. |
| Flight speed | Pass; W moved 0.901 m over 0.601 s, approximately configured 1.5 m/s. |
| Altitude | Pass; E ascended 0.525 m. |
| Shift boost | Pass; moved 1.201 m over approximately 0.4 s. |
| Pointer release stops flight | Pass after explicit browser pointer release; held-key movement stopped. |
| Escape | Initially failed in the embedded preview; explicit application handling added. The same real CDP key check then released pointer lock successfully. |
| Reset | Pass; initial position restored and mode returned to Orbit. |
| Auto before entry | Pass; checkbox selection persisted through a readout refresh. Manual preset selection cleared Auto. |
| Three whole-scene reloads | Pass; each reached Ready, one player and one splat entity remained; asset count stable at nine during that run. |
| Initial manifest failure and Retry | Recovery pass; malformed/missing manifest response injected through a temporary XHR hook. Error shown, controls gated, Retry restored normal loading. Long error wrapping fixed afterward (below). |
| Missing refinement | Pass; injected chunk metadata failure triggered native retries, preserved ready content with 764,173 drawn splats, and whole-scene reload recovered. |
| Runtime budgets | Pass on desktop: 250k → 247,436 drawn; 500k → 418,656; 1M → 994,613. This is not live VR validation. |
| Production build | Pass; `dist/` served on local port 5174 and loaded Ronda remotely. Public HTTPS not tested. |
| Narrow layout | Normal ready state fits an emulated 390 × 844 viewport with a matching canvas. Error state has separate overflow finding. |
| Ten-minute desktop flight | Pass for this run; 600.002 seconds of visible square-route flight, 20 samples, 59–60 app FPS, no uncaught exceptions or lost scene/player invariants. |

The desktop interaction run reported no uncaught exceptions. Console errors during the fault-injection run corresponded to the intentionally failed manifest/chunk. Both network hooks were restored after testing. These are separate from the clean run.

## Findings

1. **Initial-load error layout — fixed locally:** the raw engine error overflowed a 612px viewport to 784px. Added `overflow-wrap:anywhere` to status text; the same error now fits 612px. Retry already worked. The error text remains technical. [Before](screenshots/initial-load-error.png), [after](screenshots/error-wrapping-verified.png).
2. **Quest performance remains below acceptance:** the user previously reported inadequate FPS at the lowest Auto level. No optimization has been applied; Low remains 250k and Ronda's coarsest LOD contains 196,908 splats. Desktop results cannot close this issue.
3. **Escape pointer release — fixed locally:** the app relied on native browser handling, and the embedded preview did not release on injected Escape. Added an explicit Escape handler that releases the pointer and clears held input. The previously failing key test now passes. [Verification](fix-verification.json).

## Ten-minute run details

Route: repeatedly hold W, D, S, A for four seconds each in Fly at 1.5 m/s, with yaw fixed at its initial heading; the route forms a roughly 6m square. Sampling approximately every 32 seconds records wall duration, app FPS, live player/scene count, assets, textures and heap. The final partial square ends at the ten-minute cutoff, then Reset restores the initial view.

- 59–60 sampled application FPS; desktop 1M budget. No VR benchmark is inferred.
- One player and one splat entity throughout. Asset count rose from 73 to 89 during warm-up, then dropped to 65 at the final sample.
- Texture allocation peaked at 205,377,308 bytes and ended at 158,471,324 bytes; no continuously increasing GPU texture allocation was observed.
- Sampled heap ranged from 111,469,240 to 175,227,443 bytes, including rises and falls. No forced GC or exhaustive leak proof is claimed.
- Resource-entry count rose from 90 to 250 during early flight, then stabilized; streaming continued after initial content.
- No uncaught exceptions. [Raw samples](soak-results.json), [end view](screenshots/ronda-soak-end.png).

## Final verification

Both local fixes were observed failing in browser checks before implementation and passing afterward. `npm test`: 35/35 pass. `npm run build`: typechecking and production bundle pass; the existing large-engine-chunk warning remains. The ten-minute soak applies to revision `84ab04e` before the two input/layout fixes; only their targeted checks plus the full automated suite/build were repeated afterward. At the time of this test run, the two fixes and this report were local; subsequent integration is recorded in Git history.

## Evidence

- [Desktop interaction results](desktop-results.json)
- [Failure/recovery and budget results](recovery-results.json)
- [Scene routes, static build and narrow layout results](routes-results.json)
- [Desktop rendering](screenshots/ronda-desktop.png)
- [Narrow viewport](screenshots/ronda-narrow.png)

## Headset checks still pending

Fresh controller flight, altitude, snap re-arming/head pivot, both-eye rendering/fade, floor/scale calibration, menu pointing, live preset changes, external exit, controller disconnection, local-space fallback and five entry/exit cycles. A 60-second comparison path for each quality level and an extended Quest session remain outstanding. The asynchronous request for these checks is pending the user's report.

No deployment, performance improvement, walking collision, avatar implementation or full headset acceptance is claimed.
