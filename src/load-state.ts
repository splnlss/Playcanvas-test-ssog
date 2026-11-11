/** Guards readiness against replaced loads and late events after errors/disposal. */
export function createLoadState() {
  let generation = 0;
  let state: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  let error = '';
  return {
    get state() { return state; },
    get error() { return error; },
    begin() { state = 'loading'; error = ''; return ++generation; },
    ready(attempt: number) {
      if (attempt !== generation || state !== 'loading') return false;
      state = 'ready';
      return true;
    },
    fail(attempt: number, reason: string) {
      if (attempt !== generation || state !== 'loading') return false;
      state = 'error'; error = reason;
      return true;
    },
    cancel() { generation++; state = 'idle'; error = ''; },
  };
}

export function createLoadDeadline(limit: number) {
  let elapsed = 0;
  return { tick(dt: number, visible: boolean) {
    if (visible && Number.isFinite(dt) && dt > 0) elapsed += Math.min(dt, 0.1);
    return elapsed >= limit - 1e-9;
  } };
}
