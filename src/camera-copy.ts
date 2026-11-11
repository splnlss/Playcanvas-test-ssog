import { Quat, Vec3 } from 'playcanvas';
import type { Pose, Vec3Tuple } from './movement';
import type { SceneConfig } from './config';
import type { Viewer } from './viewer';

export function cameraBookmark(sceneId: string, renderer: string, camera: Pose, player: Pose, immersive: boolean, space: string | null, eyeHeight: number) {
  const forward = new Quat(...camera.rotation).transformVector(new Vec3(0, 0, -1));
  const rigForward = new Quat(...player.rotation).transformVector(new Vec3(0, 0, -1));
  const target: Vec3Tuple = [camera.position[0] + forward.x * 3, camera.position[1] + forward.y * 3, camera.position[2] + forward.z * 3];
  const feet: Vec3Tuple = [...player.position];
  if (immersive && space === 'local') feet[1] -= eyeHeight;
  if (!immersive) feet[1] = camera.position[1] - eyeHeight;
  return {
    sceneId, renderer, mode: immersive ? 'vr' : 'desktop', camera, player,
    desktop: { position: camera.position, target },
    vr: { position: feet, heading: Math.atan2(-rigForward.x, -rigForward.z) * 180 / Math.PI, localEyeHeight: eyeHeight },
  };
}

export function createCameraCopy(viewer: Viewer, scene: SceneConfig) {
  const button = document.getElementById('copy-camera') as HTMLButtonElement;
  const savedButton = document.getElementById('copy-saved-camera') as HTMLButtonElement;
  const output = document.getElementById('camera-json') as HTMLTextAreaElement;
  const details = document.getElementById('camera-details') as HTMLDetailsElement;
  const status = document.getElementById('camera-status')!;
  const storageKey = `sog-viewer:camera:${scene.id}`;
  let label = 'Copy camera';
  try { output.value = localStorage.getItem(storageKey) ?? ''; } catch { /* Clipboard/manual copy still work without storage. */ }
  savedButton.disabled = !output.value;
  const copySaved = () => {
    if (!output.value) return;
    // Start the clipboard request synchronously inside the click/controller gesture.
    let copying: Promise<void>;
    try { copying = navigator.clipboard.writeText(output.value); } catch { copying = Promise.reject(new Error('Clipboard unavailable')); }
    void copying.then(() => { label = 'Camera copied'; status.textContent = 'Camera JSON copied.'; }, () => {
      label = 'Camera saved · copy after exit';
      status.textContent = 'Clipboard blocked. Use Copy saved camera after exiting VR, or select the JSON and copy manually.';
      if (!viewer.xr.active) { output.focus(); output.select(); }
    });
  };
  const capture = () => {
    const head = viewer.player.camera, p = head.getPosition(), q = head.getRotation();
    const data = cameraBookmark(scene.id, viewer.backendLabel,
      { position: [p.x, p.y, p.z], rotation: [q.x, q.y, q.z, q.w] }, viewer.player.getPose(),
      viewer.xr.active, viewer.xr.spaceType, scene.vr.localEyeHeight);
    output.value = JSON.stringify(data, null, 2); details.open = true; savedButton.disabled = false;
    label = 'Camera saved'; status.textContent = 'Camera saved on this page.';
    try { localStorage.setItem(storageKey, output.value); } catch { /* JSON remains visible for manual copy. */ }
    copySaved();
  };
  button.addEventListener('click', capture); savedButton.addEventListener('click', copySaved);
  return { capture, get label() { return label; }, destroy() { button.removeEventListener('click', capture); savedButton.removeEventListener('click', copySaved); } };
}
