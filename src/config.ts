import type { Pose, Vec3Tuple } from './movement';

export type SplatSource = { kind: 'streamed-sog'; manifestUrl: string } | { kind: 'sog'; url: string };
export type QualityProfile = { splatBudget: number };
export type SceneConfig = {
  id: string;
  title: string;
  source: SplatSource;
  attribution: string;
  creditUrl: string;
  licenseUrl: string;
  transform: Pose & { scale: number };
  desktop: { position: Vec3Tuple; target: Vec3Tuple };
  vr: { position: Vec3Tuple; heading: number; localEyeHeight: number };
  orbitReentryDistance: number;
  flightSpeed: number;
  boostSpeed: number;
  snapAngle: number;
  desktopProfile: QualityProfile;
  vrProfiles: Record<'low' | 'medium' | 'high', QualityProfile>;
  walking?: { collisionMeshUrl: string; safeSpawn: Pose };
};

const apartment: Omit<SceneConfig, 'id' | 'title' | 'source'> = {
  attribution: 'SA3D_R&D_XP47 — Stephane Agullo (sa3d.fr), CC BY 4.0. Streamed sample: decimated/repacked; SH removed.',
  creditUrl: 'https://superspl.at/view?id=cdcec084',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  transform: { position: [0, 0, 0], rotation: [1, 0, 0, 0], scale: 1 },
  desktop: { position: [-3.8, -0.1, 7.2], target: [0, -0.1, 0] },
  vr: { position: [-3.8, -1.7, 7.2], heading: -28, localEyeHeight: 1.6 },
  orbitReentryDistance: 3, flightSpeed: 1.5, boostSpeed: 3, snapAngle: 30,
  desktopProfile: { splatBudget: 1_000_000 },
  vrProfiles: { low: { splatBudget: 250_000 }, medium: { splatBudget: 500_000 }, high: { splatBudget: 1_000_000 } },
};

export const defaultSceneId = 'sample';
export const scenes: Record<string, SceneConfig> = {
  sample: { ...apartment, id: 'sample', title: 'Apartment · streamed', source: { kind: 'streamed-sog', manifestUrl: '/sample/streamed/lod-meta.json' } },
  single: { ...apartment, id: 'single', title: 'Apartment · single SOG', source: { kind: 'sog', url: '/sample/apartment.sog' } },
};

export function resolveScene(search: string): SceneConfig {
  const id = new URLSearchParams(search).get('scene') ?? defaultSceneId;
  if (!Object.hasOwn(scenes, id)) throw new Error(`Unknown scene: ${id}. Use ?scene=sample or ?scene=single.`);
  return validateScene(scenes[id]);
}

export function validateScene(scene: SceneConfig): SceneConfig {
  const positive = (n: number) => Number.isFinite(n) && n > 0;
  const vector = (v: number[], n: number) => Array.isArray(v) && v.length === n && v.every(Number.isFinite);
  if (!scene.attribution.trim()) throw new Error('Scene attribution is required.');
  if (!scene.licenseUrl.trim()) throw new Error('Scene license reference is required.');
  if (!positive(scene.transform.scale)) throw new Error('Scene scale must be finite and positive.');
  if (!vector(scene.transform.position, 3) || !vector(scene.transform.rotation, 4) ||
      Math.hypot(...scene.transform.rotation) < 0.001) throw new Error('Scene transform is invalid.');
  if (!vector(scene.desktop.position, 3) || !vector(scene.desktop.target, 3) ||
      scene.desktop.position.every((v, i) => v === scene.desktop.target[i])) throw new Error('Desktop position/target is invalid.');
  if (!vector(scene.vr.position, 3) || !Number.isFinite(scene.vr.heading) || !positive(scene.vr.localEyeHeight)) throw new Error('VR starting pose is invalid.');
  if (![scene.orbitReentryDistance, scene.flightSpeed, scene.boostSpeed, scene.snapAngle].every(positive)) throw new Error('Movement settings must be positive.');
  const source = scene.source;
  if (source.kind !== 'streamed-sog' && source.kind !== 'sog') throw new Error('Unknown scene source kind.');
  const value = source.kind === 'streamed-sog' ? source.manifestUrl : source.url;
  let url: URL;
  try { url = new URL(value, 'https://viewer.invalid/'); } catch { throw new Error('Invalid source URL.'); }
  const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!value?.trim() || (url.protocol !== 'https:' && !localHttp) ||
      !(source.kind === 'sog' ? url.pathname.endsWith('.sog') : url.pathname.endsWith('/lod-meta.json'))) throw new Error('Invalid source URL or format.');
  const budgets = ['low', 'medium', 'high'].map(name => scene.vrProfiles[name as keyof typeof scene.vrProfiles].splatBudget);
  if (!positive(scene.desktopProfile.splatBudget) || !budgets.every(positive) ||
      (source.kind === 'streamed-sog' && !(budgets[0] < budgets[1] && budgets[1] < budgets[2]))) throw new Error('Scene budget profiles must be positive and ascending.');
  return scene;
}
