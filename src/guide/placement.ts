import type { Vec3Tuple } from '../movement';
import type { GuidePose } from './sequence';

export type GuidePlacement = { origin: Vec3Tuple; yaw: number; seatHeight: number; shadowGroundY?: number };
const fixture: GuidePlacement = { origin: [0, 0, 0], yaw: 0, seatHeight: 0.6 };
// Authored from depth picks of the pipe in the user's saved Ronda opening view.
// The origin is below the seat contact, not the camera/player or splat root.
const ronda: GuidePlacement = { origin: [-2.2, 0.25, -3.55], yaw: -90, seatHeight: 0.77, shadowGroundY: 0.42 };
export function guidePlacement(sceneId: string, synthetic: boolean): GuidePlacement | undefined {
  if (synthetic) return fixture;
  return sceneId === 'ronda' || sceneId === 'ronda-full' ? ronda : undefined;
}

/** One rigid placement in world meters; seat contact sets the final pelvis bottom. */
export function worldGuidePose(pose: GuidePose, placement: GuidePlacement) {
  const blend = pose.seated * pose.seated * (3 - 2 * pose.seated);
  const x = pose.position[0], z = pose.position[2] - 0.6 * blend;
  const angle = placement.yaw * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
  const position: Vec3Tuple = [placement.origin[0] + c * x + s * z, placement.origin[1] + pose.position[1], placement.origin[2] - s * x + c * z];
  return { position, yaw: pose.yaw + placement.yaw, hipHeight: 1.02 * (1 - blend) + (placement.seatHeight + 0.11) * blend };
}
