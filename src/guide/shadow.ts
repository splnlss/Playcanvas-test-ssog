import { BLEND_NORMAL, Color, Entity, Quat, StandardMaterial, Texture, Vec3, type Application } from 'playcanvas';
import type { Vec3Tuple } from '../movement';
import type { GuidePlacement } from './placement';

/** Rays travel from upper-left toward lower-right in the authored opening view. */
export function sunRay(yaw: number): Vec3Tuple {
  const angle = yaw * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
  return [0.7 * c + 0.5 * s, -1, -0.7 * s + 0.5 * c];
}
export function projectSunShadow(point: Vec3Tuple, ground: number, ray: Vec3Tuple): Vec3Tuple {
  const distance = Math.max(0, point[1] - ground) / -ray[1];
  return [point[0] + ray[0] * distance, ground, point[2] + ray[2] * distance];
}
type Point = [number, number];
function hull(points: Point[]) {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const half = (list: Point[]) => {
    const result: Point[] = [];
    for (const p of list) { while (result.length > 1 && cross(result[result.length - 2], result[result.length - 1], p) <= 0) result.pop(); result.push(p); }
    return result;
  };
  const lower = half(sorted), upper = half(sorted.slice().reverse());
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Soft planar silhouette over the provisional floor; not scan-surface shadow mapping. */
export function createGuideShadow(app: Application, parts: Entity[], placement: GuidePlacement) {
  const ray = sunRay(placement.yaw), ground = (placement.shadowGroundY ?? placement.origin[1]) + 0.015;
  const sun = new Entity('guide-sun');
  sun.addComponent('light', { type: 'directional', color: new Color(1, 0.91, 0.76), intensity: 1.1, castShadows: false });
  sun.setRotation(new Quat().setFromDirections(Vec3.DOWN, new Vec3(...ray).normalize()));
  app.root.addChild(sun); sun.enabled = false;
  // Cache the caster bounds once; captions, eyes and mouth do not cast extra blobs.
  const casters = parts.filter(p => !['eye', 'mouth-preview'].includes(p.name)).map(entity => {
    const bounds = entity.render!.meshInstances[0].mesh!.aabb, center = bounds.center, half = bounds.halfExtents;
    const corners: Vec3[] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push(new Vec3(center.x + x * half.x, center.y + y * half.y, center.z + z * half.z));
    return { entity, corners };
  });
  const mask = document.createElement('canvas'), image = document.createElement('canvas');
  mask.width = mask.height = image.width = image.height = 256;
  const maskContext = mask.getContext('2d')!, ctx = image.getContext('2d')!;
  const texture = new Texture(app.graphicsDevice, { mipmaps: false });
  const material = new StandardMaterial();
  material.useLighting = false; material.emissive = new Color(0.025, 0.02, 0.015);
  material.opacityMap = texture; material.opacityMapChannel = 'a'; material.blendType = BLEND_NORMAL;
  material.depthWrite = false; material.opacity = 0.32; material.update();
  const plane = new Entity('guide-sun-shadow');
  plane.addComponent('render', { type: 'plane', material, castShadows: false });
  app.root.addChild(plane); plane.enabled = false;
  let enabled = false, elapsed = 1;
  return {
    setEnabled(value: boolean) { enabled = value; sun.enabled = value; plane.enabled = false; },
    render(dt: number, opacity: number) {
      if (!enabled) return;
      plane.enabled = opacity > 0;
      material.opacity = 0.32 * opacity; material.update();
      elapsed += Math.max(0, Number.isFinite(dt) ? dt : 0);
      // The shadow follows body transforms; cap canvas uploads independently of XR FPS.
      if (elapsed < 1 / 30) return;
      elapsed = 0;
      const projected = casters.map(({ entity, corners }) => {
        const transform = entity.getWorldTransform();
        return hull(corners.map(corner => {
          const p = transform.transformPoint(corner, new Vec3());
          const shadow = projectSunShadow([p.x, p.y, p.z], ground, ray);
          return [shadow[0], shadow[2]] as Point;
        }));
      });
      const all = projected.flat(), padding = 0.14;
      const minX = Math.min(...all.map(p => p[0])) - padding, maxX = Math.max(...all.map(p => p[0])) + padding;
      const minZ = Math.min(...all.map(p => p[1])) - padding, maxZ = Math.max(...all.map(p => p[1])) + padding;
      maskContext.clearRect(0, 0, 256, 256); maskContext.fillStyle = '#000';
      for (const polygon of projected) {
        maskContext.beginPath();
        polygon.forEach((p, i) => {
          const x = (p[0] - minX) / (maxX - minX) * 256, y = (p[1] - minZ) / (maxZ - minZ) * 256;
          if (i) maskContext.lineTo(x, y); else maskContext.moveTo(x, y);
        });
        maskContext.closePath(); maskContext.fill();
      }
      ctx.clearRect(0, 0, 256, 256); ctx.filter = 'blur(4px)'; ctx.drawImage(mask, 0, 0); ctx.filter = 'none';
      texture.setSource(image);
      plane.setPosition((minX + maxX) / 2, ground, (minZ + maxZ) / 2);
      plane.setLocalScale(maxX - minX, 1, maxZ - minZ);
    },
    destroy() { plane.destroy(); sun.destroy(); material.destroy(); texture.destroy(); },
  };
}
