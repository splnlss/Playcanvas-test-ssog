type XrVisibility = {
  active: boolean; visibilityState: string | null;
  on(name: string, callback: () => void): unknown;
  off(name: string, callback: () => void): unknown;
};
/** Visibility events still arrive when XR stops requesting animation frames. */
export function observeGuideVisibility(xr: XrVisibility, page: EventTarget & { hidden: boolean }, pause: () => void) {
  const changed = () => { if (page.hidden || (xr.active && xr.visibilityState !== 'visible')) pause(); };
  xr.on('visibility:change', changed); page.addEventListener('visibilitychange', changed);
  return () => { xr.off('visibility:change', changed); page.removeEventListener('visibilitychange', changed); };
}
