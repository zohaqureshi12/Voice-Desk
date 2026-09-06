import 'dotenv/config';
import { fileURLToPath } from 'url';
import { cli, defineAgent, WorkerOptions, voice } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as silero from '@livekit/agents-plugin-silero';
import { processTranscript, activeResponseController } from './logic.js';

// How long to wait after the last final STT fragment before treating the
// user's turn as complete. Tune this during testing — too short and you'll
// cut off natural pauses; too long and the agent feels sluggish to respond.
const SILENCE_FLUSH_MS = 900;

export default defineAgent({
    entry: async (ctx) => {
        await ctx.connect();
        console.log('✅ Connected to LiveKit room:', ctx.room.name);

        const vad = await silero.VAD.load();

        const session = new voice.AgentSession({
            vad,
            stt: new deepgram.STT({
                apiKey: process.env.DEEPGRAM_API_KEY,
            }),
        });

        let currentTurnId = 0;
        let transcriptBuffer = '';
        let flushTimer = null;

        function scheduleFlush() {
            if (flushTimer) clearTimeout(flushTimer);
            flushTimer = setTimeout(() => {
                const textToSend = transcriptBuffer.trim();
                transcriptBuffer = '';
                if (textToSend) {
                    console.log(`✅ [Turn ${currentTurnId}] Complete user turn (silence-flush): "${textToSend}"`);
                    processTranscript(textToSend, currentTurnId, session);
                }
            }, SILENCE_FLUSH_MS);
        }

        const knownEvents = ['user_state_changed', 'agent_state_changed', 'close'];
        knownEvents.forEach((eventName) => {
            session.on(eventName, (ev) => {
                console.log(`🔔 EVENT [${eventName}]:`, JSON.stringify(ev));
            });
        });

        session.on('user_state_changed', (ev) => {
            if (ev.newState === 'speaking') {
                currentTurnId++;
                console.log(`🎙️ User started speaking — currentTurnId: ${currentTurnId}`);
            } else if (ev.newState === 'listening') {
                console.log('🛑 User stopped speaking');
            }
        });

        session.on('user_input_transcribed', (ev) => {
            if (ev.isFinal && ev.transcript.trim()) {
                transcriptBuffer = (transcriptBuffer + ' ' + ev.transcript).trim();
                console.log(`📝 Buffered final segment: "${ev.transcript}" → buffer: "${transcriptBuffer}"`);
                scheduleFlush();
            }
        });

        await session.start({
            room: ctx.room,
            agent: voice.Agent.create({
                instructions: 'You are a test agent for Voice-Desk. Do not speak yet — just listen and transcribe.',
            }),
        });
    },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));