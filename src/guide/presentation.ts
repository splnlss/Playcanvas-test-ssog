import { BLEND_NORMAL, Color, Entity, StandardMaterial, Texture, type Application } from 'playcanvas';
import { createGuideShadow } from './shadow';
import type { GuidePose } from './sequence';
import { worldGuidePose, type GuidePlacement } from './placement';

/** Owned procedural stand-in. This is not the licensed production GLB/rig. */
export function createGuidePresentation(app: Application, fixture: boolean, placement: GuidePlacement) {
  const root = new Entity('guide-prototype'); app.root.addChild(root);
  const materials: StandardMaterial[] = [];
  const bodyParts: Entity[] = [];
  const material = (r: number, g: number, b: number, lit = false) => {
    const m = new StandardMaterial(); m.useLighting = lit; m.diffuse = new Color(r, g, b); m.emissive = new Color(r * (lit ? 0.5 : 1), g * (lit ? 0.5 : 1), b * (lit ? 0.5 : 1));
    m.blendType = BLEND_NORMAL; m.update(); materials.push(m); return m;
  };
  const suit = material(0.13, 0.55, 0.6, true), skin = material(0.85, 0.66, 0.48, true), dark = material(0.025, 0.05, 0.07, true);
  const part = (parent: Entity, name: string, type: 'box' | 'sphere' | 'cylinder' | 'plane', size: number[], position: number[], mat: StandardMaterial) => {
    const e = new Entity(name); e.addComponent('render', { type, material: mat });
    e.setLocalScale(size[0], size[1], size[2]); e.setLocalPosition(position[0], position[1], position[2]); parent.addChild(e); bodyParts.push(e); return e;
  };
  const joint = (parent: Entity, name: string, x: number, y: number, z = 0) => {
    const e = new Entity(name); parent.addChild(e); e.setLocalPosition(x, y, z); return e;
  };
  const hips = joint(root, 'hips', 0, 1.02);
  part(hips, 'pelvis', 'box', [0.32, 0.22, 0.23], [0, 0, 0], suit);
  part(hips, 'torso', 'box', [0.4, 0.42, 0.24], [0, 0.3, 0], suit);
  const head = joint(hips, 'head', 0, 0.62);
  part(head, 'head-mesh', 'sphere', [0.28, 0.33, 0.27], [0, 0, 0], skin);
  for (const x of [-0.065, 0.065]) part(head, 'eye', 'sphere', [0.035, 0.035, 0.025], [x, 0.035, 0.125], dark);
  const mouth = part(head, 'mouth-preview', 'sphere', [0.085, 0.012, 0.018], [0, -0.072, 0.13], dark);
  const legs = [-1, 1].map(side => {
    const thigh = joint(hips, 'thigh', side * 0.095, 0);
    part(thigh, 'upper-leg', 'box', [0.135, 0.48, 0.14], [0, -0.24, 0], suit);
    const shin = joint(thigh, 'knee', 0, -0.48);
    part(shin, 'lower-leg', 'box', [0.11, 0.48, 0.12], [0, -0.24, 0], dark);
    part(shin, 'foot', 'box', [0.14, 0.08, 0.25], [0, -0.48, 0.06], dark);
    return { thigh, shin };
  });
  const arms = [-1, 1].map(side => {
    const arm = joint(hips, 'shoulder', side * 0.27, 0.46);
    part(arm, 'arm', 'box', [0.1, 0.48, 0.11], [0, -0.24, 0], suit);
    part(arm, 'hand', 'sphere', [0.11, 0.14, 0.11], [0, -0.52, 0], skin);
    return arm;
  });
  const shadow = createGuideShadow(app, bodyParts, placement);
  const fixtureRoot = new Entity('guide-fixture'); app.root.addChild(fixtureRoot);
  // Diagnostic geometry exists only in the explicitly selected fixture mode.
  if (fixture) {
    const floor = material(0.11, 0.15, 0.18), pipe = material(0.34, 0.39, 0.42);
    part(fixtureRoot, 'test-ground', 'box', [14, 0.1, 12], [0, -0.05, 0], floor);
    const cylinder = part(fixtureRoot, 'test-pipe', 'cylinder', [0.6, 3, 0.6], [0, 0.3, 0], pipe); cylinder.setLocalEulerAngles(0, 0, 90);
  }
  const captionImage = document.createElement('canvas'); captionImage.width = 1024; captionImage.height = 128;
  const ctx = captionImage.getContext('2d')!;
  const texture = new Texture(app.graphicsDevice, { mipmaps: false });
  const captionMat = material(1, 1, 1); captionMat.emissiveMap = texture; captionMat.update();
  const caption = part(root, 'guide-caption', 'plane', [2.5, 1, 0.3125], [0, 2.15, 0], captionMat);
  caption.setLocalEulerAngles(90, 0, 0); caption.enabled = false;
  let text = '';
  return {
    root, head,
    setEnabled(value: boolean) { root.enabled = value; shadow.setEnabled(value); },
    render(pose: GuidePose, weights: Record<string, number>, captionText: string, dt: number) {
      const b = pose.seated * pose.seated * (3 - 2 * pose.seated);
      const world = worldGuidePose(pose, placement);
      root.setPosition(...world.position); root.setEulerAngles(0, world.yaw, 0);
      hips.setLocalPosition(0, world.hipHeight, 0);
      const swing = pose.moving ? Math.sin(pose.distance * 9) * 25 * (1 - b) : 0;
      legs.forEach(({ thigh, shin }, i) => {
        const step = swing * (i ? -1 : 1);
        thigh.setLocalEulerAngles(-65 * b + step, 0, 0); shin.setLocalEulerAngles(65 * b + Math.max(0, -step), 0, 0);
      });
      arms.forEach((arm, i) => arm.setLocalEulerAngles(-35 * b - swing * (i ? -1 : 1) * 0.6, 0, 0));
      const a = weights.A ?? 0, e = weights.E ?? 0, o = weights.O ?? 0, m = weights.M ?? 0;
      mouth.setLocalScale(0.085 + e * 0.045 - o * 0.04, 0.012 + a * 0.065 + o * 0.05 - m * 0.008, 0.018);
      for (const mat of [suit, skin, dark, captionMat]) { mat.opacity = pose.opacity; mat.update(); }
      shadow.render(dt, pose.opacity);
      caption.enabled = !!captionText;
      if (captionText !== text) {
        text = captionText; ctx.fillStyle = '#102028'; ctx.fillRect(0, 0, 1024, 128);
        ctx.fillStyle = '#fff'; ctx.font = '30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 512, 76, 980); texture.setSource(captionImage);
      }
    },
    destroy() { shadow.destroy(); root.destroy(); fixtureRoot.destroy(); texture.destroy(); materials.forEach(m => m.destroy()); },
  };
}
