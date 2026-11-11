import { Asset, type AssetRegistry } from 'playcanvas';

/** One native Asset per URL, including pending requests. Native loads can share resources. */
export function createSplatAssets(registry: AssetRegistry) {
  type Entry = { asset: Asset; ready: Promise<Asset>; users: number; settled: boolean };
  const entries = new Map<string,Entry>();
  let destroyed = false;
  const clean = (url: string, entry: Entry) => {
    if (!entry.settled || entry.users > 0) return;
    entries.delete(url); entry.asset.unload(); registry.remove(entry.asset);
  };
  return {
    acquire(url: string) {
      if (destroyed) throw new Error('Asset store is disposed.');
      let entry = entries.get(url);
      if (!entry) {
        const asset = new Asset(url,'gsplat',{url});
        let resolve!: (asset: Asset) => void, reject!: (error: Error) => void;
        const ready = new Promise<Asset>((yes,no) => { resolve=yes; reject=no; });
        entry = { asset,ready,users:0,settled:false }; entries.set(url,entry);
        const active = entry;
        asset.once('load',() => { active.settled=true; resolve(asset); clean(url,active); });
        asset.once('error',(error: string) => { active.settled=true; reject(new Error(error)); clean(url,active); });
        registry.add(asset);
        // Prevent an abandoned network error becoming an unhandled rejection.
        void ready.catch(() => {});
      }
      entry.users++;
      const active = entry;
      if (!active.asset.loading && !active.asset.loaded && !active.settled) registry.load(active.asset);
      let released = false;
      return {
        asset: active.asset, ready: active.ready,
        release() { if (!released) { released=true; active.users--; clean(url,active); } },
      };
    },
    destroy() {
      destroyed=true;
      for (const [url,entry] of entries) { entry.users=0; clean(url,entry); }
    },
  };
}
