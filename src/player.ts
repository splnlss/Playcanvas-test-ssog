import { Application, Color, Entity } from 'playcanvas';
import { turnAroundPivot, type Pose, type Vec3Tuple } from './movement';

/** Owns world-meter player pose. Never parent this root under scaled scene content. */
export function createPlayer(app: Application) {
  const root = new Entity('player');
  const camera = new Entity('head');
  camera.addComponent('camera', { clearColor: new Color(0.035, 0.045, 0.06), nearClip: 0.05, farClip: 1000, fov: 65 });
  root.addChild(camera);
  app.root.addChild(root);
  const getPose = (): Pose => {
    const p = root.getPosition(), q = root.getRotation();
    return { position: [p.x, p.y, p.z], rotation: [q.x, q.y, q.z, q.w] };
  };
  const setPose = (pose: Pose) => { root.setPosition(...pose.position); root.setRotation(...pose.rotation); };
  return {
    root, camera, getPose, setPose,
    move(delta: Vec3Tuple) { root.translate(...delta); },
    turn(degrees: number) {
      const head = camera.getPosition();
      setPose(turnAroundPivot(getPose(), [head.x, head.y, head.z], degrees));
    },
    destroy() { root.destroy(); },
  };
}
