import type { QualityProfile, SceneConfig } from './config';
export type Preset = 'low' | 'medium' | 'high';
export function createQuality(apply: (p: QualityProfile) => void, profiles: SceneConfig['vrProfiles']) {
  let preset: Preset = 'medium', auto = true, fps = 0;
  let seconds = 0, frames = 0, slow = 0, fast = 0, sinceChange = Infinity;
  const levels: Preset[] = ['low', 'medium', 'high'];
  const choose = (value: Preset) => { preset = value; slow = fast = 0; sinceChange = 0; apply(profiles[value]); };
  return {
    get state() { return { preset, auto, fps }; },
    select(value: Preset) { auto = false; choose(value); },
    setAuto(value: boolean) { auto = value; slow = fast = 0; sinceChange = Infinity; },
    onEnter() { fps = seconds = frames = slow = fast = 0; sinceChange = Infinity; apply(profiles[preset]); },
    update(dt: number, target: number) {
      if (!Number.isFinite(dt) || dt <= 0 || !Number.isFinite(target) || target <= 0) return;
      frames++; seconds += dt; sinceChange += dt;
      if (seconds >= 1 - 1e-9) { fps = frames / seconds; frames = seconds = 0; }
      if (!auto || fps === 0) return;
      slow = fps < target * 0.9 ? slow + dt : 0;
      fast = fps > target * 0.98 ? fast + dt : 0;
      const level = levels.indexOf(preset);
      if (sinceChange < 10 - 1e-9) return;
      if (slow >= 3 - 1e-9 && level > 0) choose(levels[level - 1]);
      else if (fast >= 10 - 1e-9 && level < 2) choose(levels[level + 1]);
    },
  };
}
export type QualityControls = ReturnType<typeof createQuality>;
