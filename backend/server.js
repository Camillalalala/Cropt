import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import { ElevenLabsClient } from 'elevenlabs';

const app = express();
app.use(cors());
app.use(express.json());

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

app.post('/start-session', async (req, res) => {
  res.json({ agentId: process.env.ELEVENLABS_AGENT_ID });
});

app.post('/tts', async (req, res) => {
  const { text } = req.body;
  try {
    const audioStream = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    });
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    res.json({ audio: buffer.toString('base64') });
  } catch (e) {
    console.error('TTS error:', e);
    res.status(500).json({ error: 'TTS failed' });
  }
});

app.post('/end-session', async (req, res) => {
  const { conversationId } = req.body;
  try {
    await new Promise(resolve => setTimeout(resolve, 10000));
    const result = await elevenlabs.conversationalAi.getConversation(conversationId);
    console.log('Summary:', result.analysis?.transcript_summary);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not fetch summary' });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Backend running on port 3000'));
