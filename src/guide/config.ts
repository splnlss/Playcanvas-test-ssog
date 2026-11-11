import type { Vec3Tuple } from '../movement';
import type { SpeechPackage } from './speech';

/** Hand-authored guesses in world meters; never inferred from visible splats. */
export const prototypeGuide = {
  start: [4, 0, 1.5] as Vec3Tuple,
  route: [[2, 0, 1.5], [0, 0, 1.5], [0, 0, 0.6]] as Vec3Tuple[],
  speed: 0.8,
  turnSpeed: 120,
  seatHeight: 0.6,
  transitionSeconds: 1.2,
};

// Supply final recorded audio + checked captions + offline cues here. No synthetic
// recording or jaw-only fallback is substituted for the speaking milestone.
export const guideSpeech: SpeechPackage | undefined = undefined;
