# Walking collision and avatar follow-up

Date: 2026-11-11\
Related: [PRD](PRD.md), [prototype plan](superpowers/plans/2026-11-10-sog-viewer.md)

## Sequencing

1. Initial prototype: modular model loading, independent player rig, Orbit/Fly, VR, and manual quality tests.
2. Walking: prepare and validate collision assets, then add collision-resolved locomotion for desktop and VR.
3. Avatars: render a body driven by the same player/head/controller poses, after walking behavior is settled.

The current request adds this plan before implementation. It does not silently add walking physics or avatars to the initial flight deliverable.

## Model replacement contract

A scene descriptor selects a native streamed SOG manifest or single `.sog`, the content transform, starting poses, quality profiles, and attribution. Single-file loading is supported but does not count as streaming; its budget controls must not imply nonexistent LOD changes.

Replacing a model means changing that descriptor and opening its configured URL. No camera, XR, or menu module contains an asset URL. The scene loader owns loading, native source selection, errors, and disposal. It ignores stale asynchronous completions and removes old resources on retry/replacement. Page reload is sufficient for the prototype swap workflow.

Render scene content under one scene root. Model transform normalizes it into world meters; player speed, capsule size, tracked head motion, and avatar scale must not inherit the model scale. Player/head/controller poses are world-space or explicitly local to the player root; do not mix capture-local and world coordinates. Each scene's spawn is configured in normalized world coordinates.

Future collision geometry shares the scene root transform and dataset revision. Replace its reference alongside the splat; never retain collision geometry from the previous scene. Do not implement collision loading in the initial prototype merely because its optional metadata exists.

## Walking design

**Content preparation:** Supply a simplified static mesh, preferably a GLB, authored or generated offline from the capture. Inspect floors, stairs, doorways, ceilings, holes, and alignment. Record the matching capture revision, source/permissions, and feet-level safe spawn. Primitive colliders are an option for deliberately simple test scenes. A visual splat alone does not fulfill this design's collision-asset contract.

PlayCanvas provides [splat collision-generation tooling](https://developer.playcanvas.com/user-manual/splat-transform/collision/) and describes [collision shapes](https://developer.playcanvas.com/user-manual/physics/collision-shapes/). These are candidate tools for the later phase, not evidence that this project's assets or physics are already validated.

**Controller:** Use a capsule representing body clearance, with gravity, ground contact, slope and step limits, head clearance, and wall sliding. Resolve the requested displacement before updating the player rig. Prevent tunneling through thin geometry with swept/continuous movement or validated substeps supported by the selected controller. Prefer an existing supported controller over writing a physics engine; select the dependency after a desktop and Quest feasibility check.

**Input ownership:** Desktop keys and VR sticks produce movement intent. Fly applies normalized movement directly through the player rig; Walk resolves it through the collision controller first. Avatar rendering never participates in movement resolution. Keep one rig as the pose owner; do not let physics and XR both overwrite the tracked head camera.

**Enablement:** No collision asset, invalid transform/spawn, or failed collider load means Walk unavailable with an explanation. Fly still works. Switching from Fly to Walk places the body at the validated safe spawn, with a VR fade. Switching to Fly clears accumulated walking velocity. Loading another scene disposes the old collider/controller and disables Walk until the new pair is ready.

**VR physical offsets:** Test room-scale movement and head-pivot turns relative to the capsule. Collision can constrain artificial locomotion, not real physical movement. Before shipping Walk, specify and test the response when the head crosses a virtual wall (for example a fade/obstruction cue) and how normal viewing resumes. Avoid forcing a tracked camera pose to match a collider correction.

**Parameters to establish in that phase:** Capsule radius/height and head offset, gravity, slope limit, maximum step height, ground tolerance, movement substep/sweep strategy, and safe spawn clearance. Keep them in walking configuration, measured in meters; validate on both desktop and Quest instead of copying arbitrary defaults into the prototype.

## Walking acceptance before enabling the mode

- Walk on a floor without sinking/floating; fall under gravity where appropriate.
- Stop/slide at walls; pass through valid doorways; respect ceilings and low obstacles.
- Accept/reject stairs and slopes at the configured thresholds.
- Prevent tunneling during fast movement and frame stalls.
- Validate and reset to a supported, unblocked safe spawn.
- Missing or failed collision data disables Walk, without disabling Fly.
- Swapping source, scale, or revision cannot retain a stale collider or spawn.
- Physical head offsets, snap turns, artificial movement, reset fade, and obstruction recovery behave predictably on Quest.
- Collision remains stable when visual splat quality changes or chunks stream out.
- Controller/collider cleanup does not accumulate resources across scene reloads.

## Avatar attachment later

Use the existing player rig as the future avatar attachment seam. Its root represents body/world origin; its camera represents the tracked head, not the body's center. A later avatar module consumes body/head/controller poses and animation intent, and owns only the model and presentation. It must not import scene URLs, move the camera, or resolve walking collision.

Before adding the first avatar, decide model format/rig, body-to-head offsets, feet alignment, animation from actual motion, first-person head/body visibility, and controller tracking-loss behavior. In VR, do not parent the whole body directly to head pitch/roll. Desktop animation can start with idle/walk/fly states; inverse kinematics is a separate choice.

No avatar framework, empty avatar module, network protocol, or multiplayer architecture is needed in the initial prototype. Networking and remote avatars require a later specification; keeping local pose ownership clear is sufficient preparation now.
