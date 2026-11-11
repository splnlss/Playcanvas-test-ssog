# PlayCanvas streaming SOG viewer

Current state: **local-rendering prototype implemented**, with headset acceptance checks still pending. The user confirmed immersive entry on the connected Quest 3S. Claude reviewed the [implementation plan](docs/superpowers/plans/2026-11-10-sog-viewer.md); its [review](docs/implementation-plan-claude-review.md) is saved. See [validation](docs/prototype-validation.md) and [implementation review](docs/implementation-code-review.md). This viewer renders on the device opening the page. Mac remote-rendering research is a separate track.

## Run

Use a Node release supported by the pinned Vite version (this workspace was checked with Node 26.7.0).

```sh
npm ci
npm run prepare:sample
npm run prepare:ronda
npm run dev
```

Open `http://localhost:5173/`. Sample preparation downloads a public CC BY 4.0 scene and runs pinned SplatTransform 3.11.1 to create three LOD levels. This is offline content preparation, separate from the browser viewer. Generated files under `public/sample/` are ignored by Git. They must be prepared again on another machine before using the sample or building a preview with it.

```sh
npm test
npm run build
```

The production output is `dist/`. A build currently emits a large-chunk notice for the PlayCanvas engine bundle; it still completes. No deployment has been published.

## Connected Quest test

```sh
adb devices -l
adb reverse tcp:5173 tcp:5173
adb shell am start -a android.intent.action.VIEW -d http://localhost:5173/ -p com.oculus.browser
```

Keep USB connected and the server running. Select **Enter VR** in Quest Browser. The local URL avoids changing certificate trust or browser security flags. The device must expose immersive VR in that context; do not treat ADB connection as proof of XR support.

## Controls

- **Desktop Orbit:** left drag rotates, right drag pans, wheel zooms.
- **Desktop Fly:** select Fly, then click the scene. Mouse looks; WASD moves horizontally; Q/E moves down/up; Shift boosts from 1.5 to 3 m/s. Escape releases the mouse. Reset returns to Orbit.
- **VR:** left stick flies horizontally relative to head yaw. Right stick moves vertically or snap-turns 30°, using its dominant axis. Flight passes through geometry.
- **Headset menu:** press left X after entering VR. Flight pauses while the menu is open. Aim the right controller and press its trigger to select Reset, Exit, quality, or Auto. Reset uses a brief fade.
- **Quality:** Low/Medium/High use configurable 100k/250k/500k budgets and fixed foveation 0.8/0.5/0.2 where supported. VR starts with a 0.7 framebuffer scale multiplier (49% of the previous pixel area at the same device scale). Resolution changes require leaving and re-entering VR. Desktop keeps its own 1M budget. The supplied scene has only 661,466 splats, so it cannot fully exercise the highest ceiling. Single SOG mode has no streamed LOD controls.
- **Optional Auto:** VR only; downshifts after 3 seconds below 90% of target refresh, upshifts after 10 seconds above 98%, with a 10-second cooldown. You can enable Auto on the page before entering VR or from the headset menu. Manual selection disables it; exiting VR switches it off. The readout is application FPS, not compositor timing; unavailable headset refresh uses a labeled 72 Hz fallback.

In-headset flight, menu selection, reset fade in both eyes, and live quality behavior still need manual verification on the updated implementation.

If floor-relative startup fails, use the explicit **Enter VR (local space)** retry. Its configured height offset is provisional and must be measured on the headset.

## Replace the model

Edit only `src/config.ts`:

- `source: { kind: 'streamed-sog', manifestUrl: 'https://your-host/scene/lod-meta.json' }` for prepared streamed SOG.
- `source: { kind: 'sog', url: 'https://your-host/scene.sog' }` for a single file, labeled non-streamed.

Add/update transform, starting camera/VR poses, attribution, and quality budgets in the same descriptor. Set `defaultSceneId` or open `?scene=your-id` after reloading the page. The supplied descriptors are `sample`, `single`, and `ronda`. Ronda Lobato is the default at `http://localhost:5173/` (also available via `?scene=ronda`); use `?scene=sample` for the apartment. Its SH0 metadata derivative is prepared locally by `npm run prepare:ronda`; geometry and base-color textures still stream from the supplied R2 host. The derivative only removes higher-order SH references; it does not decimate geometry or alter hosted files. Generated `public/ronda-sh0/` metadata is ignored by Git and must be prepared before building on another machine. Use `?scene=ronda-full` to compare the original hosted data with the earlier 1.0 VR scale, 250k/500k/1M budgets and no requested foveation. It has five LODs (4,922,690 splats at full detail; 196,908 at the coarsest level), so the current Low budget is close to its minimum scene-wide detail. Creator/license details were not supplied; the footer links to the source without claiming CC BY. Its starting desktop view and VR rig spawn use the user-provided camera bookmark; headset floor calibration still needs verification. Cross-origin assets require CORS on both manifest and chunks. No uploads, conversion API, scene browser, or custom chunk scheduler is included.

Scene content uses its own transformed root; the player root remains in world meters. Starting poses are normalized world coordinates. Changing model scale must not change physical head tracking or locomotion scale. Keep a future collision mesh aligned with the content transform, not the player.

## Sample credits

**SA3D_R&D_XP47**, Stephane Agullo ([sa3d.fr](https://sa3d.fr)), [original scene](https://superspl.at/view?id=cdcec084), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Permission reference: [PlayCanvas apartment.txt](https://github.com/playcanvas/engine/blob/main/examples/assets/splats/apartment.txt).

The streamed derivative removes spherical harmonics and adds decimated LODs and spatial chunks. The single-file descriptor uses the original example SOG. Sample scale and floor offset are starting values, not a physical calibration.

## Remaining acceptance

Verify the updated controls in the headset, compare all three budgets on the same path, and test repeated entry/exit and a ten-minute session. A static HTTPS deployment and target Quest 3 performance test remain pending. [Walking collisions and future avatars](docs/walking-and-avatars.md) are planned separately. No collision solver, production avatar GLB integration, or multiplayer is present. The procedural guide preview below is an initial implementation increment.

## Guide pose prototype

Open `http://localhost:5173/?guide=fixture` for synthetic ground and a pipe without downloading a splat scene. If 5173 is occupied, run `npm run dev -- --port 5180` and open `http://localhost:5180/?guide=fixture`. The normal Ronda page also exposes the guide preview, using the same provisional world coordinates.

Press **Start guide preview**. A temporary articulated mannequin enters from 4 m to the right of the approach centerline, walks to the pipe, turns toward the viewer and sits. It stops seated with an actionable message because the final recording/captions/mouth cues have not been supplied. There is no synthetic speech substituted. Start is one-shot; use Restart to return to the initial pose with a guide-only fade. Pause/Resume and Stop preserve stable poses; Retry retries the current failed checkpoint. Camera reset does not restart the guide; Reload scene recreates it without auto-starting.

Desktop controls include sound, volume, and captions. The same commands are available in the XR menu through **More controls** pages, with an in-world status area and guide captions. Hiding the page or losing XR visibility pauses the sequence; resumption is explicit. Headset interaction and positional audio still need device verification.

Edit `src/guide/config.ts` for the provisional route and optional `guideSpeech` package. Positions are meters, Y-up, pipe along X, +Z toward the opening viewer, +X to their right. The route is fixed in the world and never follows the camera. The synthetic pipe top is 0.6 m. Align all of these guesses to the real scan before relying on them. Prototype movement assumes flat, clear ground; it does not prevent collisions in a scanned scene.

A speech package has the following shape (files must be supplied):

```ts
{
  audioUrl: '/guide/voice.wav',
  audioRevision: 'final-recording-v1',
  cueAudioRevision: 'final-recording-v1',
  captions: [{ start: 0, end: 2, text: 'Checked transcript text' }],
  cues: [{ start: 0.2, end: 0.5, viseme: 'A', weight: 0.8 }]
}
```

Prepare cues offline from that exact recording. The prototype vocabulary is `neutral`, `A`, `E`, `O`, and `M`; timings are non-overlapping intervals in media seconds, with gaps allowed for silence. Audio and cue revisions must match, weights are 0–1, and timings must fit the loaded audio duration. This is a provisional vocabulary requiring validation against the selected production rig and cue generator. The adapter samples actual audio time for captions and facial weights, supports externally controlled seek/rate changes, and uses Web Audio positional routing attached to the guide head with the listener following the active camera. Muting preserves timing. The mannequin mouth is only a diagnostic visualization.

Blender and Theatre.js are recorded as future authoring candidates in the [guide design](docs/superpowers/specs/2026-11-11-avatar-guide-design.md). This preview does not complete Phase 1: licensed replaceable speech-capable GLBs, real collision/seat validation, final audio/cues, occlusion checks, and Quest performance acceptance remain open.

## Quest optimization status

The default Ronda path uses SH0 (no higher-order SH texture downloads), a 0.7 XR framebuffer scale multiplier, and budget/foveation presets. The in-headset readout shows the scale and the runtime-reported foveation; `N/A` means foveation is unsupported, and `*` after target Hz marks the 72 Hz fallback. The default and original comparison URLs both preserve the same scene transform/spawn.

Ronda's coarsest scene-wide LOD still has 196,908 splats: a 100k target cannot guarantee 100k drawn splats. A more aggressively decimated dataset would be required to reduce that content floor. Higher-order SH downloads are confirmed absent in the browser; improved Quest FPS still requires a fresh headset measurement. Exit VR, reload the page, select Low, and re-enter to test the new session resolution.

## WebGPU and WebGL2

Renderer **Auto** prefers WebGPU on desktop when available. On devices reporting immersive VR support, it also requires the `XRGPUBinding` bridge; otherwise it chooses WebGL2 so VR remains available. This uses runtime capabilities, not the browser user-agent. The renderer selector reloads the page while preserving the selected scene. `?backend=webgpu` explicitly tries WebGPU for comparison (including desktop 2D without the XR bridge), and `?backend=webgl2` forces WebGL2. Native device creation falls back to WebGL2 when WebGPU initialization fails. The renderer status and FPS readout identify the actual device, and the headset panel heading spells out WebGPU or WebGL2.

The connected Quest 3S Browser 156 exposed both WebGPU and XRGPUBinding and automatically selected WebGPU during runtime inspection. This does not by itself prove immersive rendering or improved FPS; enter VR and compare the same route/quality. If a WebGPU immersive request is rejected, choose WebGL2 and retry. No browser flags were changed.

Sources: [PlayCanvas XR bridge requirement](https://developer.playcanvas.com/user-manual/web-components/xr/), [Meta Browser 146 experimental WebGPU WebXR release](https://developers.meta.com/vr/downloads/package/browser/146.0/). The installed PlayCanvas 2.24 engine adds the required `webgpu` session feature automatically.

## Copy the current camera

Use **Copy camera** on the page, or open the headset menu with left X and select **Copy camera** using the right trigger. The exported JSON contains the scene, actual renderer, camera/player world poses, and `desktop` / `vr` configuration blocks. VR spawn data uses the rig's position/yaw, excluding physical head offsets; local-reference eye height is removed from the saved feet origin. The camera block separately records the exact tracked view.

The capture is retained in **Saved camera** on the page and in this browser's local storage per scene. If clipboard permission is unavailable inside VR, exit and use **Copy saved camera**, or select/copy the JSON manually. Copying captures a bookmark; it does not automatically overwrite the scene's configured defaults. Send the JSON to apply that view to the scene configuration.

To verify WebGPU while immersed, press **left X**: the panel heading reads **VIEWER · WebGPU** or **VIEWER · WebGL2**, based on the actual initialized graphics device. The page's renderer selector expresses preference; the heading/readout identify what is actually running.
