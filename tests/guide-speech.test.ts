import { expect, it } from 'vitest';
import { createGuideSpeech, sampleSpeech, validateSpeech, type SpeechPackage, type PlaybackMedia } from '../src/guide/speech';

const content: SpeechPackage = {
  audioUrl: '/voice.wav', audioRevision: 'voice-v1', cueAudioRevision: 'voice-v1',
  captions: [{ start: 0, end: 2, text: 'Hello' }],
  cues: [{ start: 0.2, end: 0.5, viseme: 'A', weight: 0.8 }, { start: 1, end: 1.5, viseme: 'M', weight: 1 }],
};
type MutableMedia = { -readonly [K in keyof PlaybackMedia]: PlaybackMedia[K] };
function media(): MutableMedia {
  return { currentTime: 0, duration: 2, paused: true, ended: false, readyState: 4, error: null, src: '', crossOrigin: '', volume: 1, muted: false,
    async play() { this.paused = false; }, pause() { this.paused = true; }, load() {}, removeAttribute() {} };
}
it('samples captions and distinct visemes from media time, including silence and seek', () => {
  expect(sampleSpeech(content, 0.3, true)).toEqual({ caption: 'Hello', weights: { A: 0.8 } });
  expect(sampleSpeech(content, 0.8, true).weights).toEqual({});
  expect(sampleSpeech(content, 1.2, true).weights).toEqual({ M: 1 });
  expect(sampleSpeech(content, 0.3, false)).toEqual({ caption: '', weights: {} });
});
it('rejects mismatched audio, unsupported visemes, overlapping cues and out-of-range metadata', () => {
  expect(() => validateSpeech({ ...content, cueAudioRevision: 'old' })).toThrow(/revision/i);
  expect(() => validateSpeech({ ...content, cues: [{ start: 0, end: 1, viseme: 'bad', weight: 1 }] })).toThrow(/viseme/i);
  expect(() => validateSpeech({ ...content, cues: [...content.cues, { start: 1.4, end: 1.8, viseme: 'A', weight: 1 }] })).toThrow(/overlap|order/i);
  expect(() => validateSpeech(content, 1)).toThrow(/duration/i);
  expect(() => validateSpeech({ ...content, cues: [] })).toThrow(/cue/i);
});
it('uses actual media position across pause, buffering and mute, then neutralizes on end', async () => {
  const source = media(), voice = createGuideSpeech(content, source); await voice.play();
  source.currentTime = 0.3; voice.update(); expect(voice.snapshot.weights).toEqual({ A: 0.8 });
  voice.pause(); source.muted = true; voice.update(); expect(voice.snapshot.weights).toEqual({ A: 0.8 });
  await voice.play(); source.currentTime = 1.2; source.readyState = 2; voice.update();
  expect(voice.snapshot.time).toBe(1.2); expect(voice.snapshot.status).toBe('waiting');
  source.readyState = 4; voice.update(); expect(voice.snapshot.weights).toEqual({ M: 1 });
  source.ended = true; voice.update(); expect(voice.snapshot.weights).toEqual({});
  expect(voice.snapshot.status).toBe('ended');
});
it('holds neutral before audio starts and allows an explicit retry after autoplay rejection', async () => {
  const source = media(), voice = createGuideSpeech(content, source);
  source.play = async () => { throw Object.assign(new Error('blocked'), { name: 'NotAllowedError' }); };
  await voice.play(); voice.update(); expect(voice.snapshot.status).toBe('waiting'); expect(voice.snapshot.weights).toEqual({});
  source.play = async () => { source.paused = false; }; await voice.play();
  source.currentTime = 0.3; voice.update(); expect(voice.snapshot.weights).toEqual({ A: 0.8 });
});
it('does not revive playback after a stale play promise resolves following stop or disposal', async () => {
  const source = media(), voice = createGuideSpeech(content, source); let resolve!: () => void;
  source.play = () => new Promise<void>(yes => { resolve = () => { source.paused = false; yes(); }; });
  const playing = voice.play(); voice.stop(); resolve(); await playing;
  expect(source.paused).toBe(true); expect(voice.snapshot.status).toBe('idle');
  voice.destroy(); await expect(voice.play()).rejects.toThrow(/disposed/i);
});
it('reports missing recordings rather than synthesizing or skipping speech', async () => {
  const voice = createGuideSpeech(undefined, media());
  await expect(voice.play()).rejects.toThrow(/recording/i);
  expect(voice.snapshot.status).toBe('error'); expect(voice.snapshot.caption).toBe('');
});
it('advances mouth cues without advancing captions or animating blocked playback', () => {
  const tuned = { ...content, mouthLeadSeconds: 0.1, captions: [{ start: 0.2, end: 2, text: 'Hello' }] };
  expect(sampleSpeech(tuned, 0.15, true)).toEqual({ caption: '', weights: { A: 0.8 } });
  expect(sampleSpeech(tuned, 0.15, false)).toEqual({ caption: '', weights: {} });
  expect(sampleSpeech(tuned, 1.95, true).weights).toEqual({});
  expect(() => validateSpeech({ ...tuned, mouthLeadSeconds: NaN })).toThrow(/mouth.*lead/i);
  expect(() => validateSpeech({ ...tuned, mouthLeadSeconds: 1 })).toThrow(/mouth.*lead/i);
});
