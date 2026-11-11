import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { guideSpeech } from '../src/guide/config';
import { createGuideSpeech, validateSpeech } from '../src/guide/speech';
import { createGuideSequence } from '../src/guide/sequence';

it('ships cues and captions bound to the actual trimmed recording bytes', () => {
  expect(guideSpeech).toBeDefined();
  const content = guideSpeech;
  const audio = readFileSync(new URL(`../public${content.audioUrl}`, import.meta.url));
  expect(content.audioRevision).toBe(`sha256:${createHash('sha256').update(audio).digest('hex')}`);
  expect(() => validateSpeech(content, 30)).not.toThrow();
  expect(content.cueAudioRevision).toBe(content.audioRevision);
});
it('keeps the guide seated during the excerpt and stands only when media playback ends', async () => {
  expect(guideSpeech).toBeDefined();
  const media = { currentTime: 0, duration: 30, paused: true, ended: false, readyState: 4, error: null, src: '', crossOrigin: '', volume: 1, muted: false,
    async play() { this.paused = false; }, pause() { this.paused = true; }, load() {}, removeAttribute() {} };
  const voice = createGuideSpeech(guideSpeech, media), guide = createGuideSequence(voice);
  guide.start();
  for (let i = 0; i < 300; i++) guide.update(0.05);
  await Promise.resolve();
  media.currentTime = 29.9; guide.update(0.05);
  expect(guide.checkpoint).toBe('talk'); expect(guide.pose.seated).toBe(1);
  media.currentTime = 30; media.ended = true; guide.update(0.05);
  expect(voice.snapshot.weights).toEqual({});
  for (let i = 0; i < 30; i++) guide.update(0.05);
  expect(guide.state).toBe('completed'); expect(guide.pose.seated).toBe(0);
  guide.destroy();
});
