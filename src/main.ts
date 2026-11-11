import { XRTYPE_VR, version } from 'playcanvas';
import { resolveScene } from './config';
import { createViewer } from './viewer';
import { createDesktop } from './desktop';
import { createQuality, type Preset } from './quality';
import { createXr } from './xr';
import { observeXrEnd } from './xr-state';
import './style.css';

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = element('status');
const enter = element<HTMLButtonElement>('enter');
const retry = element<HTMLButtonElement>('retry');
const mode = element<HTMLSelectElement>('mode');
const qualitySelect = element<HTMLSelectElement>('quality');
const auto = element<HTMLInputElement>('auto');
const reset = element<HTMLButtonElement>('reset');

async function start() {
  const scene = resolveScene(location.search);
  element('title').textContent = scene.title;
  element<HTMLAnchorElement>('credit').textContent = scene.attribution;
  element<HTMLAnchorElement>('credit').href = scene.creditUrl;
  element<HTMLAnchorElement>('license').href = scene.licenseUrl;
  element('license').textContent = scene.licenseLabel ?? 'License';
  const viewer = await createViewer(element<HTMLCanvasElement>('viewer'));
  const { app, xr } = viewer;
  const desktop = createDesktop(viewer,scene);
  const streamed = scene.source.kind === 'streamed-sog';
  const quality = createQuality(profile => { if (xr.active && streamed) viewer.setQuality(profile); },scene.vrProfiles);
  const vr = createXr(viewer,desktop,quality,scene);
  let loading = false;
  const refresh = () => {
    const ready = viewer.loading.state === 'ready' && !loading;
    const transition = vr.state === 'starting' || vr.state === 'ending';
    enter.disabled = transition || (!xr.active && (!ready || !xr.supported || !xr.isAvailable(XRTYPE_VR)));
    enter.textContent = xr.active ? 'Exit VR' : vr.state === 'starting' ? 'Starting VR…' : !xr.isAvailable(XRTYPE_VR) ? 'VR unavailable' : vr.usesLocalSpace ? 'Enter VR (local space)' : 'Enter VR';
    mode.disabled = reset.disabled = !ready || xr.active || transition;
    retry.disabled = loading || transition;
    mode.value = desktop.mode;
    qualitySelect.disabled = auto.disabled = !ready || !streamed || transition;
    qualitySelect.value = quality.state.preset; auto.checked = quality.state.auto;
  };
  const load = async () => {
    if (loading) return;
    loading = true; desktop.setEnabled(false); refresh();
    status.textContent = 'Loading scene…';
    try {
      if (xr.active) await vr.exit();
      desktop.setEnabled(false);
      await viewer.load(scene); desktop.reset();
      status.textContent = streamed ? 'Ready · scene detail streams as you explore' : 'Single SOG — not streamed; LOD budget controls unavailable';
    } catch (error) { status.textContent = error instanceof Error ? error.message : String(error); }
    finally { loading = false; desktop.setEnabled(viewer.loading.state === 'ready'); refresh(); }
  };
  enter.addEventListener('click', () => {
    const operation = xr.active ? vr.exit() : vr.enter();
    refresh();
    void operation.catch(error => { status.textContent = `VR: ${error instanceof Error ? error.message : error}. You can retry.`; }).finally(refresh);
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
    seconds += dt; if (seconds < 1) return; seconds = 0;
    element('metrics').textContent = `${Math.round(xr.active ? quality.state.fps : app.stats.frame.fps)} app FPS · ${app.stats.frame.gsplats.toLocaleString()} splats · budget ${app.scene.gsplat.splatBudget.toLocaleString()} · ${xr.active ? `${xr.frameRate ?? 72} target Hz${xr.frameRate ? '' : ' (fallback)'}` : `PlayCanvas ${version} / WebGL2`}`;
    auto.disabled = viewer.loading.state !== 'ready' || loading || !streamed || vr.state === 'starting' || vr.state === 'ending';
    qualitySelect.value = quality.state.preset; auto.checked = quality.state.auto;
  };
  app.on('update',update);
  await load();
  window.addEventListener('pagehide', () => { stopEndObserver(); vr.destroy(); desktop.destroy(); viewer.destroy(); }, { once: true });
}
start().catch(error => { status.textContent = `Viewer could not start: ${error instanceof Error ? error.message : String(error)}`; });
