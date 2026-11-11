import type { MenuAction } from '../vr-menu';
import type { createGuideSequence } from './sequence';

/** Keep the primary control actionable without silently changing Start semantics. */
export function createPrimaryGuideAction(guide: ReturnType<typeof createGuideSequence>): MenuAction {
  const command = () => {
    if (guide.state === 'ready') return 'start';
    if (guide.state === 'paused') return 'resume';
    if (guide.state === 'stopped' || guide.state === 'completed') return 'restart';
    if (guide.state === 'failed') return 'retry';
    return undefined;
  };
  const labels = { start: 'Start guide preview', resume: 'Resume guide', restart: 'Restart guide preview', retry: 'Retry guide action' };
  return {
    label: () => { const action = command(); return action ? labels[action] : 'Guide running…'; },
    enabled: () => command() !== undefined,
    run: () => { const action = command(); if (action) guide[action](); },
  };
}
