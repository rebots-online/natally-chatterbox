import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { VoiceDownloadStatus } from './components/VoiceDownloadStatus';
import './index.css';
import { initChatterbox } from './services/chatterboxTts';
import { loadVoiceSettings } from './services/voiceService';
import type { VoiceId } from './services/chatterboxTypes';
import { backchannelPool } from './services/speechBackchannels';

const startupSettings = loadVoiceSettings();
void initChatterbox(startupSettings.aiVoiceName as VoiceId).catch(() => {});
void backchannelPool.configure(startupSettings.aiVoiceName as VoiceId);
createRoot(document.getElementById('root')!).render(<><App />{(import.meta.env.DEV || new URLSearchParams(location.search).has('voiceDebug')) && <VoiceDownloadStatus />}</>);
