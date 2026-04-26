import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import {
  base64ToUint8Array,
  extractPcmFromWav,
  pcmChunksToWavBase64,
  uint8ArrayToBase64,
} from '../utils/wavUtils';

export type AgentStatus = 'idle' | 'connecting' | 'ready' | 'listening' | 'speaking' | 'error';

export type ConvAICallbacks = {
  onStatusChange: (s: AgentStatus) => void;
  onAgentText: (text: string) => void;
  onUserText: (text: string) => void;
  onError: (msg: string) => void;
};

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

// iOS: linear PCM WAV (strips header before sending to ElevenLabs)
// Android: WAVE output with default encoder — works on Android 7+ for PCM
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.wav',
    outputFormat: 6, // MediaRecorder.OutputFormat.WAVE
    audioEncoder: 0, // MediaRecorder.AudioEncoder.DEFAULT (PCM with WAVE container)
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: '.wav',
    audioQuality: 0, // AVAudioQuality.min
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

export class ElevenLabsConvAI {
  private ws: WebSocket | null = null;
  private conversationId: string | null = null;
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private pcmChunks: Uint8Array[] = [];
  private cb: ConvAICallbacks;

  constructor(cb: ConvAICallbacks) {
    this.cb = cb;
  }

  async connect(params: {
    diseaseLabel: string;
    confidence: string;
    diseaseId: string;
    symptomDescription?: string;
    pastScanSummary?: string;
    initialAudioPcmBase64?: string;
  }) {
    const { diseaseLabel, confidence, diseaseId, symptomDescription, pastScanSummary, initialAudioPcmBase64 } = params;

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      this.cb.onError('Microphone permission is required. Please enable it in Settings.');
      this.cb.onStatusChange('error');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
    });
    this.cb.onStatusChange('connecting');

    let agentId: string;
    try {
      const cfg = await fetch(`${BACKEND_URL}/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(r => r.json()) as { agentId: string };
      agentId = cfg.agentId;
    } catch {
      this.cb.onError('Could not reach backend. Check EXPO_PUBLIC_BACKEND_URL.');
      this.cb.onStatusChange('error');
      return;
    }

    if (!agentId) {
      this.cb.onError('Backend did not return an agent ID.');
      this.cb.onStatusChange('error');
      return;
    }

    const url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.ws!.send(
        JSON.stringify({
          type: 'conversation_initiation_client_data',
          dynamic_variables: {
            disease_name: diseaseLabel,
            confidence,
            disease_id: diseaseId,
            symptom_description: symptomDescription ?? '',
            past_scan_summary: pastScanSummary ?? '',
          },
        }),
      );
      this.cb.onStatusChange('ready');
      // If the caller recorded audio before connecting, send it as the first user message
      if (initialAudioPcmBase64) {
        this.ws!.send(JSON.stringify({ user_audio_chunk: initialAudioPcmBase64 }));
      }
    };

    this.ws.onmessage = (e) => void this.handleMessage(e.data as string);

    this.ws.onerror = () => {
      this.cb.onError('Connection failed. Verify your agent ID and internet connection.');
      this.cb.onStatusChange('error');
    };

    this.ws.onclose = () => this.cb.onStatusChange('idle');
  }

  private async handleMessage(raw: string) {
    const msg = JSON.parse(raw) as Record<string, unknown>;

    switch (msg.type) {
      case 'ping': {
        const { event_id } = msg.ping_event as { event_id: number };
        this.ws?.send(JSON.stringify({ type: 'pong', event_id }));
        break;
      }
      case 'audio': {
        const { audio_base_64 } = msg.audio_event as { audio_base_64: string };
        this.pcmChunks.push(base64ToUint8Array(audio_base_64));
        this.cb.onStatusChange('speaking');
        break;
      }
      case 'agent_response': {
        const { agent_response } = msg.agent_response_event as { agent_response: string };
        this.cb.onAgentText(agent_response);
        await this.playBufferedAudio();
        break;
      }
      case 'user_transcript': {
        const { user_transcript } = msg.user_transcription_event as { user_transcript: string };
        this.cb.onUserText(user_transcript);
        break;
      }
      case 'conversation_initiation_metadata': {
        const meta = msg.conversation_initiation_metadata_event as { conversation_id: string };
        this.conversationId = meta.conversation_id;
        break;
      }
      case 'interruption':
        this.pcmChunks = [];
        await this.sound?.stopAsync().catch(() => {});
        this.cb.onStatusChange('ready');
        break;
    }
  }

  private async playBufferedAudio() {
    if (this.pcmChunks.length === 0) {
      this.cb.onStatusChange('ready');
      return;
    }

    const wavBase64 = pcmChunksToWavBase64(this.pcmChunks);
    this.pcmChunks = [];

    const tmpPath = `${FileSystem.cacheDirectory}agent_${Date.now()}.wav`;
    await FileSystem.writeAsStringAsync(tmpPath, wavBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Switch to speaker mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync({ uri: tmpPath });
    this.sound = sound;
    await sound.playAsync();

    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) resolve();
      });
    });

    await sound.unloadAsync();
    this.sound = null;
    await FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});

    // Switch back to recording mode for next user input
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
    });

    this.cb.onStatusChange('ready');
  }

  async startRecording() {
    if (this.recording) return;
    this.cb.onStatusChange('listening');
    try {
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS);
      await rec.startAsync();
      this.recording = rec;
    } catch (e) {
      this.cb.onError('Could not start recording. Your device may not support this format.');
      this.cb.onStatusChange('ready');
    }
  }

  async stopAndSend() {
    if (!this.recording || !this.ws) return;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      if (!uri) return;

      const wavBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const wavBytes = base64ToUint8Array(wavBase64);
      const pcmBytes = extractPcmFromWav(wavBytes);
      const pcmBase64 = uint8ArrayToBase64(pcmBytes);

      this.ws.send(JSON.stringify({ user_audio_chunk: pcmBase64 }));

      // Send 500ms of silence so the server-side VAD detects end of speech
      const silenceSamples = 16000 * 0.5; // 500ms at 16kHz
      const silence = new Uint8Array(silenceSamples * 2); // 16-bit = 2 bytes/sample
      this.ws.send(JSON.stringify({ user_audio_chunk: uint8ArrayToBase64(silence) }));
    } catch (e) {
      this.cb.onError('Failed to send audio. Please try again.');
    } finally {
      this.cb.onStatusChange('ready');
    }
  }

  async disconnect() {
    await this.recording?.stopAndUnloadAsync().catch(() => {});
    this.recording = null;
    await this.sound?.stopAsync().catch(() => {});
    await this.sound?.unloadAsync().catch(() => {});
    this.sound = null;
    this.pcmChunks = [];

    // Reset audio mode so subsequent screens get clean speaker output
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});

    if (this.conversationId) {
      // Fire-and-forget — backend waits 10s then fetches summary; don't block the UI
      void fetch(`${BACKEND_URL}/end-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: this.conversationId }),
      }).catch(() => {});
      this.conversationId = null;
    }

    this.ws?.close();
    this.ws = null;
  }
}
