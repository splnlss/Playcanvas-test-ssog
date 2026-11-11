import { BLEND_NORMAL, Color, CULLFACE_NONE, Entity, Layer, StandardMaterial, Texture, Vec3, type XrInputSource } from 'playcanvas';
import { panelRow, menuPage, wrapMenuText } from './menu-hit';
import type { Viewer } from './viewer';

export type MenuAction = { label: () => string; run: () => void; enabled?: () => boolean };
export function createVrMenu(viewer: Viewer, actions: MenuAction[], readout: () => string, guideStatus = () => '') {
  const { app, xr, player } = viewer;
  const camera = player.camera;
  const layer = new Layer({ name: 'VR controls' });
  app.scene.layers.pushOpaque(layer); app.scene.layers.pushTransparent(layer);
  camera.camera!.layers = [...camera.camera!.layers, layer.id];
  const image = document.createElement('canvas'); image.width = 768; image.height = 1024;
  const ctx = image.getContext('2d')!;
  const texture = new Texture(app.graphicsDevice, { mipmaps: false });
  const material = new StandardMaterial();
  material.useLighting = false; material.emissive = new Color(1,1,1); material.emissiveMap = texture;
  material.cull = CULLFACE_NONE; material.depthTest = material.depthWrite = false; material.update();
  const root = new Entity('vr-menu'); root.setLocalScale(1, 1024 / 768, 1);
  const face = new Entity('menu-face'); face.addComponent('render', { type: 'plane', material, layers: [layer.id] });
  face.setLocalEulerAngles(90,0,0); root.addChild(face); app.root.addChild(root); root.enabled = false;
  const inverse = root.getWorldTransform().clone();
  const fadeMaterial = new StandardMaterial();
  fadeMaterial.useLighting = false; fadeMaterial.emissive = new Color(0,0,0); fadeMaterial.diffuse = new Color(0,0,0);
  fadeMaterial.blendType = BLEND_NORMAL; fadeMaterial.cull = CULLFACE_NONE;
  fadeMaterial.depthTest = fadeMaterial.depthWrite = false; fadeMaterial.opacity = 0; fadeMaterial.update();
  const veil = new Entity('vr-reset-fade');
  veil.addComponent('render', { type: 'plane', material: fadeMaterial, layers: [layer.id] });
  veil.setLocalEulerAngles(90,0,0); veil.setLocalPosition(0,0,-0.11); veil.setLocalScale(3,1,3);
  camera.addChild(veil); veil.enabled = false;
  let hovered = -1, xHeld = false, nextPaint = 0, page = 0;
  const visibleActions = (): MenuAction[] => {
    const current = menuPage(actions, page);
    return current.pages === 1 ? current.items : [...current.items, { label: () => `More controls · ${current.page + 1}/${current.pages}`, run: () => { page = (page + 1) % current.pages; hovered = -1; } }];
  };
  let fade: { time: number; moved: boolean; action: () => void; done: () => void } | undefined;
  const draw = () => {
    ctx.fillStyle = '#102028'; ctx.fillRect(0,0,768,1024);
    ctx.fillStyle = '#e5f4ed'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(`VIEWER · ${viewer.backendLabel}`,32,54);
    ctx.font = '24px sans-serif'; ctx.fillText('Right trigger selects · Left X closes',32,100);
    ctx.fillStyle = '#9dd4bb'; ctx.fillText(readout(),32,142,700);
    ctx.font = '22px sans-serif';
    wrapMenuText(guideStatus()).forEach((line, i) => ctx.fillText(line,32,174+i*24));
    visibleActions().forEach((action, i) => {
      const enabled = action.enabled?.() !== false;
      ctx.fillStyle = !enabled ? '#182b30' : hovered === i ? '#347764' : '#243e45'; ctx.fillRect(24,300 + i*100,720,84);
      ctx.fillStyle = enabled ? '#fff' : '#81938d'; ctx.font = '28px sans-serif'; ctx.fillText(action.label(),44,352+i*100);
    });
    texture.setSource(image);
  };
  const show = () => {
    const direction = camera.forward.clone(); direction.y = 0; direction.normalize();
    root.setPosition(camera.getPosition().clone().add(direction.mulScalar(1.4)));
    root.setEulerAngles(0,Math.atan2(-camera.forward.x,-camera.forward.z)*180/Math.PI,0);
    root.enabled = true; inverse.copy(root.getWorldTransform()).invert(); draw();
  };
  const hide = () => { root.enabled = false; hovered = -1; };
  const hit = (source: XrInputSource) => {
    const p = inverse.transformPoint(source.getOrigin()), d = inverse.transformVector(source.getDirection());
    if (Math.abs(d.z) < 0.00001) return -1;
    const t = -p.z/d.z;
    return t >= 0 ? panelRow(p.x+d.x*t,p.y+d.y*t,visibleActions().length, 1024, 300) : -1;
  };
  const cancelFade = () => { const previous = fade; fade = undefined; veil.enabled = false; previous?.done(); };
  const update = (dt: number) => {
    if (!xr.active) { hide(); xHeld = false; cancelFade(); return; }
    const left = xr.input.inputSources.find(s => s.handedness === 'left');
    const pressed = !!left?.gamepad?.buttons[4]?.pressed;
    if (pressed && !xHeld && !fade) { if (root.enabled) hide(); else show(); }
    xHeld = pressed;
    const right = xr.input.inputSources.find(s => s.handedness === 'right');
    const next = right && root.enabled ? hit(right) : -1;
    nextPaint += dt;
    if (next !== hovered || nextPaint > 1) { hovered = next; if (root.enabled) draw(); nextPaint = 0; }
    if (fade) {
      fade.time += Math.max(0,Math.min(dt,0.05));
      if (!fade.moved && fade.time >= 0.12) { fade.moved = true; fade.action(); show(); }
      fadeMaterial.opacity = Math.max(0,Math.min(1,fade.time < 0.12 ? fade.time/0.12 : (0.24-fade.time)/0.12));
      if (fade.time >= 0.24) cancelFade();
    }
  };
  const select = (source: XrInputSource) => {
    if (!root.enabled || fade || source.handedness !== 'right') return;
    const index = hit(source);
    if (index >= 0) { const action = visibleActions()[index]; if (action.enabled?.() !== false) action.run(); draw(); }
  };
  app.on('update',update); xr.input.on('selectstart',select);
  return {
    get open() { return root.enabled || !!fade; }, show, hide,
    resetWithFade(action: () => void) {
      if (fade) return Promise.resolve();
      return new Promise<void>(done => { fade = { time: 0, moved: false, action, done }; veil.enabled = true; });
    },
    destroy() {
      cancelFade(); app.off('update',update); xr.input.off('selectstart',select);
      root.destroy(); veil.destroy(); material.destroy(); fadeMaterial.destroy(); texture.destroy();
      camera.camera!.layers = camera.camera!.layers.filter(id => id !== layer.id);
      app.scene.layers.remove(layer);
    },
  };
}
