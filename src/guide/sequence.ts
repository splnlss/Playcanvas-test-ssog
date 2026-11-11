import type { Vec3Tuple } from '../movement';
import { prototypeGuide as config } from './config';

export type SpeechSnapshot = {
  status: 'idle' | 'playing' | 'paused' | 'waiting' | 'ended' | 'error';
  time: number; caption: string; weights: Record<string, number>; error: string;
};
export type GuideSpeech = {
  readonly snapshot: SpeechSnapshot;
  play(): Promise<void>; pause(): void; stop(): void; update(): void; destroy(): void;
};
export type GuidePose = { position: Vec3Tuple; yaw: number; seated: number; distance: number; moving: boolean; opacity: number };
export type GuideState = 'ready' | 'running' | 'pausing' | 'paused' | 'stopping' | 'stopped' | 'restarting' | 'failed' | 'completed' | 'disposed';
type Checkpoint = 'walk' | 'align' | 'sit' | 'talk' | 'stand' | 'done';

/** Prototype locomotion assumes a clear flat fixture. Not a collision controller. */
export function createGuideSequence(speech: GuideSpeech) {
  let state: GuideState = 'ready', checkpoint: Checkpoint = 'walk', error = '';
  let waypoint = 0, transition = 0, restartTime = 0, epoch = 0, talking = false;
  let pending: 'pause' | 'stop' | 'restart' | undefined;
  const pose: GuidePose = { position: [...config.start], yaw: -90, seated: 0, distance: 0, moving: false, opacity: 1 };
  const inTransition = () => checkpoint === 'sit' || checkpoint === 'stand';
  const fail = (reason: unknown) => { error = reason instanceof Error ? reason.message : String(reason); state = 'failed'; pose.moving = false; };
  const beginSpeech = () => {
    talking = true;
    const attempt = ++epoch;
    void speech.play().catch(reason => { if (attempt === epoch && state === 'running' && checkpoint === 'talk') fail(reason); });
  };
  const settle = () => {
    if (pending === 'restart') { pending = undefined; state = 'restarting'; restartTime = 0; }
    else if (pending) { state = pending === 'stop' ? 'stopped' : 'paused'; pending = undefined; }
  };
  const stopSpeech = () => { epoch++; talking = false; speech.stop(); };
  const turn = (target: number, dt: number) => {
    const delta = ((target - pose.yaw + 540) % 360) - 180;
    const step = Math.min(Math.abs(delta), config.turnSpeed * dt);
    pose.yaw += Math.sign(delta) * step;
    return Math.abs(delta) <= step;
  };
  const reset = () => {
    checkpoint = 'walk'; waypoint = transition = 0; talking = false; error = '';
    pose.position = [...config.start]; pose.yaw = -90; pose.seated = pose.distance = 0; pose.moving = false;
  };
  return {
    get state() { return state; }, get checkpoint() { return checkpoint; }, get error() { return error; }, pose,
    start() { if (state === 'ready') state = 'running'; },
    pause() {
      if (state !== 'running') return;
      pose.moving = false;
      if (inTransition()) { pending = 'pause'; state = 'pausing'; }
      else { state = 'paused'; epoch++; speech.pause(); }
    },
    resume() {
      if (state !== 'paused') return;
      state = 'running';
      if (checkpoint === 'talk') beginSpeech();
    },
    stop() {
      if (['ready', 'disposed', 'completed', 'stopped'].includes(state)) return;
      stopSpeech(); pose.moving = false; pose.opacity = 1; error = '';
      if (inTransition()) { pending = 'stop'; state = 'stopping'; }
      else { pending = undefined; state = 'stopped'; }
    },
    restart() {
      if (state === 'disposed' || state === 'restarting') return;
      stopSpeech(); pose.moving = false;
      if (inTransition() && pose.seated > 0 && pose.seated < 1) { pending = 'restart'; state = 'stopping'; }
      else { pending = undefined; state = 'restarting'; restartTime = 0; }
    },
    retry() {
      if (state === 'failed') { state = 'running'; error = ''; if (checkpoint === 'talk') beginSpeech(); }
      else if (state === 'running' && checkpoint === 'talk' && speech.snapshot.status === 'waiting') beginSpeech();
    },
    update(elapsed: number) {
      if (state === 'disposed') return;
      speech.update(); pose.moving = false;
      const dt = Number.isFinite(elapsed) ? Math.max(0, Math.min(elapsed, 0.05)) : 0;
      if (state === 'restarting') {
        restartTime += dt;
        if (restartTime < 0.2) pose.opacity = 1 - restartTime / 0.2;
        else { if (restartTime - dt < 0.2) reset(); pose.opacity = Math.min(1, (restartTime - 0.2) / 0.2); }
        if (restartTime >= 0.4) { pose.opacity = 1; state = 'running'; }
        return;
      }
      if (!['running', 'pausing', 'stopping'].includes(state) || dt === 0) return;
      if (checkpoint === 'walk') {
        const target = config.route[waypoint];
        const dx = target[0] - pose.position[0], dz = target[2] - pose.position[2], distance = Math.hypot(dx, dz);
        const step = Math.min(distance, config.speed * dt);
        if (distance > 0) {
          turn(Math.atan2(dx, dz) * 180 / Math.PI, dt);
          pose.position[0] += dx / distance * step; pose.position[2] += dz / distance * step;
          pose.distance += step; pose.moving = step > 0;
        }
        if (distance <= step) { pose.position = [...target]; if (++waypoint === config.route.length) checkpoint = 'align'; }
      } else if (checkpoint === 'align') {
        if (turn(0, dt)) { pose.yaw = 0; checkpoint = 'sit'; transition = 0; }
      } else if (inTransition()) {
        transition = Math.min(1, transition + dt / config.transitionSeconds);
        pose.seated = checkpoint === 'sit' ? transition : 1 - transition;
        if (transition >= 1) { checkpoint = checkpoint === 'sit' ? 'talk' : 'done'; transition = 0; settle(); }
      } else if (checkpoint === 'talk') {
        if (!talking) beginSpeech();
        else if (speech.snapshot.status === 'error') fail(speech.snapshot.error);
        else if (speech.snapshot.status === 'ended') { checkpoint = 'stand'; transition = 0; }
      } else if (checkpoint === 'done') state = 'completed';
    },
    destroy() { if (state === 'disposed') return; state = 'disposed'; epoch++; speech.destroy(); pose.moving = false; },
  };
}
