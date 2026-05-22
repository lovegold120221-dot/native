import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=([^\n]+)/);
const apiKey = match ? match[1] : '';

const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const session = await ai.live.connect({
      model: 'gemini-2.0-flash-exp', // Or whatever
      config: {
        tools: [{ googleSearch: {} }],
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
             prebuiltVoiceConfig: {
                 voiceName: 'Puck'
             }
          }
        }
      }
    });
    console.log('Connected 2.0!');
    session.close();
  } catch (err) {
    console.error('Error connecting:', err);
  }
}
test();
