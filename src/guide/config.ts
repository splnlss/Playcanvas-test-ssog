import type { Vec3Tuple } from '../movement';
import type { SpeechPackage } from './speech';
import recordedSpeech from './ronda-speech.json';

/** Hand-authored guesses in world meters; never inferred from visible splats. */
export const prototypeGuide = {
  start: [4, 0, 1.5] as Vec3Tuple,
  route: [[2, 0, 1.5], [0, 0, 1.5], [0, 0, 0.6]] as Vec3Tuple[],
  speed: 0.8,
  turnSpeed: 120,
  transitionSeconds: 1.2,
};

// First 30 seconds supplied by the user. Captions are an automatic draft;
// offline Rhubarb cues are simplified for the diagnostic mannequin mouth.
export const guideSpeech: SpeechPackage = recordedSpeech;
