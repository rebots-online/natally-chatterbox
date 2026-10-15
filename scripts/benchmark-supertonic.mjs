import { pipeline, env } from '@huggingface/transformers';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const revision = 'cff123c84b0655d9d647641f1b532c3cbb8f7faa';
const model = 'onnx-community/Supertonic-TTS-ONNX';
env.allowLocalModels = false;
env.cacheDir = './.voice-benchmark-cache';
const started = performance.now();
const engine = await pipeline('text-to-speech', model, {
  revision, device: 'cpu', dtype: 'fp32',
  session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
});
const loadSeconds = (performance.now() - started) / 1000;
const response = await fetch(`https://huggingface.co/${model}/resolve/${revision}/voices/F4.bin`);
if (!response.ok) throw new Error('Cannot load F4 embedding: ' + response.status);
const voice = new Float32Array(await response.arrayBuffer());
const paragraphs = [
  'Your natal chart describes a pattern, not a verdict. We can start with the Sun and Moon, then look at how those different needs work together in everyday life. You do not have to have everything figured out today.',
  'Now let us compare that foundation with the current sky. A transit is a temporary relationship between a moving planet and a position in your birth chart. It is different from an aspect that has always been part of your natal chart, and it deserves its own explanation rather than a dramatic prediction.',
  'For today, choose one small thing you can actually do. Perhaps that means writing down a feeling before reacting, making room for a useful conversation, or taking a proper break. Cosmic perspective is lovely, but a glass of water and a manageable plan are also valid.',
];
const chunks = [];
for (const text of paragraphs) {
  const before = performance.now();
  const output = await engine(text, { speaker_embeddings: voice, num_inference_steps: 5, speed: 0.85 });
  const synthesisSeconds = (performance.now() - before) / 1000;
  const playbackSeconds = output.audio.length / output.sampling_rate / 1.3;
  if (!output.audio.length || !output.audio.every(Number.isFinite)) throw new Error('Invalid synthesized PCM');
  const result = { characters: text.length, synthesisSeconds, playbackSeconds, realTimeFactor: synthesisSeconds / playbackSeconds };
  chunks.push(result);
  console.log(JSON.stringify(result));
}
const report = {
  recordedAt: new Date().toISOString(), runtime: 'Node native ONNX CPU; NOT browser WASM or a phone',
  node: process.version, model, revision, voice: 'F4', synthesisSpeed: 0.85, playbackPitch: 1.3,
  inferenceThreads: 1, loadSeconds, maxRssMiB: process.resourceUsage().maxRSS / 1024, chunks,
};
await mkdir('DOCS/verification', { recursive: true });
await writeFile('DOCS/verification/supertonic-native-cpu-diagnostic.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
await engine.dispose();
