import { expect, it } from 'vitest';
import { backendOptions } from '../src/backend';

it('prefers WebGPU automatically only when the immersive bridge is exposed', () => {
  expect(backendOptions('', { webgpu: true, webgpuXr: true, immersiveVr: true }).deviceTypes).toEqual(['webgpu', 'webgl2']);
  expect(backendOptions('', { webgpu: true, webgpuXr: false, immersiveVr: true }).deviceTypes).toEqual(['webgl2']);
  expect(backendOptions('', { webgpu: false, webgpuXr: true, immersiveVr: true }).deviceTypes).toEqual(['webgl2']);
});
it('allows explicit comparison without losing the scene query parameter', () => {
  expect(backendOptions('?scene=ronda&backend=webgl2', { webgpu: true, webgpuXr: true, immersiveVr: true }).deviceTypes).toEqual(['webgl2']);
  expect(backendOptions('?backend=webgpu', { webgpu: true, webgpuXr: false, immersiveVr: true }).deviceTypes).toEqual(['webgpu', 'webgl2']);
});
it('falls back when WebGPU is unavailable and rejects invalid choices', () => {
  expect(backendOptions('?backend=webgpu', { webgpu: false, webgpuXr: false, immersiveVr: true }).deviceTypes).toEqual(['webgl2']);
  expect(() => backendOptions('?backend=unknown', { webgpu: true, webgpuXr: true, immersiveVr: true })).toThrow('backend');
});

it('uses WebGPU on desktop without requiring the immersive bridge', () => {
  expect(backendOptions('', { webgpu: true, webgpuXr: false, immersiveVr: false }).deviceTypes).toEqual(['webgpu', 'webgl2']);
});
