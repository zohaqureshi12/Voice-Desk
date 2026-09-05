import 'dotenv/config';
import { fileURLToPath } from 'url';
import { cli, defineAgent, WorkerOptions, voice } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as silero from '@livekit/agents-plugin-silero';
import { processTranscript } from './logic.js';

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

        const knownEvents = [
            'user_state_changed',
            'agent_state_changed',
            'user_input_transcribed',
            'conversation_item_added',
            'close',
        ];

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
            console.log('📝 Transcript:', ev.transcript, '| final:', ev.isFinal);

            if (ev.isFinal) {
                processTranscript(ev.transcript, currentTurnId);
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