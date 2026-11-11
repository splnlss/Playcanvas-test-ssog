# Implementation code review

Date: 2026-11-11. Independent read-only code reviewer; separate from the earlier Claude plan review.

## Findings and resolution

| Severity | Finding | Resolution |
| --- | --- | --- |
| Important | Retrying the same URL could unload a resource shared by native coalesced requests. | Added reference-counted asset leases; cleanup waits for settlement and final release. Two regression tests use the installed native asset registry/resource loader with a network handler stub. |
| Important | External XR end fired before `xr.active` became false, leaving controls stale. | Refresh in a guarded microtask; regression test checks event ordering and disposal. |
| Important | Canvas default dimensions could remain 300 × 150 and were not refreshed after XR exit. | Explicit window fill/automatic resolution and resize after XR end. Browser observation confirmed viewport-sized drawing dimensions. |
| Important | Showing the menu during session startup could use an untracked head pose and place it incorrectly. | Start with the menu hidden; left X positions and opens it after tracking begins. Headset placement still needs manual verification. |

No critical or minor findings were reported. The reviewer noted the separate scene/player roots, head-pivot math, normalized flight, disconnect suppression, manual quality state and menu UV mapping as sound. All four findings were addressed in one fix pass; 33 tests and the production build pass.

The reviewer did not claim hardware acceptance. Stereo appearance, scale, controller ergonomics, fade coverage in both eyes, performance and live quality require headset checks. Walking/avatars and Mac remote rendering remain separate scope. The active-frame loading deadline change was outside the review snapshot and has its own regression test.
