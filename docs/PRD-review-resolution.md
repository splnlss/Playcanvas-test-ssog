# PRD review resolution

Date: 2026-11-10\
Spec: [PRD](PRD.md)\
Original review: [Claude review](PRD-claude-review.md)

The original review is preserved. This document records decisions, not results of hardware testing.

| Finding | Resolution |
| --- | --- |
| Live quality changes | Retained as a required feasibility check. Current [GSplatParams API](https://api.playcanvas.com/engine/classes/GSplatParams.html#splatBudget) exposes a setter, but runtime behavior on the pinned engine and headset must be tested. Resolution-only presets do not silently replace the approved splat-detail controls. |
| Graphics backend | Plan WebGL2. No WebGPU investigation in this prototype. [PlayCanvas XR guidance](https://developer.playcanvas.com/user-manual/web-components/xr/) supports this conservative choice. Actual Quest compatibility remains unverified. |
| Refresh rate access | Check in feasibility; retain the labeled configurable 72 FPS fallback. |
| Refinement state | Use a supported loading signal if available; otherwise omit the indicator. No custom tracking subsystem. |
| Chunk errors/retry | Retry initial loads; expose chunk retry only when supported. Otherwise keep visible content and offer explicit scene reload. Report refinement errors only where observable. |
| XR menu input | Validate one world-space panel with ray/trigger selection early. Built-in input may be used if supported; a single ray/plane hit test is acceptable. No UI framework or controller-model downloads. |
| Default scene | Add an explicit default scene ID to configuration. |
| Quality restoration | Restore desktop quality on failed VR entry and session exit. |
| Desktop reset | Return to Orbit, restore initial pose/target, release pointer lock. |
| Orbit target | Configure re-entry distance, default 3 meters ahead along the current view. |
| Scene readiness | First rendered frame with initial splat content governs both initial loading UI and VR enablement; verify its engine signal. |
| Auto persistence | Preserve the last active preset within the page session, reset Auto off on each entry. |
| Dataset size | Require enough spatial content for the manual route to trigger additional requests. |
| Desktop mode restoration | Restore pre-VR mode, pose, and orbit target without automatically recapturing pointer. |
| Reset fade | Retain. The user explicitly approved Q13, including the fade; the review lacked that context. |
| Auto scope | Optional final enhancement; deferral does not fail acceptance of manual presets/FPS. |
| Performance checks | Manual Markdown record and a described 60-second route. No replay system or benchmark infrastructure. |
| Controller indices | Validate Quest mappings during implementation; behavior remains specified in the PRD. |

Documentation settles API availability only. No sample dataset, rendering backend, hardware behavior, numerical quality budget, or performance result is marked validated yet.

## Subsequent scope clarification — 2026-11-11

The user requested easy model replacement, a walking collision plan before implementation, and avatars later. The PRD and implementation plan now specify typed streamed/single-file sources, loader-owned asset lifecycle, and a player rig independent of scene transforms. [Walking and avatar follow-up](walking-and-avatars.md) records collision geometry, capsule locomotion, safe spawn, VR physical offsets, and later body attachment. Initial Orbit/Fly remains collision-free; physics and avatar implementation remain later phases. Claude’s original review predates these clarifications.
