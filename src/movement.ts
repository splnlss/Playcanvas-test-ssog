import { Quat, Vec3 } from 'playcanvas';

export type Vec3Tuple = [number, number, number];
export type Pose = { position: Vec3Tuple; rotation: [number, number, number, number] };

/** World yaw about the current head pivot, keeping room-scale offsets stationary. */
export function turnAroundPivot(root: Pose, head: Vec3Tuple, degrees: number): Pose {
  const yaw = new Quat().setFromAxisAngle(Vec3.UP, degrees);
  const pivot = new Vec3(...head);
  const offset = new Vec3(...root.position).sub(pivot);
  const position = yaw.transformVector(offset).add(pivot);
  const rotation = new Quat().mul2(yaw, new Quat(...root.rotation));
  return {
    position: [position.x, root.position[1], position.z],
    rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
  };
}

export function flightDelta(axes: Vec3Tuple, yaw: number, speed: number, dt: number): Vec3Tuple {
  if (!Number.isFinite(dt) || dt <= 0) return [0, 0, 0];
  const [right, up, forward] = axes;
  const step = speed * Math.min(dt, 0.05) / Math.max(1, Math.hypot(...axes));
  return [(right * Math.cos(yaw) - forward * Math.sin(yaw)) * step,
    up * step, (-right * Math.sin(yaw) - forward * Math.cos(yaw)) * step];
}
export function snapTurn(axis: number, armed: boolean) {
  if (Math.abs(axis) < 0.2) return { degrees: 0, armed: true };
  if (armed && Math.abs(axis) >= 0.7) return { degrees: axis > 0 ? -30 : 30, armed: false };
  return { degrees: 0, armed };
}
