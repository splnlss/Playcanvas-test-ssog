export type Backend = 'auto' | 'webgpu' | 'webgl2';
export function backendOptions(search: string, support: { webgpu: boolean; webgpuXr: boolean; immersiveVr: boolean }) {
  const requested = new URLSearchParams(search).get('backend') ?? 'auto';
  if (requested !== 'auto' && requested !== 'webgpu' && requested !== 'webgl2') throw new Error('Unknown backend. Use auto, webgpu or webgl2.');
  const preferGpu = support.webgpu && (requested === 'webgpu' || requested === 'auto' && (!support.immersiveVr || support.webgpuXr));
  const deviceTypes: ('webgpu' | 'webgl2')[] = preferGpu ? ['webgpu', 'webgl2'] : ['webgl2'];
  return { requested, deviceTypes, webgpuXr: support.webgpuXr, immersiveVr: support.immersiveVr };
}
