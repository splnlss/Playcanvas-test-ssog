# Claude PRD review

Date: 2026-11-10\
Reviewed document: `docs/PRD.md`\
Original independent review, preserved verbatim below. Subsequent decisions are tracked in `docs/PRD-review-resolution.md`.

**Verdict:** No blockers. The PRD is internally consistent with the approved scope, and delivery step 1 correctly front-loads the one real feasibility question. Six items need validation on the headset before the budgets and lifecycle sections are treated as settled, and three requirements add effort beyond what a simple prototype needs.

## Priority 1: facts requiring validation in delivery step 1

- **Runtime quality switching (Adjustable VR performance).** The PRD assumes the engine's streamed SOG LOD budget can be changed mid-session without reloading. Confirm which engine settings control the budget and that they take effect live. Minimal fix: add to step 1 "confirm hot-swappable budget knobs; if none exist, presets may use render resolution scale instead."
- **Graphics backend on Quest 3 (Technical approach).** WebXR on the Quest browser is reliably available with WebGL2. WebGPU plus immersive VR there is unconfirmed. Minimal fix: state WebGL2 as the planned backend and treat WebGPU as out of scope unless step 1 proves it.
- **Reported refresh rate (Adjustable VR performance).** The Auto target depends on the XR session exposing its frame rate. Confirm the engine or raw session surfaces it. The 72 FPS fallback already covers the negative case, so this is validation only.
- **Streaming state signal (Scene configuration and streaming).** "Refining scene…" requires knowing when chunk loading is in progress. Confirm the engine exposes this. If it does not, drop the message and keep only "Loading scene…".
- **Per-chunk failure and retry (Scene configuration and streaming).** "Failed chunks retain available content and expose Retry" assumes per-chunk error events and a re-request hook. Confirm these exist. If not, scope Retry to the initial manifest load, and let refinement errors show a non-blocking notice. The Failure acceptance row still passes because the interface remains recoverable.
- **World-space menu ray input (VR movement and menu).** Confirm the engine's element input works with XR controller rays. This is the largest VR build item; keep it to one panel and six controls.

## Priority 2: contradictions and gaps in acceptance criteria

- **Default scene not configurable (Scene configuration vs. Acceptance "Scene links").** The checklist tests a default scene, but the configuration list has no default scene field. Add one.
- **Desktop quality on VR exit (Adjustable VR performance / VR entry and lifecycle).** Entry applies a VR preset, but exit never says to restore desktop quality settings. Add "restore desktop quality settings on exit."
- **Reset view in Fly mode (Desktop interaction).** Unspecified whether Reset returns to Orbit or stays in Fly. Pick one. Returning to Orbit is simpler and matches the "recovery" intent.
- **"Usable target ahead" (Desktop interaction).** Define it as a fixed configured distance along the view direction. Otherwise the acceptance row for mode switching cannot be judged.
- **"Scene content is usable" gating Enter VR (VR entry and lifecycle).** Tie this to the same event that removes "Loading scene…" so there is one definition.
- **Auto toggle across exit and re-entry (Adjustable VR performance).** The preset persists within the page session, but the Auto state is unspecified. State that Auto resets to off on each entry, or persists with the preset.
- **Streaming acceptance depends on dataset size (Acceptance "Streaming").** A small sample may fully download before the 60-second route ends, making "new requests as flight changes viewpoint" untestable. Add "sample must be large enough that the route triggers chunk requests" to the sample selection criteria.
- **Desktop mode after VR exit (VR entry and lifecycle).** Specify that the previous Orbit or Fly mode is restored and pointer lock is not re-acquired automatically.

## Priority 3: scope that complicates the prototype

- **Reset fade (VR movement and menu).** Not in the approved list. Keep as optional polish. Instant reset is acceptable for the prototype.
- **Auto quality.** Already marked optional. Keep it last in step 4 and state it can be dropped without affecting acceptance of the three presets.
- **Comparison table and ten-minute soak (Acceptance checklist).** Both are fine as manual records. Clarify that "same 60-second flight route" is a described path, not an automated replay, so nobody builds a recorder.
- **Input mapping indices.** The X button and stick axes are stated as behaviors, which is correct. Button index assignments should stay implementation defaults validated on the controller, as you intended.

All approved features survive these changes. The only items I suggest shrinking are the per-chunk Retry and the fade, neither of which was explicitly approved.
