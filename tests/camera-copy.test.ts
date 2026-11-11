import { expect, it } from 'vitest';
import { cameraBookmark } from '../src/camera-copy';

it('exports the viewed camera and a matching desktop target in world coordinates', () => {
  const camera = { position: [1, 2, 3], rotation: [0, 0, 0, 1] } as const;
  const data = cameraBookmark('ronda', 'WebGPU', { position: [...camera.position], rotation: [...camera.rotation] }, { position: [0, 0, 0], rotation: [0, 0, 0, 1] }, false, null, 1.6);
  expect(data.desktop).toEqual({ position: [1, 2, 3], target: [1, 2, 0] });
  expect(data.renderer).toBe('WebGPU');
  expect(data.sceneId).toBe('ronda');
});
it('keeps the physical head offset out of the saved VR rig spawn and removes local-space height', () => {
  const data = cameraBookmark('ronda', 'WebGL2', { position: [4.3, 3.2, 2], rotation: [0, 0, 0, 1] }, { position: [4, 1.6, 2], rotation: [0, 1, 0, 0] }, true, 'local', 1.6);
  expect(data.camera.position).toEqual([4.3, 3.2, 2]);
  expect(data.vr.position).toEqual([4, 0, 2]);
  expect(Math.abs(data.vr.heading)).toBe(180);
  expect(data.mode).toBe('vr');
});
