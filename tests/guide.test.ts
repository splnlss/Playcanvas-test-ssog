import { expect, it } from 'vitest';
import { createPrimaryGuideAction } from '../src/guide/controls';
import { createGuideSequence, type GuideSpeech } from '../src/guide/sequence';

function speech(): GuideSpeech {
  const snapshot: GuideSpeech['snapshot'] = { status: 'idle', time: 0, caption: '', weights: {}, error: '' };
  return { snapshot, async play() { snapshot.status = 'playing'; }, pause() { snapshot.status = 'paused'; }, stop() { snapshot.status = 'idle'; snapshot.time = 0; }, update() {}, destroy() {} };
}
function until(g: ReturnType<typeof createGuideSequence>, predicate: () => boolean) {
  for (let i = 0; i < 1000 && !predicate(); i++) g.update(0.05);
  expect(predicate()).toBe(true);
}
it('enters from the right, turns to face the viewer and completes once after speech', async () => {
  const voice = speech(), g = createGuideSequence(voice);
  expect(g.pose.position).toEqual([4, 0, 1.5]);
  g.start(); g.start();
  until(g, () => g.checkpoint === 'talk'); g.update(0.05);
  await Promise.resolve();
  expect(g.pose.position).toEqual([0, 0, 0.6]);
  expect(g.pose.yaw).toBeCloseTo(0);
  expect(g.pose.seated).toBe(1);
  voice.snapshot.status = 'ended';
  until(g, () => g.state === 'completed');
  expect(g.pose.seated).toBe(0);
  g.start(); expect(g.state).toBe('completed');
});
it('pauses walking in place and Stop takes precedence over Pause while sitting', () => {
  const g = createGuideSequence(speech()); g.start(); g.update(0.05); g.pause();
  const position = [...g.pose.position]; g.update(1);
  expect(g.pose.position).toEqual(position);
  g.resume(); until(g, () => g.checkpoint === 'sit'); g.update(0.05);
  g.pause(); g.stop(); g.pause();
  until(g, () => g.state === 'stopped');
  expect(g.pose.seated).toBe(1);
  expect(g.checkpoint).toBe('talk');
});
it('finishes standing before marking a pause and completes only on resume', async () => {
  const voice = speech(), g = createGuideSequence(voice); g.start();
  until(g, () => g.checkpoint === 'talk'); g.update(0.05); await Promise.resolve();
  voice.snapshot.status = 'ended'; g.update(0.05); g.update(0.05); g.pause();
  until(g, () => g.state === 'paused');
  expect(g.pose.seated).toBe(0);
  g.resume(); g.update(0.05); expect(g.state).toBe('completed');
});
it('retries missing speech while seated without replaying the completed route', async () => {
  const voice = speech(); let available = false;
  voice.play = async () => { if (!available) throw new Error('Missing recording'); voice.snapshot.status = 'playing'; };
  const g = createGuideSequence(voice); g.start(); until(g, () => g.checkpoint === 'talk');
  g.update(0.05); await Promise.resolve(); await Promise.resolve();
  expect(g.state).toBe('failed'); expect(g.error).toContain('Missing recording');
  available = true; g.retry(); await Promise.resolve();
  expect(g.state).toBe('running'); expect(g.pose.seated).toBe(1);
  expect(g.pose.position).toEqual([0, 0, 0.6]);
});
it('ignores rejected old speech after Stop and disposes permanently', async () => {
  let reject!: (e: Error) => void;
  const voice = speech(); voice.play = () => new Promise((_, no) => { reject = no; });
  const g = createGuideSequence(voice); g.start(); until(g, () => g.checkpoint === 'talk'); g.update(0.05);
  g.stop(); reject(new Error('old failure')); await Promise.resolve(); await Promise.resolve();
  expect(g.state).toBe('stopped'); expect(g.error).toBe('');
  g.destroy(); g.start(); g.restart(); g.update(1); expect(g.state).toBe('disposed');
});
it('bounds frame stalls and ignores invalid elapsed time; restart fades before resetting', () => {
  const g = createGuideSequence(speech()); g.start(); g.update(NaN); g.update(-1);
  expect(g.pose.position).toEqual([4, 0, 1.5]);
  g.update(100); expect(g.pose.position[0]).toBeGreaterThanOrEqual(3.95);
  g.restart(); g.update(0.05); expect(g.pose.opacity).toBeLessThan(1);
  until(g, () => g.state === 'running'); expect(g.pose.position).toEqual([4, 0, 1.5]);
  expect(g.pose.opacity).toBe(1);
});
it('honors Stop during a Restart fade without starting another walk', () => {
  const g = createGuideSequence(speech()); g.start(); g.update(0.05); g.restart(); g.update(0.05);
  g.stop(); const position = [...g.pose.position];
  for (let i = 0; i < 30; i++) g.update(0.05);
  expect(g.state).toBe('stopped'); expect(g.pose.position).toEqual(position); expect(g.pose.opacity).toBe(1);
});

it('offers a working primary Restart after Stop and Resume after Pause', () => {
  const g = createGuideSequence(speech()), primary = createPrimaryGuideAction(g);
  primary.run(); g.update(0.05); g.stop();
  expect(primary.label()).toContain('Restart'); expect(primary.enabled?.()).toBe(true);
  primary.run(); until(g, () => g.state === 'running');
  expect(primary.enabled?.()).toBe(false);
  g.pause(); expect(primary.label()).toContain('Resume'); primary.run();
  expect(g.state).toBe('running');
});

it('starts a six second lip sync sample seated without walking and resets for normal Restart', () => {
  const voice = speech(), ends: (number | undefined)[] = [];
  voice.play = async end => { ends.push(end); voice.snapshot.status = 'playing'; };
  const g = createGuideSequence(voice);
  g.testLipSync();
  expect(g.state).toBe('running'); expect(g.checkpoint).toBe('talk');
  expect(g.pose.seated).toBe(1); expect(g.pose.position).toEqual([0, 0, 0.6]);
  expect(ends).toEqual([6]);
  g.pause(); g.resume(); expect(ends).toEqual([6, 6]);
  g.restart(); until(g, () => g.state === 'running' && g.checkpoint === 'walk');
  until(g, () => g.checkpoint === 'talk'); g.update(0.05);
  expect(ends.at(-1)).toBeUndefined();
});
