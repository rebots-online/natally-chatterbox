import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import { env } from '../node_modules/@huggingface/transformers/src/env.js';
import { get_tokenizer_files } from '../node_modules/@huggingface/transformers/src/utils/model_registry/get_tokenizer_files.js';
import { get_file_metadata } from '../node_modules/@huggingface/transformers/src/utils/model_registry/get_file_metadata.js';

test('fresh voice startup finds pinned saved files without network metadata probes', async () => {
  const model = 'onnx-community/Supertonic-TTS-ONNX';
  const prefix = 'https://huggingface.co/onnx-community/Supertonic-TTS-ONNX/resolve/cff123c84b0655d9d647641f1b532c3cbb8f7faa/';
  const files = ['config.json', 'tokenizer.json', 'tokenizer_config.json',
    'onnx/text_encoder.onnx', 'onnx/text_encoder.onnx_data',
    'onnx/latent_denoiser.onnx', 'onnx/latent_denoiser.onnx_data',
    'onnx/voice_decoder.onnx', 'onnx/voice_decoder.onnx_data'];
  const savedFiles = new Map(files.map(file => [prefix + file,
    new Response('saved', { headers: { 'content-length': '5' } })]));
  const original = { ...env };
  const networkRequests = [];
  try {
    // Execute the real worker's startup configuration. Only cache storage and
    // the unavailable network are substituted; upstream metadata lookup is real.
    const source = readFileSync(new URL('../src/services/supertonic.worker.ts', import.meta.url), 'utf8');
    const startup = transformSync(source.slice(source.indexOf('const MODEL_ID'), source.indexOf('let engine:')), { loader: 'ts' }).code;
    env.backends = { onnx: { wasm: {} } };
    runInNewContext(startup, { env });
    env.useCustomCache = true;
    env.useFSCache = false;
    env.customCache = {
      match: async key => savedFiles.get(String(key))?.clone(),
      put: async (key, value) => { savedFiles.set(String(key), value.clone()); },
    };
    env.fetch = async url => {
      networkRequests.push(String(url));
      throw new TypeError('Network unavailable despite a complete saved voice model');
    };
    // Transformers.js 4.3.1's tokenizer discovery omits the caller's revision.
    // This must still resolve to the installed revision, not /resolve/main/.
    assert.deepEqual(await get_tokenizer_files(model), ['tokenizer.json', 'tokenizer_config.json']);
    for (const file of files) {
      const metadata = await get_file_metadata(model, file);
      assert.equal(metadata.fromCache, true, file + ' must use the saved revision');
    }
    assert.deepEqual(networkRequests, []);
  } finally {
    Object.assign(env, original);
  }
});
