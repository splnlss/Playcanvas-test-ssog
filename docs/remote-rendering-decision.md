# Desktop-rendered splats streamed to Quest

Date: 2026-11-11\
Status: Separate research track; Mac preferred, Windows fallback available. Original local-rendering prototype continues independently.

## Confirmed intent

The desktop GPU renders the Gaussian splats. Quest receives stereo rendered views and returns tracked head/controller poses and user actions. The user reports that headset rendering is insufficient for their scenes. Do not treat this report as a measured claim about every possible splat scene.

The implementation so far streams asset chunks to the headset for local rendering; that is a baseline probe, not the requested solution. The user subsequently asked to resume the original implementation plan in its existing conversation and investigate remote rendering in a separate tab.

## Preserved requirements

- Replace prepared SOG models through configuration; distinguish single-file and chunked scene sources on the renderer.
- Desktop and headset viewing, basic flight, a VR button, and simple controls.
- Adjustable rendering quality for performance comparisons; splat budgets apply to the desktop, while encoded video resolution/bitrate are separate settings.
- Walking collision design before that later phase, and avatars later. Run authoritative scene collision on the renderer when walking is added.
- Keep the prototype small. First prove transport and tracked stereo presentation before building the remaining controls or adopting a large infrastructure stack.

## Host constraints and options

Observed local host: MacBook Pro, Apple M3 Pro, 36 GB RAM. Connected headset: Quest 3S.

NVIDIA documents browser-based CloudXR.js streaming with an NVIDIA GPU server running CloudXR Runtime and an OpenXR-compatible application. Its runtime server requirements list Windows/Linux. A normal PlayCanvas browser canvas is not automatically an OpenXR server application. This route needs both suitable hardware and an application integration feasibility check. Sources: [CloudXR.js architecture](https://developer.nvidia.com/blog/build-and-stream-browser-based-xr-experiences-with-nvidia-cloudxr-js/), [runtime requirements](https://developer.nvidia.com/blog/stream-high-fidelity-spatial-computing-content-to-any-device-with-nvidia-cloudxr-6-0/).

The official [ALVR compatibility table](https://github.com/alvr-org/ALVR) lists Windows/Linux and does not support macOS. This rules out assuming an official ALVR Mac server is available; it does not prove that all custom Mac streaming is impossible.

If the current Mac is mandatory, investigate a minimal custom transport: desktop PlayCanvas rendering driven by headset poses, low-latency stereo video transmission, and a lightweight Quest WebXR receiver. This is an unproven candidate, not an implementation commitment. Validate encode/decode support, eye projections/IPD, pose timestamps, presentation synchronization, and latency; establish whether local rotational correction is feasible and necessary. Do not promise comfortable VR based on flat screen sharing.

If a Windows/Linux NVIDIA host is available, evaluate an established XR streaming transport first and prove that the chosen renderer can supply the required stereo OpenXR output. No automatic migration to another graphics engine or cloud GPU spending is authorized.

## First feasibility gate for the replacement plan

1. Identify the renderer host and available graphics/encode capabilities.
2. Render a tiny stereo test scene on that host, driven by the real headset poses.
3. Deliver both eye views to Quest with correct eye projections and tracking.
4. Verify that no SOG/chunk assets are requested by Quest; the GPU-heavy scene work remains on the host.
5. Measure encode, network, decode/presentation delay where observable; record perceptual head-motion stability on hardware. Do not infer motion-to-photon latency from FPS alone.
6. Replace the test scene with a SOG scene and check interactive budget changes on the renderer.
7. Choose a transport and write the revised PRD/plan based on that evidence before implementing the full viewer.

User decision: prefer the current Mac; a Windows machine is available, GPU not yet established. A separate Codex tab received the research brief. It currently waits for user folder trust before research can run. Research output is scoped to docs/research/mac-vr-streaming.md. No supported remote-rendering path has been validated yet.
