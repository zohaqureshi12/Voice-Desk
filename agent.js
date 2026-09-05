import 'dotenv/config';
import { fileURLToPath } from 'url';
import { cli, defineAgent, WorkerOptions, voice } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as silero from '@livekit/agents-plugin-silero';

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

        // VAD-driven state changes (speaking/listening) — this is where currentTurnId will hook in later
        session.on('user_state_changed', (ev) => {
            console.log(`🔄 User state changed: ${ev.newState}`);
            if (ev.newState === 'speaking') {
                console.log('🎙️ User started speaking');
            } else if (ev.newState === 'listening') {
                console.log('🛑 User stopped speaking');
            }
        });

        // Live transcripts from Deepgram
        session.on('user_input_transcribed', (ev) => {
            console.log('📝 Transcript:', ev.transcript, '| final:', ev.isFinal);
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