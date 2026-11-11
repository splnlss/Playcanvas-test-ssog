import { XRTYPE_VR, version } from 'playcanvas';
import { resolveScene } from './config';
import { createViewer } from './viewer';
import { createDesktop } from './desktop';
import { createQuality, type Preset } from './quality';
import { createXr } from './xr';
import { observeXrEnd } from './xr-state';
import { createGuide, type Guide } from './guide';
import { createCameraCopy } from './camera-copy';
import './style.css';

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = element('status');
const enter = element<HTMLButtonElement>('enter');
const retry = element<HTMLButtonElement>('retry');
const backendSelect = element<HTMLSelectElement>('backend');
const mode = element<HTMLSelectElement>('mode');
const qualitySelect = element<HTMLSelectElement>('quality');
const auto = element<HTMLInputElement>('auto');
const reset = element<HTMLButtonElement>('reset');
const primaryGuideButton = element<HTMLButtonElement>('start-guide');
const panelToggle = element<HTMLButtonElement>('panel-toggle');
const panelContent = element('panel-content');
panelToggle.addEventListener('click', () => {
  panelContent.hidden = !panelContent.hidden;
  panelToggle.setAttribute('aria-expanded', String(!panelContent.hidden));
  panelToggle.textContent = panelContent.hidden ? '▾' : '▴';
  const label = panelContent.hidden ? 'Open menu' : 'Close menu';
  panelToggle.setAttribute('aria-label', label);
  panelToggle.title = label;
});

async function start() {
  const fixture = new URLSearchParams(location.search).get('guide') === 'fixture';
  const selected = resolveScene(location.search);
  const scene = fixture ? { ...selected, id: `${selected.id}-guide-fixture`, desktop: { position: [0, 1.6, 5] as [number, number, number], target: [0, 1.6, 0] as [number, number, number] }, vr: { position: [0, 0, 5] as [number, number, number], heading: 0, localEyeHeight: 1.6 } } : selected;
  element('title').textContent = fixture ? 'Guide route · pose prototype' : scene.title;
  element<HTMLAnchorElement>('credit').textContent = scene.attribution;
  element<HTMLAnchorElement>('credit').href = scene.creditUrl;
  element<HTMLAnchorElement>('license').href = scene.licenseUrl;
  element('license').textContent = scene.licenseLabel ?? 'License';
  const viewer = await createViewer(element<HTMLCanvasElement>('viewer'));
  const { app, xr } = viewer;
  backendSelect.value = viewer.backend.requested;
  element('backend-status').textContent = `${viewer.backendLabel}${viewer.backend.requested === 'webgpu' && !app.graphicsDevice.isWebGPU ? ' · WebGPU unavailable; using WebGL2' : ''}${viewer.backend.immersiveVr && !viewer.backend.webgpuXr ? ' · WebGPU VR bridge unavailable; use WebGL2 for VR' : ''}`;
  backendSelect.addEventListener('change', () => {
    const url = new URL(location.href); url.searchParams.set('backend', backendSelect.value); location.assign(url.href);
  });
  if (fixture) {
    // Fix the opening horizontal framing so the +4 m start stays offscreen.
    viewer.player.camera.camera!.horizontalFov = true;
    viewer.player.camera.camera!.fov = 65;
    document.querySelector('footer')!.textContent = 'Synthetic ground and pipe · procedural mannequin · no splats loaded';
  }
  const desktop = createDesktop(viewer,scene);
  const streamed = scene.source.kind === 'streamed-sog';
  const quality = createQuality(profile => { if (xr.active && streamed) viewer.setQuality(profile); },scene.vrProfiles);
  const cameraCopy = createCameraCopy(viewer,scene);
  let guide: Guide | undefined;
  const guideButtons = element('guide-buttons');
  const rebuildGuide = () => {
    guide?.destroy(); guide = createGuide(viewer, fixture, scene.id); guide.setEnabled(false);
    guideButtons.replaceChildren(...guide.actions.slice(1).map(action => {
      const button = document.createElement('button'); button.textContent = action.label();
      button.addEventListener('click', () => { action.run(); refreshGuide(); }); return button;
    }));
  };
  primaryGuideButton.addEventListener('click', () => { guide?.actions[0].run(); refreshGuide(); });
  const refreshGuide = () => {
    if (!guide) return;
    element('guide-status').textContent = loading || viewer.loading.state !== 'ready' ? status.textContent : guide.status();
    element('guide-caption').textContent = guide.caption;
    [primaryGuideButton, ...guideButtons.children].forEach((button, i) => { (button as HTMLButtonElement).disabled = !guide!.available || guide!.actions[i].enabled?.() === false || loading || viewer.loading.state !== 'ready'; button.textContent = guide!.actions[i].label(); });
  };
  const vr = createXr(viewer,desktop,quality,scene,cameraCopy,
    Array.from({ length: 12 }, (_, i) => ({ label: () => guide?.actions[i].label() ?? 'Guide unavailable', run: () => guide?.actions[i].run(), enabled: () => !!guide?.available && guide.actions[i].enabled?.() !== false })),
    () => guide?.status() ?? '');
  let loading = false;
  const refresh = () => {
    const ready = viewer.loading.state === 'ready' && !loading;
    const transition = vr.state === 'starting' || vr.state === 'ending';
    enter.disabled = transition || (!xr.active && (!ready || !xr.supported || !xr.isAvailable(XRTYPE_VR)));
    enter.textContent = xr.active ? 'Exit VR' : vr.state === 'starting' ? 'Starting VR…' : !xr.isAvailable(XRTYPE_VR) ? 'VR unavailable' : vr.usesLocalSpace ? 'Enter VR (local space)' : 'Enter VR';
    backendSelect.disabled = xr.active || transition;
    element<HTMLButtonElement>('copy-camera').disabled = !ready || transition;
    mode.disabled = reset.disabled = !ready || xr.active || transition;
    retry.disabled = loading || transition;
    mode.value = desktop.mode;
    qualitySelect.disabled = auto.disabled = !ready || !streamed || fixture || transition;
    qualitySelect.value = quality.state.preset; auto.checked = quality.state.auto;
  };
  const load = async () => {
    if (loading) return;
    loading = true; desktop.setEnabled(false); refresh();
    status.textContent = fixture ? 'Loading guide fixture…' : 'Loading scene…';
    rebuildGuide();
    try {
      if (xr.active) await vr.exit();
      desktop.setEnabled(false);
      if (fixture) { const attempt = viewer.loading.begin(); viewer.loading.ready(attempt); }
      else await viewer.load(scene);
      desktop.reset(); guide?.setEnabled(true);
      status.textContent = fixture ? 'Guide fixture · synthetic ground/pipe; no scanned-scene collision' : streamed ? 'Ready · scene detail streams as you explore' : 'Single SOG — not streamed; LOD budget controls unavailable';
    } catch (error) { status.textContent = error instanceof Error ? error.message : String(error); }
    finally { loading = false; desktop.setEnabled(viewer.loading.state === 'ready'); refresh(); refreshGuide(); }
  };
  enter.addEventListener('click', () => {
    const operation = xr.active ? vr.exit() : vr.enter();
    refresh();
    void operation.catch(error => { status.textContent = `VR: ${error instanceof Error ? error.message : error}. You can retry.${app.graphicsDevice.isWebGPU ? ' If WebGPU VR is rejected, select WebGL2 and try again.' : ''}`; }).finally(refresh);
  });
  reset.addEventListener('click', () => { desktop.reset(); refresh(); });
  mode.addEventListener('change', () => { desktop.setMode(mode.value === 'fly' ? 'fly' : 'orbit'); mode.blur(); });
  retry.addEventListener('click', () => { void load(); });
  qualitySelect.addEventListener('change', () => { quality.select(qualitySelect.value as Preset); refresh(); });
  auto.addEventListener('change', () => { quality.setAuto(auto.checked); refresh(); });
  xr.on('available:vr',refresh); xr.on('start',refresh);
  const stopEndObserver = observeXrEnd(xr, refresh);
  let seconds = 0;
  const update = (dt: number) => {
    refreshGuide();
    seconds += dt; if (seconds < 1) return; seconds = 0;
    element('metrics').textContent = `${Math.round(xr.active ? quality.state.fps : app.stats.frame.fps)} app FPS · ${app.stats.frame.gsplats.toLocaleString()} splats · budget ${app.scene.gsplat.splatBudget.toLocaleString()} · ${xr.active ? `${xr.frameRate ?? 72} target Hz${xr.frameRate ? '' : ' (fallback)'}` : `PlayCanvas ${version} / ${viewer.backendLabel}`}`;
    auto.disabled = viewer.loading.state !== 'ready' || loading || !streamed || fixture || vr.state === 'starting' || vr.state === 'ending';
    qualitySelect.value = quality.state.preset; auto.checked = quality.state.auto;
  };
  app.on('update',update);
  await load();
  window.addEventListener('pagehide', () => { stopEndObserver(); guide?.destroy(); cameraCopy.destroy(); vr.destroy(); desktop.destroy(); viewer.destroy(); }, { once: true });
}
start().catch(error => { status.textContent = `Viewer could not start: ${error instanceof Error ? error.message : String(error)}`; });
