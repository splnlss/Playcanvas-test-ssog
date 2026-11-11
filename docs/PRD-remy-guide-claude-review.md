# Claude review of the Remy guide PRD

Date: 2026-11-11  
Reviewer: Claude Code, `claude-fable-5-1`  
Mode: tool-less review; supplied documents and source snapshots only  
Reviewed document: [Remy guide PRD](PRD-remy-guide.md)  
Status: Review complete; Claude recommends revisions before implementation planning. Requirements have not been revised in response to this review.

## Review inputs and limits

Claude received the complete Remy PRD, broader avatar PRD, guide integration design, walking/collision requirements, recording provenance, and current sequence/configuration/placement source, with line numbers. It did not inspect the running viewer, rendered animations, source FBXs, or headset performance. The viewer PRD was not included in its input; see the verification notes below for that qualification. References in the response describe the snapshots supplied to Claude.

## Claude's response (verbatim)

# Remy guide PRD review

**Verdict: revise first.** The document is close, but five items would send implementation planning in the wrong order or leave acceptance unmeasurable: the collision prerequisite is unstated, the sit clip is prepared before the seat is measured, two required clips do not exist yet, displacement ownership for the sit/stand clips is undefined, and the performance gate references a number no supplied document contains.

## Findings (by severity)

### R1 (High, blocker): Collision for the guide area is a prerequisite the PRD never schedules
- **Where:** `docs/PRD-remy-guide.md:50`, `:63`, `:92`, `:103-104`, `:122`, `:132-135`
- **Impact:** Walk-from-resolved-travel, obstruction stops, swept sit/stand validation, blocked stand clearance, and the "Scene safety" acceptance row all require an aligned collider and a movement controller. Neither exists, and the delivery checkpoints do not include producing them, so checkpoint 2 cannot start as written.
- **Evidence:** The design records that real collision is absent (`docs/superpowers/specs/2026-11-11-avatar-guide-design.md:11`), and the walking plan defers controller selection to a desktop/Quest feasibility check (`docs/walking-and-avatars.md:30`). The current sequence is explicitly not a collision controller (`src/guide/sequence.ts:16`).
- **Recommend:** Add a checkpoint 0 or an explicit prerequisite on checkpoint 2: "Guide-area collision mesh (aligned to the Ronda scan revision) and the selected movement controller are ready, per walking-and-avatars.md." State the minimum capability the guide actually needs for this increment (see open decision 1), so the implementation plan does not inherit the entire walking phase by accident.

### R2 (High, blocker): Sit clip preparation is ordered before the seat height and floor are measured
- **Where:** `docs/PRD-remy-guide.md:25`, `:60`, `:90`, `:132-133`
- **Impact:** Whether "Sitting Down Arms Outside Armrests" can be edited to fit, or must be replaced, depends on the real pipe-top height above the real floor. Checkpoint 1 prepares clips; checkpoint 2 calibrates the pipe. That is backwards and risks reworking the clip and the facial export.
- **Evidence:** The two floor references already disagree: placement origin y is 0.25 while the shadow ground is 0.42 (`src/guide/placement.ts:8`). Inference: the difference of 0.17 m means at least one is not the feet level, so the effective seat height is somewhere between roughly 0.60 and 0.77 m, which is far from a chair sit and affects clip choice.
- **Recommend:** Split checkpoint 1 into "1a: measure floor level, pipe-top height, pipe radius, and approach clearance in the scan and record them" and "1b: prepare body asset and clips against those measurements." Add the floor/shadow discrepancy as a named item to resolve in 1a. Make line 60 reference the recorded measurement rather than "the pipe's measured height" in the abstract.

### R3 (High, blocker): Required seated-idle and stand-up clips are not acquired, and the proposed fallbacks conflict with other requirements
- **Where:** `docs/PRD-remy-guide.md:23-26`, `:62`, `:68`, `:41`
- **Impact:** The content contract fails validation when idle/walk/sit-down/seated/stand-up mappings are missing (`docs/PRD-avatar.md:54`, design `:37`). Only walk, sit-down, and standing idle were downloaded. "Hold the final sit frame" produces a frozen body for 30 seconds, which contradicts the seated breathing and head-movement requirement at line 68. "Reverse the sit clip" cannot produce the forward lean and weight transfer required at line 41 unless reviewed as a distinct clip.
- **Recommend:** Add seated idle and stand-up to the Starting evidence table as "not yet acquired" and to checkpoint 1b as mandatory outputs. Replace line 62 with a decision rule: acquire dedicated clips first; hold-frame and reversal are permitted only with an added breathing layer and only if visual review passes, and that review is recorded as acceptance evidence. Do not let the asset validation accept a missing seated clip.

### R4 (High, blocker): Displacement ownership during sit and stand is undefined
- **Where:** `docs/PRD-remy-guide.md:54`, `:62`, `:63`
- **Impact:** The walk clip is In Place; the sit clip is not. Its Hips bone carries the backward/downward motion. The PRD says one adapter owns world position and that displacement must not apply twice, but it does not say which source drives the seating displacement, so an implementer could either strip the hip translation or freeze the root, with different route anchors in each case.
- **Evidence:** The current runtime applies a mannequin-specific slide of 0.6 m and a hip-height blend during the sit (`src/guide/placement.ts:17`, `:20`), which line 59 correctly declares invalid for Remy. The design requires authored seating displacement to be applied once through the movement authority (design `:25`). Transition completion is currently a fixed timer (`src/guide/config.ts:11`, `src/guide/sequence.ts:99-101`), not clip completion.
- **Recommend:** Add to "Sitting and standing": "Sit/stand clips are exported with hip XZ translation removed; the movement adapter applies the measured seat offset once, from the approach anchor to the seated anchor, timed to clip playback. Transition completion is reported from clip end, not a configured duration." If the alternative (root frozen, clip carries displacement) is chosen, state it instead; either is fine, but pick one.

### R5 (High): The performance gate is referenced, not established, so the acceptance row is untestable
- **Where:** `docs/PRD-remy-guide.md:112`, `:126`
- **Impact:** "Confirm the documented viewer performance gate" cannot pass or fail. No supplied document names the refresh target, the quality preset, or a tolerance. The avatar PRD says budgets are set from the measurements (`docs/PRD-avatar.md:175`, `:187`; design `:141`), which makes the Remy row circular: measure, derive the budget, then confirm the budget.
- **Evidence:** The viewer PRD that would hold the target was not supplied; I cannot confirm it exists. The 5,000 to 10,000 triangle figures at line 108 are copied from the MPFB evaluation targets (design `:68`), which are labelled proposed, not measured.
- **Recommend:** Replace line 126 with a pass criterion that can be filled in before checkpoint 4: "On the named Quest device at the documented preset and refresh target T, avatar-on frame time during walk and seated speech stays within the viewer's existing frame budget, with the avatar-off/on delta and dropped-frame share recorded." Add "T and the preset are recorded in this PRD before checkpoint 4 begins" so the number is written down once, not inferred. Clarify that the triangle/material figures are targets and that exceeding them is acceptable only if the measured gate still passes.

### R6 (Medium): Start gating contradicts the permitted body-only preview
- **Where:** `docs/PRD-remy-guide.md:36`, `:82`
- **Impact:** Line 36 withholds Start until facial mappings validate. Line 82 permits a labelled body preview before facial work is done. Under line 36 that preview can never be started.
- **Recommend:** State that the body preview is a separately selected mode, like the synthetic fixture flag, that skips only the facial validation, is visibly labelled, and does not count toward any acceptance row. Keep line 36 as the production rule.

### R7 (Medium): Blinks require facial controls the preparation scope does not include
- **Where:** `docs/PRD-remy-guide.md:68`, `:79`, `:30`
- **Impact:** Remy has no facial shape keys. The authored morph list is neutral, A, E, O, M. "Occasional natural blinks" needs eyelid shapes or bones that are not listed, so either the requirement is unmet or the asset scope silently grows.
- **Recommend:** Either add "blink" to the authored shape list at line 79 and to the asset acceptance row, or change line 68 to "blinks are optional for this increment." Given the user's priority on a light asset and explicit facial scope, make it optional.

### R8 (Medium): The production viseme vocabulary and the morph/decimation order are not decided
- **Where:** `docs/PRD-remy-guide.md:79`, `:81`, `:108`, `:132`
- **Impact:** The four-shape set was a simplification for the mannequin and the README says it is not facial-rig acceptance (`public/guide/README.md:22`). The PRD inherits it as the target without saying so is a decision. Separately, reducing roughly 35k triangles to 5–10k and merging six materials into one or two must happen before shape keys are sculpted, or the shapes are destroyed; the PRD does not order these steps, and a heavily decimated face may lack the vertices to form shapes at all.
- **Recommend:** Add to line 79: "The accepted Remy vocabulary is [chosen set]; the Rhubarb mapping is revised to it." Add to checkpoint 1b an ordered pipeline: decimate and atlas, verify face-region density, sculpt shapes, export, verify GLB morph names and body clips survive export. Note that the 0.10 s mouth lead (`public/guide/README.md:25`) was tuned on the mannequin and must be re-reviewed on Remy.

### R9 (Medium): "Plausible foot repositioning" on turns is not supported by any acquired clip
- **Where:** `docs/PRD-remy-guide.md:37`, `:52`
- **Impact:** The route has a right-angle turn and a final 180° turn to face away from the pipe (`src/guide/sequence.ts:97`; design `:83`). With only an in-place walk and a standing idle, an in-place pivot will skate. The requirement as worded is a quality bar with no asset behind it and no measurable test.
- **Recommend:** Reword to a testable criterion: "During the align turn, no visible foot skating in the side and oblique recordings; if blending idle/walk cannot achieve this, acquire a turn-in-place clip or shorten the turn by revising the approach heading." Mark the turn clip as a conditional acquisition in checkpoint 1b.

### R10 (Low): Inherited acceptance scope is narrowed or tightened without saying so
- **Where:** `docs/PRD-remy-guide.md:77`, `:123`, `:114`
- **Impact:** The Speech row drops seek, rate changes, and replay, which the avatar PRD requires (`docs/PRD-avatar.md:193`). Line 13 says shared requirements still apply, so the rows disagree. In the other direction, line 114 makes shadow quality a requirement while the avatar PRD calls a contact shadow optional (`docs/PRD-avatar.md:173`).
- **Recommend:** Either add "seek, rate, replay checks inherited from the avatar PRD speech row" to line 123, or explicitly exclude them for this increment. Reword line 114 to "the existing projected shadow must not mask alignment errors" and keep believability as review guidance, not a gate.

## Open decisions (need the user)
1. **Minimum collision capability for this increment.** Full capsule controller per the walking plan, or an offline-validated route against the guide-area collider plus a runtime sweep for obstruction and stand clearance. This decides how much of the walking phase enters the critical path (R1).
2. **Source of seated-idle and stand-up clips.** Download additional Mixamo clips through the user's signed-in session, or author them in Blender from the sit clip. The download route needs the user (R3).
3. **Production viseme set for Remy.** Keep the four-shape vocabulary already cued, or author the fuller Rhubarb set and regenerate the mapping (R8).

## Strengths and retained decisions
- The missing facial rig is stated as a hard dependency with no jaw-only or amplitude fallback, matching the avatar PRD and the user's priority.
- Speech timing uses the audio playback clock and standing waits for successful completion, consistent across all three documents.
- Performance figures are honestly labelled as preparation targets, and the avatar-off/on measurement protocol preserves the manual quality preset.


## Host verification notes

- **R1–R4:** The current implementation is a procedural preview without collision-backed guide movement. The missing clip acquisitions and mannequin-specific placement also remain real integration work. These are planning dependencies, not evidence of a failed Remy runtime: no Remy runtime exists yet.
- **R2:** The `0.25` origin and `0.42` shadow ground are provisional values with different purposes. Their difference identifies a calibration question; it does not establish a measured interval for floor or seat height. Measure the actual pipe/floor before preparing final clips.
- **R5:** The [viewer PRD](PRD.md) does contain measurement targets: 60 FPS on the reference desktop and 72 FPS on Quest 3 at 72 Hz. It explicitly treats them as measurement targets and allows expensive presets to fall short. Claude did not receive that file. Its concern about a missing concrete Remy release gate remains valid; its broader statement about absent numbers must be read with that input limitation.
- **R3/R6/R9:** The Remy PRD already makes hold-frame/reversed clips conditional on visual review, labels body previews separately, and requires foot-contact review. The useful clarification is to name the missing outputs and preview boundaries explicitly; the review does not establish that these candidate approaches are impossible.
- **R8:** The recording provenance confirms a current 0.10-second facial cue lead. This was not measured on Remy and requires revalidation with its future facial rig. Preserve adequate facial geometry through optimization before finalizing mouth shapes.
- **Open decisions:** Downloading more Mixamo clips is already authorized by the user's selected workflow and the available signed-in session. It does not inherently require another user approval. Collision implementation and facial vocabulary should first be resolved against the agreed shared requirements and visual evidence; escalate only a material scope or quality tradeoff.

No runtime, animation, collision, or performance acceptance is claimed by this review.
