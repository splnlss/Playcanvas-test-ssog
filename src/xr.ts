import { XRSPACE_LOCAL, XRSPACE_LOCALFLOOR, XRTYPE_VR, type XrInputSource } from 'playcanvas';
import type { SceneConfig } from './config';
import type { DesktopControls, DesktopSnapshot } from './desktop';
import type { QualityControls } from './quality';
import type { Viewer } from './viewer';
import { createVrMenu } from './vr-menu';
import { createXrLifecycle, vrMotion } from './xr-state';

export function createXr(viewer: Viewer, desktop: DesktopControls, quality: QualityControls, scene: SceneConfig) {
  const { app, xr, player } = viewer;
  let ending = false, localFallback = false, armed = false, disposed = false;
  const lifecycle = createXrLifecycle<DesktopSnapshot>(snapshot => {
    ending = false; armed = false; menu.hide(); quality.setAuto(false);
    player.camera.setLocalPosition(0,0,0); player.camera.setLocalEulerAngles(0,0,0);
    desktop.restore(snapshot); desktop.setEnabled(true); viewer.setQuality(scene.desktopProfile);
  });
  const positionForVr = () => {
    player.root.setPosition(...scene.vr.position); player.root.setEulerAngles(0,scene.vr.heading,0);
    if (xr.spaceType === XRSPACE_LOCAL || localFallback) player.root.translate(0,scene.vr.localEyeHeight,0);
  };
  const exit = () => new Promise<void>((resolve,reject) => {
    if (!xr.active || ending) { resolve(); return; }
    ending = true;
    xr.end(error => { if (error) { ending = false; reject(error); } else resolve(); });
  });
  const reset = () => xr.active ? menu.resetWithFade(positionForVr) : Promise.resolve();
  const streamed = scene.source.kind === 'streamed-sog';
  const menu = createVrMenu(viewer, [
    { label: () => 'Reset position', run: () => { void reset(); } },
    { label: () => 'Exit VR', run: () => { void exit().catch(console.error); } },
    ...(streamed ? (['low','medium','high'] as const).map(preset => ({
      label: () => `${quality.state.preset === preset ? '● ' : ''}${preset.toUpperCase()} · ${scene.vrProfiles[preset].splatBudget.toLocaleString()}`,
      run: () => quality.select(preset),
    })) : []),
    ...(streamed ? [{ label: () => `Auto quality: ${quality.state.auto ? 'ON' : 'OFF'}`, run: () => quality.setAuto(!quality.state.auto) }] : []),
  ], () => `${Math.round(quality.state.fps)} app FPS · ${streamed ? quality.state.preset.toUpperCase() : 'Single SOG / no LOD'} · ${xr.frameRate ?? 72} target Hz${xr.frameRate ? '' : ' (fallback)'}`);
  const onStart = () => {
    if (disposed) return;
    lifecycle.activate(); positionForVr(); quality.onEnter(); menu.hide();
  };
  const onEnd = () => lifecycle.end();
  xr.on('start',onStart); xr.on('end',onEnd);
  const enter = () => new Promise<void>((resolve,reject) => {
    if (disposed || ending || !xr.supported || !xr.isAvailable(XRTYPE_VR) || viewer.loading.state !== 'ready') { reject(new Error('VR is not available or the scene is not ready.')); return; }
    if (!lifecycle.begin(desktop.snapshot())) { resolve(); return; }
    desktop.setEnabled(false);
    player.camera.setLocalPosition(0,0,0); player.camera.setLocalEulerAngles(0,0,0);
    player.root.setPosition(...scene.vr.position); player.root.setEulerAngles(0,scene.vr.heading,0);
    try {
      xr.start(player.camera.camera!,XRTYPE_VR,localFallback ? XRSPACE_LOCAL : XRSPACE_LOCALFLOOR,{ callback: error => {
        if (!error) { resolve(); return; }
        if (error.name === 'NotSupportedError') localFallback = true;
        lifecycle.end(); reject(error);
      } });
    } catch (error) { lifecycle.end(); reject(error); }
  });
  const stick = (source: XrInputSource | undefined): [number,number] | null => {
    const axes = source?.gamepad?.axes;
    if (!axes || axes.length < 2) return null;
    return [axes[axes.length-2], -axes[axes.length-1]];
  };
  const update = (dt: number) => {
    if (!xr.active || ending) return;
    const sources = xr.input.inputSources;
    const yaw = Math.atan2(-player.camera.forward.x,-player.camera.forward.z);
    const movement = vrMotion(stick(sources.find(s => s.handedness === 'left')),stick(sources.find(s => s.handedness === 'right')),yaw,armed,menu.open || xr.visibilityState !== 'visible',dt,scene.flightSpeed);
    armed = movement.armed; player.move(movement.delta);
    if (movement.degrees) player.turn(movement.degrees * scene.snapAngle/30);
    if (xr.visibilityState === 'visible') quality.update(dt,xr.frameRate ?? 72);
  };
  app.on('update',update);
  return {
    enter,exit,reset,
    get state() { return ending ? 'ending' : lifecycle.state; },
    get usesLocalSpace() { return localFallback; },
    destroy() {
      disposed = true; app.off('update',update); xr.off('start',onStart); xr.off('end',onEnd);
      lifecycle.end(); menu.destroy();
    },
  };
}
