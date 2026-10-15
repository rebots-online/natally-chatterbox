import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { VoiceDownloadStatus } from './components/VoiceDownloadStatus';
import './index.css';
import { initChatterbox } from './services/chatterboxTts';
import { loadVoiceSettings } from './services/voiceService';
import type { VoiceId } from './services/chatterboxTypes';

void initChatterbox(loadVoiceSettings().aiVoiceName as VoiceId).catch(() => {});
createRoot(document.getElementById('root')!).render(<><App /><VoiceDownloadStatus /></>);
