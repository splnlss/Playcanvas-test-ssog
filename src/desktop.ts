import { Quat, Vec3 } from 'playcanvas';
import { flightDelta, type Pose, type Vec3Tuple } from './movement';
import type { SceneConfig } from './config';
import type { Viewer } from './viewer';

export function createDesktopInput() {
  const keys = new Set<string>();
  const flags = { enabled: true, focus: true, pointer: false };
  const active = () => flags.enabled && flags.focus && flags.pointer;
  return {
    get axes(): Vec3Tuple {
      if (!active()) return [0, 0, 0];
      const on = (key: string) => Number(keys.has(key));
      return [on('KeyD') - on('KeyA'), on('KeyE') - on('KeyQ'), on('KeyW') - on('KeyS')];
    },
    get boost() { return active() && (keys.has('ShiftLeft') || keys.has('ShiftRight')); },
    set(name: keyof typeof flags, value: boolean) { flags[name] = value; if (!value) keys.clear(); },
    key(code: string, down: boolean) { if (!down) keys.delete(code); else if (active()) keys.add(code); },
  };
}

export function orbitTarget(pose: Pose, distance: number): Vec3Tuple {
  const ahead = new Quat(...pose.rotation).transformVector(new Vec3(0, 0, -distance));
  return [pose.position[0] + ahead.x, pose.position[1] + ahead.y, pose.position[2] + ahead.z];
}
export type DesktopSnapshot = { pose: Pose; target: Vec3Tuple; mode: 'orbit' | 'fly' };

export function createDesktop(viewer: Viewer, scene: SceneConfig) {
  const { app, player } = viewer;
  const canvas = app.graphicsDevice.canvas as HTMLCanvasElement;
  const input = createDesktopInput();
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let mode: 'orbit' | 'fly' = 'orbit', enabled = true;
  let target = new Vec3(...scene.desktop.target);
  let dragging: number | undefined;
  let yaw = 0, pitch = 0, radius = 3;
  const readOrbit = () => {
    const offset = player.root.getPosition().clone().sub(target);
    radius = Math.max(0.1, offset.length()); yaw = Math.atan2(offset.x, offset.z);
    pitch = Math.asin(Math.max(-1, Math.min(1, offset.y / radius)));
  };
  const applyOrbit = () => {
    player.root.setPosition(target.x + radius * Math.cos(pitch) * Math.sin(yaw), target.y + radius * Math.sin(pitch), target.z + radius * Math.cos(pitch) * Math.cos(yaw));
    player.root.lookAt(target);
  };
  const release = () => {
    dragging = undefined; input.set('pointer', false);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  };
  const setMode = (next: typeof mode) => {
    if (next === mode) return;
    release(); mode = next;
    if (mode === 'orbit') { target = new Vec3(...orbitTarget(player.getPose(), scene.orbitReentryDistance)); readOrbit(); }
  };
  const setEnabled = (value: boolean) => { enabled = value; input.set('enabled', value); if (!value) release(); };
  const reset = () => {
    release(); mode = 'orbit'; target.set(...scene.desktop.target);
    player.root.setPosition(...scene.desktop.position); player.root.lookAt(target); readOrbit();
  };
  const restore = (snapshot: DesktopSnapshot) => {
    release(); mode = snapshot.mode; target = new Vec3(...snapshot.target); player.setPose(snapshot.pose); readOrbit();
  };
  canvas.addEventListener('contextmenu', e => { if (enabled) e.preventDefault(); }, options);
  canvas.addEventListener('pointerdown', e => {
    if (!enabled) return;
    if (mode === 'fly') {
      if (e.button === 0) canvas.requestPointerLock()?.catch(() => {});
    } else { dragging = e.button; canvas.setPointerCapture(e.pointerId); }
  }, options);
  canvas.addEventListener('pointerup', () => { dragging = undefined; }, options);
  canvas.addEventListener('pointercancel', () => { dragging = undefined; }, options);
  document.addEventListener('pointerlockchange', () => input.set('pointer', document.pointerLockElement === canvas), options);
  document.addEventListener('mousemove', e => {
    if (!enabled) return;
    if (mode === 'fly' && document.pointerLockElement === canvas) {
      const f = player.root.forward;
      const pitchDegrees = Math.asin(Math.max(-1, Math.min(1, f.y))) * 180 / Math.PI;
      const yawDegrees = Math.atan2(-f.x, -f.z) * 180 / Math.PI;
      player.root.setEulerAngles(Math.max(-85, Math.min(85, pitchDegrees - e.movementY * 0.15)), yawDegrees - e.movementX * 0.15, 0);
    } else if (mode === 'orbit' && dragging !== undefined) {
      if (dragging === 0) { yaw -= e.movementX * 0.005; pitch = Math.max(-1.48, Math.min(1.48, pitch + e.movementY * 0.005)); }
      else {
        const amount = radius * 0.0015;
        target.add(player.root.right.clone().mulScalar(-e.movementX * amount));
        target.add(player.root.up.clone().mulScalar(e.movementY * amount));
      }
      applyOrbit();
    }
  }, options);
  canvas.addEventListener('wheel', e => {
    if (!enabled || mode !== 'orbit') return;
    e.preventDefault(); radius = Math.max(0.1, Math.min(1000, radius * Math.exp(e.deltaY * 0.001))); applyOrbit();
  }, { ...options, passive: false });
  window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLElement && e.target.closest('input,select,textarea,button')) return;
    input.key(e.code, true);
    if (enabled && mode === 'fly' && document.pointerLockElement === canvas && ['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','Space'].includes(e.code)) e.preventDefault();
  }, options);
  window.addEventListener('keyup', e => input.key(e.code, false), options);
  window.addEventListener('blur', () => { input.set('focus', false); release(); }, options);
  window.addEventListener('focus', () => input.set('focus', true), options);
  const update = (dt: number) => {
    if (mode !== 'fly') return;
    const yawRadians = Math.atan2(-player.root.forward.x, -player.root.forward.z);
    player.move(flightDelta(input.axes, yawRadians, input.boost ? scene.boostSpeed : scene.flightSpeed, dt));
  };
  app.on('update', update); readOrbit();
  return {
    get mode() { return mode; }, setMode, setEnabled, reset, restore,
    snapshot(): DesktopSnapshot { return { pose: player.getPose(), target: [target.x, target.y, target.z], mode }; },
    destroy() { release(); abort.abort(); app.off('update', update); },
  };
}
export type DesktopControls = ReturnType<typeof createDesktop>;
