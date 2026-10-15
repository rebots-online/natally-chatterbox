# Natally Chatterbox — closed architecture blueprint

| Contract | Fixed value |
|---|---|
| Revision / date | CB-ARCH-1 / 2026-10-15 |
| Design state | Finished blueprint submitted for Robin's sign-off; no implementation released |
| Repository / baseline | rebots-online/natally-chatterbox / f190a5ff64f2aa6b5ab3423022045343c4e22077 |
| Checkout / deployment target | E:/devProjects/natally-chatterbox / https://natally-chatterbox.surge.sh |
| Permitted product delta | Browser-local Chatterbox Nano ONNX replaces Supertonic; immediate background readiness; whole-turn/sentence/logical-unit speech |
| Closed declaration set | PUML nodes, members, parameters, local bindings, callback slots, tables, assets and dependency methods below |
| Authority | Approve ARCHITECTURE → derive/release CHECKLIST → execute only CHECKLIST |
| Unlisted declaration | Forbidden, including a helper, temporary, callback, class, method, parameter, import or library; approved architecture amendment must precede checklist amendment |
| Existing source | Immutable template baseline except the exact binding edits B01–B12; inherited declarations are not permission to modify their bodies |
| Current work | This document only; no source, assets, dependencies, configuration, checklist recipe, tests, build or deployment |
| Incident | Admin-Manual INC-19 / urn:uuid:8ca00c68-2e6e-453a-bdd0-ebf85b7318e2 |

## 1. PlantUML AST — closed declarations and wiring

AST stereotypes describe authored TypeScript declarations, not additional runtime
classes. The module nodes' members and attached notes enumerate every proposed
declaration. Function IDs join to their exact parameter/local/body contracts.
Existing B-nodes are bounded edits to baseline declarations, not new APIs.
No implicit helper generation or implementation-selected names are permitted.

```plantuml
@startuml CB_ARCH_1_AST
left to right direction
skinparam packageStyle rectangle
hide empty members

package "M01 src/services/chatterboxTypes.ts [new :1]" {
  enum "VoiceId" as T01 {
    F1
    F2
    F3
    F4
    F5
    M1
    M2
  }
  enum "Backend" as T02 {
    webgpu
    wasm
  }
  enum "GraphRole" as T03 {
    embed_tokens
    speech_encoder
    language_model
    conditional_decoder
  }
  interface "LocalSpeech" as T04 {
    samples: Float32Array
    sampleRate: number
    generationMs: number
    backend: Backend
    clipReuse: boolean
  }
  interface "SpeechUnit" as T05 {
    text: string
    start: number
    end: number
    tokenCount: number
  }
  interface "VoiceStatus" as T06 {
    phase: idle|loading|preparing|ready|synthesizing|error
    message: string
    loadedBytes?: number
    totalBytes?: number
    file?: string
    files?: VoiceFileProgress[]
    graphs?: VoiceGraphProgress[]
    startedAt?: number
    confirmedAt?: number
    runtimeEvent?: boolean
    heartbeatAt?: number
  }
  interface "VoiceGraphProgress" as T07 {
    file: string
    backend: Backend
    operation: session|run
    state: start|complete|error
    completed: number
    expected?: number
    startedAt: number
    durationMs?: number
  }
  interface "VoiceFileProgress" as T08 {
    file: string
    loadedBytes: number
    totalBytes: number
    source: cache|network|unknown
  }
  class "WorkerRequest" as T09 <<discriminated-union>> {
    id: number
    kind: preload|plan|speak
    voice: VoiceId
    forceWasm: boolean
    text: string [plan,speak only]
    speed: number [speak only]
  }
  class "WorkerMessage" as T10 <<discriminated-union>> {
    status: VoiceStatus [status variant]
    heartbeat: number [heartbeat variant]
    measurement: VoiceMeasurement [measurement variant]
    id: number [response variants]
    kind: preloaded|planned|spoken|failed [response variants]
    units: SpeechUnit[] [planned only]
    audio: LocalSpeech [spoken only]
    message: string [failed only]
    runtimeFailed: boolean [failed only]
    inputRejected: boolean [failed only]
    backend: Backend [failed only]
  }
  interface "PendingRequest" as T11 {
    kind: WorkerRequest.kind
    resolve: (value: WorkerMessage) => void
    reject: (error: Error) => void
    timer: ReturnType<typeof setTimeout>
  }
  interface "Engine" as T12 {
    sessions: Sessions
    tokenizer: Tokenizer
    backend: Backend
  }
  class "Sessions" as T13S <<type-alias>> {
    Sessions = Record<GraphRole, ort.InferenceSession>
  }
  class "TensorMap" as T13M <<type-alias>> {
    TensorMap = Record<string, ort.Tensor>
  }
  class "Tokenizer" as T13T <<type-alias>> {
    Tokenizer = Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>
  }
  interface "ModelFile" as T14 {
    bytes: number
    sha256: string
  }
  interface "ReferenceSpec" as T15 {
    path: string
    bytes: number
    gitBlob: string
  }
  class "WorkerPayload" as T16 <<type-alias>> {
    Omit<Extract<WorkerRequest,{kind:'preload'}>,'id'>
    | Omit<Extract<WorkerRequest,{kind:'plan'}>,'id'>
    | Omit<Extract<WorkerRequest,{kind:'speak'}>,'id'>
  }
  class "WebGpuNavigator" as T17 <<type-alias>> {
    Navigator & {gpu?: {requestAdapter(): Promise<WebGpuAdapter|null>}}
  }
  interface "WebGpuAdapter" as T18 {
    features: {has(value:string): boolean}
  }
}

class "M02 chatterboxModel.ts [new :1]" as M02 <<module>> {
  CHATTERBOX_MODEL: string [const]
  CHATTERBOX_REVISION: string [const]
  CHATTERBOX_FILES: Readonly<Record<string,ModelFile>> [const]
  GRAPH_PATHS: Readonly<Record<GraphRole,string>> [const]
  VOICE_REFERENCES: Readonly<Record<VoiceId,ReferenceSpec>> [const]
  LIMITS.textTokens: 768
  LIMITS.speechTokens: 4096
  LIMITS.contextTokens: 8196
  LIMITS.clipBytes: 16000000
  LIMITS.referenceSamples: 240000
  LIMITS.sampleRate: 24000
  LIMITS.inactivityMs: 300000
  SAMPLING.temperature: 0.8
  SAMPLING.topK: 1000
  SAMPLING.topP: 0.95
  SAMPLING.repetitionPenalty: 1.2
  SAMPLING.startToken: 6561
  SAMPLING.stopToken: 6562
  SAMPLING.silenceToken: 4299
}
class "M03 chatterboxTts.ts [new :1]" as M03 <<module>> {
  status: VoiceStatus
  listeners: Set<(value:VoiceStatus)=>void>
  worker: Worker|null
  nextId: number
  pending: Map<number,PendingRequest>
  preloads: Map<VoiceId,Promise<void>>
  selectedVoice: VoiceId
  forceWasm: boolean
  lastAcknowledgedAt: number
  --
  F01 reportVoiceStatus(value:VoiceStatus): void
  F02 subscribeVoiceStatus(listener:(value:VoiceStatus)=>void): ()=>void
  F03 resetWorker(message:string): void
  F04 requestWorker(payload:WorkerPayload): Promise<WorkerMessage>
  F05 handleWorkerMessage(event:MessageEvent<WorkerMessage>): void
  F06 handleWorkerFailure(event:Event|MessageEvent<unknown>): void
  F07 expireWorker(): void
  F08 initChatterbox(voice:VoiceId): Promise<void>
  F09 planChatterboxSpeech(text:string,voice:VoiceId): Promise<SpeechUnit[]>
  F10 chatterboxSpeak(text:string,options:{voice:VoiceId;speed:number}): Promise<LocalSpeech>
  F11 cancelChatterbox(): void
}
class "M04 chatterbox.worker.ts [new :1]" as M04 <<module>> {
  engine: Promise<Engine>|null
  queue: Promise<void>
  current: VoiceStatus
  requestContext: {id:number;runId:string;started:number;workload:VoiceMeasurement.workload}
  graphs: Map<string,VoiceGraphProgress>
  files: Map<string,VoiceFileProgress>
  references: Map<VoiceId,TensorMap>
  clips: Map<string,Float32Array>
  clipBytes: number
  runtimeFailure: boolean
  --
  F12 status(phase:VoiceStatus.phase,message:string,extra:Partial<VoiceStatus>): void
  F13 measure(event:Omit<VoiceMeasurement,'runId'|'revision'|'atMs'>): void
  F14 observe<T>(role:GraphRole,operation:'session'|'run',action:()=>Promise<T>): Promise<T>
  F15 loadBytes(file:keyof CHATTERBOX_FILES): Promise<Uint8Array>
  F16 loadEngine(forceWasm:boolean): Promise<Engine>
  F17 prepareReference(engine:Engine,voice:VoiceId): Promise<TensorMap>
  F18 runGraph(engine:Engine,role:GraphRole,feeds:TensorMap): Promise<TensorMap>
  F19 generateUnit(engine:Engine,text:string,reference:TensorMap): Promise<Float32Array>
  F20 handleRequest(data:WorkerRequest): Promise<void>
  F21 handleMessage(event:MessageEvent<WorkerRequest>): void
}
class "M05 chatterboxGeneration.ts [new :1]" as M05 <<module>> {
  F22 chooseSpeechToken(logits:Float32Array,generated:number[]): number
  F23 int64(values:readonly number[],dims:number[]): ort.Tensor
  F24 disposeTensors(values:TensorMap): void
  F25 halfToFloat(bits:number): number
}
class "M06 speechUnits.ts [new :1]" as M06 <<module>> {
  F26 planSpeechUnits(text:string,countTokens:(value:string)=>number,maxTokens:number): SpeechUnit[]
}

note bottom of M03
  Closed function-local AST bindings:
  F01 listener:(value:VoiceStatus)=>void [observer iterator]
  F02 no locals; unsubscribe captures listener
  F03 request:PendingRequest [pending iterator]
  F04 id:number; timer:ReturnType<typeof setTimeout>;
      resolve:(value:WorkerMessage)=>void; reject:(error:Error)=>void;
      error:unknown [catch]
  F05 data:WorkerMessage; request:PendingRequest|undefined;
      waiting:PendingRequest [timer-refresh iterator]
  F06/F07 no locals; F06 event is the failed worker's event
  F08 preload:Promise<void>|undefined; message:WorkerMessage [success];
      error:unknown [rejection]
  F09 message:WorkerMessage
  F10 message:WorkerMessage; sample:number [PCM-validation iterator]
  F11 request:PendingRequest [pending iterator]
  Callback slots:
  F02 unsubscribe; F04 Promise executor;
  F08 success/rejection; F11 preload rejection [no parameters];
  Worker events use F05/F06; timeout uses F07.
end note

note bottom of M04
  Closed function-local AST bindings:
  F12/F13 no locals
  F14 key:string; started:number; previous:VoiceGraphProgress|undefined;
      result:T; error:unknown
  F15 spec:ModelFile; url:string; cache:Cache; saved:Response|undefined;
      response:Response; reader:ReadableStreamDefaultReader<Uint8Array>;
      part:ReadableStreamReadResult<Uint8Array>; chunks:Uint8Array[];
      loaded:number; bytes:Uint8Array; offset:number; chunk:Uint8Array;
      digest:ArrayBuffer; hex:string; byte:number;
      source:'cache'|'network'; started:number; error:unknown
  F16 adapter:WebGpuAdapter|null; backend:Backend; sessions:Sessions;
      role:GraphRole; file:keyof CHATTERBOX_FILES; model:Uint8Array;
      data:Uint8Array; tokenizer:Tokenizer; session:ort.InferenceSession;
      error:unknown
  F17 spec:ReferenceSpec; response:Response; wav:DataView; count:number;
      audio:Float32Array; index:number; tensor:ort.Tensor;
      conditioning:TensorMap
  F18 no locals
  F19 tokens:ReturnType<Tokenizer>; input:ort.Tensor; cache:TensorMap;
      meta:ort.InferenceSession.ValueMetadata; sequenceLength:number;
      first:boolean; reachedEos:boolean; generated:number[]; step:number;
      embedded:TensorMap; embeds:ort.Tensor; combined:Float32Array;
      length:number; mask:ort.Tensor; positions:ort.Tensor;
      output:TensorMap; logits:ort.Tensor; raw:ort.Tensor.DataType;
      float:Float32Array; token:number; name:string; index:number;
      speech:number[]; all:number[]; speechTokens:ort.Tensor;
      decoded:TensorMap; waveform:ort.Tensor; samples:Float32Array
  F20 heartbeat:ReturnType<typeof setInterval>; ready:Engine; reference:TensorMap;
      units:SpeechUnit[]; key:string; started:number;
      samples:Float32Array|undefined; clipReuse:boolean; oldest:string;
      copy:Float32Array; speed:number; error:unknown; inputRejected:boolean
  F21 no locals
  Callback slots:
  F14 action supplied by F16/F18; F16 coalesced initializer and rejection;
  F20 heartbeat [no parameters], countTokens(value:string);
  F21 queued continuation [captures event, no parameters].
end note

note bottom of M05
  F22 locals: scores:Float32Array; seen:Set<number>; token:number;
      index:number; ranked:number[]; maximum:number; weights:number[];
      total:number; cumulative:number; retained:number; draw:number.
      Comparator parameters left:number,right:number; no local declarations.
  F23 locals: data:BigInt64Array; index:number.
  F24 locals: tensor:ort.Tensor [iterator].
  F25 locals: sign:number; exponent:number; mantissa:number.
end note
note bottom of M06
  F26 locals: units:SpeechUnit[]; boundaries:number[];
      segmenter:Intl.Segmenter|null; paragraph:RegExpMatchArray;
      segment:Intl.SegmentData; start:number; end:number;
      candidate:string; tokenCount:number; boundary:number; index:number.
  countTokens is a passed function parameter, not a new helper.
end note

class "B01 main.tsx:1" as B01 <<entry-edit>> {
  initChatterbox(loadVoiceSettings().aiVoiceName as VoiceId) before createRoot.render
  no new locals; rejection observer has no parameters or locals
}
class "B02 voiceService.ts:5,55,69" as B02 <<type-and-literal-edit>> {
  VoiceSettings.ttsModel = 'chatterbox-nano-onnx'
  DEFAULT_VOICE_SETTINGS.ttsModel = 'chatterbox-nano-onnx'
  loadVoiceSettings(): VoiceSettings [same discriminator]
}
class "B03 voiceService.ts:93" as B03 <<function-edit>> {
  saveVoiceSettings(settings:VoiceSettings): void
  settings existing; e:unknown existing catch
  no new locals; preload rejection observer has no parameters
}
class "B04 voiceService.ts:106" as B04 <<function-edit>> {
  prepareSpeechWithOffsets(rawText:string): {text:string;sourceOffsets:number[]}
  end:number; characters:{char:string;index:number}[]
  intermediate:string; excluded:Set<number>; match:RegExpMatchArray
  index:number; compact:{char:string;index:number}[]
  item:{char:string;index:number}; separator:' '|newline
  inherited map/filter parameters char:string,index:number
}
class "B05 voiceService.ts:151" as B05 <<function-edit>> {
  stopSpeaking(): void
  no new local declarations
}
class "B06 voiceService.ts:162" as B06 <<function-edit>> {
  speakNatallyText(text:string,settings:VoiceSettings,
    onStart?:()=>void,onEnd?:()=>void,
    onWordBoundary?:(charIndex:number,charLength?:number)=>void): Promise<boolean>
  prepared:{text:string;sourceOffsets:number[]}; clean:string
  requestGeneration:number; ended:boolean; context:AudioContext|null
  pitch:number; started:boolean; units:SpeechUnit[]; unit:SpeechUnit
  capabilities:{hardwareConcurrency?:number;deviceMemory?:number}
  realTimeFactor:number|undefined; policy:{chunkChars:number;prefetch:boolean}
  unitIndex:number; nextUnit:SpeechUnit|undefined; prefetch:boolean; observed:number
  pendingAudio:Promise<{audio:LocalSpeech|null;error:unknown}>
  result:{audio:LocalSpeech|null;error:unknown}
  audio:LocalSpeech; durationMs:number; buffer:AudioBuffer
  source:AudioBufferSourceNode; filters:AudioNode[]; words:RegExpMatchArray[]
  wordIndex:number; finished:boolean; timer:ReturnType<typeof setInterval>
  word:RegExpMatchArray|undefined; position:number; rawStart:number; rawEnd:number
  low:BiquadFilterNode; high:BiquadFilterNode; headroom:GainNode; error:unknown
  nested end():void; emitWord():void; finish():void
  nested synthesize(unit:SpeechUnit):Promise<{audio:LocalSpeech|null;error:unknown}>
  synthesize result callbacks audio:LocalSpeech and error:unknown
  playback executor(resolve:()=>void,reject:(error:unknown)=>void):void
  source-start catch error:unknown; filter-disconnect iterator filter:AudioNode
}
class "B07 NatallyConfigModal.tsx:40" as B07 <<binding-edit>> {
  existing props/state/functions remain unchanged
  engine/status imports, literals and disclosure only
  existing onChange event:React.ChangeEvent<HTMLSelectElement>
  existing updated:VoiceSettings; no new local declarations
}
class "B08 VoiceDownloadStatus.tsx:1" as B08 <<import-edit>> {
  subscribeVoiceStatus from M03; VoiceStatus from M01
  existing VoiceDownloadStatus/VoiceProgress/format unchanged
}
class "B09 FirstLight.tsx:51" as B09 <<effect-removal>> {
  remove scheduleSupertonicPreload import and effect only
}
class "B10 voiceMeasurements.ts:1,62,81" as B10 <<bounded-edit>> {
  VOICE_REVISION:string = CHATTERBOX_REVISION
  VoiceMeasurementStore.record(event:VoiceMeasurement):void [file allowlist only]
  VoiceMeasurementStore.export(survey:VoiceSurvey) [runtime label only]
  inherited clean:VoiceMeasurement; key:string; snapshot:existing return type
  no new class, state, field, function or local declarations
}
class "B11 tests/voice-browser.html" as B11 <<import-edit>> {
  existing subscribeVoiceStatus import to M03 only; no extension or execution
}
class "B12 package.json / lock / .env.example / .env" as B12 <<configuration>> {
  exact values and library versions in sections 5-6; no code
}
class "A01 public/voices/chatterbox/" as A01 <<assets>> {
  F1.wav; F2.wav; F3.wav; F4.wav; F5.wav; M1.wav; M2.wav; NOTICE.md
  fixed bytes and blob identities in section 6
}
class "L01 React and ReactDOM" as L01 <<library>> { 19.3.0; existing render/hooks }
class "L02 Transformers.js" as L02 <<library>> { 4.3.1; AutoTokenizer; env }
class "L03 ONNX Runtime Web" as L03 <<library>> { 1.31.0-dev.20260914-8d85527a0; ort }
class "L04 Vite / TypeScript" as L04 <<build-library>> { 8.3.4 / 7.0.2; existing plugins }
class "L05 browser APIs" as L05 <<platform>> { Worker; message events; fetch; Cache API; streams; crypto; WebGPU }
class "L06 ECMAScript" as L06 <<platform>> { Promise; collections; typed arrays; timers; Intl; numeric/string operations }
class "L07 existing audio/storage" as L07 <<platform>> { AudioContext; PCM sources; existing tone filters; localStorage }
class "L08 inherited product" as L08 <<unchanged>> { marketplace; chat; charts; auth; accounts; inference; billing prototype }

B01 --> M03 : F08 immediately
B01 --> L01 : existing render
B03 --> M03 : F08 saved voice
B05 --> M03 : F11 cancellation
B06 --> M03 : F09 then F10 per whole unit
B06 --> L07 : existing playback
B07 --> M03 : F02 subscription
B08 --> M03 : F02 subscription
B11 --> M03 : F02 import
M03 --> M04 : F04 WorkerRequest / F05 WorkerMessage
M03 --> B10 : existing opt-in measurements
M04 --> M02 : immutable configuration
M04 --> M05 : F22-F25 token/tensor operations
M04 --> M06 : F26 plan
M04 --> A01 : F17 selected reference
M04 --> L02 : F16 tokenizer
M04 --> L03 : F16/F18 sessions
M03 --> L05 : worker lifecycle
M04 --> L05 : cache, network, runtime
M05 --> L06
M06 --> L06
L08 --> B06 : existing completed replies/replay/mascot
T09 --> T01
T10 --> T04
T10 --> T05
T10 --> T06
T12 --> T13S
T12 --> T13T
T16 --> T09
@enduml
```

## 2. Mermaid wiring and lifecycle

```mermaid
flowchart LR
  B01[Application module entry] --> F08[initChatterbox saved voice]
  B03[Existing settings save] --> F08
  L08[Existing marketplace application] --> B06[speakNatallyText]
  B06 --> F09[Plan full turn]
  B06 --> F10[Speak each complete unit]
  F08 --> M03[One shared worker client]
  F09 --> M03
  F10 --> M03
  M03 --> F21[Worker FIFO]
  F21 --> F20[Handle request]
  F20 --> F16[Sessions and tokenizer]
  F16 --> F15[Pinned cache or network assets]
  F20 --> F17[Selected reference encoding]
  F20 --> F26[Whole-turn or sentence-unit plan]
  F20 --> F19[Generate until EOS then decode]
  F19 --> PCM[Complete finite PCM]
  PCM --> B06
  B06 --> L07[Existing playback and source-offset callbacks]
  F20 --> Status[Measured progress and response]
  Status --> M03
  M03 --> UI[Existing strip and settings]
```

```mermaid
sequenceDiagram
  participant Entry as B01 entry
  participant Client as M03 client
  participant Worker as M04 worker
  participant Assets as Cache or pinned origin
  participant UI as Existing UI
  Entry->>Client: F08 immediately; do not await before render
  Client->>Worker: preload selected voice
  Entry->>UI: render App and existing progress strip
  Worker->>Assets: F15 load verified files
  Worker->>Worker: F16 sessions and tokenizer
  Worker->>Worker: F17 selected reference encoding
  Worker-->>Client: ready and preloaded only after both complete
  UI->>Client: F09 completed reply
  Client->>Worker: plan
  Worker-->>Client: complete units with source offsets
  loop each complete unit in order
    UI->>Client: F10 unit
    Client->>Worker: speak
    Worker->>Worker: generate until EOS; decode entire unit
    Worker-->>Client: complete PCM
    Client-->>UI: LocalSpeech
    opt Existing adaptive policy allows one-ahead prefetch
      UI->>Client: F10 next complete unit during playback
    end
    UI->>UI: finish current playback before starting next buffer
  end
```

```mermaid
stateDiagram-v2
  [*] --> Loading: immediate entry preload
  Loading --> Preparing: verified bytes
  Preparing --> Ready: sessions + tokenizer + selected reference
  Ready --> Preparing: saved voice changes
  Ready --> Synthesizing: complete-unit request
  Synthesizing --> Ready: EOS + nonempty finite PCM
  Loading --> Error: asset or session failure
  Preparing --> Error: reference or runtime failure
  Synthesizing --> Error: graph failure or exhausted output budget
  Error --> Loading: explicit retry; failed GPU selects WASM
  Synthesizing --> Loading: Stop terminates obsolete work; immediate cache preload
  Ready --> Ready: Stop during playback retains worker
```

```mermaid
flowchart TD
  Turn[Prepared complete turn] --> Fits{Within 768 tokenizer tokens?}
  Fits -- yes --> One[One exact complete turn]
  Fits -- no --> Boundaries[Whole sentences within logical paragraphs or items]
  Boundaries --> Pack[Pack consecutive complete units within capacity]
  Pack --> Oversize{One indivisible unit exceeds capacity?}
  Oversize -- yes --> Reject[Reject entire plan before audio; no arbitrary cut]
  Oversize -- no --> Serial[Generate and play every unit in order]
  One --> Serial
  Serial --> Current{Still current session and generation?}
  Current -- no --> Stop[Stop playback and obsolete inference]
  Current -- yes --> Offsets[Advance exact offsets; preserve remainder]
```

## 3. Entity table — exact targets, signatures and ownership

All new paths are under src/services/. New-file :1 is the intended declaration
anchor, not a claim that the file exists. Existing file:line anchors are the
CodeGraph baseline. PUML is the closed declaration inventory; these rows fix
behavior. No additional application class or external service is introduced.

| ID | Target / exact entity | Ownership, initialization, result and failure contract |
|---|---|---|
| T01 | chatterboxTypes.ts:1 VoiceId | Closed TypeScript string union F1/F2/F3/F4/F5/M1/M2, shown as a PUML enum; no runtime enum object. |
| T02 | same module Backend | Closed string union webgpu/wasm; no remote/system speech alternative. |
| T03 | same module GraphRole | Closed four graph-role strings, exact declaration order shown in PUML. |
| T04 | same module LocalSpeech | Five required typed fields in PUML; caller owns PCM samples; no hidden encoded/audio URL fields. |
| T05 | same module SpeechUnit | text is exact prepared-text slice [start,end); offsets are UTF-16; tokenCount includes tokenizer special tokens. |
| T06 | same module VoiceStatus | Required phase/message and optional typed measured progress fields exactly as PUML; no new status variants. |
| T07 | same module VoiceGraphProgress | Exact typed session/run acknowledgment and timing fields; counters reflect actual completed native operations. |
| T08 | same module VoiceFileProgress | Exact typed per-file bytes/source fields; source distinguishes cache from network. |
| T09 | same module WorkerRequest | Discriminated union preload/plan/speak; common id/voice/forceWasm; plan/speak text; speak speed; no optional payload ambiguity. |
| T10 | same module WorkerMessage | Seven mutually exclusive variants shown in PUML: status, heartbeat, measurement, preloaded, planned, spoken, failed. Required fields are confined to their variants. |
| T11 | same module PendingRequest | Typed kind/resolve/reject/timer fields exactly as PUML; one owner per request ID. |
| T12 | same module Engine | Typed sessions/tokenizer/backend; worker owns lifetime and all graph resources. |
| T13S | same module Sessions | Record of the four GraphRole keys to ort.InferenceSession. |
| T13M | same module TensorMap | Record of graph input/output names to owned or retained ort.Tensor values; ownership fixed by function contract. |
| T13T | same module Tokenizer | Exact awaited AutoTokenizer.from_pretrained return type; no any substitute. |
| T14 | same module ModelFile | Required bytes/sha256 fields; immutable manifest entry. |
| T15 | same module ReferenceSpec | Required path/bytes/gitBlob fields; one immutable entry per VoiceId. |
| T16 | same module WorkerPayload | Distributive extraction/Omit expression in PUML preserves variant-specific text/speed fields while removing id. |
| T17 | same module WebGpuNavigator | Structural type for the browser-owned optional navigator.gpu API; exact requestAdapter signature in PUML. No added WebGPU typing package. |
| T18 | same module WebGpuAdapter | Structural type for browser-owned features.has(value:string):boolean. No application implementation of this browser method. |
| M02 | chatterboxModel.ts:1; constants in PUML and §6 | Readonly manifest, graph paths, reference identity and resource/sampling limits. Module contains no functions or mutable state. |
| M03 | chatterboxTts.ts:1; PUML state | status idle; listeners/pending/preloads empty; worker null; nextId/lastAcknowledgedAt zero; selectedVoice F4; forceWasm false. Browser tab owns one worker. |
| M04 | chatterbox.worker.ts:1; PUML state | engine null; queue Promise.resolve(); current idle; requestContext id=0/runId=''/started=0/workload='preload'; maps empty; clipBytes zero; runtimeFailure false. Worker owns sessions, tensors, references and PCM cache. |
| F01 | M03 reportVoiceStatus(value):void | Publish complete measured status, retain failure context, synchronously notify observers. |
| F02 | M03 subscribeVoiceStatus(listener):()=>void | Register, immediately deliver latest state, return unsubscribe capturing only listener. |
| F03 | M03 resetWorker(message):void | Terminate old worker, set null, reject all pending IDs, clear their timers and preload map, publish visible error. Does not delete browser model cache. |
| F04 | M03 requestWorker(payload):Promise<WorkerMessage> | Create worker if absent, install F05/F06, allocate ID/timer, register Promise callbacks before postMessage. Reject postMessage/creation failures through F03. |
| F05 | M03 handleWorkerMessage(event):void | Ignore event.currentTarget !== worker; route status/heartbeat/measurement without resolving IDs. Measured confirmedAt advances inactivity timers; heartbeat does not. Resolve/reject matching response variant once. Runtime GPU failure sets forceWasm; input rejection leaves healthy engine usable. |
| F06 | M03 handleWorkerFailure(event):void | Ignore event.currentTarget !== worker; otherwise onerror/onmessageerror → F03 visible runtime failure. No cloud/system voice fallback. |
| F07 | M03 expireWorker():void | Five minutes without new measured work → F03; no unconditional wall-clock cancellation while real work is acknowledged. |
| F08 | M03 initChatterbox(voice):Promise<void> | Set selectedVoice, coalesce per voice in current worker, preload request, require preloaded response. Failure deletes failed key. No sound. |
| F09 | M03 planChatterboxSpeech(text,voice):Promise<SpeechUnit[]> | Await shared F08, send plan; accept only planned response. No synthesis. |
| F10 | M03 chatterboxSpeak(text,options):Promise<LocalSpeech> | Await shared F08; send whole unit; accept only spoken response with finite nonempty samples and positive finite sampleRate. |
| F11 | M03 cancelChatterbox():void | Pending plan/speak → F03 then immediately F08(selectedVoice). Only preload or already returned PCM → retain worker. Observe restart rejection; no silent background promise rejection. |
| F12 | M04 status(phase,message,extra={}):void | Merge current, post typed status. confirmedAt represents measured work, not elapsed-time animation. |
| F13 | M04 measure(event):void | Add requestContext runId/revision/elapsed timestamp; post to existing opt-in collector. No text/identity/URL added to exports. |
| F14 | M04 observe(role,operation,action):Promise<T> | Record measured session/run start/end/error and completed counters. Set runtimeFailure only on session/run exception. Propagate original failure. |
| F15 | M04 loadBytes(file):Promise<Uint8Array> | Fixed pinned URL, revision-keyed Cache API. Read streamed bytes, preserve source and per-file counters. Require exact manifest length and SHA-256 before caching or use. Delete bad cached entry and refetch once; bad network content fails. |
| F16 | M04 loadEngine(forceWasm):Promise<Engine> | Coalesced initializer: WebGPU adapter with shader-f16 unless forced WASM; otherwise WASM, numThreads=1. Four sequential session creations with explicit externalData. Load/pin tokenizer through L02 and same cache/revision. Release partial sessions and clear engine on failure. |
| F17 | M04 prepareReference(engine,voice):Promise<TensorMap> | Same-origin fixed WAV; validate exact byte count, RIFF/WAVE, canonical 44-byte PCM16 mono 24000 Hz layout. Decode first at most 240000 samples /32768. Encoder audio_values [1,count]. Cache four outputs by voice; dispose input tensor in finally. |
| F18 | M04 runGraph(engine,role,feeds):Promise<TensorMap> | F14 wraps the selected session.run. No alternate graph/provider routing. |
| F19 | M04 generateUnit(engine,text,reference):Promise<Float32Array> | Exact generation algorithm §4; all temporary tensors released in finally; reference tensors retained for worker lifetime. Reject absent EOS or nonfinite/empty PCM. |
| F20 | M04 handleRequest(data):Promise<void> | Serialize through F21; set requestContext/graphs/runtimeFailure and heartbeat. preload: F16+F17 then ready. plan: F26 using actual tokenizer count. speak: bounded clip cache or F19 then transferable PCM copy. Failed input is distinct from runtime failure. Heartbeat cleared in finally. |
| F21 | M04 handleMessage(event):void | Sole self.onmessage binding; append F20(event.data) to FIFO queue. F20 handles errors so one failure cannot strand queue. |
| F22 | chatterboxGeneration.ts:1 chooseSpeechToken(logits,generated):number | Exact sampling §4; no extra sampler library or invented fallback speech tokens. |
| F23 | same module int64(values,dims):ort.Tensor | Allocate BigInt64Array, convert each integer to BigInt, construct int64 tensor with exact supplied dimensions. Caller owns disposal. |
| F24 | same module disposeTensors(values):void | Dispose each owned tensor once; no disposal of retained conditioning. |
| F25 | same module halfToFloat(bits):number | IEEE binary16 sign/exponent/mantissa conversion including subnormal, infinity and NaN. Invalid output is rejected by F19/F10. |
| F26 | speechUnits.ts:1 planSpeechUnits(text,countTokens,maxTokens):SpeechUnit[] | Full turn if fits; otherwise paragraph/list-item boundaries and Intl.Segmenter sentence boundaries; pack preceding complete units. No Segmenter: whole paragraphs/items only. Oversize indivisible unit rejects entire plan before any audio. start/end are exact UTF-16 offsets; no lost non-whitespace remainder. |
| B01 | src/main.tsx:1 | F08(loadVoiceSettings().aiVoiceName as VoiceId) immediately before existing render, without awaiting. No idle callback, timer delay, Save-Data skip or auth/onboarding/settings gate. |
| B02 | src/services/voiceService.ts:5/55/69 | Exact engine discriminator/default/migration change shown in PUML; preserve storage key, preset version, all other fields and validation. |
| B03 | same file:93 saveVoiceSettings | Existing persistence then F08(settings.aiVoiceName as VoiceId), observed rejection. No new effect or UI required for voice readiness. |
| B04 | same file:106 prepareSpeechWithOffsets | Preserve existing cleaning/source offset mapping; whitespace normalization retains newline paragraph/item boundaries. separator is newline for CR/LF, otherwise space. Do not rewrite words. |
| B05 | same file:151 stopSpeaking | Existing generation increment/playback stop/end handling plus F11. Stop is immediate even during generation. |
| B06 | same file:162 speakNatallyText | Existing signature in PUML, full prepared turn to F09, existing ordered playback and adaptive serial/one-ahead behavior applied to planned whole units. Pass settings.aiVoiceName as VoiceId at F09/F10 calls; source offsets = unit.start + local word position. Same pitch/tone chain and getSpeechPolicy measurement/prefetch decision; no character splitting. Check generation before/after every await; end once. |
| B07 | src/components/NatallyConfigModal.tsx:40 | Existing props/handlers/state untouched; engine literals/label, truthful asset disclosure and status binding only. Existing voice choice saves through B03. No new UI. |
| B08 | src/components/VoiceDownloadStatus.tsx:1 | Import status from M03 and types from M01; component bodies unchanged. Startup belongs to B01, never a component mount. |
| B09 | src/components/onboarding/FirstLight.tsx:51 | Remove only old preload import/effect. Intake and all other effects unchanged. |
| B10 | src/services/voiceMeasurements.ts:1/62/81 | VOICE_REVISION pinned to §6; record file allowlist equals exact model/reference paths; export runtime label lists L02+L03 versions. Existing schema/state/survey/aggregation unchanged. |
| B11 | tests/voice-browser.html existing script | Existing status import to M03 only. Preserve inherited page; do not extend or execute it. |
| B12 | package.json / lockfile / .env.example / ignored .env | Exact versions/values §5; no new scripts, plugins, services or build paths. |
| A01 | public/voices/chatterbox/ | Exact asset blobs §6, including attribution. Restore only in approved implementation; no regeneration/recording pipeline. |
| L01–L08 | Dependencies / APIs §5 | Closed imports and method surface; no additional package, class or native bridge. |

### Module-variable and constant entity table

| Exact scoped identifier | Initial value / type | Sole purpose and mutation owner |
|---|---|---|
| M02.CHATTERBOX_MODEL | readonly string in §6 | F15/F16 pinned model origin and tokenizer identity. |
| M02.CHATTERBOX_REVISION | readonly string in §6 | Cache/URL/measurement revision identity. |
| M02.CHATTERBOX_FILES | readonly model-file map in §6 | F15 byte/hash contract; no dynamic model discovery. |
| M02.GRAPH_PATHS | readonly GraphRole path map in §6 | F16 initialization and F18 session lookup. |
| M02.VOICE_REFERENCES | readonly VoiceId ReferenceSpec map in §6 | F17 validated selected reference; F20 input validation. |
| M02.LIMITS | readonly numeric members in PUML | Only declared resource/context/cache/timeout limits. |
| M02.SAMPLING | readonly numeric members in PUML | Only declared speech-token sampling settings. |
| M03.status | VoiceStatus idle | F01 retains latest visible progress; F02 supplies it to late subscribers. |
| M03.listeners | empty Set | F02 subscribes/unsubscribes; F01 iterates observers. |
| M03.worker | Worker or null; initially null | F04 creates, F03 terminates; F05/F06 reject stale-worker events. |
| M03.nextId | number 0 | F04 increments for unique requests; never reset on worker replacement. |
| M03.pending | empty Map<number,PendingRequest> | F04 owns insertion, F05 resolution/removal, F03 rejection/clear. |
| M03.preloads | empty Map<VoiceId,Promise<void>> | F08 coalesces by voice for current worker; F03 clears; F08 rejection deletes failed key. |
| M03.selectedVoice | VoiceId F4 | F08 records latest requested voice; F11 uses it for immediate restart preparation. |
| M03.forceWasm | boolean false | F05 sets true only after real GPU runtime failure; remains true for this tab. |
| M03.lastAcknowledgedAt | number 0 | F05 advances only on new measured confirmedAt; controls inactivity refresh. |
| M04.engine | Promise<Engine> or null; initially null | F16 coalesces sessions/tokenizer and clears failed initializer. |
| M04.queue | Promise.resolve() | F21 appends one F20 operation at a time; no parallel graph requests. |
| M04.current | VoiceStatus idle | F12 merges/posts latest worker state. |
| M04.requestContext | exact PUML fields; zero/empty/preload initially | F20 initializes per request; F13 reads ID/revision/elapsed workload context. |
| M04.graphs | empty Map<string,VoiceGraphProgress> | F20 clears per request; F14 tracks each measured graph operation. |
| M04.files | empty Map<string,VoiceFileProgress> | F15 updates actual per-file loading progress/source. |
| M04.references | empty Map<VoiceId,TensorMap> | F17 retains four conditioning tensors per selected voice until worker ends. |
| M04.clips | empty Map<string,Float32Array> | F20 bounded PCM reuse by exact voice/text, insertion-order eviction. |
| M04.clipBytes | number 0 | F20 maintains exact retained Float32Array byte total during insertion/eviction. |
| M04.runtimeFailure | boolean false | F20 resets per request; F14 sets only for session/run exceptions. |

## 4. Algorithm contracts and binding semantics

| Owner | Closed operation |
|---|---|
| F15 URL/cache | https://huggingface.co/ + CHATTERBOX_MODEL + /resolve/ + CHATTERBOX_REVISION + / + file. Cache name natally-chatterbox- + revision. bytes/chunks/loaded are actual reads; cache hits are local loading, not downloads. No fabricated percent or progress heartbeats. |
| F16 runtime | ort.env.wasm.numThreads=1. backend=webgpu only when adapter.features.has('shader-f16'); otherwise wasm. External data path is exact graph basename + _data. L02 env.useBrowserCache=true; env.cacheKey matches cache name; env.remotePathTemplate pins the revision. AutoTokenizer.from_pretrained receives same immutable revision. No generic pipeline(). |
| F19 tokens | Tokenize without truncation or padding, including model special tokens. First embedding is reference audio_features followed by text embeddings. Next steps embed generated speech token. All input IDs/mask/positions are int64. LM embedding width 768, KV: 12 layers × key/value, 12 heads × 64. Initial KV [1,12,0,64] float16. |
| F19 iteration | Up to 4096 generated speech tokens with context below 8196. Update mask/position IDs, run embeddings and LM, select final-position token with F22, replace KV by graph input/output order, dispose old KV and temporary feeds. 6562 is EOS. Exhausted limit without EOS throws before decoder; no partial-success PCM. |
| F19 decoder | Exclude start/stop from generated speech; prepend reference audio_tokens; append three 4299 silence tokens. Decoder feeds: speech_tokens, speaker_embeddings, speaker_features. Convert output to mono Float32Array and require finite nonempty samples. Reference tensors are not temporary. |
| F22 sampling | Vocabulary 6563; repetition penalty 1.2 once per previously emitted ID (positive divide, negative multiply); temperature 0.8; stable descending top 1000 with numeric ID tie-break; subtract maximum before exp; retain smallest prefix reaching 0.95 probability; Math.random over retained probability mass. Reject no finite support. Stop token sampled normally. |
| F20 clips | Key JSON.stringify([data.voice,data.text]); insertion-order eviction until ≤16000000 bytes; do not retain larger clip. Response transfers a copy, never the cache-owned array. Finite data.speed is clamped [0.8,1.4], otherwise speed=1; sampleRate=24000*speed. This changes pitch as well as duration; existing playback pitch remains separate. No new DSP. |
| F20 failures | Reject data.voice absent from VOICE_REFERENCES as inputRejected before graph work. Asset/input rejection does not disable healthy GPU. Actual session/run GPU failure sets forceWasm for subsequent retry in this tab. Caller sees explicit failure; no hosted or system-voice substitute. |
| F26 units | Empty input rejects. Whole turn first. Long prose uses complete sentence boundaries inside paragraph units; nonprose uses whole item/heading units. Pack consecutive complete units under 768 tokenizer tokens. Whitespace only may be trimmed at slice edges. Never split clauses, spaces or character counts. Oversize single whole unit rejects before starting the reading. |
| B06 locals | prepared/clean are complete cleaned input; requestGeneration guards stale work; units/unitIndex/unit/nextUnit carry planned text and offsets. Preserve capabilities/realTimeFactor/policy/observed/prefetch/pendingAudio/result and existing getSpeechPolicy decisions. audio/durationMs drive existing PCM source; source/filter nodes are disconnected by finish; emitWord maps unit.start + word.index through prepared.sourceOffsets; end resolves utterance once. end/synthesize/emitWord/finish are the only nested named functions. |
| B06 chunk replacement | Replace character-based chunk/nextChunk/offset with units/unitIndex/unit/nextUnit. synthesize(unit) calls F10(unit.text), captures audio/error in declared result callbacks and prevents an unhandled lookahead rejection. Preserve the template's conservative real-time-factor update and serial/one-ahead scheduling; chunkChars no longer slices input. No independent playback-policy redesign. |
| F11 lifecycle | Pending plan/speak is obsolete work: terminate worker, reject waiters, immediately restart selected-voice preload from saved cache. Cache reload/session creation is real preparation, not instant readiness. Stop during existing PCM playback keeps already-loaded worker. |
| Callback bodies | F02 deletes listener; F04 registers resolve/reject and posts payload; F08 verifies response or clears preload and rethrows; F11/B01/B03 rejection observers leave visible status and prevent unhandled rejection; F16 initializer implements its row; F18 action calls selected session.run; F20 heartbeat posts timestamp only; F20 token counter returns tokenizer input_ids token count; F21 continuation calls F20. No callback-local declarations beyond PUML. |

## 5. Import, library, method and configuration table

| ID | Exact library/import/version | Closed symbol/method contract |
|---|---|---|
| L01 | react 19.3.0; react-dom 19.3.0; react-dom/client | Existing useState/useEffect and createRoot/render; no new hooks/components. |
| L02 | @huggingface/transformers 4.3.1 | AutoTokenizer.from_pretrained, tokenizer callable/input_ids, env.useBrowserCache/cacheKey/remotePathTemplate; tokenizer only. |
| L03 | onnxruntime-web 1.31.0-dev.20260914-8d85527a0, import namespace ort from onnxruntime-web/webgpu | Tensor constructor/data/dims/type/size/getData/dispose; InferenceSession.create and session.run/release/inputMetadata/inputNames; env.wasm.numThreads. Direct dependency pin equals existing transitive lock version. |
| L04 | Vite 8.3.4; TypeScript 7.0.2; existing React/Tailwind/onnxProgressPlugin | Existing compilation/worker bundling only; no new plugins/scripts or output override. |
| L05 | Browser-owned APIs; no package | Worker constructor/onmessage/onerror/onmessageerror/postMessage/terminate; MessageEvent.data/currentTarget; self.onmessage/postMessage with transfer; URL constructor; import.meta.url/env.BASE_URL; fetch; Response.ok/body/arrayBuffer/clone; reader.read; caches.open; Cache.match/put/delete; crypto.subtle.digest SHA-256; navigator.gpu.requestAdapter; adapter.features.has. |
| L06 | ECMAScript/browser built-ins; no package | Promise constructor/resolve/then/catch/finally/allSettled; Map/Set constructor/get/set/add/has/delete/clear/values/keys/size; Array iteration/push/slice/sort/reduce/from/fill/every; Object keys/values/entries; JSON stringify; Math random/exp/min/max/pow; Number isFinite/isInteger; BigInt; Date.now/performance.now; timers and cancellation; typed arrays constructor/set/slice; DataView getUint16/getUint32/getInt16; strings slice/trim/matchAll/includes/padStart; numeric toString; RegExp exec/test; Intl.Segmenter constructor/segment; Error constructor. Only purposes §4. |
| L07 | Existing Web Audio/storage | Existing AudioContext.resume/createBuffer/createBufferSource/createBiquadFilter/createGain; buffer.getChannelData; source.connect/start/stop/disconnect/onended/playbackRate; filter/gain connect/disconnect and existing gain/frequency/type; localStorage getItem/setItem. No microphone/DSP additions. |
| L08 | Existing internal APIs, unchanged | App; NatallyChatbot/NatallySprite/ReadingsModal callers; chart callbacks; loadVoiceSettings/saveVoiceSettings; VoiceMeasurement and voiceMeasurements.record. No inference/auth/chart/account/billing API changes. |
| Imports | Closed aliases | ort; AutoTokenizer; env; createRoot; model constants by exact names; types T01–T18 including T13S/T13M/T13T; functions F01–F26 by exact names. Existing imports retained except explicit status replacements and removed onboarding preload import. |
| APP_URL / FRONTEND_ORIGIN | https://natally-chatterbox.surge.sh | Later implementation configuration only; no .env modification at architecture stage. |
| VITE_CHAT_API_URL | https://natally-chatterbox--natally-hosted-chat.netlify.app/.netlify/functions/chat | Existing previously authorized branch endpoint; no provider provisioning/migration. |
| Voice environment defaults | VITE_NATALLY_VOICE=F4; VITE_NATALLY_VOICE_PITCH=1.15; VITE_NATALLY_VOICE_RATE=0.90 | Preserve template getVoicePreset validation and preset-version behavior. No active character-limit setting in new speech path. |

## 6. Immutable model, tensors, constants and assets

| Constant / graph | Exact value or tensor interface |
|---|---|
| CHATTERBOX_MODEL | owensong/chatterbox-nano-ONNX |
| CHATTERBOX_REVISION | 4a66d7dab72a9e98f24b515d49a1d7a81632df2e |
| LIMITS | textTokens=768; speechTokens=4096; contextTokens=8196; clipBytes=16000000; referenceSamples=240000; sampleRate=24000; inactivityMs=300000 |
| SAMPLING | temperature=0.8; topK=1000; topP=0.95; repetitionPenalty=1.2; startToken=6561; stopToken=6562; silenceToken=4299 |
| GRAPH_PATHS.embed_tokens | onnx/embed_tokens_fp16.onnx; int64 input_ids → float32 inputs_embeds, width 768 |
| GRAPH_PATHS.speech_encoder | onnx/speech_encoder_q4f16.onnx; float32 audio_values [1,samples] → audio_features(float32), audio_tokens(int64), speaker_embeddings(float32), speaker_features(float32) |
| GRAPH_PATHS.language_model | onnx/language_model_q4f16.onnx; float32 inputs_embeds, int64 attention_mask/position_ids, 24 float16 past_key_values → float32 logits + 24 float16 present caches |
| GRAPH_PATHS.conditional_decoder | onnx/conditional_decoder_q4.onnx; int64 speech_tokens, float32 speaker_embeddings [1,192], float32 speaker_features [1,frames,80] → float32 waveform at 24000 Hz |
| External tensor binding | Each graph uses its exact basename + _data as externalData.path and corresponding verified Uint8Array as data; no implicit browser filesystem lookup |
| Reference decision | One-to-one immutable synthetic baseline-preset references below; restore historical blobs, do not generate/record new voices. Their previous existence is provenance, not prior authorization; this exact choice is submitted for sign-off. |
| Readiness | All four sessions + tokenizer + selected reference encoding; never declare ready after only files or sessions |
| Output | Non-streaming whole-unit decoder; no phone/quality/performance claim from model identity or desktop evidence |

| CHATTERBOX_FILES key | Bytes | SHA-256 |
|---|---:|---|
| tokenizer_config.json | 414 | 0d637373c70a54c3c7202c0c12b40ff4f346c329960283f5a88031717d73c66f |
| generation_config.json | 55 | 91d2e5ff0fd172d5e8ac4818ef8bcd9b9ee4f7e562831edc8cc3b3702e64f923 |
| config.json | 1206 | 31de0e848899a63d26fdaacc4287bd14963d8f028a8af8583767b3f678f3c576 |
| preprocessor_config.json | 130 | 1c320b2eea5f45678d17d891d51c38467775091dbf26a074635ba5e98ede5950 |
| tokenizer.json | 3562272 | 3f04e34bea22f9144d1a19151154095bc9ce0430bf421304f5797e716288a906 |
| onnx/embed_tokens_fp16.onnx | 1520 | 019d257243774091d78c2ad91c2c0f61e4e442740cb7b3b00b5a89109417b18d |
| onnx/embed_tokens_fp16.onnx_data | 87304704 | bcd7b35ae4f206932e2491cb60b42ebb80f6d8facfdb53ba7d7449ad00a3237b |
| onnx/speech_encoder_q4f16.onnx | 1219352 | 29e249f59eaf95015527588b955e5286c7ee4524e7bb54a2f8d589b838e8aed2 |
| onnx/speech_encoder_q4f16.onnx_data | 176273652 | 55d89bd87fd36be48b2e831c99c2e309d432169119049066f9f22fcfe517798d |
| onnx/language_model_q4f16.onnx | 522078 | 8fe9620856d86b8a0235041d7fd2a8a47292da50828044bab5740b246e66e65b |
| onnx/language_model_q4f16.onnx_data | 55911658 | 8f2fdc616373c9ccaebbf2db3210dc80c860922a672898bca111eb75f6d3abd2 |
| onnx/conditional_decoder_q4.onnx | 2179022 | 745faa9c2e2494a81e47f2a72601ac248639fd417ae53d999c5068bc441d1f97 |
| onnx/conditional_decoder_q4.onnx_data | 246397384 | b5c5317e0b79a1a19dd3d5e2b2091ea06b15716716ab801a54eaeb906c6971ec |

| VOICE_REFERENCES key / path under public/ | Bytes | Exact Git blob in repository history at 2adb96d |
|---|---:|---|
| F1 / voices/chatterbox/F1.wav | 826746 | 00c070e9f5a32517553855f6ee5c637080bc949b |
| F2 / voices/chatterbox/F2.wav | 742856 | b3b22f19f7c371da815dd1017b122e9f41334691 |
| F3 / voices/chatterbox/F3.wav | 827740 | 9318529ee38e611dab4da10dbc583d1b4bce8191 |
| F4 / voices/chatterbox/F4.wav | 738572 | f0511673a2b3441f1ddd8baaf2afaf7b693dab9e |
| F5 / voices/chatterbox/F5.wav | 866026 | c3c1d44da99032d8b940abd062fdff880473a34c |
| M1 / voices/chatterbox/M1.wav | 860364 | 2423bd687c6fd0ad12adda77955028af64b6fb55 |
| M2 / voices/chatterbox/M2.wav | 790152 | 96be260e1eb51f003238d503bd0da51d42a22ee1 |
| NOTICE.md | 808 | 49bc84070f059e4cb9ec89f33ee414a1cc923e2f |

## 7. Closed product boundary and sign-off

| Surface | Fixed decision |
|---|---|
| Marketplace | Existing purpose, screens, billing prototype and infrastructure remain template behavior. No payment integration. |
| Speech input | Completed replies; no streaming-token transport. Pauses acceptable; lost phrases fail Robin's evaluation. |
| Startup | Immediate application entry, no auth/onboarding/settings dependency, no idle delay or Save-Data skip. Shared initialization also owns selected reference preparation. |
| Old source | Inactive Supertonic modules retained unchanged; no engine toggle or unlisted cleanup. |
| Existing preview/measurement | Binding changes B10/B11 only; no new page, harness, benchmark, survey, submission service or evaluation protocol. |
| Verification | No unit/automated browser tests. Robin evaluates normal device-browser app. No claim of audible completeness or low-resource-phone suitability before that. |
| Build | Later released task only: normal build directly into root dist/. Historical build subfolders only if semantically versioned; no temporary/nested active deployment output. |
| Approval | Robin signs off this entire closed blueprint; only then derive CHECKLIST. Any missing declaration means architecture amendment, not coder discretion. |
| Current action | DOCS/ARCHITECTURE.md only. No CHECKLIST/source/assets/package/environment changes, build or deployment. Existing Surge build remains prior deployment. |
| Sources | [Pinned model conversion](https://huggingface.co/owensong/chatterbox-nano-ONNX/blob/4a66d7dab72a9e98f24b515d49a1d7a81632df2e/README.md); [ONNX Runtime browser external-data contract](https://onnxruntime.ai/docs/tutorials/web/large-models.html#external-data) |
