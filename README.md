# PlayCanvas streaming SOG viewer

Current state: **local-rendering prototype implemented**, with headset acceptance checks still pending. The user confirmed immersive entry on the connected Quest 3S. Claude reviewed the [implementation plan](docs/superpowers/plans/2026-11-10-sog-viewer.md); its [review](docs/implementation-plan-claude-review.md) is saved. See [validation](docs/prototype-validation.md) and [implementation review](docs/implementation-code-review.md). This viewer renders on the device opening the page. Mac remote-rendering research is a separate track.

## Run

Use a Node release supported by the pinned Vite version (this workspace was checked with Node 26.7.0).

```sh
npm ci
npm run prepare:sample
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
- **Quality:** Low/Medium/High use configurable 250k/500k/1M budgets. Desktop keeps its own 1M budget. The supplied scene has only 661,466 splats, so it cannot fully exercise the highest ceiling. Single SOG mode has no streamed LOD controls.
- **Optional Auto:** VR only; downshifts after 3 seconds below 90% of target refresh, upshifts after 10 seconds above 98%, with a 10-second cooldown. You can enable Auto on the page before entering VR or from the headset menu. Manual selection disables it; exiting VR switches it off. The readout is application FPS, not compositor timing; unavailable headset refresh uses a labeled 72 Hz fallback.

In-headset flight, menu selection, reset fade in both eyes, and live quality behavior still need manual verification on the updated implementation.

If floor-relative startup fails, use the explicit **Enter VR (local space)** retry. Its configured height offset is provisional and must be measured on the headset.

## Replace the model

Edit only `src/config.ts`:

- `source: { kind: 'streamed-sog', manifestUrl: 'https://your-host/scene/lod-meta.json' }` for prepared streamed SOG.
- `source: { kind: 'sog', url: 'https://your-host/scene.sog' }` for a single file, labeled non-streamed.

Add/update transform, starting camera/VR poses, attribution, and quality budgets in the same descriptor. Set `defaultSceneId` or open `?scene=your-id` after reloading the page. The supplied descriptors are `sample` and `single`. Cross-origin assets require CORS on both manifest and chunks. No uploads, conversion API, scene browser, or custom chunk scheduler is included.

Scene content uses its own transformed root; the player root remains in world meters. Starting poses are normalized world coordinates. Changing model scale must not change physical head tracking or locomotion scale. Keep a future collision mesh aligned with the content transform, not the player.

## Sample credits

**SA3D_R&D_XP47**, Stephane Agullo ([sa3d.fr](https://sa3d.fr)), [original scene](https://superspl.at/view?id=cdcec084), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Permission reference: [PlayCanvas apartment.txt](https://github.com/playcanvas/engine/blob/main/examples/assets/splats/apartment.txt).

The streamed derivative removes spherical harmonics and adds decimated LODs and spatial chunks. The single-file descriptor uses the original example SOG. Sample scale and floor offset are starting values, not a physical calibration.

## Remaining acceptance

Verify the updated controls in the headset, compare all three budgets on the same path, and test repeated entry/exit and a ten-minute session. A static HTTPS deployment and target Quest 3 performance test remain pending. [Walking collisions and future avatars](docs/walking-and-avatars.md) are planned separately. No collision solver, avatar implementation, or multiplayer is present.
