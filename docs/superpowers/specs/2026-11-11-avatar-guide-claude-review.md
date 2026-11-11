# Claude review of the avatar guide design

Date: 2026-11-11  
Reviewer: Claude CLI, claude-fable-5-1, tools disabled  
Scope: `docs/PRD-avatar.md` and `2026-11-11-avatar-guide-design.md`

The response below is preserved verbatim. Findings are recommendations, not approved design changes.

**Verdict: approve with revisions.** The design is consistent with the PRD on ownership, control semantics, and the audio-clock rule. No redesign is needed. Several contracts are underspecified in ways that block parallel content work or leave lifecycle gaps, and those should be fixed before the implementation plan is written. Viewer-independent work can start now once two schema decisions are made.

## High priority

- **Fix the canonical viseme vocabulary and cue file schema now.** `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:39` and `:71` defer the cue tool, which is fine, but the output format is also undefined. Offline cue generation, avatar facial mapping, and the validator at `:41` all depend on it. Recommend: name a fixed viseme set in the design, define cues as ordered intervals with start, end, viseme id, and weight in media seconds, and define the minimum subset an avatar mapping must cover to pass `docs/PRD-avatar.md:65`.

- **Define the authoring frame for route and seat data.** `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:38` requires a "transform convention matching the viewer", but the viewer does not exist in this checkout. Author route points, approach pose, seated pose, and clearance in the collision mesh's frame and record that mesh's revision and its transform to the splat. Otherwise route authoring cannot start, and `docs/PRD-avatar.md:53` scale independence has no reference frame.

- **Specify the one permitted collision exemption for seating.** `docs/PRD-avatar.md:132` forbids disabling collision globally, and the design at `:75` forbids hidden bypasses, but neither says how the capsule enters the pipe volume. State explicitly: between the validated approach pose and the validated seated pose, the movement authority runs an authored interpolation with the guide capsule's collision disabled, and re-enables collision only after the stand clearance check passes. Without this, implementers will improvise exactly the bypass the PRD bans.

- **Resolve what "reset" means for the guide.** `docs/PRD-avatar.md:134` says scene reset cancels the sequence. `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:29` says a camera reset does not restart the guide. These are compatible only if "scene reset" means reload. State the rule: camera or pose reset leaves the guide untouched, scene reload or replacement disposes the guide and returns it to ready without auto-starting.

## Medium priority

- **Seek, rate change, and replay have no control surface.** `docs/PRD-avatar.md:140` and `:191` require them, but the control list at `:56` exposes none. State in the design that these are test-harness and adapter capabilities only, and say how acceptance exercises them. Also define whether a seek past the end completes the speech checkpoint under `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:47`.

- **"Never accumulate a separate speech timer" is too absolute.** `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:67` rules out two standard techniques: deriving position from the audio context clock for Web Audio sources, and bounded extrapolation between coarse media currentTime samples. Both are still the audio clock. Rephrase as: position is always derived from the audio clock, resynced every sample, and any extrapolation is bounded and discarded on seek, pause, or rate change.

- **Replace last-wins coalescing with a precedence rule.** `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:61` says to retain the final requested operation. Stop followed by Pause would then leave the guide paused, not stopped. Define precedence as Restart over Stop over Pause, reject Pause from stopping or restarting, and add restarting and waiting-for-audio to the state list at `:49`.

- **Define Retry resumption on a route.** `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:58` retries movement from the current pose. The authored route needs a resumption rule, such as continue to the next unreached waypoint if the segment is traversable, otherwise fail.

- **Stand clearance has no obstruction source in Phase 1.** The viewer has no body until Phase 2 per `docs/PRD-avatar.md:38`, so only static geometry or the viewer camera can block standing. `docs/PRD-avatar.md:155` says stand "when clearance is available", while `:163` says fail and remain seated. Decide whether camera proximity counts and whether the guide waits briefly or fails immediately.

- **Prime the actual audio source in the Start gesture.** `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:53` unlocks sound, but walking takes long enough for transient activation to expire. Require resuming the audio context and, if a media element is used, calling play then pause on that element inside the handler. Also require Resume to call play synchronously in its handler so `:55` rarely triggers.

- **The audio listener must follow the active camera.** Positional voice per `docs/PRD-avatar.md:149` is wrong in direction after Orbit, Fly, or XR camera switches unless the listener moves. The design does not mention it.

## Low priority

- **Captions in XR are not covered.** `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:69` addresses controls only. State that captions render in-world in XR.
- **Gaze versus "must not consume tracked poses".** `docs/PRD-avatar.md:123` and `:151` read as conflicting. Clarify that gaze reads the active camera position as a target and never maps tracked poses onto guide bones.
- **"Audio duration coverage" at `:41` is ambiguous.** Gaps for silence must be allowed. Validate that no cue exceeds the loaded duration within a small tolerance and preload metadata before enabling Start.
- **Retry availability differs between `:49` and `:58`.** Always offer Retry on failure and let its revalidation decide.
- **Stale references.** `docs/PRD-avatar.md:6` and `:73` link to documents absent from this worktree. `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:11` names the sibling worktree differently from the current main branch name.
- **Hidden tab or XR blurred state.** Audio continues while the frame loop stops. Decide whether document hidden auto-pauses the sequence so the viewer does not miss speech.

## Intentionally deferred and acceptable

Audio implementation choice, cue generation tool, IK solver, depth proxy, fade technique, gaze limits, and numeric budgets are correctly left to implementation against the pinned engine. These are not defects.

## Work that can proceed before the viewer

The sequence controller, speech-clock sampler, and content validators at `docs/superpowers/specs/2026-11-11-avatar-guide-design.md:17` and `:90` can be built with fake adapters now. Rig selection, licensing, audio recording, transcript checking, and cue generation can also start once the schema findings above are settled. Split delivery step 1 at `:81` into a viewer-independent core plan now and an adapter plan later.

## Blocking questions

1. Which language and toolchain will the viewer use, so the core module can be built in the same build and test setup?
2. Does the viewer's camera position count as an obstruction for stand clearance, or is clearance static only in Phase 1?

## Host assessment

The proposed blanket capsule collision disablement during seating should not be adopted as written. The PRD requires avoiding unrelated obstacles throughout seating. Validate the full transition path against unrelated geometry and use a narrowly scoped seat-contact policy supported by the selected controller. The exact mechanism needs engine/controller validation.

The proposed switch to collision-local route authoring is an alternative, not a proven defect: the current design explicitly requires normalized world meters. Choose one documented convention and transformation path before content authoring; changing frames is not inherently necessary.

The suggested media-element play/pause priming needs browser/device validation and must not produce audible speech at Start before the speech checkpoint. Unlocking cannot be promised to survive all browser lifecycle changes; retain explicit Enable audio recovery.

The sibling worktree name in the design matches the inspected source path; it need not match this branch name. That particular stale-reference claim is unsupported. The missing local PRD links are real and already documented in the design.

No design or implementation changes were made as part of this review.
