import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { patchFileReadSource, patchOnnxRuntime } from './onnx-progress-plugin';

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve('@huggingface/transformers'));
const file = resolve(dist, 'transformers.web.js');
const source = readFileSync(file, 'utf8');
patchFileReadSource(patchOnnxRuntime(source)); // Fail loudly on source drift.
const anchors = ['var InferenceSession = ONNX.InferenceSession;', 'status: "download",\n    name: path_or_repo_id,\n    file: filename'];
console.log(JSON.stringify({ runtime: '@huggingface/transformers@4.3.1', sourceSha256: createHash('sha256').update(source).digest('hex'),
  landmarks: anchors.map(anchor => ({ anchor, line: source.slice(0, source.indexOf(anchor)).split('\n').length,
    source: source.slice(Math.max(0, source.indexOf(anchor) - 150), source.indexOf(anchor) + anchor.length + 350) })),
  instruction: 'Instrument these verified source boundaries. Emit start before actual work and complete only after the native promise resolves; emit error and rethrow the same rejection. Retain native receiver, options, results and device selection. Report exact file, actual cacheHit source, backend and monotonic duration. A heartbeat acknowledges responsiveness, never completion. Use measured bytes and native graph completions for progress. Add pending-promise and error-preservation tests. Refuse ambiguous or changed anchors. Keep participant recording opt-in; whitelist exports, do not upload. See DOCS/HONEST-PROGRESS-SOP.md.' }, null, 2));
