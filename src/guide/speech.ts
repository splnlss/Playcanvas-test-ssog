import type { GuideSpeech, SpeechSnapshot } from './sequence';
import type { Vec3Tuple } from '../movement';

type Interval = { start: number; end: number };
export type SpeechPackage = {
  audioUrl: string; audioRevision: string; cueAudioRevision: string;
  captions: (Interval & { text: string })[];
  cues: (Interval & { viseme: string; weight: number })[];
};
export type PlaybackMedia = Pick<HTMLAudioElement, 'currentTime' | 'duration' | 'paused' | 'ended' | 'readyState' | 'error' | 'src' | 'crossOrigin' | 'volume' | 'muted' | 'play' | 'pause' | 'load' | 'removeAttribute'>;
const visemes = new Set(['neutral', 'A', 'E', 'O', 'M']);

/** Small prototype vocabulary; production rig/cue mappings must be validated separately. */
export function validateSpeech(content: SpeechPackage, duration?: number) {
  if (!content.audioUrl.trim() || !content.audioRevision.trim() || content.audioRevision !== content.cueAudioRevision) throw new Error('Audio and cue revision must match.');
  if (!content.cues.length || !content.captions.length) throw new Error('Final recording needs checked captions and mouth cues.');
  for (const intervals of [content.captions, content.cues]) {
    let end = 0;
    for (const item of intervals) {
      if (!Number.isFinite(item.start) || !Number.isFinite(item.end) || item.start < end || item.end <= item.start) throw new Error('Cue/caption intervals must be ordered without overlap.');
      if (duration !== undefined && Number.isFinite(duration) && item.end > duration + 0.02) throw new Error('Cue/caption exceeds audio duration.');
      end = item.end;
    }
  }
  if (content.captions.some(c => !c.text.trim())) throw new Error('Caption text is required.');
  if (content.cues.some(c => !visemes.has(c.viseme) || !Number.isFinite(c.weight) || c.weight < 0 || c.weight > 1)) throw new Error('Unsupported viseme or invalid weight.');
}
export function sampleSpeech(content: SpeechPackage, time: number, active: boolean) {
  if (!active || !Number.isFinite(time)) return { caption: '', weights: {} as Record<string, number> };
  const caption = content.captions.find(c => time >= c.start && time < c.end)?.text ?? '';
  const cue = content.cues.find(c => time >= c.start && time < c.end);
  const weights: Record<string, number> = {};
  if (cue && cue.viseme !== 'neutral') {
    const blend = Math.min(1, (time - cue.start) / 0.04, (cue.end - time) / 0.04);
    weights[cue.viseme] = cue.weight * Math.max(0, blend);
  }
  return { caption, weights };
}

export function createGuideSpeech(content?: SpeechPackage, media: PlaybackMedia = new Audio()) {
  const snapshot: SpeechSnapshot = { status: 'idle', time: 0, caption: '', weights: {}, error: '' };
  let epoch = 0, disposed = false, intended = false, begun = false;
  let pending: Promise<void> | undefined;
  let context: AudioContext | undefined, panner: PannerNode | undefined, gain: GainNode | undefined;
  const neutral = () => { snapshot.weights = {}; snapshot.caption = ''; };
  const failure = (error: unknown) => { snapshot.status = 'error'; snapshot.error = error instanceof Error ? error.message : String(error); intended = false; media.pause(); neutral(); };
  if (content) { media.crossOrigin = 'anonymous'; media.src = content.audioUrl; }
  const voice: GuideSpeech & {
    unlock(): Promise<void>; spatial(head: Vec3Tuple, listener: Vec3Tuple, forward: Vec3Tuple, up: Vec3Tuple): void;
    setVolume(value: number): void; setMuted(value: boolean): void;
  } = {
    snapshot,
    async unlock() {
      if (!content || disposed) return;
      if (!context) {
        context = new AudioContext();
        const source = context.createMediaElementSource(media as HTMLMediaElement);
        panner = context.createPanner(); panner.panningModel = 'HRTF'; panner.refDistance = 1; panner.maxDistance = 20;
        gain = context.createGain(); source.connect(panner); panner.connect(gain); gain.connect(context.destination);
      }
      await context.resume();
    },
    play() {
      if (disposed) return Promise.reject(new Error('Speech disposed.'));
      if (pending) return pending;
      if (!content) { const e = new Error('Final voice recording, checked captions and mouth cues are not configured. Pose preview is seated; add them in src/guide/config.ts, then reload.'); failure(e); return Promise.reject(e); }
      try { validateSpeech(content, media.duration); } catch (error) { failure(error); return Promise.reject(error); }
      if (media.ended) media.currentTime = 0;
      intended = true; snapshot.status = 'waiting'; snapshot.error = '';
      const attempt = ++epoch;
      // Called directly by gesture handlers on Resume/Enable audio, before any await.
      pending = media.play().then(() => {
        if (attempt !== epoch || disposed) { if (!intended || disposed) media.pause(); return; }
        begun = true; snapshot.status = 'playing';
      }).catch(error => {
        if (attempt !== epoch || disposed) return;
        if (error?.name === 'NotAllowedError') { snapshot.status = 'waiting'; snapshot.error = 'Enable audio to continue.'; neutral(); }
        else { failure(error); throw error; }
      }).finally(() => { if (attempt === epoch) pending = undefined; });
      return pending;
    },
    pause() { epoch++; pending = undefined; intended = false; media.pause(); if (begun) snapshot.status = 'paused'; },
    stop() {
      epoch++; pending = undefined; intended = begun = false; media.pause(); media.currentTime = 0;
      snapshot.time = 0; snapshot.status = 'idle'; snapshot.error = ''; neutral();
    },
    update() {
      if (disposed || !content || snapshot.status === 'error') return;
      if (media.error) { failure(new Error('Voice recording failed to load or decode. Check its URL and CORS settings.')); return; }
      try { if (Number.isFinite(media.duration)) validateSpeech(content, media.duration); }
      catch (error) { failure(error); return; }
      snapshot.time = media.currentTime;
      if (begun && media.ended) { snapshot.status = 'ended'; intended = false; neutral(); return; }
      if (intended && begun) snapshot.status = media.paused || media.readyState < 3 ? 'waiting' : 'playing';
      const sample = sampleSpeech(content, snapshot.time, begun && snapshot.status !== 'idle');
      snapshot.caption = sample.caption; snapshot.weights = sample.weights;
    },
    spatial(head, listener, forward, up) {
      if (!context || !panner) return;
      const time = context.currentTime;
      [panner.positionX, panner.positionY, panner.positionZ].forEach((p, i) => p.setValueAtTime(head[i], time));
      [context.listener.positionX, context.listener.positionY, context.listener.positionZ].forEach((p, i) => p.setValueAtTime(listener[i], time));
      [context.listener.forwardX, context.listener.forwardY, context.listener.forwardZ].forEach((p, i) => p.setValueAtTime(forward[i], time));
      [context.listener.upX, context.listener.upY, context.listener.upZ].forEach((p, i) => p.setValueAtTime(up[i], time));
    },
    setVolume(value) { if (Number.isFinite(value)) media.volume = Math.max(0, Math.min(value, 1)); },
    setMuted(value) { media.muted = value; },
    destroy() {
      if (disposed) return;
      voice.stop(); disposed = true; media.removeAttribute('src'); media.load();
      panner?.disconnect(); gain?.disconnect(); if (context) void context.close().catch(() => {});
    },
  };
  return voice;
}
