import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { VoiceDownloadStatus } from './components/VoiceDownloadStatus';
import './index.css';

createRoot(document.getElementById('root')!).render(<><App /><VoiceDownloadStatus /></>);
