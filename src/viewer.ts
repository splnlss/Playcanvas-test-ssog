import { Application, Asset, CameraComponent, DEVICETYPE_WEBGL2, FILLMODE_FILL_WINDOW, RESOLUTION_AUTO, Entity, GSplatOctreeResource, Layer, createGraphicsDevice } from 'playcanvas';
import type { QualityProfile, SceneConfig } from './config';
import { createLoadState, createLoadDeadline } from './load-state';
import { createSplatAssets } from './asset-store';
import { observeXrEnd } from './xr-state';
import { createPlayer } from './player';

export async function createViewer(canvas: HTMLCanvasElement) {
  const device = await createGraphicsDevice(canvas, { deviceTypes: [DEVICETYPE_WEBGL2], antialias: false });
  device.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  const app = new Application(canvas, { graphicsDevice: device });
  const xr = app.xr;
  if (!xr) throw new Error('PlayCanvas XR manager was not initialized.');
  app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(RESOLUTION_AUTO);
  app.scene.gsplat.radialSorting = true;
  const assets = createSplatAssets(app.assets);
  let releaseAsset = () => {};
  const sceneRoot = new Entity('scene-content');
  app.root.addChild(sceneRoot);
  const player = createPlayer(app);
  const loading = createLoadState();
  let asset: Asset | undefined;
  let splat: Entity | undefined;
  let current: SceneConfig | undefined;
  let disposeLoad = () => {};
  const resize = () => { if (!xr.active) app.resizeCanvas(canvas.clientWidth, canvas.clientHeight); };
  const stopEndObserver = observeXrEnd(xr,resize);
  window.addEventListener('resize', resize);
  resize();
  app.start();

  const clear = () => {
    disposeLoad(); disposeLoad = () => {};
    splat?.destroy(); splat = undefined;
    releaseAsset(); releaseAsset = () => {}; asset = undefined;
  };
  const load = (scene: SceneConfig): Promise<void> => {
    clear();
    current = scene;
    const attempt = loading.begin();
    sceneRoot.setPosition(...scene.transform.position);
    sceneRoot.setRotation(...scene.transform.rotation);
    sceneRoot.setLocalScale(scene.transform.scale, scene.transform.scale, scene.transform.scale);
    player.root.setPosition(...scene.desktop.position);
    player.root.lookAt(...scene.desktop.target);
    player.camera.setLocalPosition(0, 0, 0);
    player.camera.setLocalEulerAngles(0, 0, 0);
    app.scene.gsplat.splatBudget = scene.desktopProfile.splatBudget;
    const url = scene.source.kind === 'streamed-sog' ? scene.source.manifestUrl : scene.source.url;
    const lease = assets.acquire(url);
    const activeAsset = lease.asset;
    releaseAsset = lease.release;
    asset = activeAsset;
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let frameQueued = false;
      const deadline = createLoadDeadline(60);
      const onTick = (dt: number) => {
        if (deadline.tick(dt, document.visibilityState === 'visible')) onError('Initial scene content did not render within 60 seconds of active viewing. Retry or check the sample files/network.');
      };
      const finish = (reason?: string) => {
        if (settled) return;
        settled = true;
        app.off('update', onTick);
        app.systems.gsplat?.off('frame:ready', onFrame);
        app.off('postrender', onRendered);
        if (reason) reject(new Error(reason)); else resolve();
      };
      const onRendered = () => {
        frameQueued = false;
        // The frame:ready signal is only a candidate; require actual drawn splats.
        if (app.stats.frame.gsplats > 0 && loading.ready(attempt)) {
          if (splat?.gsplat && activeAsset.resource instanceof GSplatOctreeResource) {
            splat.gsplat.lodRangeMin = 0;
            splat.gsplat.lodRangeMax = activeAsset.resource.octree!.lodLevels - 1;
          }
          finish();
        }
      };
      const onFrame = (camera: CameraComponent, _layer: Layer, ready: boolean, pending: number) => {
        if (camera !== player.camera.camera || !ready || pending !== 0 || frameQueued || !splat) return;
        frameQueued = true;
        app.once('postrender', onRendered);
      };
      const onError = (reason: string) => {
        if (loading.fail(attempt, reason)) finish(reason);
      };
      const onAsset = () => {
        if (asset !== activeAsset) return;
        splat = new Entity('splat');
        splat.addComponent('gsplat', { asset: activeAsset, unified: true });
        sceneRoot.addChild(splat);
        if (activeAsset.resource instanceof GSplatOctreeResource && activeAsset.resource.octree) {
          const last = activeAsset.resource.octree.lodLevels - 1;
          splat.gsplat!.lodRangeMin = last;
          splat.gsplat!.lodRangeMax = last;
        }
      };
      disposeLoad = () => { loading.cancel(); finish('Scene loading cancelled.'); };
      app.systems.gsplat!.on('frame:ready', onFrame);
      app.on('update', onTick);
      void lease.ready.then(onAsset, error => onError(error.message));
    });
  };
  return {
    app, xr, sceneRoot, player, loading, load, resize,
    reload: () => current ? load(current) : Promise.reject(new Error('No scene selected.')),
    setQuality(profile: QualityProfile) { app.scene.gsplat.splatBudget = profile.splatBudget; },
    destroy() { stopEndObserver(); clear(); assets.destroy(); loading.cancel(); window.removeEventListener('resize', resize); player.destroy(); app.destroy(); },
  };
}
export type Viewer = Awaited<ReturnType<typeof createViewer>>;
