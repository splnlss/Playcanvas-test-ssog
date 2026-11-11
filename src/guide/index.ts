import type { Viewer } from '../viewer';
import type { MenuAction } from '../vr-menu';
import { guidePlacement } from './placement';
import { guideSpeech } from './config';
import { createGuideSequence } from './sequence';
import { createGuideSpeech } from './speech';
import { observeGuideVisibility } from './visibility';
import { createGuidePresentation } from './presentation';

export function createGuide(viewer: Viewer, fixture: boolean, sceneId: string) {
  const voice = createGuideSpeech(guideSpeech);
  const sequence = createGuideSequence(voice);
  const placement = guidePlacement(sceneId, fixture);
  const presentation = createGuidePresentation(viewer.app, fixture, placement ?? guidePlacement('', true)!);
  let enabled = false, muted = false, captions = true, volume = 1, notice = '';
  const gesture = (action: () => void) => {
    if (!enabled) return;
    void voice.unlock().catch(error => { notice = `Enable audio: ${error instanceof Error ? error.message : error}`; });
    action();
  };
  const actions: MenuAction[] = [
    { label: () => 'Start guide preview', run: () => gesture(() => sequence.start()) },
    { label: () => sequence.state === 'paused' ? 'Resume guide' : 'Pause guide', run: () => gesture(() => sequence.state === 'paused' ? sequence.resume() : sequence.pause()) },
    { label: () => 'Stop guide', run: () => sequence.stop() },
    { label: () => 'Restart guide preview', run: () => gesture(() => sequence.restart()) },
    { label: () => voice.snapshot.status === 'waiting' ? 'Enable guide audio' : 'Retry guide action', run: () => gesture(() => sequence.retry()) },
    { label: () => `Guide sound: ${muted ? 'muted' : 'on'}`, run: () => { muted = !muted; voice.setMuted(muted); } },
    { label: () => `Guide volume: ${Math.round(volume * 100)}%`, run: () => { volume = volume <= 0.01 ? 1 : Math.max(0, volume - 0.25); voice.setVolume(volume); } },
    { label: () => `Guide captions: ${captions ? 'on' : 'off'}`, run: () => { captions = !captions; } },
  ];
  const status = () => !placement ? 'No guide route authored for this scene.' : !enabled ? 'Guide waiting for scene' : `${sequence.state} · ${sequence.checkpoint}${sequence.error ? ` · ${sequence.error}` : voice.snapshot.status === 'waiting' ? ' · Enable audio to continue' : notice ? ` · ${notice}` : ''}`;
  const update = (dt: number) => {
    if (!enabled) return;
    if (document.hidden || (viewer.xr.active && viewer.xr.visibilityState !== 'visible')) sequence.pause();
    sequence.update(dt);
    presentation.render(sequence.pose, voice.snapshot.weights, captions ? voice.snapshot.caption : '');
    const head = presentation.head.getPosition(), camera = viewer.player.camera;
    const p = camera.getPosition(), f = camera.forward, u = camera.up;
    voice.spatial([head.x, head.y, head.z], [p.x, p.y, p.z], [f.x, f.y, f.z], [u.x, u.y, u.z]);
  };
  const stopVisibility = observeGuideVisibility(viewer.xr, document, () => sequence.pause());
  viewer.app.on('update', update);
  return {
    actions, sequence, status, available: !!placement,
    get caption() { return captions ? voice.snapshot.caption : ''; },
    setEnabled(value: boolean) { enabled = value && !!placement; presentation.root.enabled = enabled; },
    destroy() {
      viewer.app.off('update', update); stopVisibility();
      sequence.destroy(); presentation.destroy();
    },
  };
}
export type Guide = ReturnType<typeof createGuide>;
