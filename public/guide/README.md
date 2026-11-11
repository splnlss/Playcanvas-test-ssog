# Ronda guide speech excerpt

Source supplied by the user: [20261030_SLV-Joseph-Ronda.mp3](https://pub-dd92ae5131ec49f1bbd411b51a858249.r2.dev/01_SLV_RondaJoseph/20261030_SLV-Joseph-Ronda.mp3). Use seconds **0–30 only**. No synthetic voice or omitted-speaker edits were added. The excerpt contains both introductions as recorded.

Preparation (FFmpeg):

```sh
ffmpeg -i 'https://pub-dd92ae5131ec49f1bbd411b51a858249.r2.dev/01_SLV_RondaJoseph/20261030_SLV-Joseph-Ronda.mp3' -t 30 -vn -ar 24000 -ac 1 -c:a libmp3lame -q:a 3 ronda-intro-30s.mp3
ffmpeg -i ronda-intro-30s.mp3 -ar 16000 -ac 1 -c:a pcm_s16le intro.wav
```

FFprobe verified 30.000000 seconds and 297839 bytes. Audio revision: `sha256:933554d95293e86a02db945122e51f2bc4d70394a92251750a422a832b2be606`. The runtime cues and captions must be regenerated/rechecked if those bytes change. A regression test binds the configured revision to the bundled audio bytes.

Captions were generated locally with mlx-whisper using `mlx-community/whisper-small-mlx`, English, word timestamps, and a vocabulary prompt of “Joseph Lobato. Ronda Lobato. San Luis, Colorado.” These are **automatic draft captions, not human-reviewed**. No recording was uploaded to a transcription service. `ronda-intro-30s.transcript.txt` preserves the draft text.

Mouth timings were generated locally from the decoded final excerpt using [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/README.adoc) 1.14.0, `pocketSphinx`, and that automatic transcript as its dialog hint:

```sh
rhubarb --quiet -f json -r pocketSphinx -d dialog.txt -o mouth-cues.json intro.wav
```

The original Rhubarb timing labels are retained in `ronda-intro-30s.rhubarb.json`. For the diagnostic mannequin, the mapping is A→M (closed lips), B→E (0.45), C→A (0.65), D→A (1), E→O (0.6), F→O (1), G→E (0.6), H→E (0.8), X→neutral. This is a simplified visual mapping, not production facial-rig acceptance. Caption and mouth intervals use actual media seconds and fit the 30-second duration.

Runtime configuration lives in `src/guide/ronda-speech.json`. Audio is served from the same origin at `/guide/ronda-intro-30s.mp3`, so playback does not fetch the full source recording or depend on its CORS settings.

The Ronda package applies a 0.10-second mouth lead after user feedback that the mouth appeared late. Only facial cue sampling is advanced; audio and caption timing stay at the actual media position. Adjust `mouthLeadSeconds` in `src/guide/ronda-speech.json` within 0–0.3 seconds for further visual calibration.
