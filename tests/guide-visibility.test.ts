import { expect, it } from 'vitest';
import { EventHandler } from 'playcanvas';
import { observeGuideVisibility } from '../src/guide/visibility';
import { createGuideSequence, type GuideSpeech } from '../src/guide/sequence';

it('pauses on XR visibility events even without a frame update and removes both listeners', () => {
  class Xr extends EventHandler { active = true; visibilityState = 'visible'; }
  class Page extends EventTarget { hidden = false; }
  const xr = new Xr(), page = new Page();
  const voice: GuideSpeech = { snapshot: { status: 'idle', time: 0, caption: '', weights: {}, error: '' }, async play() {}, pause() {}, stop() {}, update() {}, destroy() {} };
  const g = createGuideSequence(voice); g.start();
  const dispose = observeGuideVisibility(xr, page, () => g.pause());
  xr.visibilityState = 'hidden'; xr.fire('visibility:change', 'hidden');
  expect(g.state).toBe('paused');
  xr.visibilityState = 'visible'; xr.fire('visibility:change', 'visible'); expect(g.state).toBe('paused');
  g.resume(); page.hidden = true; page.dispatchEvent(new Event('visibilitychange')); expect(g.state).toBe('paused');
  dispose(); g.resume(); xr.fire('visibility:change', 'hidden'); page.dispatchEvent(new Event('visibilitychange'));
  expect(g.state).toBe('running');
});
